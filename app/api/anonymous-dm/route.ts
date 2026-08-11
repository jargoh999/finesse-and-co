import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { PrivateUser } from '@/lib/models';
import mongoose from 'mongoose';
import { memoryCache } from '@/lib/cache';

const AnonymousDMSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  // IMPORTANT: Add fields for system messages (Q&A notifications)
  isSystemMessage: { type: Boolean, default: false },
  systemData: { type: Object }, // For Q&A links, etc.
  // Media attachment fields
  mediaUrl: { type: String },
  mediaType: { type: String }, // 'image' | 'video' | 'audio' | 'file'
  fileName: { type: String },
});

// Indexes to speed up queries and prevent full collection scans on polling
AnonymousDMSchema.index({ receiverId: 1, createdAt: -1 });
AnonymousDMSchema.index({ senderId: 1, createdAt: -1 });

const AnonymousDM = mongoose.models.AnonymousDM || mongoose.model('AnonymousDM', AnonymousDMSchema);

// GET - Get all anonymous DMs for current user (both sent and received)
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const since = searchParams.get('since');

    // Polling optimization: Check memory cache before hitting database
    const cacheKey = `lastAnonMsgAt:${user.id}`;
    if (since) {
      const cachedLastMsgAt = memoryCache.get(cacheKey);
      if (cachedLastMsgAt && new Date(since) >= new Date(cachedLastMsgAt)) {
        return NextResponse.json({ conversations: [] });
      }
    }

    await dbConnect();

    // Build query - get DMs where user is either sender or receiver
    const query: any = {
      $or: [
        { receiverId: user.id },
        { senderId: user.id }
      ],
      isBlocked: false
    };

    if (since) {
      query.createdAt = { $gt: new Date(since) };
    }

    // Get all DMs where user is involved
    const dms = await AnonymousDM.find(query).sort({ createdAt: -1 }).lean();

    // Update cache with latest message timestamp
    if (dms.length > 0) {
      const latestMsgAt = dms[0].createdAt;
      memoryCache.set(cacheKey, latestMsgAt.toISOString(), 60000); // cache for 60s
    } else if (since) {
      // If we queried since a timestamp and found nothing, and there's no cache entry,
      // we can set the cache entry to 'since' to avoid subsequent DB queries.
      if (!memoryCache.get(cacheKey)) {
        memoryCache.set(cacheKey, since, 60000);
      }
    }

    // Group by the other participant (not the current user)
    const conversationsMap = new Map();

    dms.forEach((dm: any) => {
      const otherUserId = dm.senderId === user.id ? dm.receiverId : dm.senderId;

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          senderId: otherUserId,
          messages: [],
          isSender: dm.senderId === user.id
        });
      }

      conversationsMap.get(otherUserId).messages.push(dm);
    });

    // Get all other users
    const otherUserIds = Array.from(conversationsMap.keys());
    if (otherUserIds.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    const otherUsers = await PrivateUser.find({ _id: { $in: otherUserIds } }, 'name email').lean();

    // Build conversations array
    const conversations = Array.from(conversationsMap.values()).map(conv => {
      const otherUser = otherUsers.find((u: any) => u._id.toString() === conv.senderId);
      const messages = conv.messages.reverse(); // Show in chronological order
      const lastMessage = messages[messages.length - 1];
      const unreadCount = messages.filter((m: any) => !m.isRead && m.receiverId === user.id).length;

      return {
        senderId: conv.senderId,
        sender: otherUser ? {
          _id: otherUser._id.toString(),
          name: otherUser.name,
          email: otherUser.email
        } : null,
        // IMPORTANT: Use messages with systemData for Q&A link button rendering
        messages: messages.map((m: any) => ({
          ...m,
          _id: m._id.toString(),
          isSystemMessage: m.isSystemMessage || false,
          systemData: m.systemData || null
        })),
        lastMessage,
        unreadCount,
        isAnonymous: true,
        isSender: conv.isSender
      };
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching anonymous DMs:', error);
    return NextResponse.json({ error: 'Failed to fetch DMs' }, { status: 500 });
  }
}

// POST - Send an anonymous DM
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiverId, content, mediaUrl, mediaType, fileName } = await req.json();

    if (!receiverId || (!content && !mediaUrl)) {
      return NextResponse.json({ error: 'Receiver ID and content or media are required' }, { status: 400 });
    }
    if (content && content.trim().length === 0 && !mediaUrl) {
      return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 });
    }

    await dbConnect();

    // Check if receiver has blocked this sender
    const existingDM = await AnonymousDM.findOne({
      senderId: user.id,
      receiverId,
      isBlocked: true
    }).lean();

    if (existingDM) {
      return NextResponse.json({ error: 'You have been blocked by this user' }, { status: 403 });
    }

    // Create the DM
    const newDM = await AnonymousDM.create({
      senderId: user.id,
      receiverId,
      content: content?.trim() || mediaUrl || '',
      mediaUrl: mediaUrl || undefined,
      mediaType: mediaType || undefined,
      fileName: fileName || undefined,
    });

    // Update in-memory timestamps for both user and receiver to let pollers know immediately
    const nowStr = new Date().toISOString();
    memoryCache.set(`lastAnonMsgAt:${user.id}`, nowStr, 60000);
    memoryCache.set(`lastAnonMsgAt:${receiverId}`, nowStr, 60000);

    return NextResponse.json({ dm: newDM }, { status: 201 });
  } catch (error) {
    console.error('Error sending anonymous DM:', error);
    return NextResponse.json({ error: 'Failed to send DM' }, { status: 500 });
  }
}

// DELETE - Delete anonymous DMs by IDs (only sender can delete their own)
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageIds } = await req.json();
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ error: 'Message IDs array is required' }, { status: 400 });
    }

    await dbConnect();

    // Fetch messages before deleting (only sender's own messages)
    const toDelete = await AnonymousDM.find({
      _id: { $in: messageIds },
      senderId: user.id,
    }).lean() as any[];

    // Purge Cloudinary media
    if (toDelete.length > 0) {
      const { v2: cloudinary } = await import('cloudinary');
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });

      const cloudinaryDeletions: Promise<any>[] = [];
      for (const msg of toDelete) {
        const mediaUrl: string | undefined = msg.mediaUrl;
        if (mediaUrl) {
          try {
            const urlParts = mediaUrl.split('/');
            const uploadIndex = urlParts.indexOf('upload');
            if (uploadIndex !== -1) {
              const afterUpload = urlParts.slice(uploadIndex + 2).join('/');
              const publicId = afterUpload.replace(/\.[^/.]+$/, '');
              const resourceType = msg.mediaType === 'video' || msg.mediaType === 'audio' ? 'video' :
                msg.mediaType === 'image' ? 'image' : 'raw';
              cloudinaryDeletions.push(
                cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch((e: any) =>
                  console.error('Cloudinary delete error:', publicId, e.message)
                )
              );
            }
          } catch (e) {
            console.error('Failed to parse Cloudinary URL:', mediaUrl);
          }
        }
      }
      if (cloudinaryDeletions.length > 0) {
        await Promise.allSettled(cloudinaryDeletions);
      }
    }

    const result = await AnonymousDM.deleteMany({
      _id: { $in: messageIds },
      senderId: user.id,
    });

    return NextResponse.json({ success: true, deleted: result.deletedCount });
  } catch (error) {
    console.error('Error deleting anonymous DMs:', error);
    return NextResponse.json({ error: 'Failed to delete DMs' }, { status: 500 });
  }
}
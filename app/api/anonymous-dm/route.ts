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

    const { receiverId, content } = await req.json();

    if (!receiverId || !content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Receiver ID and content are required' }, { status: 400 });
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
      content: content.trim(),
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
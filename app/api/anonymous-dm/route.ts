import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { PrivateUser } from '@/lib/models';
import mongoose from 'mongoose';

const AnonymousDMSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
});

const AnonymousDM = mongoose.models.AnonymousDM || mongoose.model('AnonymousDM', AnonymousDMSchema);

// GET - Get all anonymous DMs for current user (both sent and received)
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const since = searchParams.get('since');
    
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
    const dms = await AnonymousDM.find(query).sort({ createdAt: -1 });
    
    // Group by the other participant (not the current user)
    const conversationsMap = new Map();
    
    dms.forEach(dm => {
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
    const otherUsers = await PrivateUser.find({ _id: { $in: otherUserIds } });
    
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
          email: otherUser.email,
          image: otherUser.image
        } : null,
        messages,
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
    });
    
    if (existingDM) {
      return NextResponse.json({ error: 'You have been blocked by this user' }, { status: 403 });
    }
    
    // Create the DM
    const newDM = await AnonymousDM.create({
      senderId: user.id,
      receiverId,
      content: content.trim(),
    });
    
    return NextResponse.json({ dm: newDM }, { status: 201 });
  } catch (error) {
    console.error('Error sending anonymous DM:', error);
    return NextResponse.json({ error: 'Failed to send DM' }, { status: 500 });
  }
}

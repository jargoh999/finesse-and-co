import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth-helper';
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

// POST - Block or unblock an anonymous sender
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { senderId, block } = await req.json();
    
    if (!senderId) {
      return NextResponse.json({ error: 'Sender ID is required' }, { status: 400 });
    }

    await dbConnect();
    
    // Update all DMs from this sender to this user
    await AnonymousDM.updateMany(
      { senderId, receiverId: user.id },
      { isBlocked: block }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating block status:', error);
    return NextResponse.json({ error: 'Failed to update block status' }, { status: 500 });
  }
}

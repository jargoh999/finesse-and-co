import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema({
  blockerId: { type: String, required: true },
  blockedUserId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Block = mongoose.models.Block || mongoose.model('Block', blockSchema);

// POST - Block or unblock a user
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { blockedUserId, block } = await request.json();

    if (!blockedUserId) {
      return NextResponse.json({ error: 'Blocked user ID is required' }, { status: 400 });
    }

    await dbConnect();

    if (block) {
      // Block the user
      await Block.findOneAndUpdate(
        { blockerId: user.id, blockedUserId },
        { blockerId: user.id, blockedUserId },
        { upsert: true, new: true }
      );
    } else {
      // Unblock the user
      await Block.deleteOne({
        blockerId: user.id,
        blockedUserId
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error toggling block:', error);
    return NextResponse.json({ error: 'Failed to toggle block' }, { status: 500 });
  }
}

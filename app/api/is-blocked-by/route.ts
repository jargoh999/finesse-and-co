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

// GET - Check if current user is blocked by another user
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const blockerId = searchParams.get('blockerId');

    if (!blockerId) {
      return NextResponse.json({ error: 'Blocker ID is required' }, { status: 400 });
    }

    await dbConnect();

    const block = await Block.findOne({
      blockerId: blockerId,
      blockedUserId: user.id
    });

    return NextResponse.json({ isBlockedBy: !!block });
  } catch (error) {
    console.error('Error checking if blocked by user:', error);
    return NextResponse.json({ error: 'Failed to check block status' }, { status: 500 });
  }
}

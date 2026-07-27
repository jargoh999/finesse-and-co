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

// GET - Check if user is blocked
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await dbConnect();

    const block = await Block.findOne({
      blockerId: user.id,
      blockedUserId: userId
    });

    return NextResponse.json({ isBlocked: !!block });
  } catch (error) {
    console.error('Error checking block status:', error);
    return NextResponse.json({ error: 'Failed to check block status' }, { status: 500 });
  }
}

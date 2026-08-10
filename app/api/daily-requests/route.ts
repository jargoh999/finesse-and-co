import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import mongoose from 'mongoose';

const dailyRequestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  userImage: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const DailyRequest = mongoose.models.DailyRequest || mongoose.model('DailyRequest', dailyRequestSchema);

// GET - Fetch all daily requests
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const requests = await DailyRequest.find().sort({ createdAt: -1 });
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching daily requests:', error);
    return NextResponse.json({ error: 'Failed to fetch daily requests' }, { status: 500 });
  }
}

// POST - Create a new daily request
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { title, description, category } = await request.json();

    if (!title || !description || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const requestDoc = await DailyRequest.create({
      title,
      description,
      category,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
    });

    return NextResponse.json(requestDoc);
  } catch (error) {
    console.error('Error creating daily request:', error);
    return NextResponse.json({ error: 'Failed to create daily request' }, { status: 500 });
  }
}
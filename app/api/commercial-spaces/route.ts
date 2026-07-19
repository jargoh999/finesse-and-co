import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import mongoose from 'mongoose';

const commercialSpaceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  userImage: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const CommercialSpace = mongoose.models.CommercialSpace || mongoose.model('CommercialSpace', commercialSpaceSchema);

// GET - Fetch all commercial spaces
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const spaces = await CommercialSpace.find().sort({ createdAt: -1 });
    return NextResponse.json(spaces);
  } catch (error) {
    console.error('Error fetching commercial spaces:', error);
    return NextResponse.json({ error: 'Failed to fetch commercial spaces' }, { status: 500 });
  }
}

// POST - Create a new commercial space
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { title, description, location, price } = await request.json();

    if (!title || !description || !location || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const space = await CommercialSpace.create({
      title,
      description,
      location,
      price,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
    });

    return NextResponse.json(space);
  } catch (error) {
    console.error('Error creating commercial space:', error);
    return NextResponse.json({ error: 'Failed to create commercial space' }, { status: 500 });
  }
}

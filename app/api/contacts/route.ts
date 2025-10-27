import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-simple';
import dbConnect from '@/lib/mongodb';
import { Contact } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await dbConnect();

    const contacts = await Contact.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .lean(); // Convert to plain JavaScript objects

    // Transform _id to id for frontend compatibility
    //@ts-ignore
    const transformedContacts = contacts.map(contact => ({
      ...contact,
      id: contact?._id?.toString(),
      _id: undefined, // Remove _id field
    }));

    return NextResponse.json(transformedContacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { name, email, phone, address, notes } = body;

    if (!name) {
      return new NextResponse('Name is required', { status: 400 });
    }

    const newContact = new Contact({
      userId: decoded.userId,
      name,
      email: email || '',
      phone: phone || '',
      address: address || '',
      notes: notes || '',
    });

    await newContact.save();

    return NextResponse.json(newContact);
  } catch (error) {
    console.error('Error creating contact:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

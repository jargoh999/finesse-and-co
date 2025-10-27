import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-simple';
import dbConnect from '@/lib/mongodb';
import { SecureNote } from '@/lib/models';

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

    const notes = await SecureNote.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .lean(); // Convert to plain JavaScript objects

    // Transform _id to id for frontend compatibility
    const transformedNotes = notes.map((note: any) => ({
      ...note,
      id: (note._id as any).toString(),
      _id: undefined, // Remove _id field
    }));

    return NextResponse.json(transformedNotes);
  } catch (error) {
    console.error('Error fetching secure notes:', error);
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
    const { title, content, isEncrypted, pin } = body;

    console.log('Creating note - Request body:', {
      title: title ? 'present' : 'missing',
      content: content ? 'present' : 'missing',
      isEncrypted,
      pin: pin || 'undefined',
      pinLength: pin ? pin.length : 0
    });

    if (!title || !content) {
      return new NextResponse('Title and content are required', { status: 400 });
    }

    if (isEncrypted && !pin) {
      return new NextResponse('PIN is required for encrypted notes', { status: 400 });
    }

    const newNote = new SecureNote({
      userId: decoded.userId,
      title,
      content,
      isEncrypted: isEncrypted || false,
      pin: isEncrypted ? pin : undefined,
    });

    console.log('Note object before save:', {
      userId: newNote.userId,
      title: newNote.title,
      content: newNote.content,
      isEncrypted: newNote.isEncrypted,
      pin: newNote.pin || 'undefined'
    });

    await newNote.save();

    console.log('Note saved successfully:', {
      id: newNote._id.toString(),
      title: newNote.title,
      isEncrypted: newNote.isEncrypted,
      pin: newNote.pin || 'undefined'
    });

    return NextResponse.json(newNote);
  } catch (error) {
    console.error('Error creating secure note:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-simple';
import dbConnect from '@/lib/mongodb';
import { SecureNote } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    console.log('Auth token present:', !!token);

    if (!token) {
      console.log('No auth token found in cookies');
      return new NextResponse('Unauthorized - No token', { status: 401 });
    }

    const decoded = verifyToken(token);
    console.log('Token decoded:', decoded);

    if (!decoded || !decoded.userId) {
      console.log('Token verification failed:', { decoded, hasUserId: !!decoded?.userId });
      return new NextResponse('Unauthorized - Invalid token', { status: 401 });
    }

    const body = await request.json();
    const { noteId, pin, action } = body;
    console.log('Request body:', { noteId: noteId ? 'present' : 'missing', hasPin: !!pin, action });

    if (!noteId || !pin) {
      return new NextResponse('Note ID and PIN are required', { status: 400 });
    }

    await dbConnect();

    const note = await SecureNote.findOne({
      _id: noteId,
      userId: decoded.userId,
    });
    console.log('Note found:', !!note);
    console.log('Note details:', note ? { 
      id: note._id, 
      title: note.title, 
      isEncrypted: note.isEncrypted,
      pin: note.pin || 'undefined',
      pinAttempts: note.pinAttempts,
      isLocked: note.isLocked
    } : 'none');

    if (!note) {
      return new NextResponse('Secure note not found', { status: 404 });
    }

    if (!note.isEncrypted) {
      return new NextResponse('Note is not encrypted', { status: 400 });
    }

    // Check if note has a PIN set
    if (!note.pin) {
      console.log('Note has no PIN set in database');
      return new NextResponse('This note was created without a PIN. Please edit the note to set a PIN.', { status: 400 });
    }

    // Check if PIN matches
    if (note.pin === pin) {
      return NextResponse.json({
        success: true,
        content: action === 'view' ? note.content : null,
        message: 'PIN verified successfully',
        action: action || 'verify'
      });
    } else {
      console.log('PIN mismatch:', { provided: pin, expected: note.pin || 'undefined' });
      return new NextResponse('Invalid PIN', { status: 401 });
    }

  } catch (error) {
    console.error('Error verifying PIN:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

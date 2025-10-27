import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-simple';
import dbConnect from '@/lib/mongodb';
import { SecureNote } from '@/lib/models';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    console.log('PUT - Auth token present:', !!token);

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const decoded = verifyToken(token);
    console.log('PUT - Token decoded:', decoded);

    if (!decoded || !decoded.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    console.log('PUT - Note ID:', id);

    if (!id) {
      return new NextResponse('Note ID is required', { status: 400 });
    }

    await dbConnect();

    const body = await request.json();
    const { title, content, isEncrypted, pin } = body;
    console.log('PUT - Request body:', {
      title: title ? 'present' : 'missing',
      content: content ? 'present' : 'missing',
      isEncrypted,
      pin: pin || 'undefined'
    });

    if (!title || !content) {
      console.log('PUT - Missing title or content');
      return new NextResponse('Title and content are required', { status: 400 });
    }

    // If making it encrypted, require PIN
    if (isEncrypted && !pin) {
      console.log('PUT - Encrypted note missing PIN');
      return new NextResponse('PIN is required for encrypted notes', { status: 400 });
    }

    const updatedNote = await SecureNote.findOneAndUpdate(
      { _id: id, userId: decoded.userId },
      {
        title,
        content,
        isEncrypted: isEncrypted || false,
        pin: isEncrypted ? pin : undefined,
        pinAttempts: 0, // Reset attempts on successful edit
        isLocked: false, // Unlock if it was locked
      },
      { new: true }
    );

    console.log('PUT - Note found and updated:', !!updatedNote);

    if (!updatedNote) {
      console.log('PUT - Note not found or user not authorized');
      return new NextResponse('Secure note not found', { status: 404 });
    }

    console.log('PUT - Note updated successfully:', {
      id: updatedNote._id,
      title: updatedNote.title,
      isEncrypted: updatedNote.isEncrypted,
      pin: updatedNote.pin || 'undefined'
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('Error updating secure note:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return new NextResponse('Note ID is required', { status: 400 });
    }

    await dbConnect();

    const note = await SecureNote.findOneAndDelete({
      _id: id,
      userId: decoded.userId,
    });

    if (!note) {
      return new NextResponse('Secure note not found', { status: 404 });
    }

    return new NextResponse('Secure note deleted successfully', { status: 200 });
  } catch (error) {
    console.error('Error deleting secure note:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

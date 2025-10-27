import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-simple';
import dbConnect from '@/lib/mongodb';
import { Contact } from '@/lib/models';

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
      return new NextResponse('Contact ID is required', { status: 400 });
    }

    await dbConnect();

    const contact = await Contact.findOneAndDelete({
      _id: id,
      userId: decoded.userId,
    });

    if (!contact) {
      return new NextResponse('Contact not found', { status: 404 });
    }

    return new NextResponse('Contact deleted successfully', { status: 200 });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

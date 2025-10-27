import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-simple';
import dbConnect from '@/lib/mongodb';
import { Password } from '@/lib/models';

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

    const passwords = await Password.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .lean(); // Convert to plain JavaScript objects

    // Transform _id to id for frontend compatibility
    //@ts-ignore

    const transformedPasswords = passwords.map(password => ({
      ...password,
      id: password?._id?.toString(),
      _id: undefined, // Remove _id field
    }));

    return NextResponse.json(transformedPasswords);
  } catch (error) {
    console.error('Error fetching passwords:', error);
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
    const { title, username, password, url, notes, category } = body;

    if (!title || !username || !password) {
      return new NextResponse('Title, username, and password are required', { status: 400 });
    }

    const newPassword = new Password({
      userId: decoded.userId,
      title,
      username,
      password,
      url: url || '',
      notes: notes || '',
      category: category || '',
    });

    await newPassword.save();

    return NextResponse.json(newPassword);
  } catch (error) {
    console.error('Error creating password:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

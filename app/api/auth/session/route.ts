import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-simple';
import dbConnect from '@/lib/mongodb';
import { PrivateUser } from '@/lib/models';

export async function GET(request: Request) {
  try {
    //@ts-ignore
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Verify user exists in database
    await dbConnect();
    const user = await PrivateUser.findById(decoded.userId);

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

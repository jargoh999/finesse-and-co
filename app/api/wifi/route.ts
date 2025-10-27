import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-simple';
import dbConnect from '@/lib/mongodb';
import { WiFiNetwork } from '@/lib/models';

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

    const networks = await WiFiNetwork.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .lean(); // Convert to plain JavaScript objects

    // Transform _id to id for frontend compatibility
            //@ts-ignore
    const transformedNetworks = networks.map(network => ({
      ...network,
      id: network._id.toString(),
      _id: undefined, // Remove _id field
    }));

    return NextResponse.json(transformedNetworks);
  } catch (error) {
    console.error('Error fetching WiFi networks:', error);
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
    const { name, ssid, password, securityType, notes } = body;

    if (!name || !ssid || !password) {
      return new NextResponse('Name, SSID, and password are required', { status: 400 });
    }

    const newNetwork = new WiFiNetwork({
      userId: decoded.userId,
      name,
      ssid,
      password,
      securityType: securityType || 'WPA2',
      notes: notes || '',
    });

    await newNetwork.save();

    return NextResponse.json(newNetwork);
  } catch (error) {
    console.error('Error creating WiFi network:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

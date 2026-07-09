import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import dbConnect from '@/lib/mongodb';
import { PrivateUser } from '@/lib/models';
import { memoryCache } from '@/lib/cache';

// GET - Get current user profile
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getAuthenticatedUser(request);
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const dbUser = await PrivateUser.findById(user.id).lean() as any;
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: dbUser._id.toString(),
        name: dbUser.name,
        email: dbUser.email,
        image: dbUser.image || null,
        status: dbUser.status || 'offline',
        createdAt: dbUser.createdAt,
      }
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PUT - Update user profile (name and/or profile picture)
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getAuthenticatedUser(request);
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { name, image } = await request.json();

    // Validate image size if provided (base64 ~2MB limit)
    if (image) {
      const estimatedBytes = (image.length * 3) / 4;
      if (estimatedBytes > 2.5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Profile picture too large. Maximum size is 2MB.' },
          { status: 400 }
        );
      }
    }

    // Build update object
    const update: any = {};
    if (name && name.trim()) {
      update.name = name.trim();
    }
    if (image !== undefined) {
      update.image = image; // base64 data URI, or empty string to remove
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updatedUser = await PrivateUser.findByIdAndUpdate(
      user.id,
      { $set: update },
      { new: true }
    ).lean() as any;

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Invalidate cached user lookup
    memoryCache.delete(`user:${user.id}`);

    return NextResponse.json({
      success: true,
      profile: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image || null,
        status: updatedUser.status || 'offline',
        createdAt: updatedUser.createdAt,
      }
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-simple';
import dbConnect from '@/lib/mongodb';
import { UserSettings } from '@/lib/models';

export async function POST(request: Request) {
  try {
    //@ts-ignore
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { autoSave, theme, notifications, lastSync } = body;

    // Find or create user settings
    let userSettings = await UserSettings.findOne({ userId: decoded.userId });

    if (!userSettings) {
      userSettings = new UserSettings({
        userId: decoded.userId,
        autoSave: autoSave || false,
        theme: theme || 'system',
        notifications: notifications !== undefined ? notifications : true,
        lastSync: lastSync || new Date(),
      });
    } else {
      // Update existing settings
      if (autoSave !== undefined) userSettings.autoSave = autoSave;
      if (theme) userSettings.theme = theme;
      if (notifications !== undefined) userSettings.notifications = notifications;
      if (lastSync) userSettings.lastSync = new Date(lastSync);
    }

    await userSettings.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving user settings:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

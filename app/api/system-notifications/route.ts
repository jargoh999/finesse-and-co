import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { PrivateUser } from '@/lib/models';
import mongoose from 'mongoose';

const SystemNotificationSchema = new mongoose.Schema({
  type: { type: String, required: true }, // 'qa_started', etc.
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Object }, // Additional data like questionId, question, etc.
  senderId: { type: String, required: true }, // User who triggered the notification
  recipientId: { type: String, required: true }, // User receiving the notification
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const SystemNotification = mongoose.models.SystemNotification || mongoose.model('SystemNotification', SystemNotificationSchema);

// GET - Get all system notifications for current user
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const notifications = await SystemNotification.find({ 
      recipientId: user.id 
    }).sort({ createdAt: -1 });
    
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching system notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST - Mark notification as read
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId } = await req.json();
    
    await dbConnect();
    
    await SystemNotification.updateOne(
      { _id: notificationId, recipientId: user.id },
      { isRead: true }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

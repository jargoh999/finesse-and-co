import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import dbConnect from '@/lib/dbConnect';
import { PrivateUser } from '@/lib/models';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the authenticated user using custom token
    //@ts-ignore
    const currentUser = await getAuthenticatedUser(request);

    if (!currentUser?.email) {
      console.log('No authenticated user found in chat check API');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('Checking chat for user:', userId, 'by user:', currentUser.email);

    await dbConnect();

    // Find the current user in database
    const user = await PrivateUser.findOne({ email: currentUser.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('User found:', user.email, 'conversations field:', user.conversations);

    // Check if there's an existing conversation with the target user
    const existingConversation = user.conversations?.find(
      (conv: { participant: string }) =>
        conv.participant.toString() === userId
    );

    return NextResponse.json({
      conversationId: existingConversation?.conversationId || null,
      exists: !!existingConversation
    });

  } catch (error) {
    console.error('Error checking chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

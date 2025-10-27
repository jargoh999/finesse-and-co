import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { PrivateUser } from '@/lib/models';

export async function GET(req: Request) {
  try {
    await dbConnect();
    
    // Get the session
    const session = await getServerSession(authOptions);
    console.log('Session in API route:', session);
    
    // Get the current user's email from the session if available
    const currentUserEmail = session?.user?.email;
    
    // Build the query to find all users except the current user
    const query = currentUserEmail 
      ? { email: { $ne: currentUserEmail } } 
      : {}; // If no current user, return all users (or adjust as needed)
    
    // Find users based on the query
    const users = await PrivateUser.find(
      query,
      'name email image'
    ).lean();

    console.log(`Found ${users.length} users`);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error in secure-users API:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

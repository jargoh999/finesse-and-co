import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-simple';
import dbConnect from '@/lib/mongodb';
import { PrivateUser } from '@/lib/models';
import { memoryCache } from '@/lib/cache';

async function getCachedUser(userId: string) {
  const cacheKey = `user:${userId}`;
  const cached = memoryCache.get(cacheKey);
  if (cached) return cached;

  await dbConnect();
  const user = await PrivateUser.findById(userId);
  if (!user) return null;

  const userData = {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    image: user.image
  };
  memoryCache.set(cacheKey, userData, 30000); // Cache for 30 seconds
  return userData;
}

export async function getAuthenticatedUser(request: NextRequest) {
  try {
    // Try cookie-based auth first (for API routes)
    const cookieToken = request.cookies.get('auth-token')?.value;

    if (cookieToken) {
      const decoded = verifyToken(cookieToken);

      if (decoded && decoded.userId) {
        const user = await getCachedUser(decoded.userId);
        if (user) return user;
      }
    }

    // Fallback: try to get from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        // Try to decode as base64 first (for simple tokens)
        const decodedData = JSON.parse(atob(token));
        if (decodedData && decodedData.userId) {
          const user = await getCachedUser(decodedData.userId);
          if (user) return user;
        }
      } catch (error) {
        // If base64 decoding fails, try JWT format
        try {
          const decoded = verifyToken(token);

          if (decoded && decoded.userId) {
            const user = await getCachedUser(decoded.userId);
            if (user) return user;
          }
        } catch (jwtError) {
          console.error('Error verifying JWT token:', jwtError);
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

// Helper function to get current user from session (client-side)
export function getCurrentUserFromSession() {
  if (typeof window === 'undefined') return null;

  try {
    const sessionData = localStorage.getItem('user-session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      return {
        id: session.userId,
        email: session.email,
        name: session.name,
        image: session.image
      };
    }
  } catch (error) {
    console.error('Error getting current user from session:', error);
  }

  return null;
}

// Helper function to set current user session (client-side)
export function setCurrentUserSession(user: any) {
  if (typeof window === 'undefined') return;

  try {
    const sessionData = {
      userId: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      timestamp: Date.now()
    };
    localStorage.setItem('user-session', JSON.stringify(sessionData));
  } catch (error) {
    console.error('Error setting current user session:', error);
  }
}

// Helper function to clear current user session (client-side)
export function clearCurrentUserSession() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('user-session');
    localStorage.removeItem('session-expiry');
  } catch (error) {
    console.error('Error clearing current user session:', error);
  }
}

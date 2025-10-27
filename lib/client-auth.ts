'use client';

// Client-side authentication helpers
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

export function setCurrentUserSession(user: any) {
  if (typeof window === 'undefined') return;

  try {
    const session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('user-session', JSON.stringify(session));
  } catch (error) {
    console.error('Error setting user session:', error);
  }
}

export function clearCurrentUserSession() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('user-session');
  } catch (error) {
    console.error('Error clearing user session:', error);
  }
}

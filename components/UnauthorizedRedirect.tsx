'use client';

import { useEffect } from 'react';
import { clearCurrentUserSession } from '@/lib/client-auth';

const REDIRECT_PATH = '/login';

let redirecting = false;

function redirectToLogin() {
  if (redirecting) return;
  redirecting = true;

  try {
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    if (!path.startsWith(REDIRECT_PATH)) {
      if (typeof window !== 'undefined') {
        window.location.href = REDIRECT_PATH;
      }
    }
  } catch (e) {
    // ignore
  }
}

function setupUnauthorizedRedirect() {
  if (typeof window === 'undefined') return;
  if ((window as any).__unauthorizedRedirectInstalled) return;

  (window as any).__unauthorizedRedirectInstalled = true;

  const originalFetch = window.fetch;
  window.fetch = async function (...args: Parameters<typeof fetch>) {
    const response = await originalFetch(...args);

    if (response.status === 401) {
      clearCurrentUserSession();
      redirectToLogin();
    }

    return response;
  };
}

export function UnauthorizedRedirect() {
  useEffect(() => {
    setupUnauthorizedRedirect();
  }, []);

  return null;
}

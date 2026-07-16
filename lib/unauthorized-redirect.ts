const REDIRECT_PATH = '/login';

let redirecting = false;

function clearSession() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('user-session');
    localStorage.removeItem('session-expiry');
  } catch (e) {
    // ignore storage errors
  }
}

export function redirectToLogin() {
  if (redirecting) return;
  redirecting = true;

  try {
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    if (!path.startsWith(REDIRECT_PATH)) {
      if (typeof window !== 'undefined') {
        window.location.href = REDIRECT_PATH;
        return;
      }
    }
  } catch (e) {
    // ignore
  }

  redirecting = false;
}

export function setupUnauthorizedRedirect(originalFetch: typeof fetch) {
  return async (...args: Parameters<typeof fetch>) => {
    const response = await originalFetch(...args);

    if (response.status === 401) {
      clearSession();
      redirectToLogin();
    }

    return response;
  };
}

export function installUnauthorizedRedirect() {
  if (typeof window === 'undefined') return;

  if (!(window as any).__unauthorizedRedirectInstalled) {
    (window as any).__unauthorizedRedirectInstalled = true;
    window.fetch = setupUnauthorizedRedirect(window.fetch);
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

class ApiClient {
  private baseURL: string;
  private redirecting = false;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        this.handleUnauthorized();
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private handleUnauthorized() {
    if (this.redirecting) return;
    this.redirecting = true;

    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user-session');
        localStorage.removeItem('session-expiry');
      }
    } catch (e) {
      // ignore storage errors
    }

    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    if (!path.startsWith('/login')) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    this.redirecting = false;
  }

  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }
  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method:
        'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

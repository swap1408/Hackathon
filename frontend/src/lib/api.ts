// ---------------------------------------------
// Runtime API URL from env.js (frontend container)
// ---------------------------------------------
const API_URL: string =
  typeof window !== 'undefined' &&
  (window as any).__ENV__ &&
  (window as any).__ENV__.VITE_API_URL
    ? (window as any).__ENV__.VITE_API_URL
    : (import.meta as any).env?.VITE_API_URL || '';

// ---------------------------------------------
// Python API base URL (CityAssist)
// ---------------------------------------------
const CITYASSIST_URL: string =
  typeof window !== 'undefined' &&
  (window as any).__ENV__ &&
  (window as any).__ENV__.CITYASSIST_API_URL
    ? (window as any).__ENV__.CITYASSIST_API_URL
    : (import.meta as any).env?.CITYASSIST_API_URL || 'http://15.207.120.201:8000';

// ---------------------------------------------
// Storage keys
// ---------------------------------------------
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const AUTH_USER_KEY = 'auth_user';

// ---------------------------------------------
// Auth user type
// ---------------------------------------------
export type AuthUser = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
};

// ---------------------------------------------
// LocalStorage helpers
// ---------------------------------------------
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh?: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function setStoredUser(user: AuthUser | null) {
  if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(AUTH_USER_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

// ---------------------------------------------
// Warn if backend URL missing
// ---------------------------------------------
if (!API_URL) {
  console.warn('VITE_API_URL not set; backend API calls may fail.');
}

// ---------------------------------------------
// RAW REQUEST — used for Python API (absolute URLs allowed)
// ---------------------------------------------
async function rawRequest(path: string, init: RequestInit = {}) {
  try {
    return await fetch(path, init);
  } catch (err: any) {
    throw new Error(`Network error contacting ${path}: ${err?.message || 'Unknown error'}`);
  }
}

// ---------------------------------------------
// MAIN BACKEND REQUEST WRAPPER
// (automatic token, backend URL prepend, retry refresh)
// ---------------------------------------------
async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const token = getAccessToken();

  // If absolute URL → bypass API_URL (Python or external API)
  if (/^https?:\/\//i.test(path)) {
    return rawRequest(path, init).then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
  }

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };

  const hasBody = typeof (init as any).body !== 'undefined' && (init as any).body !== null;
  const isForm = hasBody && (init as any).body instanceof FormData;

  if (hasBody && !isForm && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${API_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch (e: any) {
    throw new Error(`Network error contacting API at ${url}: ${e?.message || ''}`);
  }

  // Auto refresh flow
  if (res.status === 401 && retry) {
    const ok = await tryRefreshToken();
    if (ok) return request<T>(path, init, false);
  }

  if (!res.ok) {
    let message = '';
    try {
      const data = await res.json();
      message = data?.message || data?.error || '';
    } catch {
      try {
        message = await res.text();
      } catch {}
    }
    throw new Error(`HTTP ${res.status} ${message} at ${url}`);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------
// Token refresh logic
// ---------------------------------------------
async function tryRefreshToken(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;

  try {
    const res = await rawRequest(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    const access = data?.access_token;
    if (!access) return false;

    setTokens(access);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------
// AUTH API
// ---------------------------------------------
export const AuthAPI = {
  ping: async () => {
    await request('/api/v1/seed', { method: 'GET' }, false);
    return true;
  },

  login: async (email: string, password: string) => {
    const r = await request<{
      accessToken: string;
      refreshToken: string;
      user: AuthUser;
    }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setTokens(r.accessToken, r.refreshToken);
    setStoredUser(r.user);
    return r.user;
  },

  register: async (name, email, password) => {
    try {
      const r = await request('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      setTokens(r.accessToken, r.refreshToken);
      setStoredUser(r.user);
      return r.user;
    } catch {
      // fallback
      const r = await request('/api/v1/public/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      setTokens(r.accessToken, r.refreshToken);
      setStoredUser(r.user);
      return r.user;
    }
  },

  logout: () => {
    clearTokens();
    setStoredUser(null);
  },
};

// ---------------------------------------------
// Alerts API
// ---------------------------------------------
export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export const AlertsAPI = {
  list: async (p?: { page?: number; size?: number }) =>
    request<Page<any>>(`/api/v1/alerts?page=${p?.page ?? 0}&size=${p?.size ?? 10}`),

  create: async (payload) =>
    request('/api/v1/alerts', { method: 'POST', body: JSON.stringify(payload) }),

  read: async (id: string) =>
    request(`/api/v1/alerts/${id}/read`, { method: 'POST' }),
};

// ---------------------------------------------
// Users API
// ---------------------------------------------
export const UsersAPI = {
  listOperators: async () =>
    request('/api/v1/users/operators'),

  createOperator: async (payload) =>
    request('/api/v1/users/operators', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteOperator: async (id: string) =>
    request(`/api/v1/users/operators/${id}`, { method: 'DELETE' }),
};

// ---------------------------------------------
// AI Backend API (Java)
// ---------------------------------------------
export const AiAPI = {
  getModels: async () => request('/api/v1/ai/models'),

  predictFlood: async (features, model?: string) => {
    const qs = model ? `?model=${encodeURIComponent(model)}` : '';
    return request(`/api/v1/ai/predict/flood${qs}`, {
      method: 'POST',
      body: JSON.stringify(features),
    });
  },

  predictAqi: async (features) =>
    request('/api/v1/ai/predict/aqi', { method: 'POST', body: JSON.stringify(features) }),
};

// ---------------------------------------------
// PYTHON FASTAPI (CityAssist)
// These MUST use rawRequest with full absolute URL
// ---------------------------------------------
export const CityAssistRoutes = {
  predict: async ({ location, time_of_day }) => {
    const qs = new URLSearchParams({ location, time_of_day }).toString();
    return rawRequest(`${CITYASSIST_URL}/api/routes/predict?${qs}`).then((r) => r.json());
  },
};

export const CityAssistOutage = {
  predict: async (payload) =>
    rawRequest(`${CITYASSIST_URL}/api/outage/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((r) => r.json()),
};

export const CityAssistImage = {
  classify: async (file) => {
    const form = new FormData();
    form.append('image', file);
    return rawRequest(`${CITYASSIST_URL}/api/image/predict`, {
      method: 'POST',
      body: form,
    }).then((r) => r.json());
  },
};

export const CityAssistAlerts = {
  predict: async (payload) =>
    rawRequest(`${CITYASSIST_URL}/api/alerts/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((r) => r.json()),
};

// ---------------------------------------------
// Sensors API
// ---------------------------------------------
export const SensorsAPI = {
  list: async () =>
    request('/api/v1/sensors'),

  timeseries: async (id, params) => {
    const qs = new URLSearchParams({
      from: params.from,
      to: params.to,
    });
    if (params.interval) qs.append('interval', params.interval);

    return request(`/api/v1/sensors/${id}/timeseries?${qs.toString()}`);
  },
};

// ---------------------------------------------
// AQI API
// ---------------------------------------------
export type CityAQI = { city: string; aqi: number; category: string };

export const AqiAPI = {
  listCities: () => ['Mumbai', 'Pune', 'Hyderabad', 'Delhi', 'Kolkata'],

  getCityAqi: async (city: string) => {
    try {
      return await request(`/api/v1/aqi/city?name=${encodeURIComponent(city)}`);
    } catch {
      return { city, aqi: 100, category: 'Moderate' };
    }
  },
};

// ---------------------------------------------
// Incidents API
// ---------------------------------------------
export const IncidentsAPI = {
  create: async (payload) =>
    request('/api/v1/incidents', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  list: async (p = {}) => {
    const qs = new URLSearchParams();
    qs.set('page', String(p.page ?? 0));
    qs.set('size', String(p.size ?? 5));
    if (p.status) qs.set('status', p.status);
    if (p.severity) qs.set('severity', p.severity);
    if (p.zone) qs.set('zone', p.zone);
    if (p.from) qs.set('from', p.from);

    return request(`/api/v1/incidents?${qs.toString()}`);
  },
};


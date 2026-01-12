const API_BASE = '/api';

// Get token from memory (will be set by auth context)
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

// Generic fetch wrapper
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    fetchApi<{ token: string; organization: { id: number; name: string; email: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),

  register: (name: string, email: string, password: string) =>
    fetchApi<{ token: string; organization: { id: number; name: string; email: string } }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ name, email, password }) }
    ),

  me: () =>
    fetchApi<{ organization: { id: number; name: string; email: string; created_at: string } }>(
      '/auth/me'
    ),
};

// Entries API
export const entriesApi = {
  getAll: () =>
    fetchApi<{ entries: import('../types').WaitlistEntry[] }>('/entries'),

  get: (id: number) =>
    fetchApi<{ entry: import('../types').WaitlistEntry }>(`/entries/${id}`),

  create: (data: Partial<import('../types').WaitlistEntry>) =>
    fetchApi<{ entry: import('../types').WaitlistEntry }>('/entries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<import('../types').WaitlistEntry>) =>
    fetchApi<{ entry: import('../types').WaitlistEntry }>(`/entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchApi<{ success: boolean }>(`/entries/${id}`, { method: 'DELETE' }),
};

// Rules API
export const rulesApi = {
  getAll: () =>
    fetchApi<{ rules: import('../types').PriorityRule[] }>('/rules'),

  update: (rules: import('../types').PriorityRule[]) =>
    fetchApi<{ rules: import('../types').PriorityRule[] }>('/rules', {
      method: 'PUT',
      body: JSON.stringify({ rules }),
    }),
};

// Spots API
export const spotsApi = {
  getAll: () =>
    fetchApi<{ spots: import('../types').AvailableSpot[] }>('/spots'),

  create: (data: { days: string[]; start_date: string; num_spots?: number }) =>
    fetchApi<{
      spot: import('../types').AvailableSpot;
      candidates: import('../types').MatchCandidate[];
    }>('/spots', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCandidates: (spotId: number) =>
    fetchApi<{ candidates: import('../types').MatchCandidate[] }>(
      `/spots/${spotId}/candidates`
    ),
};

// Matches API
export const matchesApi = {
  getAll: () =>
    fetchApi<{ matches: import('../types').Match[] }>('/matches'),

  create: (spotId: number, entryId: number) =>
    fetchApi<{
      match: import('../types').Match;
      emailPreview: { to: string; subject: string; body: string };
    }>('/matches', {
      method: 'POST',
      body: JSON.stringify({ spot_id: spotId, entry_id: entryId }),
    }),
};

// Decision log API
export const logApi = {
  getAll: () =>
    fetchApi<{ logs: import('../types').DecisionLogEntry[] }>('/log'),

  exportUrl: () => `${API_BASE}/log/export`,
};

// Analytics API
export const analyticsApi = {
  get: () =>
    fetchApi<import('../types').Analytics>('/analytics'),
};

// Portal API (no auth)
export const portalApi = {
  get: (accessCode: string) =>
    fetchApi<import('../types').PortalData>(`/portal/${accessCode}`),

  updatePreferences: (
    accessCode: string,
    data: { preferred_days?: string[]; desired_start_date?: string; notes?: string }
  ) =>
    fetchApi<{ entry: import('../types').WaitlistEntry; position: import('../types').WaitlistPosition }>(
      `/portal/${accessCode}/preferences`,
      { method: 'PUT', body: JSON.stringify(data) }
    ),

  respondToMatch: (accessCode: string, matchId: number, accept: boolean, reason?: string) =>
    fetchApi<{ success: boolean; accepted: boolean }>(
      `/portal/${accessCode}/match/${matchId}/respond`,
      {
        method: 'POST',
        body: JSON.stringify({ accept, rejection_reason: reason }),
      }
    ),
};

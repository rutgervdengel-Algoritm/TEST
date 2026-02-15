const API_BASE = 'https://test-production-621f.up.railway.app/api';

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

  register: (name: string, email: string, password: string, type?: 'KDV' | 'BSO') =>
    fetchApi<{ token: string; organization: { id: number; name: string; email: string } }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ name, email, password, type }) }
    ),

  me: () =>
    fetchApi<{ organization: { id: number; name: string; email: string; type?: string; created_at: string } }>(
      '/auth/me'
    ),
};

// Entries API
export const entriesApi = {
  getAll: (includeArchived?: boolean) =>
    fetchApi<{ entries: import('../types').WaitlistEntry[] }>(
      `/entries${includeArchived ? '?includeArchived=true' : ''}`
    ),

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

  // Feature 9: Reset confirmation status
  resetConfirmation: (id: number) =>
    fetchApi<{ entry: import('../types').WaitlistEntry }>(`/entries/${id}/reset-confirmation`, {
      method: 'POST',
    }),

  // Feature 9: Bulk reset confirmation
  bulkResetConfirmation: (ids: number[]) =>
    fetchApi<{ updated: number }>('/entries/bulk-reset-confirmation', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  // Feature 9: Restore archived entry
  restore: (id: number) =>
    fetchApi<{ entry: import('../types').WaitlistEntry }>(`/entries/${id}/restore`, {
      method: 'POST',
    }),

  // Feature 9: Get archived entries
  getArchived: () =>
    fetchApi<{ entries: import('../types').WaitlistEntry[] }>('/entries/archived'),
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

  // Feature 8: Fairness check
  checkFairness: () =>
    fetchApi<import('../types').FairnessCheck>('/rules/fairness'),
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

// Decision log API (Feature 5: Enhanced)
export const logApi = {
  getAll: (filters?: {
    category?: string;
    action_type?: string;
    from_date?: string;
    to_date?: string;
    entry_id?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.action_type) params.append('action_type', filters.action_type);
    if (filters?.from_date) params.append('from_date', filters.from_date);
    if (filters?.to_date) params.append('to_date', filters.to_date);
    if (filters?.entry_id) params.append('entry_id', String(filters.entry_id));
    const queryString = params.toString();
    return fetchApi<{ logs: import('../types').DecisionLogEntry[] }>(
      `/log${queryString ? `?${queryString}` : ''}`
    );
  },

  exportUrl: (filters?: {
    category?: string;
    action_type?: string;
    from_date?: string;
    to_date?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.action_type) params.append('action_type', filters.action_type);
    if (filters?.from_date) params.append('from_date', filters.from_date);
    if (filters?.to_date) params.append('to_date', filters.to_date);
    const queryString = params.toString();
    return `${API_BASE}/log/export${queryString ? `?${queryString}` : ''}`;
  },
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

  // Get all entries by email (multi-organization view)
  getByEmail: (email: string) =>
    fetchApi<import('../types').PortalMultiData>(`/portal/by-email/${encodeURIComponent(email)}`),

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

  // Feature 9: Confirm interest
  confirmInterest: (accessCode: string, otherRegistrations?: string[]) =>
    fetchApi<{ entry: import('../types').WaitlistEntry; message: string }>(
      `/portal/${accessCode}/confirm-interest`,
      {
        method: 'POST',
        body: JSON.stringify({ other_registrations: otherRegistrations }),
      }
    ),

  // Feature 4: Simulate preference change
  simulate: (accessCode: string, newDays: string[]) =>
    fetchApi<import('../types').SimulationResult>(
      `/portal/${accessCode}/simulate`,
      {
        method: 'POST',
        body: JSON.stringify({ new_days: newDays }),
      }
    ),
};

// Import/Export API (Feature 7)
export const importExportApi = {
  exportWaitlist: () => `${API_BASE}/export/waitlist`,

  getImportTemplate: () => `${API_BASE}/import/template`,

  importWaitlist: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE}/import/waitlist`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Import failed' }));
      throw new Error(error.error || 'Import failed');
    }

    return response.json() as Promise<import('../types').ImportResult>;
  },
};

// Seed/Demo API (Feature 10)
export const seedApi = {
  loadDemo: () =>
    fetchApi<{
      success: boolean;
      message: string;
      created?: { entries: number; spots: number };
      stats?: {
        total: number;
        active: number;
        pending: number;
        expired: number;
        archived: number;
        withSibling: number;
        withOtherRegistrations: number;
      };
    }>(
      '/seed/demo',
      { method: 'POST' }
    ),

  reset: () =>
    fetchApi<{ success: boolean; message: string }>(
      '/seed/reset',
      { method: 'POST' }
    ),
};

// ============================================
// PARENT API (Ouder Standalone Mode)
// ============================================

export interface ParentUser {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  created_at?: string;
}

export interface StandaloneRegistration {
  id: number;
  parent_user_id: number;
  organization_name: string;
  organization_email: string | null;
  organization_address: string | null;
  organization_phone: string | null;
  child_name: string;
  child_birthdate: string | null;
  preferred_days: string[];
  desired_start_date: string | null;
  registration_date: string | null;
  notes: string | null;
  status: 'waiting' | 'offered' | 'accepted' | 'rejected';
  email_template: string | null;
  last_confirmation_sent: string | null;
  linked_entry_id: number | null;
  linked_org_id: number | null;
  linked_at: string | null;
  created_at: string;
  updated_at: string;
  // Computed fields
  isLinked?: boolean;
  confirmationNeeded?: boolean;
  last_sent?: string;
  send_count?: number;
}

export interface ConfirmationEmail {
  id: number;
  registration_id: number;
  sent_at: string;
  recipient_email: string;
  subject: string;
  body: string;
  status: 'sent' | 'failed' | 'preview';
}

export interface ParentDashboardStats {
  registrations: {
    total: number;
    waiting: number;
    offered: number;
    accepted: number;
    linked: number;
  };
  emails: {
    total_emails: number;
  };
  needsConfirmation: number;
}

export const parentApi = {
  // Auth
  register: (data: { email: string; password: string; name: string; phone?: string }) =>
    fetchApi<{ token: string; user: ParentUser }>(
      '/parent/register',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  login: (email: string, password: string) =>
    fetchApi<{ token: string; user: ParentUser }>(
      '/parent/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),

  me: () =>
    fetchApi<{ user: ParentUser }>('/parent/me'),

  updateProfile: (data: { name?: string; phone?: string; currentPassword?: string; newPassword?: string }) =>
    fetchApi<{ user: ParentUser }>(
      '/parent/me',
      { method: 'PUT', body: JSON.stringify(data) }
    ),

  // Registrations
  getRegistrations: () =>
    fetchApi<{ registrations: StandaloneRegistration[] }>('/parent/registrations'),

  getRegistration: (id: number) =>
    fetchApi<{ registration: StandaloneRegistration; emails: ConfirmationEmail[] }>(`/parent/registrations/${id}`),

  createRegistration: (data: Partial<StandaloneRegistration>) =>
    fetchApi<{ registration: StandaloneRegistration }>(
      '/parent/registrations',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  updateRegistration: (id: number, data: Partial<StandaloneRegistration>) =>
    fetchApi<{ registration: StandaloneRegistration }>(
      `/parent/registrations/${id}`,
      { method: 'PUT', body: JSON.stringify(data) }
    ),

  deleteRegistration: (id: number) =>
    fetchApi<{ success: boolean }>(
      `/parent/registrations/${id}`,
      { method: 'DELETE' }
    ),

  // Email templates
  updateTemplate: (id: number, template: string) =>
    fetchApi<{ success: boolean; template: string }>(
      `/parent/registrations/${id}/template`,
      { method: 'PUT', body: JSON.stringify({ template }) }
    ),

  resetTemplate: (id: number) =>
    fetchApi<{ success: boolean; template: string }>(
      `/parent/registrations/${id}/template/reset`,
      { method: 'POST' }
    ),

  getEmailPreview: (id: number) =>
    fetchApi<{ to: string; subject: string; body: string; template: string }>(
      `/parent/registrations/${id}/email-preview`
    ),

  sendConfirmation: (id: number, customBody?: string) =>
    fetchApi<{ success: boolean; message: string; email: { to: string; subject: string; body: string } }>(
      `/parent/registrations/${id}/confirm`,
      { method: 'POST', body: JSON.stringify({ customBody }) }
    ),

  getEmailHistory: (id: number) =>
    fetchApi<{ emails: ConfirmationEmail[] }>(`/parent/registrations/${id}/emails`),

  // Link access code
  linkAccessCode: (id: number, accessCode: string) =>
    fetchApi<{ success: boolean; message: string; linkedEntry: { id: number; organization: string; accessCode: string } }>(
      `/parent/registrations/${id}/link`,
      { method: 'POST', body: JSON.stringify({ accessCode }) }
    ),

  // Dashboard
  getDashboard: () =>
    fetchApi<ParentDashboardStats>('/parent/dashboard'),
};

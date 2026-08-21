const API_BASE = '/api';

// ─── Auth Token Management ─────────────────────────────────
// The access token is managed by AuthContext and passed to authFetch
let getTokenFn = null;

export const setTokenGetter = (fn) => {
  getTokenFn = fn;
};

// Authenticated fetch wrapper
const authFetch = async (url, options = {}) => {
  let token = getTokenFn ? await getTokenFn(false) : null;

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // If 401 with TOKEN_EXPIRED, force a refresh and retry once
  if (res.status === 401) {
    const clone = res.clone();
    const body = await clone.json().catch(() => ({}));

    if (body.code === 'TOKEN_EXPIRED' && getTokenFn) {
      token = await getTokenFn(true); // force refresh
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        res = await fetch(url, {
          ...options,
          headers,
          credentials: 'include',
        });
      }
    }

    if (res.status === 401) {
      throw new Error('Authentication required. Please log in again.');
    }
  }

  return res;
};

// ─── Auth API ───────────────────────────────────────────────
export const forgotPassword = async (email) => {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed');
  return data;
};

export const resetPassword = async (email, otp, password) => {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed');
  return data;
};

export const verifyEmail = async (email, otp) => {
  const res = await fetch(`${API_BASE}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Verification failed');
  return data;
};

export const resendVerification = async (email) => {
  const res = await fetch(`${API_BASE}/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed');
  return data;
};

export const updateTourStatus = async (completed = true) => {
  const res = await authFetch(`${API_BASE}/auth/tour-completed`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update tour status');
  }
  return res.json();
};

// ─── Chapters ───────────────────────────────────────────────
export const fetchChapters = async () => {
  const res = await authFetch(`${API_BASE}/chapters`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch chapters');
  }
  return res.json();
};

export const createChapter = async (data) => {
  const res = await authFetch(`${API_BASE}/chapters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create chapter');
  }
  return res.json();
};

export const updateChapter = async (id, data) => {
  const res = await authFetch(`${API_BASE}/chapters/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update chapter');
  }
  return res.json();
};

export const deleteChapter = async (id) => {
  const res = await authFetch(`${API_BASE}/chapters/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete chapter');
  }
  return res.json();
};

export const importChapter = async (targetId, sourceId) => {
  const res = await authFetch(`${API_BASE}/chapters/${targetId}/import/${sourceId}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to import transactions');
  }
  return res.json();
};

// ─── Categories ─────────────────────────────────────────────
export const fetchCategories = async () => {
  const res = await authFetch(`${API_BASE}/categories`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch categories');
  }
  return res.json();
};

export const createCategory = async (data) => {
  const res = await authFetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create category');
  }
  return res.json();
};

export const updateCategory = async (id, data) => {
  const res = await authFetch(`${API_BASE}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update category');
  }
  return res.json();
};

export const deleteCategory = async (id) => {
  const res = await authFetch(`${API_BASE}/categories/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete category');
  }
  return res.json();
};

// ─── Payment Methods ────────────────────────────────────────
export const fetchPaymentMethods = async () => {
  const res = await authFetch(`${API_BASE}/payment-methods`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch payment methods');
  }
  return res.json();
};

export const createPaymentMethod = async (data) => {
  const res = await authFetch(`${API_BASE}/payment-methods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create payment method');
  }
  return res.json();
};

export const updatePaymentMethod = async (id, data) => {
  const res = await authFetch(`${API_BASE}/payment-methods/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update payment method');
  }
  return res.json();
};

export const deletePaymentMethod = async (id) => {
  const res = await authFetch(`${API_BASE}/payment-methods/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete payment method');
  }
  return res.json();
};

// ─── Transactions ───────────────────────────────────────────
export const fetchTransactions = async (chapterId) => {
  const res = await authFetch(`${API_BASE}/transactions?chapterId=${chapterId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch transactions');
  }
  return res.json();
};

export const createTransaction = async (data) => {
  const res = await authFetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create transaction');
  }
  return res.json();
};

export const updateTransaction = async (id, data) => {
  const res = await authFetch(`${API_BASE}/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update transaction');
  }
  return res.json();
};

export const deleteTransaction = async (id) => {
  const res = await authFetch(`${API_BASE}/transactions/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete transaction');
  }
  return res.json();
};

// ─── Recurring Expenses ─────────────────────────────────────
export const fetchRecurring = async (categoryId) => {
  const url = categoryId
    ? `${API_BASE}/recurring?categoryId=${categoryId}`
    : `${API_BASE}/recurring`;
  const res = await authFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch recurring expenses');
  }
  return res.json();
};

export const createRecurring = async (data) => {
  const res = await authFetch(`${API_BASE}/recurring`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create recurring expense');
  }
  return res.json();
};

export const updateRecurring = async (id, data) => {
  const res = await authFetch(`${API_BASE}/recurring/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update recurring expense');
  }
  return res.json();
};

export const deleteRecurring = async (id) => {
  const res = await authFetch(`${API_BASE}/recurring/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete recurring expense');
  }
  return res.json();
};

// ─── Account Management ────────────────────────────────────
export const updateProfile = async ({ name, avatar, removeAvatar }) => {
  const formData = new FormData();
  if (name !== undefined) formData.append('name', name);
  if (avatar instanceof File) formData.append('avatar', avatar);
  if (removeAvatar) formData.append('removeAvatar', 'true');

  const res = await authFetch(`${API_BASE}/auth/profile`, {
    method: 'PATCH',
    body: formData,
    // Don't set Content-Type — browser sets it with boundary for FormData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update profile');
  }
  return res.json();
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  const res = await authFetch(`${API_BASE}/auth/change-password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to change password');
  }
  return res.json();
};

export const linkGoogle = async (credential) => {
  const res = await authFetch(`${API_BASE}/auth/link-google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to link Google account');
  }
  return res.json();
};

export const unlinkGoogle = async () => {
  const res = await authFetch(`${API_BASE}/auth/unlink-google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to unlink Google account');
  }
  return res.json();
};

export const deleteAccount = async (confirmText) => {
  const res = await authFetch(`${API_BASE}/auth/account`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmText }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete account');
  }
  return res.json();
};

export const requestBind = async (email) => {
  const res = await fetch(`${API_BASE}/auth/request-bind`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to request bind');
  return data;
};

export const verifyBind = async (email, otp, password) => {
  const res = await fetch(`${API_BASE}/auth/verify-bind`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to verify bind');
  return data;
};

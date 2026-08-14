import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const accessTokenRef = useRef(null);
  const refreshTimeoutRef = useRef(null);

  // Schedule silent token refresh (2 minutes before expiry)
  const scheduleRefresh = useCallback((expiresInMs = 15 * 60 * 1000) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    const refreshIn = Math.max(expiresInMs - 2 * 60 * 1000, 30 * 1000); // At least 30s
    refreshTimeoutRef.current = setTimeout(() => {
      silentRefresh();
    }, refreshIn);
  }, []);

  // Silent refresh — get new access token using httpOnly cookie
  const silentRefresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Refresh failed');
      }

      const data = await res.json();
      accessTokenRef.current = data.accessToken;
      setUser(data.user);
      scheduleRefresh();
      return data.accessToken;
    } catch {
      // Refresh failed — user needs to log in again
      accessTokenRef.current = null;
      setUser(null);
      return null;
    }
  }, [scheduleRefresh]);

  // On mount, try to restore session
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      await silentRefresh();
      setLoading(false);
    };
    initAuth();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [silentRefresh]);

  // Get current access token (with auto-refresh if expired)
  const getAccessToken = useCallback(async () => {
    if (accessTokenRef.current) {
      return accessTokenRef.current;
    }
    return silentRefresh();
  }, [silentRefresh]);

  // Login with email/password
  const login = useCallback(async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw { status: res.status, ...data };
    }

    accessTokenRef.current = data.accessToken;
    setUser(data.user);
    scheduleRefresh();
    return data;
  }, [scheduleRefresh]);

  // Register with email/password
  const register = useCallback(async (name, email, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw { status: res.status, ...data };
    }

    return data;
  }, []);

  // Google login
  const googleLogin = useCallback(async (credential) => {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ credential }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw { status: res.status, ...data };
    }

    accessTokenRef.current = data.accessToken;
    setUser(data.user);
    scheduleRefresh();
    return data;
  }, [scheduleRefresh]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore logout errors
    }
    accessTokenRef.current = null;
    setUser(null);
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
  }, []);

  // Resend verification email
  const resendVerification = useCallback(async (email) => {
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw { status: res.status, ...data };
    }

    return data;
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    googleLogin,
    logout,
    resendVerification,
    getAccessToken,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

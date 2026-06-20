import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/resources.js';
import {
  clearStoredAuth,
  getApiErrorMessage,
  getStoredAuth,
  setStoredAuth,
} from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => getStoredAuth());
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(getStoredAuth()));

  const user = auth?.user || null;

  const refreshMe = useCallback(async () => {
    if (!getStoredAuth()?.tokens?.accessToken) {
      setLoading(false);
      return null;
    }

    try {
      const data = await authService.me();
      setAuth(current => {
        const next = { ...(current || {}), user: data.user };
        setStoredAuth(next);
        return next;
      });
      setProfile(data.profile);
      return data;
    } catch (_error) {
      clearStoredAuth();
      setAuth(null);
      setProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
    const handleLogout = () => {
      setAuth(null);
      setProfile(null);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [refreshMe]);

  const login = useCallback(
    async payload => {
      const data = await authService.login(payload);
      setStoredAuth(data);
      setAuth(data);
      await refreshMe();
      toast.success('Signed in');
      return data;
    },
    [refreshMe]
  );

  const register = useCallback(
    async payload => {
      const data = await authService.register(payload);
      setStoredAuth(data);
      setAuth(data);
      await refreshMe();
      toast.success('Account created');
      return data;
    },
    [refreshMe]
  );

  const googleLogin = useCallback(
    async idToken => {
      const data = await authService.googleLogin(idToken);
      if (data.needsLinking) return data;
      if (data.needsRoleSelection) return data;
      setStoredAuth(data);
      setAuth(data);
      await refreshMe();
      toast.success('Signed in with Google');
      return data;
    },
    [refreshMe]
  );

  const completeGoogleRegistration = useCallback(
    async (tempToken, role, extra) => {
      const data = await authService.completeGoogleRegistration(tempToken, role, extra);
      setStoredAuth(data);
      setAuth(data);
      await refreshMe();
      toast.success('Account created with Google');
      return data;
    },
    [refreshMe]
  );

  const linkGoogle = useCallback(
    async (idToken, email, password) => {
      const data = await authService.linkGoogle(idToken, email, password);
      setStoredAuth(data);
      setAuth(data);
      await refreshMe();
      toast.success('Google account linked');
      return data;
    },
    [refreshMe]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      if (error.response?.status !== 401) {
        toast.error(getApiErrorMessage(error, 'Logout failed'));
      }
    } finally {
      clearStoredAuth();
      setAuth(null);
      setProfile(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshMe,
      googleLogin,
      completeGoogleRegistration,
      linkGoogle,
    }),
    [
      user,
      profile,
      loading,
      login,
      register,
      logout,
      refreshMe,
      googleLogin,
      completeGoogleRegistration,
      linkGoogle,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};

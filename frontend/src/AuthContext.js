import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, registerUser, refreshToken as refreshTokenApi, getMe, setAuthToken } from './services/api';

const TOKEN_KEY = 'bal_access_token';
const REFRESH_KEY = 'bal_refresh_token';

async function saveToken(key, value) {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function loadToken(key) {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function removeToken(key) {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

const AuthCtx = createContext({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    try {
      const token = await loadToken(TOKEN_KEY);
      if (!token) { setLoading(false); return; }
      setAuthToken(token);
      const me = await getMe();
      setUser(me);
    } catch {
      await removeToken(TOKEN_KEY);
      await removeToken(REFRESH_KEY);
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { bootstrap(); }, [bootstrap]);

  const login = useCallback(async (username, password) => {
    const res = await loginUser({ username, password });
    await saveToken(TOKEN_KEY, res.access_token);
    await saveToken(REFRESH_KEY, res.refresh_token);
    setAuthToken(res.access_token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (data) => {
    const res = await registerUser(data);
    await saveToken(TOKEN_KEY, res.access_token);
    await saveToken(REFRESH_KEY, res.refresh_token);
    setAuthToken(res.access_token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    await removeToken(TOKEN_KEY);
    await removeToken(REFRESH_KEY);
    setAuthToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
  }), [user, loading, login, register, logout]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}

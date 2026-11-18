import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, STORAGE_KEYS } from '../services/api';
import { securityService } from '../services/security';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [sessionSource, setSessionSource] = useState(null); // 'restored' | 'fresh_login' | null
  const [isLoading, setIsLoading] = useState(true);
  const [themeMode, setThemeMode] = useState('light');
  const [demoMode, setDemoModeState] = useState(false);
  const [apiUrl, setApiUrlState] = useState(api.getBaseUrl());

  useEffect(() => {
    loadInitialState();
  }, []);

  const loadInitialState = async () => {
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1500));
    try {
      await Promise.race([
        (async () => {
          await api.init();
          const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
          const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
          const storedTheme = await AsyncStorage.getItem('@clay_theme_v2');
          const storedDemo = await AsyncStorage.getItem(STORAGE_KEYS.DEMO_MODE);

          if (storedToken && storedUser) {
            const parsedUser = JSON.parse(storedUser);
            const userKey = parsedUser?.email || parsedUser?.id;
            const lockState = await securityService.getLockState(userKey);

            if (lockState.hasPin) {
              // User has PIN / Face ID enabled: restore session and unlock via PIN/Face ID
              setToken(storedToken);
              setUser(parsedUser);
              setSessionSource('restored');
            } else {
              // No PIN / Face ID configured: require fresh Email login on reopen
              await api.setToken(null);
              await AsyncStorage.removeItem(STORAGE_KEYS.USER);
              setToken(null);
              setUser(null);
              setSessionSource(null);
            }
          }

          if (storedTheme) {
            setThemeMode(storedTheme);
          }

          if (storedDemo !== null) {
            setDemoModeState(JSON.parse(storedDemo));
          }

          setApiUrlState(api.getBaseUrl());
        })(),
        timeoutPromise
      ]);
    } catch (e) {
      console.warn('Failed to restore session:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.request('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    });

    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      setSessionSource('fresh_login');
      await api.setToken(res.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.user));
    }
    return res;
  };

  const register = async (name, email, password) => {
    const res = await api.request('/api/auth/register', {
      method: 'POST',
      body: { name, email, password }
    });

    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      setSessionSource('fresh_login');
      await api.setToken(res.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.user));
    }
    return res;
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setSessionSource(null);
    await api.setToken(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  };

  const toggleTheme = async () => {
    const nextTheme = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextTheme);
    await AsyncStorage.setItem('@clay_theme_v2', nextTheme);
  };

  const updateApiUrl = async (newUrl) => {
    await api.setBaseUrl(newUrl);
    setApiUrlState(api.getBaseUrl());
  };

  const toggleDemoMode = async (enable) => {
    const next = typeof enable === 'boolean' ? enable : !demoMode;
    await api.setDemoMode(next);
    setDemoModeState(next);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        sessionSource,
        isAuthenticated: !!token,
        isLoading,
        themeMode,
        demoMode,
        apiUrl,
        login,
        register,
        logout,
        toggleTheme,
        updateApiUrl,
        toggleDemoMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

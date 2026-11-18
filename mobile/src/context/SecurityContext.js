import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState, Platform } from 'react-native';
import { securityService } from '../services/security';
import { useAuth } from './AuthContext';

const SecurityContext = createContext(null);

export function SecurityProvider({ children }) {
  const { user, isAuthenticated, sessionSource, logout } = useAuth();
  const userKey = user?.email || user?.id || null;

  const [hasPin, setHasPin] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isSettingUpPin, setIsSettingUpPin] = useState(false);
  const [showSecurityGuide, setShowSecurityGuide] = useState(false);

  const backgroundedAt = useRef(null);

  const refreshLockState = useCallback(
    async (key = userKey) => {
      const [state, supported] = await Promise.all([
        securityService.getLockState(key),
        securityService.isBiometricSupported()
      ]);
      setHasPin(state.hasPin);
      setBiometricEnabled(state.biometricEnabled);
      setBiometricSupported(supported);
      return { state, supported };
    },
    [userKey]
  );

  // Sync per-user security state whenever authenticated user changes
  useEffect(() => {
    let active = true;

    const syncUserSecurity = async () => {
      if (!isAuthenticated || !userKey) {
        setHasPin(false);
        setBiometricEnabled(false);
        setIsLocked(false);
        setIsSettingUpPin(false);
        setShowSecurityGuide(false);
        return;
      }

      const { state } = await refreshLockState(userKey);
      if (!active) return;

      if (sessionSource === 'restored' && state.hasPin) {
        // Returning user with PIN/Face ID enabled -> Lock vault immediately
        setIsLocked(true);
        setShowSecurityGuide(false);
      } else if (sessionSource === 'fresh_login') {
        // Fresh email login -> Don't lock right away; show PIN/Face ID setup instruction if not set
        setIsLocked(false);
        if (!state.hasPin) {
          setShowSecurityGuide(true);
        }
      }
    };

    syncUserSecurity();
    return () => {
      active = false;
    };
  }, [isAuthenticated, userKey, sessionSource, refreshLockState]);

  // Auto-lock when returning from background after 15+ seconds (if PIN enabled)
  useEffect(() => {
    if (!isAuthenticated || !hasPin) return;

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const handleVisibility = () => {
        if (document.hidden) {
          backgroundedAt.current = Date.now();
        } else if (backgroundedAt.current) {
          const elapsed = Date.now() - backgroundedAt.current;
          backgroundedAt.current = null;
          if (elapsed > 15000) {
            setIsLocked(true);
          }
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);
      return () => document.removeEventListener('visibilitychange', handleVisibility);
    }

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundedAt.current = Date.now();
      } else if (nextState === 'active' && backgroundedAt.current) {
        const elapsed = Date.now() - backgroundedAt.current;
        backgroundedAt.current = null;
        if (elapsed > 15000) {
          setIsLocked(true);
        }
      }
    });
    return () => sub.remove();
  }, [isAuthenticated, hasPin]);

  const dismissSecurityGuide = () => {
    setShowSecurityGuide(false);
  };

  const startPinSetup = () => {
    setShowSecurityGuide(false);
    setIsSettingUpPin(true);
  };

  const finishPinSetup = async () => {
    setIsSettingUpPin(false);
    await refreshLockState(userKey);
  };

  const cancelPinSetup = () => {
    setIsSettingUpPin(false);
  };

  const disablePinLock = async () => {
    await securityService.disableLock(userKey);
    setHasPin(false);
    setBiometricEnabled(false);
    setIsLocked(false);
  };

  const enableBiometric = async (userLabel) => {
    await securityService.registerBiometric(userKey, userLabel || userKey);
    await refreshLockState(userKey);
  };

  const disableBiometric = async () => {
    await securityService.disableBiometric(userKey);
    await refreshLockState(userKey);
  };

  const lockNow = () => {
    if (hasPin) {
      setIsLocked(true);
    }
  };

  const unlock = () => {
    setIsLocked(false);
  };

  const switchToEmailLogin = async () => {
    setIsLocked(false);
    setIsSettingUpPin(false);
    setShowSecurityGuide(false);
    await logout();
  };

  return (
    <SecurityContext.Provider
      value={{
        userKey,
        hasPin,
        biometricEnabled,
        biometricSupported,
        isLocked,
        isSettingUpPin,
        showSecurityGuide,
        dismissSecurityGuide,
        startPinSetup,
        finishPinSetup,
        cancelPinSetup,
        disablePinLock,
        enableBiometric,
        disableBiometric,
        lockNow,
        unlock,
        switchToEmailLogin
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export const useSecurity = () => useContext(SecurityContext);

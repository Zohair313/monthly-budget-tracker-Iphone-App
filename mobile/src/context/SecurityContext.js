import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { securityService } from '../services/security';

const SecurityContext = createContext(null);

export function SecurityProvider({ children }) {
  const [hasPin, setHasPin] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isSettingUpPin, setIsSettingUpPin] = useState(false);
  const [ready, setReady] = useState(false);

  const backgroundedAt = useRef(null);

  const refreshLockState = async (lockIfEnabled = false) => {
    const [state, supported] = await Promise.all([
      securityService.getLockState(),
      securityService.isBiometricSupported()
    ]);
    setHasPin(state.hasPin);
    setBiometricEnabled(state.biometricEnabled);
    setBiometricSupported(supported);
    if (lockIfEnabled && state.hasPin) {
      setIsLocked(true);
    }
    setReady(true);
  };

  useEffect(() => {
    refreshLockState(true);
  }, []);

  // Auto-lock when returning from background after 15+ seconds
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const handleVisibility = () => {
        if (document.hidden) {
          backgroundedAt.current = Date.now();
        } else if (backgroundedAt.current && hasPin) {
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
      } else if (nextState === 'active' && backgroundedAt.current && hasPin) {
        const elapsed = Date.now() - backgroundedAt.current;
        backgroundedAt.current = null;
        if (elapsed > 15000) {
          setIsLocked(true);
        }
      }
    });
    return () => sub.remove();
  }, [hasPin]);

  const startPinSetup = () => {
    setIsSettingUpPin(true);
  };

  const finishPinSetup = async () => {
    setIsSettingUpPin(false);
    await refreshLockState(false);
  };

  const cancelPinSetup = () => {
    setIsSettingUpPin(false);
  };

  const disablePinLock = async () => {
    await securityService.disableLock();
    setHasPin(false);
    setBiometricEnabled(false);
    setIsLocked(false);
  };

  const enableBiometric = async (userLabel) => {
    await securityService.registerBiometric(userLabel);
    await refreshLockState(false);
  };

  const disableBiometric = async () => {
    await securityService.disableBiometric();
    await refreshLockState(false);
  };

  const lockNow = () => {
    if (hasPin) {
      setIsLocked(true);
    }
  };

  const unlock = () => {
    setIsLocked(false);
  };

  return (
    <SecurityContext.Provider
      value={{
        hasPin,
        biometricEnabled,
        biometricSupported,
        isLocked,
        isSettingUpPin,
        ready,
        startPinSetup,
        finishPinSetup,
        cancelPinSetup,
        disablePinLock,
        enableBiometric,
        disableBiometric,
        lockNow,
        unlock
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export const useSecurity = () => useContext(SecurityContext);

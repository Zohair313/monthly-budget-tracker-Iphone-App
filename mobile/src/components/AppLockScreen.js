import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar
} from 'react-native';
import Ionicons from './Icon';
import { securityService } from '../services/security';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export default function AppLockScreen({
  mode = 'unlock', // 'unlock' | 'setup'
  biometricEnabled = false,
  onUnlock,
  onCancel
}) {
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [step, setStep] = useState('enter'); // 'enter' | 'confirm' (for setup)
  const [errorMsg, setErrorMsg] = useState('');
  const [bioBusy, setBioBusy] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = (msg) => {
    setErrorMsg(msg);
    setPin('');
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 55, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 55, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: USE_NATIVE_DRIVER })
    ]).start();
  };

  const handleBiometric = async () => {
    if (bioBusy || mode !== 'unlock' || !biometricEnabled) return;
    setBioBusy(true);
    setErrorMsg('');
    try {
      const res = await securityService.authenticateBiometric();
      if (res.ok) {
        if (onUnlock) onUnlock();
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } finally {
      setBioBusy(false);
    }
  };

  // Auto-prompt Face ID when opening locked vault
  useEffect(() => {
    if (mode === 'unlock' && biometricEnabled) {
      const t = setTimeout(() => {
        handleBiometric();
      }, 350);
      return () => clearTimeout(t);
    }
  }, [mode, biometricEnabled]);

  const handleDigit = async (digit) => {
    if (pin.length >= 4) return;
    setErrorMsg('');
    const next = pin + digit;
    setPin(next);

    if (next.length === 4) {
      if (mode === 'unlock') {
        const valid = await securityService.verifyPin(next);
        if (valid) {
          if (onUnlock) onUnlock();
        } else {
          triggerShake('Incorrect PIN. Please try again.');
        }
      } else if (mode === 'setup') {
        if (step === 'enter') {
          setFirstPin(next);
          setPin('');
          setStep('confirm');
        } else {
          if (next === firstPin) {
            await securityService.setPin(next);
            if (onUnlock) onUnlock();
          } else {
            setFirstPin('');
            setStep('enter');
            triggerShake('PINs did not match. Start again.');
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setErrorMsg('');
    }
  };

  const titleText =
    mode === 'setup'
      ? step === 'enter'
        ? 'Create 4-Digit PIN'
        : 'Confirm Your PIN'
      : 'Budget Vault Locked';

  const subtitleText =
    mode === 'setup'
      ? step === 'enter'
        ? 'Choose a 4-digit passcode to protect your app'
        : 'Re-enter the same 4-digit PIN to confirm'
      : biometricEnabled
        ? 'Unlock with Face ID or enter your 4-digit PIN'
        : 'Enter your 4-digit PIN to continue';

  const keypadRows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9']
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7A63F1" />

      {/* Decorative Clay Glows */}
      <View style={styles.orbTop} />
      <View style={styles.orbBottom} />

      {/* Optional Cancel for Setup Mode */}
      {mode === 'setup' && onCancel && (
        <TouchableOpacity style={styles.cancelTopBtn} onPress={onCancel} activeOpacity={0.8}>
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Puffy 3D Shield Emblem */}
      <View style={styles.headerBlock}>
        <View style={styles.lockCoin}>
          <Ionicons
            name={mode === 'setup' ? 'shield-checkmark' : 'lock-closed'}
            size={36}
            color="#FFFFFF"
          />
        </View>
        <Text style={styles.title}>{titleText}</Text>
        <Text style={styles.subtitle}>{subtitleText}</Text>
      </View>

      {/* 4 Puffy PIN Dots */}
      <Animated.View
        style={[
          styles.dotsRow,
          { transform: [{ translateX: shakeAnim }] }
        ]}
      >
        {[0, 1, 2, 3].map((idx) => {
          const filled = idx < pin.length;
          return (
            <View
              key={idx}
              style={[
                styles.pinDot,
                filled && styles.pinDotFilled,
                errorMsg.length > 0 && styles.pinDotError
              ]}
            />
          );
        })}
      </Animated.View>

      {/* Feedback / Error Pill */}
      <View style={styles.feedbackSlot}>
        {errorMsg.length > 0 && (
          <View style={styles.errorPill}>
            <Ionicons name="alert-circle" size={14} color="#FFE4E6" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}
      </View>

      {/* 3D Puffy Clay Keypad */}
      <View style={styles.keypadWrap}>
        {keypadRows.map((row, rIdx) => (
          <View key={rIdx} style={styles.keypadRow}>
            {row.map((num) => (
              <TouchableOpacity
                key={num}
                style={styles.keyBtn}
                onPress={() => handleDigit(num)}
                activeOpacity={0.75}
                accessibilityLabel={`Digit ${num}`}
              >
                <Text style={styles.keyText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Bottom Row: Face ID | 0 | Backspace */}
        <View style={styles.keypadRow}>
          {mode === 'unlock' && biometricEnabled ? (
            <TouchableOpacity
              style={[styles.keyBtn, styles.bioKeyBtn]}
              onPress={handleBiometric}
              activeOpacity={0.75}
              disabled={bioBusy}
              accessibilityLabel="Unlock with Face ID"
            >
              <Ionicons name="scan-outline" size={26} color="#FFFFFF" />
              <Text style={styles.bioKeyLabel}>Face ID</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.keyPlaceholder} />
          )}

          <TouchableOpacity
            style={styles.keyBtn}
            onPress={() => handleDigit('0')}
            activeOpacity={0.75}
            accessibilityLabel="Digit 0"
          >
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.keyBtn, styles.backKeyBtn]}
            onPress={handleBackspace}
            activeOpacity={0.75}
            accessibilityLabel="Delete digit"
          >
            <Ionicons name="backspace-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#7A63F1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 999998
  },
  orbTop: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 255, 255, 0.12)'
  },
  orbBottom: {
    position: 'absolute',
    bottom: -80,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(90, 212, 148, 0.2)'
  },
  cancelTopBtn: {
    position: 'absolute',
    top: 24,
    right: 22,
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderTopWidth: 1.5,
    borderBottomWidth: 3,
    borderTopColor: 'rgba(255,255,255,0.4)',
    borderBottomColor: 'rgba(40,20,120,0.3)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 24
  },
  lockCoin: {
    width: 78,
    height: 78,
    borderRadius: 26,
    backgroundColor: '#6B52E8',
    borderTopWidth: 2.5,
    borderLeftWidth: 2,
    borderRightWidth: 1,
    borderBottomWidth: 5.5,
    borderTopColor: 'rgba(255, 255, 255, 0.6)',
    borderLeftColor: 'rgba(255, 255, 255, 0.4)',
    borderRightColor: 'rgba(0, 0, 0, 0.08)',
    borderBottomColor: '#4A32C2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#3B22B0',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
    textAlign: 'center'
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginBottom: 14
  },
  pinDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  },
  pinDotFilled: {
    backgroundColor: '#86F0B8',
    borderColor: '#FFFFFF',
    shadowColor: '#86F0B8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4
  },
  pinDotError: {
    borderColor: '#FCA5A5'
  },
  feedbackSlot: {
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  errorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(225, 29, 72, 0.32)',
    borderWidth: 1,
    borderColor: 'rgba(254, 205, 211, 0.5)'
  },
  errorText: {
    color: '#FFE4E6',
    fontSize: 11,
    fontWeight: '700'
  },
  keypadWrap: {
    width: '100%',
    maxWidth: 296,
    gap: 14
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16
  },
  keyBtn: {
    flex: 1,
    height: 66,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderTopWidth: 2,
    borderLeftWidth: 1.5,
    borderRightWidth: 1,
    borderBottomWidth: 4.5,
    borderTopColor: 'rgba(255, 255, 255, 0.45)',
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
    borderRightColor: 'rgba(0, 0, 0, 0.06)',
    borderBottomColor: 'rgba(48, 25, 145, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B22B0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5
  },
  keyPlaceholder: {
    flex: 1,
    height: 66
  },
  bioKeyBtn: {
    backgroundColor: 'rgba(90, 212, 148, 0.32)',
    borderTopColor: 'rgba(154, 245, 196, 0.65)',
    borderBottomColor: 'rgba(30, 130, 80, 0.5)'
  },
  bioKeyLabel: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2
  },
  backKeyBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)'
  },
  keyText: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800'
  }
});

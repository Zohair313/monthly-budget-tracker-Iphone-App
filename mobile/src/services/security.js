import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

function normalizeUserKey(userKey) {
  return String(userKey || 'default')
    .trim()
    .toLowerCase();
}

function keysFor(userKey) {
  const k = normalizeUserKey(userKey);
  return {
    PIN_HASH: `@budget_lock_pin_v2::${k}`,
    BIOMETRIC_ENABLED: `@budget_lock_bio_v2::${k}`,
    CRED_ID: `@budget_lock_cred_v2::${k}`
  };
}

// Lightweight deterministic hash (works offline across Web & React Native)
function hashPin(pin, userKey) {
  const salted = `budget_vault_2026::${normalizeUserKey(userKey)}::${String(pin)}::clay`;
  let h1 = 0xdeadbeef ^ salted.length;
  let h2 = 0x41c6ce57 ^ salted.length;
  for (let i = 0; i < salted.length; i++) {
    const ch = salted.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0).toString(16).padStart(8, '0')}`;
}

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export const securityService = {
  async getLockState(userKey) {
    if (!userKey) {
      return { hasPin: false, biometricEnabled: false };
    }
    const keys = keysFor(userKey);
    const [pinHash, bioEnabled, credId] = await Promise.all([
      AsyncStorage.getItem(keys.PIN_HASH),
      AsyncStorage.getItem(keys.BIOMETRIC_ENABLED),
      AsyncStorage.getItem(keys.CRED_ID)
    ]);
    return {
      hasPin: Boolean(pinHash),
      biometricEnabled: bioEnabled === 'true' && Boolean(credId)
    };
  },

  async setPin(userKey, pin) {
    if (!userKey) throw new Error('No active user account.');
    if (!/^\d{4}$/.test(String(pin))) {
      throw new Error('PIN must be exactly 4 digits.');
    }
    const keys = keysFor(userKey);
    await AsyncStorage.setItem(keys.PIN_HASH, hashPin(pin, userKey));
  },

  async verifyPin(userKey, pin) {
    if (!userKey) return false;
    const keys = keysFor(userKey);
    const stored = await AsyncStorage.getItem(keys.PIN_HASH);
    if (!stored) return true;
    return stored === hashPin(pin, userKey);
  },

  async disableLock(userKey) {
    if (!userKey) return;
    const keys = keysFor(userKey);
    await AsyncStorage.multiRemove([keys.PIN_HASH, keys.BIOMETRIC_ENABLED, keys.CRED_ID]);
  },

  async disableBiometric(userKey) {
    if (!userKey) return;
    const keys = keysFor(userKey);
    await AsyncStorage.multiRemove([keys.BIOMETRIC_ENABLED, keys.CRED_ID]);
  },

  async isBiometricSupported() {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
    if (!window.isSecureContext || !window.PublicKeyCredential || !navigator.credentials) {
      return false;
    }
    try {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  },

  async registerBiometric(userKey, userLabel = 'Budget Tracker User') {
    if (!userKey) throw new Error('No active user account.');
    const supported = await this.isBiometricSupported();
    if (!supported) {
      throw new Error('Face ID / Touch ID requires HTTPS on a supported iPhone, Android, or Mac.');
    }

    const challenge = new Uint8Array(32);
    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(challenge);
    window.crypto.getRandomValues(userId);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Budget Tracker',
          id: window.location.hostname
        },
        user: {
          id: userId,
          name: userLabel,
          displayName: userLabel
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256 (Apple Face ID / Touch ID)
          { alg: -257, type: 'public-key' } // RS256 fallback
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred'
        },
        timeout: 60000,
        attestation: 'none'
      }
    });

    if (!credential || !credential.rawId) {
      throw new Error('Face ID setup was cancelled.');
    }

    const keys = keysFor(userKey);
    await AsyncStorage.setItem(keys.CRED_ID, bufferToBase64(credential.rawId));
    await AsyncStorage.setItem(keys.BIOMETRIC_ENABLED, 'true');
    return true;
  },

  async authenticateBiometric(userKey) {
    if (!userKey) return { ok: false, error: 'No active user account.' };
    const supported = await this.isBiometricSupported();
    if (!supported) {
      return { ok: false, error: 'Face ID / Touch ID is unavailable on this browser.' };
    }

    const keys = keysFor(userKey);
    const credIdBase64 = await AsyncStorage.getItem(keys.CRED_ID);
    if (!credIdBase64) {
      return { ok: false, error: 'Face ID is not registered for this account.' };
    }

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: window.location.hostname,
          allowCredentials: [
            {
              id: base64ToUint8Array(credIdBase64),
              type: 'public-key',
              transports: ['internal']
            }
          ],
          userVerification: 'required',
          timeout: 60000
        }
      });

      if (assertion) {
        return { ok: true };
      }
      return { ok: false, error: 'Face ID verification failed.' };
    } catch (err) {
      return { ok: false, error: err?.message || 'Face ID cancelled. Enter your 4-digit PIN.' };
    }
  }
};

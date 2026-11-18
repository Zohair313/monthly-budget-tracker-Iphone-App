import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert
} from 'react-native';
import Ionicons from './Icon';
import { useAuth } from '../context/AuthContext';
import { useSecurity } from '../context/SecurityContext';
import { palette, getClayCard, getClayButton, getClayInput, getClayPill } from '../theme/colors';

export default function ServerConfigModal({ visible, onClose }) {
  const {
    user,
    isAuthenticated,
    logout,
    apiUrl,
    updateApiUrl,
    demoMode,
    toggleDemoMode,
    themeMode
  } = useAuth();
  const {
    hasPin,
    biometricEnabled,
    biometricSupported,
    startPinSetup,
    disablePinLock,
    enableBiometric,
    disableBiometric,
    lockNow
  } = useSecurity();

  const colors = palette[themeMode] || palette.light;
  const clayCard = getClayCard(themeMode);
  const clayButton = getClayButton(themeMode, colors.primary, colors.primaryDark);
  const clayInput = getClayInput(themeMode);
  const clayPill = getClayPill(themeMode);

  const [inputUrl, setInputUrl] = useState('');
  const [isPinging, setIsPinging] = useState(false);
  const [pingStatus, setPingStatus] = useState(null);
  const [securityMsg, setSecurityMsg] = useState('');
  const [bioBusy, setBioBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      setInputUrl(apiUrl);
      setPingStatus(null);
      setSecurityMsg('');
    }
  }, [visible, apiUrl]);

  const handleTogglePin = async (val) => {
    setSecurityMsg('');
    if (val) {
      onClose();
      startPinSetup();
    } else {
      await disablePinLock();
      setSecurityMsg('PIN & Face ID Lock disabled.');
    }
  };

  const handleChangePin = () => {
    onClose();
    startPinSetup();
  };

  const handleToggleBiometric = async (val) => {
    setSecurityMsg('');
    if (!hasPin) {
      setSecurityMsg('First enable 4-Digit PIN Lock, then turn on Face ID.');
      return;
    }
    if (val) {
      setBioBusy(true);
      try {
        await enableBiometric(user?.email || user?.name || 'Budget Tracker');
        setSecurityMsg('✓ Face ID / Touch ID enabled!');
      } catch (err) {
        setSecurityMsg(err?.message || 'Face ID setup cancelled.');
      } finally {
        setBioBusy(false);
      }
    } else {
      await disableBiometric();
      setSecurityMsg('Face ID disabled (4-Digit PIN still active).');
    }
  };

  const handleLockNow = () => {
    onClose();
    setTimeout(() => lockNow(), 120);
  };

  const handleSwitchAccount = async () => {
    onClose();
    await logout();
  };

  const handleSave = async () => {
    if (!inputUrl.trim()) {
      Alert.alert('Invalid URL', 'Please provide a valid backend URL.');
      return;
    }
    await updateApiUrl(inputUrl.trim());
    onClose();
  };

  const handlePing = async () => {
    setIsPinging(true);
    setPingStatus(null);
    const targetUrl = inputUrl.trim().replace(/\/+$/, '') + '/api/health';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(targetUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        setPingStatus({ ok: true, msg: 'Backend online & reachable!' });
      } else {
        setPingStatus({ ok: false, msg: `HTTP ${res.status}: Server returned error.` });
      }
    } catch {
      setPingStatus({
        ok: false,
        msg: 'Connection failed. Check URL or internet.'
      });
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, clayCard]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="settings-outline" size={21} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>App Settings</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Security Vault & Cloud Sync
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              accessibilityLabel="Close Settings"
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* SECTION 0: ACTIVE ACCOUNT & MULTI-USER SWITCHER */}
            {isAuthenticated && user && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.primary }]}>
                  SIGNED-IN ACCOUNT
                </Text>
                <View
                  style={[styles.accountCard, clayPill, { backgroundColor: colors.surfaceSubtle }]}
                >
                  <View style={styles.accountRow}>
                    <View style={[styles.accountAvatar, { backgroundColor: colors.primary }]}>
                      <Text style={styles.accountAvatarText}>
                        {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.settingInfo}>
                      <Text style={[styles.settingTitle, { color: colors.text }]} numberOfLines={1}>
                        {user.name || 'Account Holder'}
                      </Text>
                      <Text
                        style={[styles.settingDesc, { color: colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {user.email}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleSwitchAccount}
                    style={[
                      styles.logoutBtn,
                      { backgroundColor: colors.expenseLight, borderColor: colors.expense }
                    ]}
                    activeOpacity={0.82}
                  >
                    <Ionicons name="log-out-outline" size={16} color={colors.expense} />
                    <Text style={[styles.logoutBtnText, { color: colors.expense }]}>
                      Log Out / Switch Email Account
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* SECTION 1: SECURITY & VAULT LOCK (PIN + FACE ID) */}
            {isAuthenticated && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.primary }]}>
                  SECURITY & APP LOCK
                </Text>

                <View
                  style={[styles.securityCard, clayPill, { backgroundColor: colors.surfaceSubtle }]}
                >
                  {/* 4-Digit PIN Lock Row */}
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <View style={styles.settingTitleRow}>
                        <Ionicons name="lock-closed" size={16} color={colors.primary} />
                        <Text style={[styles.settingTitle, { color: colors.text }]}>
                          4-Digit PIN Lock
                        </Text>
                      </View>
                      <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                        {hasPin
                          ? 'Active • Unlock with PIN/Face ID on reopen'
                          : 'OFF • Requires Email login on next reopen'}
                      </Text>
                    </View>
                    <Switch
                      value={hasPin}
                      onValueChange={handleTogglePin}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

                  {/* Face ID / Touch ID Row */}
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <View style={styles.settingTitleRow}>
                        <Ionicons name="scan-outline" size={16} color={colors.income} />
                        <Text style={[styles.settingTitle, { color: colors.text }]}>
                          Face ID / Touch ID
                        </Text>
                      </View>
                      <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                        {biometricEnabled
                          ? 'Enabled for this email account'
                          : biometricSupported
                            ? 'Instant biometric unlock on iPhone'
                            : 'Set PIN first (requires iPhone HTTPS)'}
                      </Text>
                    </View>
                    <Switch
                      value={biometricEnabled}
                      onValueChange={handleToggleBiometric}
                      disabled={bioBusy || !hasPin}
                      trackColor={{ false: colors.border, true: colors.income }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  {/* Quick Actions when PIN is active */}
                  {hasPin && (
                    <View style={styles.pinActionsRow}>
                      <TouchableOpacity
                        onPress={handleChangePin}
                        style={[
                          styles.pinMiniBtn,
                          { backgroundColor: colors.surface, borderColor: colors.border }
                        ]}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="key-outline" size={14} color={colors.primary} />
                        <Text style={[styles.pinMiniText, { color: colors.primary }]}>
                          Change PIN
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleLockNow}
                        style={[
                          styles.pinMiniBtn,
                          { backgroundColor: colors.primary, borderColor: colors.primary }
                        ]}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="lock-closed" size={14} color="#FFFFFF" />
                        <Text style={[styles.pinMiniText, { color: '#FFFFFF' }]}>Lock Now</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </>
            )}

            {securityMsg.length > 0 && (
              <View
                style={[
                  styles.msgBanner,
                  {
                    backgroundColor: securityMsg.includes('✓')
                      ? colors.incomeLight
                      : colors.primaryLight
                  }
                ]}
              >
                <Text
                  style={[
                    styles.msgText,
                    { color: securityMsg.includes('✓') ? colors.incomeDark : colors.primary }
                  ]}
                >
                  {securityMsg}
                </Text>
              </View>
            )}

            {/* SECTION 2: CLOUD SERVER & OFFLINE MODE */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 14 }]}>
              CLOUD BACKEND & SYNC
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                BACKEND API URL
              </Text>
              <View style={[styles.inputBox, clayInput]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="https://monthly-budget-tracker-iphone-app.vercel.app"
                  placeholderTextColor={colors.textTertiary}
                  value={inputUrl}
                  onChangeText={setInputUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.pingRow}>
              <TouchableOpacity
                onPress={handlePing}
                style={[styles.pingBtn, clayPill, { backgroundColor: colors.surfaceSubtle }]}
                disabled={isPinging}
              >
                <Ionicons
                  name={isPinging ? 'hourglass-outline' : 'radio-outline'}
                  size={14}
                  color={colors.primary}
                />
                <Text style={[styles.pingBtnText, { color: colors.primary }]}>
                  {isPinging ? 'Testing...' : 'Test Connection'}
                </Text>
              </TouchableOpacity>

              {pingStatus && (
                <View style={styles.pingResult}>
                  <Ionicons
                    name={pingStatus.ok ? 'checkmark-circle' : 'close-circle'}
                    size={15}
                    color={pingStatus.ok ? colors.income : colors.expense}
                  />
                  <Text
                    style={[
                      styles.pingResultText,
                      { color: pingStatus.ok ? colors.income : colors.expense }
                    ]}
                    numberOfLines={1}
                  >
                    {pingStatus.msg}
                  </Text>
                </View>
              )}
            </View>

            {/* Offline Demo Mode Toggle */}
            <View style={[styles.demoBox, clayPill, { backgroundColor: colors.surfaceSubtle }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Offline Demo Mode</Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  Use local sample data without server
                </Text>
              </View>
              <Switch
                value={demoMode}
                onValueChange={(val) => toggleDemoMode(val)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Stacked Action Buttons */}
            <View style={styles.actionStack}>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.saveBtn, clayButton]}
                activeOpacity={0.85}
              >
                <Text style={styles.saveBtnText}>Save Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                style={[styles.cancelBtn, { backgroundColor: colors.surfaceSubtle }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 16, 40, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    padding: 22
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3
  },
  modalSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  scrollArea: {
    maxHeight: 480
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 8
  },
  accountCard: {
    padding: 14,
    borderRadius: 18,
    marginBottom: 14,
    gap: 12
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  accountAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  accountAvatarText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900'
  },
  logoutBtn: {
    width: '100%',
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '800'
  },
  securityCard: {
    padding: 14,
    borderRadius: 18,
    marginBottom: 10
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  settingInfo: {
    flex: 1
  },
  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '800'
  },
  settingDesc: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2
  },
  rowDivider: {
    height: 1,
    marginVertical: 12,
    opacity: 0.6
  },
  pinActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12
  },
  pinMiniBtn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  pinMiniText: {
    fontSize: 12,
    fontWeight: '800'
  },
  msgBanner: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center'
  },
  msgText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center'
  },
  inputGroup: {
    marginBottom: 10
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 5
  },
  inputBox: {
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center'
  },
  textInput: {
    fontSize: 12,
    fontWeight: '600',
    padding: 0
  },
  pingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  pingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  pingBtnText: {
    fontSize: 11,
    fontWeight: '800'
  },
  pingResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1
  },
  pingResultText: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1
  },
  demoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
    gap: 10
  },
  actionStack: {
    gap: 10,
    paddingBottom: 4
  },
  saveBtn: {
    width: '100%',
    height: 46,
    alignItems: 'center',
    justifyContent: 'center'
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  cancelBtn: {
    width: '100%',
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700'
  }
});

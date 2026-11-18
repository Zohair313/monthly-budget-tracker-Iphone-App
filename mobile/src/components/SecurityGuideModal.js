import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import Ionicons from './Icon';
import { useAuth } from '../context/AuthContext';
import { palette, getClayCard, getClayButton } from '../theme/colors';

export default function SecurityGuideModal({ visible, onSetupNow, onSkip }) {
  const { user, themeMode } = useAuth();
  const colors = palette[themeMode] || palette.light;
  const clayCard = getClayCard(themeMode);
  const primaryClayBtn = getClayButton(themeMode, '#7259EE', '#4E35C4');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, clayCard]}>
          {/* Top 3D Clay Shield Emblem */}
          <View style={styles.emblemWrap}>
            <View style={styles.shieldCoin}>
              <Ionicons name="shield-checkmark" size={34} color="#FFFFFF" />
            </View>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            Welcome, {user?.name || 'User'}!
          </Text>
          <Text
            style={[
              styles.emailPill,
              { color: colors.primary, backgroundColor: colors.primaryLight }
            ]}
          >
            {user?.email || ''}
          </Text>

          {/* Clear Instructions */}
          <View
            style={[
              styles.guideBox,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }
            ]}
          >
            <View style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="lock-closed" size={13} color="#FFFFFF" />
              </View>
              <Text style={[styles.stepText, { color: colors.text }]}>
                Set up a <Text style={styles.bold}>4-Digit PIN & Face ID</Text> now for instant
                one-tap unlock.
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: colors.income }]}>
                <Ionicons name="settings" size={13} color="#FFFFFF" />
              </View>
              <Text style={[styles.stepText, { color: colors.text }]}>
                You can change or update your PIN & Face ID anytime from{' '}
                <Text style={styles.bold}>Settings</Text>.
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: colors.tileCyan }]}>
                <Ionicons name="mail-outline" size={13} color="#FFFFFF" />
              </View>
              <Text style={[styles.stepText, { color: colors.text }]}>
                If you skip, you'll simply <Text style={styles.bold}>log in with your email</Text>{' '}
                next time you reopen the app.
              </Text>
            </View>
          </View>

          {/* Stacked Full-Width Clay Buttons */}
          <View style={styles.actionStack}>
            <TouchableOpacity
              onPress={onSetupNow}
              style={[styles.primaryBtn, primaryClayBtn]}
              activeOpacity={0.85}
            >
              <Ionicons name="scan-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Set Up PIN & Face ID Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onSkip}
              style={[styles.secondaryBtn, { backgroundColor: colors.surfaceSubtle }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>
                Skip — Use Email Next Time
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 16, 40, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    alignItems: 'center'
  },
  emblemWrap: {
    marginBottom: 14
  },
  shieldCoin: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: '#7259EE',
    borderTopWidth: 2.5,
    borderLeftWidth: 1.5,
    borderBottomWidth: 5,
    borderTopColor: 'rgba(255, 255, 255, 0.55)',
    borderLeftColor: 'rgba(255, 255, 255, 0.35)',
    borderBottomColor: '#4A32C2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5138CC',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    textAlign: 'center'
  },
  emailPill: {
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    marginBottom: 16,
    overflow: 'hidden'
  },
  guideBox: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginBottom: 18
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500'
  },
  bold: {
    fontWeight: '800'
  },
  actionStack: {
    width: '100%',
    gap: 10
  },
  primaryBtn: {
    width: '100%',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  secondaryBtn: {
    width: '100%',
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '700'
  }
});

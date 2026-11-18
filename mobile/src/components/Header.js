import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Ionicons from './Icon';
import { useAuth } from '../context/AuthContext';
import { useBudget } from '../context/BudgetContext';
import { palette } from '../theme/colors';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Header({ onOpenSettings }) {
  const { user, logout, themeMode, toggleTheme } = useAuth();
  const { selectedMonth, selectedYear, nextMonth, prevMonth } = useBudget();
  const colors = palette[themeMode] || palette.light;
  const isDark = themeMode === 'dark';

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of Monthly Budget Tracker?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => logout()
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.topBackdrop }]}>
      {/* Left: 4-Dot Grid / Settings Button (Mockup Style) */}
      <TouchableOpacity
        style={styles.frostedClayBtn}
        onPress={onOpenSettings}
        activeOpacity={0.8}
        accessibilityLabel="App Settings"
      >
        <Ionicons name="grid-outline" size={18} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Center: Puffy Frosted Violet Month Capsule */}
      <View style={styles.monthCapsule}>
        <TouchableOpacity
          onPress={prevMonth}
          style={styles.chevronTouch}
          accessibilityLabel="Previous month"
        >
          <Ionicons name="chevron-back" size={15} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.monthText}>
          {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
        </Text>

        <TouchableOpacity
          onPress={nextMonth}
          style={styles.chevronTouch}
          accessibilityLabel="Next month"
        >
          <Ionicons name="chevron-forward" size={15} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Right: Theme Toggle & Glossy Clay Avatar */}
      <View style={styles.rightGroup}>
        <TouchableOpacity
          style={styles.frostedClayBtnSmall}
          onPress={toggleTheme}
          activeOpacity={0.8}
          accessibilityLabel="Toggle Theme"
        >
          <Ionicons
            name={isDark ? 'sunny' : 'moon'}
            size={15}
            color={isDark ? '#FDE047' : '#FFFFFF'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogout}
          style={styles.avatarRing}
          activeOpacity={0.85}
          accessibilityLabel="User Profile & Logout"
        >
          <View style={styles.avatarInner}>
            <Text style={styles.avatarText}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12
  },
  frostedClayBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderTopWidth: 1.5,
    borderBottomWidth: 3,
    borderTopColor: 'rgba(255, 255, 255, 0.42)',
    borderBottomColor: 'rgba(40, 20, 120, 0.28)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  frostedClayBtnSmall: {
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderTopWidth: 1.5,
    borderBottomWidth: 3,
    borderTopColor: 'rgba(255, 255, 255, 0.42)',
    borderBottomColor: 'rgba(40, 20, 120, 0.28)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  monthCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderTopWidth: 1.5,
    borderBottomWidth: 3,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    borderBottomColor: 'rgba(40, 20, 120, 0.25)',
    gap: 6
  },
  chevronTouch: {
    padding: 4
  },
  monthText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.1
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  avatarRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    padding: 2.5,
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(40, 20, 120, 0.3)',
    shadowColor: '#362199',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  avatarInner: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#9080F8',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900'
  }
});

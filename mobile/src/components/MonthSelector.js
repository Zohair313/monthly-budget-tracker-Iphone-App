import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from './Icon';
import { useBudget } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import { palette, getClayCard, getClayPill } from '../theme/colors';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MonthSelector() {
  const { selectedMonth, selectedYear, nextMonth, prevMonth, changeMonth } = useBudget();
  const { themeMode } = useAuth();
  const colors = palette[themeMode] || palette.dark;
  const clayCard = getClayCard(themeMode);
  const clayPill = getClayPill(themeMode);

  const currentDate = new Date();
  const isCurrentMonth = selectedMonth === (currentDate.getMonth() + 1) && selectedYear === currentDate.getFullYear();

  const handleJumpToCurrent = () => {
    changeMonth(currentDate.getMonth() + 1, currentDate.getFullYear());
  };

  return (
    <View style={[styles.container, clayCard]}>
      <TouchableOpacity
        style={[
          styles.clayArrowBtn,
          {
            backgroundColor: colors.surfaceSubtle,
            borderTopColor: colors.clayBorderTop,
            borderLeftColor: colors.clayBorderLeft,
            borderRightColor: colors.clayBorderRight,
            borderBottomColor: colors.clayBorderBottom,
            shadowColor: colors.clayShadowColor
          }
        ]}
        onPress={prevMonth}
        accessibilityLabel="Previous Month"
      >
        <Ionicons name="chevron-back" size={18} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.centerInfo}>
        <View style={styles.monthRow}>
          <Text style={[styles.monthText, { color: colors.text }]}>
            {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </Text>
          {isCurrentMonth ? (
            <View
              style={[
                styles.currentBadge,
                clayPill,
                {
                  backgroundColor: colors.primaryLight,
                  borderBottomColor: colors.primaryDark
                }
              ]}
            >
              <Text style={[styles.currentBadgeText, { color: colors.primary }]}>Current</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleJumpToCurrent}
              style={[
                styles.jumpBadge,
                clayPill,
                {
                  backgroundColor: colors.surfaceSubtle
                }
              ]}
            >
              <Text style={[styles.jumpBadgeText, { color: colors.textSecondary }]}>Jump to Today</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.clayArrowBtn,
          {
            backgroundColor: colors.surfaceSubtle,
            borderTopColor: colors.clayBorderTop,
            borderLeftColor: colors.clayBorderLeft,
            borderRightColor: colors.clayBorderRight,
            borderBottomColor: colors.clayBorderBottom,
            shadowColor: colors.clayShadowColor
          }
        ]}
        onPress={nextMonth}
        accessibilityLabel="Next Month"
      >
        <Ionicons name="chevron-forward" size={18} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  clayArrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderTopWidth: 2,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3
  },
  centerInfo: {
    alignItems: 'center'
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  monthText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3
  },
  currentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  jumpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3
  },
  jumpBadgeText: {
    fontSize: 11,
    fontWeight: '600'
  }
});

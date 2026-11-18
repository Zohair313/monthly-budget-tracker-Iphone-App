import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from './Icon';
import { useBudget } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import { palette, getClayCard, getClayPill } from '../theme/colors';

export default function BudgetAlertBanner() {
  const { summary } = useBudget();
  const { themeMode } = useAuth();
  const colors = palette[themeMode] || palette.dark;
  const clayCard = getClayCard(themeMode);
  const clayPill = getClayPill(themeMode);

  const burnRate = summary.burn_rate_percent || 0;
  const remainingBalance = summary.remaining_balance;
  const isOverBudget = remainingBalance !== undefined && remainingBalance < 0;
  const isBudgetAlert = summary.is_budget_alert || burnRate >= 80;

  if (!isBudgetAlert && !isOverBudget) {
    return null;
  }

  const alertBg = isOverBudget ? colors.expenseLight : colors.warningLight;
  const alertColor = isOverBudget ? colors.expense : colors.warning;
  const alertBorderBottom = isOverBudget ? colors.expenseDark : colors.warningDark;
  const title = isOverBudget ? 'Budget Exceeded (Deficit)' : 'Budget Threshold Alert (80%)';
  const description = isOverBudget
    ? `You have exceeded your total income by Rs. ${Math.abs(remainingBalance).toLocaleString()}. Reduce non-essential spending.`
    : `You have consumed ${burnRate}% of your monthly income. Please monitor upcoming expenses closely.`;

  return (
    <View
      style={[
        styles.container,
        clayCard,
        {
          backgroundColor: alertBg,
          borderBottomColor: alertBorderBottom,
          shadowColor: alertBorderBottom
        }
      ]}
    >
      <View
        style={[
          styles.iconCoin,
          {
            backgroundColor: alertColor,
            borderTopColor: 'rgba(255, 255, 255, 0.45)',
            borderBottomColor: alertBorderBottom
          }
        ]}
      >
        <Ionicons name={isOverBudget ? 'alert' : 'warning'} size={20} color="#FFFFFF" />
      </View>

      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: alertColor }]}>{title}</Text>
          <View
            style={[
              styles.percentPill,
              clayPill,
              {
                backgroundColor: colors.surface,
                borderBottomColor: alertBorderBottom
              }
            ]}
          >
            <Text style={[styles.percentText, { color: alertColor }]}>{burnRate}%</Text>
          </View>
        </View>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  iconCoin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderTopWidth: 2,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  textContainer: {
    flex: 1
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2
  },
  percentPill: {
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  percentText: {
    fontSize: 11,
    fontWeight: '800'
  },
  description: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500'
  }
});

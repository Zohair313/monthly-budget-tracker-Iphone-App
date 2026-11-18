import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from './Icon';
import { useBudget } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import { palette, getClayCard } from '../theme/colors';

const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return `Rs. ${num.toLocaleString('en-US')}`;
};

export default function MonthComparisonCard() {
  const { summary } = useBudget();
  const { themeMode } = useAuth();
  const colors = palette[themeMode] || palette.light;
  const clayCard = getClayCard(themeMode);

  const comparison = summary.comparison_with_prev_month;
  if (!comparison) return null;

  const prevExpense = comparison.prev_expense || 0;
  const currentExpense = summary.total_expense || 0;
  const isIncrease = currentExpense > prevExpense;
  const iconName = isIncrease ? 'trending-up' : 'trending-down';

  return (
    <View style={[styles.container, clayCard]}>
      <View style={styles.cardTouch}>
        <View style={styles.cardLeft}>
          {/* Puffy 3D Solid Lavender Clay Icon Square (Mockup Style) */}
          <View
            style={[
              styles.iconCoin,
              {
                backgroundColor: colors.tileViolet,
                borderTopColor: colors.tileVioletTop,
                borderLeftColor: colors.tileVioletTop,
                borderBottomColor: colors.tileVioletBottom,
                shadowColor: colors.tileVioletBottom
              }
            ]}
          >
            <Ionicons name={iconName} size={23} color="#FFFFFF" />
          </View>

          <View style={styles.cardTextGroup}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Previous Month</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              Last Month's Spending
            </Text>
          </View>
        </View>

        {/* Right: Clean Bold Amount */}
        <View style={styles.cardRight}>
          <Text style={[styles.amountText, { color: colors.primary }]}>
            {formatCurrency(prevExpense)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 24,
    marginBottom: 14
  },
  cardTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 78
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14
  },
  iconCoin: {
    width: 50,
    height: 50,
    borderRadius: 16,
    borderTopWidth: 2,
    borderLeftWidth: 1.5,
    borderRightWidth: 1,
    borderBottomWidth: 4,
    borderRightColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  cardTextGroup: {
    flex: 1
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  amountText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.4
  }
});

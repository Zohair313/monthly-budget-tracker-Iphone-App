import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import Ionicons from './Icon';
import { useBudget } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import { palette, getClayCard, getClayInput, getClayPill } from '../theme/colors';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function SetIncomeModal({ visible, onClose }) {
  const { selectedMonth, selectedYear, incomeData, updateIncome } = useBudget();
  const { themeMode } = useAuth();
  const colors = palette[themeMode] || palette.light;
  const isDark = themeMode === 'dark';
  const clayCard = getClayCard(themeMode);
  const clayInput = getClayInput(themeMode);
  const clayPill = getClayPill(themeMode);

  const [amountStr, setAmountStr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    if (visible) {
      setAmountStr(incomeData?.amount ? String(incomeData.amount) : '');
      setErrorText('');
    }
  }, [visible, incomeData]);

  const handleSubmit = async () => {
    setErrorText('');
    const num = parseFloat(amountStr);

    if (isNaN(num) || num < 0) {
      setErrorText('Please enter a valid non-negative income amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateIncome(num);
      onClose();
    } catch (err) {
      setErrorText(err.message || 'Failed to update income.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreset = (val) => {
    setAmountStr(String(val));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.modalCard, clayCard, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: colors.incomeLight,
                    borderColor: colors.income
                  }
                ]}
              >
                <Ionicons name="wallet-outline" size={22} color={colors.income} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Set Monthly Income</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              accessibilityLabel="Close Modal"
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Explanatory Policy Banner */}
          <View
            style={[
              styles.infoBanner,
              clayPill,
              {
                backgroundColor: colors.incomeLight,
                borderColor: colors.incomeBorder
              }
            ]}
          >
            <Ionicons name="information-circle-outline" size={18} color={colors.income} />
            <Text style={[styles.infoBannerText, { color: colors.incomeDark }]}>
              Setting your monthly income dynamically updates your remaining balance.
            </Text>
          </View>

          {/* Field 1: Amount Input (Full Width Box) */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              INCOME AMOUNT (PKR / RS)
            </Text>
            <View style={[styles.inputBox, clayInput, { backgroundColor: colors.surfaceSubtle }]}>
              <Text style={[styles.currencyPrefix, { color: colors.income }]}>Rs.</Text>
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                keyboardType="numeric"
                placeholder="100000"
                placeholderTextColor={colors.textTertiary}
                value={amountStr}
                onChangeText={setAmountStr}
                autoFocus
              />
            </View>
          </View>

          {/* Field 2: Quick Presets (4 Equal Boxes) */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>QUICK PRESETS</Text>
            <View style={styles.presetsRow}>
              {[50000, 100000, 150000, 200000].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  onPress={() => handlePreset(preset)}
                  style={[
                    styles.presetBox,
                    {
                      backgroundColor: amountStr === String(preset) ? colors.income : colors.surfaceSubtle,
                      borderColor: amountStr === String(preset) ? colors.income : (isDark ? '#334155' : '#E2E8F0')
                    }
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.presetText,
                      {
                        color: amountStr === String(preset) ? '#FFFFFF' : colors.text,
                        fontWeight: amountStr === String(preset) ? '800' : '600'
                      }
                    ]}
                  >
                    Rs. {preset / 1000}k
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {errorText.length > 0 && (
            <View
              style={[
                styles.errorBox,
                clayPill,
                {
                  backgroundColor: colors.expenseLight,
                  borderColor: colors.expense
                }
              ]}
            >
              <Ionicons name="alert-circle-outline" size={14} color={colors.expense} />
              <Text style={[styles.errorText, { color: colors.expense }]}>{errorText}</Text>
            </View>
          )}

          {/* Action Stack: Stacked One Below the Other */}
          <View style={styles.actionStack}>
            {/* Primary Submit Button (100% Width) */}
            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.primarySubmitBtn, { backgroundColor: colors.income }]}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.primarySubmitBtnText}>
                {isSubmitting ? 'Saving...' : 'Save Monthly Income'}
              </Text>
            </TouchableOpacity>

            {/* Secondary Cancel Button (100% Width) */}
            <TouchableOpacity
              onPress={onClose}
              style={[styles.secondaryCancelBtn, { backgroundColor: colors.surfaceSubtle }]}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryCancelBtnText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
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
    borderWidth: 1,
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500'
  },
  inputGroup: {
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    borderWidth: 1
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '800',
    marginRight: 8
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    padding: 0
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between'
  },
  presetBox: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  presetText: {
    fontSize: 11
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14
  },
  errorText: {
    fontSize: 11,
    fontWeight: '700'
  },
  actionStack: {
    marginTop: 6,
    gap: 10
  },
  primarySubmitBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3
  },
  primarySubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  secondaryCancelBtn: {
    width: '100%',
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryCancelBtnText: {
    fontSize: 13,
    fontWeight: '700'
  }
});

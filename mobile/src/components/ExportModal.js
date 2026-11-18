import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import Ionicons from './Icon';
import { useBudget } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import { palette, getClayCard, getClayButton, getClayPill } from '../theme/colors';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ExportModal({ visible, onClose }) {
  const { selectedMonth, selectedYear, summary, expenses } = useBudget();
  const { user, themeMode } = useAuth();
  const colors = palette[themeMode] || palette.dark;
  const clayCard = getClayCard(themeMode);
  const clayButton = getClayButton(themeMode, colors.primary, colors.primaryDark);
  const clayPill = getClayPill(themeMode);

  const [copied, setCopied] = useState(false);

  // Generate CSV Data
  const generateCsv = () => {
    let csv = `Monthly Budget Tracker Report - ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}\n`;
    csv += `Generated for: ${user?.name || user?.email || 'User'}\n`;
    csv += `Total Income: Rs. ${summary.total_income || 0}\n`;
    csv += `Total Expense: Rs. ${summary.total_expense || 0}\n`;
    csv += `Remaining Balance: Rs. ${summary.remaining_balance || 0}\n\n`;

    csv += `Date,Expense Name,Category,Amount (Rs.)\n`;
    expenses.forEach((e) => {
      csv += `"${e.date}","${e.name.replace(/"/g, '""')}","${e.category || 'General'}",${e.amount}\n`;
    });

    return csv;
  };

  const csvContent = generateCsv();

  const handleCopy = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(csvContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } else {
      Alert.alert('CSV Ready', 'The CSV report has been generated. You can view or copy the contents below.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, clayCard]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: colors.primaryLight,
                    borderTopColor: 'rgba(255, 255, 255, 0.45)',
                    borderBottomColor: colors.primaryDark
                  }
                ]}
              >
                <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Export Report</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  {MONTH_NAMES[selectedMonth - 1]} {selectedYear} Financial Statement
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderTopColor: colors.clayBorderTop,
                  borderBottomColor: colors.clayBorderBottom
                }
              ]}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Quick Metrics Clay Tablet */}
          <View
            style={[
              styles.metricsBox,
              clayPill,
              {
                backgroundColor: colors.surfaceSubtle,
                borderRadius: 16
              }
            ]}
          >
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>INCOME</Text>
              <Text style={[styles.metricVal, { color: colors.income }]}>
                Rs. {(summary.total_income || 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>EXPENSE</Text>
              <Text style={[styles.metricVal, { color: colors.expense }]}>
                Rs. {(summary.total_expense || 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>BALANCE</Text>
              <Text style={[styles.metricVal, { color: colors.text }]}>
                Rs. {(summary.remaining_balance || 0).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* CSV Preview Debossed Box */}
          <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>CSV FORMAT PREVIEW</Text>
          <ScrollView
            style={[
              styles.csvPreview,
              {
                backgroundColor: colors.background,
                borderTopColor: themeMode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(148,163,184,0.4)',
                borderBottomColor: themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)'
              }
            ]}
          >
            <Text style={[styles.csvText, { color: colors.text }]}>{csvContent}</Text>
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.cancelBtn,
                clayPill,
                {
                  backgroundColor: colors.surfaceSubtle
                }
              ]}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCopy}
              style={[styles.copyBtn, clayButton]}
            >
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={14} color="#FFFFFF" />
              <Text style={styles.copyBtnText}>
                {copied ? 'Copied to Clipboard!' : 'Copy CSV Data'}
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
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
    gap: 12
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderTopWidth: 2,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderTopWidth: 1.5,
    borderBottomWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  metricsBox: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 14,
    justifyContent: 'space-around'
  },
  metricItem: {
    alignItems: 'center'
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 2
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '900'
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 6
  },
  csvPreview: {
    maxHeight: 180,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 18
  },
  csvText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    lineHeight: 16
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700'
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  }
});

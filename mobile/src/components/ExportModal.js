import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import { jsPDF } from 'jspdf';
import Ionicons from './Icon';
import { useBudget } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import { palette, getClayCard, getClayButton, getClayPill } from '../theme/colors';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const formatRs = (val) => `Rs. ${(Number(val) || 0).toLocaleString('en-US')}`;

export default function ExportModal({ visible, onClose }) {
  const { selectedMonth, selectedYear, summary, expenses, categoryBreakdown } = useBudget();
  const { user, themeMode } = useAuth();
  const colors = palette[themeMode] || palette.light;
  const clayCard = getClayCard(themeMode);
  const clayPdfBtn = getClayButton(themeMode, '#7259EE', '#4E35C4');
  const clayCsvBtn = getClayButton(themeMode, '#45CF87', '#24A462');
  const clayPill = getClayPill(themeMode);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const monthLabel = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;
  const totalIncome = summary.total_income || 0;
  const totalExpense = summary.total_expense || 0;
  const remainingBalance =
    summary.remaining_balance !== undefined
      ? summary.remaining_balance
      : totalIncome - totalExpense;
  const burnRate = summary.burn_rate_percent || 0;

  // Generate Real Styled PDF Statement (jsPDF)
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setStatusMsg('');
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 16;
      const contentW = pageW - margin * 2;

      // 1. Violet Claymorphism Header Banner
      doc.setFillColor(122, 99, 241); // #7A63F1
      doc.rect(0, 0, pageW, 42, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('BUDGET TRACKER', margin, 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Monthly Financial Statement  •  ${monthLabel}`, margin, 27);

      doc.setFontSize(9);
      const userName = user?.name || user?.email || 'Account Holder';
      const generatedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      doc.text(`Account: ${userName}`, margin, 35);
      doc.text(`Generated: ${generatedDate}`, pageW - margin, 35, { align: 'right' });

      // 2. Three Summary Cards
      let y = 52;
      const cardGap = 5;
      const cardW = (contentW - cardGap * 2) / 3;
      const cardH = 24;

      const summaryCards = [
        {
          label: 'MONTHLY INCOME',
          value: formatRs(totalIncome),
          bg: [232, 250, 240],
          accent: [32, 158, 92]
        },
        {
          label: 'TOTAL EXPENSES',
          value: formatRs(totalExpense),
          bg: [255, 240, 240],
          accent: [204, 67, 67]
        },
        {
          label: 'REMAINING BALANCE',
          value: formatRs(remainingBalance),
          bg: [242, 240, 255],
          accent: remainingBalance < 0 ? [204, 67, 67] : [81, 56, 204]
        }
      ];

      summaryCards.forEach((card, idx) => {
        const x = margin + idx * (cardW + cardGap);
        doc.setFillColor(...card.bg);
        doc.roundedRect(x, y, cardW, cardH, 4, 4, 'F');

        doc.setTextColor(100, 110, 135);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text(card.label, x + 4, y + 8);

        doc.setTextColor(...card.accent);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(card.value, x + 4, y + 18);
      });

      y += cardH + 8;

      // Burn Rate Summary Strip
      doc.setFillColor(246, 246, 252);
      doc.roundedRect(margin, y, contentW, 11, 3, 3, 'F');
      doc.setTextColor(50, 58, 85);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const statusText =
        remainingBalance < 0
          ? 'Over Budget'
          : burnRate >= 80
            ? 'Caution (80%+ Spent)'
            : 'Healthy Budget';
      doc.text(`Budget Consumed: ${burnRate}%   |   Status: ${statusText}`, margin + 4, y + 7);
      doc.text(`Total Transactions: ${expenses.length}`, pageW - margin - 4, y + 7, {
        align: 'right'
      });

      y += 18;

      // 3. Category Breakdown (if any)
      const cats = Object.keys(categoryBreakdown || {});
      if (cats.length > 0 && totalExpense > 0) {
        doc.setTextColor(30, 36, 60);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Spending by Category', margin, y);
        y += 6;

        cats.forEach((cat) => {
          const amt = categoryBreakdown[cat] || 0;
          const pct = Math.round((amt / totalExpense) * 100);
          if (y > pageH - 25) {
            doc.addPage();
            y = 20;
          }
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(45, 52, 75);
          doc.text(`${cat}`, margin + 2, y + 4);
          doc.text(`${formatRs(amt)} (${pct}%)`, pageW - margin - 2, y + 4, { align: 'right' });

          // Progress bar track
          doc.setFillColor(232, 235, 246);
          doc.roundedRect(margin + 36, y + 1, contentW - 84, 3.2, 1.5, 1.5, 'F');
          doc.setFillColor(122, 99, 241);
          doc.roundedRect(
            margin + 36,
            y + 1,
            Math.max(((contentW - 84) * Math.min(pct, 100)) / 100, 2),
            3.2,
            1.5,
            1.5,
            'F'
          );
          y += 8;
        });

        y += 6;
      }

      // 4. Itemized Expenses Table
      if (y > pageH - 35) {
        doc.addPage();
        y = 20;
      }

      doc.setTextColor(30, 36, 60);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Itemized Expenses', margin, y);
      y += 5;

      // Table Header
      doc.setFillColor(122, 99, 241);
      doc.roundedRect(margin, y, contentW, 9, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('DATE', margin + 3, y + 6);
      doc.text('DESCRIPTION', margin + 32, y + 6);
      doc.text('CATEGORY', margin + 106, y + 6);
      doc.text('AMOUNT', pageW - margin - 3, y + 6, { align: 'right' });
      y += 10;

      if (expenses.length === 0) {
        doc.setTextColor(123, 132, 158);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9.5);
        doc.text('No expenses recorded for this month.', margin + 3, y + 7);
        y += 12;
      } else {
        expenses.forEach((exp, idx) => {
          if (y > pageH - 22) {
            doc.addPage();
            y = 20;
          }

          if (idx % 2 === 0) {
            doc.setFillColor(246, 246, 252);
            doc.rect(margin, y, contentW, 8.5, 'F');
          }

          const dateStr = exp.date ? String(exp.date).split('T')[0] : '-';
          const nameStr = String(exp.name || exp.title || 'Expense').slice(0, 38);
          const catStr = String(exp.category || 'General');

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(70, 78, 102);
          doc.text(dateStr, margin + 3, y + 5.8);

          doc.setTextColor(25, 32, 54);
          doc.setFont('helvetica', 'bold');
          doc.text(nameStr, margin + 32, y + 5.8);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 110, 135);
          doc.text(catStr, margin + 106, y + 5.8);

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(204, 67, 67);
          doc.text(`-${formatRs(exp.amount)}`, pageW - margin - 3, y + 5.8, { align: 'right' });

          y += 8.5;
        });

        // Table Total Footer Row
        y += 2;
        doc.setFillColor(238, 240, 252);
        doc.roundedRect(margin, y, contentW, 10, 2, 2, 'F');
        doc.setTextColor(30, 36, 60);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text('TOTAL EXPENSES', margin + 3, y + 6.5);
        doc.setTextColor(204, 67, 67);
        doc.text(formatRs(totalExpense), pageW - margin - 3, y + 6.5, { align: 'right' });
      }

      // Page Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(150, 158, 180);
        doc.text('Monthly Budget Tracker  •  Secured by Neon PostgreSQL', margin, pageH - 10);
        doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 10, { align: 'right' });
      }

      const fileName = `Budget_Report_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.pdf`;

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const pdfBlob = doc.output('blob');
        const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

        // Prefer iOS native Share Sheet on iPhone (Save to Files / WhatsApp / AirDrop)
        if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
          try {
            await navigator.share({
              title: `Budget Report - ${monthLabel}`,
              text: `Monthly financial statement for ${monthLabel}`,
              files: [pdfFile]
            });
            setStatusMsg('✓ PDF Report shared successfully!');
            return;
          } catch (shareErr) {
            if (shareErr?.name === 'AbortError') {
              setStatusMsg('Share cancelled.');
              return;
            }
          }
        }

        // Direct Browser Download fallback
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        setStatusMsg(`✓ Downloaded ${fileName}!`);
      } else {
        Alert.alert('PDF Ready', `Generated ${fileName} successfully.`);
        setStatusMsg('✓ PDF generated!');
      }
    } catch (err) {
      setStatusMsg(`Error generating PDF: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Generate CSV Data
  const generateCsv = () => {
    let csv = `Monthly Budget Tracker Report - ${monthLabel}\n`;
    csv += `Generated for: ${user?.name || user?.email || 'User'}\n`;
    csv += `Total Income: ${formatRs(totalIncome)}\n`;
    csv += `Total Expense: ${formatRs(totalExpense)}\n`;
    csv += `Remaining Balance: ${formatRs(remainingBalance)}\n\n`;

    csv += `Date,Expense Name,Category,Amount (Rs.)\n`;
    expenses.forEach((e) => {
      const safeName = String(e.name || e.title || 'Expense').replace(/"/g, '""');
      csv += `"${e.date}","${safeName}","${e.category || 'General'}",${e.amount}\n`;
    });
    return csv;
  };

  const handleDownloadCsv = () => {
    const csvContent = generateCsv();
    const fileName = `Budget_Report_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.csv`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setStatusMsg(`✓ Downloaded ${fileName}!`);
    } else {
      Alert.alert('CSV Ready', 'CSV report generated.');
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
                <Ionicons name="document-text-outline" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Financial Report</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  {monthLabel} • PDF & CSV Statement
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              accessibilityLabel="Close Report Modal"
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Statement Metrics Preview */}
          <View style={[styles.metricsBox, clayPill, { backgroundColor: colors.surfaceSubtle }]}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>INCOME</Text>
              <Text style={[styles.metricVal, { color: colors.income }]}>
                {formatRs(totalIncome)}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>EXPENSE</Text>
              <Text style={[styles.metricVal, { color: colors.expense }]}>
                {formatRs(totalExpense)}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>BALANCE</Text>
              <Text style={[styles.metricVal, { color: colors.primary }]}>
                {formatRs(remainingBalance)}
              </Text>
            </View>
          </View>

          {/* Statement Summary Info */}
          <ScrollView
            style={[
              styles.previewBox,
              { backgroundColor: colors.background, borderColor: colors.border }
            ]}
          >
            <Text style={[styles.previewHeading, { color: colors.text }]}>
              Included in Your PDF Statement:
            </Text>
            <Text style={[styles.previewItem, { color: colors.textSecondary }]}>
              • Branded header with account name & {monthLabel} summary
            </Text>
            <Text style={[styles.previewItem, { color: colors.textSecondary }]}>
              • Dynamic balance, total income, expenses & {burnRate}% burn rate
            </Text>
            <Text style={[styles.previewItem, { color: colors.textSecondary }]}>
              • Category spending bars & itemized table ({expenses.length} transactions)
            </Text>
            <Text style={[styles.previewItem, { color: colors.textSecondary }]}>
              • Native iPhone Share Sheet (Save to Files, WhatsApp, AirDrop, Print)
            </Text>
          </ScrollView>

          {statusMsg.length > 0 && (
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: statusMsg.includes('✓')
                    ? colors.incomeLight
                    : colors.expenseLight
                }
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: statusMsg.includes('✓') ? colors.incomeDark : colors.expense }
                ]}
              >
                {statusMsg}
              </Text>
            </View>
          )}

          {/* Stacked Full-Width Clay Action Buttons */}
          <View style={styles.actionStack}>
            <TouchableOpacity
              onPress={handleDownloadPdf}
              style={[styles.fullActionBtn, clayPdfBtn]}
              disabled={isGeneratingPdf}
              activeOpacity={0.85}
            >
              {isGeneratingPdf ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="document-text" size={18} color="#FFFFFF" />
                  <Text style={styles.fullActionText}>Download / Share PDF Report</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDownloadCsv}
              style={[styles.fullActionBtn, clayCsvBtn]}
              activeOpacity={0.85}
            >
              <Ionicons name="download-outline" size={18} color="#FFFFFF" />
              <Text style={styles.fullActionText}>Download CSV Spreadsheet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.cancelBtn, { backgroundColor: colors.surfaceSubtle }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Close</Text>
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
    backgroundColor: 'rgba(18, 16, 40, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    padding: 22
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
    width: 44,
    height: 44,
    borderRadius: 15,
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
  metricsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginBottom: 14
  },
  metricItem: {
    flex: 1,
    alignItems: 'center'
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 3
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '900'
  },
  previewBox: {
    maxHeight: 132,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14
  },
  previewHeading: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6
  },
  previewItem: {
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '500'
  },
  statusPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center'
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700'
  },
  actionStack: {
    gap: 10
  },
  fullActionBtn: {
    width: '100%',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  fullActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  cancelBtn: {
    width: '100%',
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700'
  }
});

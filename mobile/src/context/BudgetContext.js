import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const BudgetContext = createContext(null);

export const BudgetProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1 - 12
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [incomeData, setIncomeData] = useState(null);
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expense: 0,
    remaining_balance: 0,
    burn_rate_percent: 0,
    is_budget_alert: false,
    is_over_budget: false,
    comparison_with_prev_month: null
  });
  const [expenses, setExpenses] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [lastWarning, setLastWarning] = useState(null);

  const fetchMonthData = useCallback(async (month = selectedMonth, year = selectedYear) => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Fetch income & dynamic balance calculation
      const incomeRes = await api.request(`/api/income?month=${month}&year=${year}`);
      if (incomeRes.success && incomeRes.data) {
        setIncomeData(incomeRes.data.income);
        setSummary(incomeRes.data.summary);
      }

      // 2. Fetch expenses list for this month
      const expenseRes = await api.request(`/api/expenses?month=${month}&year=${year}`);
      if (expenseRes.success) {
        setExpenses(expenseRes.expenses || []);
        setCategoryBreakdown(expenseRes.category_breakdown || {});
      }
    } catch (err) {
      console.warn('Error fetching month data:', err.message);
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, selectedMonth, selectedYear]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMonthData(selectedMonth, selectedYear);
    }
  }, [isAuthenticated, selectedMonth, selectedYear, fetchMonthData]);

  // F9: Change selected month
  const changeMonth = (month, year = selectedYear) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const nextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const prevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  // F2: Set Monthly Income
  const updateIncome = async (amount) => {
    try {
      setErrorMessage(null);
      const res = await api.request('/api/income', {
        method: 'POST',
        body: {
          month: selectedMonth,
          year: selectedYear,
          amount: parseFloat(amount)
        }
      });

      if (res.success && res.data) {
        setIncomeData(res.data.income);
        setSummary(res.data.summary);
      }
      return res;
    } catch (err) {
      setErrorMessage(err.message);
      throw err;
    }
  };

  // F3 & F4: Add Expense with Auto Deduction
  const addExpense = async ({ name, amount, category, date }) => {
    try {
      setErrorMessage(null);
      setLastWarning(null);

      const res = await api.request('/api/expenses', {
        method: 'POST',
        body: {
          name,
          amount: parseFloat(amount),
          category: category || 'General',
          date: date || new Date().toISOString().split('T')[0],
          month: selectedMonth,
          year: selectedYear
        }
      });

      if (res.success) {
        // Update summary and prepend expense
        if (res.summary) setSummary(res.summary);
        if (res.expense) setExpenses(prev => [res.expense, ...prev]);
        if (res.warning && res.warning.exceeded) {
          setLastWarning(res.warning.message);
        }
        // Re-fetch category breakdown
        fetchMonthData(selectedMonth, selectedYear);
      }
      return res;
    } catch (err) {
      setErrorMessage(err.message);
      throw err;
    }
  };

  // F6: Edit Expense
  const editExpense = async (id, updatedFields) => {
    try {
      setErrorMessage(null);
      const res = await api.request(`/api/expenses/${id}`, {
        method: 'PUT',
        body: {
          ...updatedFields,
          amount: updatedFields.amount !== undefined ? parseFloat(updatedFields.amount) : undefined
        }
      });

      if (res.success) {
        if (res.summary) setSummary(res.summary);
        if (res.expense) {
          setExpenses(prev => prev.map(e => (e.id === id ? res.expense : e)));
        }
        fetchMonthData(selectedMonth, selectedYear);
      }
      return res;
    } catch (err) {
      setErrorMessage(err.message);
      throw err;
    }
  };

  // F7: Delete Expense
  const deleteExpense = async (id) => {
    try {
      setErrorMessage(null);
      const res = await api.request(`/api/expenses/${id}`, {
        method: 'DELETE'
      });

      if (res.success) {
        if (res.summary) setSummary(res.summary);
        setExpenses(prev => prev.filter(e => e.id !== id));
        fetchMonthData(selectedMonth, selectedYear);
      }
      return res;
    } catch (err) {
      setErrorMessage(err.message);
      throw err;
    }
  };

  return (
    <BudgetContext.Provider
      value={{
        selectedMonth,
        selectedYear,
        changeMonth,
        nextMonth,
        prevMonth,
        incomeData,
        summary,
        expenses,
        categoryBreakdown,
        isLoading,
        errorMessage,
        lastWarning,
        clearWarning: () => setLastWarning(null),
        clearError: () => setErrorMessage(null),
        refresh: () => fetchMonthData(selectedMonth, selectedYear),
        updateIncome,
        addExpense,
        editExpense,
        deleteExpense
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};

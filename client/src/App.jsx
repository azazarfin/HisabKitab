import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import TransactionHistoryPage from './components/TransactionHistoryPage';
import TransactionForm from './components/TransactionForm';
import ChapterManager from './components/ChapterManager';
import CategoryManager from './components/CategoryManager';
import PaymentMethodManager from './components/PaymentMethodManager';
import RecurringManager from './components/RecurringManager';
import SettingsPanel from './components/SettingsPanel';
import {
  fetchChapters,
  createChapter,
  updateChapter,
  deleteChapter,
  importChapter,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  fetchRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
} from './api/api';

function App() {
  const navigate = useNavigate();
  // Core state
  const [chapters, setChapters] = useState([]);
  const [activeChapter, setActiveChapter] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('hisabkitab_theme') || 'charcoal';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hisabkitab_theme', theme);
  }, [theme]);

  // Modal states
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionFormType, setTransactionFormType] = useState('expense');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showChapterManager, setShowChapterManager] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showPaymentMethodManager, setShowPaymentMethodManager] = useState(false);
  const [showRecurringManager, setShowRecurringManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleOpenAddTransaction = (type = 'expense') => {
    setTransactionFormType(type);
    setShowTransactionForm(true);
  };

  // Toast state
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // ─── Initial Data Load ──────────────────────────────────────
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [chaptersData, categoriesData, paymentMethodsData, recurringData] = await Promise.all([
        fetchChapters(),
        fetchCategories(),
        fetchPaymentMethods(),
        fetchRecurring(),
      ]);
      setChapters(chaptersData);
      setCategories(categoriesData);
      setPaymentMethods(paymentMethodsData);
      setRecurringExpenses(recurringData);

      // Select the first chapter if available
      if (chaptersData.length > 0) {
        const firstChapter = chaptersData[0];
        setActiveChapter(firstChapter);
        const txns = await fetchTransactions(firstChapter._id);
        setTransactions(txns);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      addToast('Failed to load data. Is the server running?', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // ─── Load Transactions for Active Chapter ───────────────────
  const loadTransactions = useCallback(async () => {
    if (!activeChapter) {
      setTransactions([]);
      return;
    }
    try {
      const txns = await fetchTransactions(activeChapter._id);
      setTransactions(txns);
    } catch (err) {
      addToast('Failed to load transactions', 'error');
    }
  }, [activeChapter]);

  // ─── Chapter Handlers ───────────────────────────────────────
  const handleSelectChapter = async (chapterId) => {
    const chapter = chapters.find((c) => c._id === chapterId);
    if (chapter) {
      setActiveChapter(chapter);
      try {
        const txns = await fetchTransactions(chapterId);
        setTransactions(txns);
      } catch (err) {
        addToast('Failed to load transactions', 'error');
      }
    }
  };

  const handleCreateChapter = async (data) => {
    try {
      const saved = await createChapter(data);
      setChapters((prev) => [saved, ...prev]);
      setActiveChapter(saved);
      setTransactions([]);
      addToast('Chapter created! 📖');
    } catch (err) {
      addToast('Failed to create chapter', 'error');
    }
  };

  const handleUpdateChapter = async (id, data) => {
    try {
      const updated = await updateChapter(id, data);
      setChapters((prev) => prev.map((c) => (c._id === id ? updated : c)));
      if (activeChapter?._id === id) setActiveChapter(updated);
      addToast('Chapter updated! ✏️');
    } catch (err) {
      addToast('Failed to update chapter', 'error');
    }
  };

  const handleDeleteChapter = async (id) => {
    try {
      await deleteChapter(id);
      const remaining = chapters.filter((c) => c._id !== id);
      setChapters(remaining);
      if (activeChapter?._id === id) {
        if (remaining.length > 0) {
          setActiveChapter(remaining[0]);
          const txns = await fetchTransactions(remaining[0]._id);
          setTransactions(txns);
        } else {
          setActiveChapter(null);
          setTransactions([]);
        }
      }
      addToast('Chapter deleted 🗑️');
    } catch (err) {
      addToast('Failed to delete chapter', 'error');
    }
  };

  const handleImportChapter = async (targetId, sourceId) => {
    try {
      const result = await importChapter(targetId, sourceId);
      addToast(`Imported ${result.count} transactions! 📥`);
      if (activeChapter?._id === targetId) {
        loadTransactions();
      }
    } catch (err) {
      addToast('Failed to import transactions', 'error');
    }
  };

  // ─── Transaction Handlers ──────────────────────────────────
  const handleAddTransaction = async (data) => {
    try {
      await createTransaction(data);
      addToast(data.type === 'balance' ? 'Balance added! 💰' : 'Expense added! ✅');
      setShowTransactionForm(false);
      loadTransactions();
    } catch (err) {
      addToast('Failed to add transaction', 'error');
    }
  };

  const handleUpdateTransaction = async (data) => {
    try {
      await updateTransaction(editingTransaction._id, data);
      addToast('Transaction updated! ✏️');
      setEditingTransaction(null);
      loadTransactions();
    } catch (err) {
      addToast('Failed to update transaction', 'error');
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await deleteTransaction(id);
      addToast('Transaction deleted 🗑️');
      loadTransactions();
    } catch (err) {
      addToast('Failed to delete transaction', 'error');
    }
  };

  // ─── Category Handlers ─────────────────────────────────────
  const handleCreateCategory = async (data) => {
    try {
      const saved = await createCategory(data);
      setCategories((prev) => [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)));
      addToast('Category added! 🏷️');
    } catch (err) {
      addToast(err.message || 'Failed to create category', 'error');
    }
  };

  const handleUpdateCategory = async (id, data) => {
    try {
      const updated = await updateCategory(id, data);
      setCategories((prev) =>
        prev.map((c) => (c._id === id ? updated : c)).sort((a, b) => a.name.localeCompare(b.name))
      );
      addToast('Category updated! ✏️');
    } catch (err) {
      addToast('Failed to update category', 'error');
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c._id !== id));
      addToast('Category deleted 🗑️');
    } catch (err) {
      addToast('Failed to delete category', 'error');
    }
  };

  // ─── Payment Method Handlers ────────────────────────────────
  const handleCreatePaymentMethod = async (data) => {
    try {
      const saved = await createPaymentMethod(data);
      setPaymentMethods((prev) => [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)));
      addToast('Payment method added! 💳');
    } catch (err) {
      addToast(err.message || 'Failed to create payment method', 'error');
    }
  };

  const handleUpdatePaymentMethod = async (id, data) => {
    try {
      const updated = await updatePaymentMethod(id, data);
      setPaymentMethods((prev) =>
        prev.map((m) => (m._id === id ? updated : m)).sort((a, b) => a.name.localeCompare(b.name))
      );
      addToast('Payment method updated! ✏️');
    } catch (err) {
      addToast('Failed to update payment method', 'error');
    }
  };

  const handleDeletePaymentMethod = async (id) => {
    try {
      await deletePaymentMethod(id);
      setPaymentMethods((prev) => prev.filter((m) => m._id !== id));
      addToast('Payment method deleted 🗑️');
    } catch (err) {
      addToast('Failed to delete payment method', 'error');
    }
  };

  // ─── Recurring Expense Handlers ─────────────────────────────
  const handleCreateRecurring = async (data) => {
    try {
      const saved = await createRecurring(data);
      setRecurringExpenses((prev) => [...prev, saved]);
      addToast('Recurring expense added! 🔄');
    } catch (err) {
      addToast('Failed to create recurring expense', 'error');
    }
  };

  const handleUpdateRecurring = async (id, data) => {
    try {
      const updated = await updateRecurring(id, data);
      setRecurringExpenses((prev) => prev.map((r) => (r._id === id ? updated : r)));
      addToast('Recurring expense updated! ✏️');
    } catch (err) {
      addToast('Failed to update recurring expense', 'error');
    }
  };

  const handleDeleteRecurring = async (id) => {
    try {
      await deleteRecurring(id);
      setRecurringExpenses((prev) => prev.filter((r) => r._id !== id));
      addToast('Recurring expense deleted 🗑️');
    } catch (err) {
      addToast('Failed to delete recurring expense', 'error');
    }
  };

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="app-container">
      <Header
        activeChapter={activeChapter}
        chapters={chapters}
        onSelectChapter={handleSelectChapter}
        onManageChapters={() => setShowChapterManager(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {loading ? (
        <div className="empty-state">
          <span className="empty-state__icon">⏳</span>
          <p className="empty-state__text">Loading data...</p>
        </div>
      ) : !activeChapter ? (
        <div className="empty-state">
          <span className="empty-state__icon">📖</span>
          <p className="empty-state__text">No chapters yet. Create your first tracking chapter to get started!</p>
          <button
            className="btn btn--primary"
            onClick={() => setShowChapterManager(true)}
          >
            ➕ Create First Chapter
          </button>
        </div>
      ) : (
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                transactions={transactions}
                categories={categories}
                paymentMethods={paymentMethods}
                activeChapter={activeChapter}
                onAddBalance={() => handleOpenAddTransaction('balance')}
                onAddExpense={() => handleOpenAddTransaction('expense')}
                onAddTransaction={(type) => handleOpenAddTransaction(type)}
                onViewAllTransactions={() => navigate('/history')}
                onEditTransaction={(txn) => setEditingTransaction(txn)}
                onDeleteTransaction={handleDeleteTransaction}
              />
            }
          />
          <Route
            path="/history"
            element={
              <TransactionHistoryPage
                transactions={transactions}
                categories={categories}
                paymentMethods={paymentMethods}
                activeChapter={activeChapter}
                onEdit={(txn) => setEditingTransaction(txn)}
                onDelete={handleDeleteTransaction}
                onAddTransaction={(type) => handleOpenAddTransaction(type)}
                onBackToDashboard={() => navigate('/')}
              />
            }
          />
        </Routes>
      )}

      {/* Add Transaction Modal */}
      {showTransactionForm && activeChapter && (
        <TransactionForm
          key={`add-txn-${transactionFormType}`}
          categories={categories}
          paymentMethods={paymentMethods}
          chapterId={activeChapter._id}
          defaultType={transactionFormType}
          onSubmit={handleAddTransaction}
          onClose={() => setShowTransactionForm(false)}
        />
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && activeChapter && (
        <TransactionForm
          categories={categories}
          paymentMethods={paymentMethods}
          chapterId={activeChapter._id}
          initialData={editingTransaction}
          onSubmit={handleUpdateTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      )}

      {/* Chapter Manager Modal */}
      {showChapterManager && (
        <ChapterManager
          chapters={chapters}
          onCreateChapter={handleCreateChapter}
          onUpdateChapter={handleUpdateChapter}
          onDeleteChapter={handleDeleteChapter}
          onImport={handleImportChapter}
          onClose={() => setShowChapterManager(false)}
        />
      )}

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel
          currentTheme={theme}
          onSelectTheme={setTheme}
          onManageChapters={() => setShowChapterManager(true)}
          onManageCategories={() => setShowCategoryManager(true)}
          onManagePaymentMethods={() => setShowPaymentMethodManager(true)}
          onManageRecurring={() => setShowRecurringManager(true)}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <CategoryManager
          categories={categories}
          onCreateCategory={handleCreateCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
          onClose={() => setShowCategoryManager(false)}
        />
      )}

      {/* Payment Method Manager Modal */}
      {showPaymentMethodManager && (
        <PaymentMethodManager
          paymentMethods={paymentMethods}
          onCreateMethod={handleCreatePaymentMethod}
          onUpdateMethod={handleUpdatePaymentMethod}
          onDeleteMethod={handleDeletePaymentMethod}
          onClose={() => setShowPaymentMethodManager(false)}
        />
      )}

      {/* Recurring Expense Manager Modal */}
      {showRecurringManager && (
        <RecurringManager
          recurringExpenses={recurringExpenses}
          categories={categories}
          onCreateRecurring={handleCreateRecurring}
          onUpdateRecurring={handleUpdateRecurring}
          onDeleteRecurring={handleDeleteRecurring}
          onClose={() => setShowRecurringManager(false)}
        />
      )}

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

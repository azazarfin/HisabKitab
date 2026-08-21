import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import './App.css';
import { useAuth } from './context/AuthContext';
import { setTokenGetter } from './api/api';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TransactionHistoryPage from './components/TransactionHistoryPage';
import TransactionForm from './components/TransactionForm';
import ChapterManager from './components/ChapterManager';
import CategoryManager from './components/CategoryManager';
import PaymentMethodManager from './components/PaymentMethodManager';
import RecurringManager from './components/RecurringManager';
import SettingsPanel from './components/SettingsPanel';
import AccountManager from './components/AccountManager';
import ConfirmDialog from './components/ConfirmDialog';
import BottomNav from './components/BottomNav';
import GuidedTour from './components/GuidedTour';
import {
  tourDemoChapter,
  tourDemoChapters,
  tourDemoCategories,
  tourDemoPaymentMethods,
  tourDemoRecurring,
  tourDemoTransactions,
} from './data/tourDemoData';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
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
  const { user, isAuthenticated, loading: authLoading, getAccessToken, completeTour } = useAuth();

  // Connect the API layer to the auth token getter
  useEffect(() => {
    setTokenGetter(getAccessToken);
  }, [getAccessToken]);

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
  const [showAccountManager, setShowAccountManager] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    variant: 'danger',
    onConfirm: null,
  });

  // SW update banner state
  const [swUpdateAvailable, setSwUpdateAvailable] = useState(null);

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPwaInstall, setShowPwaInstall] = useState(false);

  // Capture beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.deferredPwaPrompt = e;
    };
    
    if (window.deferredPwaPrompt) {
      setDeferredPrompt(window.deferredPwaPrompt);
    }
    
    const handlePwaPromptSaved = () => {
      if (window.deferredPwaPrompt) {
        setDeferredPrompt(window.deferredPwaPrompt);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-saved', handlePwaPromptSaved);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-saved', handlePwaPromptSaved);
    };
  }, []);

  // Show install prompt when authenticated if available and not dismissed
  useEffect(() => {
    if (isAuthenticated && deferredPrompt) {
      const dismissed = localStorage.getItem('hisabkitab_pwa_dismissed');
      if (!dismissed) {
        setShowPwaInstall(true);
      }
    } else {
      setShowPwaInstall(false);
    }
  }, [isAuthenticated, deferredPrompt]);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    setShowPwaInstall(false);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the A2HS prompt');
    } else {
      console.log('User dismissed the A2HS prompt');
    }
    setDeferredPrompt(null);
  };

  const handleDismissPwa = () => {
    setShowPwaInstall(false);
    localStorage.setItem('hisabkitab_pwa_dismissed', 'true');
  };

  // Listen for SW update events
  useEffect(() => {
    const handleSwUpdate = (e) => {
      setSwUpdateAvailable(e.detail.registration);
    };
    window.addEventListener('sw-update-available', handleSwUpdate);
    return () => window.removeEventListener('sw-update-available', handleSwUpdate);
  }, []);

  const handleSwUpdate = () => {
    if (swUpdateAvailable?.waiting) {
      swUpdateAvailable.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    setSwUpdateAvailable(null);
  };

  // Body scroll lock when any modal is open
  const isAnyModalOpen = showTransactionForm || editingTransaction || showChapterManager ||
    showCategoryManager || showPaymentMethodManager || showRecurringManager || showSettings ||
    showAccountManager || confirmDialog.isOpen;

  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isAnyModalOpen]);

  const showConfirm = useCallback((title, message, onConfirm, options = {}) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText: options.confirmText || 'Delete',
      variant: options.variant || 'danger',
      onConfirm: () => {
        onConfirm();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleOpenAddTransaction = (type = 'expense') => {
    setTransactionFormType(type);
    setShowTransactionForm(true);
  };

  // Toast state
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // ─── Initial Data Load ──────────────────────────────────────
  const loadInitialData = useCallback(async () => {
    if (!isAuthenticated) return;
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
  }, [isAuthenticated, addToast]);

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    } else {
      // Reset state on logout
      setChapters([]);
      setActiveChapter(null);
      setTransactions([]);
      setCategories([]);
      setPaymentMethods([]);
      setRecurringExpenses([]);
      setLoading(false);
      setShowTour(false);
    }
  }, [isAuthenticated, loadInitialData]);

  // Auto-launch Start Guide Tour for new users who haven't completed it
  useEffect(() => {
    if (isAuthenticated && user && user.hasCompletedTour === false && !loading) {
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user?.hasCompletedTour, loading]);

  const handleCompleteTour = async (options = {}) => {
    setShowTour(false);
    setTourStepIndex(0);
    if (user && !user.hasCompletedTour) {
      await completeTour(true);
    }
    if (options?.openChapterManager) {
      setTimeout(() => {
        setShowChapterManager(true);
      }, 150);
    }
  };

  const handleStartTour = () => {
    setShowSettings(false);
    setShowChapterManager(false);
    setShowCategoryManager(false);
    setShowPaymentMethodManager(false);
    setShowRecurringManager(false);
    navigate('/');
    setTourStepIndex(0);
    setShowTour(true);
  };

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
  }, [activeChapter, addToast]);

  // ─── Chapter Handlers ───────────────────────────────────────
  const handleSelectChapter = async (chapterId) => {
    const chapter = chapters.find((c) => c._id === chapterId);
    if (chapter) {
      setActiveChapter(chapter);
      try {
        const txns = await fetchTransactions(chapterId);
        setTransactions(txns);
      } catch (err) {
        addToast(err.message || 'Failed to load transactions', 'error');
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
      addToast(err.message || 'Failed to create chapter', 'error');
    }
  };

  const handleUpdateChapter = async (id, data) => {
    try {
      const updated = await updateChapter(id, data);
      setChapters((prev) => prev.map((c) => (c._id === id ? updated : c)));
      if (activeChapter?._id === id) setActiveChapter(updated);
      addToast('Chapter updated! ✏️');
    } catch (err) {
      addToast(err.message || 'Failed to update chapter', 'error');
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
      addToast(err.message || 'Failed to delete chapter', 'error');
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
      addToast(err.message || 'Failed to import transactions', 'error');
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
      addToast(err.message || 'Failed to add transaction', 'error');
    }
  };

  const handleUpdateTransaction = async (data) => {
    try {
      await updateTransaction(editingTransaction._id, data);
      addToast('Transaction updated! ✏️');
      setEditingTransaction(null);
      loadTransactions();
    } catch (err) {
      addToast(err.message || 'Failed to update transaction', 'error');
    }
  };

  const handleDeleteTransaction = async (id) => {
    showConfirm(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      async () => {
        try {
          await deleteTransaction(id);
          addToast('Transaction deleted 🗑️');
          loadTransactions();
        } catch (err) {
          addToast(err.message || 'Failed to delete transaction', 'error');
        }
      }
    );
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
      addToast(err.message || 'Failed to update category', 'error');
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c._id !== id));
      // Remove recurring expenses under this category
      setRecurringExpenses((prev) => prev.filter((r) => (r.categoryId?._id || r.categoryId) !== id));
      // Clear category on loaded transactions
      setTransactions((prev) =>
        prev.map((t) => ((t.categoryId?._id || t.categoryId) === id ? { ...t, categoryId: null } : t))
      );
      addToast('Category deleted 🗑️');
    } catch (err) {
      addToast(err.message || 'Failed to delete category', 'error');
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
      addToast(err.message || 'Failed to update payment method', 'error');
    }
  };

  const handleDeletePaymentMethod = async (id) => {
    try {
      await deletePaymentMethod(id);
      setPaymentMethods((prev) => prev.filter((m) => m._id !== id));
      // Clear payment method on loaded transactions
      setTransactions((prev) =>
        prev.map((t) =>
          (t.paymentMethodId?._id || t.paymentMethodId) === id ? { ...t, paymentMethodId: null } : t
        )
      );
      addToast('Payment method deleted 🗑️');
    } catch (err) {
      addToast(err.message || 'Failed to delete payment method', 'error');
    }
  };

  // ─── Recurring Expense Handlers ─────────────────────────────
  const handleCreateRecurring = async (data) => {
    try {
      const saved = await createRecurring(data);
      setRecurringExpenses((prev) => [...prev, saved]);
      addToast('Recurring expense added! 🔄');
    } catch (err) {
      addToast(err.message || 'Failed to create recurring expense', 'error');
    }
  };

  const handleUpdateRecurring = async (id, data) => {
    try {
      const updated = await updateRecurring(id, data);
      setRecurringExpenses((prev) => prev.map((r) => (r._id === id ? updated : r)));
      addToast('Recurring expense updated! ✏️');
    } catch (err) {
      addToast(err.message || 'Failed to update recurring expense', 'error');
    }
  };

  const handleDeleteRecurring = async (id) => {
    try {
      await deleteRecurring(id);
      setRecurringExpenses((prev) => prev.filter((r) => r._id !== id));
      addToast('Recurring expense deleted 🗑️');
    } catch (err) {
      addToast(err.message || 'Failed to delete recurring expense', 'error');
    }
  };

  // ─── Render ─────────────────────────────────────────────────

  // Show nothing while auth is loading
  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="auth-page__bg-orb auth-page__bg-orb--1" />
        <div className="auth-page__bg-orb auth-page__bg-orb--2" />
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <span className="auth-card__logo">📒</span>
          <h1 className="auth-card__title" style={{ marginTop: '8px' }}>HisabKitab</h1>
          <span className="auth-spinner auth-spinner--large" style={{ marginTop: '24px' }} />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* SW Update Banner */}
      {swUpdateAvailable && (
        <div className="sw-update-banner">
          <span>🔄 A new version is available!</span>
          <button type="button" className="btn btn--primary btn--sm" onClick={handleSwUpdate}>
            Update Now
          </button>
        </div>
      )}

      {/* PWA Install Banner */}
      {showPwaInstall && (
        <div className="sw-update-banner" style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', zIndex: 2999 }}>
          <span>📱 Install HisabKitab for a better experience!</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn--sm" style={{ background: 'white', color: 'var(--color-primary-dark)' }} onClick={handleInstallPwa}>
              Install
            </button>
            <button type="button" className="btn btn--sm btn--ghost" style={{ color: 'white' }} onClick={handleDismissPwa}>
              Not Now
            </button>
          </div>
        </div>
      )}

      <Routes>
        {/* Public Auth Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
        />
        <Route
          path="/forgot-password"
          element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPasswordPage />}
        />


        {/* Protected App Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              {(() => {
                const isTourDemo = showTour && (!activeChapter || chapters.length === 0);
                const displayChapters = isTourDemo ? [tourDemoChapter] : chapters;
                const displayActiveChapter = isTourDemo ? tourDemoChapter : activeChapter;
                const displayCategories = (showTour && categories.length === 0) ? tourDemoCategories : categories;
                const displayPaymentMethods = (showTour && paymentMethods.length === 0) ? tourDemoPaymentMethods : paymentMethods;
                const displayTransactions = (showTour && transactions.length === 0) ? tourDemoTransactions : transactions;

                return (
                  <div className="app-container">
                    <Header
                      activeChapter={displayActiveChapter}
                      chapters={displayChapters}
                      onSelectChapter={handleSelectChapter}
                      onManageChapters={() => setShowChapterManager(true)}
                      onOpenSettings={() => setShowSettings(true)}
                      onOpenAccountManager={() => setShowAccountManager(true)}
                    />
                    {loading ? (
                      <div className="empty-state">
                        <span className="empty-state__icon">⏳</span>
                        <p className="empty-state__text">Loading data...</p>
                      </div>
                    ) : !displayActiveChapter ? (
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
                      <Dashboard
                        transactions={displayTransactions}
                        categories={displayCategories}
                        paymentMethods={displayPaymentMethods}
                        activeChapter={displayActiveChapter}
                        onAddBalance={() => handleOpenAddTransaction('balance')}
                        onAddExpense={() => handleOpenAddTransaction('expense')}
                        onAddTransaction={(type) => handleOpenAddTransaction(type)}
                        onViewAllTransactions={() => navigate('/history')}
                        onEditTransaction={(txn) => setEditingTransaction(txn)}
                        onDeleteTransaction={handleDeleteTransaction}
                      />
                    )}
                  </div>
                );
              })()}
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <div className="app-container">
                <Header
                  activeChapter={activeChapter}
                  chapters={chapters}
                  onSelectChapter={handleSelectChapter}
                  onManageChapters={() => setShowChapterManager(true)}
                  onOpenSettings={() => setShowSettings(true)}
                  onOpenAccountManager={() => setShowAccountManager(true)}
                />
                <TransactionHistoryPage
                  transactions={transactions}
                  categories={categories}
                  paymentMethods={paymentMethods}
                  activeChapter={activeChapter}
                  onEdit={(txn) => setEditingTransaction(txn)}
                  onDelete={handleDeleteTransaction}
                />
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>

      {/* Mobile Bottom Navigation */}
      {isAuthenticated && (
        <BottomNav
          onAddTransaction={handleOpenAddTransaction}
          onOpenSettings={() => setShowSettings(true)}
          activeChapter={showTour && !activeChapter ? tourDemoChapter : activeChapter}
          chapters={showTour && chapters.length === 0 ? [tourDemoChapter] : chapters}
          onSelectChapter={handleSelectChapter}
        />
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
      {(showChapterManager || (showTour && tourStepIndex === 1)) && (
        <ChapterManager
          chapters={showTour ? tourDemoChapters : chapters}
          onCreateChapter={showTour ? () => {} : handleCreateChapter}
          onUpdateChapter={showTour ? () => {} : handleUpdateChapter}
          onDeleteChapter={showTour ? () => {} : handleDeleteChapter}
          onImport={showTour ? () => {} : handleImportChapter}
          onClose={() => {
            if (!showTour) setShowChapterManager(false);
          }}
          showConfirm={showConfirm}
        />
      )}

      {/* Category Manager Modal */}
      {(showCategoryManager || (showTour && tourStepIndex === 2)) && (
        <CategoryManager
          categories={showTour ? tourDemoCategories : categories}
          onCreateCategory={showTour ? () => {} : handleCreateCategory}
          onUpdateCategory={showTour ? () => {} : handleUpdateCategory}
          onDeleteCategory={showTour ? () => {} : handleDeleteCategory}
          onClose={() => {
            if (!showTour) setShowCategoryManager(false);
          }}
          showConfirm={showConfirm}
        />
      )}

      {/* Payment Method Manager Modal */}
      {(showPaymentMethodManager || (showTour && tourStepIndex === 3)) && (
        <PaymentMethodManager
          paymentMethods={showTour ? tourDemoPaymentMethods : paymentMethods}
          onCreateMethod={showTour ? () => {} : handleCreatePaymentMethod}
          onUpdateMethod={showTour ? () => {} : handleUpdatePaymentMethod}
          onDeleteMethod={showTour ? () => {} : handleDeletePaymentMethod}
          onClose={() => {
            if (!showTour) setShowPaymentMethodManager(false);
          }}
          showConfirm={showConfirm}
        />
      )}

      {/* Recurring Expense Manager Modal */}
      {(showRecurringManager || (showTour && tourStepIndex === 4)) && (
        <RecurringManager
          recurringExpenses={showTour ? tourDemoRecurring : recurringExpenses}
          categories={showTour ? tourDemoCategories : categories}
          onCreateRecurring={showTour ? () => {} : handleCreateRecurring}
          onUpdateRecurring={showTour ? () => {} : handleUpdateRecurring}
          onDeleteRecurring={showTour ? () => {} : handleDeleteRecurring}
          onClose={() => {
            if (!showTour) setShowRecurringManager(false);
          }}
          showConfirm={showConfirm}
          addToast={addToast}
        />
      )}

      {/* Settings Panel */}
      {(showSettings || (showTour && tourStepIndex === 5)) && (
        <SettingsPanel
          currentTheme={theme}
          onSelectTheme={setTheme}
          onManageChapters={() => setShowChapterManager(true)}
          onManageCategories={() => setShowCategoryManager(true)}
          onManagePaymentMethods={() => setShowPaymentMethodManager(true)}
          onManageRecurring={() => setShowRecurringManager(true)}
          onOpenAccountManager={() => setShowAccountManager(true)}
          onStartTour={handleStartTour}
          onClose={() => {
            if (!showTour) setShowSettings(false);
          }}
        />
      )}

      {/* Account Manager Modal */}
      {showAccountManager && (
        <AccountManager
          onClose={() => setShowAccountManager(false)}
          addToast={addToast}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />

      {/* Guided Start Tour */}
      <GuidedTour
        isActive={showTour}
        currentStepIndex={tourStepIndex}
        onStepChange={(idx) => setTourStepIndex(idx)}
        onComplete={handleCompleteTour}
        onSkip={handleCompleteTour}
      />

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </>
  );
}

export default App;

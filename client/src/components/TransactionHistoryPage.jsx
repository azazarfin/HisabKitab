import { useState, useMemo, useEffect } from 'react';
import { formatCurrency, formatDate, parseLocalDateBoundary } from '../utils/helpers';

const TransactionHistoryPage = ({
  transactions = [],
  categories = [],
  paymentMethods = [],
  activeChapter,
  onEdit,
  onDelete,
}) => {
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // View Mode: 'cards' | 'table'
  const [viewMode, setViewMode] = useState('cards');

  // Mobile Filters Toggle State
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Sorting State
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sorting Handler
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIndicator = (field) => {
    if (sortBy !== field) return ' ↕';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  // Pre-build Maps for O(1) Instant Performance
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((cat) => {
      if (cat._id) map[cat._id] = cat;
    });
    return map;
  }, [categories]);

  const paymentMethodMap = useMemo(() => {
    const map = {};
    paymentMethods.forEach((pm) => {
      if (pm._id) map[pm._id] = pm;
    });
    return map;
  }, [paymentMethods]);

  const getCategoryInfo = (txn) => {
    if (txn.categoryId && typeof txn.categoryId === 'object') {
      return txn.categoryId;
    }
    return categoryMap[txn.categoryId] || null;
  };

  const getPaymentInfo = (txn) => {
    if (txn.paymentMethodId && typeof txn.paymentMethodId === 'object') {
      return txn.paymentMethodId;
    }
    return paymentMethodMap[txn.paymentMethodId] || null;
  };

  // Filtering & Sorting Logic
  const filteredTransactions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const start = parseLocalDateBoundary(startDate, false);
    const end = parseLocalDateBoundary(endDate, true);

    return transactions
      .filter((txn) => {
        // Filter by Type
        if (filterType !== 'all' && txn.type !== filterType) return false;

        // Filter by Category
        if (filterCategory !== 'all') {
          const catId = txn.categoryId?._id || txn.categoryId;
          if (catId !== filterCategory) return false;
        }

        // Filter by Payment Method
        if (filterPaymentMethod !== 'all') {
          const pmId = txn.paymentMethodId?._id || txn.paymentMethodId;
          if (pmId !== filterPaymentMethod) return false;
        }

        // Filter by Date Range
        if (start || end) {
          const txnDate = new Date(txn.date);
          if (start && txnDate < start) return false;
          if (end && txnDate > end) return false;
        }

        // Search Term
        if (term) {
          const cat = getCategoryInfo(txn);
          const pm = getPaymentInfo(txn);
          const descMatch = (txn.description || '').toLowerCase().includes(term);
          const catMatch = cat?.name?.toLowerCase().includes(term);
          const pmMatch = pm?.name?.toLowerCase().includes(term);
          const amountMatch = txn.amount.toString().includes(term);

          if (!descMatch && !catMatch && !pmMatch && !amountMatch) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'date') {
          comparison = new Date(a.date) - new Date(b.date);
        } else if (sortBy === 'amount') {
          comparison = a.amount - b.amount;
        } else if (sortBy === 'type') {
          comparison = a.type.localeCompare(b.type);
        } else if (sortBy === 'description') {
          comparison = (a.description || '').localeCompare(b.description || '');
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [
    transactions,
    filterType,
    filterCategory,
    filterPaymentMethod,
    startDate,
    endDate,
    searchTerm,
    sortBy,
    sortOrder,
    categoryMap,
    paymentMethodMap,
  ]);

  // Statistics of Filtered Results
  const stats = useMemo(() => {
    let income = 0;
    let spent = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'balance') income += t.amount;
      else spent += t.amount;
    });
    return {
      income,
      spent,
      net: income - spent,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(startIdx, startIdx + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  // Ensure current page is valid when data changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage]);

  // Reset Filters Handler
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterCategory('all');
    setFilterPaymentMethod('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // CSV Export Utility
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const headers = ['Type', 'Date', 'Category', 'Description/Title', 'Payment Method', 'Amount'];
    const rows = filteredTransactions.map((txn) => {
      const cat = getCategoryInfo(txn);
      const pm = getPaymentInfo(txn);
      return [
        escapeCsv(txn.type),
        escapeCsv(formatDate(txn.date)),
        escapeCsv(cat ? cat.name : 'Uncategorized'),
        escapeCsv(txn.description || 'Untitled'),
        escapeCsv(pm ? pm.name : 'N/A'),
        escapeCsv(txn.amount),
      ];
    });

    const csvContent = [headers.map((h) => `"${h}"`).join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `hisabkitab_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="history-page">
      {/* Main Page Title Header */}
      <div className="history-page__header">
        <div>
          <div className="history-page__title-badge">
            <span>📖</span> Chapter History
          </div>
          <h1 className="full-history-heading">
            Full History for <span className="gradient-text">"{activeChapter?.name || 'Current Chapter'}"</span>
          </h1>
          <p className="history-page__subtitle">
            Showing <strong>{filteredTransactions.length}</strong> of <strong>{transactions.length}</strong> total transactions
          </p>
        </div>

        <div className="history-page__actions">
          <button
            type="button"
            className="btn btn--secondary btn--glow"
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
            title="Export current view to CSV"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Filtered Statistics Summary Cards */}
      <div className="history-stats-grid">
        <div className="glass-card history-stat-card history-stat-card--income">
          <div className="history-stat-card__icon-wrapper bg-success-tint">
            <span className="history-stat-card__icon">💰</span>
          </div>
          <div>
            <p className="history-stat-card__label">Filtered Balance Added</p>
            <p className="history-stat-card__value text-success">{formatCurrency(stats.income)}</p>
          </div>
        </div>

        <div className="glass-card history-stat-card history-stat-card--spent">
          <div className="history-stat-card__icon-wrapper bg-danger-tint">
            <span className="history-stat-card__icon">💸</span>
          </div>
          <div>
            <p className="history-stat-card__label">Filtered Total Spent</p>
            <p className="history-stat-card__value text-danger">{formatCurrency(stats.spent)}</p>
          </div>
        </div>

        <div className="glass-card history-stat-card history-stat-card--net">
          <div className="history-stat-card__icon-wrapper bg-primary-tint">
            <span className="history-stat-card__icon">⚖️</span>
          </div>
          <div>
            <p className="history-stat-card__label">Net Filtered Balance</p>
            <p className={`history-stat-card__value ${stats.net < 0 ? 'text-danger' : 'text-primary'}`}>
              {formatCurrency(stats.net)}
            </p>
          </div>
        </div>

        <div className="glass-card history-stat-card history-stat-card--count">
          <div className="history-stat-card__icon-wrapper bg-info-tint">
            <span className="history-stat-card__icon">📋</span>
          </div>
          <div>
            <p className="history-stat-card__label">Matching Records</p>
            <p className="history-stat-card__value">{stats.count}</p>
          </div>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="glass-card history-filter-bar">
        <div className="history-filter-bar__mobile-toggle">
          <button 
            type="button" 
            className="btn btn--secondary btn--full btn--sm"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            {isFiltersOpen ? '▲ Hide Filters' : '▼ Show Advanced Filters'}
          </button>
        </div>

        <div className={`history-filter-bar__content ${isFiltersOpen ? 'is-open' : ''}`}>
          <div className="history-filter-bar__top">
          {/* Search Box */}
          <div className="filter-group">
            <label className="filter-label">Search</label>
            <div className="search-input-wrapper">
              <span className="search-input-icon">🔍</span>
              <input
                type="text"
                className="input search-input"
                placeholder="Search title, category, payment method..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="search-input-clear"
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Type Filter */}
          <div className="filter-group">
            <label className="filter-label">Type</label>
            <select
              className="filter-select"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Types</option>
              <option value="balance">💰 Balance</option>
              <option value="expense">💸 Expense</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="filter-group">
            <label className="filter-label">Category</label>
            <select
              className="filter-select"
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.emoji} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="filter-group">
            <label className="filter-label">Payment Method</label>
            <select
              className="filter-select"
              value={filterPaymentMethod}
              onChange={(e) => {
                setFilterPaymentMethod(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Payment Methods</option>
              {paymentMethods.map((pm) => (
                <option key={pm._id} value={pm._id}>
                  {pm.emoji} {pm.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Second Toolbar Line: Date Range, View Switcher & Page Size */}
        <div className="history-filter-bar__bottom">
          <div className="date-range-group">
            <span className="filter-label">Date Range:</span>
            <input
              type="date"
              className="input input--date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              title="From date"
            />
            <span className="date-separator">to</span>
            <input
              type="date"
              className="input input--date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              title="To date"
            />
          </div>

          <div className="filter-actions-right">
            {/* Layout View Toggle: Card View vs Table View */}
            <div className="view-mode-toggle">
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
                title="Card View"
              >
                🎴 Cards
              </button>
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                📊 Table
              </button>
            </div>

            {(searchTerm ||
              filterType !== 'all' ||
              filterCategory !== 'all' ||
              filterPaymentMethod !== 'all' ||
              startDate ||
              endDate) && (
              <button
                type="button"
                className="btn btn--ghost btn--sm btn--reset-filters"
                onClick={handleResetFilters}
              >
                🔄 Reset Filters
              </button>
            )}

            <div className="page-size-selector">
              <span className="filter-label">Rows:</span>
              <select
                className="filter-select filter-select--sm"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Transactions Content (Card View or Table View) */}
      {paginatedTransactions.length === 0 ? (
        <div className="glass-card empty-history-card">
          <span className="empty-history-icon">🔍</span>
          <h3 className="empty-history-title">No transactions match your criteria</h3>
          <p className="text-muted">Try adjusting your search terms or date range filters</p>
          <button
            type="button"
            className="btn btn--secondary btn--sm mt-3"
            onClick={handleResetFilters}
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* Detailed Card Feed Layout */
        <div className="history-cards-feed">
          {paginatedTransactions.map((txn) => {
            const cat = getCategoryInfo(txn);
            const pm = getPaymentInfo(txn);
            return (
              <div
                key={txn._id}
                className={`glass-card history-detail-card history-detail-card--${txn.type}`}
              >
                <div className="history-detail-card__header">
                  <div className="history-detail-card__title-group">
                    <h3 className="history-detail-card__title">
                      {cat?.emoji && <span className="mr-2">{cat.emoji}</span>}
                      {txn.description || 'Untitled Transaction'}
                    </h3>
                    <div className="history-detail-card__badges">
                      <span className={`type-badge type-badge--${txn.type}`}>
                        {txn.type === 'balance' ? '💰 Balance' : '💸 Expense'}
                      </span>
                      {cat && (
                        <span
                          className="category-badge"
                          style={{
                            background: `${cat.color}20`,
                            color: cat.color,
                            border: `1px solid ${cat.color}40`,
                          }}
                        >
                          {cat.emoji} {cat.name}
                        </span>
                      )}
                      {pm && (
                        <span className="payment-badge">
                          💳 {pm.emoji} {pm.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="history-detail-card__amount-group">
                    <span
                      className={`history-detail-card__amount ${
                        txn.type === 'balance' ? 'amount--positive' : 'amount--negative'
                      }`}
                    >
                      {txn.type === 'balance' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </span>
                    <div className="history-detail-card__actions">
                      {onEdit && (
                        <button
                          type="button"
                          className="action-icon-btn btn--edit"
                          onClick={() => onEdit(txn)}
                          title="Edit transaction"
                        >
                          ✏️
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          className="action-icon-btn btn--delete"
                          onClick={() => onDelete(txn._id)}
                          title="Delete transaction"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="history-detail-card__footer">
                  <span className="history-detail-card__date">
                    📅 {formatDate(txn.date)}
                  </span>
                  <span className="history-detail-card__id text-muted font-mono text-xs">
                    ID: {txn._id ? txn._id.slice(-6) : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View Layout */
        <div className="glass-card expense-table-wrapper">
          <table className="expense-table">
            <thead>
              <tr>
                <th
                  className={`sortable-th ${sortBy === 'type' ? 'sorted' : ''}`}
                  onClick={() => handleSort('type')}
                >
                  Type{getSortIndicator('type')}
                </th>
                <th
                  className={`sortable-th ${sortBy === 'date' ? 'sorted' : ''}`}
                  onClick={() => handleSort('date')}
                >
                  Date{getSortIndicator('date')}
                </th>
                <th>Category</th>
                <th
                  className={`sortable-th ${sortBy === 'description' ? 'sorted' : ''}`}
                  onClick={() => handleSort('description')}
                >
                  Title / Description{getSortIndicator('description')}
                </th>
                <th>Payment Method</th>
                <th
                  className={`sortable-th ${sortBy === 'amount' ? 'sorted' : ''}`}
                  onClick={() => handleSort('amount')}
                >
                  Amount{getSortIndicator('amount')}
                </th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.map((txn) => {
                const cat = getCategoryInfo(txn);
                const pm = getPaymentInfo(txn);
                return (
                  <tr key={txn._id} className="history-table-row">
                    <td>
                      <span className={`type-badge type-badge--${txn.type}`}>
                        {txn.type === 'balance' ? '💰' : '💸'} {txn.type}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">{formatDate(txn.date)}</td>
                    <td>
                      {cat ? (
                        <span
                          className="category-badge"
                          style={{
                            background: `${cat.color}18`,
                            color: cat.color,
                            border: `1px solid ${cat.color}30`,
                          }}
                        >
                          <span>{cat.emoji}</span>
                          {cat.name}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="expense-table__desc">
                      {txn.description ? (
                        <span className="txn-description-text">{txn.description}</span>
                      ) : (
                        <span className="text-muted italic">Untitled</span>
                      )}
                    </td>
                    <td>
                      {pm ? (
                        <span className="payment-badge">
                          {pm.emoji} {pm.name}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className={`expense-table__amount ${txn.type === 'balance' ? 'amount--positive' : 'amount--negative'}`}>
                      {txn.type === 'balance' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </td>
                    <td>
                      <div className="table-actions-cell">
                        <button
                          type="button"
                          className="btn btn--ghost btn--icon"
                          onClick={() => onEdit(txn)}
                          title="Edit transaction"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="btn btn--danger btn--icon"
                          onClick={() => onDelete(txn._id)}
                          title="Delete transaction"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {filteredTransactions.length > 0 && (
        <div className="pagination-bar glass-card">
          <div className="pagination-info">
            Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong>{Math.min(currentPage * pageSize, filteredTransactions.length)}</strong> of{' '}
            <strong>{filteredTransactions.length}</strong> transactions
          </div>

          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                title="First Page"
              >
                «
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                ‹ Prev
              </button>

              <div className="pagination-pages">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    return (
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - currentPage) <= 1
                    );
                  })
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1];
                    const showEllipsis = prevP && p - prevP > 1;
                    return (
                      <span key={p} className="pagination-page-wrapper">
                        {showEllipsis && <span className="pagination-ellipsis">...</span>}
                        <button
                          type="button"
                          className={`btn btn--sm ${
                            currentPage === p ? 'btn--primary' : 'btn--ghost'
                          }`}
                          onClick={() => setCurrentPage(p)}
                        >
                          {p}
                        </button>
                      </span>
                    );
                  })}
              </div>

              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next ›
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                title="Last Page"
              >
                »
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionHistoryPage;

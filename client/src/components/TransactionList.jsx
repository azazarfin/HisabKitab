import { useState } from 'react';
import { formatCurrency, formatDate } from '../utils/helpers';

const TransactionList = ({ transactions, categories, paymentMethods, onEdit, onDelete }) => {
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortIndicator = (field) => {
    if (sortBy !== field) return '';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  const getCategoryInfo = (transaction) => {
    if (transaction.categoryId && typeof transaction.categoryId === 'object') {
      return transaction.categoryId;
    }
    return categories.find((c) => c._id === transaction.categoryId) || null;
  };

  const getPaymentInfo = (transaction) => {
    if (transaction.paymentMethodId && typeof transaction.paymentMethodId === 'object') {
      return transaction.paymentMethodId;
    }
    return paymentMethods.find((p) => p._id === transaction.paymentMethodId) || null;
  };

  const filtered = transactions
    .filter((t) => filterType === 'all' || t.type === filterType)
    .filter((t) => {
      if (filterCategory === 'all') return true;
      const catId = t.categoryId?._id || t.categoryId;
      return catId === filterCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date) - new Date(b.date);
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortBy === 'type') {
        comparison = a.type.localeCompare(b.type);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="expense-section">
      <div className="expense-section__header">
        <h2 className="expense-section__title">Transaction History</h2>

        <div className="expense-section__actions">
          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label="Filter by type"
          >
            <option value="all">All Types</option>
            <option value="balance">💰 Balance</option>
            <option value="expense">💸 Expense</option>
          </select>

          <select
            className="filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.emoji} {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass-card expense-table-wrapper">
        <table className="expense-table">
          <thead>
            <tr>
              <th
                className={sortBy === 'type' ? 'sorted' : ''}
                onClick={() => handleSort('type')}
              >
                Type{sortIndicator('type')}
              </th>
              <th
                className={sortBy === 'date' ? 'sorted' : ''}
                onClick={() => handleSort('date')}
              >
                Date{sortIndicator('date')}
              </th>
              <th>Category</th>
              <th>Description</th>
              <th>Payment</th>
              <th
                className={sortBy === 'amount' ? 'sorted' : ''}
                onClick={() => handleSort('amount')}
              >
                Amount{sortIndicator('amount')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="expense-table__empty">
                  <span className="expense-table__empty-icon">📭</span>
                  <p>No transactions found</p>
                </td>
              </tr>
            ) : (
              filtered.map((txn) => {
                const cat = getCategoryInfo(txn);
                const pm = getPaymentInfo(txn);
                return (
                  <tr key={txn._id}>
                    <td>
                      <span className={`type-badge type-badge--${txn.type}`}>
                        {txn.type === 'balance' ? '💰' : '💸'} {txn.type}
                      </span>
                    </td>
                    <td>{formatDate(txn.date)}</td>
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
                      {txn.description || '—'}
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
                    <td className="expense-table__actions">
                      <button
                        className="btn btn--ghost btn--icon"
                        onClick={() => onEdit(txn)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn--danger btn--icon"
                        onClick={() => onDelete(txn._id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList;

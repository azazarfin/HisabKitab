import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../utils/helpers';

const TransactionList = ({
  transactions = [],
  categories = [],
  paymentMethods = [],
  onEdit,
  onDelete,
  maxDisplay = 5,
}) => {
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

  // Sort by date descending and take top recent items
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, maxDisplay);

  return (
    <div className="dashboard-history-card glass-card animate-fade-in mt-6">
      <h3 className="dashboard-history-title">Transaction History</h3>

      {recentTransactions.length === 0 ? (
        <div className="dashboard-history-empty">
          <span className="empty-icon">📭</span>
          <p>No transactions added yet</p>
        </div>
      ) : (
        <div className="dashboard-history-list">
          {recentTransactions.map((txn) => {
            const cat = getCategoryInfo(txn);
            const pm = getPaymentInfo(txn);
            return (
              <div key={txn._id} className="history-item-row">
                <div className="history-item-main">
                  <div className="history-item-title-row">
                    <span className="history-item-title">
                      {cat?.emoji && <span className="mr-1">{cat.emoji}</span>}
                      {txn.description || 'Untitled Transaction'}
                    </span>
                  </div>
                  <div className="history-item-meta">
                    <span className="history-item-date">{formatDate(txn.date)}</span>
                    {pm && (
                      <span className="history-item-pm font-mono text-xs">
                        • {pm.emoji} {pm.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="history-item-right">
                  <span
                    className={`history-item-amount ${
                      txn.type === 'balance' ? 'amount--positive' : 'amount--negative'
                    }`}
                  >
                    {txn.type === 'balance' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </span>
                  {onEdit && (
                    <button
                      type="button"
                      className="history-item-action-btn btn--edit"
                      onClick={() => onEdit(txn)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      className="history-item-action-btn btn--delete"
                      onClick={() => onDelete(txn._id)}
                      title="Delete"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Centered Referral Link to Full History Page */}
      <div className="dashboard-history-footer">
        <Link
          to="/history"
          className="view-full-history-link"
          onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
        >
          View Full History →
        </Link>
      </div>
    </div>
  );
};

export default TransactionList;

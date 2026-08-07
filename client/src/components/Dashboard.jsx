import { formatCurrency } from '../utils/helpers';
import Charts from './Charts';

const Dashboard = ({ transactions, categories, activeChapter, onAddTransaction }) => {
  const balanceTransactions = transactions.filter((t) => t.type === 'balance');
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');

  const totalBalance = balanceTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const remaining = totalBalance - totalSpent;
  const percentage = totalBalance > 0 ? Math.min((totalSpent / totalBalance) * 100, 100) : 0;

  const getBudgetBarClass = () => {
    if (percentage >= 100) return 'budget-bar__fill--danger';
    if (percentage >= 75) return 'budget-bar__fill--warning';
    return '';
  };

  const getPercentageColor = () => {
    if (percentage >= 100) return 'var(--color-danger)';
    if (percentage >= 75) return 'var(--color-warning)';
    return 'var(--color-primary-light)';
  };

  // Top categories from dynamic user categories
  const categoryMap = {};
  categories.forEach((cat) => {
    categoryMap[cat._id] = cat;
  });

  const categoryTotals = Object.values(
    expenseTransactions.reduce((acc, t) => {
      const catId = t.categoryId?._id || t.categoryId;
      if (!catId) return acc;
      if (!acc[catId]) {
        const cat = typeof t.categoryId === 'object' ? t.categoryId : categoryMap[catId];
        if (!cat) return acc;
        acc[catId] = { ...cat, total: 0 };
      }
      acc[catId].total += t.amount;
      return acc;
    }, {})
  )
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const maxCategoryTotal = categoryTotals.length > 0 ? categoryTotals[0].total : 0;

  return (
    <div className="dashboard">
      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="glass-card summary-card summary-card--balance animate-fade-in">
          <p className="summary-card__label">Total Balance</p>
          <p className="summary-card__value">{formatCurrency(totalBalance)}</p>
        </div>

        <div className="glass-card summary-card summary-card--spent animate-fade-in">
          <p className="summary-card__label">Total Spent</p>
          <p className="summary-card__value">{formatCurrency(totalSpent)}</p>
        </div>

        <div className="glass-card summary-card summary-card--remaining animate-fade-in">
          <p className="summary-card__label">Remaining</p>
          <p className={`summary-card__value ${remaining < 0 ? 'summary-card__value--danger' : ''}`}>
            {totalBalance > 0 ? formatCurrency(remaining) : '—'}
          </p>
        </div>
      </div>

      {/* Balance Progress Bar */}
      {totalBalance > 0 && (
        <div className="glass-card budget-bar animate-fade-in">
          <div className="budget-bar__header">
            <span className="budget-bar__label">
              Balance Usage — {formatCurrency(totalSpent)} of {formatCurrency(totalBalance)}
            </span>
            <span
              className="budget-bar__percentage"
              style={{ color: getPercentageColor() }}
            >
              {percentage.toFixed(1)}%
            </span>
          </div>
          <div className="budget-bar__track">
            <div
              className={`budget-bar__fill ${getBudgetBarClass()}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Add Transaction Action Banner */}
      {onAddTransaction && (
        <div className="add-transaction-banner animate-fade-in">
          <button
            className="btn btn--primary btn--add-transaction-lg"
            onClick={onAddTransaction}
          >
            Add Transaction
          </button>
        </div>
      )}

      {/* Charts */}
      <Charts
        transactions={expenseTransactions}
        categories={categories}
        activeChapter={activeChapter}
      />

      {/* Top Categories */}
      {categoryTotals.length > 0 && (
        <div className="glass-card top-categories animate-fade-in">
          <h3 className="top-categories__title">Top Spending Categories</h3>
          {categoryTotals.map((cat) => (
            <div className="category-row" key={cat._id}>
              <span className="category-row__emoji">{cat.emoji}</span>
              <div className="category-row__info">
                <p className="category-row__name">{cat.name}</p>
                <div className="category-row__bar">
                  <div
                    className="category-row__bar-fill"
                    style={{
                      width: `${(cat.total / maxCategoryTotal) * 100}%`,
                      background: cat.color,
                    }}
                  />
                </div>
              </div>
              <span className="category-row__amount">{formatCurrency(cat.total)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;

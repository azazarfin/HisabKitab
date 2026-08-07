import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/helpers';
import { fetchRecurring } from '../api/api';

const TransactionForm = ({ categories, paymentMethods, chapterId, onSubmit, onClose, initialData }) => {
  const isEditing = !!initialData;

  const [transactionType, setTransactionType] = useState(
    initialData?.type || 'expense'
  );

  const [formData, setFormData] = useState({
    amount: '',
    categoryId: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethodId: '',
  });

  const [recurringItems, setRecurringItems] = useState([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        amount: initialData.amount?.toString() || '',
        categoryId: initialData.categoryId?._id || initialData.categoryId || '',
        description: initialData.description || '',
        date: initialData.date
          ? new Date(initialData.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        paymentMethodId: initialData.paymentMethodId?._id || initialData.paymentMethodId || '',
      });
      setTransactionType(initialData.type || 'expense');
    }
  }, [initialData]);

  // Load recurring suggestions when category changes
  useEffect(() => {
    if (transactionType === 'expense' && formData.categoryId) {
      fetchRecurring(formData.categoryId)
        .then(setRecurringItems)
        .catch(() => setRecurringItems([]));
    } else {
      setRecurringItems([]);
    }
  }, [formData.categoryId, transactionType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRecurringSuggestion = (item) => {
    setFormData((prev) => ({
      ...prev,
      amount: item.amount.toString(),
      description: item.description || item.name,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) return;

    const data = {
      type: transactionType,
      amount: Number(formData.amount),
      chapterId,
      date: formData.date,
      description: formData.description,
    };

    if (formData.paymentMethodId) data.paymentMethodId = formData.paymentMethodId;
    if (transactionType === 'expense' && formData.categoryId) {
      data.categoryId = formData.categoryId;
    }

    onSubmit(data);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">
            {isEditing ? '✏️ Edit Transaction' : '➕ Add Transaction'}
          </h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        {/* Transaction Type Toggle */}
        {!isEditing && (
          <div className="type-toggle">
            <button
              className={`type-toggle__btn ${transactionType === 'balance' ? 'type-toggle__btn--active type-toggle__btn--balance' : ''}`}
              onClick={() => setTransactionType('balance')}
              type="button"
            >
              💰 Add Balance
            </button>
            <button
              className={`type-toggle__btn ${transactionType === 'expense' ? 'type-toggle__btn--active type-toggle__btn--expense' : ''}`}
              onClick={() => setTransactionType('expense')}
              type="button"
            >
              💸 Add Expense
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {transactionType === 'expense' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="txn-category">Category</label>
                  <select
                    id="txn-category"
                    className="form-select"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                  >
                    <option value="">Select category...</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.emoji} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="txn-payment">Payment Method</label>
                  <select
                    id="txn-payment"
                    className="form-select"
                    name="paymentMethodId"
                    value={formData.paymentMethodId}
                    onChange={handleChange}
                  >
                    <option value="">Select method...</option>
                    {paymentMethods.map((pm) => (
                      <option key={pm._id} value={pm._id}>
                        {pm.emoji} {pm.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recurring Suggestions */}
              {recurringItems.length > 0 && (
                <div className="recurring-suggestions">
                  <p className="suggestion-label">⚡ Quick fill from recurring:</p>
                  <div className="suggestion-chips">
                    {recurringItems.map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        className="suggestion-chip suggestion-chip--recurring"
                        onClick={() => handleRecurringSuggestion(item)}
                      >
                        <span className="suggestion-chip__name">{item.name}</span>
                        <span className="suggestion-chip__amount">{formatCurrency(item.amount)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="txn-description">Title</label>
            <input
              id="txn-description"
              className="form-input"
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={transactionType === 'balance' ? 'e.g., Salary, Freelance payment' : 'e.g., Weekly groceries'}
              maxLength={200}
              autoFocus
            />
          </div>

          {transactionType === 'balance' && (
            <div className="form-group">
              <label className="form-label" htmlFor="txn-payment">Deposited Via</label>
              <select
                id="txn-payment"
                className="form-select"
                name="paymentMethodId"
                value={formData.paymentMethodId}
                onChange={handleChange}
              >
                <option value="">Select method...</option>
                {paymentMethods.map((pm) => (
                  <option key={pm._id} value={pm._id}>
                    {pm.emoji} {pm.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="txn-amount">
              Amount (৳)
            </label>
            <input
              id="txn-amount"
              className="form-input form-input--amount"
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="1"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="txn-date">Date</label>
            <input
              id="txn-date"
              className="form-input"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${transactionType === 'balance' ? 'btn--primary' : 'btn--danger-fill'}`}
            >
              {isEditing ? 'Update' : transactionType === 'balance' ? 'Add Balance' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;

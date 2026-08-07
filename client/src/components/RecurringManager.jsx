import { useState } from 'react';
import { formatCurrency } from '../utils/helpers';

const RecurringManager = ({ recurringExpenses, categories, onCreateRecurring, onUpdateRecurring, onDeleteRecurring, onClose }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    categoryId: '',
    description: '',
  });

  const resetForm = () => {
    setFormData({ name: '', amount: '', categoryId: '', description: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.amount || !formData.categoryId) return;

    const data = {
      ...formData,
      amount: Number(formData.amount),
    };

    if (editingId) {
      onUpdateRecurring(editingId, data);
    } else {
      onCreateRecurring(data);
    }
    resetForm();
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      name: item.name,
      amount: item.amount.toString(),
      categoryId: item.categoryId?._id || item.categoryId || '',
      description: item.description || '',
    });
    setShowForm(true);
  };

  const getCategoryName = (item) => {
    if (item.categoryId && typeof item.categoryId === 'object') {
      return `${item.categoryId.emoji} ${item.categoryId.name}`;
    }
    const cat = categories.find((c) => c._id === item.categoryId);
    return cat ? `${cat.emoji} ${cat.name}` : 'Unknown';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">🔄 Recurring Expenses</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <p className="manager-hint">
          Set up recurring expenses like subscriptions or monthly bills. They'll appear as quick-fill suggestions when you add expenses under the same category.
        </p>

        {/* Add / Edit Form */}
        {!showForm ? (
          <button
            className="btn btn--primary btn--full"
            onClick={() => {
              if (categories.length === 0) {
                alert('Please create at least one category first.');
                return;
              }
              setShowForm(true);
            }}
          >
            ➕ Add Recurring Expense
          </button>
        ) : (
          <form className="manager-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label" htmlFor="rec-name">Name</label>
                <input
                  id="rec-name"
                  className="form-input"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Netflix, Gym, Internet"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="rec-amount">Amount (৳)</label>
                <input
                  id="rec-amount"
                  className="form-input"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="0"
                  min="0"
                  step="1"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="rec-category">Category</label>
                <select
                  id="rec-category"
                  className="form-select"
                  value={formData.categoryId}
                  onChange={(e) => setFormData((p) => ({ ...p, categoryId: e.target.value }))}
                  required
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
                <label className="form-label" htmlFor="rec-desc">Description</label>
                <input
                  id="rec-desc"
                  className="form-input"
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Optional note"
                  maxLength={200}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn--secondary" onClick={resetForm}>Cancel</button>
              <button type="submit" className="btn btn--primary">
                {editingId ? 'Update' : 'Add Recurring'}
              </button>
            </div>
          </form>
        )}

        {/* Recurring List */}
        <div className="manager-list">
          {recurringExpenses.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state__icon">🔄</span>
              <p>No recurring expenses yet. Add one to speed up expense tracking!</p>
            </div>
          ) : (
            recurringExpenses.map((item) => (
              <div key={item._id} className="manager-item">
                <div className="manager-item__info">
                  <span className="manager-item__name">🔄 {item.name}</span>
                  <span className="manager-item__meta">
                    {getCategoryName(item)} · {formatCurrency(item.amount)}
                  </span>
                  {item.description && (
                    <span className="manager-item__desc">{item.description}</span>
                  )}
                </div>
                <div className="manager-item__actions">
                  <button
                    className="btn btn--ghost btn--icon"
                    onClick={() => handleEdit(item)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn btn--danger btn--icon"
                    onClick={() => {
                      if (confirm(`Delete recurring expense "${item.name}"?`)) {
                        onDeleteRecurring(item._id);
                      }
                    }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RecurringManager;

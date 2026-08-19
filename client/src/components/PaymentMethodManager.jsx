import { useState } from 'react';
import { defaultPaymentMethodSuggestions } from '../data/categories';

const PaymentMethodManager = ({ paymentMethods, onCreateMethod, onUpdateMethod, onDeleteMethod, onClose, showConfirm }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', emoji: '💳' });

  const existingNames = paymentMethods.map((m) => m.name.toLowerCase());
  const availableSuggestions = defaultPaymentMethodSuggestions.filter(
    (s) => !existingNames.includes(s.name.toLowerCase())
  );

  const resetForm = () => {
    setFormData({ name: '', emoji: '💳' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingId) {
      onUpdateMethod(editingId, formData);
    } else {
      onCreateMethod(formData);
    }
    resetForm();
  };

  const handleEdit = (method) => {
    setEditingId(method._id);
    setFormData({ name: method.name, emoji: method.emoji });
    setShowForm(true);
  };

  const handleSuggestionClick = (suggestion) => {
    onCreateMethod({ name: suggestion.name, emoji: suggestion.emoji });
  };

  const handleDeleteClick = (method) => {
    if (showConfirm) {
      showConfirm(
        'Delete Payment Method',
        `Delete payment method "${method.name}"? Transactions using it will have no payment method set.`,
        () => onDeleteMethod(method._id)
      );
    } else {
      onDeleteMethod(method._id);
    }
  };

  const emojiOptions = ['💳', '💵', '🏦', '📱', '💰', '🪙', '💸', '🏧'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">💳 Payment Methods</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        {/* Suggestion Chips */}
        {availableSuggestions.length > 0 && !showForm && (
          <div className="suggestion-section">
            <p className="suggestion-label">Quick add:</p>
            <div className="suggestion-chips">
              {availableSuggestions.map((s) => (
                <button
                  key={s.name}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(s)}
                >
                  <span>{s.emoji}</span>
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add / Edit Form */}
        {!showForm ? (
          <button
            className="btn btn--primary btn--full"
            onClick={() => setShowForm(true)}
            style={{ marginTop: 'var(--space-md)' }}
          >
            ➕ Add Custom Method
          </button>
        ) : (
          <form className="manager-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Emoji</label>
                <div className="emoji-picker">
                  {emojiOptions.map((em) => (
                    <button
                      key={em}
                      type="button"
                      className={`emoji-btn ${formData.emoji === em ? 'emoji-btn--active' : ''}`}
                      onClick={() => setFormData((p) => ({ ...p, emoji: em }))}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label" htmlFor="pm-name">Method Name</label>
                <input
                  id="pm-name"
                  className="form-input"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Apple Pay"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn--secondary" onClick={resetForm}>Cancel</button>
              <button type="submit" className="btn btn--primary">
                {editingId ? 'Update' : 'Add Method'}
              </button>
            </div>
          </form>
        )}

        {/* Method List */}
        <div className="manager-list">
          {paymentMethods.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state__icon">💳</span>
              <p>No payment methods yet. Add from suggestions or create your own!</p>
            </div>
          ) : (
            paymentMethods.map((method) => (
              <div key={method._id} className="manager-item">
                <div className="manager-item__info">
                  <span className="manager-item__name">{method.emoji} {method.name}</span>
                </div>
                <div className="manager-item__actions">
                  <button
                    className="btn btn--ghost btn--icon"
                    onClick={() => handleEdit(method)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn btn--danger btn--icon"
                    onClick={() => handleDeleteClick(method)}
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

export default PaymentMethodManager;

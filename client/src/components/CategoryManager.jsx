import { useState } from 'react';
import { defaultCategorySuggestions } from '../data/categories';

const CategoryManager = ({ categories, onCreateCategory, onUpdateCategory, onDeleteCategory, onClose }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', emoji: '📦', color: '#64748b' });

  const existingNames = categories.map((c) => c.name.toLowerCase());
  const availableSuggestions = defaultCategorySuggestions.filter(
    (s) => !existingNames.includes(s.name.toLowerCase())
  );

  const resetForm = () => {
    setFormData({ name: '', emoji: '📦', color: '#64748b' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingId) {
      onUpdateCategory(editingId, formData);
    } else {
      onCreateCategory(formData);
    }
    resetForm();
  };

  const handleEdit = (cat) => {
    setEditingId(cat._id);
    setFormData({ name: cat.name, emoji: cat.emoji, color: cat.color });
    setShowForm(true);
  };

  const handleSuggestionClick = (suggestion) => {
    setFormData({ name: suggestion.name, emoji: suggestion.emoji, color: suggestion.color });
    setShowForm(true);
  };

  const emojiOptions = ['📦', '🍚', '🏠', '🚌', '📱', '⚡', '👨‍👩‍👧‍👦', '🏥', '👕', '📚', '🎭', '🤝', '💼', '🎮', '☕', '🛒', '💊', '🎓', '🏋️', '✈️', '🐕', '🎁', '🔧', '📝'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">🏷️ Category Manager</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        {/* Suggestion Chips */}
        {availableSuggestions.length > 0 && !showForm && (
          <div className="suggestion-section">
            <p className="suggestion-label">Quick add suggestions:</p>
            <div className="suggestion-chips">
              {availableSuggestions.map((s) => (
                <button
                  key={s.name}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(s)}
                  style={{ borderColor: s.color + '40', background: s.color + '10' }}
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
            ➕ Add Custom Category
          </button>
        ) : (
          <form className="manager-form" onSubmit={handleSubmit}>
            <div className="form-row form-row--3col">
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
                <label className="form-label" htmlFor="cat-name">Category Name</label>
                <input
                  id="cat-name"
                  className="form-input"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Groceries"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cat-color">Color</label>
                <div className="color-picker-wrapper">
                  <input
                    id="cat-color"
                    className="form-color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))}
                  />
                  <span className="color-preview" style={{ background: formData.color }}></span>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn--secondary" onClick={resetForm}>Cancel</button>
              <button type="submit" className="btn btn--primary">
                {editingId ? 'Update' : 'Add Category'}
              </button>
            </div>
          </form>
        )}

        {/* Category List */}
        <div className="manager-list">
          {categories.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state__icon">🏷️</span>
              <p>No categories yet. Add from suggestions or create your own!</p>
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat._id} className="manager-item">
                <div className="manager-item__info">
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
                </div>
                <div className="manager-item__actions">
                  <button
                    className="btn btn--ghost btn--icon"
                    onClick={() => handleEdit(cat)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn btn--danger btn--icon"
                    onClick={() => {
                      if (confirm(`Delete category "${cat.name}"?`)) {
                        onDeleteCategory(cat._id);
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

export default CategoryManager;

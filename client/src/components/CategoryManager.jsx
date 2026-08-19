import { useState } from 'react';
import { defaultCategorySuggestions } from '../data/categories';

const CategoryManager = ({ categories, onCreateCategory, onUpdateCategory, onDeleteCategory, onClose, showConfirm }) => {
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

  const handleDeleteClick = (cat) => {
    if (showConfirm) {
      showConfirm(
        'Delete Category',
        `Delete category "${cat.name}"? Existing transactions will become uncategorized.`,
        () => onDeleteCategory(cat._id)
      );
    } else {
      onDeleteCategory(cat._id);
    }
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
                  type="button"
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

        {/* Add/Edit Form */}
        {showForm ? (
          <form className="manager-form animate-fade-in" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="cat-name">Category Name</label>
              <input
                id="cat-name"
                className="form-input"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Groceries, Rent, Gym"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Pick Emoji</label>
              <div className="emoji-picker">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`emoji-btn ${formData.emoji === emoji ? 'emoji-btn--selected' : ''}`}
                    onClick={() => setFormData({ ...formData, emoji })}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cat-color">Badge Color</label>
              <div className="color-picker-row">
                <input
                  id="cat-color"
                  type="color"
                  className="color-input"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
                <span className="color-preview-text">{formData.color}</span>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn--secondary" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" className="btn btn--primary">
                {editingId ? 'Update Category' : 'Add Category'}
              </button>
            </div>
          </form>
        ) : (
          <button
            className="btn btn--primary btn--full mb-4"
            onClick={() => setShowForm(true)}
          >
            + Add New Category
          </button>
        )}

        {/* Category List */}
        <div className="manager-list">
          {categories.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state__icon">🏷️</span>
              <p>No categories yet. Add one above!</p>
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
                    onClick={() => handleDeleteClick(cat)}
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

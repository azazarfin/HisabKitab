import { useState } from 'react';
import { formatDateShort, formatInputDate } from '../utils/helpers';

const ChapterManager = ({ chapters, onCreateChapter, onUpdateChapter, onDeleteChapter, onImport, onClose, showConfirm }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    useDateRange: false,
  });
  const [importSource, setImportSource] = useState(null);
  const [importTarget, setImportTarget] = useState(null);

  const resetForm = () => {
    setFormData({ name: '', description: '', startDate: '', endDate: '', useDateRange: false });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const data = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      startDate: formData.useDateRange && formData.startDate ? formData.startDate : null,
      endDate: formData.useDateRange && formData.endDate ? formData.endDate : null,
    };

    if (editingId) {
      onUpdateChapter(editingId, data);
    } else {
      onCreateChapter(data);
    }
    resetForm();
  };

  const handleEdit = (chapter) => {
    setEditingId(chapter._id);
    setFormData({
      name: chapter.name,
      description: chapter.description || '',
      startDate: chapter.startDate ? formatInputDate(chapter.startDate) : '',
      endDate: chapter.endDate ? formatInputDate(chapter.endDate) : '',
      useDateRange: !!(chapter.startDate || chapter.endDate),
    });
    setShowForm(true);
  };

  const handleImport = (targetId) => {
    if (importSource && targetId) {
      onImport(targetId, importSource);
      setImportSource(null);
      setImportTarget(null);
    }
  };

  const handleDeleteClick = (chapter) => {
    if (showConfirm) {
      showConfirm(
        'Delete Chapter',
        `Delete "${chapter.name}" and all its transactions? This cannot be undone.`,
        () => onDeleteChapter(chapter._id)
      );
    } else {
      onDeleteChapter(chapter._id);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">📖 Manage Chapters</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        {/* Add / Edit Form */}
        {!showForm ? (
          <button
            className="btn btn--primary btn--full"
            onClick={() => setShowForm(true)}
          >
            ➕ Create New Chapter
          </button>
        ) : (
          <form className="manager-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="chapter-name">Chapter Name</label>
              <input
                id="chapter-name"
                className="form-input"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g., August 2026, Semester 1"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="chapter-desc">Description (optional)</label>
              <input
                id="chapter-desc"
                className="form-input"
                type="text"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="e.g., Monthly expenses for August"
                maxLength={300}
              />
            </div>

            <div className="form-group">
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.useDateRange}
                  onChange={(e) => setFormData((p) => ({ ...p, useDateRange: e.target.checked }))}
                />
                <span>Set date range</span>
              </label>
            </div>

            {formData.useDateRange && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="chapter-start">Start Date</label>
                  <input
                    id="chapter-start"
                    className="form-input"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="chapter-end">End Date</label>
                  <input
                    id="chapter-end"
                    className="form-input"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn btn--secondary" onClick={resetForm}>Cancel</button>
              <button type="submit" className="btn btn--primary">
                {editingId ? 'Update' : 'Create Chapter'}
              </button>
            </div>
          </form>
        )}

        {/* Chapter List */}
        <div className="manager-list">
          {chapters.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state__icon">📖</span>
              <p>No chapters yet. Create your first one above!</p>
            </div>
          ) : (
            chapters.map((chapter) => (
              <div key={chapter._id} className="manager-item">
                <div className="manager-item__info">
                  <span className="manager-item__name">📖 {chapter.name}</span>
                  {chapter.description && (
                    <span className="manager-item__desc">{chapter.description}</span>
                  )}
                  {(chapter.startDate || chapter.endDate) && (
                    <span className="manager-item__meta">
                      📅 {formatDateShort(chapter.startDate)} → {formatDateShort(chapter.endDate)}
                    </span>
                  )}
                </div>
                <div className="manager-item__actions">
                  {importTarget === chapter._id ? (
                    <div className="import-panel">
                      <select
                        className="form-select form-select--sm"
                        value={importSource || ''}
                        onChange={(e) => setImportSource(e.target.value)}
                      >
                        <option value="">Select source...</option>
                        {chapters.filter((c) => c._id !== chapter._id).map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                      <button
                        className="btn btn--primary btn--sm"
                        onClick={() => handleImport(chapter._id)}
                        disabled={!importSource}
                      >
                        Import
                      </button>
                      <button
                        className="btn btn--secondary btn--sm"
                        onClick={() => { setImportTarget(null); setImportSource(null); }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        className="btn btn--ghost btn--icon"
                        onClick={() => { setImportTarget(chapter._id); setImportSource(null); }}
                        title="Import from another chapter"
                      >
                        📥
                      </button>
                      <button
                        className="btn btn--ghost btn--icon"
                        onClick={() => handleEdit(chapter)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn--danger btn--icon"
                        onClick={() => handleDeleteClick(chapter)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ChapterManager;

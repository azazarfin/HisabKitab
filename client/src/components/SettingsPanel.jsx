const themes = [
  { id: 'charcoal', name: 'Dark', icon: '🌙' },
  { id: 'navy', name: 'Blue', icon: '🌊' },
  { id: 'oled', name: 'Black', icon: '🖤' },
  { id: 'light', name: 'Light', icon: '☀️' },
];

const SettingsPanel = ({
  currentTheme = 'charcoal',
  onSelectTheme,
  onManageChapters,
  onManageCategories,
  onManagePaymentMethods,
  onManageRecurring,
  onClose,
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--settings" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Settings</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-section">
          <h3 className="settings-section__title">Appearance & Theme</h3>
          <div className="theme-row">
            {themes.map((theme) => {
              const isActive = currentTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  className={`theme-btn ${isActive ? 'theme-btn--active' : ''}`}
                  onClick={() => onSelectTheme && onSelectTheme(theme.id)}
                >
                  <span className="theme-btn__icon">{theme.icon}</span>
                  <span className="theme-btn__name">{theme.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="settings-section">
          <h3 className="settings-section__title">⚙️ Data Management</h3>
          <div className="settings-grid">
            <button className="settings-item" onClick={() => { onClose(); onManageChapters(); }}>
              <span className="settings-item__icon">📖</span>
              <div className="settings-item__info">
                <span className="settings-item__title">Chapter Manager</span>
                <span className="settings-item__desc">Create, edit, delete, or import chapters</span>
              </div>
              <span className="settings-item__arrow">→</span>
            </button>

            <button className="settings-item" onClick={() => { onClose(); onManageCategories(); }}>
              <span className="settings-item__icon">🏷️</span>
              <div className="settings-item__info">
                <span className="settings-item__title">Category Manager</span>
                <span className="settings-item__desc">Create, edit, and delete expense categories</span>
              </div>
              <span className="settings-item__arrow">→</span>
            </button>

            <button className="settings-item" onClick={() => { onClose(); onManagePaymentMethods(); }}>
              <span className="settings-item__icon">💳</span>
              <div className="settings-item__info">
                <span className="settings-item__title">Payment Methods</span>
                <span className="settings-item__desc">Manage your payment options</span>
              </div>
              <span className="settings-item__arrow">→</span>
            </button>

            <button className="settings-item" onClick={() => { onClose(); onManageRecurring(); }}>
              <span className="settings-item__icon">🔄</span>
              <div className="settings-item__info">
                <span className="settings-item__title">Recurring Expenses</span>
                <span className="settings-item__desc">Set up templates for frequent expenses</span>
              </div>
              <span className="settings-item__arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;

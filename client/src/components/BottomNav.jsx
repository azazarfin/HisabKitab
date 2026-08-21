import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const BottomNav = ({ onAddTransaction, onOpenSettings, activeChapter, chapters, onSelectChapter }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showFabMenu, setShowFabMenu] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleFabClick = () => {
    setShowFabMenu((prev) => !prev);
    // Haptic feedback if available
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleAddAction = (type) => {
    setShowFabMenu(false);
    onAddTransaction(type);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  return (
    <>
      {/* FAB Menu Overlay */}
      {showFabMenu && (
        <div className="fab-menu-overlay" onClick={() => setShowFabMenu(false)}>
          <div className="fab-menu" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="fab-menu__item fab-menu__item--balance"
              onClick={() => handleAddAction('balance')}
            >
              <span className="fab-menu__icon">💰</span>
              <span className="fab-menu__label">Add Balance</span>
            </button>
            <button
              type="button"
              className="fab-menu__item fab-menu__item--expense"
              onClick={() => handleAddAction('expense')}
            >
              <span className="fab-menu__icon">💸</span>
              <span className="fab-menu__label">Add Expense</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="bottom-nav" id="bottom-nav">
        <button
          type="button"
          id="nav-tab-home"
          className={`bottom-nav__item ${isActive('/') ? 'bottom-nav__item--active' : ''}`}
          onClick={() => navigate('/')}
        >
          <span className="bottom-nav__icon">🏠</span>
          <span className="bottom-nav__label">Home</span>
        </button>

        <button
          type="button"
          id="nav-tab-history"
          className={`bottom-nav__item ${isActive('/history') ? 'bottom-nav__item--active' : ''}`}
          onClick={() => navigate('/history')}
        >
          <span className="bottom-nav__icon">📋</span>
          <span className="bottom-nav__label">History</span>
        </button>

        {/* Center FAB */}
        <div className="bottom-nav__fab-wrapper" id="nav-tab-fab">
          <button
            type="button"
            className={`bottom-nav__fab ${showFabMenu ? 'bottom-nav__fab--active' : ''}`}
            onClick={handleFabClick}
            aria-label="Add transaction"
          >
            <span className="bottom-nav__fab-icon">{showFabMenu ? '✕' : '+'}</span>
          </button>
        </div>

        <button
          type="button"
          id="nav-tab-settings"
          className="bottom-nav__item"
          onClick={onOpenSettings}
        >
          <span className="bottom-nav__icon">⚙️</span>
          <span className="bottom-nav__label">Settings</span>
        </button>

        <div className="bottom-nav__item" id="nav-tab-chapter" style={{ position: 'relative' }}>
          <span className="bottom-nav__icon">📖</span>
          <span className="bottom-nav__label" style={{ maxWidth: '45px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeChapter ? activeChapter.name : 'Chapter'}
          </span>
          <select
            style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
            value={activeChapter?._id || ''}
            onChange={(e) => onSelectChapter(e.target.value)}
          >
            {chapters?.length === 0 ? (
              <option value="">No chapters</option>
            ) : (
              chapters?.map((ch) => (
                <option key={ch._id} value={ch._id}>
                  {ch.name}
                </option>
              ))
            )}
          </select>
        </div>
      </nav>
    </>
  );
};

export default BottomNav;

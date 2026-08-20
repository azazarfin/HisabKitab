import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = ({
  activeChapter,
  chapters = [],
  onSelectChapter,
  onOpenSettings,
  onOpenAccountManager,
}) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
  };

  const handleAccountManagerClick = () => {
    setDropdownOpen(false);
    if (onOpenAccountManager) {
      onOpenAccountManager();
    }
  };

  // Get user initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="header">
      <Link to="/" className="header__brand" title="Go to Dashboard">
        <span className="header__logo">📊</span>
        <div>
          <h1 className="header__title">HisabKitab</h1>
          <p className="header__subtitle">Track your spending smartly</p>
        </div>
      </Link>

      <div className="header__nav">
        {/* Chapter Selector (Desktop) */}
        <div className="chapter-selector">
          <select
            className="chapter-selector__select"
            value={activeChapter?._id || ''}
            onChange={(e) => onSelectChapter(e.target.value)}
            aria-label="Select Chapter"
          >
            {chapters.length === 0 ? (
              <option value="">No chapters</option>
            ) : (
              chapters.map((ch) => (
                <option key={ch._id} value={ch._id}>
                  📖 {ch.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Settings Menu (Desktop) */}
        <button type="button" className="btn btn--secondary" onClick={onOpenSettings}>
          🛠️ Settings
        </button>

        {/* User Profile Avatar with Dropdown (Desktop & Mobile) */}
        {user && (
          <div className="header__user-menu" ref={dropdownRef}>
            <button
              type="button"
              className={`header__user-avatar-btn ${dropdownOpen ? 'header__user-avatar-btn--active' : ''}`}
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-expanded={dropdownOpen}
              aria-label="Account menu"
              title={user.name || 'Account'}
            >
              <div className="header__user-avatar">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="header__user-avatar-img"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="header__user-avatar-initials">
                    {getInitials(user.name)}
                  </span>
                )}
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {dropdownOpen && (
              <div className="header__profile-dropdown animate-fade-in">
                <div className="header__profile-dropdown-user">
                  <span className="header__profile-dropdown-name">{user.name}</span>
                  <span className="header__profile-dropdown-email">{user.email}</span>
                </div>
                <div className="header__profile-dropdown-divider" />
                <button
                  type="button"
                  className="header__profile-dropdown-item"
                  onClick={handleAccountManagerClick}
                >
                  <span className="header__profile-dropdown-icon">👤</span>
                  <span>Account Manager</span>
                </button>
                <button
                  type="button"
                  className="header__profile-dropdown-item header__profile-dropdown-item--logout"
                  onClick={handleLogout}
                >
                  <span className="header__profile-dropdown-icon">🚪</span>
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

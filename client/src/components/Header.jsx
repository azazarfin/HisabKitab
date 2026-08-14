import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = ({
  activeChapter,
  chapters,
  onSelectChapter,
  onOpenSettings,
}) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
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
        {/* Chapter Selector */}
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

        {/* Settings Menu */}
        <button type="button" className="btn btn--secondary" onClick={onOpenSettings}>
          🛠️ Settings
        </button>

        {/* User Menu */}
        {user && (
          <div className="header__user-menu">
            <div className="header__user-avatar" title={user.name}>
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
            <button
              type="button"
              className="btn btn--ghost header__logout-btn"
              onClick={handleLogout}
              title="Sign out"
            >
              🚪
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

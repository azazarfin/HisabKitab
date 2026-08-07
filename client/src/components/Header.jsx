import { Link } from 'react-router-dom';

const Header = ({
  activeChapter,
  chapters,
  onSelectChapter,
  onOpenSettings,
}) => {
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
      </div>
    </header>
  );
};

export default Header;

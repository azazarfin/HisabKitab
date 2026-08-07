const Header = ({ activeChapter, chapters, onSelectChapter, onOpenSettings }) => {
  return (
    <header className="header">
      <div className="header__brand">
        <span className="header__logo">📊</span>
        <div>
          <h1 className="header__title">HisabKitab</h1>
          <p className="header__subtitle">Track your spending smartly</p>
        </div>
      </div>

      <div className="header__nav">
        {/* Chapter Selector */}
        <div className="chapter-selector">
          <select
            className="chapter-selector__select"
            value={activeChapter?._id || ''}
            onChange={(e) => onSelectChapter(e.target.value)}
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
        <button className="btn btn--secondary" onClick={onOpenSettings}>
          🛠️ Settings
        </button>
      </div>
    </header>
  );
};

export default Header;

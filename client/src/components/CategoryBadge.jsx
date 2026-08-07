const CategoryBadge = ({ category }) => {
  if (!category) return <span className="text-muted">—</span>;

  return (
    <span
      className="category-badge"
      style={{
        background: `${category.color}18`,
        color: category.color,
        border: `1px solid ${category.color}30`,
      }}
    >
      <span>{category.emoji}</span>
      {category.name}
    </span>
  );
};

export default CategoryBadge;

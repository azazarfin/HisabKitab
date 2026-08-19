import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { formatDateShort } from '../utils/helpers';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Charts = ({ transactions, categories, activeChapter }) => {
  // Responsive legend positioning
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Build category map from fetched categories
  const categoryMap = {};
  categories.forEach((cat) => {
    categoryMap[cat._id] = cat;
  });

  // Filter expense transactions only
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');

  // Spending by category — Donut chart
  const categoryTotals = Object.values(
    expenseTransactions.reduce((acc, t) => {
      const catId = t.categoryId?._id || t.categoryId || 'uncategorized';
      if (!acc[catId]) {
        if (catId === 'uncategorized') {
          acc[catId] = { _id: 'uncategorized', name: 'Uncategorized', emoji: '📦', color: '#64748b', total: 0 };
        } else {
          const cat = typeof t.categoryId === 'object' ? t.categoryId : categoryMap[catId];
          acc[catId] = cat ? { ...cat, total: 0 } : { _id: catId, name: 'Uncategorized', emoji: '📦', color: '#64748b', total: 0 };
        }
      }
      acc[catId].total += t.amount;
      return acc;
    }, {})
  )
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const donutData = {
    labels: categoryTotals.map((c) => `${c.emoji} ${c.name}`),
    datasets: [
      {
        data: categoryTotals.map((c) => c.total),
        backgroundColor: categoryTotals.map((c) => c.color || '#64748b'),
        borderColor: 'transparent',
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: isMobile ? 'bottom' : 'right',
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 11 },
          padding: 12,
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(148,163,184,0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: (ctx) => ` ৳ ${ctx.parsed.toLocaleString()}`,
        },
      },
    },
  };

  // Daily spending — Bar chart (group by local calendar day)
  const dailyTotals = {};
  expenseTransactions.forEach((t) => {
    const d = new Date(t.date);
    if (isNaN(d.getTime())) return;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const isoDayKey = `${year}-${month}-${day}`;
    dailyTotals[isoDayKey] = (dailyTotals[isoDayKey] || 0) + t.amount;
  });

  const sortedDays = Object.entries(dailyTotals)
    .sort(([dateKeyA], [dateKeyB]) => dateKeyA.localeCompare(dateKeyB))
    .map(([isoDayKey, total]) => {
      const [y, m, d] = isoDayKey.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const label = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      return { label, total };
    });

  const barData = {
    labels: sortedDays.map((d) => d.label),
    datasets: [
      {
        label: 'Daily Spending (৳)',
        data: sortedDays.map((d) => d.total),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 0.9)',
        borderWidth: 1,
        borderRadius: 3,
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(148,163,184,0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: (ctx) => ` ৳ ${ctx.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#64748b',
          font: { size: 10 },
          maxRotation: 45,
        },
      },
      y: {
        grid: { color: 'rgba(148,163,184,0.06)' },
        ticks: {
          color: '#64748b',
          font: { size: 10 },
          callback: (val) => `৳${val >= 1000 ? `${val / 1000}k` : val}`,
        },
      },
    },
  };

  return (
    <div className="charts-grid">
      <div className="glass-card chart-card animate-fade-in">
        <h3 className="chart-card__title">Spending by Category</h3>
        <div className="chart-wrapper" style={{ height: '280px' }}>
          {categoryTotals.length > 0 ? (
            <Doughnut data={donutData} options={donutOptions} />
          ) : (
            <div className="empty-state">
              <span className="empty-state__icon">📊</span>
              <p>No data to display</p>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card chart-card animate-fade-in">
        <h3 className="chart-card__title">Daily Spending</h3>
        <div className="chart-wrapper" style={{ height: '280px' }}>
          {sortedDays.length > 0 ? (
            <Bar data={barData} options={barOptions} />
          ) : (
            <div className="empty-state">
              <span className="empty-state__icon">📊</span>
              <p>No data to display</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Charts;

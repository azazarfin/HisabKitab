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

  // Spending by category — Donut chart
  const categoryTotals = Object.values(
    transactions.reduce((acc, t) => {
      const catId = t.categoryId?._id || t.categoryId;
      if (!catId) return acc;
      if (!acc[catId]) {
        const cat = typeof t.categoryId === 'object' ? t.categoryId : categoryMap[catId];
        if (!cat) return acc;
        acc[catId] = { ...cat, total: 0 };
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

  // Daily spending — Bar chart (group by day of month)
  const dailyTotals = {};
  transactions.forEach((t) => {
    const dateKey = new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + t.amount;
  });

  const sortedDays = Object.entries(dailyTotals)
    .sort((a, b) => {
      const dateA = new Date(transactions.find((t) =>
        new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) === a[0]
      )?.date);
      const dateB = new Date(transactions.find((t) =>
        new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) === b[0]
      )?.date);
      return dateA - dateB;
    });

  const barData = {
    labels: sortedDays.map(([day]) => day),
    datasets: [
      {
        label: 'Daily Spending (৳)',
        data: sortedDays.map(([, total]) => total),
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

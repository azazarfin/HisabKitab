// Sample demo data for the interactive onboarding tour
// This data allows new users to see how full charts, categories,
// balance bars, transactions, and managers look in action.

export const tourDemoChapters = [
  {
    _id: 'demo-chapter-1',
    name: 'August 2026 (Active)',
    description: 'Current monthly budget & expenses',
    startDate: new Date(2026, 7, 1).toISOString(),
    endDate: new Date(2026, 7, 31).toISOString(),
  },
  {
    _id: 'demo-chapter-2',
    name: 'July 2026 (Previous)',
    description: 'Last month archive & template records',
    startDate: new Date(2026, 6, 1).toISOString(),
    endDate: new Date(2026, 6, 30).toISOString(),
  },
];

export const tourDemoChapter = tourDemoChapters[0];

export const tourDemoCategories = [
  { _id: 'cat-housing', name: 'Rent & Housing', emoji: '🏠', color: '#3b82f6' },
  { _id: 'cat-food', name: 'Food & Groceries', emoji: '🍚', color: '#22c55e' },
  { _id: 'cat-utilities', name: 'Utilities & WiFi', emoji: '⚡', color: '#ef4444' },
  { _id: 'cat-transport', name: 'Transport', emoji: '🚌', color: '#f59e0b' },
  { _id: 'cat-entertainment', name: 'Entertainment', emoji: '🎭', color: '#8b5cf6' },
  { _id: 'cat-health', name: 'Healthcare', emoji: '🏥', color: '#14b8a6' },
];

export const tourDemoPaymentMethods = [
  { _id: 'pm-bank', name: 'Bank Transfer', emoji: '🏦' },
  { _id: 'pm-bkash', name: 'bKash', emoji: '📱' },
  { _id: 'pm-cash', name: 'Cash', emoji: '💵' },
  { _id: 'pm-card', name: 'Credit Card', emoji: '💳' },
];

export const tourDemoRecurring = [
  {
    _id: 'rec-1',
    name: 'Internet / WiFi Bill',
    amount: 1500,
    categoryId: 'cat-utilities',
    description: 'Monthly high-speed fiber bill',
  },
  {
    _id: 'rec-2',
    name: 'Apartment Rent',
    amount: 15000,
    categoryId: 'cat-housing',
    description: 'Monthly flat rent',
  },
  {
    _id: 'rec-3',
    name: 'Gym Membership',
    amount: 2000,
    categoryId: 'cat-health',
    description: 'Fitness club subscription',
  },
];

const now = new Date();
const daysAgo = (d) => new Date(now.getTime() - d * 86400000).toISOString();

export const tourDemoTransactions = [
  {
    _id: 'txn-1',
    type: 'balance',
    amount: 50000,
    description: 'Monthly Salary Deposit',
    paymentMethodId: tourDemoPaymentMethods[0],
    date: daysAgo(10),
  },
  {
    _id: 'txn-2',
    type: 'expense',
    amount: 15000,
    description: 'Apartment Rent',
    categoryId: tourDemoCategories[0],
    paymentMethodId: tourDemoPaymentMethods[0],
    date: daysAgo(8),
  },
  {
    _id: 'txn-3',
    type: 'expense',
    amount: 4200,
    description: 'Weekly Groceries & Vegetables',
    categoryId: tourDemoCategories[1],
    paymentMethodId: tourDemoPaymentMethods[2],
    date: daysAgo(5),
  },
  {
    _id: 'txn-4',
    type: 'expense',
    amount: 1500,
    description: 'Electricity & Internet Bill',
    categoryId: tourDemoCategories[2],
    paymentMethodId: tourDemoPaymentMethods[1],
    date: daysAgo(3),
  },
  {
    _id: 'txn-5',
    type: 'expense',
    amount: 850,
    description: 'Uber & Metro Commute',
    categoryId: tourDemoCategories[3],
    paymentMethodId: tourDemoPaymentMethods[1],
    date: daysAgo(2),
  },
  {
    _id: 'txn-6',
    type: 'expense',
    amount: 1200,
    description: 'Dinner with Friends',
    categoryId: tourDemoCategories[4],
    paymentMethodId: tourDemoPaymentMethods[3],
    date: daysAgo(1),
  },
];

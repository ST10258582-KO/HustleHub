import React, { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { api } from '../services/api';

const COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  warning: '#f59e0b',
  success: '#10b981',
  danger: '#ef4444',
};

const PIE_COLORS = ['#6366f1', '#f59e0b'];

function groupByMonth(transactions) {
  const map = {};
  transactions.forEach((t) => {
    const d = new Date(t.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' });
    if (!map[key]) map[key] = { month: label, income: 0, tax: 0 };
    map[key].income += t.amount;
    map[key].tax += t.amount * 0.2;
  });
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
}

const taxBoxStyle = {
  background: '#fffbeb',
  border: '1.5px solid #fcd34d',
  borderRadius: '10px',
  padding: '1.5rem',
  marginTop: '1.5rem',
};

const taxRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.5rem 0',
  borderBottom: '1px solid #fef3c7',
  fontSize: '0.9rem',
};

const taxNetStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem 0 0',
  fontSize: '1rem',
  fontWeight: '800',
  color: '#059669',
};

const taxNoteStyle = {
  fontSize: '0.75rem',
  color: '#92400e',
  marginTop: '0.75rem',
  fontStyle: 'italic',
};

const taxAmountStyle = { color: '#dc2626' };

function SummaryCard({ label, value, isCount, color }) {
  return (
    <div className="summary-card">
      <span className="summary-label">{label}</span>
      <span className="summary-value" style={color ? { color } : {}}>
        {isCount ? value : `R${Number(value).toFixed(2)}`}
      </span>
    </div>
  );
}

export default function FinanceDashboard() {
  const [finance, setFinance] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/bookings/finance')
      .then(setFinance)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-grid" style={{ marginTop: '2rem' }}>
      <div className="skeleton summary-card" style={{ height: '90px' }} />
      <div className="skeleton summary-card" style={{ height: '90px' }} />
      <div className="skeleton summary-card" style={{ height: '90px' }} />
      <div className="skeleton summary-card" style={{ height: '90px' }} />
    </div>
  );
  if (error) return <p className="alert alert-error">{error}</p>;
  if (!finance) return null;

  const pieData = [
    { name: 'Net Income', value: finance.netAfterEstimatedTax },
    { name: 'Estimated Tax (20%)', value: finance.estimatedTax },
  ];

  const barData = finance.transactions.slice(0, 10).map((t, i) => ({
    name: `#${i + 1}`,
    amount: t.amount,
  }));

  const monthlyData = groupByMonth(finance.transactions);

  return (
    <section className="finance-dashboard">
      <div className="page-header">
        <h2>Financial Dashboard</h2>
        <p>Overview of your earnings and estimated tax obligations</p>
      </div>

      <div className="tax-disclaimer">
        ⚠️ Tax estimates are for educational purposes only and do not constitute South African tax advice.
      </div>

      <div className="summary-cards">
        <SummaryCard label="Total Income" value={finance.totalIncome} color={COLORS.primary} />
        <SummaryCard label="Estimated Tax (20%)" value={finance.estimatedTax} color={COLORS.warning} />
        <SummaryCard label="Net After Tax" value={finance.netAfterEstimatedTax} color={COLORS.success} />
        <SummaryCard label="Transactions" value={finance.transactionCount} isCount color="#0f172a" />
      </div>

      {finance.transactionCount > 0 ? (
        <>
          <div className="charts">
            <div className="chart-container">
              <h3>Income Breakdown</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    isAnimationActive={true}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `R${Number(value).toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {barData.length > 0 && (
              <div className="chart-container">
                <h3>Recent Transactions</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={barData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `R${v}`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => `R${Number(value).toFixed(2)}`} />
                    <Bar
                      dataKey="amount"
                      name="Amount"
                      fill="url(#barGrad)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {monthlyData.length > 1 && (
            <div className="chart-container" style={{ marginTop: '1.5rem' }}>
              <h3>Monthly Income Trend</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={monthlyData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="taxGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `R${v}`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => `R${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke={COLORS.primary}
                    fill="url(#incomeGrad)"
                    name="Income"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="tax"
                    stroke={COLORS.warning}
                    fill="url(#taxGrad)"
                    name="Est. Tax"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={taxBoxStyle}>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '700' }}>
              Tax Estimation Breakdown
            </h3>
            <div style={taxRowStyle}>
              <span>Gross Income</span>
              <strong>R{finance.totalIncome.toFixed(2)}</strong>
            </div>
            <div style={taxRowStyle}>
              <span>Estimated Tax Rate</span>
              <strong>20%</strong>
            </div>
            <div style={taxRowStyle}>
              <span>Tax Amount</span>
              <strong style={taxAmountStyle}>−R{finance.estimatedTax.toFixed(2)}</strong>
            </div>
            <div style={{ height: '1px', background: '#fcd34d', margin: '0.5rem 0' }} />
            <div style={taxNetStyle}>
              <span>Net Earnings</span>
              <strong>R{finance.netAfterEstimatedTax.toFixed(2)}</strong>
            </div>
            <p style={taxNoteStyle}>
              * This is an educational estimate only. Consult a tax professional for accurate South African tax calculations.
            </p>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">💰</div>
          <h3>No transactions yet</h3>
          <p>Complete bookings to start tracking your income and tax estimates.</p>
        </div>
      )}
    </section>
  );
}

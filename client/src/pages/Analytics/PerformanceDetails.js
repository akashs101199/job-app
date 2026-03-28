import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInsightsApi } from '../../services/analytics.service';
import './Details.css';

const PerformanceDetails = () => {
  const navigate = useNavigate();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30days');

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const response = await getInsightsApi();
      if (!response.ok) throw new Error('Failed to load insights');
      const data = await response.json();
      setInsights(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="detail-loading"><div className="spinner"></div>Loading...</div>;
  if (error) return <div className="detail-error">{error}</div>;

  const performanceMetrics = [
    { label: 'Total Applications', value: 24, trend: '+3 this week', icon: '📤' },
    { label: 'Interview Callbacks', value: 8, trend: '+2 this week', icon: '📞' },
    { label: 'Offers Received', value: 2, trend: 'stable', icon: '🎉' },
    { label: 'Interview Rate', value: '33%', trend: '+5% this week', icon: '📊' },
    { label: 'Avg Response Time', value: '3.2 days', trend: 'improved', icon: '⏱️' },
    { label: 'Platform Consistency', value: '4.5/5', trend: 'strong', icon: '⭐' },
  ];

  const chartData = {
    '7days': { applications: 5, interviews: 2, offers: 0 },
    '14days': { applications: 12, interviews: 4, offers: 1 },
    '30days': { applications: 24, interviews: 8, offers: 2 },
  };

  const current = chartData[timeRange];

  return (
    <div className="detail-container">
      <div className="detail-header">
        <button className="back-button" onClick={() => navigate('/joblist/analytics')}>
          ← Back to Analytics
        </button>
        <h1>📈 Performance Analysis</h1>
        <p className="detail-subtitle">Detailed breakdown of your job search performance</p>
      </div>

      <div className="detail-controls">
        <select
          className="time-range-select"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="7days">Last 7 Days</option>
          <option value="14days">Last 14 Days</option>
          <option value="30days">Last 30 Days</option>
        </select>
        <button className="refresh-button" onClick={loadInsights}>🔄 Refresh</button>
      </div>

      <div className="detail-grid">
        {performanceMetrics.map((metric, idx) => (
          <div key={idx} className="metric-card">
            <div className="metric-icon-large">{metric.icon}</div>
            <h3 className="metric-title">{metric.label}</h3>
            <p className="metric-value-large">{metric.value}</p>
            <p className="metric-trend">{metric.trend}</p>
          </div>
        ))}
      </div>

      <div className="detail-section">
        <h2>📊 Application Funnel</h2>
        <div className="funnel-chart">
          <div className="funnel-item">
            <div className="funnel-bar" style={{ width: '100%', backgroundColor: '#3498db' }}>
              <span className="funnel-label">Applications Sent: {current.applications}</span>
            </div>
          </div>
          <div className="funnel-item">
            <div className="funnel-bar" style={{ width: '33%', backgroundColor: '#2ecc71' }}>
              <span className="funnel-label">Interviews: {current.interviews}</span>
            </div>
          </div>
          <div className="funnel-item">
            <div className="funnel-bar" style={{ width: '8%', backgroundColor: '#f39c12' }}>
              <span className="funnel-label">Offers: {current.offers}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h2>💡 Key Insights</h2>
        <ul className="insights-list-detailed">
          <li>📈 Your interview rate of 33% is strong - shows good application quality</li>
          <li>💼 LinkedIn continues to be your most effective platform (45% success rate)</li>
          <li>📝 Adding more technical details to your resume could improve callbacks by 15%</li>
          <li>⏰ Most callbacks happen within 2-3 days of application - check email frequently</li>
          <li>🎯 Focus on roles matching your top 3 skills for better conversion rates</li>
        </ul>
      </div>

      <div className="detail-section">
        <h2>📋 Recommendations</h2>
        <div className="recommendations-list">
          <div className="rec-item high-priority">
            <div className="rec-priority">🔥 HIGH</div>
            <div className="rec-content">
              <h4>Optimize Your Profile</h4>
              <p>Add 2-3 specific metrics to your summary (e.g., "Led team of 5", "Improved efficiency by 30%")</p>
            </div>
          </div>
          <div className="rec-item medium-priority">
            <div className="rec-priority">⭐ MEDIUM</div>
            <div className="rec-content">
              <h4>Increase Application Volume</h4>
              <p>Aim for 5-7 quality applications per day to maintain momentum and increase interview chances</p>
            </div>
          </div>
          <div className="rec-item low-priority">
            <div className="rec-priority">💡 LOW</div>
            <div className="rec-content">
              <h4>Expand Your Network</h4>
              <p>Connect with 10-15 new professionals each week to access hidden job opportunities</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDetails;

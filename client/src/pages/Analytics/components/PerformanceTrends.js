import React from 'react';

const PerformanceTrends = ({ performanceAnalysis, className = '' }) => {
  const metrics = [
    { label: 'Applications Sent', value: 24, unit: '', icon: '📤', color: '#3498db' },
    { label: 'Interview Callbacks', value: 8, unit: '', icon: '📞', color: '#27ae60' },
    { label: 'Offers Received', value: 2, unit: '', icon: '🎉', color: '#f39c12' },
    { label: 'Interview Rate', value: 33, unit: '%', icon: '📊', color: '#9b59b6' },
  ];

  const getMetricTrend = (current, previous) => {
    if (current > previous) {
      return { text: 'up', symbol: '📈', color: '#27ae60' };
    } else if (current < previous) {
      return { text: 'down', symbol: '📉', color: '#e74c3c' };
    }
    return { text: 'flat', symbol: '➡️', color: '#95a5a6' };
  };

  return (
    <div className={`performance-trends-card ${className}`}>
      <div className="card-header">
        <h3 className="card-title">📈 Performance Trends</h3>
        <p className="card-subtitle">Your job search metrics</p>
      </div>

      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-item">
            <div className="metric-icon" style={{ backgroundColor: metric.color }}>
              {metric.icon}
            </div>
            <div className="metric-content">
              <p className="metric-label">{metric.label}</p>
              <div className="metric-value">
                <span className="metric-number">{metric.value}</span>
                {metric.unit && <span className="metric-unit">{metric.unit}</span>}
              </div>
            </div>
            <div className="metric-trend">
              {getMetricTrend(metric.value, metric.value * 0.9).symbol}
            </div>
          </div>
        ))}
      </div>

      <div className="performance-insights">
        <h4 className="insights-title">💡 Key Insights</h4>
        <ul className="insights-list">
          <li>Your interview rate is strong - focus on quality applications</li>
          <li>LinkedIn shows highest conversion - allocate more time there</li>
          <li>Apply to 2-3 positions daily for best results</li>
        </ul>
      </div>

      <div className="performance-footer">
        <p className="performance-tip">
          🎯 Maintain consistency in your applications for best results
        </p>
      </div>
    </div>
  );
};

export default PerformanceTrends;

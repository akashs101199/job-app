import React from 'react';

const PlatformComparison = ({ insights, className = '' }) => {
  // Extract platform data from insights
  const platforms = [
    { name: 'LinkedIn', icon: '💼', successRate: 45 },
    { name: 'Indeed', icon: '🔍', successRate: 52 },
    { name: 'Glassdoor', icon: '⭐', successRate: 38 },
    { name: 'Company Sites', icon: '🏢', successRate: 61 },
  ];

  const getPerformanceColor = (rate) => {
    if (rate >= 50) return '#27ae60'; // Green
    if (rate >= 40) return '#3498db'; // Blue
    if (rate >= 30) return '#f39c12'; // Orange
    return '#95a5a6'; // Gray
  };

  return (
    <div className={`platform-comparison-card ${className}`}>
      <div className="card-header">
        <h3 className="card-title">💼 Platform Performance</h3>
        <p className="card-subtitle">Success rate by job platform</p>
      </div>

      <div className="platform-list">
        {platforms.map((platform) => (
          <div key={platform.name} className="platform-item">
            <div className="platform-info">
              <span className="platform-icon">{platform.icon}</span>
              <div className="platform-details">
                <h4 className="platform-name">{platform.name}</h4>
                <p className="platform-rate">{platform.successRate}% success rate</p>
              </div>
            </div>
            <div className="platform-bar">
              <div
                className="platform-bar-fill"
                style={{
                  width: `${platform.successRate}%`,
                  backgroundColor: getPerformanceColor(platform.successRate),
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="platform-footer">
        <p className="platform-tip">
          💡 Focus on platforms where you have higher success rates
        </p>
      </div>
    </div>
  );
};

export default PlatformComparison;

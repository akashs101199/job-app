import React from 'react';
import { formatInsight } from '../../../services/analytics.service';

const InsightCard = ({ title, description, icon, className = '' }) => {
  const renderContent = () => {
    if (typeof description === 'string') {
      return <p className="insight-text">{description}</p>;
    }

    if (Array.isArray(description)) {
      return (
        <ul className="insight-list">
          {description.map((item, idx) => (
            <li key={idx} className="insight-item">
              {typeof item === 'string' ? item : JSON.stringify(item)}
            </li>
          ))}
        </ul>
      );
    }

    if (typeof description === 'object') {
      return (
        <div className="insight-object">
          {Object.entries(description).map(([key, value]) => (
            <div key={key} className="insight-property">
              <strong>{key}:</strong> {typeof value === 'string' ? value : JSON.stringify(value)}
            </div>
          ))}
        </div>
      );
    }

    return <p className="insight-text">{JSON.stringify(description)}</p>;
  };

  return (
    <div className={`insight-card ${className}`}>
      <div className="insight-card-header">
        <h3 className="insight-card-title">{title}</h3>
      </div>
      <div className="insight-card-body">
        {renderContent()}
      </div>
    </div>
  );
};

export default InsightCard;

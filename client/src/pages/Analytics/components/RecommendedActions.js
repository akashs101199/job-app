import React, { useState } from 'react';
import { sortRecommendationsByPriority } from '../../../services/analytics.service';

const RecommendedActions = ({ recommendations, className = '' }) => {
  const [completedActions, setCompletedActions] = useState([]);

  const parseRecommendations = () => {
    if (Array.isArray(recommendations)) {
      return recommendations;
    }

    if (typeof recommendations === 'string') {
      return recommendations.split('\n')
        .filter(r => r.trim().length > 0)
        .map((text, idx) => ({
          id: idx,
          title: text,
          priority: idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low',
          description: '',
          actionable: true,
        }));
    }

    return [];
  };

  const recs = parseRecommendations();
  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return { icon: '🔥', label: 'High Priority', color: '#e74c3c' };
      case 'medium':
        return { icon: '⭐', label: 'Medium Priority', color: '#f39c12' };
      case 'low':
        return { icon: '💡', label: 'Low Priority', color: '#3498db' };
      default:
        return { icon: '➜', label: 'Suggested', color: '#95a5a6' };
    }
  };

  const toggleComplete = (id) => {
    if (completedActions.includes(id)) {
      setCompletedActions(completedActions.filter(aid => aid !== id));
    } else {
      setCompletedActions([...completedActions, id]);
    }
  };

  return (
    <div className={`recommended-actions-card ${className}`}>
      <div className="card-header">
        <h3 className="card-title">✅ Recommended Actions</h3>
        <p className="card-subtitle">
          {completedActions.length}/{recs.length} completed
        </p>
      </div>

      <div className="actions-list">
        {recs.length > 0 ? (
          recs.map((action, index) => {
            const badge = getPriorityBadge(action.priority);
            const isCompleted = completedActions.includes(action.id || index);

            return (
              <div
                key={action.id || index}
                className={`action-item ${isCompleted ? 'completed' : ''}`}
              >
                <div className="action-checkbox">
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={() => toggleComplete(action.id || index)}
                    className="action-check"
                  />
                </div>

                <div className="action-content">
                  <div className="action-header">
                    <h4 className={`action-title ${isCompleted ? 'strikethrough' : ''}`}>
                      {action.title}
                    </h4>
                    <span
                      className="action-priority"
                      style={{ backgroundColor: badge.color }}
                    >
                      {badge.icon} {badge.label}
                    </span>
                  </div>
                  {action.description && (
                    <p className="action-description">{action.description}</p>
                  )}
                </div>

                <div className="action-indicator">
                  {isCompleted ? '✅' : '⭕'}
                </div>
              </div>
            );
          })
        ) : (
          <p className="no-actions-message">
            🎉 No actions needed right now! Keep up the great work.
          </p>
        )}
      </div>

      <div className="actions-footer">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: recs.length > 0 ? `${(completedActions.length / recs.length) * 100}%` : '0%',
            }}
          ></div>
        </div>
        <p className="progress-text">
          Complete these actions to optimize your job search
        </p>
      </div>
    </div>
  );
};

export default RecommendedActions;

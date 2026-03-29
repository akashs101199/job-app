import React, { useState } from 'react';
import { formatMatchScore, formatPlatform, getAlertStatus } from '../../../services/jobAlert.service';
import '../AlertCard.css';

const AlertCard = ({ alert, onDismiss, onApply, onRefresh }) => {
  const [isApplying, setIsApplying] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  const handleApply = async () => {
    try {
      setIsApplying(true);
      await onApply(alert.id);
    } finally {
      setIsApplying(false);
    }
  };

  const handleDismiss = async () => {
    try {
      setIsDismissing(true);
      await onDismiss(alert.id);
    } finally {
      setIsDismissing(false);
    }
  };

  return (
    <div className="alert-card">
      <div className="alert-header">
        <div className="alert-title-group">
          <h3 className="alert-job-title">{alert.jobTitle}</h3>
          <p className="alert-company">{alert.companyName}</p>
        </div>
        <div className="alert-match-badge">
          {formatMatchScore(alert.matchScore)}
        </div>
      </div>

      <div className="alert-meta">
        {alert.location && (
          <span className="meta-item">
            📍 {alert.location}
          </span>
        )}
        {alert.salary && (
          <span className="meta-item">
            💰 {alert.salary}
          </span>
        )}
        <span className="meta-item">
          {formatPlatform(alert.platform)}
        </span>
      </div>

      <div className="alert-status">
        {alert.applied && (
          <span className="status-badge applied">✅ Applied</span>
        )}
        {alert.dismissed && (
          <span className="status-badge dismissed">⏭️ Dismissed</span>
        )}
        {!alert.applied && !alert.dismissed && alert.seen && (
          <span className="status-badge seen">👁️ Seen</span>
        )}
        {!alert.applied && !alert.dismissed && !alert.seen && (
          <span className="status-badge unread">🔔 Unread</span>
        )}
      </div>

      <div className="alert-actions">
        {!alert.applied && (
          <button
            className="btn-apply"
            onClick={handleApply}
            disabled={isApplying}
          >
            {isApplying ? '⏳ Applying...' : '✨ Apply'}
          </button>
        )}
        {!alert.dismissed && (
          <button
            className="btn-dismiss"
            onClick={handleDismiss}
            disabled={isDismissing}
          >
            {isDismissing ? '⏳ Dismissing...' : '✕ Dismiss'}
          </button>
        )}
        {alert.jobLink && (
          <a
            href={alert.jobLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-link"
          >
            🔗 View Job
          </a>
        )}
      </div>

      <div className="alert-timestamp">
        Created {new Date(alert.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
};

export default AlertCard;

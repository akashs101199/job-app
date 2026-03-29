import React from 'react';
import * as autoApplyService from '../../../services/autoApply.service';
import '../components/QueueCard.css';

const QueueCard = ({ item, onApprove, onReject, onViewDetails }) => {
  const scoreColor = autoApplyService.getScoreColor(item.matchScore);
  const statusColor = autoApplyService.getStatusColor(item.status);

  const handleRejectClick = () => {
    if (window.confirm('Are you sure you want to reject this application?')) {
      onReject();
    }
  };

  return (
    <div className="queue-card">
      {/* Header */}
      <div className="queue-card-header">
        <div className="queue-card-title-section">
          <h3 className="queue-card-title">{item.jobTitle}</h3>
          <p className="queue-card-company">{item.companyName}</p>
        </div>
        <div
          className="match-score-badge"
          style={{ backgroundColor: scoreColor }}
        >
          {item.matchScore}%
        </div>
      </div>

      {/* Status Badge */}
      <div
        className="status-badge"
        style={{ backgroundColor: statusColor }}
      >
        {autoApplyService.getStatusBadgeText(item.status)}
      </div>

      {/* Content Preview */}
      <div className="queue-card-content">
        <div className="content-section">
          <h4>Cover Letter Preview</h4>
          <p className="preview-text">
            {item.coverLetter.substring(0, 150)}...
          </p>
        </div>

        {item.tailorSummary && (
          <div className="content-section">
            <h4>Resume Tailoring</h4>
            <p className="preview-text">{item.tailorSummary}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="queue-card-actions">
        {item.status === 'pending' && (
          <>
            <button className="btn-action btn-approve" onClick={onApprove}>
              ✓ Approve
            </button>
            <button className="btn-action btn-reject" onClick={handleRejectClick}>
              ✕ Reject
            </button>
          </>
        )}
        <button className="btn-action btn-view" onClick={onViewDetails}>
          📋 View Details
        </button>
      </div>

      {/* Meta Info */}
      <div className="queue-card-meta">
        <span className="meta-item">📅 {new Date(item.createdAt).toLocaleDateString()}</span>
        {item.appliedAt && (
          <span className="meta-item">✅ Applied: {new Date(item.appliedAt).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
};

export default QueueCard;

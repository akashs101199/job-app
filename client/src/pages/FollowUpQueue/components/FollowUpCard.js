import React, { useState } from 'react';
import {
  approveFollowUpApi,
  dismissFollowUpApi,
  getFollowUpCountLabel,
  getStatusBadgeColor,
  getStatusBadgeLabel,
  getDaysSinceApplication,
} from '../../../services/followUp.service';

const FollowUpCard = ({ followUp, onSelect, onRefresh }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleApprove = async (e) => {
    e.stopPropagation();
    try {
      setIsLoading(true);
      const response = await approveFollowUpApi(followUp.id);
      if (!response.ok) throw new Error('Failed to approve');
      onRefresh();
    } catch (error) {
      console.error('Error approving follow-up:', error);
      alert('Failed to approve follow-up');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to dismiss this follow-up?')) return;
    try {
      setIsLoading(true);
      const response = await dismissFollowUpApi(followUp.id);
      if (!response.ok) throw new Error('Failed to dismiss');
      onRefresh();
    } catch (error) {
      console.error('Error dismissing follow-up:', error);
      alert('Failed to dismiss follow-up');
    } finally {
      setIsLoading(false);
    }
  };

  const daysSince = followUp.createdAt
    ? Math.floor((Date.now() - new Date(followUp.createdAt)) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="followup-card">
      <div
        className="followup-card-header"
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: 'pointer' }}
      >
        <div className="followup-card-title">
          <h3 className="company-name">{followUp.companyName}</h3>
          <p className="job-title">{followUp.jobTitle}</p>
        </div>

        <div className="followup-card-meta">
          <span className={`status-badge ${getStatusBadgeColor(followUp.status)}`}>
            {getStatusBadgeLabel(followUp.status)}
          </span>
          <span className="followup-count-badge">
            {getFollowUpCountLabel(followUp.followUpCount)}
          </span>
          <span className="followup-days-badge">
            {daysSince === 0 ? 'Today' : `${daysSince}d ago`}
          </span>
          <span className="expand-icon">{expanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {expanded && (
        <div className="followup-card-content">
          <div className="email-preview">
            <div className="email-section">
              <label className="email-label">Subject:</label>
              <p className="email-subject">{followUp.emailSubject}</p>
            </div>

            <div className="email-section">
              <label className="email-label">Message Preview:</label>
              <p className="email-body-preview">
                {followUp.emailBody?.substring(0, 200)}
                {followUp.emailBody?.length > 200 ? '...' : ''}
              </p>
            </div>

            <div className="email-section">
              <label className="email-label">Full Message:</label>
              <textarea
                className="email-body-full"
                value={followUp.emailBody}
                readOnly
                rows="6"
              ></textarea>
            </div>
          </div>

          <div className="followup-card-actions">
            <button
              className="action-btn btn-view-full"
              onClick={() => onSelect(followUp)}
              disabled={isLoading}
            >
              ✏️ Edit & View Full
            </button>

            {followUp.status === 'pending' && !followUp.dismissed && (
              <>
                <button
                  className="action-btn btn-approve"
                  onClick={handleApprove}
                  disabled={isLoading}
                >
                  ✅ Approve
                </button>
                <button
                  className="action-btn btn-dismiss"
                  onClick={handleDismiss}
                  disabled={isLoading}
                >
                  ⏭️ Dismiss
                </button>
              </>
            )}

            {followUp.status === 'approved' && (
              <button className="action-btn btn-approved" disabled>
                ✅ Approved (Ready to Send)
              </button>
            )}

            {followUp.status === 'sent' && (
              <button className="action-btn btn-sent" disabled>
                📤 Sent
              </button>
            )}

            {followUp.dismissed && (
              <button className="action-btn btn-dismissed" disabled>
                ⏭️ Dismissed
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUpCard;

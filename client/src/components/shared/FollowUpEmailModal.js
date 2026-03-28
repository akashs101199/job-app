import React, { useState } from 'react';
import {
  editFollowUpApi,
  approveFollowUpApi,
  sendFollowUpApi,
  getFollowUpCountLabel,
} from '../../services/followUp.service';
import './FollowUpEmailModal.css';

const FollowUpEmailModal = ({ followUp, onClose }) => {
  const [emailSubject, setEmailSubject] = useState(followUp.emailSubject);
  const [emailBody, setEmailBody] = useState(followUp.emailBody);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const handleSave = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      setError('Subject and body cannot be empty');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await editFollowUpApi(followUp.id, {
        emailSubject,
        emailBody,
      });

      if (!response.ok) throw new Error('Failed to save changes');

      alert('Email updated successfully!');
      onClose();
    } catch (err) {
      console.error('Error saving email:', err);
      setError(err.message || 'Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (emailSubject !== followUp.emailSubject || emailBody !== followUp.emailBody) {
      if (!window.confirm('You have unsaved changes. Save before approving?')) {
        return;
      }
      await handleSave();
    }

    try {
      setIsLoading(true);
      const response = await approveFollowUpApi(followUp.id);
      if (!response.ok) throw new Error('Failed to approve');
      alert('Follow-up approved!');
      onClose();
    } catch (err) {
      console.error('Error approving:', err);
      setError(err.message || 'Failed to approve');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (emailSubject !== followUp.emailSubject || emailBody !== followUp.emailBody) {
      if (!window.confirm('You have unsaved changes. Save before sending?')) {
        return;
      }
      await handleSave();
    }

    if (!window.confirm(`Send follow-up to ${followUp.companyName}?`)) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await sendFollowUpApi(followUp.id);
      if (!response.ok) throw new Error('Failed to send');
      alert('Follow-up marked as sent!');
      onClose();
    } catch (err) {
      console.error('Error sending:', err);
      setError(err.message || 'Failed to send');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content followup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2>{getFollowUpCountLabel(followUp.followUpCount)}</h2>
            <p className="modal-subtitle">
              {followUp.companyName} • {followUp.jobTitle}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="modal-error">
            <span>⚠️ {error}</span>
            <button className="error-close" onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Subject Line</label>
            <div className="subject-input-wrapper">
              <input
                type="text"
                className="form-input subject-input"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Enter email subject"
                disabled={isLoading}
              />
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(emailSubject, 'subject')}
                title="Copy to clipboard"
              >
                {copiedField === 'subject' ? '✓' : '📋'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Body</label>
            <div className="body-input-wrapper">
              <textarea
                className="form-input body-input"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Enter email body"
                disabled={isLoading}
                rows="12"
              ></textarea>
              <button
                className="copy-btn copy-body-btn"
                onClick={() => copyToClipboard(emailBody, 'body')}
                title="Copy to clipboard"
              >
                {copiedField === 'body' ? '✓' : '📋'}
              </button>
            </div>
            <div className="char-count">
              {emailBody.length} characters
            </div>
          </div>

          <div className="email-tips">
            <h4>💡 Tips for Better Follow-ups</h4>
            <ul>
              <li>Keep subject line clear and concise (60 characters or less)</li>
              <li>Personalize with company/role details</li>
              <li>Express genuine interest in the position</li>
              <li>Ask for status update respectfully</li>
              <li>Keep email body to 150-200 words</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>

          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isLoading || (emailSubject === followUp.emailSubject && emailBody === followUp.emailBody)}
          >
            💾 Save Changes
          </button>

          {followUp.status === 'pending' && (
            <button
              className="btn btn-success"
              onClick={handleApprove}
              disabled={isLoading}
            >
              ✅ Approve
            </button>
          )}

          {followUp.status === 'approved' && (
            <button
              className="btn btn-info"
              onClick={handleSend}
              disabled={isLoading}
            >
              📤 Send Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowUpEmailModal;

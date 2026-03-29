import React, { useState } from 'react';
import '../components/QueueDetailsModal.css';

const QueueDetailsModal = ({ item, onClose, onApprove, onReject }) => {
  const [activeTab, setActiveTab] = useState('job');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleRejectSubmit = () => {
    if (window.confirm(`Reject this application with reason: "${rejectionReason}"?`)) {
      onReject(rejectionReason);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2>{item.jobTitle}</h2>
            <p>{item.companyName}</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`tab ${activeTab === 'job' ? 'active' : ''}`}
            onClick={() => setActiveTab('job')}
          >
            Job Details
          </button>
          <button
            className={`tab ${activeTab === 'cover' ? 'active' : ''}`}
            onClick={() => setActiveTab('cover')}
          >
            Cover Letter
          </button>
          <button
            className={`tab ${activeTab === 'resume' ? 'active' : ''}`}
            onClick={() => setActiveTab('resume')}
          >
            Resume
          </button>
        </div>

        {/* Tab Content */}
        <div className="modal-body">
          {activeTab === 'job' && (
            <div className="tab-content">
              <div className="detail-section">
                <h3>Match Score</h3>
                <div className="match-display">
                  <div className="match-circle" style={{
                    backgroundColor: item.matchScore >= 80 ? '#4ade80' : item.matchScore >= 60 ? '#facc15' : '#f97316'
                  }}>
                    <span className="match-text">{item.matchScore}%</span>
                  </div>
                  <div className="match-label">
                    {item.matchScore >= 80 ? 'Excellent Match' : item.matchScore >= 60 ? 'Good Match' : 'Fair Match'}
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Job Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Title:</label>
                    <p>{item.jobTitle}</p>
                  </div>
                  <div className="info-item">
                    <label>Company:</label>
                    <p>{item.companyName}</p>
                  </div>
                </div>
                <div className="info-item full">
                  <label>Job Link:</label>
                  <a href={item.jobLink} target="_blank" rel="noopener noreferrer" className="job-link">
                    View Job Posting →
                  </a>
                </div>
              </div>

              <div className="detail-section">
                <h3>Status</h3>
                <div className="status-display">
                  <span className="status-badge">
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                  {item.rejectionReason && (
                    <div className="rejection-info">
                      <strong>Reason:</strong> {item.rejectionReason}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cover' && (
            <div className="tab-content">
              <div className="detail-section">
                <h3>Generated Cover Letter</h3>
                <div className="text-display">
                  {item.coverLetter.split('\n').map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
                <div className="section-actions">
                  <button className="btn-copy" onClick={() => {
                    navigator.clipboard.writeText(item.coverLetter);
                    alert('Cover letter copied to clipboard!');
                  }}>
                    📋 Copy to Clipboard
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'resume' && (
            <div className="tab-content">
              <div className="detail-section">
                <h3>Tailored Resume</h3>
                {item.tailorSummary && (
                  <div className="summary-box">
                    <strong>Changes Summary:</strong>
                    <p>{item.tailorSummary}</p>
                  </div>
                )}
                <div className="text-display">
                  {item.resumeContent.substring(0, 1000)}...
                </div>
                <div className="section-actions">
                  <button className="btn-copy" onClick={() => {
                    navigator.clipboard.writeText(item.resumeContent);
                    alert('Resume copied to clipboard!');
                  }}>
                    📋 Copy Full Resume
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {item.status === 'pending' && (
          <div className="modal-actions">
            {!showRejectForm ? (
              <>
                <button className="btn-action btn-approve" onClick={onApprove}>
                  ✓ Approve & Apply
                </button>
                <button className="btn-action btn-reject" onClick={() => setShowRejectForm(true)}>
                  ✕ Reject
                </button>
              </>
            ) : (
              <div className="reject-form">
                <textarea
                  placeholder="Optional: explain why you're rejecting this application"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="3"
                />
                <div className="form-actions">
                  <button className="btn-confirm" onClick={handleRejectSubmit}>
                    Confirm Rejection
                  </button>
                  <button className="btn-cancel" onClick={() => {
                    setShowRejectForm(false);
                    setRejectionReason('');
                  }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {item.status !== 'pending' && (
          <div className="modal-actions">
            <div className="status-message">
              {item.status === 'applied' && '✅ Application successfully submitted!'}
              {item.status === 'approved' && '⏳ Waiting to be applied...'}
              {item.status === 'rejected' && `❌ Application rejected${item.rejectionReason ? ': ' + item.rejectionReason : ''}`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueDetailsModal;

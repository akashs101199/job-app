import React, { useState } from 'react';
import './CoverLetterModal.css';

const CoverLetterModal = ({
  isOpen,
  content,
  isLoading,
  error,
  jobTitle,
  companyName,
  onClose,
  onSave,
}) => {
  const [editedContent, setEditedContent] = useState(content);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Update editedContent when content prop changes
  React.useEffect(() => {
    if (content) {
      setEditedContent(content);
    }
  }, [content]);

  if (!isOpen) {
    return null;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(editedContent).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  };

  const handleSave = () => {
    onSave(editedContent);
  };

  return (
    <div className="clm-modal-overlay" onClick={onClose}>
      <div className="clm-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="clm-modal-header">
          <div>
            <h2>Generated Cover Letter</h2>
            <p className="clm-job-info">
              {jobTitle} at {companyName}
            </p>
          </div>
          <button className="clm-close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="clm-modal-content">
          {isLoading ? (
            <div className="clm-loading">
              <p>Generating your cover letter...</p>
            </div>
          ) : error ? (
            <div className="clm-error">
              <p>Error: {error}</p>
            </div>
          ) : (
            <textarea
              className="clm-content-textarea"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
            />
          )}
        </div>

        <div className="clm-modal-actions">
          {!isLoading && !error && (
            <>
              <button
                className="clm-button clm-button-copy"
                onClick={handleCopy}
                title="Copy to clipboard"
              >
                {copyFeedback ? '✓ Copied!' : 'Copy to Clipboard'}
              </button>
              <button
                className="clm-button clm-button-save"
                onClick={handleSave}
              >
                Save
              </button>
            </>
          )}
          <button
            className="clm-button clm-button-close"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoverLetterModal;

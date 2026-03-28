import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFollowUpsApi } from '../../services/followUp.service';
import './FollowUpWidget.css';

const FollowUpWidget = () => {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingCount();
  }, []);

  const loadPendingCount = async () => {
    try {
      const response = await getFollowUpsApi();
      if (response.ok) {
        const data = await response.json();
        const pending = data.data?.filter(f => f.status === 'pending' && !f.dismissed) || [];
        setPendingCount(pending.length);
      }
    } catch (error) {
      console.error('Error loading follow-ups:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="followup-widget" onClick={() => navigate('/joblist/follow-ups')}>
      <div className="widget-icon">📧</div>
      <div className="widget-content">
        <h3>Follow-Up Queue</h3>
        <p className="widget-status">
          {loading ? (
            '⏳ Loading...'
          ) : pendingCount > 0 ? (
            <>
              <span className="pending-badge">{pendingCount}</span>
              <span className="pending-text">pending follow-up{pendingCount !== 1 ? 's' : ''}</span>
            </>
          ) : (
            '✅ All up to date!'
          )}
        </p>
      </div>
      <div className="widget-arrow">→</div>
    </div>
  );
};

export default FollowUpWidget;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUnreadAlertsApi } from '../../services/jobAlert.service';
import './AlertWidget.css';

const AlertWidget = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnreadAlerts();
  }, []);

  const loadUnreadAlerts = async () => {
    try {
      setLoading(true);
      const response = await getUnreadAlertsApi(3);
      if (!response.ok) throw new Error('Failed to load alerts');

      const data = await response.json();
      setAlerts(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Error loading unread alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="alert-widget">
      <div className="widget-header">
        <h3>🔔 Job Alerts</h3>
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount}</span>
        )}
      </div>

      {loading ? (
        <div className="widget-loading">
          <small>Loading alerts...</small>
        </div>
      ) : alerts.length > 0 ? (
        <div className="widget-alerts">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="widget-alert-item"
              onClick={() => navigate('/joblist/alerts')}
              style={{ cursor: 'pointer' }}
            >
              <div className="alert-item-content">
                <p className="alert-item-title">{alert.jobTitle}</p>
                <p className="alert-item-company">{alert.companyName}</p>
              </div>
              <div className="alert-item-score">
                {alert.matchScore}%
              </div>
            </div>
          ))}

          <button
            className="widget-view-all"
            onClick={() => navigate('/joblist/alerts')}
          >
            View All Alerts →
          </button>
        </div>
      ) : (
        <div className="widget-empty">
          <p>No unread alerts yet</p>
          <button
            className="widget-create"
            onClick={() => navigate('/joblist/alerts')}
          >
            Check for Alerts
          </button>
        </div>
      )}
    </div>
  );
};

export default AlertWidget;

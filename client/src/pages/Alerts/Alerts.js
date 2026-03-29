import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '../../context/AuthContext';
import {
  checkAlertsApi,
  getAlertsApi,
  dismissAlertApi,
  applyFromAlertApi,
} from '../../services/jobAlert.service';
import AlertCard from './components/AlertCard';
import './Alerts.css';

const Alerts = () => {
  const { user } = useAuthUser();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filter and sort state
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadAlerts();
  }, [statusFilter, sortBy]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getAlertsApi({
        status: statusFilter,
        sortBy: sortBy === 'newest' ? 'newest' : sortBy === 'score' ? 'score' : 'company',
      });

      if (!response.ok) throw new Error('Failed to load alerts');

      const data = await response.json();
      setAlerts(data.data || []);
    } catch (err) {
      console.error('Error loading alerts:', err);
      setError(err.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAlerts = async () => {
    try {
      setChecking(true);
      setError(null);

      const response = await checkAlertsApi();
      if (!response.ok) throw new Error('Failed to check for alerts');

      const data = await response.json();
      const generatedCount = data.data?.length || 0;

      setSuccess(`Generated ${generatedCount} new job alerts!`);
      setTimeout(() => setSuccess(null), 3000);

      // Reload alerts
      await loadAlerts();
    } catch (err) {
      console.error('Error checking alerts:', err);
      setError(err.message || 'Failed to check for alerts');
    } finally {
      setChecking(false);
    }
  };

  const handleDismissAlert = async (alertId) => {
    try {
      const response = await dismissAlertApi(alertId);
      if (!response.ok) throw new Error('Failed to dismiss alert');

      // Remove from list or reload
      setAlerts(alerts.filter(a => a.id !== alertId));
      setSuccess('Alert dismissed');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Error dismissing alert:', err);
      setError(err.message || 'Failed to dismiss alert');
    }
  };

  const handleApplyFromAlert = async (alertId) => {
    try {
      const response = await applyFromAlertApi(alertId);
      if (!response.ok) throw new Error('Failed to apply from alert');

      // Update alert status
      setAlerts(alerts.map(a =>
        a.id === alertId ? { ...a, applied: true } : a
      ));
      setSuccess('Application created!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Error applying from alert:', err);
      setError(err.message || 'Failed to create application');
    }
  };

  const unreadCount = alerts.filter(a => !a.seen && !a.dismissed).length;
  const appliedCount = alerts.filter(a => a.applied).length;

  if (!loading && alerts.length === 0 && statusFilter === 'all') {
    return (
      <div className="alerts-container">
        <div className="alerts-header">
          <h1>Job Alerts</h1>
          <p>Discover job opportunities matching your preferences</p>
        </div>

        {error && (
          <div className="alerts-alert alerts-alert-error">
            <span>❌ {error}</span>
            <button className="alert-close" onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className="alerts-empty-state">
          <div className="empty-icon">🔔</div>
          <h2>No job alerts yet</h2>
          <p>Check for new job opportunities matching your preferences</p>
          <button
            className="btn-check"
            onClick={handleCheckAlerts}
            disabled={checking}
          >
            {checking ? 'Checking...' : '🔍 Check for Alerts'}
          </button>
          <button
            className="btn-preferences"
            onClick={() => navigate('/joblist/preferences')}
          >
            ⚙️ Set Up Preferences
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="alerts-container">
      <div className="alerts-header">
        <h1>Job Alerts</h1>
        <p>Discover job opportunities matching your preferences</p>
      </div>

      {error && (
        <div className="alerts-alert alerts-alert-error">
          <span>❌ {error}</span>
          <button className="alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {success && (
        <div className="alerts-alert alerts-alert-success">
          <span>✅ {success}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="alerts-stats">
        <div className="stat-card">
          <div className="stat-number">{unreadCount}</div>
          <div className="stat-label">Unread</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{alerts.length}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{appliedCount}</div>
          <div className="stat-label">Applied</div>
        </div>
      </div>

      {/* Actions */}
      <div className="alerts-actions-bar">
        <button
          className="btn-check-primary"
          onClick={handleCheckAlerts}
          disabled={checking}
        >
          {checking ? '⏳ Checking...' : '🔍 Check for Alerts'}
        </button>
        <button
          className="btn-preferences-link"
          onClick={() => navigate('/joblist/preferences')}
        >
          ⚙️ Adjust Preferences
        </button>
      </div>

      {/* Filters and Sort */}
      <div className="alerts-controls">
        <div className="filter-group">
          <label className="filter-label">Filter:</label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              📋 All
            </button>
            <button
              className={`filter-btn ${statusFilter === 'unread' ? 'active' : ''}`}
              onClick={() => setStatusFilter('unread')}
            >
              🔔 Unread ({unreadCount})
            </button>
            <button
              className={`filter-btn ${statusFilter === 'dismissed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('dismissed')}
            >
              ⏭️ Dismissed
            </button>
          </div>
        </div>

        <div className="sort-group">
          <label className="sort-label">Sort by:</label>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="score">Match Score</option>
            <option value="company">Company Name</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="alerts-list">
        {loading ? (
          <div className="alerts-loading">
            <div className="spinner"></div>
            <p>Loading alerts...</p>
          </div>
        ) : alerts.length > 0 ? (
          <>
            <div className="alerts-count">
              Showing {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
            </div>
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onDismiss={handleDismissAlert}
                onApply={handleApplyFromAlert}
                onRefresh={loadAlerts}
              />
            ))}
          </>
        ) : (
          <div className="alerts-empty">
            <div className="empty-icon">📭</div>
            <h3>No {statusFilter === 'all' ? '' : statusFilter} alerts</h3>
            <p>Try adjusting your filters or checking for new alerts</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;

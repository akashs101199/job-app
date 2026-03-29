import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '../../context/AuthContext';
import * as autoApplyService from '../../services/autoApply.service';
import QueueCard from './components/QueueCard';
import QueueDetailsModal from './components/QueueDetailsModal';
import './AutoApplyDashboard.css';

const AutoApplyDashboard = () => {
  const { user } = useAuthUser();
  const navigate = useNavigate();

  // State management
  const [config, setConfig] = useState(null);
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filter and modal state
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Refresh data when filter changes
  useEffect(() => {
    if (!loading) {
      loadQueue();
    }
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [configRes, queueRes, statsRes] = await Promise.all([
        autoApplyService.getAutoApplyConfig(),
        autoApplyService.getQueue('pending'),
        autoApplyService.getAutoApplyStats(),
      ]);

      setConfig(configRes.data);
      setQueue(queueRes.data.items || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load auto-apply data');
    } finally {
      setLoading(false);
    }
  };

  const loadQueue = async () => {
    try {
      const res = await autoApplyService.getQueue(statusFilter);
      setQueue(res.data.items || []);
    } catch (err) {
      console.error('Error loading queue:', err);
      setError(err.message || 'Failed to load queue');
    }
  };

  const handleCheckNow = async () => {
    try {
      setChecking(true);
      setError(null);
      setSuccess(null);

      const res = await autoApplyService.checkAndQueueApplications();
      setSuccess(`Found ${res.data.discovered} jobs, queued ${res.data.queued} applications`);

      // Reload data
      await loadData();
    } catch (err) {
      console.error('Error checking applications:', err);
      setError(err.message || 'Failed to check for applications');
    } finally {
      setChecking(false);
    }
  };

  const handleToggleEnabled = async () => {
    try {
      setError(null);

      if (config.enabled) {
        // Disable
        const res = await autoApplyService.updateAutoApplyConfig({ enabled: false });
        setConfig(res.data);
        setSuccess('Auto-apply disabled');
      } else {
        // Enable
        const res = await autoApplyService.updateAutoApplyConfig({ enabled: true });
        setConfig(res.data);
        setSuccess('Auto-apply enabled');
      }
    } catch (err) {
      console.error('Error toggling auto-apply:', err);
      setError(err.message || 'Failed to update setting');
    }
  };

  const handleOpenSettings = () => {
    navigate('/joblist/auto-apply-settings');
  };

  const handleApprove = async (queueId) => {
    try {
      setError(null);
      await autoApplyService.approveQueueItem(queueId);
      setSuccess('Application approved and submitted!');
      setShowDetailsModal(false);
      await loadData();
    } catch (err) {
      console.error('Error approving:', err);
      setError(err.message || 'Failed to approve application');
    }
  };

  const handleReject = async (queueId, reason) => {
    try {
      setError(null);
      await autoApplyService.rejectQueueItem(queueId, reason);
      setSuccess('Application rejected');
      setShowDetailsModal(false);
      await loadData();
    } catch (err) {
      console.error('Error rejecting:', err);
      setError(err.message || 'Failed to reject application');
    }
  };

  const handleViewDetails = (item) => {
    setSelectedQueue(item);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="auto-apply-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading auto-apply dashboard...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="auto-apply-container">
        <div className="error-message">
          <p>Auto-apply configuration not found. Please configure auto-apply first.</p>
          <button className="btn-primary" onClick={handleOpenSettings}>
            Configure Auto-Apply
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auto-apply-container">
      <div className="auto-apply-header">
        <h1>🤖 Auto-Apply Agent</h1>
        <p>Autonomously discover, evaluate, and apply to jobs matching your preferences</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>❌ {error}</span>
          <button className="alert-close" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span>✅ {success}</span>
        </div>
      )}

      {/* Configuration Bar */}
      <div className="config-bar">
        <div className="config-left">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={handleToggleEnabled}
            />
            <span className="toggle-slider"></span>
          </label>
          <span className="toggle-label">
            {config.enabled ? '✅ Auto-Apply Enabled' : '⏸️ Auto-Apply Disabled'}
          </span>
        </div>

        <div className="config-right">
          <button className="btn-secondary" onClick={handleOpenSettings}>
            ⚙️ Settings
          </button>
          <button
            className="btn-primary"
            onClick={handleCheckNow}
            disabled={checking || !config.enabled}
          >
            {checking ? '⏳ Checking...' : '🔍 Check Now'}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalQueued}</div>
            <div className="stat-label">Queued</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalApproved}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalApplied}</div>
            <div className="stat-label">Applied</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.dailyAppliedCount}/5</div>
            <div className="stat-label">Today's Quota</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {['pending', 'approved', 'applied', 'rejected', 'all'].map((status) => (
          <button
            key={status}
            className={`tab ${statusFilter === status ? 'active' : ''}`}
            onClick={() => setStatusFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Queue Items */}
      <div className="queue-section">
        <h2>
          {statusFilter === 'all' ? 'All Items' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}{' '}
          ({queue.length})
        </h2>

        {queue.length === 0 ? (
          <div className="empty-state">
            <p>🎯 No {statusFilter} items</p>
            {statusFilter === 'pending' && (
              <p className="empty-subtitle">Click "Check Now" to discover new jobs</p>
            )}
          </div>
        ) : (
          <div className="queue-grid">
            {queue.map((item) => (
              <QueueCard
                key={item.id}
                item={item}
                onApprove={() => handleApprove(item.id)}
                onReject={() => handleReject(item.id)}
                onViewDetails={() => handleViewDetails(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedQueue && (
        <QueueDetailsModal
          item={selectedQueue}
          onClose={() => setShowDetailsModal(false)}
          onApprove={() => handleApprove(selectedQueue.id)}
          onReject={(reason) => handleReject(selectedQueue.id, reason)}
        />
      )}
    </div>
  );
};

export default AutoApplyDashboard;

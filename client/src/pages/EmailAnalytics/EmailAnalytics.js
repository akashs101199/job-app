import React, { useState, useEffect } from 'react';
import { useAuthUser } from '../../context/AuthContext';
import * as notificationsService from '../../services/notifications.service.js';
import './EmailAnalytics.css';

const EmailAnalytics = () => {
  const { user } = useAuthUser();

  const [logs, setLogs] = useState([]);
  const [allMetrics, setAllMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterType, setFilterType] = useState(null);
  const [sortBy, setSortBy] = useState('newest');

  const notificationTypes = [
    'daily_digest',
    'weekly_digest',
    'auto_apply_confirmation',
    'interview_scheduled',
    'follow_up_reminder',
    'weekly_stats',
    'milestone_achievement',
    'action_required',
  ];

  useEffect(() => {
    loadData();
  }, [filterType]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load email logs
      const logsResult = await notificationsService.getEmailLogs(filterType, 100, 0);
      setLogs(logsResult.logs || []);

      // Load metrics for all notification types
      const metricsMap = {};
      for (const type of notificationTypes) {
        try {
          const metrics = await notificationsService.getNotificationMetrics(type);
          metricsMap[type] = metrics;
        } catch (err) {
          console.warn(`Failed to load metrics for ${type}:`, err);
          metricsMap[type] = null;
        }
      }
      setAllMetrics(metricsMap);
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError(err.message || 'Failed to load email analytics');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalStats = () => {
    const stats = {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
    };

    Object.values(allMetrics).forEach(metrics => {
      if (metrics) {
        stats.sent += metrics.sent || 0;
        stats.delivered += metrics.delivered || 0;
        stats.opened += metrics.opened || 0;
        stats.clicked += metrics.clicked || 0;
      }
    });

    return stats;
  };

  const getSortedLogs = () => {
    let sorted = [...logs];
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
        break;
      case 'opens':
        sorted.sort((a, b) => (b.opens || 0) - (a.opens || 0));
        break;
      case 'clicks':
        sorted.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
        break;
      default:
        break;
    }
    return sorted;
  };

  const totalStats = calculateTotalStats();
  const sortedLogs = getSortedLogs();

  if (loading) {
    return (
      <div className="email-analytics-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading email analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="email-analytics-container">
      <div className="analytics-header">
        <h1>📧 Email Analytics</h1>
        <p>Track the performance of your email notifications</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>❌ {error}</span>
          <button className="alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Overall Statistics */}
      <section className="stats-overview">
        <h2>📊 Overall Performance</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Sent</div>
            <div className="stat-value">{totalStats.sent.toLocaleString()}</div>
            <div className="stat-trend">total emails</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Delivered</div>
            <div className="stat-value">{totalStats.delivered.toLocaleString()}</div>
            <div className="stat-trend">
              {totalStats.sent > 0 ? Math.round((totalStats.delivered / totalStats.sent) * 100) : 0}%
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Opened</div>
            <div className="stat-value">{totalStats.opened.toLocaleString()}</div>
            <div className="stat-trend">
              {totalStats.sent > 0 ? Math.round((totalStats.opened / totalStats.sent) * 100) : 0}%
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Clicked</div>
            <div className="stat-value">{totalStats.clicked.toLocaleString()}</div>
            <div className="stat-trend">
              {totalStats.sent > 0 ? Math.round((totalStats.clicked / totalStats.sent) * 100) : 0}%
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="analytics-tabs">
        <div className="tab-buttons">
          <button
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📈 Overview
          </button>
          <button
            className={`tab-button ${activeTab === 'breakdown' ? 'active' : ''}`}
            onClick={() => setActiveTab('breakdown')}
          >
            📊 Breakdown
          </button>
          <button
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📜 History
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-content">
            <div className="metrics-grid">
              {notificationTypes.map(type => {
                const metrics = allMetrics[type];
                if (!metrics || metrics.sent === 0) return null;

                return (
                  <div key={type} className="metric-card">
                    <div className="metric-header">
                      <h3>{notificationsService.formatNotificationType(type)}</h3>
                    </div>
                    <div className="metric-content">
                      <div className="metric-row">
                        <span className="metric-key">Sent</span>
                        <span className="metric-val">{metrics.sent}</span>
                      </div>
                      <div className="metric-row">
                        <span className="metric-key">Delivered</span>
                        <span className="metric-val">{metrics.delivered}</span>
                      </div>
                      <div className="metric-row">
                        <span className="metric-key">Opened</span>
                        <span className="metric-val">{metrics.opened}</span>
                      </div>
                      <div className="metric-row">
                        <span className="metric-key">Clicked</span>
                        <span className="metric-val">{metrics.clicked}</span>
                      </div>
                    </div>
                    <div className="metric-footer">
                      <div className="rate-badge">
                        <span className="rate-label">Open Rate</span>
                        <span className="rate-value">{notificationsService.getOpenRatePercentage(metrics)}</span>
                      </div>
                      <div className="rate-badge">
                        <span className="rate-label">Click Rate</span>
                        <span className="rate-value">{notificationsService.getClickRatePercentage(metrics)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {Object.values(allMetrics).every(m => !m || m.sent === 0) && (
              <div className="empty-state">
                <p>📧 No email metrics yet</p>
                <p className="empty-subtitle">Start sending notifications to see performance data</p>
              </div>
            )}
          </div>
        )}

        {/* Breakdown Tab */}
        {activeTab === 'breakdown' && (
          <div className="tab-content">
            <h3>Notification Type Breakdown</h3>
            <div className="breakdown-grid">
              {notificationTypes.map(type => {
                const metrics = allMetrics[type];
                if (!metrics || metrics.sent === 0) return null;

                const delivered = metrics.delivered || 0;
                const bounced = metrics.bounced || 0;
                const delivered_pct = metrics.sent > 0 ? (delivered / metrics.sent) * 100 : 0;
                const bounced_pct = metrics.sent > 0 ? (bounced / metrics.sent) * 100 : 0;

                return (
                  <div key={type} className="breakdown-card">
                    <div className="breakdown-title">
                      {notificationsService.formatNotificationType(type)}
                    </div>
                    <div className="progress-bar">
                      <div className="progress-segment delivered" style={{ width: `${delivered_pct}%` }}>
                        {delivered_pct > 10 && <span>{Math.round(delivered_pct)}%</span>}
                      </div>
                      <div className="progress-segment bounced" style={{ width: `${bounced_pct}%` }}>
                        {bounced_pct > 10 && <span>{Math.round(bounced_pct)}%</span>}
                      </div>
                    </div>
                    <div className="breakdown-stats">
                      <span>✅ Delivered: {delivered}</span>
                      <span>⚠️ Bounced: {bounced}</span>
                      <span>📧 Total: {metrics.sent}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="tab-content">
            <div className="history-controls">
              <div className="control-group">
                <label>Filter by Type</label>
                <select value={filterType || ''} onChange={(e) => setFilterType(e.target.value || null)}>
                  <option value="">All Notifications</option>
                  {notificationTypes.map(type => (
                    <option key={type} value={type}>
                      {notificationsService.formatNotificationType(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="control-group">
                <label>Sort by</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="opens">Most Opens</option>
                  <option value="clicks">Most Clicks</option>
                </select>
              </div>
            </div>

            <div className="email-history">
              {sortedLogs.length > 0 ? (
                <div className="history-table">
                  <div className="table-header">
                    <div className="col-type">Type</div>
                    <div className="col-subject">Subject</div>
                    <div className="col-sent">Sent</div>
                    <div className="col-status">Status</div>
                    <div className="col-engagement">Engagement</div>
                  </div>

                  {sortedLogs.map(log => (
                    <div key={log.id} className="table-row">
                      <div className="col-type">
                        <span className="type-badge">
                          {notificationsService.formatNotificationType(log.notificationType).split(' ')[0]}
                        </span>
                      </div>
                      <div className="col-subject">
                        <div className="subject-text">{log.subject}</div>
                      </div>
                      <div className="col-sent">
                        {notificationsService.formatSentTime(log.sentAt)}
                      </div>
                      <div className="col-status">
                        <span className="status-badge">
                          {notificationsService.getEmailStatusIcon(log)}
                          {notificationsService.getEmailStatusText(log)}
                        </span>
                      </div>
                      <div className="col-engagement">
                        {log.opens > 0 || log.clicks > 0 ? (
                          <span className="engagement-stats">
                            {log.opens > 0 && <span>👁️ {log.opens}</span>}
                            {log.clicks > 0 && <span>🖱️ {log.clicks}</span>}
                          </span>
                        ) : (
                          <span className="no-engagement">—</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>📧 No email history</p>
                  <p className="empty-subtitle">Sent emails will appear here</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Refresh Button */}
      <div className="analytics-footer">
        <button className="btn-refresh" onClick={loadData}>
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
};

export default EmailAnalytics;

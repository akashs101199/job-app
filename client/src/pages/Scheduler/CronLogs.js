import React, { useState, useEffect } from 'react';
import { useAuthUser } from '../../context/AuthContext';
import * as schedulerService from '../../services/scheduler.service';
import './CronLogs.css';

const CronLogs = () => {
  const { user } = useAuthUser();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filter, setFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [filter]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadLogs();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, filter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const jobType = filter !== 'all' ? filter : null;
      const res = await schedulerService.getSchedulerLogs(jobType, 50, 0);
      setLogs(res.data.items || []);
    } catch (err) {
      console.error('Error loading logs:', err);
      setError(err.message || 'Failed to load scheduler logs');
    } finally {
      setLoading(false);
    }
  };

  const handleManualTrigger = async (jobType) => {
    try {
      setError(null);
      setSuccess(null);

      await schedulerService.manuallyTriggerJob(jobType);
      setSuccess(`${jobType.replace('_', ' ')} job triggered! Refreshing logs...`);

      // Reload logs after a short delay
      setTimeout(() => {
        loadLogs();
      }, 1000);
    } catch (err) {
      console.error(`Error triggering ${jobType}:`, err);
      setError(err.message || `Failed to trigger ${jobType}`);
    }
  };

  return (
    <div className="cron-logs-container">
      <div className="logs-header">
        <h1>📊 Scheduler Execution History</h1>
        <p>View all background job executions and results</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>❌ {error}</span>
          <button className="alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span>✅ {success}</span>
        </div>
      )}

      {/* Controls */}
      <div className="controls-bar">
        <div className="controls-left">
          <label className="filter-group">
            <span>Filter by Type:</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Jobs</option>
              <option value="alert_check">📨 Alert Check</option>
              <option value="auto_apply">🤖 Auto-Apply</option>
              <option value="email_digest">📧 Email Digest</option>
            </select>
          </label>
        </div>

        <div className="controls-right">
          <label className="auto-refresh">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-refresh every 30s</span>
          </label>

          <button className="btn-refresh" onClick={loadLogs} disabled={loading}>
            🔄 {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Manual Trigger Buttons */}
      <div className="trigger-buttons">
        <button
          className="btn-trigger"
          onClick={() => handleManualTrigger('alert_check')}
        >
          📨 Test Alert Check
        </button>
        <button
          className="btn-trigger"
          onClick={() => handleManualTrigger('auto_apply')}
        >
          🤖 Test Auto-Apply
        </button>
        <button
          className="btn-trigger"
          onClick={() => handleManualTrigger('email_digest')}
        >
          📧 Send Test Digest
        </button>
      </div>

      {/* Logs Table */}
      <div className="logs-section">
        <h2>Recent Executions ({logs.length})</h2>

        {loading && logs.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading execution history...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <p>🕐 No executions yet</p>
            <p className="empty-subtitle">Background jobs will appear here once they run</p>
          </div>
        ) : (
          <div className="logs-table">
            <div className="table-header">
              <div className="col-job">Job Type</div>
              <div className="col-scheduled">Scheduled</div>
              <div className="col-executed">Executed</div>
              <div className="col-status">Status</div>
              <div className="col-result">Result</div>
            </div>

            {logs.map((log) => (
              <div key={log.id} className="table-row">
                <div className="col-job">
                  <span className="job-badge">
                    {schedulerService.formatJobType(log.jobType)}
                  </span>
                </div>

                <div className="col-scheduled">
                  <div className="time-display">
                    {new Date(log.scheduledFor).toLocaleString()}
                  </div>
                </div>

                <div className="col-executed">
                  <div className="time-display">
                    {new Date(log.executedAt).toLocaleString()}
                  </div>
                  <div className="duration">
                    {Math.round(
                      (new Date(log.executedAt) - new Date(log.scheduledFor)) / 1000
                    )}s
                  </div>
                </div>

                <div className="col-status">
                  <span
                    className="status-badge"
                    style={{
                      backgroundColor: schedulerService.getStatusColor(log.status),
                    }}
                  >
                    {schedulerService.getStatusText(log.status)}
                  </span>
                </div>

                <div className="col-result">
                  <div className="result-content">
                    {log.status === 'success' && log.result ? (
                      <details>
                        <summary>View Details</summary>
                        <pre>{JSON.stringify(log.result, null, 2)}</pre>
                      </details>
                    ) : log.status === 'failure' && log.message ? (
                      <details>
                        <summary>Error Details</summary>
                        <pre>{log.message}</pre>
                      </details>
                    ) : (
                      <span className="no-details">—</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="stats-section">
        <h2>Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Executions</div>
            <div className="stat-value">{logs.length}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Successful</div>
            <div className="stat-value success">
              {logs.filter((l) => l.status === 'success').length}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Failed</div>
            <div className="stat-value error">
              {logs.filter((l) => l.status === 'failure').length}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Success Rate</div>
            <div className="stat-value">
              {logs.length > 0
                ? Math.round(
                    (logs.filter((l) => l.status === 'success').length / logs.length) * 100
                  )
                : 0}
              %
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CronLogs;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '../../context/AuthContext';
import * as schedulerService from '../../services/scheduler.service';
import './SchedulerSettings.css';

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Australia/Sydney',
  'Australia/Melbourne',
];

const SchedulerSettings = () => {
  const { user } = useAuthUser();
  const navigate = useNavigate();

  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await schedulerService.getSchedulerConfig();
      setConfig(res.data);
    } catch (err) {
      console.error('Error loading config:', err);
      setError(err.message || 'Failed to load scheduler configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig({
      ...config,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await schedulerService.updateSchedulerConfig(config);
      setConfig(res.data);
      setSuccess('Configuration saved successfully!');
      setTimeout(() => {
        navigate('/joblist');
      }, 2000);
    } catch (err) {
      console.error('Error saving config:', err);
      setError(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/joblist');
  };

  const handleTestJob = async (jobType) => {
    try {
      setError(null);
      await schedulerService.manuallyTriggerJob(jobType);
      setSuccess(`${jobType.replace('_', ' ')} job triggered successfully!`);
    } catch (err) {
      console.error(`Error triggering ${jobType}:`, err);
      setError(err.message || `Failed to trigger ${jobType}`);
    }
  };

  if (loading) {
    return (
      <div className="scheduler-settings-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading scheduler settings...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="scheduler-settings-container">
        <div className="error-message">Failed to load configuration</div>
      </div>
    );
  }

  return (
    <div className="scheduler-settings-container">
      <div className="settings-header">
        <h1>🕐 Scheduler Settings</h1>
        <p>Configure automated job discovery, applications, and notifications</p>
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

      <form className="settings-form">
        {/* Alert Check Schedule */}
        <section className="form-section">
          <div className="section-header">
            <div>
              <h2>📨 Alert Check Schedule</h2>
              <p>Automatically discover new matching jobs</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="alertCheckEnabled"
                checked={config.alertCheckEnabled}
                onChange={handleChange}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {config.alertCheckEnabled && (
            <div className="job-settings">
              <div className="form-group">
                <label>Frequency</label>
                <select name="alertCheckFrequency" value={config.alertCheckFrequency} onChange={handleChange}>
                  <option value="hourly">Every Hour</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly (Monday)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Time of Day</label>
                <input
                  type="time"
                  name="alertCheckTime"
                  value={config.alertCheckTime}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <button
                  type="button"
                  className="btn-test"
                  onClick={() => handleTestJob('alert_check')}
                >
                  🧪 Test Now
                </button>
              </div>

              <p className="job-description">
                Checks configured preferences and discovers new jobs via JSearch API.
                Found jobs are queued for your approval or auto-applied based on settings.
              </p>
            </div>
          )}
        </section>

        {/* Auto-Apply Schedule */}
        <section className="form-section">
          <div className="section-header">
            <div>
              <h2>🤖 Auto-Apply Schedule</h2>
              <p>Automatically generate applications for queued jobs</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="autoApplyEnabled"
                checked={config.autoApplyEnabled}
                onChange={handleChange}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {config.autoApplyEnabled && (
            <div className="job-settings">
              <div className="form-group">
                <label>Frequency</label>
                <select name="autoApplyFrequency" value={config.autoApplyFrequency} onChange={handleChange}>
                  <option value="hourly">Every Hour</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly (Monday)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Time of Day</label>
                <input
                  type="time"
                  name="autoApplyTime"
                  value={config.autoApplyTime}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <button
                  type="button"
                  className="btn-test"
                  onClick={() => handleTestJob('auto_apply')}
                >
                  🧪 Test Now
                </button>
              </div>

              <p className="job-description">
                Processes queued jobs: generates cover letters, tailors resumes, and creates applications.
                Respects your daily application limit and approval settings.
              </p>
            </div>
          )}
        </section>

        {/* Email Digest Schedule */}
        <section className="form-section">
          <div className="section-header">
            <div>
              <h2>📧 Email Digest</h2>
              <p>Receive email summaries of alerts and pending applications</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="emailDigestEnabled"
                checked={config.emailDigestEnabled}
                onChange={handleChange}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {config.emailDigestEnabled && (
            <div className="job-settings">
              <div className="form-group">
                <label>Frequency</label>
                <select name="emailDigestFrequency" value={config.emailDigestFrequency} onChange={handleChange}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly (Monday)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Time of Day</label>
                <input
                  type="time"
                  name="emailDigestTime"
                  value={config.emailDigestTime}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <button
                  type="button"
                  className="btn-test"
                  onClick={() => handleTestJob('email_digest')}
                >
                  🧪 Send Test Email
                </button>
              </div>

              <p className="job-description">
                Sends formatted email with recent alerts and pending job approvals.
                Includes quick action links to review and apply directly from email.
              </p>
            </div>
          )}
        </section>

        {/* Timezone */}
        <section className="form-section">
          <h2>🌍 Timezone</h2>
          <p>All scheduled times are converted to your timezone</p>

          <div className="form-group">
            <label>Timezone</label>
            <select name="timezone" value={config.timezone} onChange={handleChange}>
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <p className="info-text">
            Your times are automatically converted from UTC for scheduling.
            Selected timezone: <strong>{config.timezone}</strong>
          </p>
        </section>

        {/* Last Execution Info */}
        {(config.lastAlertCheckAt || config.lastAutoApplyAt || config.lastEmailDigestAt) && (
          <section className="form-section info-section">
            <h2>📊 Last Executions</h2>
            <div className="execution-grid">
              {config.lastAlertCheckAt && (
                <div className="execution-item">
                  <p className="exec-label">Alert Check</p>
                  <p className="exec-time">{new Date(config.lastAlertCheckAt).toLocaleString()}</p>
                </div>
              )}
              {config.lastAutoApplyAt && (
                <div className="execution-item">
                  <p className="exec-label">Auto-Apply</p>
                  <p className="exec-time">{new Date(config.lastAutoApplyAt).toLocaleString()}</p>
                </div>
              )}
              {config.lastEmailDigestAt && (
                <div className="execution-item">
                  <p className="exec-label">Email Digest</p>
                  <p className="exec-time">{new Date(config.lastEmailDigestAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '💾 Saving...' : '💾 Save Settings'}
          </button>
          <button type="button" className="btn-secondary" onClick={handleCancel}>
            ← Back to Dashboard
          </button>
        </div>
      </form>
    </div>
  );
};

export default SchedulerSettings;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '../../context/AuthContext';
import * as notificationsService from '../../services/notifications.service.js';
import './NotificationPreferences.css';

const NotificationPreferences = () => {
  const { user } = useAuthUser();
  const navigate = useNavigate();

  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const prefs = await notificationsService.getNotificationPreferences();
      setPreferences(prefs);
    } catch (err) {
      console.error('Error loading preferences:', err);
      setError(err.message || 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setPreferences({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  const handleTimeChange = (key, value) => {
    setPreferences({
      ...preferences,
      [key]: value,
    });
  };

  const handleSelectChange = (key, value) => {
    setPreferences({
      ...preferences,
      [key]: value,
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await notificationsService.updateNotificationPreferences(preferences);
      setSuccess('Notification preferences saved successfully!');

      setTimeout(() => {
        navigate('/joblist');
      }, 2000);
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError(err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/joblist');
  };

  if (loading) {
    return (
      <div className="notification-preferences-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading notification preferences...</p>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="notification-preferences-container">
        <div className="error-message">Failed to load preferences</div>
      </div>
    );
  }

  return (
    <div className="notification-preferences-container">
      <div className="preferences-header">
        <h1>🔔 Notification Preferences</h1>
        <p>Customize how and when you receive job search notifications</p>
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

      <form className="preferences-form">
        {/* Daily Notifications */}
        <section className="form-section">
          <div className="section-header">
            <div>
              <h2>📨 Daily Alert Digest</h2>
              <p>Get a summary of new matching jobs every day</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.dailyAlertDigest}
                onChange={() => handleToggle('dailyAlertDigest')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {preferences.dailyAlertDigest && (
            <div className="preferences-group">
              <div className="form-group">
                <label>Preferred Time</label>
                <input
                  type="time"
                  value={preferences.dailyAlertTime}
                  onChange={(e) => handleTimeChange('dailyAlertTime', e.target.value)}
                />
              </div>
              <p className="description">
                You'll receive a summary of the day's new job matches at your preferred time, converted to your local timezone.
              </p>
            </div>
          )}
        </section>

        {/* Weekly Digest */}
        <section className="form-section">
          <div className="section-header">
            <div>
              <h2>📊 Weekly Digest</h2>
              <p>Receive a detailed summary of your job search activity</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.weeklyDigest}
                onChange={() => handleToggle('weeklyDigest')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {preferences.weeklyDigest && (
            <div className="preferences-group">
              <div className="form-row">
                <div className="form-group">
                  <label>Day of Week</label>
                  <select
                    value={preferences.weeklyDigestDay}
                    onChange={(e) => handleSelectChange('weeklyDigestDay', e.target.value)}
                  >
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                    <option value="saturday">Saturday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="time"
                    value={preferences.weeklyDigestTime}
                    onChange={(e) => handleTimeChange('weeklyDigestTime', e.target.value)}
                  />
                </div>
              </div>
              <p className="description">
                Includes application statistics, performance metrics, and personalized recommendations.
              </p>
            </div>
          )}
        </section>

        {/* Transactional Notifications */}
        <section className="form-section">
          <h2>✉️ Transactional Notifications</h2>
          <p>Instant notifications for important job search events</p>

          <div className="notification-group">
            <label className="notification-item">
              <input
                type="checkbox"
                checked={preferences.autoApplyConfirm}
                onChange={() => handleToggle('autoApplyConfirm')}
              />
              <div className="notification-content">
                <span className="notification-title">✅ Auto-Apply Confirmations</span>
                <span className="notification-desc">Confirm when applications are submitted</span>
              </div>
            </label>

            <label className="notification-item">
              <input
                type="checkbox"
                checked={preferences.interviewNotif}
                onChange={() => handleToggle('interviewNotif')}
              />
              <div className="notification-content">
                <span className="notification-title">🎉 Interview Scheduled</span>
                <span className="notification-desc">Alert when an interview is scheduled</span>
              </div>
            </label>

            <label className="notification-item">
              <input
                type="checkbox"
                checked={preferences.followUpReminder}
                onChange={() => handleToggle('followUpReminder')}
              />
              <div className="notification-content">
                <span className="notification-title">📬 Follow-Up Reminders</span>
                <span className="notification-desc">Remind you to follow up on stale applications</span>
              </div>
            </label>

            <label className="notification-item">
              <input
                type="checkbox"
                checked={preferences.milestoneNotif}
                onChange={() => handleToggle('milestoneNotif')}
              />
              <div className="notification-content">
                <span className="notification-title">🏆 Milestone Achievements</span>
                <span className="notification-desc">Celebrate when you reach goals</span>
              </div>
            </label>

            <label className="notification-item">
              <input
                type="checkbox"
                checked={preferences.actionRequired}
                onChange={() => handleToggle('actionRequired')}
              />
              <div className="notification-content">
                <span className="notification-title">⚡ Action Required</span>
                <span className="notification-desc">Alert for pending approvals</span>
              </div>
            </label>
          </div>
        </section>

        {/* Delivery Preferences */}
        <section className="form-section">
          <h2>⚙️ Delivery Preferences</h2>

          <div className="form-group">
            <label>Email Grouping</label>
            <select
              value={preferences.emailGrouping}
              onChange={(e) => handleSelectChange('emailGrouping', e.target.value)}
            >
              <option value="digest">Group into digests (fewer emails)</option>
              <option value="individual">Send individually (more frequent)</option>
            </select>
            <p className="description">
              Digest mode combines related notifications into a single email. Individual mode sends each notification immediately.
            </p>
          </div>

          <div className="form-group">
            <label>Content Level</label>
            <select
              value={preferences.contentLevel}
              onChange={(e) => handleSelectChange('contentLevel', e.target.value)}
            >
              <option value="summary">Summary (key info only)</option>
              <option value="detailed">Detailed (full information)</option>
            </select>
            <p className="description">
              Choose how much detail to include in your email notifications.
            </p>
          </div>
        </section>

        {/* Global Preferences */}
        <section className="form-section">
          <label className="notification-item full-width">
            <input
              type="checkbox"
              checked={preferences.globalOptOut}
              onChange={() => handleToggle('globalOptOut')}
            />
            <div className="notification-content">
              <span className="notification-title">⛔ Opt Out of All Notifications</span>
              <span className="notification-desc">Stop receiving all email notifications</span>
            </div>
          </label>
        </section>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '💾 Saving...' : '💾 Save Preferences'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCancel}
          >
            ← Back to Dashboard
          </button>
        </div>
      </form>
    </div>
  );
};

export default NotificationPreferences;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '../../context/AuthContext';
import * as autoApplyService from '../../services/autoApply.service';
import './AutoApplySettings.css';

const AutoApplySettings = () => {
  const { user } = useAuthUser();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    preferredRoles: [],
    preferredLocations: [],
    minMatchScore: 70,
    maxApplicationsPerDay: 5,
    approvalMode: 'manual',
    autoApplyThreshold: 85,
    notifyOnQueue: true,
    notifyOnApply: true,
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [newLocation, setNewLocation] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await autoApplyService.getAutoApplyConfig();
      setFormData(res.data);
    } catch (err) {
      console.error('Error loading config:', err);
      setError(err.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value,
    });
  };

  const handleAddRole = () => {
    if (newRole.trim() && !formData.preferredRoles.includes(newRole.trim())) {
      setFormData({
        ...formData,
        preferredRoles: [...formData.preferredRoles, newRole.trim()],
      });
      setNewRole('');
    }
  };

  const handleRemoveRole = (role) => {
    setFormData({
      ...formData,
      preferredRoles: formData.preferredRoles.filter((r) => r !== role),
    });
  };

  const handleAddLocation = () => {
    if (newLocation.trim() && !formData.preferredLocations.includes(newLocation.trim())) {
      setFormData({
        ...formData,
        preferredLocations: [...formData.preferredLocations, newLocation.trim()],
      });
      setNewLocation('');
    }
  };

  const handleRemoveLocation = (location) => {
    setFormData({
      ...formData,
      preferredLocations: formData.preferredLocations.filter((l) => l !== location),
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await autoApplyService.updateAutoApplyConfig(formData);
      setFormData(res.data);
      setSuccess('Configuration saved successfully!');
      setTimeout(() => {
        navigate('/joblist/auto-apply');
      }, 1500);
    } catch (err) {
      console.error('Error saving config:', err);
      setError(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/joblist/auto-apply');
  };

  if (loading) {
    return (
      <div className="auto-apply-settings-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auto-apply-settings-container">
      <div className="settings-header">
        <h1>⚙️ Auto-Apply Settings</h1>
        <p>Configure your auto-apply preferences and approval mode</p>
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

      <form className="settings-form">
        {/* Target Roles */}
        <section className="form-section">
          <h2>🎯 Preferred Roles</h2>
          <p className="section-description">Jobs matching these roles will be considered</p>

          <div className="tag-input-group">
            <div className="tag-input-wrapper">
              <input
                type="text"
                placeholder="e.g., Senior Software Engineer"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRole();
                  }
                }}
              />
              <button type="button" className="btn-add" onClick={handleAddRole}>
                + Add
              </button>
            </div>

            {formData.preferredRoles.length > 0 && (
              <div className="tags">
                {formData.preferredRoles.map((role) => (
                  <div key={role} className="tag">
                    <span>{role}</span>
                    <button
                      type="button"
                      className="tag-close"
                      onClick={() => handleRemoveRole(role)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Target Locations */}
        <section className="form-section">
          <h2>📍 Preferred Locations</h2>
          <p className="section-description">Jobs in these locations will be matched</p>

          <div className="tag-input-group">
            <div className="tag-input-wrapper">
              <input
                type="text"
                placeholder="e.g., Remote or San Francisco, CA"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLocation();
                  }
                }}
              />
              <button type="button" className="btn-add" onClick={handleAddLocation}>
                + Add
              </button>
            </div>

            {formData.preferredLocations.length > 0 && (
              <div className="tags">
                {formData.preferredLocations.map((location) => (
                  <div key={location} className="tag">
                    <span>{location}</span>
                    <button
                      type="button"
                      className="tag-close"
                      onClick={() => handleRemoveLocation(location)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Match Thresholds */}
        <section className="form-section">
          <h2>📊 Match Thresholds</h2>
          <p className="section-description">Control job matching and application limits</p>

          <div className="form-group">
            <label>Minimum Match Score: {formData.minMatchScore}%</label>
            <input
              type="range"
              name="minMatchScore"
              min="0"
              max="100"
              step="5"
              value={formData.minMatchScore}
              onChange={handleInputChange}
              className="slider"
            />
            <p className="slider-help">Only queue jobs matching {formData.minMatchScore}% or higher</p>
          </div>

          <div className="form-group">
            <label>Max Applications Per Day: {formData.maxApplicationsPerDay}</label>
            <input
              type="range"
              name="maxApplicationsPerDay"
              min="1"
              max="20"
              step="1"
              value={formData.maxApplicationsPerDay}
              onChange={handleInputChange}
              className="slider"
            />
            <p className="slider-help">Maximum {formData.maxApplicationsPerDay} applications submitted per day</p>
          </div>
        </section>

        {/* Approval Mode */}
        <section className="form-section">
          <h2>✓ Approval Mode</h2>
          <p className="section-description">Choose how applications are handled</p>

          <div className="radio-group">
            <label className="radio-option">
              <input
                type="radio"
                name="approvalMode"
                value="manual"
                checked={formData.approvalMode === 'manual'}
                onChange={handleInputChange}
              />
              <span className="radio-label">
                <strong>Manual</strong>
                <p>Review and approve each application before submitting</p>
              </span>
            </label>

            <label className="radio-option">
              <input
                type="radio"
                name="approvalMode"
                value="threshold"
                checked={formData.approvalMode === 'threshold'}
                onChange={handleInputChange}
              />
              <span className="radio-label">
                <strong>Smart Threshold</strong>
                <p>Auto-apply jobs scoring {formData.autoApplyThreshold}% or higher, review others</p>
              </span>
            </label>

            <label className="radio-option">
              <input
                type="radio"
                name="approvalMode"
                value="automatic"
                checked={formData.approvalMode === 'automatic'}
                onChange={handleInputChange}
              />
              <span className="radio-label">
                <strong>Fully Automatic</strong>
                <p>Apply to all jobs matching your criteria without review</p>
              </span>
            </label>
          </div>

          {formData.approvalMode === 'threshold' && (
            <div className="form-group">
              <label>Auto-Apply Threshold: {formData.autoApplyThreshold}%</label>
              <input
                type="range"
                name="autoApplyThreshold"
                min="50"
                max="100"
                step="5"
                value={formData.autoApplyThreshold}
                onChange={handleInputChange}
                className="slider"
              />
              <p className="slider-help">Jobs scoring {formData.autoApplyThreshold}% or higher will be auto-applied</p>
            </div>
          )}
        </section>

        {/* Notifications */}
        <section className="form-section">
          <h2>🔔 Notifications</h2>
          <p className="section-description">Control when you receive notifications</p>

          <label className="checkbox-option">
            <input
              type="checkbox"
              name="notifyOnQueue"
              checked={formData.notifyOnQueue}
              onChange={handleInputChange}
            />
            <span>Notify when jobs are queued for approval</span>
          </label>

          <label className="checkbox-option">
            <input
              type="checkbox"
              name="notifyOnApply"
              checked={formData.notifyOnApply}
              onChange={handleInputChange}
            />
            <span>Notify when applications are submitted</span>
          </label>
        </section>

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

export default AutoApplySettings;

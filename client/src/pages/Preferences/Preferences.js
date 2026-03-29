import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '../../context/AuthContext';
import {
  initializePreferencesApi,
  getPreferencesApi,
  updatePreferencesApi,
  formatPreferences,
} from '../../services/preferences.service';
import './Preferences.css';

const Preferences = () => {
  const { user } = useAuthUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    preferredRoles: [],
    preferredLocations: [],
    platforms: [],
    salaryMin: null,
    salaryMax: null,
    remoteOnly: false,
    alertFrequency: 'manual',
    matchThreshold: 60,
    maxAlertsPerCheck: 10,
    autoApplyEnabled: false,
  });

  const [newRole, setNewRole] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const commonRoles = [
    'Software Engineer',
    'Full Stack Developer',
    'Backend Engineer',
    'Frontend Engineer',
    'Data Scientist',
    'DevOps Engineer',
    'Product Manager',
    'UX Designer',
    'QA Engineer',
  ];

  const commonLocations = [
    'Remote',
    'San Francisco, CA',
    'New York, NY',
    'Seattle, WA',
    'Austin, TX',
    'Los Angeles, CA',
    'Chicago, IL',
    'Boston, MA',
    'Denver, CO',
    'Toronto, Canada',
  ];

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getPreferencesApi();

      if (!response.ok) {
        if (response.status === 404) {
          // Preferences don't exist yet
          setFormData({
            preferredRoles: [],
            preferredLocations: [],
            platforms: [],
            salaryMin: null,
            salaryMax: null,
            remoteOnly: false,
            alertFrequency: 'manual',
            matchThreshold: 60,
            maxAlertsPerCheck: 10,
            autoApplyEnabled: false,
          });
        } else {
          throw new Error('Failed to load preferences');
        }
      } else {
        const data = await response.json();
        const formatted = formatPreferences(data.data);
        setFormData(formatted);
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
      setError(err.message || 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeFromHistory = async () => {
    try {
      setIsInitializing(true);
      setError(null);

      const response = await initializePreferencesApi();
      if (!response.ok) throw new Error('Failed to initialize preferences');

      const data = await response.json();
      const formatted = formatPreferences(data.data);
      setFormData(formatted);
      setSuccess('Preferences initialized from your application history!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error initializing preferences:', err);
      setError(err.message || 'Failed to initialize preferences');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleAddRole = () => {
    if (newRole.trim() && !formData.preferredRoles.includes(newRole)) {
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
      preferredRoles: formData.preferredRoles.filter(r => r !== role),
    });
  };

  const handleAddLocation = () => {
    if (newLocation.trim() && !formData.preferredLocations.includes(newLocation)) {
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
      preferredLocations: formData.preferredLocations.filter(l => l !== location),
    });
  };

  const handleTogglePlatform = (platform) => {
    const platforms = formData.platforms || [];
    if (platforms.includes(platform)) {
      setFormData({
        ...formData,
        platforms: platforms.filter(p => p !== platform),
      });
    } else {
      setFormData({
        ...formData,
        platforms: [...platforms, platform],
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await updatePreferencesApi(formData);
      if (!response.ok) throw new Error('Failed to save preferences');

      setSuccess('Preferences saved successfully!');
      setTimeout(() => {
        setSuccess(null);
        // Redirect to alerts page
        navigate('/joblist/alerts');
      }, 2000);
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError(err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="preferences-container">
        <div className="preferences-loading">
          <div className="spinner"></div>
          <p>Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="preferences-container">
      <div className="preferences-header">
        <h1>Job Alert Preferences</h1>
        <p>Customize your job alert settings to find the perfect match</p>
      </div>

      {error && (
        <div className="preferences-alert preferences-alert-error">
          <span>❌ {error}</span>
          <button className="alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {success && (
        <div className="preferences-alert preferences-alert-success">
          <span>✅ {success}</span>
        </div>
      )}

      <div className="preferences-form">
        {/* Job Preferences Section */}
        <div className="form-section">
          <div className="section-header">
            <h2>Job Preferences</h2>
            <button
              className="init-btn"
              onClick={handleInitializeFromHistory}
              disabled={isInitializing}
            >
              {isInitializing ? 'Initializing...' : '🔄 Initialize from History'}
            </button>
          </div>

          {/* Preferred Roles */}
          <div className="form-group">
            <label>Preferred Job Roles</label>
            <div className="tag-input-group">
              <input
                type="text"
                placeholder="e.g., Software Engineer"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddRole()}
              />
              <button type="button" onClick={handleAddRole}>Add</button>
            </div>
            <div className="tag-list">
              {formData.preferredRoles.map((role) => (
                <div key={role} className="tag">
                  {role}
                  <button onClick={() => handleRemoveRole(role)}>×</button>
                </div>
              ))}
            </div>
            <div className="suggestions">
              <small>Quick add:</small>
              {commonRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  className="suggestion-btn"
                  onClick={() => {
                    if (!formData.preferredRoles.includes(role)) {
                      setFormData({
                        ...formData,
                        preferredRoles: [...formData.preferredRoles, role],
                      });
                    }
                  }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Locations */}
          <div className="form-group">
            <label>Preferred Locations</label>
            <div className="tag-input-group">
              <input
                type="text"
                placeholder="e.g., San Francisco, CA"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddLocation()}
              />
              <button type="button" onClick={handleAddLocation}>Add</button>
            </div>
            <div className="tag-list">
              {formData.preferredLocations.map((location) => (
                <div key={location} className="tag location-tag">
                  📍 {location}
                  <button onClick={() => handleRemoveLocation(location)}>×</button>
                </div>
              ))}
            </div>
            <div className="suggestions">
              <small>Quick add:</small>
              {commonLocations.map((location) => (
                <button
                  key={location}
                  type="button"
                  className="suggestion-btn"
                  onClick={() => {
                    if (!formData.preferredLocations.includes(location)) {
                      setFormData({
                        ...formData,
                        preferredLocations: [...formData.preferredLocations, location],
                      });
                    }
                  }}
                >
                  {location}
                </button>
              ))}
            </div>
          </div>

          {/* Remote Preference */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.remoteOnly}
                onChange={(e) =>
                  setFormData({ ...formData, remoteOnly: e.target.checked })
                }
              />
              <span>Remote positions only</span>
            </label>
            <small>Show only fully remote job opportunities</small>
          </div>

          {/* Salary Range */}
          <div className="form-row">
            <div className="form-group">
              <label>Minimum Salary (USD)</label>
              <input
                type="number"
                placeholder="e.g., 80000"
                value={formData.salaryMin || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    salaryMin: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
              />
            </div>
            <div className="form-group">
              <label>Maximum Salary (USD)</label>
              <input
                type="number"
                placeholder="e.g., 150000"
                value={formData.salaryMax || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    salaryMax: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Platform Selection */}
        <div className="form-section">
          <h2>Job Platforms</h2>
          <div className="platform-list">
            {['LinkedIn', 'Indeed', 'Glassdoor', 'AngelList', 'Built In'].map(
              (platform) => (
                <div key={platform} className="platform-checkbox">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.platforms.includes(platform)}
                      onChange={() => handleTogglePlatform(platform)}
                    />
                    <span>{platform}</span>
                  </label>
                </div>
              )
            )}
          </div>
        </div>

        {/* Alert Settings */}
        <div className="form-section">
          <h2>Alert Settings</h2>

          <div className="form-group">
            <label>Alert Frequency</label>
            <select
              value={formData.alertFrequency}
              onChange={(e) =>
                setFormData({ ...formData, alertFrequency: e.target.value })
              }
            >
              <option value="manual">Manual (Check on demand)</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            <small>How often you want to receive job alerts</small>
          </div>

          <div className="form-group">
            <label>Match Score Threshold: {formData.matchThreshold}%</label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={formData.matchThreshold}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  matchThreshold: parseInt(e.target.value),
                })
              }
            />
            <small>Only show jobs with at least this match percentage</small>
          </div>

          <div className="form-group">
            <label>Maximum Alerts per Check</label>
            <input
              type="number"
              min="1"
              max="50"
              value={formData.maxAlertsPerCheck}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxAlertsPerCheck: parseInt(e.target.value),
                })
              }
            />
            <small>Limit number of alerts generated per check</small>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.autoApplyEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, autoApplyEnabled: e.target.checked })
                }
              />
              <span>Enable auto-apply for high-match jobs (80%+)</span>
            </label>
            <small>Coming soon: Automatically apply to top-matching jobs</small>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="preferences-actions">
        <button
          className="btn-cancel"
          onClick={handleCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          className="btn-save"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save & View Alerts'}
        </button>
      </div>
    </div>
  );
};

export default Preferences;

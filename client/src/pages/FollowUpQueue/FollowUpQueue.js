import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '../../context/AuthContext';
import {
  getFollowUpsApi,
  generateFollowUpSuggestionsApi,
  getStaleApplicationsApi,
} from '../../services/followUp.service';
import FollowUpCard from './components/FollowUpCard';
import FollowUpEmailModal from '../../components/shared/FollowUpEmailModal';
import './FollowUpQueue.css';

const FollowUpQueue = () => {
  const { user } = useAuthUser();
  const navigate = useNavigate();
  const [followUps, setFollowUps] = useState([]);
  const [staleApplications, setStaleApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('pending');
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sortBy, setSortBy] = useState('date-desc');

  useEffect(() => {
    loadFollowUpData();
  }, []);

  const loadFollowUpData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [followUpsResponse, applicationsResponse] = await Promise.all([
        getFollowUpsApi(),
        getStaleApplicationsApi(),
      ]);

      if (!followUpsResponse.ok) throw new Error('Failed to load follow-ups');
      if (!applicationsResponse.ok) throw new Error('Failed to load stale applications');

      const followUpsData = await followUpsResponse.json();
      const applicationsData = await applicationsResponse.json();

      setFollowUps(followUpsData.data || []);
      setStaleApplications(applicationsData.data || []);
    } catch (err) {
      console.error('Error loading follow-up data:', err);
      setError(err.message || 'Failed to load follow-up data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSuggestions = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const response = await generateFollowUpSuggestionsApi();
      if (!response.ok) throw new Error('Failed to generate suggestions');

      const data = await response.json();
      const generatedCount = data.data?.length || 0;

      if (generatedCount === 0) {
        setError('No stale applications found that need follow-ups');
      }

      // Reload follow-ups
      await loadFollowUpData();
    } catch (err) {
      console.error('Error generating suggestions:', err);
      setError(err.message || 'Failed to generate suggestions');
    } finally {
      setIsGenerating(false);
    }
  };

  const getFilteredFollowUps = () => {
    let filtered = followUps;

    // Filter by status
    if (activeFilter === 'pending') {
      filtered = filtered.filter(f => f.status === 'pending' && !f.dismissed);
    } else if (activeFilter === 'approved') {
      filtered = filtered.filter(f => f.status === 'approved');
    } else if (activeFilter === 'sent') {
      filtered = filtered.filter(f => f.status === 'sent');
    } else if (activeFilter === 'dismissed') {
      filtered = filtered.filter(f => f.dismissed);
    }

    // Sort
    if (sortBy === 'date-asc') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'date-desc') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'company') {
      filtered.sort((a, b) => a.companyName.localeCompare(b.companyName));
    } else if (sortBy === 'count') {
      filtered.sort((a, b) => b.followUpCount - a.followUpCount);
    }

    return filtered;
  };

  const handleSelectFollowUp = (followUp) => {
    setSelectedFollowUp(followUp);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFollowUp(null);
    loadFollowUpData();
  };

  if (loading) {
    return (
      <div className="followup-container">
        <div className="followup-loading">
          <div className="spinner"></div>
          <p>Loading follow-up queue...</p>
        </div>
      </div>
    );
  }

  const filteredFollowUps = getFilteredFollowUps();
  const pendingCount = followUps.filter(f => f.status === 'pending' && !f.dismissed).length;
  const staleCount = staleApplications.length;

  return (
    <div className="followup-container">
      <div className="followup-header">
        <div className="followup-title-section">
          <h1>📧 Follow-Up Queue</h1>
          <p className="followup-subtitle">
            Track and manage follow-up emails for your applications
          </p>
        </div>
        <button
          className="followup-generate-btn"
          onClick={handleGenerateSuggestions}
          disabled={isGenerating || staleCount === 0}
        >
          {isGenerating ? '⏳ Generating...' : '✨ Generate Suggestions'}
        </button>
      </div>

      {error && (
        <div className="followup-alert followup-alert-info">
          <span>ℹ️ {error}</span>
          <button className="alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="followup-stats">
        <div className="stat-card">
          <div className="stat-number">{pendingCount}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{staleCount}</div>
          <div className="stat-label">Stale Applications</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{followUps.filter(f => f.status === 'sent').length}</div>
          <div className="stat-label">Sent</div>
        </div>
      </div>

      <div className="followup-controls">
        <div className="filter-group">
          <label className="filter-label">Filter:</label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${activeFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveFilter('pending')}
            >
              ⏳ Pending
            </button>
            <button
              className={`filter-btn ${activeFilter === 'approved' ? 'active' : ''}`}
              onClick={() => setActiveFilter('approved')}
            >
              ✅ Approved
            </button>
            <button
              className={`filter-btn ${activeFilter === 'sent' ? 'active' : ''}`}
              onClick={() => setActiveFilter('sent')}
            >
              📤 Sent
            </button>
            <button
              className={`filter-btn ${activeFilter === 'dismissed' ? 'active' : ''}`}
              onClick={() => setActiveFilter('dismissed')}
            >
              ⏭️ Dismissed
            </button>
            <button
              className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              📋 All
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
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="company">Company Name</option>
            <option value="count">Follow-Up Count</option>
          </select>
        </div>

        <button className="followup-refresh-btn" onClick={loadFollowUpData}>
          🔄 Refresh
        </button>
      </div>

      <div className="followup-list">
        {filteredFollowUps.length > 0 ? (
          <>
            <div className="followup-count">
              Showing {filteredFollowUps.length} of {followUps.length}
            </div>
            {filteredFollowUps.map((followUp) => (
              <FollowUpCard
                key={followUp.id}
                followUp={followUp}
                onSelect={handleSelectFollowUp}
                onRefresh={loadFollowUpData}
              />
            ))}
          </>
        ) : (
          <div className="followup-empty">
            <div className="empty-icon">📭</div>
            <h3>No {activeFilter === 'all' ? '' : activeFilter} follow-ups</h3>
            {activeFilter === 'pending' && (
              <p>
                {staleCount > 0
                  ? 'Generate suggestions to get started!'
                  : 'All applications are up to date. Great work!'}
              </p>
            )}
            {staleCount > 0 && (
              <button className="followup-empty-btn" onClick={handleGenerateSuggestions}>
                Generate Suggestions
              </button>
            )}
          </div>
        )}
      </div>

      {showModal && selectedFollowUp && (
        <FollowUpEmailModal followUp={selectedFollowUp} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default FollowUpQueue;

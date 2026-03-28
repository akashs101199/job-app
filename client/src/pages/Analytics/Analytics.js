import React, { useState, useEffect } from 'react';
import { useAuthUser } from '../../context/AuthContext';
import { getInsightsApi, getMarketTrendsApi } from '../../services/analytics.service';
import InsightCard from './components/InsightCard';
import PlatformComparison from './components/PlatformComparison';
import SkillGapCard from './components/SkillGapCard';
import PerformanceTrends from './components/PerformanceTrends';
import RecommendedActions from './components/RecommendedActions';
import './Analytics.css';

const Analytics = () => {
  const { user } = useAuthUser();
  const [insights, setInsights] = useState(null);
  const [marketTrends, setMarketTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user insights
      const insightsResponse = await getInsightsApi();
      if (!insightsResponse.ok) {
        throw new Error('Failed to load insights');
      }
      const insightsData = await insightsResponse.json();

      // Fetch market trends
      const trendsResponse = await getMarketTrendsApi([]);
      if (!trendsResponse.ok) {
        throw new Error('Failed to load market trends');
      }
      const trendsData = await trendsResponse.json();

      setInsights(insightsData.data);
      setMarketTrends(trendsData.data);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="analytics-loading">
          <div className="spinner"></div>
          <p>Loading your analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="analytics-error">
          <h3>⚠️ Unable to Load Analytics</h3>
          <p>{error}</p>
          <button className="analytics-retry-btn" onClick={loadAnalytics}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div className="analytics-title-section">
          <h1>📊 Job Search Analytics</h1>
          <p className="analytics-subtitle">
            AI-powered insights to optimize your job search strategy
          </p>
        </div>
        <button className="analytics-refresh-btn" onClick={loadAnalytics}>
          🔄 Refresh Data
        </button>
      </div>

      <div className="analytics-tabs">
        <button
          className={`analytics-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📈 Overview
        </button>
        <button
          className={`analytics-tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          🎯 Performance
        </button>
        <button
          className={`analytics-tab ${activeTab === 'market' ? 'active' : ''}`}
          onClick={() => setActiveTab('market')}
        >
          🌍 Market Trends
        </button>
        <button
          className={`analytics-tab ${activeTab === 'actions' ? 'active' : ''}`}
          onClick={() => setActiveTab('actions')}
        >
          ✅ Recommendations
        </button>
      </div>

      <div className="analytics-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="analytics-grid">
            {insights && (
              <>
                <InsightCard
                  title="📊 Today's Insight"
                  description={insights.insights}
                  className="analytics-full-width"
                />
                <PlatformComparison
                  insights={insights.insights}
                  className="analytics-half-width"
                />
                {insights.skillGaps && insights.skillGaps.length > 0 && (
                  <SkillGapCard
                    skillGaps={insights.skillGaps}
                    className="analytics-half-width"
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="analytics-grid">
            {insights && (
              <>
                <PerformanceTrends
                  performanceAnalysis={insights.performanceAnalysis}
                  className="analytics-full-width"
                />
                <InsightCard
                  title="📈 Success Metrics"
                  description={insights.performanceAnalysis}
                  className="analytics-full-width"
                />
              </>
            )}
          </div>
        )}

        {/* Market Trends Tab */}
        {activeTab === 'market' && (
          <div className="analytics-grid">
            {marketTrends && (
              <InsightCard
                title="🌍 Market Trends"
                description={marketTrends.trends}
                className="analytics-full-width"
              />
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'actions' && (
          <div className="analytics-grid">
            {insights && insights.recommendations && (
              <RecommendedActions
                recommendations={insights.recommendations}
                className="analytics-full-width"
              />
            )}
          </div>
        )}
      </div>

      <div className="analytics-footer">
        <p className="analytics-generated-time">
          Last updated: {insights?.generatedAt ? new Date(insights.generatedAt).toLocaleString() : 'Just now'}
        </p>
      </div>
    </div>
  );
};

export default Analytics;

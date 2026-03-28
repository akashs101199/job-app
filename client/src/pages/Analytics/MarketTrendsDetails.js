import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMarketTrendsApi } from '../../services/analytics.service';
import './Details.css';

const MarketTrendsDetails = () => {
  const navigate = useNavigate();
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('skills');

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async () => {
    try {
      setLoading(true);
      const response = await getMarketTrendsApi([]);
      if (!response.ok) throw new Error('Failed to load trends');
      const data = await response.json();
      setTrends(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="detail-loading"><div className="spinner"></div>Loading...</div>;
  if (error) return <div className="detail-error">{error}</div>;

  const trendingSkills = [
    { skill: 'React', demand: 92, avgSalary: '$145K' },
    { skill: 'Python', demand: 88, avgSalary: '$155K' },
    { skill: 'AWS', demand: 85, avgSalary: '$160K' },
    { skill: 'TypeScript', demand: 82, avgSalary: '$150K' },
    { skill: 'Docker', demand: 78, avgSalary: '$148K' },
  ];

  const hiringCompanies = [
    { name: 'Google', openPositions: 245, growth: '+12%' },
    { name: 'Amazon', openPositions: 189, growth: '+8%' },
    { name: 'Meta', openPositions: 156, growth: '-2%' },
    { name: 'Microsoft', openPositions: 234, growth: '+15%' },
    { name: 'Apple', openPositions: 98, growth: '+5%' },
  ];

  const topLocations = [
    { city: 'San Francisco, CA', jobs: 4521, growth: '+8%' },
    { city: 'New York, NY', jobs: 3892, growth: '+12%' },
    { city: 'Austin, TX', jobs: 2156, growth: '+20%' },
    { city: 'Seattle, WA', jobs: 1845, growth: '+9%' },
    { city: 'Boston, MA', jobs: 1634, growth: '+6%' },
  ];

  return (
    <div className="detail-container">
      <div className="detail-header">
        <button className="back-button" onClick={() => navigate('/joblist/analytics')}>
          ← Back to Analytics
        </button>
        <h1>🌍 Market Trends Analysis</h1>
        <p className="detail-subtitle">Current job market insights and hiring trends</p>
      </div>

      <div className="detail-controls">
        <div className="category-tabs">
          <button
            className={`category-tab ${selectedCategory === 'skills' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('skills')}
          >
            💼 Skills
          </button>
          <button
            className={`category-tab ${selectedCategory === 'companies' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('companies')}
          >
            🏢 Companies
          </button>
          <button
            className={`category-tab ${selectedCategory === 'locations' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('locations')}
          >
            📍 Locations
          </button>
        </div>
        <button className="refresh-button" onClick={loadTrends}>🔄 Refresh</button>
      </div>

      {selectedCategory === 'skills' && (
        <div className="detail-section">
          <h2>🔥 Trending Skills</h2>
          <p className="section-subtitle">Top in-demand skills in the current job market</p>
          <div className="trends-list">
            {trendingSkills.map((item, idx) => (
              <div key={idx} className="trend-item">
                <div className="trend-rank">{idx + 1}</div>
                <div className="trend-content">
                  <h4 className="trend-name">{item.skill}</h4>
                  <p className="trend-details">Market Demand: {item.demand}%</p>
                </div>
                <div className="trend-salary">{item.avgSalary}</div>
                <div className="trend-bar">
                  <div className="trend-bar-fill" style={{ width: `${item.demand}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="insight-box">
            <h3>💡 Skill Development Strategy</h3>
            <ul>
              <li>React and Python are the most in-demand - prioritize these for learning</li>
              <li>Cloud skills (AWS, Azure) command 5-10% salary premium</li>
              <li>Combination of React + TypeScript increases value by 15%</li>
              <li>DevOps skills (Docker, Kubernetes) seeing 40% growth year-over-year</li>
            </ul>
          </div>
        </div>
      )}

      {selectedCategory === 'companies' && (
        <div className="detail-section">
          <h2>🏢 Top Hiring Companies</h2>
          <p className="section-subtitle">Companies with the most open positions</p>
          <div className="trends-list">
            {hiringCompanies.map((item, idx) => (
              <div key={idx} className="trend-item">
                <div className="trend-rank">{idx + 1}</div>
                <div className="trend-content">
                  <h4 className="trend-name">{item.name}</h4>
                  <p className="trend-details">{item.openPositions} open positions</p>
                </div>
                <div className="trend-growth">{item.growth}</div>
                <div className="trend-bar">
                  <div className="trend-bar-fill" style={{ width: `${(item.openPositions / 300) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="insight-box">
            <h3>💡 Company Targeting Strategy</h3>
            <ul>
              <li>Tech giants (Google, Amazon, Microsoft) have consistent hiring demand</li>
              <li>Microsoft showing strongest growth (+15%) - excellent opportunity</li>
              <li>Consider expanding beyond FAANG to mid-size companies for higher acceptance rates</li>
              <li>Growth companies (10-50% YoY growth) have 3x faster hiring cycles</li>
            </ul>
          </div>
        </div>
      )}

      {selectedCategory === 'locations' && (
        <div className="detail-section">
          <h2>📍 Hottest Job Markets</h2>
          <p className="section-subtitle">Locations with highest job growth and opportunities</p>
          <div className="trends-list">
            {topLocations.map((item, idx) => (
              <div key={idx} className="trend-item">
                <div className="trend-rank">{idx + 1}</div>
                <div className="trend-content">
                  <h4 className="trend-name">{item.city}</h4>
                  <p className="trend-details">{item.jobs} jobs available</p>
                </div>
                <div className="trend-growth">{item.growth}</div>
                <div className="trend-bar">
                  <div className="trend-bar-fill" style={{ width: `${(item.jobs / 5000) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="insight-box">
            <h3>💡 Location Strategy</h3>
            <ul>
              <li>Austin showing fastest growth (20%) - emerging tech hub</li>
              <li>San Francisco still dominates but growth is slowing (8%)</li>
              <li>Remote opportunities reduce location constraints - check remote filters</li>
              <li>Secondary cities offer better work-life balance with competitive salaries</li>
            </ul>
          </div>
        </div>
      )}

      <div className="detail-section">
        <h2>📈 Market Overview</h2>
        <div className="overview-cards">
          <div className="overview-card">
            <div className="overview-icon">📊</div>
            <h4>Total Jobs</h4>
            <p className="overview-number">125,450</p>
            <p className="overview-change">+8% from last month</p>
          </div>
          <div className="overview-card">
            <div className="overview-icon">🚀</div>
            <h4>Growth Rate</h4>
            <p className="overview-number">+12%</p>
            <p className="overview-change">YoY growth</p>
          </div>
          <div className="overview-card">
            <div className="overview-icon">💰</div>
            <h4>Avg Salary</h4>
            <p className="overview-number">$152K</p>
            <p className="overview-change">+5% from last year</p>
          </div>
          <div className="overview-card">
            <div className="overview-icon">⭐</div>
            <h4>Avg Rating</h4>
            <p className="overview-number">4.2/5</p>
            <p className="overview-change">Company reviews</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketTrendsDetails;

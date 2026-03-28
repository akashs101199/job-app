import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '../../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuthUser();
  const navigate = useNavigate();

  const navigateTo = (path) => {
    navigate(path);
  };

  const cardBackgroundColors = [
    'rgba(208, 190, 190, 0.5)',
    'rgba(255, 182, 193, 0.5)',
    'rgba(152, 251, 152, 0.5)',
  ];

  const iconBackgroundColors = [
    'rgba(206, 213, 227, 0.7)',
    'rgba(186, 163, 170, 0.7)',
    'rgba(162, 181, 170, 0.7)',
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-blob blob-top-right"></div>
      <div className="dashboard-blob blob-bottom-left"></div>
      <div className="dashboard-blob blob-middle-left"></div>
      <div className="dashboard-blob blob-small-top"></div>

      <div className="dashboard-main-content">
        <div className="dashboard-profile-section">
          <div className="profile-pic-container">
            {user && user.profilePic ? (
              <img
                src={user.profilePic}
                alt="Profile"
                className="profile-pic"
              />
            ) : (
              <div className="profile-placeholder">
                {user && user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>
          <h2 className="welcome-text">
            Hey {user ? user.firstName || 'there' : 'there'}!
          </h2>
          <p className="welcome-subtext">
            What would you like to do today?
          </p>
        </div>

        <div className="dashboard-feature-section">
          <div
            className="dashboard-feature-card"
            style={{ backgroundColor: cardBackgroundColors[0] }}
            onClick={() => navigateTo('/joblist/jobsearch')}
          >
            <div
              className="dashboard-feature-icon"
              style={{ backgroundColor: iconBackgroundColors[0] }}
            >
              🔍
            </div>
            <div className="dashboard-feature-content">
              <h3 className="feature-title">Wanna search for jobs?</h3>
              <p className="feature-description">
                Discover opportunities tailored just for you! Find your dream job today.
              </p>
            </div>
          </div>

          <div
            className="dashboard-feature-card"
            style={{ backgroundColor: cardBackgroundColors[1] }}
            onClick={() => navigateTo('/joblist/analytics')}
          >
            <div
              className="dashboard-feature-icon"
              style={{ backgroundColor: iconBackgroundColors[1] }}
            >
              📊
            </div>
            <div className="dashboard-feature-content">
              <h3 className="feature-title">See your job search analytics</h3>
              <p className="feature-description">
                Get AI-powered insights on your applications and market trends!
              </p>
            </div>
          </div>

          <div
            className="dashboard-feature-card"
            style={{ backgroundColor: cardBackgroundColors[2] }}
            onClick={() => navigateTo('/joblist/profile')}
          >
            <div
              className="dashboard-feature-icon"
              style={{ backgroundColor: iconBackgroundColors[2] }}
            >
              📝
            </div>
            <div className="dashboard-feature-content">
              <h3 className="feature-title">Track your applications</h3>
              <p className="feature-description">
                Stay organized! Keep tabs on where you've applied and what's next.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

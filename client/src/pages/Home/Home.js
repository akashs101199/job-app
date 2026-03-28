import '../../styles/App.css';
import neu from '../../assets/images/northeastern.jpg';
import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="App">
      <div className="container-fluid" id="top-bar">
        <div className="row align-items-center">
          <div className="col-3 text-start">
            <img src={neu} alt="Husky Logo" />
          </div>
          <div className="col-6 text-center">
            <h1 className="Name">Job Portal</h1>
          </div>
          <div className="col-3">
            {/* Reserved for future navigation */}
          </div>
        </div>
      </div>

      <div className="home-container">
        <div className="home-content-wrapper">
          <h2 className="home-title">Welcome to Job Portal</h2>

          <div className="home-content">
            <p>
              The Job Tracker Application is a comprehensive web-based platform designed to assist job seekers in managing their job search process. By connecting to external job platforms like LinkedIn, Glassdoor, and Indeed, the application provides real-time job listings based on the user's search keywords.
            </p>

            <p>
              Our platform helps users track applications, analyze performance metrics from various job sites, and streamline the entire job search journey with features such as:
            </p>

            <ul className="feature-list">
              <li>Real-time job listings from multiple platforms</li>
              <li>Application status tracking</li>
              <li>Performance analytics dashboard</li>
              <li>Direct application capabilities</li>
            </ul>

            <div className="cta-buttons">
              <Link to="/login" className="home-btn primary-btn">Login</Link>
              <Link to="/register" className="home-btn secondary-btn">Register</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

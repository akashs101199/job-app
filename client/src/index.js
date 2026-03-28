import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import TopNav from './components/layout/TopNav';
import Profile from './pages/Profile/Profile';
import Dashboard from './pages/Dashboard/Dashboard';
import Home from './pages/Home/Home';
import RequireAuth from './components/auth/RequireAuth';
import JobSearch from './pages/JobSearch/JobSearch';
import InterviewPrep from './pages/InterviewPrep/InterviewPrep';
import Analytics from './pages/Analytics/Analytics';
import PerformanceDetails from './pages/Analytics/PerformanceDetails';
import MarketTrendsDetails from './pages/Analytics/MarketTrendsDetails';
import FollowUpQueue from './pages/FollowUpQueue/FollowUpQueue';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="joblist" element={
          <RequireAuth>
            <TopNav />
          </RequireAuth>
        }>
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="jobsearch" element={<JobSearch />} />
          <Route path="interview-prep/:jobId" element={<InterviewPrep />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="performance-details" element={<PerformanceDetails />} />
          <Route path="market-trends-details" element={<MarketTrendsDetails />} />
          <Route path="follow-ups" element={<FollowUpQueue />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

reportWebVitals();

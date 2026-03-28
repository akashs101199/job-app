import React, { createContext, useState, useEffect, useContext } from 'react';
import * as authApi from '../services/auth.service';
import * as trackerApi from '../services/tracker.service';
import * as jobsApi from '../services/jobs.service';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error_call, setErrorCall] = useState('');
  const [user, setUser] = useState(null);
  const [jobIds, setJobIds] = useState(null);
  const [records, setRecords] = useState(null);
  const [finishedJobs, setFinishedJobs] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setErrorCall('');
      try {
        const res = await authApi.fetchMe();
        if (res.ok) {
          setIsAuthenticated(true);
          const data = await res.json();
          setUser(data);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const insertApplication = async (
    jobId, status, currentDateTime,
    dateUpdated, notes, jobTitle,
    employer_name, apply_link, publisher
  ) => {
    try {
      const res = await trackerApi.insertApplication(
        jobId, status, currentDateTime,
        dateUpdated, notes, jobTitle,
        employer_name, apply_link, publisher
      );
      if (!res.ok) {
        console.error('Insert failed with status:', res.status);
      }
    } catch (error) {
      console.error('Fetch failed:', error);
    }
  };

  const fetchRecords = async () => {
    try {
      const res = await trackerApi.fetchRecords();
      if (res.ok) {
        const userData = await res.json();
        setRecords(userData.records);
      } else {
        console.log('Server error, status:', res.status);
      }
    } catch (error) {
      console.error('Fetch failed:', error);
    }
  };

  const updateRecord = async (value, id, platformName) => {
    await trackerApi.updateRecord(value, id, platformName);
  };

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    if (res.ok) {
      const userData = await res.json();
      setIsAuthenticated(true);
      setUser(userData.user);
      setErrorCall('');
      return { success: true };
    } else {
      const data = await res.json();
      setErrorCall(data.message);
      setIsAuthenticated(false);
      setUser(null);
      return { success: false };
    }
  };

  const getJobId = async () => {
    try {
      const response = await jobsApi.getJobIds();
      const data = await response.json();
      setJobIds(data.jobIds);
    } catch (error) {
      console.log('Error fetching Job Ids:', error);
    }
  };

  const logout = async () => {
    await authApi.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const getFinishedJobs = async () => {
    try {
      const response = await jobsApi.getJobIdsByStatus();
      const data = await response.json();
      setFinishedJobs(data.jobIds);
    } catch (error) {
      console.log('Error fetching Job Ids:', error);
    }
  };

  const register = async (email, password, firstName, lastName, dob) => {
    const res = await authApi.register(email, password, firstName, lastName, dob);
    if (res.ok) {
      setErrorCall('');
      return { success: true };
    } else {
      const data = await res.json();
      setErrorCall(data.message || 'Registration failed');
      return { success: false, message: data.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated, loading, user, getJobId,
        getFinishedJobs, finishedJobs, jobIds,
        login, register, logout, error_call,
        fetchRecords, insertApplication, records, updateRecord,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthUser = () => useContext(AuthContext);

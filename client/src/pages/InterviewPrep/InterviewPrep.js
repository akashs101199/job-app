import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './InterviewPrep.css';
import { getInterviewPrepApi } from '../../services/interviewPrep.service';
import CompanyResearch from './components/CompanyResearch';
import PracticeQuestions from './components/PracticeQuestions';
import MockInterview from './components/MockInterview';
import NegotiationGuide from './components/NegotiationGuide';

const InterviewPrep = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [prepData, setPrepData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('company');

  useEffect(() => {
    fetchInterviewPrep();
  }, [jobId]);

  const fetchInterviewPrep = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getInterviewPrepApi(jobId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch interview prep (Status: ${response.status})`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setPrepData(data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching interview prep:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="ip-container">
      <div className="ip-header">
        <button className="ip-back-button" onClick={handleBack}>
          ← Back
        </button>
        <h1>Interview Preparation</h1>
        <button className="ip-print-button" onClick={handlePrint}>
          🖨️ Print
        </button>
      </div>

      {loading && (
        <div className="ip-loading">
          <div className="ip-spinner"></div>
          <p>Generating interview preparation...</p>
        </div>
      )}

      {error && (
        <div className="ip-error">
          <h3>Error Loading Interview Prep</h3>
          <p>{error}</p>
          <button className="ip-retry-button" onClick={fetchInterviewPrep}>
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && prepData && (
        <>
          <div className="ip-tabs-container">
            <div className="ip-tabs">
              <button
                className={`ip-tab ${activeTab === 'company' ? 'active' : ''}`}
                onClick={() => setActiveTab('company')}
              >
                🏢 Company Research
              </button>
              <button
                className={`ip-tab ${activeTab === 'questions' ? 'active' : ''}`}
                onClick={() => setActiveTab('questions')}
              >
                ❓ Practice Questions
              </button>
              <button
                className={`ip-tab ${activeTab === 'mock' ? 'active' : ''}`}
                onClick={() => setActiveTab('mock')}
              >
                🎤 Mock Interview
              </button>
              <button
                className={`ip-tab ${activeTab === 'negotiation' ? 'active' : ''}`}
                onClick={() => setActiveTab('negotiation')}
              >
                💰 Negotiation Guide
              </button>
            </div>
          </div>

          <div className="ip-content">
            {activeTab === 'company' && <CompanyResearch data={prepData.companyOverview} />}
            {activeTab === 'questions' && (
              <PracticeQuestions
                technical={prepData.technicalQuestions}
                behavioral={prepData.behavioralQuestions}
                counterQuestions={prepData.counterQuestions}
              />
            )}
            {activeTab === 'mock' && <MockInterview jobId={jobId} />}
            {activeTab === 'negotiation' && <NegotiationGuide data={prepData.negotiationGuide} />}
          </div>
        </>
      )}
    </div>
  );
};

export default InterviewPrep;

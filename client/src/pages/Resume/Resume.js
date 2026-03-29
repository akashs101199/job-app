import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '../../context/AuthContext';
import {
  uploadResumeApi,
  listResumesApi,
  analyzeResumeApi,
  tailorResumeApi,
  formatFileSize,
  formatDate,
} from '../../services/resume.service';
import './Resume.css';

const Resume = () => {
  const { user } = useAuthUser();
  const navigate = useNavigate();

  // State management
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Analysis state
  const [analysisResults, setAnalysisResults] = useState(null);
  const [tailorResults, setTailorResults] = useState(null);

  // Form state
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  // Load resumes on mount
  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await listResumesApi();
      if (!response.ok) throw new Error('Failed to load resumes');

      const data = await response.json();
      setResumes(data.data || []);

      // Select first resume if available
      if (data.data && data.data.length > 0) {
        setSelectedResume(data.data[0]);
      }
    } catch (err) {
      console.error('Error loading resumes:', err);
      setError(err.message || 'Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a PDF or DOCX file.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5242880) {
      setError('File size exceeds 5MB limit.');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const response = await uploadResumeApi(file);
      if (!response.ok) throw new Error('Failed to upload resume');

      const data = await response.json();
      setSuccess('Resume uploaded successfully!');
      setTimeout(() => setSuccess(null), 3000);

      // Reload resumes
      await loadResumes();
    } catch (err) {
      console.error('Error uploading resume:', err);
      setError(err.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedResume) {
      setError('Please select a resume to analyze');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      setTailorResults(null); // Clear previous results

      const response = await analyzeResumeApi(
        selectedResume.id,
        jobDescription || null,
        jobTitle || null
      );

      if (!response.ok) throw new Error('Failed to analyze resume');

      const data = await response.json();
      setAnalysisResults(data.data);
      setSuccess('Resume analyzed successfully!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Error analyzing resume:', err);
      setError(err.message || 'Failed to analyze resume');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleTailor = async () => {
    if (!selectedResume) {
      setError('Please select a resume to tailor');
      return;
    }

    if (!jobTitle || !jobDescription) {
      setError('Please provide both job title and job description');
      return;
    }

    try {
      setTailoring(true);
      setError(null);

      const response = await tailorResumeApi(
        selectedResume.id,
        jobTitle,
        jobDescription
      );

      if (!response.ok) throw new Error('Failed to tailor resume');

      const data = await response.json();
      setTailorResults(data.data);
      setSuccess('Resume tailored successfully!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Error tailoring resume:', err);
      setError(err.message || 'Failed to tailor resume');
    } finally {
      setTailoring(false);
    }
  };

  if (loading) {
    return (
      <div className="resume-container">
        <div className="resume-loading">
          <div className="spinner"></div>
          <p>Loading resumes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="resume-container">
      <div className="resume-header">
        <h1>Resume Optimization</h1>
        <p>Upload, analyze, and tailor your resume with AI-powered insights</p>
      </div>

      {error && (
        <div className="resume-alert resume-alert-error">
          <span>❌ {error}</span>
          <button className="alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {success && (
        <div className="resume-alert resume-alert-success">
          <span>✅ {success}</span>
        </div>
      )}

      <div className="resume-layout">
        {/* Left Panel - Upload & Resume Selection */}
        <div className="resume-left-panel">
          <div className="resume-upload-section">
            <h2>📄 Your Resumes</h2>

            <div className="upload-area">
              <input
                type="file"
                id="file-input"
                accept=".pdf,.docx"
                onChange={handleFileUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              <label htmlFor="file-input" className="upload-label">
                <div className="upload-icon">📁</div>
                <div className="upload-text">
                  <p className="upload-title">Drag & drop your resume here</p>
                  <p className="upload-subtitle">or click to select (PDF, DOCX - max 5MB)</p>
                </div>
              </label>
            </div>

            {uploading && <p className="uploading-text">⏳ Uploading...</p>}

            {resumes.length > 0 && (
              <div className="resumes-list">
                <h3>Your Resumes ({resumes.length})</h3>
                {resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className={`resume-item ${selectedResume?.id === resume.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedResume(resume);
                      setAnalysisResults(null);
                      setTailorResults(null);
                    }}
                  >
                    <div className="resume-item-icon">
                      {resume.fileType === 'pdf' ? '📕' : '📗'}
                    </div>
                    <div className="resume-item-info">
                      <p className="resume-item-name">{resume.fileName}</p>
                      <p className="resume-item-meta">
                        {formatFileSize(resume.fileSize)} • {formatDate(resume.uploadedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {resumes.length === 0 && !uploading && (
              <div className="no-resumes">
                <p>No resumes yet. Upload one to get started!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Analysis & Tailoring */}
        <div className="resume-right-panel">
          {selectedResume && (
            <>
              {/* Analysis Section */}
              <div className="resume-section">
                <h2>🔍 ATS Analysis</h2>
                <p className="section-description">
                  Get your ATS score and optimization suggestions
                </p>

                <div className="analysis-inputs">
                  <div className="input-group">
                    <label>Job Title (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., Senior Software Engineer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label>Job Description (Optional)</label>
                    <textarea
                      placeholder="Paste job description for tailored analysis"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      rows="4"
                    />
                  </div>

                  <button
                    className="btn-analyze"
                    onClick={handleAnalyze}
                    disabled={analyzing}
                  >
                    {analyzing ? '⏳ Analyzing...' : '🔍 Analyze Resume'}
                  </button>
                </div>

                {analysisResults && (
                  <div className="analysis-results">
                    <div className="ats-score-card">
                      <div className="score-circle">
                        <div className={`score-number ${analysisResults.atsScore >= 80 ? 'excellent' : analysisResults.atsScore >= 60 ? 'good' : 'fair'}`}>
                          {analysisResults.atsScore}%
                        </div>
                      </div>
                      <p className="score-label">ATS Score</p>
                    </div>

                    {analysisResults.keywords && (
                      <div className="keywords-section">
                        <h4>Keywords</h4>
                        {analysisResults.keywords.present && analysisResults.keywords.present.length > 0 && (
                          <div className="keyword-group">
                            <p className="keyword-title">Found Keywords</p>
                            <div className="keywords-list">
                              {analysisResults.keywords.present.slice(0, 8).map((kw, idx) => (
                                <span key={idx} className="keyword present">✓ {kw}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {analysisResults.keywords.missing && analysisResults.keywords.missing.length > 0 && (
                          <div className="keyword-group">
                            <p className="keyword-title">Missing Keywords</p>
                            <div className="keywords-list">
                              {analysisResults.keywords.missing.slice(0, 5).map((kw, idx) => (
                                <span key={idx} className="keyword missing">✗ {kw}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {analysisResults.suggestions && analysisResults.suggestions.length > 0 && (
                      <div className="suggestions-section">
                        <h4>Top Suggestions</h4>
                        {analysisResults.suggestions.slice(0, 5).map((suggestion, idx) => (
                          <div key={idx} className={`suggestion ${suggestion.priority}`}>
                            <span className="priority-badge">{suggestion.priority}</span>
                            <p>{suggestion.reasoning || suggestion.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tailor Section */}
              <div className="resume-section">
                <h2>✨ Tailor Resume</h2>
                <p className="section-description">
                  Customize your resume for a specific job
                </p>

                {analysisResults && (
                  <button
                    className="btn-tailor"
                    onClick={handleTailor}
                    disabled={tailoring || !jobTitle || !jobDescription}
                  >
                    {tailoring ? '⏳ Tailoring...' : '✨ Generate Tailored Version'}
                  </button>
                )}

                {!analysisResults && (
                  <p className="info-text">👆 Analyze your resume first to enable tailoring</p>
                )}

                {tailorResults && (
                  <div className="tailor-results">
                    <div className="changes-summary">
                      <p className="summary-text">{tailorResults.summary}</p>
                    </div>

                    <button
                      className="btn-download"
                      onClick={() => {
                        // Copy tailored text to clipboard or download
                        navigator.clipboard.writeText(tailorResults.tailoredContent);
                        setSuccess('Copied to clipboard! You can now paste it into a text editor.');
                      }}
                    >
                      📋 Copy to Clipboard
                    </button>

                    {tailorResults.changes && tailorResults.changes.length > 0 && (
                      <div className="changes-list">
                        <h4>Changes Made ({tailorResults.changes.length})</h4>
                        {tailorResults.changes.slice(0, 5).map((change, idx) => (
                          <div key={idx} className="change-item">
                            <p className="change-section">{change.section}</p>
                            <p className="change-reason">{change.reason}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {!selectedResume && resumes.length > 0 && (
            <div className="select-resume-prompt">
              <p>👈 Select a resume from the list to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Resume;

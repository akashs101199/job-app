import React from 'react';

const CompanyResearch = ({ data }) => {
  if (!data) {
    return <div className="ip-section">No company research available.</div>;
  }

  return (
    <div className="ip-section ip-company-research">
      <h2>Company Research</h2>

      {data.overview && (
        <div className="ip-card">
          <h3>Company Overview</h3>
          <p>{data.overview}</p>
        </div>
      )}

      {data.size && (
        <div className="ip-card">
          <h3>Company Size & Structure</h3>
          <p>{data.size}</p>
        </div>
      )}

      {data.recentNews && data.recentNews.length > 0 && (
        <div className="ip-card">
          <h3>Recent Company News</h3>
          <ul className="ip-list">
            {data.recentNews.map((news, index) => (
              <li key={index}>{news}</li>
            ))}
          </ul>
        </div>
      )}

      {data.keyFacts && data.keyFacts.length > 0 && (
        <div className="ip-card">
          <h3>Key Facts</h3>
          <ul className="ip-list">
            {data.keyFacts.map((fact, index) => (
              <li key={index}>{fact}</li>
            ))}
          </ul>
        </div>
      )}

      {data.cultureIndicators && data.cultureIndicators.length > 0 && (
        <div className="ip-card">
          <h3>Company Culture</h3>
          <ul className="ip-list">
            {data.cultureIndicators.map((indicator, index) => (
              <li key={index}>{indicator}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="ip-tip">
        <strong>💡 Tip:</strong> Use this information to research the company online. Look for their
        official website, LinkedIn profile, recent press releases, and employee reviews on Glassdoor
        or similar platforms.
      </div>
    </div>
  );
};

export default CompanyResearch;

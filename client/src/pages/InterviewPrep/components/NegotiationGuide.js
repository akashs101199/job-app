import React, { useState } from 'react';

const NegotiationGuide = ({ data }) => {
  const [expandedScript, setExpandedScript] = useState(null);

  if (!data) {
    return <div className="ip-section">No negotiation guide available.</div>;
  }

  return (
    <div className="ip-section ip-negotiation-guide">
      <h2>Salary & Negotiation Guide</h2>

      {data.salaryInfo && (
        <div className="ip-card">
          <h3>💰 Salary Information</h3>
          {data.salaryInfo.typicalRange && (
            <div className="ip-salary-range">
              <strong>Typical Range:</strong> {data.salaryInfo.typicalRange}
            </div>
          )}
          {data.salaryInfo.factors && data.salaryInfo.factors.length > 0 && (
            <div className="ip-salary-factors">
              <strong>Factors That Affect Salary:</strong>
              <ul>
                {data.salaryInfo.factors.map((factor, index) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
            </div>
          )}
          {data.salaryInfo.notes && <p className="ip-salary-notes">{data.salaryInfo.notes}</p>}
        </div>
      )}

      {data.negotiationStrategies && data.negotiationStrategies.length > 0 && (
        <div className="ip-card">
          <h3>📋 Negotiation Strategies</h3>
          <ol className="ip-strategies-list">
            {data.negotiationStrategies.map((strategy, index) => (
              <li key={index}>{strategy}</li>
            ))}
          </ol>
        </div>
      )}

      {data.scriptTemplates && data.scriptTemplates.length > 0 && (
        <div className="ip-card">
          <h3>🎬 Negotiation Scripts</h3>
          <div className="ip-scripts-list">
            {data.scriptTemplates.map((template, index) => (
              <div key={index} className="ip-script-card">
                <div
                  className="ip-script-header"
                  onClick={() => setExpandedScript(expandedScript === index ? null : index)}
                >
                  <strong>{template.scenario}</strong>
                  <span className="ip-expand-icon">{expandedScript === index ? '▲' : '▼'}</span>
                </div>
                {expandedScript === index && (
                  <div className="ip-script-content">
                    <p>{template.script}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.benefitsToNegotiate && data.benefitsToNegotiate.length > 0 && (
        <div className="ip-card">
          <h3>✨ Additional Benefits to Negotiate</h3>
          <div className="ip-benefits-grid">
            {data.benefitsToNegotiate.map((benefit, index) => (
              <div key={index} className="ip-benefit-item">
                {benefit}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="ip-tip">
        <strong>💡 Negotiation Tips:</strong>
        <ul>
          <li>Always negotiate - the worst they can say is "no"</li>
          <li>Research market rates before accepting an offer</li>
          <li>Get the offer in writing before negotiating</li>
          <li>Don't mention your current salary - focus on market value</li>
          <li>Be prepared with specific numbers and examples</li>
          <li>Consider the whole package, not just base salary</li>
          <li>Stay professional and respectful throughout</li>
          <li>If they can't meet your salary requirement, negotiate other benefits</li>
        </ul>
      </div>

      <div className="ip-warning">
        <strong>⚠️ Important:</strong> While negotiating is expected, remember that non-monetary
        benefits (remote work, flexible hours, professional development, PTO) can be just as valuable.
        Prioritize what matters most to you and your career.
      </div>
    </div>
  );
};

export default NegotiationGuide;

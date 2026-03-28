import React from 'react';

const SkillGapCard = ({ skillGaps, className = '' }) => {
  const parseSkillGaps = () => {
    if (Array.isArray(skillGaps)) {
      return skillGaps;
    }

    if (typeof skillGaps === 'string') {
      return skillGaps.split('\n').filter(s => s.trim().length > 0);
    }

    return [];
  };

  const gaps = parseSkillGaps();

  const getPriorityColor = (index) => {
    if (index === 0) return '#e74c3c'; // Red - High
    if (index === 1) return '#f39c12'; // Orange - Medium
    return '#3498db'; // Blue - Low
  };

  return (
    <div className={`skill-gap-card ${className}`}>
      <div className="card-header">
        <h3 className="card-title">📚 Skill Gaps</h3>
        <p className="card-subtitle">Skills to develop for better matches</p>
      </div>

      <div className="skills-list">
        {gaps.length > 0 ? (
          gaps.slice(0, 5).map((skill, index) => (
            <div key={index} className="skill-item">
              <div className="skill-priority" style={{ backgroundColor: getPriorityColor(index) }}>
                {index + 1}
              </div>
              <div className="skill-content">
                <p className="skill-name">{skill}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="no-gaps-message">
            ✨ No significant skill gaps detected! You're well-positioned for your target roles.
          </p>
        )}
      </div>

      <div className="skill-gap-footer">
        <p className="skill-tip">
          💡 Fill these gaps to improve your match scores
        </p>
      </div>
    </div>
  );
};

export default SkillGapCard;

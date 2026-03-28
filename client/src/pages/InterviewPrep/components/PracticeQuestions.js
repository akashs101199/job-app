import React, { useState } from 'react';
import { getDifficultyColor, formatStarFramework } from '../../../services/interviewPrep.service';

const PracticeQuestions = ({ technical, behavioral, counterQuestions }) => {
  const [expandedTechnical, setExpandedTechnical] = useState(null);
  const [expandedBehavioral, setExpandedBehavioral] = useState(null);
  const [expandedCounter, setExpandedCounter] = useState(null);

  const toggleTechnical = (index) => {
    setExpandedTechnical(expandedTechnical === index ? null : index);
  };

  const toggleBehavioral = (index) => {
    setExpandedBehavioral(expandedBehavioral === index ? null : index);
  };

  const toggleCounter = (index) => {
    setExpandedCounter(expandedCounter === index ? null : index);
  };

  return (
    <div className="ip-section ip-practice-questions">
      <h2>Practice Questions</h2>

      {technical && technical.length > 0 && (
        <div className="ip-questions-category">
          <h3>Technical Questions ({technical.length})</h3>
          <p className="ip-category-description">
            These questions test your technical knowledge and problem-solving skills.
          </p>
          <div className="ip-questions-list">
            {technical.map((question, index) => (
              <div key={index} className="ip-question-card">
                <div
                  className="ip-question-header"
                  onClick={() => toggleTechnical(index)}
                >
                  <div className="ip-question-title">
                    <span className="ip-question-number">Q{index + 1}.</span>
                    <span className="ip-question-text">{question.question}</span>
                  </div>
                  <div className="ip-question-meta">
                    {question.difficulty && (
                      <span className={`ip-difficulty ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty}
                      </span>
                    )}
                    {question.category && <span className="ip-category-tag">{question.category}</span>}
                    <span className="ip-expand-icon">{expandedTechnical === index ? '▲' : '▼'}</span>
                  </div>
                </div>
                {expandedTechnical === index && (
                  <div className="ip-question-answer">
                    <div className="ip-answer-label">Approach & Tips:</div>
                    {question.answerFramework ? (
                      <p>{question.answerFramework}</p>
                    ) : (
                      <p>Think about the core concepts, edge cases, and time/space complexity.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {behavioral && behavioral.length > 0 && (
        <div className="ip-questions-category">
          <h3>Behavioral Questions ({behavioral.length})</h3>
          <p className="ip-category-description">
            Use the STAR method (Situation, Task, Action, Result) to answer these questions.
          </p>
          <div className="ip-questions-list">
            {behavioral.map((question, index) => (
              <div key={index} className="ip-question-card">
                <div className="ip-question-header" onClick={() => toggleBehavioral(index)}>
                  <div className="ip-question-title">
                    <span className="ip-question-number">Q{index + 1}.</span>
                    <span className="ip-question-text">{question.question}</span>
                  </div>
                  <div className="ip-question-meta">
                    {question.category && <span className="ip-category-tag">{question.category}</span>}
                    <span className="ip-expand-icon">{expandedBehavioral === index ? '▲' : '▼'}</span>
                  </div>
                </div>
                {expandedBehavioral === index && (
                  <div className="ip-question-answer">
                    <div className="ip-star-framework">
                      {formatStarFramework(question.answerFramework || question.starFramework).map(
                        (star, starIndex) => (
                          <div key={starIndex} className="ip-star-component">
                            <div className="ip-star-letter">{star.letter}</div>
                            <div className="ip-star-content">
                              <strong>{star.title}:</strong> {star.content}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                    {question.speakingTips && question.speakingTips.length > 0 && (
                      <div className="ip-tips">
                        <strong>Speaking Tips:</strong>
                        <ul>
                          {question.speakingTips.map((tip, tipIndex) => (
                            <li key={tipIndex}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {question.commonMistakes && question.commonMistakes.length > 0 && (
                      <div className="ip-mistakes">
                        <strong>⚠️ Common Mistakes:</strong>
                        <ul>
                          {question.commonMistakes.map((mistake, mistakeIndex) => (
                            <li key={mistakeIndex}>{mistake}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {counterQuestions && counterQuestions.length > 0 && (
        <div className="ip-questions-category">
          <h3>Questions to Ask the Interviewer ({counterQuestions.length})</h3>
          <p className="ip-category-description">
            These questions demonstrate your interest and strategic thinking. Ask 2-3 of them.
          </p>
          <div className="ip-questions-list">
            {counterQuestions.map((question, index) => (
              <div key={index} className="ip-question-card">
                <div className="ip-question-header" onClick={() => toggleCounter(index)}>
                  <div className="ip-question-title">
                    <span className="ip-question-number">Q{index + 1}.</span>
                    <span className="ip-question-text">{question.question}</span>
                  </div>
                  <div className="ip-question-meta">
                    {question.category && <span className="ip-category-tag">{question.category}</span>}
                    <span className="ip-expand-icon">{expandedCounter === index ? '▲' : '▼'}</span>
                  </div>
                </div>
                {expandedCounter === index && (
                  <div className="ip-question-answer">
                    <div className="ip-answer-label">Why This Matters:</div>
                    <p>{question.why}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="ip-tip">
        <strong>💡 Interview Tips:</strong>
        <ul>
          <li>Practice your answers out loud before the interview</li>
          <li>Take a moment to think before answering - silence is okay</li>
          <li>Use specific examples from your experience</li>
          <li>Focus on your actions and the impact you made</li>
          <li>Ask your counter-questions strategically - don't ask all of them</li>
        </ul>
      </div>
    </div>
  );
};

export default PracticeQuestions;

import React, { useState, useRef, useEffect } from 'react';

const MockInterview = ({ jobId }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      text: 'Welcome to your mock interview practice! 🎤\n\nTell me about a time when you had to learn a new technology quickly to solve a problem. Use the STAR method in your response.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: input,
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response (placeholder for future Claude API integration)
    setTimeout(() => {
      const assistantMessage = {
        id: messages.length + 2,
        type: 'assistant',
        text: generateMockFeedback(input),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const generateMockFeedback = (userResponse) => {
    const feedbackItems = [
      'That\'s a good start! Your answer shows good problem-solving skills. Next time, try to quantify the impact more - "improved performance by 30%" is more impressive than "improved performance".',
      'Great example! You covered all parts of the STAR method well. One tip: try to keep your answer to 2-3 minutes. This was a bit long.',
      'Interesting story! However, next time focus more on what YOU did specifically, rather than what the team did. The interviewer wants to understand your individual contribution.',
      'Strong response! You demonstrated leadership and technical ability. Consider adding one more sentence about what you learned from this experience.',
    ];

    return feedbackItems[Math.floor(Math.random() * feedbackItems.length)];
  };

  const handleNewInterview = () => {
    setMessages([
      {
        id: 1,
        type: 'assistant',
        text: 'New mock interview started! 🎤\n\nLet\'s start fresh. Tell me about a time when you disagreed with a team member. How did you handle it?',
      },
    ]);
  };

  return (
    <div className="ip-section ip-mock-interview">
      <h2>Mock Interview Practice</h2>

      <div className="ip-interview-container">
        <div className="ip-messages">
          {messages.map((message) => (
            <div key={message.id} className={`ip-message ip-message-${message.type}`}>
              <div className="ip-message-avatar">
                {message.type === 'assistant' ? '🤖' : '👤'}
              </div>
              <div className="ip-message-content">
                <p>{message.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="ip-message ip-message-assistant ip-typing">
              <div className="ip-message-avatar">🤖</div>
              <div className="ip-message-content">
                <div className="ip-typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="ip-interview-input" onSubmit={handleSendMessage}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer here... (Use STAR method)"
            disabled={isLoading}
            rows="3"
          />
          <div className="ip-interview-actions">
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="ip-send-button"
            >
              Send 📤
            </button>
            <button
              type="button"
              onClick={handleNewInterview}
              className="ip-new-interview-button"
            >
              New Question ↻
            </button>
          </div>
        </form>
      </div>

      <div className="ip-interview-info">
        <h3>How to Use Mock Interview</h3>
        <ul>
          <li>🎤 <strong>Practice Answering:</strong> Type your response to the interviewer's question</li>
          <li>📝 <strong>Get Feedback:</strong> The AI will provide constructive feedback</li>
          <li>🔁 <strong>Try Again:</strong> Click "New Question" to practice a different question</li>
          <li>⏱️ <strong>Time Yourself:</strong> Aim for 2-3 minute responses</li>
          <li>⭐ <strong>Use STAR Method:</strong> Structure your answer as Situation → Task → Action → Result</li>
        </ul>
      </div>

      <div className="ip-tip">
        <strong>💡 Pro Tip:</strong> For even better practice, record yourself answering questions and
        watch it back. You'll notice things like filler words ("um", "like"), pacing, and body language.
      </div>
    </div>
  );
};

export default MockInterview;

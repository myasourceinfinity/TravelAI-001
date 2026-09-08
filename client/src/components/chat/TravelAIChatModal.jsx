import React, { useState, useRef, useEffect } from 'react';
import './TravelAIChatModal.css';

const QUICK_PROMPTS = [
  'I want to visit Dubai for 7 days.',
  'I have NZ$4,000 for a family holiday.',
  'I want a luxury honeymoon in November.',
  "I don't know where to go. Surprise me.",
];

export default function TravelAIChatModal({
  messages = [],
  isSending = false,
  chatError = null,
  onSendMessage,
  onClose,
  onMinimize,
  onHistory,
}) {
  const [inputValue, setInputValue] = useState('');
  const [showPrompts, setShowPrompts] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSend = (textToSend) => {
    const text = textToSend || inputValue.trim();
    if (!text || isSending) return;

    if (typeof onSendMessage === 'function') {
      onSendMessage(text);
    }
    setInputValue('');
    setShowPrompts(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="travel-ai-modal-container">
      <div className="travel-ai-drag-handle" />

      {/* Header */}
      <div className="travel-ai-header">
        <div className="travel-ai-profile">
          <div className="travel-ai-avatar">★</div>
          <div className="travel-ai-title-wrap">
            <h3 className="travel-ai-title">Travel AI</h3>
            <span className="travel-ai-subtitle">Your AI Travel Advisor</span>
          </div>
        </div>

        <div className="travel-ai-actions">
          <button type="button" className="travel-ai-icon-btn" onClick={onHistory} title="History">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button type="button" className="travel-ai-icon-btn" onClick={onMinimize} title="Minimize">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button type="button" className="travel-ai-icon-btn" onClick={onClose} title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="travel-ai-body">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user' || msg.sender === 'user';
          return (
            <div key={index} className={`travel-ai-message-row ${isUser ? 'user' : 'ai'}`}>
              {!isUser && <div className="travel-ai-msg-avatar">★</div>}
              <div className="travel-ai-message-bubble">
                <p>{msg.content || msg.text}</p>
              </div>
            </div>
          );
        })}

        {showPrompts && messages.length <= 2 && (
          <div className="travel-ai-quick-prompts">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button key={idx} type="button" className="travel-ai-prompt-pill" onClick={() => handleSend(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        )}

        {isSending && (
          <div className="travel-ai-message-row ai">
            <div className="travel-ai-msg-avatar">★</div>
            <div className="travel-ai-message-bubble typing">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}

        {chatError && <div className="travel-ai-error-banner">⚠️ {chatError}</div>}
        <div ref={chatEndRef} />
      </div>

      {/* Input Field */}
      <div className="travel-ai-footer">
        <div className="travel-ai-input-wrap">
          <input
            type="text"
            className="travel-ai-input"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
          />
        </div>
        <button
          type="button"
          className="travel-ai-send-btn"
          onClick={() => handleSend()}
          disabled={isSending || !inputValue.trim()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
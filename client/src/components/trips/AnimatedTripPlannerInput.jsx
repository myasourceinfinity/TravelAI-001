import React, { useState, useEffect } from 'react';

export default function AnimatedTripPlannerInput({ value, onChange, onKeyDown, disabled }) {
  const placeholders = [
    "Tell TravelAI your destination, interests, dates, or plans...",
    "Leisure packages in Queenstown...",
    "Adventure packages in Queenstown...",
    "5-day cultural trip to Dubai...",
    "Budget hotels in Dubai...",
    "Romantic getaway to New Zealand...",
    "Family holiday in New Zealand..."
  ];

  const [placeholderText, setPlaceholderText] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    let timer;
    const currentFullText = placeholders[placeholderIndex];

    if (isDeleting) {
      timer = setTimeout(() => {
        setPlaceholderText(currentFullText.substring(0, charIndex - 1));
        setCharIndex(prev => prev - 1);
      }, 40);
    } else {
      timer = setTimeout(() => {
        setPlaceholderText(currentFullText.substring(0, charIndex + 1));
        setCharIndex(prev => prev + 1);
      }, 80);
    }

    if (!isDeleting && charIndex === currentFullText.length) {
      timer = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
    }

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, placeholderIndex]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      flex: 1,
      position: 'relative',
      borderRadius: '999px',
      padding: '2px',
      background: 'linear-gradient(90deg, #ff7e5f, #ff2a85, #feb47b, #ff7e5f)',
      backgroundSize: '400% 400%',
      animation: 'gradientMove 8s ease infinite',
      boxShadow: isFocused ? '0 0 24px rgba(255, 42, 133, 0.35)' : '0 0 16px rgba(255, 42, 133, 0.15)',
      transition: 'box-shadow 0.3s ease',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flex: 1,
        background: '#ffffff',
        borderRadius: '999px',
        padding: '4px 16px',
        minHeight: '48px',
        boxSizing: 'border-box'
      }}>
        <span style={{
          fontSize: '20px',
          color: '#0f172a',
          marginRight: '12px',
          display: 'flex',
          alignItems: 'center',
          userSelect: 'none',
          animation: 'sparkleGlow 2s ease-in-out infinite'
        }}>
          ✦
        </span>
        <input
          type="text"
          placeholder={placeholderText}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: '#0f172a',
            fontSize: '0.95rem',
            padding: '8px 0',
            minWidth: '50px',
          }}
        />
      </div>
    </div>
  );
}

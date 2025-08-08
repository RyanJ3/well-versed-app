import React from 'react';

export default function FlowPage() {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="flow-header-glass">
      <div className="header-glass-container">
        <div className="header-left-section">
          <div className="book-selector-glass">
            <span className="book-icon">📚</span>
            <span className="book-title">Genesis</span>
          </div>
          <div className="progress-ring-large">
            <svg width="120" height="120">
              <defs>
                <linearGradient id="gradient-neon" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r={radius} className="ring-bg" />
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="ring-fill"
                stroke="url(#gradient-neon)"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * 0.25}
                strokeLinecap="round"
              />
            </svg>
            <div className="ring-percentage">75%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

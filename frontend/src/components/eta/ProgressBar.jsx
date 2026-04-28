import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ 
  value, 
  max = 100, 
  label, 
  showValue = true,
  color = 'primary',
  size = 'medium'
}) => {
  const percentage = (value / max) * 100;

  return (
    <div className={`progress-bar progress-${size}`}>
      {label && (
        <div className="progress-label">
          <span>{label}</span>
          {showValue && <span>{value}/{max}</span>}
        </div>
      )}
      <div className="progress-track">
        <div 
          className={`progress-fill progress-${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
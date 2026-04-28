import React from 'react';
import './StopCard.css';
import { formatTime, formatDuration } from '../../utils/formatters';

const StopCard = ({ stop, eta, isNext, onClick }) => {
  const getEtaClass = () => {
    if (eta.minutes < 2) return 'eta-imminent';
    if (eta.minutes < 5) return 'eta-soon';
    if (eta.minutes < 10) return 'eta-approaching';
    return 'eta-normal';
  };

  return (
    <div 
      className={`stop-card ${isNext ? 'next-stop' : ''}`}
      onClick={() => onClick(stop)}
    >
      <div className="stop-indicator">
        <div className="stop-dot" />
        {!isNext && <div className="stop-line" />}
      </div>

      <div className="stop-content">
        <div className="stop-header">
          <h4 className="stop-name">{stop.name}</h4>
          {isNext && <span className="next-badge">Next Stop</span>}
        </div>

        <div className="stop-details">
          <div className="stop-eta">
            <span className={`eta-value ${getEtaClass()}`}>
              {formatDuration(eta.minutes)}
            </span>
            <span className="eta-label">ETA</span>
          </div>

          <div className="stop-arrival">
            <span className="arrival-time">
              {formatTime(eta.timestamp)}
            </span>
            <span className="arrival-label">Arrival</span>
          </div>

          <div className="stop-distance">
            <span className="distance-value">
              {(eta.distance / 1000).toFixed(1)} km
            </span>
            <span className="distance-label">Distance</span>
          </div>
        </div>

        {stop.facilities && stop.facilities.length > 0 && (
          <div className="stop-facilities">
            {stop.facilities.map((facility, index) => (
              <span key={index} className="facility-tag">
                {facility}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StopCard;
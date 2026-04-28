import React, { useState } from 'react';
import './TripControls.css';

const TripControls = ({ 
  tripStatus, 
  currentTrip, 
  onStatusChange, 
  onStartTrip, 
  onCompleteTrip,
  busInfo 
}) => {
  const [showBreakOptions, setShowBreakOptions] = useState(false);
  const [nextStop, setNextStop] = useState(currentTrip?.nextStop || 'Central Station');

  const handleStatusClick = (status) => {
    if (status === 'break') {
      setShowBreakOptions(true);
    } else {
      onStatusChange(status);
    }
  };

  const handleBreakSelect = (duration) => {
    setShowBreakOptions(false);
    onStatusChange('break');
    // Start break timer logic here
  };

  const getTimeUntilNextStop = () => {
    if (!currentTrip) return null;
    return '5 min';
  };

  return (
    <div className="trip-controls">
      <div className="controls-header">
        <h3>Trip Controls</h3>
        {currentTrip && (
          <span className="trip-id">Trip #{currentTrip.id}</span>
        )}
      </div>

      {/* Bus Info */}
      <div className="bus-info-card">
        <h4>Your Bus</h4>
        <div className="bus-details">
          <div className="detail-item">
            <span className="detail-label">Bus Number:</span>
            <span className="detail-value">{busInfo.number}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Route:</span>
            <span className="detail-value">{busInfo.route || 'Not assigned'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Occupancy:</span>
            <div className="occupancy-indicator">
              <div className="occupancy-bar">
                <div 
                  className="occupancy-fill" 
                  style={{ width: `${busInfo.occupancy}%` }}
                />
              </div>
              <span className="occupancy-value">{busInfo.occupancy}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Controls */}
      <div className="status-controls">
        <h4>Driver Status</h4>
        <div className="status-buttons">
          <button
            className={`status-btn offline ${tripStatus === 'offline' ? 'active' : ''}`}
            onClick={() => handleStatusClick('offline')}
            disabled={tripStatus === 'on-trip'}
          >
            <span className="status-icon">⚫</span>
            <span className="status-text">Offline</span>
          </button>

          <button
            className={`status-btn online ${tripStatus === 'online' ? 'active' : ''}`}
            onClick={() => handleStatusClick('online')}
          >
            <span className="status-icon">🟢</span>
            <span className="status-text">Online</span>
          </button>

          <button
            className={`status-btn break ${tripStatus === 'break' ? 'active' : ''}`}
            onClick={() => handleStatusClick('break')}
            disabled={tripStatus === 'on-trip'}
          >
            <span className="status-icon">☕</span>
            <span className="status-text">Break</span>
          </button>
        </div>
      </div>

      {/* Break Options Modal */}
      {showBreakOptions && (
        <div className="break-modal">
          <div className="break-modal-content">
            <h4>Select Break Duration</h4>
            <div className="break-options">
              <button onClick={() => handleBreakSelect(15)}>15 min</button>
              <button onClick={() => handleBreakSelect(30)}>30 min</button>
              <button onClick={() => handleBreakSelect(45)}>45 min</button>
              <button onClick={() => handleBreakSelect(60)}>1 hour</button>
            </div>
            <button 
              className="cancel-btn"
              onClick={() => setShowBreakOptions(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Current Trip Info */}
      {currentTrip && (
        <div className="current-trip">
          <h4>Current Trip</h4>
          
          <div className="trip-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: '60%' }}
              />
            </div>
            <span className="progress-text">60% Complete</span>
          </div>

          <div className="trip-details">
            <div className="trip-route">
              <span className="route-label">Route:</span>
              <span className="route-value">{currentTrip.route}</span>
            </div>

            <div className="trip-stops">
              <div className="stop-item start">
                <span className="stop-icon">🚩</span>
                <span className="stop-name">{currentTrip.startStop}</span>
              </div>
              <div className="stop-connector">
                <span className="connector-line"></span>
                <span className="next-stop-time">{getTimeUntilNextStop()}</span>
              </div>
              <div className="stop-item next">
                <span className="stop-icon">📍</span>
                <span className="stop-name">{nextStop}</span>
                <span className="stop-badge">Next</span>
              </div>
              <div className="stop-connector">
                <span className="connector-line"></span>
              </div>
              <div className="stop-item end">
                <span className="stop-icon">🏁</span>
                <span className="stop-name">{currentTrip.endStop}</span>
              </div>
            </div>
          </div>

          <div className="trip-actions">
            <button className="action-btn primary" onClick={onStartTrip}>
              Start Trip
            </button>
            <button className="action-btn success" onClick={onCompleteTrip}>
              Complete Trip
            </button>
            <button className="action-btn danger">
              Report Issue
            </button>
          </div>
        </div>
      )}

      {/* No Trip Assigned */}
      {!currentTrip && tripStatus === 'online' && (
        <div className="no-trip">
          <div className="no-trip-icon">🕒</div>
          <h4>Waiting for Trip Assignment</h4>
          <p>You'll be notified when a new trip is assigned</p>
        </div>
      )}

      {/* Break Info */}
      {tripStatus === 'break' && (
        <div className="break-info">
          <div className="break-timer">
            <span className="timer-label">Break ends in:</span>
            <span className="timer-value">25:00</span>
          </div>
          <button 
            className="resume-btn"
            onClick={() => onStatusChange('online')}
          >
            Resume Duty
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h4>Quick Actions</h4>
        <div className="action-grid">
          <button className="quick-action-btn">
            <span className="action-icon">📋</span>
            <span className="action-label">Report Delay</span>
          </button>
          <button className="quick-action-btn">
            <span className="action-icon">🚧</span>
            <span className="action-label">Road Hazard</span>
          </button>
          <button className="quick-action-btn">
            <span className="action-icon">👥</span>
            <span className="action-label">Full Capacity</span>
          </button>
          <button className="quick-action-btn">
            <span className="action-icon">🔧</span>
            <span className="action-label">Maintenance</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripControls;
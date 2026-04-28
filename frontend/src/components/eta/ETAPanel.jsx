import React, { useState } from 'react';
import StopCard from './StopCard';
import ProgressBar from './ProgressBar';
import './ETAPanel.css';

const ETAPanel = ({ route, currentStop, stops, onStopSelect }) => {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'timeline'

  const completedStops = stops.filter(stop => stop.completed).length;
  const progress = (completedStops / stops.length) * 100;

  return (
    <div className="eta-panel">
      <div className="panel-header">
        <h3>Estimated Times</h3>
        <div className="route-info">
          <span className="route-name">{route?.name || 'Select Route'}</span>
          <span className="route-stops">{stops.length} stops</span>
        </div>
      </div>

      <div className="trip-progress">
        <ProgressBar 
          value={completedStops}
          max={stops.length}
          label="Trip Progress"
          color="primary"
          size="small"
        />
      </div>

      <div className="panel-tabs">
        <button 
          className={`tab-btn ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => setViewMode('list')}
        >
          List View
        </button>
        <button 
          className={`tab-btn ${viewMode === 'timeline' ? 'active' : ''}`}
          onClick={() => setViewMode('timeline')}
        >
          Timeline
        </button>
      </div>

      <div className="stops-container">
        {viewMode === 'list' ? (
          stops.map((stop, index) => (
            <StopCard
              key={stop.id}
              stop={stop}
              eta={stop.eta}
              isNext={index === currentStop}
              onClick={onStopSelect}
            />
          ))
        ) : (
          <div className="timeline-view">
            {/* Timeline implementation would go here */}
            {stops.map((stop, index) => (
              <div key={stop.id} className="timeline-item">
                <div className="timeline-time">
                  {stop.eta ? formatDuration(stop.eta.minutes) : '--'}
                </div>
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <span className="timeline-stop">{stop.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel-footer">
        <div className="total-time">
          <span className="label">Total Trip Time:</span>
          <span className="value">45 min</span>
        </div>
        <div className="update-info">
          Last updated: Just now
        </div>
      </div>
    </div>
  );
};

export default ETAPanel;
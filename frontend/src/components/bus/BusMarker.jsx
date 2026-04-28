import React from 'react';
import './BusMarker.css';
import { getMarkerIcon } from '../../utils/mapHelpers';

const BusMarker = ({ bus, onClick, isSelected }) => {
  const { id, number, status, location, occupancy } = bus;

  const getOccupancyColor = () => {
    if (occupancy < 30) return 'low';
    if (occupancy < 70) return 'medium';
    return 'high';
  };

  return (
    <div 
      className={`bus-marker ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(bus)}
      style={{ left: `${location.x}%`, top: `${location.y}%` }}
    >
      <div className={`marker-icon status-${status}`}>
        {getMarkerIcon('bus', status)}
      </div>
      
      <div className="marker-info">
        <div className="bus-number">{number}</div>
        <div className="bus-occupancy">
          <div className={`occupancy-bar occupancy-${getOccupancyColor()}`}>
            <div 
              className="occupancy-fill" 
              style={{ width: `${occupancy}%` }}
            />
          </div>
          <span className="occupancy-text">{occupancy}%</span>
        </div>
      </div>
    </div>
  );
};

export default BusMarker;
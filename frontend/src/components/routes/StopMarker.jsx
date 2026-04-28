import React from 'react';
import './StopMarker.css';

const StopMarker = ({ stop, type = 'default', onClick, isSelected, isHovered }) => {
  const getMarkerIcon = () => {
    switch(type) {
      case 'start':
        return '🚩';
      case 'end':
        return '🏁';
      case 'transfer':
        return '🔄';
      case 'current':
        return '📍';
      default:
        return '🚏';
    }
  };

  const getMarkerClass = () => {
    let classes = 'stop-marker';
    if (type) classes += ` marker-${type}`;
    if (isSelected) classes += ' selected';
    if (isHovered) classes += ' hovered';
    if (stop.isAccessible) classes += ' accessible';
    return classes;
  };

  const getStatusClass = () => {
    if (stop.isClosed) return 'closed';
    if (stop.hasDelay) return 'delayed';
    return '';
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(stop);
    }
  };

  return (
    <div 
      className={getMarkerClass()}
      onClick={handleClick}
      style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
    >
      <div className={`marker-icon ${getStatusClass()}`}>
        {getMarkerIcon()}
        {stop.isAccessible && <span className="accessible-badge">♿</span>}
      </div>
      
      <div className="marker-content">
        <div className="marker-header">
          <h4 className="stop-name">{stop.name}</h4>
          {stop.code && <span className="stop-code">{stop.code}</span>}
        </div>

        <div className="stop-address">{stop.address}</div>

        <div className="stop-routes">
          {stop.routes?.slice(0, 3).map((route, index) => (
            <span key={index} className="route-badge">{route}</span>
          ))}
          {stop.routes?.length > 3 && (
            <span className="route-badge more">+{stop.routes.length - 3}</span>
          )}
        </div>

        {stop.facilities && stop.facilities.length > 0 && (
          <div className="stop-facilities">
            {stop.facilities.map((facility, index) => (
              <span key={index} className="facility-icon" title={facility}>
                {facility === 'shelter' && '🏠'}
                {facility === 'bench' && '🪑'}
                {facility === 'ticketing' && '🎫'}
                {facility === 'restroom' && '🚻'}
                {facility === 'elevator' && '🛗'}
              </span>
            ))}
          </div>
        )}

        {stop.eta && (
          <div className="stop-eta">
            <span className="eta-label">Next bus:</span>
            <span className="eta-value">{stop.eta}</span>
          </div>
        )}

        {stop.occupancy && (
          <div className="stop-occupancy">
            <span className="occupancy-label">Waiting:</span>
            <span className="occupancy-value">{stop.occupancy} people</span>
          </div>
        )}

        {stop.isClosed && (
          <div className="stop-status closed">
            <span className="status-icon">⚠️</span>
            <span className="status-text">Temporarily Closed</span>
          </div>
        )}

        {stop.hasDelay && !stop.isClosed && (
          <div className="stop-status delayed">
            <span className="status-icon">⏰</span>
            <span className="status-text">Delays Expected</span>
          </div>
        )}

        <div className="marker-actions">
          <button className="action-btn view">View</button>
          <button className="action-btn directions">Directions</button>
          <button className="action-btn save">Save</button>
        </div>
      </div>
    </div>
  );
};

export default StopMarker;
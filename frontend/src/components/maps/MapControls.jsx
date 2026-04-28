import React from 'react';
import './MapControls.css';

const MapControls = ({ onFitBounds, onZoomIn, onZoomOut }) => {
  return (
    <div className="map-controls">
      <button className="control-btn" onClick={onZoomIn} title="Zoom In">
        +
      </button>
      <button className="control-btn" onClick={onZoomOut} title="Zoom Out">
        −
      </button>
      <button className="control-btn" onClick={onFitBounds} title="Fit to Bounds">
        ⌂
      </button>
      <button className="control-btn" title="Current Location">
        ◎
      </button>
    </div>
  );
};

export default MapControls;
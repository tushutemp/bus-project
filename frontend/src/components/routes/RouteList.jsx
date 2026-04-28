import React, { useState } from 'react';
import './RouteList.css';

const RouteList = ({ routes, onRouteSelect, selectedRoute, onRouteHover }) => {
  const [expandedRoute, setExpandedRoute] = useState(null);
  const [sortBy, setSortBy] = useState('number'); // 'number', 'name', 'duration'
  const [filterText, setFilterText] = useState('');

  const handleExpand = (routeId, e) => {
    e.stopPropagation();
    setExpandedRoute(expandedRoute === routeId ? null : routeId);
  };

  const handleRouteClick = (route) => {
    onRouteSelect(route);
  };

  const handleRouteHover = (route, isHovering) => {
    if (onRouteHover) {
      onRouteHover(isHovering ? route : null);
    }
  };

  const getSortedRoutes = () => {
    let filtered = routes.filter(route => 
      route.name.toLowerCase().includes(filterText.toLowerCase()) ||
      route.number.toLowerCase().includes(filterText.toLowerCase())
    );

    switch(sortBy) {
      case 'name':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'duration':
        return filtered.sort((a, b) => a.duration - b.duration);
      default:
        return filtered.sort((a, b) => a.number.localeCompare(b.number));
    }
  };

  const sortedRoutes = getSortedRoutes();

  const getRouteTypeIcon = (type) => {
    switch(type) {
      case 'express': return '⚡';
      case 'local': return '🚌';
      case 'night': return '🌙';
      default: return '🚏';
    }
  };

  return (
    <div className="route-list">
      <div className="list-header">
        <h3>Route List</h3>
        <span className="route-count">{routes.length} routes</span>
      </div>

      <div className="list-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search routes..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="search-input"
          />
          {filterText && (
            <button className="clear-search" onClick={() => setFilterText('')}>
              ×
            </button>
          )}
        </div>

        <div className="sort-controls">
          <label>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="number">Route Number</option>
            <option value="name">Name</option>
            <option value="duration">Duration</option>
          </select>
        </div>
      </div>

      <div className="routes-container">
        {sortedRoutes.map(route => (
          <div
            key={route.id}
            className={`route-list-item ${selectedRoute?.id === route.id ? 'selected' : ''}`}
            onClick={() => handleRouteClick(route)}
            onMouseEnter={() => handleRouteHover(route, true)}
            onMouseLeave={() => handleRouteHover(route, false)}
          >
            <div className="item-header">
              <div className="route-badge">
                <span className="route-type-icon">{getRouteTypeIcon(route.type)}</span>
                <span className="route-number">{route.number}</span>
              </div>
              <div className="item-actions">
                <button 
                  className="expand-btn"
                  onClick={(e) => handleExpand(route.id, e)}
                >
                  {expandedRoute === route.id ? '−' : '+'}
                </button>
              </div>
            </div>

            <div className="route-basic-info">
              <h4 className="route-name">{route.name}</h4>
              <div className="route-terminals">
                <span className="terminal">
                  <span className="terminal-icon">🚩</span>
                  {route.startPoint}
                </span>
                <span className="terminal-arrow">→</span>
                <span className="terminal">
                  <span className="terminal-icon">🏁</span>
                  {route.endPoint}
                </span>
              </div>
            </div>

            <div className="route-stats">
              <div className="stat">
                <span className="stat-label">Duration</span>
                <span className="stat-value">{route.duration} min</span>
              </div>
              <div className="stat">
                <span className="stat-label">Distance</span>
                <span className="stat-value">{route.distance} km</span>
              </div>
              <div className="stat">
                <span className="stat-label">Stops</span>
                <span className="stat-value">{route.stopCount}</span>
              </div>
            </div>

            {expandedRoute === route.id && (
              <div className="expanded-content">
                <div className="schedule-info">
                  <h5>Schedule</h5>
                  <div className="schedule-times">
                    <div className="time-item">
                      <span className="time-label">First Bus:</span>
                      <span className="time-value">{route.firstBus}</span>
                    </div>
                    <div className="time-item">
                      <span className="time-label">Last Bus:</span>
                      <span className="time-value">{route.lastBus}</span>
                    </div>
                    <div className="time-item">
                      <span className="time-label">Frequency:</span>
                      <span className="time-value">Every {route.frequency} min</span>
                    </div>
                  </div>
                </div>

                <div className="route-features">
                  <h5>Features</h5>
                  <div className="feature-tags">
                    {route.features?.map((feature, index) => (
                      <span key={index} className="feature-tag">{feature}</span>
                    ))}
                    {route.wheelchair && <span className="feature-tag">♿ Wheelchair</span>}
                    {route.bikeRack && <span className="feature-tag">🚲 Bike Rack</span>}
                    {route.wifi && <span className="feature-tag">📶 WiFi</span>}
                  </div>
                </div>

                {route.alerts && route.alerts.length > 0 && (
                  <div className="route-alerts">
                    {route.alerts.map((alert, index) => (
                      <div key={index} className={`alert-item ${alert.severity}`}>
                        <span className="alert-icon">⚠️</span>
                        <span className="alert-message">{alert.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="route-actions">
                  <button className="action-btn primary">View on Map</button>
                  <button className="action-btn secondary">Track Bus</button>
                  <button className="action-btn secondary">Schedule</button>
                </div>
              </div>
            )}

            {/* Live indicator for active routes */}
            {route.isActive && (
              <div className="live-indicator">
                <span className="live-dot"></span>
                <span className="live-text">Live</span>
              </div>
            )}
          </div>
        ))}

        {sortedRoutes.length === 0 && (
          <div className="no-results">
            <span className="no-results-icon">🔍</span>
            <p>No routes found matching your search</p>
          </div>
        )}
      </div>

      <div className="list-footer">
        <div className="footer-info">
          <span className="info-item">🕒 Updated just now</span>
          <span className="info-item">📍 Showing {sortedRoutes.length} routes</span>
        </div>
      </div>
    </div>
  );
};

export default RouteList;
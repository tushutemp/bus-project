import React, { useState, useEffect } from 'react';
import './RouteSelector.css';

const RouteSelector = ({ routes, selectedRoute, onSelectRoute, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [recentRoutes, setRecentRoutes] = useState([]);

  // Mock directions
  const directions = ['Northbound', 'Southbound', 'Eastbound', 'Westbound'];

  // Filter routes based on search and direction
  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (route.description && route.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDirection = filterDirection === 'all' || route.direction === filterDirection;
    
    return matchesSearch && matchesDirection;
  });

  const handleRouteClick = (route) => {
    onSelectRoute(route);
    // Add to recent routes
    setRecentRoutes(prev => {
      const filtered = prev.filter(r => r.id !== route.id);
      return [route, ...filtered].slice(0, 5);
    });
  };

  const getRouteStatus = (route) => {
    if (route.delayed) return 'delayed';
    if (route.cancelled) return 'cancelled';
    return 'active';
  };

  return (
    <div className="route-selector">
      <div className="selector-header">
        <h3>Select Route</h3>
        <button className="refresh-btn" onClick={onRefresh} title="Refresh routes">
          ↻
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search routes by name or number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              ×
            </button>
          )}
        </div>

        <button 
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          ⚙️ Filters
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <h4>Direction</h4>
          <div className="direction-filters">
            <button 
              className={`direction-btn ${filterDirection === 'all' ? 'active' : ''}`}
              onClick={() => setFilterDirection('all')}
            >
              All
            </button>
            {directions.map(dir => (
              <button
                key={dir}
                className={`direction-btn ${filterDirection === dir ? 'active' : ''}`}
                onClick={() => setFilterDirection(dir)}
              >
                {dir}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Routes */}
      {recentRoutes.length > 0 && !searchTerm && filterDirection === 'all' && (
        <div className="recent-routes">
          <h4>Recent Routes</h4>
          <div className="recent-list">
            {recentRoutes.map(route => (
              <button
                key={route.id}
                className={`recent-route-item ${selectedRoute?.id === route.id ? 'selected' : ''}`}
                onClick={() => handleRouteClick(route)}
              >
                <span className="route-number">{route.number}</span>
                <span className="route-name">{route.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Routes List */}
      <div className="routes-list">
        <h4>
          Available Routes
          <span className="route-count">{filteredRoutes.length}</span>
        </h4>
        
        <div className="routes-container">
          {filteredRoutes.length > 0 ? (
            filteredRoutes.map(route => (
              <div
                key={route.id}
                className={`route-item ${selectedRoute?.id === route.id ? 'selected' : ''} ${getRouteStatus(route)}`}
                onClick={() => handleRouteClick(route)}
              >
                <div className="route-header">
                  <div className="route-number-badge">
                    {route.number}
                  </div>
                  <div className="route-status">
                    {route.delayed && <span className="status-badge delayed">Delayed</span>}
                    {route.cancelled && <span className="status-badge cancelled">Cancelled</span>}
                  </div>
                </div>

                <div className="route-info">
                  <h4 className="route-name">{route.name}</h4>
                  {route.description && (
                    <p className="route-description">{route.description}</p>
                  )}
                </div>

                <div className="route-details">
                  <div className="detail-item">
                    <span className="detail-label">From:</span>
                    <span className="detail-value">{route.startPoint}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">To:</span>
                    <span className="detail-value">{route.endPoint}</span>
                  </div>
                  {route.direction && (
                    <div className="detail-item">
                      <span className="detail-label">Direction:</span>
                      <span className="detail-value">{route.direction}</span>
                    </div>
                  )}
                </div>

                <div className="route-meta">
                  <div className="meta-item">
                    <span className="meta-icon">⏱️</span>
                    <span>{route.duration} min</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">📏</span>
                    <span>{route.distance} km</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">🚏</span>
                    <span>{route.stopCount} stops</span>
                  </div>
                </div>

                {route.tags && route.tags.length > 0 && (
                  <div className="route-tags">
                    {route.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                )}

                <div className="route-schedule">
                  <div className="schedule-item">
                    <span className="schedule-label">First Bus:</span>
                    <span className="schedule-time">{route.firstBus}</span>
                  </div>
                  <div className="schedule-item">
                    <span className="schedule-label">Last Bus:</span>
                    <span className="schedule-time">{route.lastBus}</span>
                  </div>
                  <div className="schedule-item">
                    <span className="schedule-label">Frequency:</span>
                    <span className="schedule-frequency">Every {route.frequency} min</span>
                  </div>
                </div>

                {selectedRoute?.id === route.id && (
                  <div className="route-actions">
                    <button className="action-btn view-stops">
                      View Stops
                    </button>
                    <button className="action-btn track-bus">
                      Track Bus
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-routes">
              <span className="no-routes-icon">🚌</span>
              <p>No routes found matching your criteria</p>
              <button className="clear-filters" onClick={() => {
                setSearchTerm('');
                setFilterDirection('all');
              }}>
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Route Legend */}
      <div className="route-legend">
        <div className="legend-item">
          <span className="legend-dot active"></span>
          <span className="legend-label">Active</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot delayed"></span>
          <span className="legend-label">Delayed</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot cancelled"></span>
          <span className="legend-label">Cancelled</span>
        </div>
      </div>
    </div>
  );
};

export default RouteSelector;
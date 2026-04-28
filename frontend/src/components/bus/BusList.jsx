import React, { useState } from 'react';
import './BusList.css';
import { formatTime } from '../../utils/formatters';

const BusList = ({ buses, onSelectBus, selectedBus }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBuses = buses.filter(bus => {
    const matchesFilter = filter === 'all' || bus.status === filter;
    const matchesSearch = bus.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          bus.route?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusClass = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'maintenance': return 'status-maintenance';
      default: return '';
    }
  };

  const getOccupancyClass = (occupancy) => {
    if (occupancy < 30) return 'occupancy-low';
    if (occupancy < 70) return 'occupancy-medium';
    return 'occupancy-high';
  };

  return (
    <div className="bus-list">
      <div className="list-header">
        <h3>Active Buses</h3>
        <span className="bus-count">{filteredBuses.length} buses</span>
      </div>

      <div className="list-filters">
        <input
          type="text"
          placeholder="Search buses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button 
            className={`filter-btn ${filter === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilter('inactive')}
          >
            Inactive
          </button>
        </div>
      </div>

      <div className="buses-container">
        {filteredBuses.map(bus => (
          <div
            key={bus.id}
            className={`bus-item ${selectedBus?.id === bus.id ? 'selected' : ''}`}
            onClick={() => onSelectBus(bus)}
          >
            <div className="bus-item-header">
              <div className="bus-item-info">
                <span className="bus-number">{bus.number}</span>
                <span className={`bus-status ${getStatusClass(bus.status)}`}>
                  {bus.status}
                </span>
              </div>
              <span className="bus-time">Updated {formatTime(bus.lastUpdate)}</span>
            </div>

            <div className="bus-item-details">
              <div className="bus-route">
                <span className="label">Route:</span>
                <span className="value">{bus.route || 'Not assigned'}</span>
              </div>

              <div className="bus-occupancy">
                <span className="label">Occupancy:</span>
                <div className="occupancy-indicator">
                  <div className={`occupancy-bar ${getOccupancyClass(bus.occupancy)}`}>
                    <div 
                      className="occupancy-fill" 
                      style={{ width: `${bus.occupancy}%` }}
                    />
                  </div>
                  <span className="occupancy-value">{bus.occupancy}%</span>
                </div>
              </div>

              <div className="bus-location">
                <span className="label">Location:</span>
                <span className="value">{bus.location.address || 'Unknown'}</span>
              </div>
            </div>
          </div>
        ))}

        {filteredBuses.length === 0 && (
          <div className="no-results">
            <p>No buses found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusList;
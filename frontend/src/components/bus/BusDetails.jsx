import React, { useState, useEffect } from 'react';
import './BusDetails.css';
import { formatTime, formatDate, formatDuration } from '../../utils/formatters';
import ProgressBar from '../eta/ProgressBar';
import StopMarker from '../routes/StopMarker';

const API_URL = https://bus-project-i6od.onrender.com/

const BusDetails = ({ bus, onClose, onTrack, onReport, onShare }) => {
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'route', 'eta', 'driver'
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [selectedStop, setSelectedStop] = useState(null);
  const [updates, setUpdates] = useState([]);

  // Real data state
  const [driverInfo, setDriverInfo] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [busData, setBusData] = useState(bus);
  const [driverStatus, setDriverStatus] = useState(bus?.driverStatus || bus?.status || 'unknown');

  // Fetch fresh bus data, driver, and route when bus changes
  useEffect(() => {
    if (!bus?.id && !bus?._id) return;
    const busId = bus?.id || bus?._id;

    // Fetch latest bus data (includes driverStatus, startRoute, endRoute)
    fetch(`${API_URL}/buses/${busId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setBusData(data);
          setDriverStatus(data.driverStatus || data.status || 'unknown');
        }
      })
      .catch(() => {});

    // Fetch driver info
    const driverId = bus?.driverId;
    if (driverId) {
      // Use admin drivers endpoint to get driver details
      fetch(`${API_URL}/admin/drivers`)
        .then(r => r.ok ? r.json() : [])
        .then(drivers => {
          const driver = drivers.find(d => d.id === driverId || d._id === driverId);
          if (driver) setDriverInfo(driver);
        })
        .catch(() => {});
    }

    // Fetch route info
    const routeId = bus?.routeId;
    if (routeId) {
      fetch(`${API_URL}/routes/${routeId}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setRouteInfo(data); })
        .catch(() => {});
    }
  }, [bus]);

  // Listen to WebSocket for live driverStatus updates
  useEffect(() => {
    const busId = bus?.id || bus?._id;
    if (!busId) return;
    // Attach to parent's wsAdapter if available via window
    const handleStatusUpdate = (e) => {
      try {
        const msg = e.detail;
        if (!msg) return;
        if (msg?.event === 'bus:driverStatusUpdate' && msg?.data?.busId === busId) {
          setDriverStatus(msg.data.driverStatus);
          // Add to live updates
          setUpdates(prev => [{
            time: new Date().toLocaleTimeString(),
            message: msg.data.message || `Driver status: ${msg.data.driverStatus}`,
            type: msg.data.driverStatus === 'break' ? 'warning' : msg.data.driverStatus === 'offline' ? 'info' : 'success',
          }, ...prev].slice(0, 10));
        }
        if (msg?.event === 'bus:routeAssigned' && msg?.data?.busId === busId) {
          setBusData(prev => ({ ...prev, startRoute: msg.data.startRoute, endRoute: msg.data.endRoute }));
        }
        if (msg?.event === 'bus:statusChanged' && msg?.data?.busId === busId) {
          setBusData(prev => ({ ...prev, status: msg.data.status }));
        }
      } catch {}
    };
    window.addEventListener('ws:message', handleStatusUpdate);
    return () => window.removeEventListener('ws:message', handleStatusUpdate);
  }, [bus]);

  const getDriverStatusBadge = () => {
    const map = {
      'on-trip': { label: '🚌 On Trip', color: '#2563eb', bg: '#dbeafe' },
      'online':  { label: '🟢 Online',  color: '#059669', bg: '#d1fae5' },
      'break':   { label: '☕ Tea Break', color: '#d97706', bg: '#fef3c7' },
      'offline': { label: '⭕ Offline',  color: '#64748b', bg: '#f1f5f9' },
    };
    return map[driverStatus] || { label: '❓ Unknown', color: '#64748b', bg: '#f1f5f9' };
  };

  // Effective bus to render (merged real data)
  const effectiveBus = { ...bus, ...busData };


  const mockRoute = {
    id: 'route-001',
    name: 'Downtown - Uptown Express',
    startPoint: 'Central Station',
    endPoint: 'University',
    stops: [
      { id: 1, name: 'Central Station', time: '10:30 AM', status: 'passed', eta: null },
      { id: 2, name: 'Market Street', time: '10:38 AM', status: 'passed', eta: null },
      { id: 3, name: 'City Hall', time: '10:45 AM', status: 'current', eta: '2 min' },
      { id: 4, name: 'Park Avenue', time: '10:52 AM', status: 'upcoming', eta: '8 min' },
      { id: 5, name: 'Library', time: '10:58 AM', status: 'upcoming', eta: '14 min' },
      { id: 6, name: 'Hospital', time: '11:05 AM', status: 'upcoming', eta: '21 min' },
      { id: 7, name: 'University', time: '11:15 AM', status: 'upcoming', eta: '31 min' }
    ],
    totalDuration: 45,
    totalDistance: 18.5
  };

  const mockDriver = {
    name: 'John Smith',
    id: 'DRV-001',
    experience: '5 years',
    rating: 4.8,
    totalTrips: 1250,
    phone: '+1 234-567-8901',
    photo: null,
    joinDate: '2019-06-15'
  };

  const mockUpdates = [
    { time: '10:32 AM', message: 'Departed from Central Station', type: 'info' },
    { time: '10:40 AM', message: 'Arrived at Market Street', type: 'success' },
    { time: '10:45 AM', message: 'Light traffic on Main Street', type: 'warning' }
  ];

  const mockMaintenance = {
    lastService: '2024-02-15',
    nextService: '2024-03-15',
    mileage: 45230,
    condition: 'Good',
    issues: []
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'passed': return '✓';
      case 'current': return '🚌';
      case 'upcoming': return '○';
      default: return '•';
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'passed': return 'status-passed';
      case 'current': return 'status-current';
      case 'upcoming': return 'status-upcoming';
      default: return '';
    }
  };

  const getOccupancyColor = (occupancy) => {
    if (occupancy < 30) return 'low';
    if (occupancy < 70) return 'medium';
    return 'high';
  };

  const getSpeedColor = (speed) => {
    if (speed < 20) return 'slow';
    if (speed < 40) return 'normal';
    return 'fast';
  };

  const handleStopClick = (stop) => {
    setSelectedStop(stop);
  };

  const handleShare = () => {
    if (onShare) {
      onShare(bus);
    }
  };

  const handleReport = () => {
    if (onReport) {
      onReport(bus);
    }
  };

  const handleTrack = () => {
    if (onTrack) {
      onTrack(bus);
    }
  };

  return (
    <div className="bus-details">
      <div className="details-header">
        <div className="header-top">
          <button className="close-btn" onClick={onClose}>×</button>
          <h2 className="bus-title">
            {effectiveBus?.number || 'Bus Details'}
            <span className={`bus-status-badge ${effectiveBus?.status || 'unknown'}`}>
              {effectiveBus?.status || 'Unknown'}
            </span>
          </h2>
        </div>

        <div className="quick-info">
          <div className="info-item">
            <span className="info-label">Route:</span>
            <span className="info-value">{routeInfo?.name || effectiveBus?.routeName || 'Not assigned'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">From:</span>
            <span className="info-value">{effectiveBus?.startRoute || routeInfo?.stops?.[0]?.name || '—'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">To:</span>
            <span className="info-value">{effectiveBus?.endRoute || routeInfo?.stops?.[routeInfo?.stops?.length - 1]?.name || '—'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Driver:</span>
            <span className="info-value">{driverInfo?.name || effectiveBus?.driverName || 'Not assigned'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Driver Status:</span>
            <span className="info-value" style={{
              color: getDriverStatusBadge().color,
              background: getDriverStatusBadge().bg,
              padding: '2px 8px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
            }}>
              {getDriverStatusBadge().label}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Last Update:</span>
            <span className="info-value">{effectiveBus?.lastUpdate ? formatTime(effectiveBus.lastUpdate) : 'Unknown'}</span>
          </div>
        </div>

        <div className="header-actions">
          <button className="action-btn track" onClick={handleTrack}>
            <span className="btn-icon">📍</span>
            Track
          </button>
          <button className="action-btn share" onClick={handleShare}>
            <span className="btn-icon">📤</span>
            Share
          </button>
          <button className="action-btn report" onClick={handleReport}>
            <span className="btn-icon">⚠️</span>
            Report
          </button>
        </div>
      </div>

      <div className="details-tabs">
        <button 
          className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Info
        </button>
        <button 
          className={`tab-btn ${activeTab === 'route' ? 'active' : ''}`}
          onClick={() => setActiveTab('route')}
        >
          Route
        </button>
        <button 
          className={`tab-btn ${activeTab === 'eta' ? 'active' : ''}`}
          onClick={() => setActiveTab('eta')}
        >
          ETA
        </button>
        <button 
          className={`tab-btn ${activeTab === 'driver' ? 'active' : ''}`}
          onClick={() => setActiveTab('driver')}
        >
          Driver
        </button>
      </div>

      <div className="details-content">
        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="info-tab">
            <div className="info-section">
              <h3>Current Status</h3>
              <div className="status-grid">
                <div className="status-card">
                  <span className="status-icon">🚌</span>
                  <span className="status-label">Speed</span>
                  <span className={`status-value ${getSpeedColor(bus?.speed || 35)}`}>
                    {bus?.speed || 35} km/h
                  </span>
                </div>
                <div className="status-card">
                  <span className="status-icon">📊</span>
                  <span className="status-label">Occupancy</span>
                  <div className="occupancy-display">
                    <ProgressBar 
                      value={bus?.occupancy || 45}
                      max={100}
                      size="small"
                      color={getOccupancyColor(bus?.occupancy || 45)}
                    />
                    <span className="occupancy-value">{bus?.occupancy || 45}%</span>
                  </div>
                </div>
                <div className="status-card">
                  <span className="status-icon">⛽</span>
                  <span className="status-label">Fuel</span>
                  <div className="fuel-display">
                    <ProgressBar 
                      value={bus?.fuel || 78}
                      max={100}
                      size="small"
                      color="primary"
                    />
                    <span className="fuel-value">{bus?.fuel || 78}%</span>
                  </div>
                </div>
                <div className="status-card">
                  <span className="status-icon">📍</span>
                  <span className="status-label">Next Stop</span>
                  <span className="status-value">City Hall</span>
                  <span className="status-eta">in 2 min</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>Location</h3>
              <div className="location-details">
                <div className="coordinate-item">
                  <span className="coord-label">Latitude:</span>
                  <span className="coord-value">{bus?.location?.lat || '40.7128'}</span>
                </div>
                <div className="coordinate-item">
                  <span className="coord-label">Longitude:</span>
                  <span className="coord-value">{bus?.location?.lng || '-74.0060'}</span>
                </div>
                <div className="coordinate-item">
                  <span className="coord-label">Address:</span>
                  <span className="coord-value">{bus?.location?.address || 'Main Street, New York'}</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>Vehicle Information</h3>
              <div className="vehicle-details">
                <div className="detail-row">
                  <span className="detail-label">Model:</span>
                  <span className="detail-value">{bus?.model || 'Volvo 9700'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Year:</span>
                  <span className="detail-value">{bus?.year || '2022'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">License Plate:</span>
                  <span className="detail-value">{bus?.plate || 'ABC-1234'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Capacity:</span>
                  <span className="detail-value">{bus?.capacity || '50 seats'}</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>Maintenance</h3>
              <div className="maintenance-details">
                <div className="detail-row">
                  <span className="detail-label">Last Service:</span>
                  <span className="detail-value">{mockMaintenance.lastService}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Next Service:</span>
                  <span className="detail-value">{mockMaintenance.nextService}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Mileage:</span>
                  <span className="detail-value">{mockMaintenance.mileage.toLocaleString()} km</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Condition:</span>
                  <span className={`condition-badge ${mockMaintenance.condition.toLowerCase()}`}>
                    {mockMaintenance.condition}
                  </span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>Recent Updates</h3>
              <div className="updates-timeline">
                {mockUpdates.map((update, index) => (
                  <div key={index} className={`update-item ${update.type}`}>
                    <span className="update-time">{update.time}</span>
                    <span className="update-message">{update.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Route Tab */}
        {activeTab === 'route' && (
          <div className="route-tab">
            <div className="route-header">
              <h3>{mockRoute.name}</h3>
              <div className="route-meta">
                <span className="meta-item">
                  <span className="meta-icon">⏱️</span>
                  {mockRoute.totalDuration} min
                </span>
                <span className="meta-item">
                  <span className="meta-icon">📏</span>
                  {mockRoute.totalDistance} km
                </span>
                <span className="meta-item">
                  <span className="meta-icon">🚏</span>
                  {mockRoute.stops.length} stops
                </span>
              </div>
            </div>

            <div className="route-progress">
              <ProgressBar 
                value={3} // Current stop index
                max={mockRoute.stops.length}
                label="Route Progress"
                color="primary"
                size="medium"
              />
            </div>

            <div className="stops-list">
              {mockRoute.stops.map((stop, index) => (
                <div 
                  key={stop.id} 
                  className={`stop-item ${getStatusClass(stop.status)}`}
                  onClick={() => handleStopClick(stop)}
                >
                  <div className="stop-indicator">
                    <span className="stop-icon">{getStatusIcon(stop.status)}</span>
                    {index < mockRoute.stops.length - 1 && (
                      <div className="stop-connector" />
                    )}
                  </div>
                  <div className="stop-content">
                    <div className="stop-header">
                      <span className="stop-name">{stop.name}</span>
                      {stop.status === 'current' && (
                        <span className="current-badge">Current Stop</span>
                      )}
                    </div>
                    <div className="stop-details">
                      <span className="stop-time">Scheduled: {stop.time}</span>
                      {stop.eta && (
                        <span className="stop-eta">ETA: {stop.eta}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!showFullSchedule && (
              <button 
                className="view-full-btn"
                onClick={() => setShowFullSchedule(true)}
              >
                View Full Schedule
              </button>
            )}

            {showFullSchedule && (
              <div className="full-schedule">
                <h4>Complete Schedule</h4>
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th>Stop</th>
                      <th>Arrival</th>
                      <th>Departure</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockRoute.stops.map(stop => (
                      <tr key={stop.id}>
                        <td>{stop.name}</td>
                        <td>{stop.time}</td>
                        <td>{stop.time}</td>
                        <td>
                          <span className={`status-badge ${stop.status}`}>
                            {stop.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ETA Tab */}
        {activeTab === 'eta' && (
          <div className="eta-tab">
            <div className="eta-summary">
              <div className="eta-card">
                <span className="eta-label">Next Stop</span>
                <span className="eta-value">City Hall</span>
                <span className="eta-time">in 2 minutes</span>
              </div>
              <div className="eta-card">
                <span className="eta-label">Destination</span>
                <span className="eta-value">University</span>
                <span className="eta-time">in 31 minutes</span>
              </div>
            </div>

            <div className="eta-timeline">
              <h3>Upcoming Stops</h3>
              {mockRoute.stops.slice(2).map(stop => (
                <div key={stop.id} className="eta-item">
                  <div className="eta-stop-info">
                    <span className="eta-stop-name">{stop.name}</span>
                    <span className="eta-stop-time">{stop.eta}</span>
                  </div>
                  <ProgressBar 
                    value={30} // Progress to this stop
                    max={100}
                    size="small"
                    color="primary"
                  />
                </div>
              ))}
            </div>

            <div className="eta-options">
              <h3>Notifications</h3>
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Notify me 5 minutes before arrival</span>
              </label>
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Alert when bus is approaching</span>
              </label>
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Get delay notifications</span>
              </label>
            </div>
          </div>
        )}

        {/* Driver Tab */}
        {activeTab === 'driver' && (
          <div className="driver-tab">
            {!driverInfo && !effectiveBus?.driverId ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>👤</div>
                <p>No driver assigned to this bus</p>
              </div>
            ) : (
              <>
                <div className="driver-profile">
                  <div className="driver-avatar">
                    <span className="avatar-initials">
                      {(driverInfo?.name || 'D').split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="driver-info">
                    <h3>{driverInfo?.name || 'Loading...'}</h3>
                    <p className="driver-id">ID: {driverInfo?.id || driverInfo?._id || effectiveBus?.driverId || '—'}</p>
                    {/* Driver live status badge */}
                    <div style={{
                      display: 'inline-block',
                      marginTop: 4,
                      padding: '3px 10px',
                      borderRadius: 8,
                      background: getDriverStatusBadge().bg,
                      color: getDriverStatusBadge().color,
                      fontWeight: 600,
                      fontSize: 13,
                    }}>
                      {getDriverStatusBadge().label}
                    </div>
                  </div>
                </div>

                <div className="driver-stats">
                  <div className="stat-item">
                    <span className="stat-icon">🛣️</span>
                    <span className="stat-label">Start Route</span>
                    <span className="stat-value">{effectiveBus?.startRoute || '—'}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">🏁</span>
                    <span className="stat-label">End Route</span>
                    <span className="stat-value">{effectiveBus?.endRoute || '—'}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">⏱️</span>
                    <span className="stat-label">Experience</span>
                    <span className="stat-value">{driverInfo?.experience ? `${driverInfo.experience} yrs` : '—'}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">📜</span>
                    <span className="stat-label">License</span>
                    <span className="stat-value">{driverInfo?.licenseNumber || '—'}</span>
                  </div>
                </div>

                <div className="driver-contact">
                  <h4>Contact Information</h4>
                  <div className="contact-item">
                    <span className="contact-icon">📞</span>
                    <span className="contact-value">{driverInfo?.phone || 'N/A'}</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon">✉️</span>
                    <span className="contact-value">{driverInfo?.email || 'N/A'}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {selectedStop && (
        <StopMarker 
          stop={selectedStop}
          type="selected"
          onClick={() => setSelectedStop(null)}
        />
      )}
    </div>
  );
};

export default BusDetails;
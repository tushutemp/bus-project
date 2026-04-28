// src/pages/driver/DriverDashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from '../../services/wsAdapter';
import useAuthStore from '../../store/authStore';
import './DriverDashboard.css';

const WS_URL = 'ws://localhost:3001';
const API_URL = 'http://localhost:3001/api';
const SEND_INTERVAL = 3000; // send GPS every 3 seconds

const DriverDashboard = ({ onLogout }) => {
  const { user, logout } = useAuthStore();

  // Get driver info from logged-in user
  const BUS_ID = user?.busId || user?._id || 'bus-001';
  const DRIVER_NAME = user?.name || 'Driver';
  const BUS_NUMBER = user?.busNumber || 'BUS-001';

  // ── State ──────────────────────────────────────────────────────────────────
  const [connected, setConnected]         = useState(false);
  const [gpsStatus, setGpsStatus]         = useState('searching'); // searching | active | denied | unavailable
  const [location, setLocation]           = useState(null);
  const [speed, setSpeed]                 = useState(0);
  const [accuracy, setAccuracy]           = useState(null);
  const [tripStatus, setTripStatus]       = useState('offline');
  const [currentTrip, setCurrentTrip]     = useState(null);
  const [locationSharing, setLocationSharing] = useState(false);
  const [showProfile, setShowProfile]     = useState(false);
  const [showSOS, setShowSOS]             = useState(false);
  const [sosType, setSosType]             = useState('emergency');
  const [sosMessage, setSosMessage]       = useState('');
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats]                 = useState({ todayTrips: 0, totalHours: 0, distanceCovered: 0 });
  const [busInfo, setBusInfo]             = useState(null);

  // ── Refs (never stale in callbacks) ───────────────────────────────────────
  const socketRef          = useRef(null);
  const locationRef        = useRef(null); // always holds latest GPS — no stale closure
  const watchIdRef         = useRef(null);
  const intervalRef        = useRef(null);
  const locationSharingRef = useRef(false);

  // ── Notifications ─────────────────────────────────────────────────────────
  const notify = useCallback((type, msg) => {
    const id = Date.now() + Math.random();
    setNotifications(p => [...p, { id, type, msg }]);
    setTimeout(() => setNotifications(p => p.filter(n => n.id !== id)), 5000);
  }, []);

  // ── Fetch bus info from API ────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/buses/${BUS_ID}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setBusInfo(data); })
      .catch(() => {});
  }, [BUS_ID]);

  // ── Send location to server via WebSocket ─────────────────────────────────
  const sendLocation = useCallback(() => {
    const loc = locationRef.current;
    const socket = socketRef.current;
    if (!loc || !socket || !socket.connected) return;

    socket.emit('bus:updateLocation', {
      busId: BUS_ID,
      location: {
        lat: loc.lat,
        lng: loc.lng,
        accuracy: loc.accuracy || null,
        address: loc.address || 'On Route',
        timestamp: Date.now(),
      },
    });
  }, [BUS_ID]);

  // ── GPS: start watching position as soon as component mounts ──────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      notify('error', 'GPS not supported on this device');
      return;
    }

    setGpsStatus('searching');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          address: 'On Route',
        };
        locationRef.current = loc;         // update ref immediately (no stale closure)
        setLocation(loc);                  // update state for UI display
        setGpsStatus('active');
        setSpeed(position.coords.speed != null ? (position.coords.speed * 3.6).toFixed(1) : 0);
        setAccuracy(position.coords.accuracy ? Math.round(position.coords.accuracy) : null);

        // If sharing is active, push location immediately on every GPS fix
        if (locationSharingRef.current) {
          sendLocation();
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('denied');
          notify('error', '🚫 GPS permission denied. Enable location in browser settings.');
        } else {
          setGpsStatus('searching');
          notify('warning', `GPS: ${err.message}`);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [notify, sendLocation]);

  // ── WebSocket connection ───────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(WS_URL);
    socketRef.current = socket;

    socket.on('connected', () => {
      setConnected(true);
      notify('success', '🔌 Connected to server');
      // Register this driver with the server
      socket.emit('driver:join', { busId: BUS_ID, driverId: user?._id || user?.id });
    });

    socket.on('disconnect', () => {
      setConnected(false);
      notify('error', '⚠️ Server disconnected. Reconnecting...');
    });

    socket.on('connect_error', () => setConnected(false));
    socket.on('bus:locationAck', () => {}); // silent ack
    socket.on('bus:tripStarted', () => notify('success', '🚀 Trip started on server'));
    socket.on('bus:tripEnded', () => notify('info', 'Trip ended on server'));
    socket.on('admin:broadcast', (data) => notify('info', `📢 Admin: ${data?.message}`));

    return () => {
      stopLocationBroadcast();
      socket.disconnect();
    };
  }, [BUS_ID]);

  // ── Start broadcasting GPS to server (interval + on every GPS fix) ─────────
  const startLocationBroadcast = useCallback(() => {
    if (intervalRef.current) return; // already running
    locationSharingRef.current = true;
    setLocationSharing(true);
    sendLocation(); // send immediately
    intervalRef.current = setInterval(sendLocation, SEND_INTERVAL);
    notify('success', '📡 Location broadcast started');
  }, [sendLocation, notify]);

  const stopLocationBroadcast = useCallback(() => {
    locationSharingRef.current = false;
    setLocationSharing(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ── Trip controls ─────────────────────────────────────────────────────────
  const handleGoOnline = () => {
    setTripStatus('online');
    socketRef.current?.emit('driver:statusUpdate', {
      busId: BUS_ID,
      driverStatus: 'online',
      message: `${DRIVER_NAME} is online`,
    });
    // Assign a trip automatically
    setCurrentTrip({
      id: Date.now(),
      route: busInfo?.routeName || 'Campus Express',
      routeId: busInfo?.routeId || 'route-001',
      stops: ['Main Gate', 'Library Block', 'Engineering Block', 'Hostel Zone', 'Sports Ground', 'Canteen'],
      estimatedDuration: '45 minutes',
    });
    notify('success', '🟢 You are online');
  };

  const handleStartTrip = () => {
    if (!currentTrip) { notify('warning', 'No trip assigned'); return; }
    setTripStatus('on-trip');
    startLocationBroadcast();
    socketRef.current?.emit('bus:startTrip', { busId: BUS_ID, routeId: currentTrip.routeId });
    notify('success', '🚀 Trip started! Broadcasting location to passengers.');
  };

  const handleCompleteTrip = () => {
    stopLocationBroadcast();
    socketRef.current?.emit('bus:endTrip', { busId: BUS_ID });
    setStats(p => ({ ...p, todayTrips: p.todayTrips + 1, totalHours: p.totalHours + 0.75, distanceCovered: p.distanceCovered + 8 }));
    setTripStatus('online');
    setCurrentTrip(null);
    notify('success', '✅ Trip completed!');
    // Auto-assign next trip after 3s
    setTimeout(() => {
      setCurrentTrip({
        id: Date.now(),
        route: 'Campus Express',
        routeId: 'route-001',
        stops: ['Main Gate', 'Library Block', 'Engineering Block', 'Hostel Zone', 'Sports Ground', 'Canteen'],
        estimatedDuration: '45 minutes',
      });
    }, 3000);
  };

  const handleGoOffline = () => {
    stopLocationBroadcast();
    socketRef.current?.emit('bus:endTrip', { busId: BUS_ID });
    socketRef.current?.emit('driver:statusUpdate', {
      busId: BUS_ID,
      driverStatus: 'offline',
      message: `${DRIVER_NAME} has gone offline`,
    });
    setTripStatus('offline');
    setCurrentTrip(null);
    notify('info', '⭕ You are offline');
  };

  const handleTakeBreak = () => {
    stopLocationBroadcast();
    socketRef.current?.emit('driver:statusUpdate', {
      busId: BUS_ID,
      driverStatus: 'break',
      message: `${DRIVER_NAME} is on a tea break ☕`,
    });
    setTripStatus('break');
    notify('info', '☕ Taking a break');
  };

  const handleSOS = () => {
    socketRef.current?.emit('sos:send', {
      busId: BUS_ID,
      type: sosType,
      message: sosMessage || `${sosType} from ${BUS_NUMBER}`,
    });
    notify('error', '🚨 SOS Alert sent!');
    setShowSOS(false);
    setSosMessage('');
  };

  // ── GPS status badge ──────────────────────────────────────────────────────
  const gpsLabel = {
    searching: { text: '🔍 Searching GPS...', bg: '#fef9c3', color: '#854d0e' },
    active: { text: `📍 GPS Active${accuracy ? ` ±${accuracy}m` : ''}`, bg: '#d1fae5', color: '#065f46' },
    denied: { text: '🚫 GPS Denied', bg: '#fee2e2', color: '#991b1b' },
    unavailable: { text: '❌ GPS Unavailable', bg: '#fee2e2', color: '#991b1b' },
  }[gpsStatus];

  const statusColor = { offline: '#64748b', online: '#059669', 'on-trip': '#2563eb', break: '#d97706' }[tripStatus] || '#64748b';
  const statusLabel = { offline: '⭕ Offline', online: '🟢 Online', 'on-trip': '🚌 On Trip', break: '☕ Break' }[tripStatus] || '⭕ Offline';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="driver-dashboard">

      {/* Toast Notifications */}
      <div className="notifications-container">
        {notifications.map(n => (
          <div key={n.id} className={`notification notification-${n.type}`}>
            {n.type === 'success' && '✅'}{n.type === 'error' && '❌'}
            {n.type === 'warning' && '⚠️'}{n.type === 'info' && 'ℹ️'}
            <span>{n.msg}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h2><span className="header-icon">🚌</span> Driver Dashboard</h2>
          <div className="driver-info">
            <span className="driver-name">{DRIVER_NAME}</span>
            <span className="bus-number">Bus: {BUS_NUMBER}</span>
          </div>
        </div>
        <div className="header-right">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            {/* Server status */}
            <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, fontWeight: 600, background: connected ? '#d1fae5' : '#fee2e2', color: connected ? '#065f46' : '#991b1b' }}>
              {connected ? '🔌 Server Connected' : '❌ Server Offline'}
            </span>
            {/* GPS status */}
            <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, fontWeight: 600, background: gpsLabel.bg, color: gpsLabel.color }}>
              {gpsLabel.text}
            </span>
            {/* Broadcasting badge */}
            {locationSharing && (
              <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, fontWeight: 600, background: '#dbeafe', color: '#1e40af', animation: 'pulse 1.5s infinite' }}>
                📡 Broadcasting Live
              </span>
            )}

            {/* Profile dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowProfile(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e40af', color: '#fff', border: 'none', borderRadius: 20, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🧑</span>
                {DRIVER_NAME} {showProfile ? '▲' : '▼'}
              </button>
              {showProfile && (
                <div onMouseLeave={() => setShowProfile(false)}
                  style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', minWidth: 220, zIndex: 9999, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(135deg,#1e40af,#3b82f6)', padding: 16, color: '#fff' }}>
                    <div style={{ fontSize: 36, marginBottom: 6 }}>🧑</div>
                    <div style={{ fontWeight: 700 }}>{DRIVER_NAME}</div>
                    <div style={{ fontSize: 12, opacity: 0.85 }}>{user?.email}</div>
                    <div style={{ marginTop: 6, fontSize: 11, background: 'rgba(255,255,255,0.2)', display: 'inline-block', padding: '2px 8px', borderRadius: 6 }}>🚌 Driver</div>
                  </div>
                  <div style={{ padding: '8px 16px', fontSize: 13, color: '#475569', borderBottom: '1px solid #f1f5f9' }}>
                    <div>Bus ID: <strong>{BUS_ID}</strong></div>
                    <div>Bus No: <strong>{BUS_NUMBER}</strong></div>
                  </div>
                  <button onClick={() => { logout(); onLogout?.(); }}
                    style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 14, color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="trip-status">
            <span className="status-label">Status:</span>
            <span className="status-value" style={{ color: statusColor, fontWeight: 700 }}>{statusLabel}</span>
          </div>
          <button className="sos-btn" onClick={() => setShowSOS(true)}>🆘 SOS EMERGENCY</button>
        </div>
      </div>

      {/* Live Location Card — always visible at top */}
      <div style={{
        background: gpsStatus === 'active' ? 'linear-gradient(135deg,#1e40af,#3b82f6)' : '#f8fafc',
        color: gpsStatus === 'active' ? '#fff' : '#334155',
        borderRadius: 16, padding: '20px 24px', margin: '16px 0',
        display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
        boxShadow: '0 4px 20px rgba(37,99,235,0.2)',
        border: gpsStatus !== 'active' ? '2px dashed #cbd5e1' : 'none',
      }}>
        <div style={{ fontSize: 48 }}>
          {gpsStatus === 'active' ? '📍' : gpsStatus === 'denied' ? '🚫' : '🔍'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, marginBottom: 4 }}>
            {gpsStatus === 'active' ? 'LIVE GPS LOCATION' : gpsStatus === 'denied' ? 'GPS PERMISSION DENIED' : 'SEARCHING FOR GPS...'}
          </div>
          {gpsStatus === 'active' && location ? (
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>{location.lat.toFixed(6)}</div>
                <div style={{ fontSize: 11, opacity: 0.75 }}>Latitude</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>{location.lng.toFixed(6)}</div>
                <div style={{ fontSize: 11, opacity: 0.75 }}>Longitude</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{speed} km/h</div>
                <div style={{ fontSize: 11, opacity: 0.75 }}>Speed</div>
              </div>
              {accuracy && (
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>±{accuracy}m</div>
                  <div style={{ fontSize: 11, opacity: 0.75 }}>Accuracy</div>
                </div>
              )}
            </div>
          ) : gpsStatus === 'denied' ? (
            <div style={{ fontSize: 14 }}>
              Allow location access in your browser settings, then refresh.
              <br /><span style={{ fontSize: 12, color: '#dc2626' }}>Settings → Privacy → Location → Allow</span>
            </div>
          ) : (
            <div style={{ fontSize: 14, color: '#64748b' }}>Waiting for GPS signal... Make sure location is enabled.</div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          {locationSharing ? (
            <div style={{ background: '#fff', color: '#1e40af', borderRadius: 20, padding: '6px 16px', fontSize: 13, fontWeight: 700 }}>
              📡 Broadcasting to Passengers
            </div>
          ) : (
            <div style={{ fontSize: 12, opacity: 0.7 }}>Start trip to broadcast to passengers</div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        {[
          { icon: '🚌', value: stats.todayTrips, label: "Today's Trips" },
          { icon: '⏱️', value: `${stats.totalHours.toFixed(1)}h`, label: 'Hours' },
          { icon: '📏', value: `${stats.distanceCovered}km`, label: 'Distance' },
          { icon: '📡', value: locationSharing ? 'LIVE' : 'OFF', label: 'Broadcasting' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ borderLeft: `4px solid ${i === 3 && locationSharing ? '#2563eb' : '#e2e8f0'}` }}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-info">
              <span className="stat-value" style={{ color: i === 3 && locationSharing ? '#2563eb' : undefined }}>{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">

        {/* Controls */}
        <div className="controls-section">
          <div className="status-controls">
            <h3>Status Controls</h3>
            <div className="status-buttons">
              <button
                className={`status-btn ${tripStatus === 'online' ? 'active' : ''}`}
                onClick={handleGoOnline}
                disabled={tripStatus === 'on-trip'}
              >🟢 Go Online</button>
              <button
                className={`status-btn ${tripStatus === 'break' ? 'active' : ''}`}
                onClick={handleTakeBreak}
                disabled={tripStatus === 'offline' || tripStatus === 'on-trip'}
              >☕ Take Break</button>
              <button
                className={`status-btn ${tripStatus === 'offline' ? 'active' : ''}`}
                onClick={handleGoOffline}
                disabled={tripStatus === 'offline'}
              >⭕ Go Offline</button>
            </div>
          </div>

          {currentTrip && (
            <div className="current-trip">
              <h3>
                <span>📋 Current Assignment</span>
                {tripStatus === 'on-trip' && <span className="trip-badge" style={{ background: '#2563eb', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 10, marginLeft: 8 }}>IN PROGRESS</span>}
              </h3>
              <div className="trip-details">
                <div className="trip-row"><span className="trip-label">Route:</span><span className="trip-value">{currentTrip.route}</span></div>
                <div className="trip-row"><span className="trip-label">Duration:</span><span className="trip-value">{currentTrip.estimatedDuration}</span></div>
                <div className="trip-row"><span className="trip-label">Stops:</span><span className="trip-value">{currentTrip.stops.length}</span></div>
                <div className="stops-list">
                  {currentTrip.stops.map((stop, i) => (
                    <div key={i} className="stop-item">
                      <span className="stop-number">{i + 1}</span>
                      <span className="stop-name">{stop}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="trip-actions">
                {tripStatus !== 'on-trip' ? (
                  <button className="start-trip-btn" onClick={handleStartTrip}
                    disabled={gpsStatus !== 'active'}>
                    {gpsStatus !== 'active' ? '🔍 Waiting for GPS...' : '🚀 Start Trip & Broadcast'}
                  </button>
                ) : (
                  <button className="complete-trip-btn" onClick={handleCompleteTrip}>
                    ✅ Complete Trip
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Bus Info */}
          <div className="bus-info">
            <h3>🚌 Bus Information</h3>
            <div className="info-grid">
              <div className="info-item"><label>Bus Number</label><span>{BUS_NUMBER}</span></div>
              <div className="info-item"><label>Route</label><span>{busInfo?.routeName || busInfo?.routeId || 'Campus Express'}</span></div>
              <div className="info-item">
                <label>Server</label>
                <span style={{ color: connected ? '#059669' : '#dc2626' }}>{connected ? 'Connected ✅' : 'Offline ❌'}</span>
              </div>
              <div className="info-item">
                <label>GPS</label>
                <span style={{ color: gpsStatus === 'active' ? '#059669' : '#d97706' }}>
                  {gpsStatus === 'active' ? 'Active ✅' : gpsStatus === 'denied' ? 'Denied 🚫' : 'Searching... 🔍'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Location + Map Section */}
        <div className="map-section">
          <div className="map-container">
            <div className="map-header">
              <h3>📍 Live GPS</h3>
              <div className="location-status">
                <span className="live-dot" style={{ background: gpsStatus === 'active' ? '#059669' : '#f59e0b' }}></span>
                {gpsStatus === 'active' ? (locationSharing ? 'Broadcasting to Students' : 'GPS Ready — Start trip to broadcast') : 'Acquiring signal...'}
              </div>
            </div>
            <div className="map-content">
              {/* Mini map visualization */}
              <div className="simple-map" style={{ minHeight: 200, position: 'relative', background: '#f0f9ff', borderRadius: 12, overflow: 'hidden', border: '2px solid #bfdbfe' }}>
                {gpsStatus === 'active' && location ? (
                  <div style={{ padding: 20 }}>
                    <div style={{ textAlign: 'center', fontSize: 48, marginBottom: 8 }}>🚌</div>
                    <div style={{ textAlign: 'center', fontSize: 13, color: '#1e40af', fontWeight: 600 }}>
                      {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                    </div>
                    {locationSharing && (
                      <div style={{ textAlign: 'center', marginTop: 12, background: '#2563eb', color: '#fff', borderRadius: 8, padding: '6px 16px', fontSize: 13, fontWeight: 600 }}>
                        📡 Students can see your location
                      </div>
                    )}
                    <div style={{ marginTop: 12, background: '#fff', borderRadius: 8, padding: 12, fontSize: 12, color: '#475569' }}>
                      <div>🕐 Last update: {new Date().toLocaleTimeString()}</div>
                      <div>⚡ Speed: {speed} km/h</div>
                      <div>🎯 Accuracy: {accuracy ? `±${accuracy}m` : 'N/A'}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, color: '#64748b' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>{gpsStatus === 'denied' ? '🚫' : '🔍'}</div>
                    <div style={{ fontWeight: 600 }}>{gpsStatus === 'denied' ? 'GPS Blocked' : 'Searching for GPS...'}</div>
                    <div style={{ fontSize: 12, marginTop: 6, textAlign: 'center', maxWidth: 220 }}>
                      {gpsStatus === 'denied'
                        ? 'Open browser settings and allow location access for this site'
                        : 'Please wait. This may take a few seconds. Make sure location is enabled.'}
                    </div>
                  </div>
                )}
              </div>
              <p className="map-note" style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                {locationSharing
                  ? `📡 Location sent to server every ${SEND_INTERVAL / 1000}s + on every GPS fix`
                  : gpsStatus === 'active'
                    ? '✅ GPS active. Go Online → Start Trip to broadcast.'
                    : '⚠️ Enable device location, then allow permission in browser.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SOS Modal */}
      {showSOS && (
        <div className="modal-overlay" onClick={() => setShowSOS(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🚨 SOS Emergency Alert</h3>
              <button className="modal-close" onClick={() => setShowSOS(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="sos-type-selector">
                {[['emergency','🔴 Emergency'],['medical','🏥 Medical'],['accident','💥 Accident'],['breakdown','🔧 Breakdown']].map(([t, label]) => (
                  <button key={t} className={`sos-type ${sosType === t ? 'active' : ''}`} onClick={() => setSosType(t)}>{label}</button>
                ))}
              </div>
              <div className="sos-message">
                <label>Additional Details:</label>
                <textarea placeholder="Describe the situation..." value={sosMessage}
                  onChange={e => setSosMessage(e.target.value)} rows="3" />
              </div>
              <div className="sos-location" style={{ fontSize: 13, color: '#475569', background: '#f8fafc', borderRadius: 8, padding: 12 }}>
                <p><strong>📍 Location:</strong></p>
                <p>Lat: {location?.lat?.toFixed(6) || 'N/A'} | Lng: {location?.lng?.toFixed(6) || 'N/A'}</p>
                <p>Bus: {BUS_NUMBER} · Server: {connected ? '✅' : '❌'} · GPS: {gpsStatus === 'active' ? '✅' : '❌'}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowSOS(false)}>Cancel</button>
              <button className="sos-confirm-btn" onClick={handleSOS}>🚨 Send SOS Alert</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;

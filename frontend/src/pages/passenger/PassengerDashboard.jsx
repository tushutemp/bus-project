// src/pages/passenger/PassengerDashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import BusMap from '../../components/maps/BusMap';
import BusList from '../../components/bus/BusList';
import useAuthStore from '../../store/authStore';
import io from '../../services/wsAdapter';
import './PassengerDashboard.css';

const API_URL = https://bus-project-i6od.onrender.com/
const WS_URL  = 'ws://localhost:3001';
const POLL_INTERVAL = 10000; // fallback polling every 10s

const PassengerDashboard = () => {
  const { user } = useAuthStore();
  const [view, setView]               = useState('map');
  const [connected, setConnected]     = useState(false);
  const [buses, setBuses]             = useState([]);
  const [routes, setRoutes]           = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [lastUpdate, setLastUpdate]   = useState(null);
  const socketRef = useRef(null);
  const pollRef   = useRef(null);

  const firstName = user?.name?.split(' ')[0] || 'Student';

  // ── Normalize a bus object from the API / WS ──────────────────────────────
  const normalizeBus = useCallback((b) => ({
    ...b,
    id:     b.id || b._id,
    _id:    b._id || b.id,
    number: String(b.number || b.id || ''),
    status: String(b.status || 'inactive'),
    model:  String(b.model || ''),
    // location must be a plain {lat, lng} object — never a string or null render
    location: (b.location && typeof b.location === 'object' && b.location.lat && b.location.lng)
      ? { lat: Number(b.location.lat), lng: Number(b.location.lng), address: b.location.address || 'On Route', timestamp: b.location.timestamp }
      : null,
  }), []);

  // ── Fetch all buses + routes from REST API ────────────────────────────────
  const fetchBuses = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/buses`);
      const data = await res.json();
      setBuses(data.map(normalizeBus));
      setLastUpdate(new Date());
    } catch (e) {
      console.warn('[Passenger] Bus fetch failed:', e.message);
    }
  }, [normalizeBus]);

  const fetchRoutes = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/routes`);
      const data = await res.json();
      setRoutes(data);
    } catch (e) {
      console.warn('[Passenger] Routes fetch failed:', e.message);
    }
  }, []);

  // ── On mount: load data + start polling as fallback ───────────────────────
  useEffect(() => {
    fetchBuses();
    fetchRoutes();
    // Polling fallback — keeps map fresh even if WebSocket drops
    pollRef.current = setInterval(fetchBuses, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [fetchBuses, fetchRoutes]);

  // ── WebSocket: real-time location updates ─────────────────────────────────
  useEffect(() => {
    const socket = io(WS_URL);
    socketRef.current = socket;

    socket.on('connected', (data) => {
      setConnected(true);
      // Merge WS initial data with any buses we already have
      if (data?.buses?.length) {
        setBuses(data.buses.map(normalizeBus));
      }
      if (data?.routes?.length) {
        setRoutes(data.routes);
      }
    });

    // ── CORE EVENT: driver moved — update that bus marker in real time ──────
    socket.on('bus:location', ({ busId, location }) => {
      if (!busId || !location) return;
      const lat = Number(location.lat);
      const lng = Number(location.lng);
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

      const loc = { lat, lng, address: location.address || 'On Route', timestamp: location.timestamp || Date.now() };

      setBuses(prev => {
        const exists = prev.some(b => b.id === busId || b._id === busId);
        if (exists) {
          return prev.map(b =>
            (b.id === busId || b._id === busId)
              ? { ...b, location: loc, status: 'active', lastUpdate: new Date().toISOString() }
              : b
          );
        }
        // New bus just came online
        return [...prev, {
          id: busId, _id: busId,
          number: busId.toUpperCase(),
          status: 'active',
          location: loc,
          lastUpdate: new Date().toISOString(),
        }];
      });

      setLastUpdate(new Date());

      // If this is the selected bus, keep it selected with updated location
      setSelectedBus(prev => {
        if (!prev) return prev;
        if (prev.id === busId || prev._id === busId) {
          return { ...prev, location: loc };
        }
        return prev;
      });
    });

    socket.on('bus:tripStarted', ({ busId }) => {
      // Refresh this bus from API to get full info
      fetch(`${API_URL}/buses/${busId}`)
        .then(r => r.ok ? r.json() : null)
        .then(bus => {
          if (!bus) return;
          const norm = normalizeBus(bus);
          setBuses(prev => {
            const exists = prev.some(b => b.id === norm.id);
            return exists ? prev.map(b => b.id === norm.id ? norm : b) : [...prev, norm];
          });
        })
        .catch(() => {});
    });

    socket.on('bus:tripEnded', ({ busId }) => {
      setBuses(prev => prev.map(b =>
        (b.id === busId || b._id === busId) ? { ...b, status: 'inactive' } : b
      ));
    });

    socket.on('bus:driverOffline', ({ busId }) => {
      setBuses(prev => prev.map(b =>
        (b.id === busId || b._id === busId) ? { ...b, status: 'inactive' } : b
      ));
    });

    socket.on('admin:broadcast', (data) => {
      if (data?.message) {
        // Simple toast — could enhance later
        console.info('[Admin broadcast]', data.message);
      }
    });

    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    return () => socket.disconnect();
  }, [normalizeBus]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const activeBuses  = buses.filter(b => b.status === 'active');
  const busesWithLoc = buses.filter(b => b.location?.lat && b.location?.lng);
  const selectedRoute = selectedBus
    ? routes.find(r => r.id === selectedBus.routeId || r._id === selectedBus.routeId) || null
    : null;

  return (
    <DashboardLayout userRole="passenger">
      <div className="passenger-dashboard">

        {/* Header */}
        <div className="dashboard-header">
          <h2>Welcome, {firstName}! 👋</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, fontWeight: 600, background: connected ? '#d1fae5' : '#fee2e2', color: connected ? '#065f46' : '#991b1b' }}>
              {connected ? '🟢 Live' : '🔴 Connecting...'}
            </span>
            {lastUpdate && (
              <span style={{ fontSize: 12, color: '#64748b' }}>
                🕐 Updated {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <div className="view-toggle">
              <button className={`toggle-btn ${view === 'map' ? 'active' : ''}`} onClick={() => setView('map')}>🗺️ Map</button>
              <button className={`toggle-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>📋 List</button>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div style={{ display: 'flex', gap: 16, padding: '8px 0 12px', fontSize: 13, color: '#6b7280', flexWrap: 'wrap' }}>
          <span>🚌 <strong style={{ color: '#059669' }}>{activeBuses.length}</strong> bus{activeBuses.length !== 1 ? 'es' : ''} active</span>
          <span>📍 <strong style={{ color: '#2563eb' }}>{busesWithLoc.length}</strong> location{busesWithLoc.length !== 1 ? 's' : ''} tracked</span>
          <span>🗺️ <strong>{routes.length}</strong> route{routes.length !== 1 ? 's' : ''}</span>
          {!connected && <span style={{ color: '#d97706', fontWeight: 600 }}>⏳ Waiting for server...</span>}
        </div>

        {/* Selected bus info panel */}
        {selectedBus && (
          <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 12, padding: '12px 20px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 28 }}>🚌</span>
            <div>
              <div style={{ fontWeight: 700, color: '#1e40af' }}>Bus {selectedBus.number}</div>
              <div style={{ fontSize: 13, color: '#475569' }}>
                Status: <strong style={{ color: selectedBus.status === 'active' ? '#059669' : '#64748b' }}>{selectedBus.status}</strong>
                {selectedBus.location && (
                  <span style={{ marginLeft: 16 }}>
                    📍 {selectedBus.location.lat?.toFixed(5)}, {selectedBus.location.lng?.toFixed(5)}
                    {selectedBus.location.address && ` · ${selectedBus.location.address}`}
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => setSelectedBus(null)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
          </div>
        )}

        <div className="dashboard-grid">
          {/* Map / List section */}
          <div className="map-section">
            {view === 'map' ? (
              <BusMap
                buses={buses}
                selectedBus={selectedBus}
                onBusSelect={setSelectedBus}
                route={selectedRoute}
              />
            ) : (
              <BusList
                buses={buses}
                onSelectBus={setSelectedBus}
                selectedBus={selectedBus}
              />
            )}
          </div>

          {/* ETA / Route info */}
          <div className="eta-section">
            <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#1e293b' }}>
                📋 {selectedBus ? `Bus ${selectedBus.number} Info` : 'Select a Bus'}
              </h3>

              {selectedBus ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>BUS NUMBER</div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{selectedBus.number}</div>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>STATUS</div>
                    <div style={{ fontWeight: 700, color: selectedBus.status === 'active' ? '#059669' : '#64748b' }}>
                      {selectedBus.status === 'active' ? '🟢 Active - Moving' : '⭕ Inactive'}
                    </div>
                  </div>
                  {selectedBus.location ? (
                    <div style={{ background: '#eff6ff', borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>LIVE LOCATION</div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        📍 Lat: {selectedBus.location.lat?.toFixed(6)}<br />
                        📍 Lng: {selectedBus.location.lng?.toFixed(6)}<br />
                        {selectedBus.location.address && <span>📮 {selectedBus.location.address}</span>}
                        {selectedBus.location.timestamp && (
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                            Updated: {new Date(selectedBus.location.timestamp).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, color: '#94a3b8', fontSize: 13 }}>
                      📍 Location not available — bus may be offline
                    </div>
                  )}
                  {selectedBus.model && (
                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>MODEL</div>
                      <div style={{ fontWeight: 600 }}>{selectedBus.model} {selectedBus.year && `(${selectedBus.year})`}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '30px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Click any bus on the map</div>
                  <div style={{ fontSize: 13 }}>to see live location and details</div>
                  <div style={{ marginTop: 20, background: '#f1f5f9', borderRadius: 10, padding: 12, fontSize: 12, textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Currently tracking:</div>
                    {busesWithLoc.length === 0 ? (
                      <div style={{ color: '#d97706' }}>⚠️ No buses broadcasting yet.<br />Waiting for drivers to start trips.</div>
                    ) : busesWithLoc.map(b => (
                      <div key={b.id} style={{ padding: '4px 0', cursor: 'pointer', color: '#2563eb' }} onClick={() => setSelectedBus(b)}>
                        🚌 Bus {b.number} — 📍 {b.location.lat.toFixed(4)}, {b.location.lng.toFixed(4)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PassengerDashboard;

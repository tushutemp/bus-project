// src/components/maps/BusMap.jsx
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './BusMap.css';

// Default center: Ludhiana / college campus
const DEFAULT_CENTER = [30.9010, 75.8573];
const DEFAULT_ZOOM   = 14;

const BusMap = ({ buses = [], selectedBus, onBusSelect, route }) => {
  const containerRef  = useRef(null);   // DOM div
  const mapRef        = useRef(null);   // L.Map instance
  const markersRef    = useRef({});     // busId → L.Marker
  const initialFit    = useRef(false);  // did we already fit bounds once?

  // ── Create the Leaflet map exactly once ────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return; // already created

    mapRef.current = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      // Cleanup only when component truly unmounts
      Object.values(markersRef.current).forEach(m => m.remove());
      markersRef.current = {};
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      initialFit.current = false;
    };
  }, []); // run once

  // ── Update markers whenever the buses array changes ───────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const activeIds = new Set();

    buses.forEach(bus => {
      const busId = bus.id || bus._id;
      if (!busId) return;

      // Skip buses without a valid location
      const loc = bus.location;
      if (!loc || typeof loc !== 'object') return;
      const lat = Number(loc.lat);
      const lng = Number(loc.lng);
      if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

      activeIds.add(busId);
      const latlng = [lat, lng];
      const isSelected = selectedBus?.id === busId || selectedBus?._id === busId;

      const iconHtml = `
        <div style="
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        ">
          <div style="
            background: ${isSelected ? '#1e40af' : bus.status === 'active' ? '#2563eb' : '#64748b'};
            color: white;
            border-radius: 50%;
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.35);
            border: ${isSelected ? '3px solid #fff' : '2px solid rgba(255,255,255,0.7)'};
            ${isSelected ? 'animation: pulse-ring 1.5s infinite;' : ''}
          ">🚌</div>
          <div style="
            background: ${isSelected ? '#1e40af' : '#334155'};
            color: white;
            font-size: 10px;
            font-weight: 700;
            padding: 1px 6px;
            border-radius: 6px;
            margin-top: 2px;
            white-space: nowrap;
            box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          ">${bus.number || busId}</div>
        </div>
      `;

      const icon = L.divIcon({
        className: '',
        html: iconHtml,
        iconSize: [42, 56],
        iconAnchor: [21, 46],
        popupAnchor: [0, -46],
      });

      if (markersRef.current[busId]) {
        // ── Marker exists: smoothly move it and refresh icon ─────────────────
        markersRef.current[busId].setLatLng(latlng);
        markersRef.current[busId].setIcon(icon);
      } else {
        // ── New marker: create and add to map ───────────────────────────────
        const marker = L.marker(latlng, { icon }).addTo(map);
        marker.bindPopup(`
          <div style="min-width:160px;font-family:sans-serif">
            <div style="font-weight:700;font-size:15px;margin-bottom:6px">🚌 Bus ${bus.number || busId}</div>
            <div style="font-size:12px;color:#475569">
              <div>Status: <strong style="color:${bus.status === 'active' ? '#059669' : '#64748b'}">${bus.status || 'unknown'}</strong></div>
              <div>Lat: ${lat.toFixed(6)}</div>
              <div>Lng: ${lng.toFixed(6)}</div>
              ${bus.model ? `<div>Model: ${bus.model}</div>` : ''}
            </div>
          </div>
        `);
        marker.on('click', () => {
          marker.openPopup();
          onBusSelect && onBusSelect({ ...bus, id: busId });
        });
        markersRef.current[busId] = marker;
      }
    });

    // ── Remove markers for buses no longer in the list ────────────────────
    Object.keys(markersRef.current).forEach(id => {
      if (!activeIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // ── Fit bounds on first load only ─────────────────────────────────────
    if (!initialFit.current && activeIds.size > 0) {
      const pts = buses
        .filter(b => {
          const id = b.id || b._id;
          return activeIds.has(id) && b.location?.lat && b.location?.lng;
        })
        .map(b => [Number(b.location.lat), Number(b.location.lng)]);

      if (pts.length > 0) {
        try {
          map.fitBounds(L.latLngBounds(pts), { padding: [60, 60], maxZoom: 16 });
        } catch (_) {}
        initialFit.current = true;
      }
    }

    // ── Pan to selected bus smoothly ─────────────────────────────────────
    if (selectedBus) {
      const selId = selectedBus.id || selectedBus._id;
      const fresh = buses.find(b => b.id === selId || b._id === selId);
      const loc = fresh?.location || selectedBus.location;
      if (loc?.lat && loc?.lng) {
        map.panTo([Number(loc.lat), Number(loc.lng)], { animate: true, duration: 0.5 });
      }
    }
  }, [buses, selectedBus, onBusSelect]);

  // ── Draw route polyline ──────────────────────────────────────────────────
  const polylineRef = useRef(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (polylineRef.current) { polylineRef.current.remove(); polylineRef.current = null; }
    if (route?.stops?.length >= 2) {
      const pts = route.stops
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .filter(s => s.lat && s.lng)
        .map(s => [Number(s.lat), Number(s.lng)]);
      if (pts.length >= 2) {
        polylineRef.current = L.polyline(pts, { color: route.color || '#2563eb', weight: 4, opacity: 0.7 }).addTo(map);
        // Draw stop markers
        route.stops.forEach(stop => {
          if (!stop.lat || !stop.lng) return;
          L.circleMarker([Number(stop.lat), Number(stop.lng)], {
            radius: 6, fillColor: '#fff', color: route.color || '#2563eb',
            weight: 2, fillOpacity: 1,
          }).addTo(map).bindTooltip(stop.name, { permanent: false });
        });
      }
    }
  }, [route]);

  return (
    <div className="bus-map-container" style={{ position: 'relative', width: '100%', height: '100%', minHeight: 400 }}>
      <div ref={containerRef} className="bus-map" style={{ width: '100%', height: '100%', minHeight: 400, borderRadius: 12 }} />

      {/* Map overlay: no buses message */}
      {buses.filter(b => b.location?.lat).length === 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255,255,255,0.95)', borderRadius: 16,
          padding: '20px 28px', textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          pointerEvents: 'none', zIndex: 1000,
        }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
          <div style={{ fontWeight: 700, color: '#334155', marginBottom: 4 }}>Waiting for buses...</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>No drivers are broadcasting<br />their location right now.</div>
        </div>
      )}

      {/* Live badge */}
      <div style={{
        position: 'absolute', top: 12, left: 12, zIndex: 1000,
        background: '#fff', borderRadius: 20, padding: '4px 12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        fontSize: 12, fontWeight: 600, color: '#1e293b',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
        {buses.filter(b => b.location?.lat).length} bus{buses.filter(b => b.location?.lat).length !== 1 ? 'es' : ''} live
      </div>
    </div>
  );
};

export default BusMap;

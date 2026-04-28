import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const RoutePolyline = ({ map, route }) => {
  const polylineRef = useRef(null);

  useEffect(() => {
    if (!map || !route || !route.coordinates) return;

    // Remove existing polyline
    if (polylineRef.current) {
      polylineRef.current.remove();
    }

    // Create new polyline
    polylineRef.current = L.polyline(route.coordinates, {
      color: '#2563eb',
      weight: 4,
      opacity: 0.7,
      lineJoin: 'round'
    }).addTo(map);

    // Add start and end markers
    if (route.coordinates.length > 0) {
      const start = route.coordinates[0];
      const end = route.coordinates[route.coordinates.length - 1];

      L.marker(start, {
        icon: L.divIcon({
          className: 'route-marker',
          html: '<div class="route-start">🚩 Start</div>',
          iconSize: [60, 30],
          iconAnchor: [30, 15]
        })
      }).addTo(map);

      L.marker(end, {
        icon: L.divIcon({
          className: 'route-marker',
          html: '<div class="route-end">🏁 End</div>',
          iconSize: [60, 30],
          iconAnchor: [30, 15]
        })
      }).addTo(map);
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.remove();
      }
    };
  }, [map, route]);

  return null;
};

export default RoutePolyline;
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export const getMarkerIcon = (type, status) => {
  const icons = {
    bus: {
      active: '🚌',
      inactive: '⏸️',
      maintenance: '🔧'
    },
    stop: '🏢',
    user: '📍',
    sos: '🆘'
  };

  if (type === 'bus') {
    return icons.bus[status] || icons.bus.active;
  }
  return icons[type] || '📍';
};

export const calculateBearing = (startLat, startLng, endLat, endLng) => {
  const startLatRad = startLat * Math.PI / 180;
  const startLngRad = startLng * Math.PI / 180;
  const endLatRad = endLat * Math.PI / 180;
  const endLngRad = endLng * Math.PI / 180;

  const y = Math.sin(endLngRad - startLngRad) * Math.cos(endLatRad);
  const x = Math.cos(startLatRad) * Math.sin(endLatRad) -
            Math.sin(startLatRad) * Math.cos(endLatRad) * Math.cos(endLngRad - startLngRad);

  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
};
export const BUS_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance'
};

export const USER_ROLES = {
  PASSENGER: 'passenger',
  DRIVER: 'driver',
  ADMIN: 'admin'
};

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  BUS_LOCATION_UPDATE: 'bus_location_update',
  NEW_BOOKING: 'new_booking',
  SOS_ALERT: 'sos_alert'
};

export const MAP_CONFIG = {
  DEFAULT_CENTER: [40.7128, -74.0060], // New York coordinates
  DEFAULT_ZOOM: 12,
  TILE_LAYER: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
};

export const COLORS = {
  primary: '#2563eb',
  secondary: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  dark: '#1f2937',
  light: '#f3f4f6'
};

export const BREAKPOINTS = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1200px'
};
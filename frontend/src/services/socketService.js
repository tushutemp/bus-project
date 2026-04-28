import { io } from './wsAdapter';
import { SOCKET_EVENTS } from '../utils/constants';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket) return;

    this.socket = io('ws://localhost:3001', {
      transports: ['websocket'],
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.emit(SOCKET_EVENTS.CONNECT);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.emit(SOCKET_EVENTS.DISCONNECT);
    });

    // Handle bus location updates
    this.socket.on('bus:location', (data) => {
      this.emit('busLocationUpdate', data);
    });

    // Handle SOS alerts
    this.socket.on('sos:alert', (data) => {
      this.emit('sosAlert', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  // Send location update
  sendLocationUpdate(busId, location) {
    if (this.socket) {
      this.socket.emit('bus:updateLocation', { busId, location });
    }
  }

  // Send SOS alert
  sendSOSAlert(busId, location) {
    if (this.socket) {
      this.socket.emit('sos:trigger', { busId, location });
    }
  }
}

export default new SocketService();
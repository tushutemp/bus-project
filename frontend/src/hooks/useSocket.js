import { useEffect, useRef, useState, useCallback } from 'react';
import io from '../services/wsAdapter';

const SOCKET_URL = 'ws://localhost:3001';

export const useSocket = (options = {}) => {
  const {
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
    transports = ['websocket']
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const [error, setError] = useState(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  
  const socketRef = useRef(null);
  const eventHandlers = useRef(new Map());
  const reconnectTimeoutRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const connect = useCallback(() => {
    try {
      if (socketRef.current?.connected) {
        return;
      }

      socketRef.current = io(SOCKET_URL, {
        reconnection,
        reconnectionAttempts,
        reconnectionDelay,
        transports,
        autoConnect: true
      });

      // Socket event listeners
      socketRef.current.on('connect', () => {
        console.log('Socket connected:', socketRef.current.id);
        setIsConnected(true);
        setSocketId(socketRef.current.id);
        setError(null);
        setReconnectAttempt(0);
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        setSocketId(null);

        if (reason === 'io server disconnect') {
          // Server disconnected, attempt to reconnect manually
          setTimeout(() => {
            socketRef.current.connect();
          }, 1000);
        }
      });

      socketRef.current.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setError(err.message);
        setReconnectAttempt(prev => prev + 1);
      });

      socketRef.current.on('reconnect_attempt', (attempt) => {
        console.log('Reconnect attempt:', attempt);
        setReconnectAttempt(attempt);
      });

      socketRef.current.on('reconnect', () => {
        console.log('Socket reconnected');
        setError(null);
      });

      socketRef.current.on('reconnect_error', (err) => {
        console.error('Reconnect error:', err);
        setError(err.message);
      });

      socketRef.current.on('reconnect_failed', () => {
        console.error('Reconnect failed');
        setError('Failed to reconnect after multiple attempts');
      });

      // Register all event handlers
      eventHandlers.current.forEach((handlers, event) => {
        handlers.forEach(handler => {
          socketRef.current.on(event, handler);
        });
      });

    } catch (err) {
      console.error('Socket initialization error:', err);
      setError(err.message);
    }
  }, [reconnection, reconnectionAttempts, reconnectionDelay, transports]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setSocketId(null);
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => connect(), 1000);
  }, [connect, disconnect]);

  const emit = useCallback((event, data, callback) => {
    if (!socketRef.current?.connected) {
      console.warn('Socket not connected, cannot emit event:', event);
      if (callback) callback({ error: 'Socket not connected' });
      return;
    }

    socketRef.current.emit(event, data, callback);
  }, []);

  const on = useCallback((event, handler) => {
    if (!eventHandlers.current.has(event)) {
      eventHandlers.current.set(event, new Set());
    }
    
    eventHandlers.current.get(event).add(handler);

    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }

    // Return unsubscribe function
    return () => off(event, handler);
  }, []);

  const off = useCallback((event, handler) => {
    if (eventHandlers.current.has(event)) {
      if (handler) {
        eventHandlers.current.get(event).delete(handler);
        if (socketRef.current) {
          socketRef.current.off(event, handler);
        }
      } else {
        // Remove all handlers for this event
        const handlers = eventHandlers.current.get(event);
        handlers.forEach(h => {
          if (socketRef.current) {
            socketRef.current.off(event, h);
          }
        });
        eventHandlers.current.delete(event);
      }
    }
  }, []);

  const emitWithAck = useCallback((event, data, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error('Acknowledgement timeout'));
      }, timeout);

      socketRef.current.emit(event, data, (response) => {
        clearTimeout(timeoutId);
        resolve(response);
      });
    });
  }, []);

  const subscribeToBus = useCallback((busId) => {
    emit('subscribe:bus', { busId });
  }, [emit]);

  const unsubscribeFromBus = useCallback((busId) => {
    emit('unsubscribe:bus', { busId });
  }, [emit]);

  const subscribeToRoute = useCallback((routeId) => {
    emit('subscribe:route', { routeId });
  }, [emit]);

  const unsubscribeFromRoute = useCallback((routeId) => {
    emit('unsubscribe:route', { routeId });
  }, [emit]);

  const joinRoom = useCallback((room) => {
    emit('join:room', { room });
  }, [emit]);

  const leaveRoom = useCallback((room) => {
    emit('leave:room', { room });
  }, [emit]);

  return {
    socket: socketRef.current,
    isConnected,
    socketId,
    error,
    reconnectAttempt,
    connect,
    disconnect,
    reconnect,
    emit,
    on,
    off,
    emitWithAck,
    subscribeToBus,
    unsubscribeFromBus,
    subscribeToRoute,
    unsubscribeFromRoute,
    joinRoom,
    leaveRoom
  };
};

export default useSocket;
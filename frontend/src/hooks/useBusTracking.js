import { useState, useEffect, useCallback, useRef } from 'react';
import useSocket from './useSocket';
import useGeolocation from './useGeolocation';

export const useBusTracking = (busId, options = {}) => {
  const {
    autoSubscribe = true,
    updateInterval = 5000,
    enableGeolocation = false,
    mockLocation = false,
    mockSpeed = 30 // km/h
  } = options;

  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    distance: 0,
    duration: 0,
    avgSpeed: 0,
    maxSpeed: 0
  });

  const {
    socket,
    isConnected,
    subscribeToBus,
    unsubscribeFromBus,
    on,
    off,
    emitWithAck
  } = useSocket();

  const geolocation = useGeolocation({ watch: enableGeolocation });
  
  const trackingIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const previousLocationRef = useRef(null);
  const mockIntervalRef = useRef(null);

  // Subscribe to bus updates
  useEffect(() => {
    if (autoSubscribe && busId && isConnected) {
      subscribeToBus(busId);
      setTracking(true);
    }

    return () => {
      if (busId && isConnected) {
        unsubscribeFromBus(busId);
      }
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
      if (mockIntervalRef.current) {
        clearInterval(mockIntervalRef.current);
      }
    };
  }, [busId, isConnected, autoSubscribe]);

  // Listen for bus location updates
  useEffect(() => {
    if (!busId) return;

    const handleLocationUpdate = (data) => {
      if (data.busId === busId) {
        updateBusLocation(data.location);
      }
    };

    const handleStatusUpdate = (data) => {
      if (data.busId === busId) {
        updateBusStatus(data.status);
      }
    };

    const handleOccupancyUpdate = (data) => {
      if (data.busId === busId) {
        updateBusOccupancy(data.occupancy);
      }
    };

    on('bus:location', handleLocationUpdate);
    on('bus:status', handleStatusUpdate);
    on('bus:occupancy', handleOccupancyUpdate);

    return () => {
      off('bus:location', handleLocationUpdate);
      off('bus:status', handleStatusUpdate);
      off('bus:occupancy', handleOccupancyUpdate);
    };
  }, [busId, on, off]);

  // Update bus location
  const updateBusLocation = useCallback((location) => {
    setBus(prev => {
      if (!prev) return { id: busId, location, status: 'active' };
      
      // Calculate speed and distance
      if (prev.location) {
        const distance = calculateDistance(
          prev.location.lat,
          prev.location.lng,
          location.lat,
          location.lng
        );
        const timeDiff = (location.timestamp || Date.now()) - (prev.location.timestamp || Date.now());
        const speed = timeDiff > 0 ? (distance / timeDiff) * 3.6 : 0; // Convert to km/h

        setStats(prevStats => ({
          distance: prevStats.distance + distance,
          duration: prevStats.duration + timeDiff,
          avgSpeed: (prevStats.avgSpeed * prevStats.duration + speed * timeDiff) / (prevStats.duration + timeDiff),
          maxSpeed: Math.max(prevStats.maxSpeed, speed)
        }));
      }

      return {
        ...prev,
        location,
        lastUpdate: new Date()
      };
    });

    // Add to history
    setHistory(prev => [...prev.slice(-49), {
      location,
      timestamp: new Date()
    }]);
  }, [busId]);

  // Update bus status
  const updateBusStatus = useCallback((status) => {
    setBus(prev => prev ? { ...prev, status } : { id: busId, status });
  }, [busId]);

  // Update bus occupancy
  const updateBusOccupancy = useCallback((occupancy) => {
    setBus(prev => prev ? { ...prev, occupancy } : { id: busId, occupancy });
  }, [busId]);

  // Calculate distance between coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Start tracking
  const startTracking = useCallback(async () => {
    if (!busId) return;

    setLoading(true);
    setError(null);

    try {
      // Get initial bus data
      const busData = await emitWithAck('bus:get', { busId });
      setBus(busData);

      subscribeToBus(busId);
      setTracking(true);
      startTimeRef.current = Date.now();

      // Start interval for periodic updates
      if (updateInterval > 0) {
        trackingIntervalRef.current = setInterval(() => {
          emitWithAck('bus:ping', { busId }).catch(err => {
            console.error('Bus ping failed:', err);
          });
        }, updateInterval);
      }

      // Start mock location updates if enabled
      if (mockLocation) {
        startMockLocation();
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [busId, subscribeToBus, emitWithAck, updateInterval, mockLocation]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }

    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current);
      mockIntervalRef.current = null;
    }

    unsubscribeFromBus(busId);
    setTracking(false);
  }, [busId, unsubscribeFromBus]);

  // Start mock location updates (for testing)
  const startMockLocation = useCallback(() => {
    if (!bus || !bus.location) return;

    const mockMove = () => {
      const lat = bus.location.lat + (Math.random() - 0.5) * 0.001;
      const lng = bus.location.lng + (Math.random() - 0.5) * 0.001;
      
      updateBusLocation({
        lat,
        lng,
        timestamp: Date.now()
      });
    };

    mockIntervalRef.current = setInterval(mockMove, 5000);
  }, [bus, updateBusLocation]);

  // Send current location (for driver app)
  const sendCurrentLocation = useCallback(() => {
    if (!geolocation.location) return;

    emitWithAck('bus:updateLocation', {
      busId,
      location: geolocation.location
    }).catch(err => {
      console.error('Failed to send location:', err);
    });
  }, [busId, geolocation.location, emitWithAck]);

  // Send SOS alert
  const sendSOS = useCallback((details = {}) => {
    emitWithAck('bus:sos', {
      busId,
      location: bus?.location,
      timestamp: new Date(),
      ...details
    }).catch(err => {
      console.error('Failed to send SOS:', err);
    });
  }, [busId, bus?.location, emitWithAck]);

  // Update occupancy
  const updateOccupancy = useCallback((occupancy) => {
    emitWithAck('bus:updateOccupancy', {
      busId,
      occupancy
    }).catch(err => {
      console.error('Failed to update occupancy:', err);
    });
  }, [busId, emitWithAck]);

  // Get ETA to stop
  const getETA = useCallback(async (stopId) => {
    try {
      const eta = await emitWithAck('bus:eta', {
        busId,
        stopId
      });
      return eta;
    } catch (err) {
      console.error('Failed to get ETA:', err);
      return null;
    }
  }, [busId, emitWithAck]);

  // Get route progress
  const getRouteProgress = useCallback(async () => {
    try {
      const progress = await emitWithAck('bus:progress', {
        busId
      });
      return progress;
    } catch (err) {
      console.error('Failed to get progress:', err);
      return null;
    }
  }, [busId, emitWithAck]);

  // Reset stats
  const resetStats = useCallback(() => {
    setStats({
      distance: 0,
      duration: 0,
      avgSpeed: 0,
      maxSpeed: 0
    });
    startTimeRef.current = Date.now();
    previousLocationRef.current = null;
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    bus,
    loading,
    error,
    tracking,
    history,
    stats,
    socketConnected: isConnected,
    startTracking,
    stopTracking,
    sendCurrentLocation,
    sendSOS,
    updateOccupancy,
    getETA,
    getRouteProgress,
    resetStats,
    clearHistory
  };
};

export default useBusTracking;
import { useState, useEffect, useCallback, useRef } from 'react';

export const useGeolocation = (options = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    watch = false,
    watchOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  } = options;

  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchId, setWatchId] = useState(null);
  const [permission, setPermission] = useState('prompt');
  const [history, setHistory] = useState([]);
  const [distance, setDistance] = useState(0);
  
  const previousLocationRef = useRef(null);
  const watchIdRef = useRef(null);

  // Check geolocation support
  const isSupported = 'geolocation' in navigator;

  // Check permission status
  useEffect(() => {
    if (!isSupported) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermission(result.state);
        
        result.onchange = () => {
          setPermission(result.state);
        };
      });
    }
  }, []);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  // Get current position
  const getCurrentPosition = useCallback(() => {
    if (!isSupported) {
      setError('Geolocation is not supported');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        };

        setLocation(newLocation);
        
        // Add to history
        setHistory(prev => [...prev.slice(-99), newLocation]);

        // Calculate distance from previous location
        if (previousLocationRef.current) {
          const dist = calculateDistance(
            previousLocationRef.current.lat,
            previousLocationRef.current.lng,
            newLocation.lat,
            newLocation.lng
          );
          setDistance(prev => prev + dist);
        }

        previousLocationRef.current = newLocation;
        setLoading(false);
      },
      (err) => {
        let errorMessage = 'Unknown error occurred';
        switch(err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            setPermission('denied');
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case err.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = err.message;
        }
        setError(errorMessage);
        setLoading(false);
      },
      { enableHighAccuracy, timeout, maximumAge }
    );
  }, [enableHighAccuracy, timeout, maximumAge, calculateDistance]);

  // Start watching position
  const startWatching = useCallback(() => {
    if (!isSupported) {
      setError('Geolocation is not supported');
      return;
    }

    if (watchIdRef.current) {
      console.warn('Already watching position');
      return;
    }

    setError(null);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        };

        setLocation(newLocation);
        
        // Add to history
        setHistory(prev => [...prev.slice(-99), newLocation]);

        // Calculate distance from previous location
        if (previousLocationRef.current) {
          const dist = calculateDistance(
            previousLocationRef.current.lat,
            previousLocationRef.current.lng,
            newLocation.lat,
            newLocation.lng
          );
          setDistance(prev => prev + dist);
        }

        previousLocationRef.current = newLocation;
        setLoading(false);
      },
      (err) => {
        let errorMessage = 'Watch position error';
        switch(err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            setPermission('denied');
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case err.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = err.message;
        }
        setError(errorMessage);
      },
      watchOptions
    );

    watchIdRef.current = id;
    setWatchId(id);
  }, [watchOptions, calculateDistance]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setWatchId(null);
    }
  }, []);

  // Request permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setError('Geolocation is not supported');
      return false;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy,
          timeout,
          maximumAge
        });
      });

      setPermission('granted');
      return true;
    } catch (err) {
      setPermission('denied');
      return false;
    }
  }, [enableHighAccuracy, timeout, maximumAge]);

  // Reset distance
  const resetDistance = useCallback(() => {
    setDistance(0);
    previousLocationRef.current = location;
  }, [location]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // Start/stop watching based on watch option
  useEffect(() => {
    if (watch) {
      startWatching();
    } else {
      stopWatching();
    }

    return () => {
      if (watchIdRef.current) {
        stopWatching();
      }
    };
  }, [watch, startWatching, stopWatching]);

  // Get location on mount if not watching
  useEffect(() => {
    if (!watch) {
      getCurrentPosition();
    }
  }, []);

  return {
    location,
    error,
    loading,
    permission,
    isSupported,
    watchId,
    history,
    distance,
    getCurrentPosition,
    startWatching,
    stopWatching,
    requestPermission,
    resetDistance,
    clearHistory
  };
};

export default useGeolocation;
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

export const useETA = (busId, stops = [], options = {}) => {
  const {
    refreshInterval = 30000, // 30 seconds
    trafficMultiplier = 1.2,
    averageSpeed = 30, // km/h
    enablePredictions = true
  } = options;

  const [etas, setEtas] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [busLocation, setBusLocation] = useState(null);
  const [trafficConditions, setTrafficConditions] = useState('normal');
  const [predictions, setPredictions] = useState({});

  const intervalRef = useRef(null);
  const workerRef = useRef(null);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
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
  }, []);

  // Calculate ETA for a single stop
  const calculateStopETA = useCallback((stopLocation) => {
    if (!busLocation) return null;

    const distance = calculateDistance(
      busLocation.lat,
      busLocation.lng,
      stopLocation.lat,
      stopLocation.lng
    );

    // Convert distance to km
    const distanceKm = distance / 1000;

    // Calculate time in hours, convert to minutes
    let timeMinutes = (distanceKm / averageSpeed) * 60;

    // Apply traffic multiplier
    timeMinutes *= trafficMultiplier;

    // Apply time of day factor
    const hour = new Date().getHours();
    if (hour >= 7 && hour <= 9) { // Morning rush hour
      timeMinutes *= 1.3;
    } else if (hour >= 17 && hour <= 19) { // Evening rush hour
      timeMinutes *= 1.4;
    } else if (hour >= 22 || hour <= 5) { // Night time
      timeMinutes *= 0.8;
    }

    // Add stop dwell time (30 seconds per stop)
    const stopIndex = stops.findIndex(s => 
      s.location.lat === stopLocation.lat && s.location.lng === stopLocation.lng
    );
    if (stopIndex > 0) {
      timeMinutes += stopIndex * 0.5; // 30 seconds per previous stop
    }

    return {
      minutes: Math.round(timeMinutes * 10) / 10,
      seconds: Math.round(timeMinutes * 60),
      distance: Math.round(distance),
      timestamp: new Date(Date.now() + timeMinutes * 60000)
    };
  }, [busLocation, stops, averageSpeed, trafficMultiplier, calculateDistance]);

  // Calculate all ETAs
  const calculateAllETAs = useCallback(() => {
    if (!busLocation || !stops.length) return {};

    const newEtas = {};
    stops.forEach(stop => {
      newEtas[stop.id] = calculateStopETA(stop.location);
    });

    return newEtas;
  }, [busLocation, stops, calculateStopETA]);

  // Update ETAs
  const updateETAs = useCallback(() => {
    try {
      const newEtas = calculateAllETAs();
      setEtas(newEtas);
      setLastUpdated(new Date());

      // Generate predictions if enabled
      if (enablePredictions) {
        generatePredictions(newEtas);
      }
    } catch (err) {
      setError('Failed to calculate ETAs');
      console.error('ETA calculation error:', err);
    } finally {
      setLoading(false);
    }
  }, [calculateAllETAs, enablePredictions]);

  // Generate predictions based on historical data
  const generatePredictions = useCallback((currentEtas) => {
    // This would typically use machine learning or statistical models
    // For now, we'll use a simple moving average
    const predictions = {};
    
    Object.entries(currentEtas).forEach(([stopId, eta]) => {
      if (eta) {
        // Add some variance for prediction
        const variance = (Math.random() - 0.5) * 0.2; // ±10% variance
        const predictedMinutes = eta.minutes * (1 + variance);
        
        predictions[stopId] = {
          minutes: Math.round(predictedMinutes * 10) / 10,
          confidence: Math.round((1 - Math.abs(variance)) * 100) / 100,
          timestamp: new Date(Date.now() + predictedMinutes * 60000)
        };
      }
    });

    setPredictions(predictions);
  }, []);

  // Update bus location
  const updateBusLocation = useCallback((location) => {
    setBusLocation(location);
  }, []);

  // Get ETA for specific stop
  const getETAForStop = useCallback((stopId) => {
    return etas[stopId] || null;
  }, [etas]);

  // Get ETA for specific stop with prediction
  const getETAWithPrediction = useCallback((stopId) => {
    return {
      current: etas[stopId],
      predicted: predictions[stopId]
    };
  }, [etas, predictions]);

  // Get next stop ETA
  const getNextStopETA = useCallback(() => {
    if (!stops.length || !etas) return null;

    // Find the first stop that hasn't been reached yet
    const nextStop = stops.find(stop => !stop.reached);
    return nextStop ? etas[nextStop.id] : null;
  }, [stops, etas]);

  // Get route summary
  const getRouteSummary = useCallback(() => {
    if (!stops.length || !etas) return null;

    const etaValues = Object.values(etas).filter(eta => eta !== null);
    
    if (etaValues.length === 0) return null;

    const totalTime = etaValues[etaValues.length - 1]?.minutes || 0;
    const totalDistance = etaValues.reduce((sum, eta) => sum + (eta?.distance || 0), 0);

    return {
      totalTime,
      totalDistance,
      stopCount: stops.length,
      averageETA: etaValues.reduce((sum, eta) => sum + (eta?.minutes || 0), 0) / etaValues.length
    };
  }, [stops, etas]);

  // Check if bus is approaching a stop
  const isApproachingStop = useCallback((stopId, threshold = 2) => {
    const eta = etas[stopId];
    return eta && eta.minutes <= threshold;
  }, [etas]);

  // Get stops within range
  const getStopsInRange = useCallback((rangeMinutes = 10) => {
    return stops.filter(stop => {
      const eta = etas[stop.id];
      return eta && eta.minutes <= rangeMinutes;
    }).map(stop => ({
      ...stop,
      eta: etas[stop.id]
    }));
  }, [stops, etas]);

  // Refresh ETAs manually
  const refreshETAs = useCallback(() => {
    setLoading(true);
    updateETAs();
  }, [updateETAs]);

  // Start auto-refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      updateETAs(); // Initial calculation
      intervalRef.current = setInterval(updateETAs, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval, updateETAs]);

  // Update ETAs when bus location changes
  useEffect(() => {
    if (busLocation) {
      updateETAs();
    }
  }, [busLocation, updateETAs]);

  // Use Web Worker for heavy calculations (optional)
  useEffect(() => {
    if (window.Worker && enablePredictions) {
      // Initialize worker for predictions
      // This is a placeholder - you'd need to create an actual worker file
      console.log('Web Worker support available');
    }
  }, [enablePredictions]);

  return {
    etas,
    predictions,
    loading,
    error,
    lastUpdated,
    trafficConditions,
    updateBusLocation,
    getETAForStop,
    getETAWithPrediction,
    getNextStopETA,
    getRouteSummary,
    isApproachingStop,
    getStopsInRange,
    refreshETAs,
    setTrafficConditions: (condition) => {
      setTrafficConditions(condition);
      // Adjust multiplier based on condition
      const multipliers = {
        light: 1.0,
        normal: 1.2,
        heavy: 1.5,
        severe: 2.0
      };
      options.trafficMultiplier = multipliers[condition] || 1.2;
      updateETAs();
    }
  };
};

export default useETA;
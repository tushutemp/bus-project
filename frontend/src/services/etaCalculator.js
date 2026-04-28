import { calculateDistance } from '../utils/mapHelpers';

class ETACalculator {
  constructor() {
    this.averageSpeed = 30; // km/h in city
    this.trafficMultiplier = 1.2; // Traffic factor
  }

  calculateETA(busLocation, stopLocation, currentTime) {
    const distance = calculateDistance(
      busLocation.lat,
      busLocation.lng,
      stopLocation.lat,
      stopLocation.lng
    );

    // Convert distance to km
    const distanceKm = distance / 1000;

    // Calculate time in hours, then convert to minutes
    const timeHours = distanceKm / this.averageSpeed;
    let timeMinutes = timeHours * 60;

    // Apply traffic multiplier
    timeMinutes *= this.trafficMultiplier;

    // Add current time to get ETA
    const eta = new Date(currentTime.getTime() + timeMinutes * 60000);

    return {
      minutes: Math.round(timeMinutes),
      timestamp: eta,
      distance: Math.round(distance)
    };
  }

  calculateRouteETA(busLocation, stops, currentTime) {
    let cumulativeTime = 0;
    const etaList = [];
    let currentLocation = { ...busLocation };

    for (const stop of stops) {
      const eta = this.calculateETA(currentLocation, stop.location, 
        new Date(currentTime.getTime() + cumulativeTime * 60000));
      
      etaList.push({
        stopId: stop.id,
        stopName: stop.name,
        eta: eta.minutes,
        etaTimestamp: eta.timestamp,
        distance: eta.distance
      });

      cumulativeTime += eta.minutes;
      currentLocation = stop.location;
    }

    return etaList;
  }

  updateTrafficConditions(trafficLevel) {
    // trafficLevel: 1 (light) to 3 (heavy)
    const multipliers = {
      1: 1.0,
      2: 1.3,
      3: 1.8
    };
    this.trafficMultiplier = multipliers[trafficLevel] || 1.2;
  }
}

export default new ETACalculator();
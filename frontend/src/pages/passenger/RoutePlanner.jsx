import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import BusMap from '../../components/maps/BusMap';
import StopMarker from '../../components/routes/StopMarker';
import RouteList from '../../components/routes/RouteList';
import RouteSelector from '../../components/routes/RouteSelector';
import ProgressBar from '../../components/eta/ProgressBar';
import useRouteStore from '../../store/routeStore';
import useBusStore from '../../store/busStore';
import { formatTime, formatDuration } from '../../utils/formatters';
import './RoutePlanner.css';

const RoutePlanner = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { routes, selectedRoute, setSelectedRoute } = useRouteStore();
  const { buses } = useBusStore();

  const [step, setStep] = useState(1); // 1: Select start, 2: Select destination, 3: View route
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [routeOptions, setRouteOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showStepByStep, setShowStepByStep] = useState(false);
  const [favorites, setFavorites] = useState([
    { id: 1, name: 'Home', address: '123 Main St' },
    { id: 2, name: 'Work', address: '456 Office Blvd' },
    { id: 3, name: 'Gym', address: '789 Fitness Ave' }
  ]);

  // Mock route options
  useEffect(() => {
    if (startLocation && endLocation) {
      // Simulate API call to get route options
      setRouteOptions([
        {
          id: 1,
          duration: 25,
          distance: 8.5,
          transfers: 0,
          buses: ['BUS-001'],
          route: 'Downtown - Uptown',
          departureTime: '10:30 AM',
          arrivalTime: '10:55 AM',
          fare: 2.50,
          steps: [
            { type: 'walk', duration: 5, description: 'Walk to Central Station' },
            { type: 'bus', duration: 15, bus: 'BUS-001', description: 'Take bus to Market Street' },
            { type: 'walk', duration: 5, description: 'Walk to destination' }
          ]
        },
        {
          id: 2,
          duration: 35,
          distance: 9.2,
          transfers: 1,
          buses: ['BUS-003', 'BUS-005'],
          route: 'Airport Express → City Circle',
          departureTime: '10:35 AM',
          arrivalTime: '11:10 AM',
          fare: 3.75,
          steps: [
            { type: 'walk', duration: 3, description: 'Walk to Airport Station' },
            { type: 'bus', duration: 12, bus: 'BUS-003', description: 'Take bus to City Center' },
            { type: 'walk', duration: 2, description: 'Walk to transfer point' },
            { type: 'bus', duration: 15, bus: 'BUS-005', description: 'Take bus to destination' },
            { type: 'walk', duration: 3, description: 'Walk to destination' }
          ]
        },
        {
          id: 3,
          duration: 45,
          distance: 10.1,
          transfers: 2,
          buses: ['BUS-002', 'BUS-004', 'BUS-006'],
          route: 'Suburban Link → City Circle → Downtown',
          departureTime: '10:45 AM',
          arrivalTime: '11:30 AM',
          fare: 4.50,
          steps: [
            { type: 'walk', duration: 5, description: 'Walk to Suburban Station' },
            { type: 'bus', duration: 10, bus: 'BUS-002', description: 'Take bus to City Mall' },
            { type: 'walk', duration: 3, description: 'Walk to transfer point' },
            { type: 'bus', duration: 12, bus: 'BUS-004', description: 'Take bus to Downtown' },
            { type: 'walk', duration: 15, description: 'Long walk to destination' }
          ]
        }
      ]);
    }
  }, [startLocation, endLocation]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    // Mock search results
    if (term.length > 2) {
      setSearchResults([
        { id: 1, name: 'Central Station', type: 'station', address: '100 Main St' },
        { id: 2, name: 'Market Street', type: 'stop', address: '200 Market St' },
        { id: 3, name: 'City Hall', type: 'landmark', address: '300 Government Dr' },
        { id: 4, name: 'University', type: 'stop', address: '400 College Ave' },
        { id: 5, name: 'Airport', type: 'station', address: '500 Airport Rd' }
      ].filter(item => 
        item.name.toLowerCase().includes(term.toLowerCase()) ||
        item.address.toLowerCase().includes(term.toLowerCase())
      ));
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectLocation = (location, type) => {
    if (type === 'start') {
      setStartLocation(location);
      setStep(2);
    } else {
      setEndLocation(location);
      setStep(3);
    }
    setShowSearch(false);
    setSearchTerm('');
  };

  const handleSelectFavorite = (favorite, type) => {
    const location = {
      id: favorite.id,
      name: favorite.name,
      address: favorite.address,
      type: 'favorite'
    };
    handleSelectLocation(location, type);
  };

  const handleUseCurrentLocation = (type) => {
    // Simulate getting current location
    const location = {
      id: 'current',
      name: 'Current Location',
      address: 'Your current location',
      type: 'current'
    };
    handleSelectLocation(location, type);
  };

  const handleReset = () => {
    setStep(1);
    setStartLocation(null);
    setEndLocation(null);
    setRouteOptions([]);
    setSelectedOption(null);
    setShowStepByStep(false);
  };

  const handleSwapLocations = () => {
    const temp = startLocation;
    setStartLocation(endLocation);
    setEndLocation(temp);
  };

  const handleSelectRoute = (option) => {
    setSelectedOption(option);
  };

  const handleSaveRoute = () => {
    // Save to bookmarks
    navigate('/passenger/bookmarks', { 
      state: { 
        savedRoute: selectedOption,
        message: 'Route saved to bookmarks!' 
      } 
    });
  };

  const handleStartNavigation = () => {
    setShowStepByStep(true);
  };

  const getStepIcon = (type) => {
    switch(type) {
      case 'walk': return '🚶';
      case 'bus': return '🚌';
      default: return '📍';
    }
  };

  return (
    <DashboardLayout userRole="passenger" userName={user?.name} onLogout={onLogout}>
      <div className="route-planner">
        <div className="planner-header">
          <button className="back-btn" onClick={() => navigate('/passenger')}>
            ← Back to Dashboard
          </button>
          <h2>Plan Your Route</h2>
          <div className="header-actions">
            <button className="icon-btn" onClick={handleReset} title="Start over">
              🔄
            </button>
            <button className="icon-btn" onClick={() => navigate('/passenger/bookmarks')} title="View bookmarks">
              ⭐
            </button>
          </div>
        </div>

        <div className="planner-content">
          {/* Progress Steps */}
          <div className="planning-steps">
            <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Start Point</div>
            </div>
            <div className={`step-connector ${step > 1 ? 'active' : ''}`}></div>
            <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Destination</div>
            </div>
            <div className={`step-connector ${step > 2 ? 'active' : ''}`}></div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Choose Route</div>
            </div>
          </div>

          {/* Location Selection */}
          {(step === 1 || step === 2) && (
            <div className="location-selection">
              <div className="location-header">
                <h3>{step === 1 ? 'Select Starting Point' : 'Select Destination'}</h3>
                {step === 2 && startLocation && (
                  <button className="swap-btn" onClick={handleSwapLocations}>
                    🔄 Swap
                  </button>
                )}
              </div>

              {/* Selected locations display */}
              <div className="selected-locations">
                {startLocation && (
                  <div className="selected-location start">
                    <span className="location-icon">🚩</span>
                    <div className="location-info">
                      <span className="location-name">{startLocation.name}</span>
                      <span className="location-address">{startLocation.address}</span>
                    </div>
                  </div>
                )}
                {endLocation && (
                  <div className="selected-location end">
                    <span className="location-icon">🏁</span>
                    <div className="location-info">
                      <span className="location-name">{endLocation.name}</span>
                      <span className="location-address">{endLocation.address}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Search box */}
              <div className="search-box">
                <input
                  type="text"
                  placeholder={step === 1 ? "Search for starting point..." : "Search for destination..."}
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setShowSearch(true)}
                  className="search-input"
                />
                <button className="current-location-btn" onClick={() => handleUseCurrentLocation(step === 1 ? 'start' : 'end')}>
                  📍 Use current location
                </button>
              </div>

              {/* Search results */}
              {showSearch && (
                <div className="search-results">
                  <div className="results-header">
                    <h4>Search Results</h4>
                    <button className="close-results" onClick={() => setShowSearch(false)}>×</button>
                  </div>
                  {searchResults.length > 0 ? (
                    <div className="results-list">
                      {searchResults.map(result => (
                        <div 
                          key={result.id}
                          className="result-item"
                          onClick={() => handleSelectLocation(result, step === 1 ? 'start' : 'end')}
                        >
                          <span className="result-icon">
                            {result.type === 'station' && '🏢'}
                            {result.type === 'stop' && '🚏'}
                            {result.type === 'landmark' && '🏛️'}
                          </span>
                          <div className="result-info">
                            <span className="result-name">{result.name}</span>
                            <span className="result-address">{result.address}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-results">
                      {searchTerm ? 'No results found' : 'Type to search for locations'}
                    </div>
                  )}

                  {/* Favorites section */}
                  {step === 1 && (
                    <div className="favorites-section">
                      <h4>Your Favorites</h4>
                      <div className="favorites-list">
                        {favorites.map(fav => (
                          <div 
                            key={fav.id}
                            className="favorite-item"
                            onClick={() => handleSelectFavorite(fav, step === 1 ? 'start' : 'end')}
                          >
                            <span className="favorite-icon">⭐</span>
                            <span className="favorite-name">{fav.name}</span>
                            <span className="favorite-address">{fav.address}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recent locations */}
              {!showSearch && (
                <div className="recent-locations">
                  <h4>Recent Locations</h4>
                  <div className="recent-list">
                    <div className="recent-item">
                      <span className="recent-icon">🕒</span>
                      <span className="recent-name">Central Station</span>
                    </div>
                    <div className="recent-item">
                      <span className="recent-icon">🕒</span>
                      <span className="recent-name">Airport</span>
                    </div>
                    <div className="recent-item">
                      <span className="recent-icon">🕒</span>
                      <span className="recent-name">University</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Route Selection */}
          {step === 3 && (
            <div className="route-selection">
              <div className="route-summary">
                <div className="summary-points">
                  <div className="summary-point start">
                    <span className="point-icon">🚩</span>
                    <span className="point-name">{startLocation?.name}</span>
                  </div>
                  <div className="summary-arrow">→</div>
                  <div className="summary-point end">
                    <span className="point-icon">🏁</span>
                    <span className="point-name">{endLocation?.name}</span>
                  </div>
                </div>
                <button className="edit-btn" onClick={() => setStep(2)}>
                  Edit Destination
                </button>
              </div>

              {/* Route options */}
              <div className="route-options">
                <h3>Available Routes</h3>
                <div className="options-list">
                  {routeOptions.map(option => (
                    <div 
                      key={option.id}
                      className={`route-option ${selectedOption?.id === option.id ? 'selected' : ''}`}
                      onClick={() => handleSelectRoute(option)}
                    >
                      <div className="option-header">
                        <div className="option-badge">
                          {option.transfers === 0 ? 'Direct' : `${option.transfers} Transfer`}
                        </div>
                        <div className="option-fare">${option.fare}</div>
                      </div>

                      <div className="option-timing">
                        <div className="timing-item">
                          <span className="timing-label">Depart</span>
                          <span className="timing-value">{option.departureTime}</span>
                        </div>
                        <div className="timing-arrow">→</div>
                        <div className="timing-item">
                          <span className="timing-label">Arrive</span>
                          <span className="timing-value">{option.arrivalTime}</span>
                        </div>
                        <div className="timing-duration">
                          {formatDuration(option.duration)}
                        </div>
                      </div>

                      <div className="option-details">
                        <div className="detail-item">
                          <span className="detail-icon">📏</span>
                          <span>{option.distance} km</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-icon">🚌</span>
                          <span>{option.buses.join(' → ')}</span>
                        </div>
                      </div>

                      <div className="option-buses">
                        {option.buses.map((bus, index) => (
                          <span key={index} className="bus-tag">{bus}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected route details */}
              {selectedOption && !showStepByStep && (
                <div className="selected-route-details">
                  <h3>Route Details</h3>
                  <div className="route-steps">
                    {selectedOption.steps.map((step, index) => (
                      <div key={index} className="route-step">
                        <div className="step-icon">{getStepIcon(step.type)}</div>
                        <div className="step-content">
                          <div className="step-description">{step.description}</div>
                          <div className="step-duration">{step.duration} min</div>
                          {step.bus && <div className="step-bus">{step.bus}</div>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="route-actions">
                    <button className="action-btn primary" onClick={handleStartNavigation}>
                      Start Navigation
                    </button>
                    <button className="action-btn secondary" onClick={handleSaveRoute}>
                      Save Route
                    </button>
                    <button className="action-btn secondary">
                      Share Route
                    </button>
                  </div>
                </div>
              )}

              {/* Step by step navigation */}
              {showStepByStep && selectedOption && (
                <div className="step-navigation">
                  <div className="navigation-header">
                    <h3>Step by Step Navigation</h3>
                    <button className="close-nav" onClick={() => setShowStepByStep(false)}>
                      ×
                    </button>
                  </div>

                  <ProgressBar 
                    value={0}
                    max={selectedOption.duration}
                    label="Trip Progress"
                    color="primary"
                    size="medium"
                  />

                  <div className="current-step">
                    <div className="step-indicator">
                      <span className="step-number">1</span>
                      <span className="step-total">of {selectedOption.steps.length}</span>
                    </div>
                    <div className="step-instruction">
                      {selectedOption.steps[0].description}
                    </div>
                    <div className="step-time">
                      {selectedOption.steps[0].duration} minutes
                    </div>
                  </div>

                  <div className="upcoming-steps">
                    <h4>Next Steps</h4>
                    {selectedOption.steps.slice(1, 4).map((step, index) => (
                      <div key={index} className="upcoming-step">
                        <span className="step-icon-small">{getStepIcon(step.type)}</span>
                        <span className="step-desc-small">{step.description}</span>
                        <span className="step-time-small">{step.duration} min</span>
                      </div>
                    ))}
                  </div>

                  <div className="navigation-actions">
                    <button className="nav-btn prev" disabled>Previous</button>
                    <button className="nav-btn next">Next Step</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Map preview */}
          <div className="planner-map">
            <BusMap 
              buses={buses}
              route={selectedOption?.route}
              center={[40.7128, -74.0060]}
              zoom={13}
            />
            {startLocation && (
              <StopMarker 
                stop={startLocation}
                type="start"
                onClick={() => console.log('start clicked')}
              />
            )}
            {endLocation && (
              <StopMarker 
                stop={endLocation}
                type="end"
                onClick={() => console.log('end clicked')}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RoutePlanner;
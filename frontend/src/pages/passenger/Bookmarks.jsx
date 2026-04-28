import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import './Bookmarks.css';

const Bookmarks = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('routes'); // 'routes', 'stops', 'places'
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState(null);
  const [folders, setFolders] = useState([
    { id: 1, name: 'Daily Commute', count: 3 },
    { id: 2, name: 'Weekend Trips', count: 5 },
    { id: 3, name: 'Airport Routes', count: 2 }
  ]);

  // Check for notification from route planner
  useEffect(() => {
    if (location.state?.message) {
      setNotification({
        type: 'success',
        message: location.state.message
      });
      
      // Clear the notification after 3 seconds
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      
      // Clear the location state
      window.history.replaceState({}, document.title);
      
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Mock bookmarks data
  const [bookmarks, setBookmarks] = useState({
    routes: [
      {
        id: 1,
        name: 'Home to Work',
        from: 'Central Station',
        to: 'Business District',
        duration: 25,
        distance: 8.5,
        fare: 2.50,
        favorite: true,
        lastUsed: '2024-02-20',
        frequency: 15,
        folder: 'Daily Commute',
        buses: ['BUS-001'],
        notes: 'Quickest route in morning'
      },
      {
        id: 2,
        name: 'Weekend Shopping',
        from: 'Park Avenue',
        to: 'City Mall',
        duration: 35,
        distance: 12.3,
        fare: 3.75,
        favorite: true,
        lastUsed: '2024-02-18',
        frequency: 8,
        folder: 'Weekend Trips',
        buses: ['BUS-003', 'BUS-005'],
        notes: 'Best for Saturday morning'
      },
      {
        id: 3,
        name: 'Airport Express',
        from: 'Downtown',
        to: 'International Airport',
        duration: 45,
        distance: 28.5,
        fare: 8.50,
        favorite: false,
        lastUsed: '2024-02-15',
        frequency: 3,
        folder: 'Airport Routes',
        buses: ['BUS-002'],
        notes: 'Direct route to airport'
      },
      {
        id: 4,
        name: 'Gym Route',
        from: 'Home',
        to: 'Fitness Center',
        duration: 15,
        distance: 4.2,
        fare: 2.00,
        favorite: true,
        lastUsed: '2024-02-19',
        frequency: 12,
        folder: 'Daily Commute',
        buses: ['BUS-004'],
        notes: 'Evenings after work'
      },
      {
        id: 5,
        name: 'University Shuttle',
        from: 'Student Housing',
        to: 'University Campus',
        duration: 20,
        distance: 6.8,
        fare: 1.50,
        favorite: false,
        lastUsed: '2024-02-17',
        frequency: 10,
        folder: 'Weekend Trips',
        buses: ['BUS-006', 'BUS-007'],
        notes: 'Free for students'
      }
    ],
    stops: [
      {
        id: 101,
        name: 'Central Station',
        address: '100 Main St',
        routes: ['1', '2', '5', '10'],
        facilities: ['ticketing', 'waiting room', 'cafe'],
        favorite: true,
        lastVisited: '2024-02-20',
        notes: 'Main transfer point'
      },
      {
        id: 102,
        name: 'Market Street Stop',
        address: '200 Market St',
        routes: ['2', '3', '7'],
        facilities: ['shelter', 'bench'],
        favorite: true,
        lastVisited: '2024-02-19',
        notes: 'Near my office'
      },
      {
        id: 103,
        name: 'City Hall Station',
        address: '300 Government Dr',
        routes: ['1', '4', '8', '9'],
        facilities: ['ticketing', 'elevator', 'restroom'],
        favorite: false,
        lastVisited: '2024-02-15',
        notes: 'Government area'
      }
    ],
    places: [
      {
        id: 201,
        name: 'Home',
        address: '123 Residential Ave',
        type: 'residential',
        favorite: true,
        saved: '2024-01-15',
        notes: 'My apartment'
      },
      {
        id: 202,
        name: 'Work',
        address: '456 Office Blvd',
        type: 'commercial',
        favorite: true,
        saved: '2024-01-15',
        notes: 'Downtown office'
      },
      {
        id: 203,
        name: 'Favorite Cafe',
        address: '789 Coffee Lane',
        type: 'cafe',
        favorite: false,
        saved: '2024-02-01',
        notes: 'Great coffee'
      }
    ]
  });

  const filteredBookmarks = bookmarks[activeTab].filter(item => {
    if (activeTab === 'routes') {
      return item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             item.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
             item.to.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      return item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             item.address.toLowerCase().includes(searchTerm.toLowerCase());
    }
  });

  const handleToggleFavorite = (id, type) => {
    setBookmarks(prev => ({
      ...prev,
      [type]: prev[type].map(item =>
        item.id === id ? { ...item, favorite: !item.favorite } : item
      )
    }));
  };

  const handleDeleteBookmark = (id, type) => {
    if (window.confirm('Are you sure you want to delete this bookmark?')) {
      setBookmarks(prev => ({
        ...prev,
        [type]: prev[type].filter(item => item.id !== id)
      }));
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
      setNotification({
        type: 'success',
        message: 'Bookmark deleted successfully'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredBookmarks.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredBookmarks.map(item => item.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return;
    
    if (window.confirm(`Delete ${selectedItems.length} selected bookmarks?`)) {
      setBookmarks(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].filter(item => !selectedItems.includes(item.id))
      }));
      setSelectedItems([]);
      setNotification({
        type: 'success',
        message: `${selectedItems.length} bookmarks deleted`
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleAddToFolder = (folderId) => {
    // Add selected items to folder
    setNotification({
      type: 'success',
      message: `Added to folder`
    });
    setTimeout(() => setNotification(null), 3000);
    setSelectedItems([]);
    setEditMode(false);
  };

  const handleShareBookmark = (bookmark) => {
    setSelectedBookmark(bookmark);
    setShowShareModal(true);
  };

  const handleUseRoute = (route) => {
    navigate('/passenger/planner', {
      state: {
        from: route.from,
        to: route.to,
        route: route
      }
    });
  };

  const handleViewStop = (stop) => {
    // Navigate to stop details or show on map
    console.log('View stop:', stop);
  };

  const getFrequencyBadge = (frequency) => {
    if (frequency > 10) return 'frequent';
    if (frequency > 5) return 'regular';
    return 'occasional';
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'residential': return '🏠';
      case 'commercial': return '🏢';
      case 'cafe': return '☕';
      default: return '📍';
    }
  };

  const getFacilityIcon = (facility) => {
    switch(facility) {
      case 'ticketing': return '🎫';
      case 'waiting room': return '🪑';
      case 'cafe': return '☕';
      case 'shelter': return '🏠';
      case 'bench': return '🪑';
      case 'elevator': return '🛗';
      case 'restroom': return '🚻';
      default: return '📍';
    }
  };

  return (
    <DashboardLayout userRole="passenger" userName={user?.name} onLogout={onLogout}>
      <div className="bookmarks-page">
        {/* Notification Toast */}
        {notification && (
          <div className={`notification-toast ${notification.type}`}>
            <span className="notification-icon">
              {notification.type === 'success' ? '✓' : 'ℹ️'}
            </span>
            <span className="notification-message">{notification.message}</span>
            <button className="close-notification" onClick={() => setNotification(null)}>×</button>
          </div>
        )}

        {/* Header */}
        <div className="bookmarks-header">
          <div className="header-left">
            <button className="back-btn" onClick={() => navigate('/passenger')}>
              ← Back to Dashboard
            </button>
            <h2>Your Bookmarks</h2>
          </div>
          <div className="header-actions">
            {!editMode ? (
              <>
                <button className="action-btn" onClick={() => setEditMode(true)}>
                  ✏️ Edit
                </button>
                <button className="action-btn" onClick={() => setShowAddFolder(true)}>
                  📁 New Folder
                </button>
              </>
            ) : (
              <>
                <button className="action-btn" onClick={handleSelectAll}>
                  {selectedItems.length === filteredBookmarks.length ? 'Deselect All' : 'Select All'}
                </button>
                <button 
                  className="action-btn delete" 
                  onClick={handleBulkDelete}
                  disabled={selectedItems.length === 0}
                >
                  🗑️ Delete ({selectedItems.length})
                </button>
                <button className="action-btn" onClick={() => setEditMode(false)}>
                  ✓ Done
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bookmarks-tabs">
          <button 
            className={`tab-btn ${activeTab === 'routes' ? 'active' : ''}`}
            onClick={() => setActiveTab('routes')}
          >
            <span className="tab-icon">🚌</span>
            <span className="tab-label">Routes</span>
            <span className="tab-count">{bookmarks.routes.length}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'stops' ? 'active' : ''}`}
            onClick={() => setActiveTab('stops')}
          >
            <span className="tab-icon">🚏</span>
            <span className="tab-label">Stops</span>
            <span className="tab-count">{bookmarks.stops.length}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'places' ? 'active' : ''}`}
            onClick={() => setActiveTab('places')}
          >
            <span className="tab-icon">📍</span>
            <span className="tab-label">Places</span>
            <span className="tab-count">{bookmarks.places.length}</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bookmarks-filters">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>
                ×
              </button>
            )}
          </div>

          {/* Folder filter for routes */}
          {activeTab === 'routes' && (
            <div className="folder-filters">
              <select className="filter-select">
                <option value="all">All Folders</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.name}>{folder.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Bookmarks Grid */}
        {filteredBookmarks.length > 0 ? (
          <div className="bookmarks-grid">
            {filteredBookmarks.map(item => (
              <div 
                key={item.id} 
                className={`bookmark-card ${selectedItems.includes(item.id) ? 'selected' : ''}`}
              >
                {editMode && (
                  <div className="card-selector">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                    />
                  </div>
                )}

                <div className="card-header">
                  <div className="card-type">
                    {activeTab === 'routes' && '🚌 Route'}
                    {activeTab === 'stops' && '🚏 Stop'}
                    {activeTab === 'places' && getTypeIcon(item.type)}
                  </div>
                  <button 
                    className={`favorite-btn ${item.favorite ? 'active' : ''}`}
                    onClick={() => handleToggleFavorite(item.id, activeTab)}
                  >
                    {item.favorite ? '⭐' : '☆'}
                  </button>
                </div>

                <div className="card-body">
                  <h3 className="card-title">{item.name}</h3>
                  
                  {activeTab === 'routes' && (
                    <>
                      <div className="route-points">
                        <div className="route-point">
                          <span className="point-icon">🚩</span>
                          <span className="point-name">{item.from}</span>
                        </div>
                        <div className="route-arrow">→</div>
                        <div className="route-point">
                          <span className="point-icon">🏁</span>
                          <span className="point-name">{item.to}</span>
                        </div>
                      </div>

                      <div className="route-meta">
                        <span className="meta-item">
                          <span className="meta-icon">⏱️</span>
                          {item.duration} min
                        </span>
                        <span className="meta-item">
                          <span className="meta-icon">📏</span>
                          {item.distance} km
                        </span>
                        <span className="meta-item">
                          <span className="meta-icon">💰</span>
                          ${item.fare}
                        </span>
                      </div>

                      <div className="route-buses">
                        {item.buses.map((bus, index) => (
                          <span key={index} className="bus-tag">{bus}</span>
                        ))}
                      </div>

                      {item.folder && (
                        <div className="route-folder">
                          <span className="folder-icon">📁</span>
                          {item.folder}
                        </div>
                      )}

                      <div className="route-stats">
                        <span className={`frequency-badge ${getFrequencyBadge(item.frequency)}`}>
                          Used {item.frequency} times
                        </span>
                        <span className="last-used">Last: {item.lastUsed}</span>
                      </div>

                      {item.notes && (
                        <div className="item-notes">
                          <span className="notes-icon">📝</span>
                          {item.notes}
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'stops' && (
                    <>
                      <div className="stop-address">{item.address}</div>
                      
                      <div className="stop-routes">
                        <span className="routes-label">Routes:</span>
                        {item.routes.map((route, index) => (
                          <span key={index} className="route-tag">{route}</span>
                        ))}
                      </div>

                      <div className="stop-facilities">
                        {item.facilities.map((facility, index) => (
                          <span key={index} className="facility-tag">
                            {getFacilityIcon(facility)} {facility}
                          </span>
                        ))}
                      </div>

                      <div className="stop-meta">
                        <span className="last-visited">
                          Last visited: {item.lastVisited}
                        </span>
                      </div>

                      {item.notes && (
                        <div className="item-notes">
                          <span className="notes-icon">📝</span>
                          {item.notes}
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'places' && (
                    <>
                      <div className="place-address">{item.address}</div>
                      
                      <div className="place-type">
                        <span className="type-badge">{item.type}</span>
                      </div>

                      <div className="place-meta">
                        <span className="saved-date">
                          Saved: {item.saved}
                        </span>
                      </div>

                      {item.notes && (
                        <div className="item-notes">
                          <span className="notes-icon">📝</span>
                          {item.notes}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="card-footer">
                  {activeTab === 'routes' && (
                    <button 
                      className="footer-btn primary"
                      onClick={() => handleUseRoute(item)}
                    >
                      Use Route
                    </button>
                  )}
                  {activeTab === 'stops' && (
                    <button 
                      className="footer-btn primary"
                      onClick={() => handleViewStop(item)}
                    >
                      View Stop
                    </button>
                  )}
                  <button 
                    className="footer-btn"
                    onClick={() => handleShareBookmark(item)}
                  >
                    Share
                  </button>
                  <button 
                    className="footer-btn danger"
                    onClick={() => handleDeleteBookmark(item.id, activeTab)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-bookmarks">
            <div className="empty-state">
              <span className="empty-icon">📌</span>
              <h3>No bookmarks found</h3>
              <p>
                {searchTerm 
                  ? `No ${activeTab} match your search`
                  : `You haven't saved any ${activeTab} yet`}
              </p>
              {!searchTerm && (
                <button 
                  className="browse-btn"
                  onClick={() => navigate('/passenger/planner')}
                >
                  Plan a Route
                </button>
              )}
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && selectedBookmark && (
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Share Bookmark</h3>
                <button className="close-btn" onClick={() => setShowShareModal(false)}>×</button>
              </div>

              <div className="share-options">
                <div className="share-preview">
                  <div className="preview-icon">
                    {activeTab === 'routes' ? '🚌' : activeTab === 'stops' ? '🚏' : '📍'}
                  </div>
                  <div className="preview-info">
                    <span className="preview-name">{selectedBookmark.name}</span>
                    {activeTab === 'routes' && (
                      <span className="preview-details">
                        {selectedBookmark.from} → {selectedBookmark.to}
                      </span>
                    )}
                    {activeTab !== 'routes' && (
                      <span className="preview-details">{selectedBookmark.address}</span>
                    )}
                  </div>
                </div>

                <div className="share-methods">
                  <button className="share-method">
                    <span className="method-icon">📱</span>
                    <span className="method-name">Messages</span>
                  </button>
                  <button className="share-method">
                    <span className="method-icon">📧</span>
                    <span className="method-name">Email</span>
                  </button>
                  <button className="share-method">
                    <span className="method-icon">💬</span>
                    <span className="method-name">WhatsApp</span>
                  </button>
                  <button className="share-method">
                    <span className="method-icon">🔗</span>
                    <span className="method-name">Copy Link</span>
                  </button>
                </div>

                <div className="share-link">
                  <input 
                    type="text" 
                    value={`https://bustrack.app/share/${activeTab}/${selectedBookmark.id}`}
                    readOnly
                  />
                  <button className="copy-btn">Copy</button>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowShareModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Folder Modal */}
        {showAddFolder && (
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Create New Folder</h3>
                <button className="close-btn" onClick={() => setShowAddFolder(false)}>×</button>
              </div>

              <div className="folder-form">
                <div className="form-group">
                  <label>Folder Name</label>
                  <input type="text" placeholder="e.g., Work Routes" />
                </div>

                <div className="form-group">
                  <label>Color</label>
                  <div className="color-options">
                    <button className="color-option blue"></button>
                    <button className="color-option green"></button>
                    <button className="color-option red"></button>
                    <button className="color-option purple"></button>
                    <button className="color-option orange"></button>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowAddFolder(false)}
                >
                  Cancel
                </button>
                <button className="submit-btn">
                  Create Folder
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Bookmarks;
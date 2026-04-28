import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './FleetManagement.css';

const FleetManagement = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedBuses, setSelectedBuses] = useState([]);
  const [showAddBus, setShowAddBus] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Live fleet data from MongoDB
  const [fleet, setFleet] = useState([]);

  const fetchFleet = async () => {
    try {
      setLoading(true);
      const buses = await api.adminGetBuses();
      // Normalize data — spread FIRST so our safe values override raw MongoDB objects
      setFleet(buses.map(b => ({
        ...b,
        id: b.id || b._id,
        number: String(b.number || ''),
        model: String(b.model || 'N/A'),
        year: b.year || '',
        status: String(b.status || 'inactive'),
        driver: String(b.driverName || b.driverId || 'Unassigned'),
        route: String(b.routeName || b.routeId || 'Unassigned'),
        lastMaintenance: String(b.lastMaintenance || '—'),
        nextMaintenance: String(b.nextMaintenance || '—'),
        mileage: Number(b.mileage) || 0,
        fuelLevel: Number(b.fuelLevel) || 0,
        occupancy: Number(b.occupancy) || 0,
        capacity: Number(b.capacity) || 50,
        // location is an object from MongoDB — always extract the address string
        location: typeof b.location === 'object' && b.location !== null
          ? (b.location.address || `${b.location.lat ?? ''},${b.location.lng ?? ''}`)
          : String(b.location || 'Unknown'),
      })));
      setError('');
    } catch (e) {
      setError('Failed to load fleet data. Is the backend running?');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
    const iv = setInterval(fetchFleet, 15000); // refresh every 15s
    return () => clearInterval(iv);
  }, []);

  // Mock data removed — fleet now loaded live from MongoDB via fetchFleet()

  const filteredFleet = fleet.filter(bus => {
    const matchesStatus = filterStatus === 'all' || bus.status === filterStatus;
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      String(bus.number || '').toLowerCase().includes(term) ||
      String(bus.model || '').toLowerCase().includes(term) ||
      String(bus.driver || '').toLowerCase().includes(term) ||
      String(bus.location || '').toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  const handleSelectBus = (busId) => {
    setSelectedBuses(prev => {
      if (prev.includes(busId)) {
        return prev.filter(id => id !== busId);
      } else {
        return [...prev, busId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedBuses.length === filteredFleet.length) {
      setSelectedBuses([]);
    } else {
      setSelectedBuses(filteredFleet.map(bus => bus.id));
    }
  };

  const handleStatusChange = (busId, newStatus) => {
    setFleet(prev => prev.map(bus => 
      bus.id === busId ? { ...bus, status: newStatus } : bus
    ));
  };

  const handleMaintenanceSchedule = (busId) => {
    setShowMaintenanceModal(true);
    // Store selected bus for maintenance
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'maintenance': return 'status-maintenance';
      default: return '';
    }
  };

  const getFuelLevelClass = (level) => {
    if (level > 70) return 'fuel-high';
    if (level > 30) return 'fuel-medium';
    return 'fuel-low';
  };

  const getMaintenanceStatus = (nextMaintenance) => {
    const today = new Date();
    const maintenanceDate = new Date(nextMaintenance);
    const daysUntil = Math.ceil((maintenanceDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return 'overdue';
    if (daysUntil < 7) return 'due-soon';
    return 'ok';
  };

  return (
    <div className="fleet-management">
      {/* Live data status */}
      {loading && <div style={{ padding: '10px 20px', background: '#dbeafe', color: '#1e40af', borderRadius: 8, margin: '0 0 12px', fontSize: 13 }}>⏳ Loading fleet data from MongoDB...</div>}
      {error && <div style={{ padding: '10px 20px', background: '#fee2e2', color: '#dc2626', borderRadius: 8, margin: '0 0 12px', fontSize: 13 }}>⚠️ {error} <button onClick={fetchFleet} style={{ marginLeft: 8, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 10px', cursor: 'pointer' }}>Retry</button></div>}
      <div className="fleet-header">
        <h3>Fleet Management <span style={{ fontSize: 13, color: '#64748b', fontWeight: 400 }}>({fleet.length} buses · live from MongoDB)</span></h3>
        <div className="fleet-actions">
          <button className="action-btn primary" onClick={() => setShowAddBus(true)}>
            <span className="btn-icon">➕</span>
            Add Bus
          </button>
          <button className="action-btn secondary">
            <span className="btn-icon">📊</span>
            Export Report
          </button>
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              ⊞
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      <div className="fleet-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search buses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All ({fleet.length})
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
            onClick={() => setFilterStatus('active')}
          >
            Active ({fleet.filter(b => b.status === 'active').length})
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'maintenance' ? 'active' : ''}`}
            onClick={() => setFilterStatus('maintenance')}
          >
            Maintenance ({fleet.filter(b => b.status === 'maintenance').length})
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilterStatus('inactive')}
          >
            Inactive ({fleet.filter(b => b.status === 'inactive').length})
          </button>
        </div>
      </div>

      {selectedBuses.length > 0 && (
        <div className="bulk-actions">
          <span className="selected-count">{selectedBuses.length} buses selected</span>
          <div className="bulk-buttons">
            <button className="bulk-btn">Assign Driver</button>
            <button className="bulk-btn">Schedule Maintenance</button>
            <button className="bulk-btn">Change Status</button>
            <button className="bulk-btn">Export Data</button>
          </div>
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className="fleet-grid">
          {filteredFleet.map(bus => (
            <div key={bus.id} className={`fleet-card ${selectedBuses.includes(bus.id) ? 'selected' : ''}`}>
              <div className="card-header">
                <div className="card-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedBuses.includes(bus.id)}
                    onChange={() => handleSelectBus(bus.id)}
                  />
                </div>
                <div className={`bus-status ${getStatusClass(bus.status)}`}>
                  {bus.status}
                </div>
                <div className="card-actions">
                  <button className="card-action">⋮</button>
                </div>
              </div>

              <div className="card-body">
                <div className="bus-icon">🚌</div>
                <h4 className="bus-number">{bus.number}</h4>
                <p className="bus-model">{bus.model} ({bus.year})</p>
                
                <div className="bus-details">
                  <div className="detail-row">
                    <span className="detail-label">Driver:</span>
                    <span className="detail-value">{bus.driver}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Route:</span>
                    <span className="detail-value">{bus.route}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Mileage:</span>
                    <span className="detail-value">{Number(bus.mileage || 0).toLocaleString()} km</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{bus.location}</span>
                  </div>
                </div>

                <div className="bus-stats">
                  <div className="stat">
                    <span className="stat-label">Fuel</span>
                    <div className="fuel-bar">
                      <div 
                        className={`fuel-fill ${getFuelLevelClass(bus.fuelLevel)}`}
                        style={{ width: `${bus.fuelLevel}%` }}
                      />
                    </div>
                    <span className="stat-value">{bus.fuelLevel}%</span>
                  </div>

                  <div className="stat">
                    <span className="stat-label">Occupancy</span>
                    <div className="occupancy-bar">
                      <div 
                        className="occupancy-fill"
                        style={{ width: `${bus.occupancy}%` }}
                      />
                    </div>
                    <span className="stat-value">{bus.occupancy}%</span>
                  </div>
                </div>

                <div className="maintenance-info">
                  <div className={`maintenance-badge ${getMaintenanceStatus(bus.nextMaintenance)}`}>
                    {getMaintenanceStatus(bus.nextMaintenance) === 'overdue' && '⚠️ Overdue'}
                    {getMaintenanceStatus(bus.nextMaintenance) === 'due-soon' && '⏰ Due Soon'}
                    {getMaintenanceStatus(bus.nextMaintenance) === 'ok' && '✓ OK'}
                  </div>
                  <span className="maintenance-date">Next: {bus.nextMaintenance}</span>
                </div>
              </div>

              <div className="card-footer">
                <button className="footer-btn" onClick={() => handleStatusChange(bus.id, 'active')}>
                  Activate
                </button>
                <button className="footer-btn" onClick={() => handleMaintenanceSchedule(bus.id)}>
                  Maintenance
                </button>
                <button className="footer-btn">Details</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="fleet-list">
          <table className="fleet-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedBuses.length === filteredFleet.length && filteredFleet.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Bus Number</th>
                <th>Model</th>
                <th>Status</th>
                <th>Driver</th>
                <th>Route</th>
                <th>Fuel</th>
                <th>Occupancy</th>
                <th>Next Maintenance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFleet.map(bus => (
                <tr key={bus.id} className={selectedBuses.includes(bus.id) ? 'selected' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedBuses.includes(bus.id)}
                      onChange={() => handleSelectBus(bus.id)}
                    />
                  </td>
                  <td className="bus-number">{bus.number}</td>
                  <td>{bus.model}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(bus.status)}`}>
                      {bus.status}
                    </span>
                  </td>
                  <td>{bus.driver}</td>
                  <td>{bus.route}</td>
                  <td>
                    <div className="fuel-indicator">
                      <div className={`fuel-level ${getFuelLevelClass(bus.fuelLevel)}`}>
                        <div className="fuel-fill" style={{ width: `${bus.fuelLevel}%` }} />
                      </div>
                      <span>{bus.fuelLevel}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="occupancy-indicator">
                      <div className="occupancy-level">
                        <div className="occupancy-fill" style={{ width: `${bus.occupancy}%` }} />
                      </div>
                      <span>{bus.occupancy}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`maintenance-indicator ${getMaintenanceStatus(bus.nextMaintenance)}`}>
                      {bus.nextMaintenance}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="row-action">👁️</button>
                      <button className="row-action">✏️</button>
                      <button className="row-action">⋮</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Bus Modal */}
      {showAddBus && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add New Bus</h3>
            <form className="add-bus-form">
              <div className="form-group">
                <label>Bus Number</label>
                <input type="text" placeholder="e.g., BUS-006" />
              </div>
              <div className="form-group">
                <label>Model</label>
                <select>
                  <option>Volvo 9700</option>
                  <option>Mercedes Tourismo</option>
                  <option>Scania Interlink</option>
                  <option>MAN Lion's Coach</option>
                </select>
              </div>
              <div className="form-group">
                <label>Year</label>
                <input type="number" placeholder="2024" />
              </div>
              <div className="form-group">
                <label>Initial Mileage</label>
                <input type="number" placeholder="0" />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select>
                  <option>active</option>
                  <option>inactive</option>
                  <option>maintenance</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAddBus(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Add Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Schedule Maintenance</h3>
            <form className="maintenance-form">
              <div className="form-group">
                <label>Select Bus</label>
                <select>
                  {fleet.map(bus => (
                    <option key={bus.id}>{bus.number}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Maintenance Type</label>
                <select>
                  <option>Regular Service</option>
                  <option>Engine Repair</option>
                  <option>Brake Inspection</option>
                  <option>Tire Replacement</option>
                  <option>AC Service</option>
                </select>
              </div>
              <div className="form-group">
                <label>Scheduled Date</label>
                <input type="date" />
              </div>
              <div className="form-group">
                <label>Estimated Duration</label>
                <input type="text" placeholder="e.g., 3 hours" />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows="3" placeholder="Additional details..."></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowMaintenanceModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetManagement;
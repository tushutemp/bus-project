import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import FleetManagement from './FleetManagement.jsx';
import Analytics from './Analytics.jsx';
import UserManagement from './UserManagement.jsx';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import './AdminDashboard.css';

// ── Modal Overlay wrapper ────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="modal-box">
      <div className="modal-header">
        <h3>{title}</h3>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

// ── Add Bus Modal ─────────────────────────────────────────────────────────────
const AddBusModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ number: '', model: '', year: new Date().getFullYear(), capacity: 50, status: 'inactive' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.number || !form.model) { setError('Bus number and model are required'); return; }
    setLoading(true); setError('');
    try {
      const bus = await api.adminAddBus(form);
      onSuccess(bus, 'Bus added successfully!');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="➕ Add New Bus" onClose={onClose}>
      {error && <div className="modal-error">{error}</div>}
      <div className="form-grid">
        <label>Bus Number *<input value={form.number} onChange={e => setForm({...form, number: e.target.value})} placeholder="BUS-101" /></label>
        <label>Model *<input value={form.model} onChange={e => setForm({...form, model: e.target.value})} placeholder="Volvo 9700" /></label>
        <label>Year<input type="number" value={form.year} onChange={e => setForm({...form, year: parseInt(e.target.value)})} /></label>
        <label>Capacity *<input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: parseInt(e.target.value)})} /></label>
        <label>Status
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            <option value="inactive">Inactive</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </label>
      </div>
      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Adding...' : 'Add Bus'}</button>
      </div>
    </Modal>
  );
};

// ── Add Driver Modal ──────────────────────────────────────────────────────────
const AddDriverModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: '', email: '', password: 'driver123', phone: '', licenseNumber: '', experience: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.name || !form.email) { setError('Name and email are required'); return; }
    setLoading(true); setError('');
    try {
      const driver = await api.adminAddDriver(form);
      onSuccess(driver, 'Driver added successfully!');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="👤 Add New Driver" onClose={onClose}>
      {error && <div className="modal-error">{error}</div>}
      <div className="form-grid">
        <label>Full Name *<input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Rajesh Kumar" /></label>
        <label>Email *<input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="driver@college.edu" /></label>
        <label>Password<input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></label>
        <label>Phone<input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+91 9876543210" /></label>
        <label>License Number<input value={form.licenseNumber} onChange={e => setForm({...form, licenseNumber: e.target.value})} placeholder="DL-1234567890" /></label>
        <label>Experience (years)<input type="number" value={form.experience} onChange={e => setForm({...form, experience: parseInt(e.target.value)})} /></label>
      </div>
      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Adding...' : 'Add Driver'}</button>
      </div>
    </Modal>
  );
};

// ── Schedule Maintenance Modal ────────────────────────────────────────────────
const MaintenanceModal = ({ onClose, onSuccess }) => {
  const [buses, setBuses] = useState([]);
  const [form, setForm] = useState({ busId: '', type: 'routine', scheduledDate: '', description: '', mechanic: '', estimatedCost: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.adminGetBuses().then(setBuses).catch(() => {}); }, []);

  const handleSubmit = async () => {
    if (!form.busId || !form.scheduledDate) { setError('Bus and scheduled date are required'); return; }
    setLoading(true); setError('');
    try {
      const rec = await api.adminScheduleMaintenance(form);
      onSuccess(rec, 'Maintenance scheduled!');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="🛠️ Schedule Maintenance" onClose={onClose}>
      {error && <div className="modal-error">{error}</div>}
      <div className="form-grid">
        <label>Bus *
          <select value={form.busId} onChange={e => setForm({...form, busId: e.target.value})}>
            <option value="">Select bus...</option>
            {buses.map(b => <option key={b.id} value={b.id}>{b.number} — {b.model}</option>)}
          </select>
        </label>
        <label>Type *
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
            <option value="routine">Routine Service</option>
            <option value="repair">Repair</option>
            <option value="inspection">Inspection</option>
            <option value="emergency">Emergency</option>
          </select>
        </label>
        <label>Scheduled Date *<input type="date" value={form.scheduledDate} onChange={e => setForm({...form, scheduledDate: e.target.value})} /></label>
        <label>Mechanic / Workshop<input value={form.mechanic} onChange={e => setForm({...form, mechanic: e.target.value})} placeholder="Auto Workshop" /></label>
        <label>Estimated Cost (₹)<input type="number" value={form.estimatedCost} onChange={e => setForm({...form, estimatedCost: e.target.value})} /></label>
        <label className="full-width">Description<textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Details about the maintenance..." /></label>
      </div>
      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Scheduling...' : 'Schedule'}</button>
      </div>
    </Modal>
  );
};

// ── Assign Route Modal ────────────────────────────────────────────────────────
const AssignRouteModal = ({ onClose, onSuccess }) => {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState({ busId: '', routeId: '', driverId: '', startRoute: '', endRoute: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.adminGetBuses(), api.adminGetRoutes(), api.adminGetDrivers()])
      .then(([b, r, d]) => { setBuses(b); setRoutes(r); setDrivers(d); })
      .catch(() => {});
  }, []);

  // When route is selected, auto-fill startRoute/endRoute from route stops
  const selectedRoute = routes.find(r => r.id === form.routeId || r._id === form.routeId);
  const routeStops = selectedRoute?.stops || [];

  const handleSubmit = async () => {
    if (!form.busId || !form.routeId) { setError('Bus and route are required'); return; }
    setLoading(true); setError('');
    try {
      const result = await api.adminAssignRoute(form);
      onSuccess(result, 'Route assigned successfully!');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="🚌 Assign Route" onClose={onClose}>
      {error && <div className="modal-error">{error}</div>}
      <div className="form-grid">
        <label>Bus *
          <select value={form.busId} onChange={e => setForm({...form, busId: e.target.value})}>
            <option value="">Select bus...</option>
            {buses.map(b => <option key={b.id} value={b.id}>{b.number} — {b.model}</option>)}
          </select>
        </label>
        <label>Route *
          <select value={form.routeId} onChange={e => {
            const r = routes.find(r => r.id === e.target.value || r._id === e.target.value);
            const stops = r?.stops || [];
            setForm({
              ...form,
              routeId: e.target.value,
              startRoute: stops[0]?.name || '',
              endRoute: stops[stops.length - 1]?.name || '',
            });
          }}>
            <option value="">Select route...</option>
            {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <label>Starting Stop *
          <select value={form.startRoute} onChange={e => setForm({...form, startRoute: e.target.value})}>
            <option value="">Select starting stop...</option>
            {routeStops.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </label>
        <label>Ending Stop *
          <select value={form.endRoute} onChange={e => setForm({...form, endRoute: e.target.value})}>
            <option value="">Select ending stop...</option>
            {routeStops.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </label>
        <label>Assign Driver (optional)
          <select value={form.driverId} onChange={e => setForm({...form, driverId: e.target.value})}>
            <option value="">No driver change</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>
      </div>
      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Assigning...' : 'Assign Route'}</button>
      </div>
    </Modal>
  );
};

// ── Broadcast Message Modal ───────────────────────────────────────────────────
const BroadcastModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ title: '', message: '', targetRole: 'all', priority: 'normal' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.title || !form.message) { setError('Title and message are required'); return; }
    setLoading(true); setError('');
    try {
      const result = await api.adminBroadcast(form);
      onSuccess(result, 'Message broadcast successfully!');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="📢 Broadcast Message" onClose={onClose}>
      {error && <div className="modal-error">{error}</div>}
      <div className="form-grid">
        <label>Title *<input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Service Alert" /></label>
        <label>Target Audience *
          <select value={form.targetRole} onChange={e => setForm({...form, targetRole: e.target.value})}>
            <option value="all">All Users</option>
            <option value="driver">Drivers Only</option>
            <option value="passenger">Passengers Only</option>
          </select>
        </label>
        <label>Priority
          <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
        <label className="full-width">Message *
          <textarea rows={4} value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Enter your message to broadcast..." />
        </label>
      </div>
      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Broadcasting...' : 'Broadcast'}</button>
      </div>
    </Modal>
  );
};

// ── Generate Report Modal ─────────────────────────────────────────────────────
const ReportModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ type: 'summary', dateRange: 'today' });
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true); setError('');
    try {
      const result = await api.adminGenerateReport(form);
      setReport(result);
      onSuccess(result, 'Report generated!');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  if (report) {
    const s = report.summary;
    return (
      <Modal title="📊 Generated Report" onClose={onClose}>
        <div className="report-view">
          <div className="report-meta">
            <span>Type: <strong>{report.type}</strong></span>
            <span>Range: <strong>{report.dateRange}</strong></span>
            <span>Generated: <strong>{new Date(report.generatedAt).toLocaleString()}</strong></span>
          </div>
          <div className="report-stats-grid">
            <div className="rstat"><span>{s.totalBuses}</span>Total Buses</div>
            <div className="rstat"><span>{s.activeBuses}</span>Active</div>
            <div className="rstat"><span>{(stats?.pendingMaint ?? 0)}</span>Maintenance</div>
            <div className="rstat"><span>{s.totalDrivers}</span>Drivers</div>
            <div className="rstat"><span>{(stats?.totalStudents ?? 0)}</span>Passengers</div>
            <div className="rstat"><span>{s.totalRoutes}</span>Routes</div>
            <div className="rstat"><span>{s.unresolvedAlerts}</span>Active SOS</div>
            <div className="rstat"><span>{s.scheduledMaintenance}</span>Pending Maint.</div>
            <div className="rstat"><span>{s.broadcastsSent}</span>Broadcasts</div>
          </div>
          <p className="report-id">Report ID: {report.id}</p>
        </div>
        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>Close</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="📊 Generate Report" onClose={onClose}>
      {error && <div className="modal-error">{error}</div>}
      <div className="form-grid">
        <label>Report Type
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
            <option value="summary">Fleet Summary</option>
            <option value="maintenance">Maintenance Report</option>
            <option value="drivers">Driver Report</option>
            <option value="incidents">Incidents Report</option>
          </select>
        </label>
        <label>Date Range
          <select value={form.dateRange} onChange={e => setForm({...form, dateRange: e.target.value})}>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </label>
      </div>
      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleGenerate} disabled={loading}>{loading ? 'Generating...' : 'Generate Report'}</button>
      </div>
    </Modal>
  );
};

// ── Schedule Modal ────────────────────────────────────────────────────────────
const ScheduleModal = ({ onClose, onSuccess }) => {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState({ busId: '', routeId: '', departureTime: '', arrivalTime: '', days: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    Promise.all([api.adminGetBuses(), api.adminGetRoutes()])
      .then(([b, r]) => { setBuses(b); setRoutes(r); })
      .catch(() => {});
  }, []);

  const toggleDay = (d) => setForm(f => ({
    ...f, days: f.days.includes(d) ? f.days.filter(x => x !== d) : [...f.days, d]
  }));

  const handleSubmit = async () => {
    if (!form.busId || !form.routeId || !form.departureTime) { setError('Bus, route and departure time required'); return; }
    setLoading(true); setError('');
    try {
      await api.adminAddSchedule(form);
      onSuccess(null, 'Schedule created successfully!');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="📅 Create Schedule" onClose={onClose}>
      {error && <div className="modal-error">{error}</div>}
      <div className="form-grid">
        <label>Bus *
          <select value={form.busId} onChange={e => setForm({...form, busId: e.target.value})}>
            <option value="">Select Bus</option>
            {buses.map(b => <option key={b.id} value={b.id}>{b.number} ({b.status})</option>)}
          </select>
        </label>
        <label>Route *
          <select value={form.routeId} onChange={e => setForm({...form, routeId: e.target.value})}>
            <option value="">Select Route</option>
            {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <label>Departure Time *<input type="time" value={form.departureTime} onChange={e => setForm({...form, departureTime: e.target.value})} /></label>
        <label>Arrival Time<input type="time" value={form.arrivalTime} onChange={e => setForm({...form, arrivalTime: e.target.value})} /></label>
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Operating Days</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {daysOfWeek.map(d => (
            <button key={d} type="button" onClick={() => toggleDay(d)}
              style={{ padding: '4px 12px', borderRadius: 20, border: '2px solid', borderColor: form.days.includes(d) ? '#2563eb' : '#cbd5e1', background: form.days.includes(d) ? '#2563eb' : '#fff', color: form.days.includes(d) ? '#fff' : '#475569', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              {d}
            </button>
          ))}
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Creating...' : 'Create Schedule'}</button>
      </div>
    </Modal>
  );
};

// ── Bus Status Modal ───────────────────────────────────────────────────────────
const BusStatusModal = ({ onClose, onSuccess }) => {
  const [buses, setBuses] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState('');
  const [newStatus, setNewStatus] = useState('inactive');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.adminGetBuses().then(setBuses).catch(() => {});
  }, []);

  const selectedBus = buses.find(b => b.id === selectedBusId || b._id === selectedBusId);
  const currentStatus = selectedBus?.status || '—';

  const handleSubmit = async () => {
    if (!selectedBusId) { setError('Please select a bus'); return; }
    setLoading(true); setError('');
    try {
      const result = await api.adminSetBusStatus(selectedBusId, newStatus);
      onSuccess(result, `Bus status set to "${newStatus}" successfully!`);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const statusColor = { active: '#059669', inactive: '#dc2626', maintenance: '#d97706' };

  return (
    <Modal title="🔴 Manage Bus Status" onClose={onClose}>
      {error && <div className="modal-error">{error}</div>}
      <div className="form-grid">
        <label>Select Bus *
          <select value={selectedBusId} onChange={e => setSelectedBusId(e.target.value)}>
            <option value="">Choose a bus...</option>
            {buses.map(b => (
              <option key={b.id} value={b.id}>
                {b.number} — {b.model} (currently: {b.status})
              </option>
            ))}
          </select>
        </label>
        {selectedBus && (
          <div style={{ padding: '8px 12px', borderRadius: 8, background: '#f8fafc', marginBottom: 8 }}>
            <span style={{ fontWeight: 600 }}>Current Status: </span>
            <span style={{ color: statusColor[currentStatus] || '#64748b', fontWeight: 700 }}>
              {currentStatus.toUpperCase()}
            </span>
          </div>
        )}
        <label>Set New Status *
          <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
            <option value="active">✅ Active — Bus is in service</option>
            <option value="inactive">🔴 Inactive — Remove from service</option>
            <option value="maintenance">🔧 Maintenance — Under repair</option>
          </select>
        </label>
      </div>
      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Updating...' : 'Update Status'}
        </button>
      </div>
    </Modal>
  );
};

// ── Main AdminDashboard ───────────────────────────────────────────────────────
const AdminDashboard = ({ onLogout }) => {
  const { user, logout } = useAuthStore();
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('today');
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [toast, setToast] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'addBus'|'addDriver'|'maintenance'|'assignRoute'|'broadcast'|'report'

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadStats = useCallback(async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (e) { console.error('Stats error', e); }
  }, []);

  useEffect(() => {
    loadStats();
    const iv = setInterval(loadStats, 15000);
    return () => clearInterval(iv);
  }, [loadStats]);

  const handleActionSuccess = (_, msg) => {
    setActiveModal(null);
    showToast(msg);
    loadStats();
  };

  const getSeverityClass = s => ({ high: 'severity-high', medium: 'severity-medium', low: 'severity-low' }[s] || '');
  const getAlertIcon = t => ({ sos: '🆘', maintenance: '🔧', delay: '⏰', incident: '⚠️' }[t] || '📢');

  const handleAlertAction = id => setAlerts(prev => prev.filter(a => a.id !== id));

  return (
    <DashboardLayout userRole="admin">
      {toast && (
        <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>
      )}

      {/* Modals */}
      {activeModal === 'addBus'      && <AddBusModal      onClose={() => setActiveModal(null)} onSuccess={handleActionSuccess} />}
      {activeModal === 'addDriver'   && <AddDriverModal   onClose={() => setActiveModal(null)} onSuccess={handleActionSuccess} />}
      {activeModal === 'maintenance' && <MaintenanceModal onClose={() => setActiveModal(null)} onSuccess={handleActionSuccess} />}
      {activeModal === 'assignRoute' && <AssignRouteModal onClose={() => setActiveModal(null)} onSuccess={handleActionSuccess} />}
      {activeModal === 'broadcast'   && <BroadcastModal   onClose={() => setActiveModal(null)} onSuccess={handleActionSuccess} />}
      {activeModal === 'report'      && <ReportModal      onClose={() => setActiveModal(null)} onSuccess={handleActionSuccess} />}
      {activeModal === 'schedule'     && <ScheduleModal    onClose={() => setActiveModal(null)} onSuccess={handleActionSuccess} />}
      {activeModal === 'busStatus'   && <BusStatusModal   onClose={() => setActiveModal(null)} onSuccess={handleActionSuccess} />}

      <div className="admin-dashboard">
        <div className="dashboard-header">
          <div className="header-left">
            <h2>Admin Dashboard</h2>
            <div className="date-range-selector">
              {['today','week','month','custom'].map(r => (
                <button key={r} className={`range-btn ${dateRange===r?'active':''}`} onClick={() => setDateRange(r)}>
                  {r.charAt(0).toUpperCase()+r.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="header-right">
            <div className="notification-badge">
              <span className="badge-icon">🔔</span>
              <span className="badge-count">{alerts.length}</span>
            </div>
            {/* Profile Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowProfile(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg,#1e40af,#3b82f6)', color: '#fff', border: 'none', borderRadius: '24px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, boxShadow: '0 2px 8px rgba(59,130,246,0.4)' }}
              >
                <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>👤</span>
                {user?.name || 'Admin'}
                <span style={{ fontSize: 10 }}>{showProfile ? '▲' : '▼'}</span>
              </button>
              {showProfile && (
                <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.16)', minWidth: 240, zIndex: 9999, overflow: 'hidden', border: '1px solid #e2e8f0' }}
                  onMouseLeave={() => setShowProfile(false)}>
                  <div style={{ background: 'linear-gradient(135deg,#1e40af,#3b82f6)', padding: '20px 16px', color: '#fff' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 10 }}>👤</div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.name || 'Admin User'}</div>
                    <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>{user?.email}</div>
                    <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '3px 10px' }}>🛡️ Super Admin</span>
                  </div>
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ padding: '10px 16px', fontSize: 13, color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
                      <div>Total Buses: <strong>{stats?.totalBuses ?? 0}</strong></div>
                      <div>Total Students: <strong>{stats?.totalStudents ?? 0}</strong></div>
                    </div>
                    <button
                      onClick={() => { logout(); if (onLogout) onLogout(); }}
                      style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 14, color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      🚪 Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats — from real backend */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🚌</div>
            <div className="stat-content">
              <span className="stat-value">{stats?.totalBuses ?? '—'}</span>
              <span className="stat-label">Total Buses</span>
              <div className="stat-detail">
                <span className="detail-active">{stats?.activeBuses ?? 0} Active</span>
                <span className="detail-maintenance">{stats?.pendingMaint ?? 0 ?? 0} Maintenance</span>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👨‍✈️</div>
            <div className="stat-content">
              <span className="stat-value">{stats?.totalDrivers ?? '—'}</span>
              <span className="stat-label">Total Drivers</span>
              <div className="stat-detail">
                <span className="detail-active">{stats?.totalDrivers ?? 0} Online</span>
                <span className="detail-offline">{(stats?.totalDrivers ?? 0) - (stats?.totalDrivers ?? 0)} Offline</span>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <span className="stat-value">{stats?.totalStudents ?? '—'}</span>
              <span className="stat-label">Passengers</span>
              <div className="stat-detail">
                <span className="detail-trips">{stats?.totalUsers ?? 0} Total Users</span>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🗺️</div>
            <div className="stat-content">
              <span className="stat-value">{stats?.totalRoutes ?? '—'}</span>
              <span className="stat-label">Routes</span>
              <div className="stat-detail">
                <span className="detail-active">{stats?.connectedClients ?? 0} Live Clients</span>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🆘</div>
            <div className="stat-content">
              <span className="stat-value">{stats?.activeSOS ?? '—'}</span>
              <span className="stat-label">Active SOS</span>
              <div className="stat-detail">
                <span className="detail-maintenance">{stats?.pendingMaintenance ?? 0} Pending Maint.</span>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📢</div>
            <div className="stat-content">
              <span className="stat-value">{stats?.totalMessages ?? '—'}</span>
              <span className="stat-label">Broadcasts Sent</span>
              <div className="stat-detail">
                <span className="detail-active">Live data</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {[
            {key:'overview', label:'Overview'},
            {key:'fleet',    label:'Fleet Management'},
            {key:'analytics',label:'Analytics'},
            {key:'users',    label:'User Management'},
          ].map(({key, label}) => (
            <button key={key} className={`tab-btn ${activeTab===key?'active':''}`} onClick={() => setActiveTab(key)}>
              {label}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {alerts.length > 0 && (
                <div className="alerts-section">
                  <h3>Recent Alerts & Incidents</h3>
                  <div className="alerts-list">
                    {alerts.map(alert => (
                      <div key={alert.id} className={`alert-item ${getSeverityClass(alert.severity)}`}>
                        <div className="alert-icon">{getAlertIcon(alert.type)}</div>
                        <div className="alert-content">
                          <div className="alert-header">
                            <span className="alert-bus">{alert.bus}</span>
                            <span className="alert-time">{alert.time}</span>
                          </div>
                          <p className="alert-message">{alert.message}</p>
                        </div>
                        <div className="alert-actions">
                          <button className="action-btn resolve" onClick={() => handleAlertAction(alert.id)}>✓</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions — all wired to real API modals */}
              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="actions-grid">
                  <button className="action-card" onClick={() => setActiveModal('addBus')}>
                    <span className="action-icon">➕</span>
                    <span className="action-title">Add Bus</span>
                    <span className="action-desc">Register a new bus</span>
                  </button>
                  <button className="action-card" onClick={() => setActiveModal('addDriver')}>
                    <span className="action-icon">👤</span>
                    <span className="action-title">Add Driver</span>
                    <span className="action-desc">Onboard a driver</span>
                  </button>
                  <button className="action-card" onClick={() => setActiveModal('maintenance')}>
                    <span className="action-icon">🛠️</span>
                    <span className="action-title">Schedule Maintenance</span>
                    <span className="action-desc">Book a service slot</span>
                  </button>
                  <button className="action-card" onClick={() => setActiveModal('report')}>
                    <span className="action-icon">📊</span>
                    <span className="action-title">Generate Report</span>
                    <span className="action-desc">Fleet statistics</span>
                  </button>
                  <button className="action-card" onClick={() => setActiveModal('assignRoute')}>
                    <span className="action-icon">🗺️</span>
                    <span className="action-title">Assign Route</span>
                    <span className="action-desc">Link bus to route</span>
                  </button>
                  <button className="action-card" onClick={() => setActiveModal('busStatus')}>
                    <span className="action-icon">🔴</span>
                    <span className="action-title">Bus Status</span>
                    <span className="action-desc">Activate / Inactivate bus</span>
                  </button>
                  <button className="action-card" onClick={() => setActiveModal('broadcast')}>
                    <span className="action-icon">📢</span>
                    <span className="action-title">Broadcast Message</span>
                    <span className="action-desc">Notify all users</span>
                  </button>
                  <button className="action-card" onClick={() => setActiveModal('schedule')}>
                    <span className="action-icon">📅</span>
                    <span className="action-title">Create Schedule</span>
                    <span className="action-desc">Set bus timetable</span>
                  </button>
                </div>
              </div>

              {/* System Status */}
              <div className="system-status">
                <h3>System Status</h3>
                <div className="status-grid">
                  <div className="status-item"><span className="status-label">GPS Tracking</span><span className="status-value online">Online</span></div>
                  <div className="status-item"><span className="status-label">Socket Server</span><span className="status-value online">{stats ? 'Connected' : 'Connecting…'}</span></div>
                  <div className="status-item"><span className="status-label">Database</span><span className="status-value online">Operational</span></div>
                  <div className="status-item"><span className="status-label">Live Clients</span><span className="status-value online">{stats?.connectedClients ?? 0} connected</span></div>
                  <div className="status-item"><span className="status-label">Buses Tracked</span><span className="status-value">{stats?.activeBuses ?? 0} active</span></div>
                  <div className="status-item"><span className="status-label">Data Source</span><span className="status-value online">Live Backend DB</span></div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'fleet'     && <FleetManagement />}
          {activeTab === 'analytics' && <Analytics dateRange={dateRange} />}
          {activeTab === 'users'     && <UserManagement />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;

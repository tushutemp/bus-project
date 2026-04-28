import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const UserManagement = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Live users from MongoDB
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.adminGetUsers();
      setUsers(data.map(u => ({
        ...u,
        id: u.id || u._id,
        name: String(u.name || ''),
        email: String(u.email || ''),
        role: String(u.role || 'passenger'),
        status: String(u.status || 'active'),
        phone: String(u.phone || ''),
        rollNumber: String(u.rollNumber || ''),
        department: String(u.department || ''),
        year: u.year != null ? String(u.year) : '',
        licenseNumber: String(u.licenseNumber || ''),
        experience: Number(u.experience) || 0,
        busId: String(u.busId || ''),
        registeredAt: String(u.registeredAt || u.joinedAt || ''),
        // flatten any nested objects that might come from MongoDB
        location: undefined,
      })));
      setError('');
    } catch (e) {
      setError('Cannot load users. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const iv = setInterval(fetchUsers, 20000);
    return () => clearInterval(iv);
  }, []);

  const showMsg = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // handleDeleteUser defined below — shows confirm modal, then calls API in confirmDelete

  // Mock data removed — users loaded live from MongoDB via fetchUsers()

  const filteredUsers = users.filter(user => {
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      String(user.name || '').toLowerCase().includes(term) ||
      String(user.email || '').toLowerCase().includes(term) ||
      String(user.phone || '').includes(searchTerm);
    return matchesRole && matchesStatus && matchesSearch;
  });

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleStatusChange = (userId, newStatus) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));
  };

  const handleRoleChange = (userId, newRole) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ));
  };

  const handleEditUser = (user) => {
    setSelectedUserForAction(user);
    setShowEditUser(true);
  };

  const handleDeleteUser = (user) => {
    // Show confirm dialog first — actual deletion in confirmDelete
    setSelectedUserForAction(user);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedUserForAction) return;
    try {
      await fetch(`http://localhost:3001/api/admin/users/${selectedUserForAction.id}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== selectedUserForAction.id));
      showMsg('User deleted successfully');
    } catch (e) { showMsg('Delete failed'); }
    setShowDeleteConfirm(false);
    setSelectedUserForAction(null);
    setSelectedUsers(prev => prev.filter(id => id !== selectedUserForAction.id));
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'role-admin';
      case 'driver': return 'role-driver';
      case 'passenger': return 'role-passenger';
      default: return '';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'on-leave': return 'status-leave';
      default: return '';
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="user-management">
      {toast && <div style={{ position: 'fixed', top: 20, right: 20, background: '#059669', color: '#fff', padding: '10px 20px', borderRadius: 10, zIndex: 9999, fontWeight: 600 }}>{toast}</div>}
      {loading && <div style={{ padding: '10px 16px', background: '#dbeafe', color: '#1e40af', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>⏳ Loading users from MongoDB...</div>}
      {error && <div style={{ padding: '10px 16px', background: '#fee2e2', color: '#dc2626', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>⚠️ {error} <button onClick={fetchUsers} style={{ marginLeft: 8, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 10px', cursor: 'pointer' }}>Retry</button></div>}
      <div className="users-header">
        <h3>User Management <span style={{ fontSize: 13, color: '#64748b', fontWeight: 400 }}>({users.length} users · live from MongoDB)</span></h3>
        <div className="users-actions">
          <button className="action-btn primary" onClick={() => setShowAddUser(true)}>
            <span className="btn-icon">➕</span>
            Add User
          </button>
          <button className="action-btn secondary">
            <span className="btn-icon">📧</span>
            Invite Users
          </button>
          <button className="action-btn secondary">
            <span className="btn-icon">📊</span>
            Export
          </button>
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ⊞
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      <div className="users-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search users by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-groups">
          <select 
            className="filter-select"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="driver">Driver</option>
            <option value="passenger">Passenger</option>
          </select>

          <select 
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on-leave">On Leave</option>
          </select>
        </div>
      </div>

      {selectedUsers.length > 0 && (
        <div className="bulk-actions">
          <span className="selected-count">{selectedUsers.length} users selected</span>
          <div className="bulk-buttons">
            <button className="bulk-btn">Change Role</button>
            <button className="bulk-btn">Change Status</button>
            <button className="bulk-btn">Send Message</button>
            <button className="bulk-btn">Export Selected</button>
          </div>
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className="users-grid">
          {filteredUsers.map(user => (
            <div key={user.id} className={`user-card ${selectedUsers.includes(user.id) ? 'selected' : ''}`}>
              <div className="card-header">
                <div className="card-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                  />
                </div>
                <div className={`user-status ${getStatusBadgeClass(user.status)}`}>
                  {user.status}
                </div>
                <div className="card-actions">
                  <button className="card-action">⋮</button>
                </div>
              </div>

              <div className="card-body">
                <div className="user-avatar">
                  {user.avatar || getInitials(user.name)}
                </div>
                <h4 className="user-name">{user.name}</h4>
                <p className="user-email">{user.email}</p>
                
                <div className="user-badges">
                  <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                    {user.role}
                  </span>
                  {user.role === 'driver' && user.rating && (
                    <span className="rating-badge">
                      ⭐ {user.rating}
                    </span>
                  )}
                  {user.role === 'passenger' && (
                    <span className="trips-badge">
                      🚍 {user.totalTrips} trips
                    </span>
                  )}
                </div>

                <div className="user-details">
                  <div className="detail-row">
                    <span className="detail-label">📞 Phone:</span>
                    <span className="detail-value">{user.phone}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">📅 Joined:</span>
                    <span className="detail-value">{user.joinedDate}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">⏱️ Last Active:</span>
                    <span className="detail-value">{user.lastActive}</span>
                  </div>
                  {user.role === 'driver' && (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">🚌 Assigned Bus:</span>
                        <span className="detail-value">{user.assignedBus}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">📊 Total Trips:</span>
                        <span className="detail-value">{user.totalTrips}</span>
                      </div>
                    </>
                  )}
                  {user.role === 'passenger' && (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">🚍 Total Trips:</span>
                        <span className="detail-value">{user.totalTrips}</span>
                      </div>
                      {user.favoriteRoutes && (
                        <div className="detail-row">
                          <span className="detail-label">⭐ Favorite Routes:</span>
                          <span className="detail-value">
                            {user.favoriteRoutes.join(', ')}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">🔑 Permissions:</span>
                        <span className="detail-value">{user.permissions}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">🏢 Department:</span>
                        <span className="detail-value">{user.department}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="card-footer">
                <button className="footer-btn" onClick={() => handleEditUser(user)}>Edit</button>
                <button className="footer-btn">Message</button>
                <button className="footer-btn">View</button>
                <button className="footer-btn delete" onClick={() => handleDeleteUser(user)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="users-list">
          <table className="users-table">
            <thead>
              <tr>
                <th style={{ width: '30px' }}>
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Contact</th>
                <th>Joined</th>
                <th>Last Active</th>
                <th>Assigned/Details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className={selectedUsers.includes(user.id) ? 'selected' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                    />
                  </td>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar-small">
                        {user.avatar || getInitials(user.name)}
                      </div>
                      <div>
                        <div className="user-name">{user.name}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <div className="contact-info">
                      <div>{user.phone}</div>
                      <small>{user.email}</small>
                    </div>
                  </td>
                  <td>{user.joinedDate}</td>
                  <td>{user.lastActive}</td>
                  <td>
                    {user.role === 'driver' && (
                      <span className="assigned-bus">{user.assignedBus}</span>
                    )}
                    {user.role === 'passenger' && (
                      <span className="trip-count">{user.totalTrips} trips</span>
                    )}
                    {user.role === 'admin' && (
                      <span className="permission-badge">{user.permissions}</span>
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="row-action" onClick={() => handleEditUser(user)} title="Edit">
                        ✏️
                      </button>
                      <button className="row-action" title="Message">
                        💬
                      </button>
                      <button className="row-action" title="View Details">
                        👁️
                      </button>
                      <button className="row-action delete" onClick={() => handleDeleteUser(user)} title="Delete">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredUsers.length === 0 && (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h4>No users found</h4>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New User</h3>
              <button className="close-btn" onClick={() => setShowAddUser(false)}>×</button>
            </div>
            <form className="user-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" placeholder="Enter full name" required />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" placeholder="Enter email address" required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone *</label>
                  <input type="tel" placeholder="Enter phone number" required />
                </div>
                <div className="form-group">
                  <label>Role *</label>
                  <select required>
                    <option value="">Select role</option>
                    <option value="admin">Admin</option>
                    <option value="driver">Driver</option>
                    <option value="passenger">Passenger</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Password *</label>
                  <input type="password" placeholder="Enter password" required />
                </div>
                <div className="form-group">
                  <label>Confirm Password *</label>
                  <input type="password" placeholder="Confirm password" required />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <input type="text" placeholder="Enter address" />
              </div>

              <div className="form-group">
                <label>Emergency Contact</label>
                <input type="text" placeholder="Enter emergency contact" />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on-leave">On Leave</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAddUser(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUser && selectedUserForAction && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit User</h3>
              <button className="close-btn" onClick={() => setShowEditUser(false)}>×</button>
            </div>
            <form className="user-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    defaultValue={selectedUserForAction.name}
                    placeholder="Enter full name" 
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    defaultValue={selectedUserForAction.email}
                    placeholder="Enter email address" 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input 
                    type="tel" 
                    defaultValue={selectedUserForAction.phone}
                    placeholder="Enter phone number" 
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select defaultValue={selectedUserForAction.role}>
                    <option value="admin">Admin</option>
                    <option value="driver">Driver</option>
                    <option value="passenger">Passenger</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <input 
                  type="text" 
                  defaultValue={selectedUserForAction.address}
                  placeholder="Enter address" 
                />
              </div>

              <div className="form-group">
                <label>Emergency Contact</label>
                <input 
                  type="text" 
                  defaultValue={selectedUserForAction.emergencyContact}
                  placeholder="Enter emergency contact" 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select defaultValue={selectedUserForAction.status}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on-leave">On Leave</option>
                  </select>
                </div>

                {selectedUserForAction.role === 'driver' && (
                  <div className="form-group">
                    <label>Assigned Bus</label>
                    <select defaultValue={selectedUserForAction.assignedBus}>
                      <option value="BUS-001">BUS-001</option>
                      <option value="BUS-002">BUS-002</option>
                      <option value="BUS-003">BUS-003</option>
                      <option value="BUS-004">BUS-004</option>
                      <option value="BUS-005">BUS-005</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowEditUser(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedUserForAction && (
        <div className="modal">
          <div className="modal-content delete-modal">
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="close-btn" onClick={() => setShowDeleteConfirm(false)}>×</button>
            </div>
            <div className="delete-content">
              <div className="delete-icon">⚠️</div>
              <p className="delete-message">
                Are you sure you want to delete user <strong>{selectedUserForAction.name}</strong>?
              </p>
              <p className="delete-warning">
                This action cannot be undone. All data associated with this user will be permanently removed.
              </p>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="delete-btn" onClick={confirmDelete}>
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
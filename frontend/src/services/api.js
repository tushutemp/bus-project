const API_BASE_URL = 'https://bus-project-i6od.onrender.com/'

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const token = localStorage.getItem('authToken');
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err.error || `Request failed: ${response.statusText}`);
    }
    return response.json();
  }
  getBuses()                       { return this.request('/buses'); }
  getBusById(id)                   { return this.request(`/buses/${id}`); }
  updateBusLocation(id, location)  { return this.request(`/buses/${id}/location`, { method: 'POST', body: JSON.stringify(location) }); }
  getRoutes()                      { return this.request('/routes'); }
  getRouteById(id)                 { return this.request(`/routes/${id}`); }
  getRouteStops(id)                { return this.request(`/routes/${id}/stops`); }
  getStats()                       { return this.request('/stats'); }
  // Admin - Buses
  adminGetBuses()                  { return this.request('/admin/buses'); }
  adminAddBus(data)                { return this.request('/admin/buses', { method: 'POST', body: JSON.stringify(data) }); }
  adminUpdateBus(id, data)         { return this.request(`/admin/buses/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  adminDeleteBus(id)               { return this.request(`/admin/buses/${id}`, { method: 'DELETE' }); }
  // Admin - Drivers
  adminGetDrivers()                { return this.request('/admin/drivers'); }
  adminAddDriver(data)             { return this.request('/admin/drivers', { method: 'POST', body: JSON.stringify(data) }); }
  adminUpdateDriver(id, data)      { return this.request(`/admin/drivers/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  // Admin - Routes
  adminGetRoutes()                 { return this.request('/admin/routes'); }
  adminAddRoute(data)              { return this.request('/admin/routes', { method: 'POST', body: JSON.stringify(data) }); }
  // Admin - Maintenance
  adminGetMaintenance()            { return this.request('/admin/maintenance'); }
  adminScheduleMaintenance(data)   { return this.request('/admin/maintenance', { method: 'POST', body: JSON.stringify(data) }); }
  adminUpdateMaintenance(id, data) { return this.request(`/admin/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  // Admin - Assign Route
  adminAssignRoute(data)           { return this.request('/admin/assign-route', { method: 'POST', body: JSON.stringify(data) }); }
  // Admin - Bus Status
  adminSetBusStatus(busId, status) { return this.request('/admin/buses/status', { method: 'POST', body: JSON.stringify({ busId, status }) }); }
  // Admin - Broadcast
  adminGetMessages()               { return this.request('/admin/broadcast'); }
  adminBroadcast(data)             { return this.request('/admin/broadcast', { method: 'POST', body: JSON.stringify(data) }); }
  // Admin - Reports
  adminGetReports()                { return this.request('/admin/reports'); }
  adminGenerateReport(data)        { return this.request('/admin/reports', { method: 'POST', body: JSON.stringify(data) }); }
  adminGetReport(id)               { return this.request(`/admin/reports/${id}`); }
  // Admin - Users
  adminGetUsers()                  { return this.request('/admin/users'); }
  adminDeleteUser(id)              { return this.request(`/admin/users/${id}`, { method: 'DELETE' }); }
  adminUpdateUser(id, data)        { return this.request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  // Admin - Schedules
  adminGetSchedules()              { return this.request('/admin/schedules'); }
  adminAddSchedule(data)           { return this.request('/admin/schedules', { method: 'POST', body: JSON.stringify(data) }); }
  // Admin - Delete Driver
  adminDeleteDriver(id)            { return this.request(`/admin/drivers/${id}`, { method: 'DELETE' }); }
  // Admin - Delete Maintenance  
  adminDeleteMaintenance(id)       { return this.request(`/admin/maintenance/${id}`, { method: 'DELETE' }); }
  // Stats (live)
  getLiveStats()                   { return this.request('/stats'); }
}

export default new ApiService();

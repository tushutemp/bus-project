/**
 * Bus Tracking Backend Server
 * MongoDB + Node.js - Full Database Integration
 * Run: npm install && node server.js
 */

const http = require('http');
const crypto = require('crypto');
const url = require('url');
const { MongoClient } = require('mongodb');

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://tushukk31059_db_user:1ipC6BE8QM6AmDWp@cluster0.lv9l5j7.mongodb.net/?appName=Cluster0';
const DB_NAME = 'bus_tracking';

// ─── MongoDB Connection ───────────────────────────────────────────────────────
let mongoClient;
let db;

async function connectMongo() {
  try {
    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    db = mongoClient.db(DB_NAME);
    console.log('[MongoDB] Connected to', MONGO_URI);

    // Create indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('sessions').createIndex({ token: 1 }, { unique: true });
    await db.collection('sessions').createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });

    const userCount = await db.collection('users').countDocuments();
    if (userCount === 0) await seedData();

    return true;
  } catch (err) {
    console.error('[MongoDB] Connection failed:', err.message);
    return false;
  }
}

// ─── Seed Initial Data ────────────────────────────────────────────────────────
async function seedData() {
  console.log('[MongoDB] Seeding initial data...');

  await db.collection('routes').insertMany([
    {
      _id: 'route-001', name: 'Campus Express', description: 'Main campus circular route', color: '#2563eb',
      stops: [
        { id: 's1', name: 'Main Gate', lat: 30.9010, lng: 75.8573, order: 1 },
        { id: 's2', name: 'Library Block', lat: 30.9025, lng: 75.8590, order: 2 },
        { id: 's3', name: 'Engineering Block', lat: 30.9040, lng: 75.8610, order: 3 },
        { id: 's4', name: 'Hostel Zone', lat: 30.9055, lng: 75.8625, order: 4 },
        { id: 's5', name: 'Sports Ground', lat: 30.9035, lng: 75.8640, order: 5 },
        { id: 's6', name: 'Canteen', lat: 30.9015, lng: 75.8615, order: 6 },
      ]
    },
    {
      _id: 'route-002', name: 'City Link', description: 'College to city center route', color: '#10b981',
      stops: [
        { id: 's7', name: 'College Gate', lat: 30.9010, lng: 75.8573, order: 1 },
        { id: 's8', name: 'Bus Stand', lat: 30.9100, lng: 75.8500, order: 2 },
        { id: 's9', name: 'Railway Station', lat: 30.9200, lng: 75.8450, order: 3 },
        { id: 's10', name: 'City Center', lat: 30.9300, lng: 75.8400, order: 4 },
      ]
    }
  ]);

  await db.collection('buses').insertMany([
    {
      _id: 'bus-001', number: 'BUS-001', model: 'Tata Starbus', year: 2022,
      driverId: 'driver-001', routeId: 'route-001', status: 'active',
      occupancy: 0, capacity: 50, fuelLevel: 85, mileage: 12500,
      location: { lat: 30.9010, lng: 75.8573, address: 'Main Gate', timestamp: Date.now() },
      lastMaintenance: '2026-01-15', nextMaintenance: '2026-07-15',
      lastUpdate: new Date().toISOString(), createdAt: new Date().toISOString(),
    },
    {
      _id: 'bus-002', number: 'BUS-002', model: 'Ashok Leyland Eagle', year: 2021,
      driverId: 'driver-002', routeId: 'route-002', status: 'inactive',
      occupancy: 0, capacity: 45, fuelLevel: 60, mileage: 23400,
      location: { lat: 30.9100, lng: 75.8500, address: 'Bus Stand', timestamp: Date.now() },
      lastMaintenance: '2025-11-10', nextMaintenance: '2026-05-10',
      lastUpdate: new Date().toISOString(), createdAt: new Date().toISOString(),
    }
  ]);

  await db.collection('users').insertMany([
    { _id: 'driver-001', name: 'Rajesh Kumar', email: 'driver1@college.edu', password: 'driver123', role: 'driver', busId: 'bus-001', phone: '+91 9876543210', licenseNumber: 'DL-1234567890', experience: 5, status: 'active', joinedAt: new Date().toISOString() },
    { _id: 'driver-002', name: 'Suresh Singh', email: 'driver2@college.edu', password: 'driver123', role: 'driver', busId: 'bus-002', phone: '+91 9876543211', licenseNumber: 'DL-0987654321', experience: 3, status: 'active', joinedAt: new Date().toISOString() },
    { _id: 'student-001', name: 'Priya Sharma', email: 'student1@college.edu', password: 'student123', role: 'passenger', phone: '+91 9876543212', rollNumber: 'CS2021001', department: 'Computer Science', year: 3, registeredAt: new Date().toISOString() },
    { _id: 'admin-001', name: 'Admin User', email: 'admin@college.edu', password: 'admin123', role: 'admin', phone: '+91 9876500000' },
  ]);

  console.log('[MongoDB] Seed complete.');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function sendJSON(res, status, data) {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => body += c.toString());
    req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { resolve({}); } });
    req.on('error', reject);
  });
}

function genToken() { return crypto.randomBytes(32).toString('hex'); }
function genId(prefix) { return `${prefix}-${crypto.randomBytes(4).toString('hex')}`; }
function safe(user) { if (!user) return null; const { password, ...rest } = user; return rest; }
function norm(doc) { if (!doc) return null; const { _id, ...rest } = doc; return { id: _id, _id, ...rest }; }

// ─── In-memory location cache for real-time
const locCache = new Map();

// ─── WebSocket ────────────────────────────────────────────────────────────────
const wsClients = new Map();

function wsHandshake(key) {
  const acc = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  return `HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${acc}\r\n\r\n`;
}

function wsEncode(data) {
  const payload = Buffer.from(JSON.stringify(data), 'utf-8');
  const len = payload.length;
  let header;
  if (len < 126) header = Buffer.from([0x81, len]);
  else if (len < 65536) { header = Buffer.alloc(4); header[0] = 0x81; header[1] = 126; header.writeUInt16BE(len, 2); }
  else { header = Buffer.alloc(10); header[0] = 0x81; header[1] = 127; header.writeBigUInt64BE(BigInt(len), 2); }
  return Buffer.concat([header, payload]);
}

function wsDecode(buffer) {
  if (buffer.length < 2) return null;
  const masked = (buffer[1] & 0x80) !== 0;
  let plen = buffer[1] & 0x7f;
  let offset = 2;
  if (plen === 126) { if (buffer.length < 4) return null; plen = buffer.readUInt16BE(2); offset = 4; }
  else if (plen === 127) { if (buffer.length < 10) return null; plen = Number(buffer.readBigUInt64BE(2)); offset = 10; }
  if (masked) offset += 4;
  if (buffer.length < offset + plen) return null;
  let payload;
  if (masked) {
    const mask = buffer.slice(offset - 4, offset);
    payload = Buffer.alloc(plen);
    for (let i = 0; i < plen; i++) payload[i] = buffer[offset + i] ^ mask[i % 4];
  } else payload = buffer.slice(offset, offset + plen);
  return { opcode: buffer[0] & 0x0f, payload: payload.toString('utf-8'), consumed: offset + plen };
}

function send(socketId, event, data) {
  const c = wsClients.get(socketId);
  if (!c) return;
  try { c.socket.write(wsEncode({ event, data, timestamp: new Date().toISOString() })); } catch { wsClients.delete(socketId); }
}

function broadcast(event, data, excludeId = null) {
  wsClients.forEach((_, id) => { if (id !== excludeId) send(id, event, data); });
}

async function onWS(socketId, raw) {
  let msg; try { msg = JSON.parse(raw); } catch { return; }
  const { event, data } = msg;
  const c = wsClients.get(socketId);
  if (!c) return;

  if (event === 'driver:join') { c.busId = data.busId; c.userId = data.driverId; c.role = 'driver'; send(socketId, 'driver:joined', { busId: data.busId }); }
  if (event === 'bus:updateLocation') {
    const { busId, location } = data;
    const loc = { ...location, timestamp: Date.now() };
    locCache.set(busId, loc);
    if (db) await db.collection('buses').updateOne({ _id: busId }, { $set: { location: loc, lastUpdate: new Date().toISOString(), status: 'active' } });
    broadcast('bus:location', { busId, location: loc }, socketId);
    send(socketId, 'bus:locationAck', { busId });
  }
  if (event === 'bus:startTrip') {
    if (db) await db.collection('buses').updateOne({ _id: data.busId }, { $set: { status: 'active', driverStatus: 'on-trip' } });
    broadcast('bus:tripStarted', data); send(socketId, 'bus:tripStarted', data);
  }
  if (event === 'bus:endTrip') {
    if (db) await db.collection('buses').updateOne({ _id: data.busId }, { $set: { driverStatus: 'online' } });
    broadcast('bus:tripEnded', data); send(socketId, 'bus:tripEnded', data);
  }
  if (event === 'driver:statusUpdate') {
    const { busId, driverStatus, message } = data;
    // Persist driver status to DB
    if (db) {
      const statusSet = { driverStatus, lastUpdate: new Date().toISOString() };
      if (driverStatus === 'offline') statusSet.status = 'inactive';
      if (driverStatus === 'on-trip') statusSet.status = 'active';
      await db.collection('buses').updateOne({ _id: busId }, { $set: statusSet });
    }
    // Broadcast to all passengers
    broadcast('bus:driverStatusUpdate', { busId, driverStatus, message, timestamp: new Date().toISOString() }, socketId);
    send(socketId, 'driver:statusAck', { busId, driverStatus });
  }
  if (event === 'sos:send') {
    const alert = { id: genId('sos'), ...data, driverId: c.userId, location: locCache.get(data.busId) || null, timestamp: new Date().toISOString(), status: 'active' };
    if (db) await db.collection('sosAlerts').insertOne({ _id: alert.id, ...alert });
    broadcast('sos:alert', alert); send(socketId, 'sos:sent', { alertId: alert.id });
  }
  if (event === 'passenger:join') { c.role = 'passenger'; c.userId = data.userId; send(socketId, 'passenger:joined', {}); }
  if (event === 'ping') send(socketId, 'pong', { ts: Date.now() });
}

// ─── HTTP ─────────────────────────────────────────────────────────────────────
async function handleHTTP(req, res) {
  if (req.method === 'OPTIONS') { cors(res); res.writeHead(204); res.end(); return; }
  const parsed = url.parse(req.url, true);
  const p = parsed.pathname;
  const m = req.method;

  if (p === '/health') { sendJSON(res, 200, { status: 'ok', mongodb: !!db, clients: wsClients.size }); return; }

  // ── Auth
  if (p === '/api/auth/login' && m === 'POST') {
    const { email, password } = await readBody(req);
    if (!email || !password) { sendJSON(res, 400, { error: 'Email and password required' }); return; }
    const user = await db.collection('users').findOne({ email, password });
    if (!user) { sendJSON(res, 401, { error: 'Invalid email or password' }); return; }
    const token = genToken();
    await db.collection('sessions').insertOne({ token, userId: user._id, createdAt: new Date() });
    sendJSON(res, 200, { user: norm(safe(user)), token });
    return;
  }

  if (p === '/api/auth/register' && m === 'POST') {
    const { name, email, password, phone, rollNumber, department, year } = await readBody(req);
    if (!name || !email || !password) { sendJSON(res, 400, { error: 'Name, email and password required' }); return; }
    if (await db.collection('users').findOne({ email })) { sendJSON(res, 409, { error: 'Email already registered' }); return; }
    const u = { _id: genId('user'), name, email, password, role: 'passenger', phone: phone || '', rollNumber: rollNumber || '', department: department || '', year: year ? parseInt(year) : null, status: 'active', registeredAt: new Date().toISOString() };
    await db.collection('users').insertOne(u);
    const token = genToken();
    await db.collection('sessions').insertOne({ token, userId: u._id, createdAt: new Date() });
    sendJSON(res, 201, { user: norm(safe(u)), token });
    return;
  }

  // ── Buses
  if (p === '/api/buses' && m === 'GET') {
    const buses = await db.collection('buses').find({}).toArray();
    sendJSON(res, 200, buses.map(norm)); return;
  }
  const busOne = p.match(/^\/api\/buses\/([^/]+)$/);
  if (busOne && m === 'GET') { const b = await db.collection('buses').findOne({ _id: busOne[1] }); sendJSON(res, b ? 200 : 404, b ? norm(b) : { error: 'Not found' }); return; }

  const busLoc = p.match(/^\/api\/buses\/([^/]+)\/location$/);
  if (busLoc && m === 'POST') {
    const loc = await readBody(req); const locData = { ...loc, timestamp: Date.now() };
    await db.collection('buses').updateOne({ _id: busLoc[1] }, { $set: { location: locData, lastUpdate: new Date().toISOString(), status: 'active' } });
    locCache.set(busLoc[1], locData); broadcast('bus:location', { busId: busLoc[1], location: locData });
    sendJSON(res, 200, { success: true }); return;
  }

  // ── Routes
  if (p === '/api/routes' && m === 'GET') { sendJSON(res, 200, (await db.collection('routes').find({}).toArray()).map(norm)); return; }
  const routeOne = p.match(/^\/api\/routes\/([^/]+)$/);
  if (routeOne && m === 'GET') { const r = await db.collection('routes').findOne({ _id: routeOne[1] }); sendJSON(res, r ? 200 : 404, r ? norm(r) : { error: 'Not found' }); return; }

  // ── Stats
  if (p === '/api/stats' && m === 'GET') {
    const [totalBuses, activeBuses, totalDrivers, totalStudents, totalRoutes, pendingMaint, sosAlerts] = await Promise.all([
      db.collection('buses').countDocuments(),
      db.collection('buses').countDocuments({ status: 'active' }),
      db.collection('users').countDocuments({ role: 'driver' }),
      db.collection('users').countDocuments({ role: 'passenger' }),
      db.collection('routes').countDocuments(),
      db.collection('maintenance').countDocuments({ status: 'scheduled' }),
      db.collection('sosAlerts').countDocuments({ status: 'active' }),
    ]);
    sendJSON(res, 200, { totalBuses, activeBuses, totalDrivers, totalStudents, totalRoutes, pendingMaint, sosAlerts });
    return;
  }

  if (p === '/api/sos' && m === 'GET') { sendJSON(res, 200, (await db.collection('sosAlerts').find({}).sort({ timestamp: -1 }).limit(50).toArray()).map(norm)); return; }

  // ═══ ADMIN ════════════════════════════════════════════════════════════════

  // Buses
  if (p === '/api/admin/buses' && m === 'GET') { sendJSON(res, 200, (await db.collection('buses').find({}).toArray()).map(norm)); return; }
  if (p === '/api/admin/buses' && m === 'POST') {
    const body = await readBody(req);
    if (!body.number) { sendJSON(res, 400, { error: 'Bus number required' }); return; }
    if (await db.collection('buses').findOne({ number: body.number })) { sendJSON(res, 409, { error: 'Bus number already exists' }); return; }
    const bus = { _id: genId('bus'), ...body, driverId: null, routeId: null, occupancy: 0, fuelLevel: 100, mileage: 0, location: null, lastMaintenance: null, nextMaintenance: null, createdAt: new Date().toISOString(), lastUpdate: new Date().toISOString() };
    await db.collection('buses').insertOne(bus);
    sendJSON(res, 201, norm(bus)); return;
  }
  const admBus = p.match(/^\/api\/admin\/buses\/([^/]+)$/);
  if (admBus) {
    const { _id, id, ...body } = m !== 'DELETE' ? await readBody(req) : {};
    if (m === 'PUT') { await db.collection('buses').updateOne({ _id: admBus[1] }, { $set: { ...body, lastUpdate: new Date().toISOString() } }); sendJSON(res, 200, norm(await db.collection('buses').findOne({ _id: admBus[1] }))); return; }
    if (m === 'DELETE') { await db.collection('buses').deleteOne({ _id: admBus[1] }); sendJSON(res, 200, { success: true }); return; }
  }

  // Drivers
  if (p === '/api/admin/drivers' && m === 'GET') { sendJSON(res, 200, (await db.collection('users').find({ role: 'driver' }).toArray()).map(safe).map(norm)); return; }
  if (p === '/api/admin/drivers' && m === 'POST') {
    const body = await readBody(req);
    if (!body.name || !body.email) { sendJSON(res, 400, { error: 'Name and email required' }); return; }
    if (await db.collection('users').findOne({ email: body.email })) { sendJSON(res, 409, { error: 'Email already in use' }); return; }
    const driver = { _id: genId('driver'), ...body, role: 'driver', status: 'inactive', busId: null, joinedAt: new Date().toISOString() };
    if (!driver.password) driver.password = 'driver123';
    await db.collection('users').insertOne(driver);
    sendJSON(res, 201, norm(safe(driver))); return;
  }
  const admDriver = p.match(/^\/api\/admin\/drivers\/([^/]+)$/);
  if (admDriver) {
    if (m === 'PUT') { const { _id, id, password, ...body } = await readBody(req); await db.collection('users').updateOne({ _id: admDriver[1] }, { $set: body }); sendJSON(res, 200, norm(safe(await db.collection('users').findOne({ _id: admDriver[1] })))); return; }
    if (m === 'DELETE') { await db.collection('users').deleteOne({ _id: admDriver[1] }); sendJSON(res, 200, { success: true }); return; }
  }

  // Routes
  if (p === '/api/admin/routes' && m === 'GET') { sendJSON(res, 200, (await db.collection('routes').find({}).toArray()).map(norm)); return; }
  if (p === '/api/admin/routes' && m === 'POST') {
    const body = await readBody(req);
    if (!body.name) { sendJSON(res, 400, { error: 'Route name required' }); return; }
    const route = { _id: genId('route'), ...body, stops: body.stops || [], createdAt: new Date().toISOString() };
    await db.collection('routes').insertOne(route); sendJSON(res, 201, norm(route)); return;
  }

  // Schedules
  if (p === '/api/admin/schedules' && m === 'GET') { sendJSON(res, 200, (await db.collection('schedules').find({}).toArray()).map(norm)); return; }
  if (p === '/api/admin/schedules' && m === 'POST') {
    const body = await readBody(req);
    const sched = { _id: genId('sched'), ...body, status: 'active', createdAt: new Date().toISOString() };
    await db.collection('schedules').insertOne(sched); sendJSON(res, 201, norm(sched)); return;
  }

  // Maintenance
  if (p === '/api/admin/maintenance' && m === 'GET') { sendJSON(res, 200, (await db.collection('maintenance').find({}).sort({ scheduledDate: 1 }).toArray()).map(norm)); return; }
  if (p === '/api/admin/maintenance' && m === 'POST') {
    const body = await readBody(req);
    if (!body.busId || !body.scheduledDate) { sendJSON(res, 400, { error: 'Bus and date required' }); return; }
    const bus = await db.collection('buses').findOne({ _id: body.busId });
    const maint = { _id: genId('maint'), ...body, busNumber: bus ? bus.number : '', status: 'scheduled', createdAt: new Date().toISOString() };
    await db.collection('maintenance').insertOne(maint);
    if (bus) await db.collection('buses').updateOne({ _id: body.busId }, { $set: { nextMaintenance: body.scheduledDate } });
    sendJSON(res, 201, norm(maint)); return;
  }
  const admMaint = p.match(/^\/api\/admin\/maintenance\/([^/]+)$/);
  if (admMaint && m === 'PUT') {
    const { _id, id, ...body } = await readBody(req);
    await db.collection('maintenance').updateOne({ _id: admMaint[1] }, { $set: body });
    const updated = await db.collection('maintenance').findOne({ _id: admMaint[1] });
    if (body.status === 'completed' && updated) {
      await db.collection('buses').updateOne({ _id: updated.busId }, { $set: { lastMaintenance: new Date().toISOString(), status: 'active' } });
    }
    sendJSON(res, 200, norm(updated)); return;
  }

  // Assign route (with startRoute, endRoute support)
  if (p === '/api/admin/assign-route' && m === 'POST') {
    const { busId, routeId, driverId, startRoute, endRoute } = await readBody(req);
    if (!busId) { sendJSON(res, 400, { error: 'busId required' }); return; }
    const upd = { lastUpdate: new Date().toISOString() };
    if (routeId !== undefined) upd.routeId = routeId;
    if (driverId !== undefined) upd.driverId = driverId;
    if (startRoute !== undefined) upd.startRoute = startRoute;
    if (endRoute !== undefined) upd.endRoute = endRoute;
    await db.collection('buses').updateOne({ _id: busId }, { $set: upd });
    if (driverId) await db.collection('users').updateOne({ _id: driverId }, { $set: { busId, status: 'active' } });
    const bus = await db.collection('buses').findOne({ _id: busId });
    // Fetch driver name for broadcast
    let driverName = null;
    if (bus && bus.driverId) {
      const driver = await db.collection('users').findOne({ _id: bus.driverId });
      if (driver) driverName = driver.name;
    }
    broadcast('bus:routeAssigned', { busId, routeId, driverId, startRoute: bus?.startRoute, endRoute: bus?.endRoute, driverName });
    sendJSON(res, 200, { success: true, bus: norm(bus) }); return;
  }

  // Admin: set bus active/inactive
  if (p === '/api/admin/buses/status' && m === 'POST') {
    const { busId, status } = await readBody(req);
    if (!busId || !status) { sendJSON(res, 400, { error: 'busId and status required' }); return; }
    if (!['active', 'inactive', 'maintenance'].includes(status)) { sendJSON(res, 400, { error: 'Invalid status' }); return; }
    await db.collection('buses').updateOne({ _id: busId }, { $set: { status, lastUpdate: new Date().toISOString() } });
    const bus = await db.collection('buses').findOne({ _id: busId });
    broadcast('bus:statusChanged', { busId, status });
    sendJSON(res, 200, { success: true, bus: norm(bus) }); return;
  }

  // Broadcast
  if (p === '/api/admin/broadcast' && m === 'GET') { sendJSON(res, 200, (await db.collection('messages').find({}).sort({ timestamp: -1 }).limit(20).toArray()).map(norm)); return; }
  if (p === '/api/admin/broadcast' && m === 'POST') {
    const body = await readBody(req);
    if (!body.message) { sendJSON(res, 400, { error: 'Message required' }); return; }
    const msg = { _id: genId('msg'), ...body, timestamp: new Date().toISOString() };
    await db.collection('messages').insertOne(msg);
    broadcast('admin:broadcast', norm(msg));
    sendJSON(res, 201, norm(msg)); return;
  }

  // Reports
  if (p === '/api/admin/reports' && m === 'GET') { sendJSON(res, 200, (await db.collection('reports').find({}).sort({ generatedAt: -1 }).toArray()).map(norm)); return; }
  if (p === '/api/admin/reports' && m === 'POST') {
    const body = await readBody(req);
    const [buses, drivers, students, maint] = await Promise.all([
      db.collection('buses').find({}).toArray(),
      db.collection('users').find({ role: 'driver' }).toArray(),
      db.collection('users').find({ role: 'passenger' }).toArray(),
      db.collection('maintenance').find({}).toArray(),
    ]);
    const reportData = {
      summary: {
        totalBuses: buses.length, activeBuses: buses.filter(b => b.status === 'active').length,
        totalDrivers: drivers.length, totalStudents: students.length,
        maintenanceScheduled: maint.filter(m => m.status === 'scheduled').length,
        maintenanceCompleted: maint.filter(m => m.status === 'completed').length,
      },
      buses: buses.map(b => ({ id: b._id, number: b.number, status: b.status, capacity: b.capacity, model: b.model })),
    };
    const report = { _id: genId('report'), ...body, data: reportData, status: 'completed', generatedAt: new Date().toISOString() };
    await db.collection('reports').insertOne(report);
    sendJSON(res, 201, norm(report)); return;
  }
  const rptOne = p.match(/^\/api\/admin\/reports\/([^/]+)$/);
  if (rptOne && m === 'GET') { const r = await db.collection('reports').findOne({ _id: rptOne[1] }); sendJSON(res, r ? 200 : 404, r ? norm(r) : { error: 'Not found' }); return; }

  // Users
  if (p === '/api/admin/users' && m === 'GET') { sendJSON(res, 200, (await db.collection('users').find({}).toArray()).map(safe).map(norm)); return; }
  const admUser = p.match(/^\/api\/admin\/users\/([^/]+)$/);
  if (admUser) {
    if (m === 'DELETE') { await db.collection('users').deleteOne({ _id: admUser[1] }); sendJSON(res, 200, { success: true }); return; }
    if (m === 'PUT') { const { _id, id, password, ...body } = await readBody(req); await db.collection('users').updateOne({ _id: admUser[1] }, { $set: body }); sendJSON(res, 200, norm(safe(await db.collection('users').findOne({ _id: admUser[1] })))); return; }
  }

  sendJSON(res, 404, { error: `Cannot ${m} ${p}` });
}

// ─── Server ───────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  try {
    if (!db) { cors(res); sendJSON(res, 503, { error: 'MongoDB not connected. Run MongoDB first.' }); return; }
    await handleHTTP(req, res);
  } catch (err) {
    console.error('[HTTP Error]', err.message, err.stack);
    sendJSON(res, 500, { error: 'Internal server error', detail: err.message });
  }
});

server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) { socket.destroy(); return; }
  const socketId = crypto.randomBytes(8).toString('hex');
  socket.write(wsHandshake(key));
  let buffer = Buffer.alloc(0);
  const client = { socket, socketId, role: 'guest', userId: null, busId: null };
  wsClients.set(socketId, client);
  console.log(`[WS] Connect: ${socketId} (${wsClients.size} total)`);

  setTimeout(async () => {
    if (!db) return;
    const [buses, routes] = await Promise.all([
      db.collection('buses').find({}).toArray(),
      db.collection('routes').find({}).toArray(),
    ]);
    send(socketId, 'connected', { socketId, buses: buses.map(norm), routes: routes.map(norm) });
  }, 50);

  socket.on('data', data => {
    buffer = Buffer.concat([buffer, data]);
    while (buffer.length >= 2) {
      const opcode = buffer[0] & 0x0f;
      if (opcode === 0x8) { socket.destroy(); return; }
      if (opcode === 0x9) { socket.write(Buffer.from([0x8a, 0x00])); buffer = buffer.slice(2); continue; }
      const frame = wsDecode(buffer);
      if (!frame) break;
      buffer = buffer.slice(frame.consumed);
      if (frame.opcode === 0x1 || frame.opcode === 0x2) onWS(socketId, frame.payload);
    }
  });
  socket.on('close', () => {
    wsClients.delete(socketId);
    if (client.busId && db) {
      db.collection('buses').updateOne({ _id: client.busId }, { $set: { status: 'inactive', driverStatus: 'offline' } });
      broadcast('bus:driverOffline', { busId: client.busId });
      broadcast('bus:driverStatusUpdate', { busId: client.busId, driverStatus: 'offline', message: 'Driver disconnected', timestamp: new Date().toISOString() });
    }
  });
  socket.on('error', () => wsClients.delete(socketId));
});

(async () => {
  const ok = await connectMongo();
  server.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║     🚌  Bus Tracking Server (MongoDB)      ║');
    console.log('╠═══════════════════════════════════════════╣');
    console.log(`║  HTTP → http://localhost:${PORT}/api          ║`);
    console.log(`║  WS   → ws://localhost:${PORT}                ║`);
    console.log(`║  DB   → ${ok ? '✅ MongoDB Connected       ' : '❌ MongoDB NOT Connected'}  ║`);
    console.log('╠═══════════════════════════════════════════╣');
    console.log('║  admin@college.edu / admin123             ║');
    console.log('║  driver1@college.edu / driver123          ║');
    console.log('║  student1@college.edu / student123        ║');
    console.log('╚═══════════════════════════════════════════╝');
  });
})();

process.on('SIGINT', async () => {
  console.log('\n[Server] Shutdown...');
  wsClients.forEach(c => { try { c.socket.destroy(); } catch {} });
  if (mongoClient) await mongoClient.close();
  server.close(() => process.exit(0));
});
process.on('uncaughtException', err => console.error('[Uncaught]', err.message));
process.on('unhandledRejection', reason => console.error('[Rejection]', reason));

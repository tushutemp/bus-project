# 🚌 College Bus Tracking System

Real-time GPS bus tracking for students and drivers — runs entirely on localhost.

---

## 📁 Project Structure

```
bus-tracking-backend/    ← Backend server (pure Node.js, no npm needed)
  └── server.js          ← Single file server

bus-tracking/            ← Your existing React frontend (unchanged)
  └── src/
      └── services/
          └── wsAdapter.js  ← Added: WebSocket adapter (replaces socket.io)
```

---

## ⚡ Quick Start

### Step 1 — Start the Backend Server

```bash
cd bus-tracking-backend
node server.js
```

You should see:
```
╔════════════════════════════════════════╗
║     🚌  Bus Tracking Server Ready      ║
╚════════════════════════════════════════╝
```

**Keep this terminal open.**

---

### Step 2 — Start the Frontend

Open a **second terminal**:

```bash
cd bus-tracking
npm install
npm run dev
```

Open browser → **http://localhost:5173**

---

## 🔑 Demo Login Credentials

| Role    | Email                    | Password   |
|---------|--------------------------|------------|
| Driver  | driver1@college.edu      | driver123  |
| Student | student1@college.edu     | student123 |
| Admin   | admin@college.edu        | admin123   |

---

## 📱 How Live GPS Tracking Works

```
Driver's Phone/Laptop
      ↓  (Browser GPS API)
  Driver Dashboard
      ↓  (WebSocket every 5 sec)
  Backend Server  ←→  ws://localhost:3001
      ↓  (broadcast to all connected students)
  Student Dashboard
      ↓  (updates map marker in real time)
  Live Map 🗺️
```

### For the Driver:
1. Open **http://localhost:5173/driver** on the driver's device
2. Allow location permission when browser asks
3. Click **"Go Online"** → trip gets assigned
4. Click **"Start Trip"** → GPS starts broadcasting every 5 seconds
5. All students see the bus move on the map in real time

### For Students:
1. Open **http://localhost:5173/passenger** on any device on the same WiFi
2. The map shows all active buses with live locations
3. Green dot = live tracking active

### For Demo on Same Computer:
- Open `/driver` in one browser tab
- Open `/passenger` in another tab
- Start a trip in driver tab → watch the bus appear and move on passenger tab

---

## 🌐 Network: Access from Other Devices

All devices must be on the **same WiFi network**.

1. Find your laptop's local IP:
   - Windows: `ipconfig` → look for IPv4 Address (e.g., `192.168.1.5`)
   - Mac/Linux: `ifconfig` or `ip addr`

2. Students open: `http://192.168.1.5:5173`
3. Backend is already listening on `0.0.0.0:3001` (accessible to all)

> **Vite note:** Edit `vite.config.js` and add `server: { host: true }` to make frontend accessible from other devices.

---

## 🔌 API Reference

### REST Endpoints (HTTP)

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Server health + connected clients |
| POST | /api/auth/login | Login with email + password |
| POST | /api/auth/register | Register new user |
| GET | /api/buses | Get all buses |
| GET | /api/buses/:id | Get specific bus |
| POST | /api/buses/:id/location | Update bus location (REST fallback) |
| GET | /api/buses/:id/history | Get location history |
| GET | /api/routes | Get all routes |
| GET | /api/routes/:id | Get specific route |
| GET | /api/routes/:id/stops | Get route stops |
| GET | /api/stats | Admin stats |
| GET | /api/sos | All SOS alerts |

### WebSocket Events

**Client → Server:**
| Event | Data | Description |
|-------|------|-------------|
| `bus:updateLocation` | `{busId, location}` | Driver sends GPS coords |
| `bus:startTrip` | `{busId, routeId}` | Start a trip |
| `bus:endTrip` | `{busId}` | End a trip |
| `bus:sos` | `{busId, location, type, message}` | Send SOS alert |
| `bus:getAll` | — | Get all buses |
| `subscribe:bus` | `{busId}` | Subscribe to bus updates |
| `subscribe:route` | `{routeId}` | Subscribe to route updates |

**Server → Client:**
| Event | Data | Description |
|-------|------|-------------|
| `connected` | `{socketId, buses, routes}` | Initial data on connect |
| `bus:location` | `{busId, location, bus}` | Live location update |
| `bus:tripStarted` | `{busId, bus}` | Trip started |
| `bus:tripEnded` | `{busId, bus}` | Trip ended |
| `bus:driverOffline` | `{busId}` | Driver disconnected |
| `sos:alert` | alert object | SOS from a driver |

---

## 🛠 Troubleshooting

**"Cannot connect to server"**
- Make sure `node server.js` is running in backend folder
- Check it shows port 3001 in output

**"GPS not working"**
- On desktop: GPS uses IP-based location (less accurate but works)
- On mobile: Must access via your laptop's local IP (not localhost)
- Chrome may block GPS on non-HTTPS. Use Firefox or allow insecure location in Chrome flags

**"Map not showing"**
- Leaflet needs internet to load map tiles (OpenStreetMap)
- On localhost this works fine; tiles load from osm.org

**"Bus not appearing on student map"**
- Driver must click "Start Trip" (not just "Go Online")
- Check browser console for WebSocket errors
- Both tabs must connect to the same server

---

## 🏗 Technical Details

- **Backend:** Pure Node.js built-in modules only (`http`, `crypto`, `url`) — no npm install needed
- **WebSocket:** Custom RFC 6455 implementation — no socket.io on server
- **Frontend Adapter:** `wsAdapter.js` mimics socket.io-client API exactly — all existing hooks work unchanged
- **Data:** In-memory (resets on server restart) — perfect for college demo
- **Frontend:** React + Vite + Leaflet (your original code, untouched)

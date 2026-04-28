# 🚌 Bus Tracking System — MongoDB Setup Guide

## What Changed in This Update

### ✅ Backend (MongoDB Integration)
- Full MongoDB database replacing the old JSON file storage
- All data (buses, drivers, students, schedules, maintenance, routes, reports) stored in MongoDB
- Login compares credentials against MongoDB — no more hardcoded in-memory data
- Student registration saves full profile data to MongoDB
- Real-time stats (`/api/stats`) count live records from DB

### ✅ Frontend Changes
1. **Driver Dashboard** — Profile dropdown (top-right) showing driver name, email, bus ID, logout button
2. **Admin Dashboard** — Profile dropdown with live MongoDB stats, logout button
3. **Admin → Fleet Management** — Fetches live bus data from MongoDB (auto-refreshes every 15s)
4. **Admin → Analytics** — Shows live stats bar pulled from MongoDB
5. **Admin → User Management** — Shows all real users from MongoDB (drivers, students, admins)
6. **Admin Quick Actions** — Added "Create Schedule" button → saves to MongoDB
7. **Register Page** — Student fields (roll number, department, year) now saved to MongoDB

---

## Step 1: Install MongoDB

### Option A — MongoDB Community (Local)
```bash
# macOS
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update && sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

### Option B — MongoDB Atlas (Cloud, Free)
1. Go to https://www.mongodb.com/atlas
2. Create free cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/`
4. Set in backend: `MONGO_URI=your_connection_string`

---

## Step 2: Run the Backend

```bash
cd "bus project/backend"

# Install MongoDB driver
npm install

# Start the server
node server.js
```

**Expected output:**
```
╔═══════════════════════════════════════════╗
║     🚌  Bus Tracking Server (MongoDB)      ║
╠═══════════════════════════════════════════╣
║  HTTP → http://localhost:3001/api          ║
║  WS   → ws://localhost:3001                ║
║  DB   → ✅ MongoDB Connected               ║
╠═══════════════════════════════════════════╣
║  admin@college.edu / admin123             ║
║  driver1@college.edu / driver123          ║
║  student1@college.edu / student123        ║
╚═══════════════════════════════════════════╝
```

---

## Step 3: Run the Frontend

```bash
cd "bus project/frontend"
npm install
npm run dev
```

Open: http://localhost:5173

---

## MongoDB Collections Created

| Collection    | Description                              |
|---------------|------------------------------------------|
| `users`       | Drivers, students, admins (with full profile) |
| `buses`       | All buses with live location             |
| `routes`      | Bus routes with stops                    |
| `schedules`   | Bus timetables                           |
| `maintenance` | Service records                          |
| `sosAlerts`   | Emergency alerts                         |
| `messages`    | Broadcast messages                       |
| `reports`     | Generated fleet reports                  |
| `sessions`    | Auth tokens (auto-expire 24h)            |

---

## Environment Variables (Optional)

```bash
# .env in backend/
MONGO_URI=mongodb://localhost:27017    # default
PORT=3001                              # default
```

---

## Demo Login Credentials

| Role    | Email                    | Password    |
|---------|--------------------------|-------------|
| Admin   | admin@college.edu        | admin123    |
| Driver  | driver1@college.edu      | driver123   |
| Student | student1@college.edu     | student123  |

---

## New Features Summary

### Driver Profile (Top-Right Dropdown)
- Shows driver name, email, bus ID
- Reads from logged-in session (MongoDB auth)
- Logout button clears session and redirects to login

### Admin Profile (Top-Right Dropdown)  
- Shows admin name, email
- Shows live stats (total buses, total students)
- Logout button

### Student Registration → MongoDB
Fields saved: name, email, password, phone, rollNumber, department, year, semester, enrollmentYear

### Admin Panel → All Live Data
- Fleet Management: live bus list from MongoDB
- Analytics: live counts from MongoDB
- User Management: all users from MongoDB (can delete users)
- Reports: generated and stored in MongoDB
- Schedules: created and stored in MongoDB

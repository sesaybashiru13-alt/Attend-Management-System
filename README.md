# AMS PRO — Attendance Management System

A fully client-side, dark-themed Attendance Management System built with vanilla HTML, CSS, and JavaScript. No frameworks, no build tools, no dependencies beyond Google Fonts and Lucide Icons (both loaded via CDN).

---

## 📁 Project Structure

```
ams-pro/
├── index.html      # All markup and page structure
├── style.css       # Design tokens, component styles, animations
├── script.js       # App logic, mock data, routing, interactions
└── README.md       # This file
```

> A self-contained single-file version (`ams-pro.html`) is also included for quick preview — it has the CSS and JS inlined.

---

## 🚀 Getting Started

No installation or build step required.

1. Download all four files into the same folder.
2. Open `index.html` in any modern browser.
3. Log in with one of the demo credentials below.

```
Admin account
  Email:    admin@ams.com
  Password: admin123

Employee account
  Email:    bash@ams.com
  Password: bash123
```

---

## 🖥️ Pages & Features

### 🔐 Login — `Security Gateway`
- Role toggle between **Admin** and **Employee** (auto-fills credentials)
- Email + password validation against the mock user store
- Animated grid background with radial glow effect
- `Enter` key triggers login
- Inline error message on bad credentials

---

### 📊 Dashboard
**Admin view**
- Total active employee count
- Present Today status
- Company-wide attendance rate
- Late Today count
- Critical alert banner when attendance drops below 75%

**Employee view**
- Personal total days worked
- Today's check-in status
- Individual attendance rate
- Late days count
- Warning banner when personal attendance is below 75%
- Recent attendance table (date, check-in, check-out, duration, status badge)

---

### 📅 Attendance — `Status Hub`
- Live real-time clock (HH:MM:SS) and current date
- **CHECK IN** button — records check-in time, adds an Active Log entry
- **CHECK OUT** button — closes the active log entry
- Current check-in status label updates dynamically
- **Active Days** counter
- **Tardy Events** counter
- **Temporal Logs** table showing the last 30 attendance cycles:
  - Calendar Date
  - Temporal Interval (check-in ↔ check-out)
  - Session Magnitude (hours worked, or `ACTIVE LOG` if open)
  - Protocol Method (Web Portal / System Auto)

---

### 📋 Leave Requests — `Leave Management`
- Current leave balance chip (top right)
- **Request Protocol** form:
  - Absence Type dropdown (Personal, Casual, Sick, Vacation, Maternity)
  - Date Initiation + Date Termination pickers
  - Rational/Motivation textarea
  - Submit button with validation
- **Managerial Command** panel *(Admin only)*: approve ✓ or reject ✗ pending employee requests
- **Protocol History** table: all past leave requests with type, date range, and reason

---

### 👤 My Profile
- Avatar with first-letter monogram
- Full Name, Role, Email, Department, Employee ID, Join Date

---

### 📈 Reports *(Admin only)*
- Filter controls: Report Type, Month, Employee
- Generate button triggers a success toast
- Sample monthly attendance table with present/late/absent days and attendance percentage badges

---

### 👥 Users *(Admin only)*
- Full user table: name, role, email, status badge, edit action
- **Invite User** button (toast placeholder — ready to wire to a backend)

---

## 🗂️ Data Layer (`script.js → DB`)

All data lives in a plain JavaScript object called `DB`. In a production app, replace each section with API calls.

```js
DB.users          // email → { password, role, name, id }
DB.attendance     // email → [ { date, checkIn, checkOut, magnitude, method } ]
DB.leaves         // email → [ { type, start, end, reason } ]
DB.pendingLeaves  // [ { id, name, type, start, end } ]
```

### Adding a new user
Add an entry to `DB.users` in `script.js`:
```js
"newuser@company.com": {
  password: "secret",
  role: "employee",   // "admin" or "employee"
  name: "Jane Doe",
  id: "EMP-003"
}
```

---

## 🎨 Design System (`style.css`)

All visual tokens are CSS custom properties at the top of `style.css`. Change one value to update the entire UI.

| Token | Default | Purpose |
|---|---|---|
| `--bg-root` | `#0b0d14` | Page background |
| `--bg-card` | `#111520` | Card/panel background |
| `--accent-primary` | `#5b5ef4` | Buttons, active nav, links |
| `--accent-green` | `#00e5a0` | Present badges, success states |
| `--accent-amber` | `#f59e0b` | Late badges, warnings |
| `--accent-red` | `#ef4444` | Absent badges, errors, logout |
| `--font-display` | `Syne` | Headings and titles |
| `--font-mono` | `JetBrains Mono` | Data, labels, inputs |

---

## ⚙️ Key JavaScript Functions

| Function | Description |
|---|---|
| `doLogin()` | Validates credentials and initialises the app |
| `doLogout()` | Clears session and returns to login |
| `navigate(navItem)` | Switches between views inside the app shell |
| `initApp()` | Runs after login — populates all views for the current user |
| `startClock()` | Starts the live HH:MM:SS ticker in the Status Hub |
| `doCheckIn()` | Records a check-in, adds an Active Log entry to DB |
| `doCheckOut()` | Closes the latest Active Log with a check-out time |
| `renderTemporalLogs(email)` | Populates the Temporal Logs table |
| `submitLeave()` | Validates and submits a leave request |
| `approveLeave(id, action)` | Admin approve/reject a pending leave |
| `renderPendingLeaves()` | Renders the Managerial Command panel |
| `renderUsersTable()` | Populates the Users admin table |
| `showToast(msg, type)` | Shows a temporary notification (`success` \| `warning` \| `error`) |

---

## 🔒 Role-Based Access

| Feature | Admin | Employee |
|---|---|---|
| Admin Dashboard | ✅ | ❌ |
| Employee Dashboard | ❌ | ✅ |
| Attendance (own) | ✅ | ✅ |
| Leave Request (submit) | ✅ | ✅ |
| Managerial Command (approve/reject) | ✅ | ❌ |
| Reports | ✅ | ❌ |
| Users | ✅ | ❌ |

---

## 🔧 Connecting to a Real Backend

The mock `DB` object in `script.js` maps directly to REST endpoints. Replace each section as follows:

```js
// BEFORE (mock)
const user = DB.users[email];

// AFTER (real API)
const res  = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
const user = await res.json();
```

Apply the same pattern for attendance logs, leave requests, and user management.

---

## 🌐 Browser Support

Works in all modern browsers (Chrome, Firefox, Edge, Safari). No polyfills needed.

---

## 📄 License

MIT — free to use, modify, and distribute.
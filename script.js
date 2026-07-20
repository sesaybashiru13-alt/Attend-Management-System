/* ──────────────────────────────────────────────────────────
   MOCK DATA STORE
   In production this would be fetched from a REST API.
   All user records, attendance logs, and leave records
   are stored here and mutated by user actions.
────────────────────────────────────────────────────────── */
const DB = {
  // Credential map: email → { password, role, name }
  users: {
    "admin@ams.com":    { password:"admin123",    role:"admin",    name:"Admin",   id:"EMP-001" },
    "bash@ams.com":     { password:"bash123",     role:"employee", name:"bash",    id:"EMP-002" },
  },

  // Attendance logs per user (array of log objects)
  attendance: {
    "admin@ams.com": [
      { date:"2026-02-14", checkIn:"10:36", checkOut:null,    magnitude:"ACTIVE LOG", method:"Web Portal" },
      { date:"2026-02-13", checkIn:"00:41", checkOut:null,    magnitude:"ACTIVE LOG", method:"Web Portal" },
      { date:"2026-02-12", checkIn:"12:27", checkOut:"12:30", magnitude:"0.05 HR",    method:"Web Portal" },
      { date:"2026-02-12", checkIn:"12:27", checkOut:null,    magnitude:"ACTIVE LOG", method:"Web Portal" },
    ],
    "bash@ams.com": [
      { date:"2026-02-19", checkIn:null,    checkOut:null,    magnitude:"ACTIVE LOG", method:"System Auto" },
      { date:"2026-02-14", checkIn:"10:44", checkOut:null,    magnitude:"ACTIVE LOG", method:"Web Portal" },
      { date:"2026-02-12", checkIn:"12:45", checkOut:"12:48", magnitude:"0.04 HR",    method:"Web Portal" },
    ]
  },

  // Leave history per user
  leaves: {
    "admin@ams.com": [
      { type:"CASUAL", start:"2026-03-04", end:"2026-04-03", reason:"i will be out of the country" },
      { type:"SICK",   start:"2026-02-10", end:"2026-02-15", reason:"vgcjvvjkg hfjgfkgkj" },
    ],
    "bash@ams.com": [
      { type:"VACATION", start:"2026-03-03", end:"2026-04-04", reason:"Annual vacation" },
    ]
  },

  // Pending leave approvals (admin sees these)
  pendingLeaves: [
    { id:1, name:"Admin",  type:"CASUAL",   start:"2026-03-04", end:"2026-04-03" },
    { id:2, name:"bash",   type:"VACATION", start:"2026-03-03", end:"2026-04-04" },
  ]
};

/* ──────────────────────────────────────────────────────────
   APP STATE
────────────────────────────────────────────────────────── */
let currentUser   = null;   // set on login
let selectedRole  = "admin"; // tracks role toggle on login screen
let checkedIn     = false;   // tracks check-in status per session

/* ──────────────────────────────────────────────────────────
   LOGIN / LOGOUT
────────────────────────────────────────────────────────── */

/** Called by role toggle buttons on the login screen */
function selectRole(btn) {
  document.querySelectorAll(".role-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  selectedRole = btn.dataset.role;

  // Pre-fill default credentials for convenience
  if (selectedRole === "admin") {
    document.getElementById("login-email").value = "admin@ams.com";
    document.getElementById("login-pass").value  = "admin123";
  } else {
    document.getElementById("login-email").value = "bash@ams.com";
    document.getElementById("login-pass").value  = "bash123";
  }
}


/** Attempts login against the mock DB */
function doLogin() {
  const email = document.getElementById("login-email").value.trim();
  const pass  = document.getElementById("login-pass").value;
  const err   = document.getElementById("login-error");

  // Look up user record
     // Look up user record
  const user = DB.users[email];
  if (!user || user.password !== pass) {
    err.classList.add("show");
    return;
  }
  err.classList.remove("show");

  // Store current user in memory
  currentUser = { email, ...user };

  // Switch pages
  showPage("page-app");
  initApp();
}

/** Called by logout button */
function doLogout() {
  currentUser = null;
  checkedIn   = false;
  showPage("page-login");
  // Reset to dashboard nav
  navigate(document.querySelector('[data-view="dashboard"]'));
}

/* ──────────────────────────────────────────────────────────
   PAGE / VIEW ROUTING
────────────────────────────────────────────────────────── */

/** Shows the specified page by id, hides all others */
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("page--active"));
  document.getElementById(id).classList.add("page--active");
}

/** Navigates to a view inside the app shell.
    Called by clicking sidebar nav items. */
function navigate(navItem) {
  if (!navItem) return;
  const viewName = navItem.dataset.view;

  // Update nav highlight
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  navItem.classList.add("active");

  // Show correct view
  document.querySelectorAll(".view").forEach(v => v.classList.remove("view--active"));
  document.getElementById("view-" + viewName).classList.add("view--active");
}

/* ──────────────────────────────────────────────────────────
   APP INITIALIZATION (runs after login)
────────────────────────────────────────────────────────── */
function initApp() {
  const { name, role, email } = currentUser;

  // ── Sidebar user chip ──
  document.getElementById("sidebar-avatar").textContent   = name[0].toUpperCase();
  document.getElementById("sidebar-username").textContent = name;
  document.getElementById("sidebar-role").textContent     = role === "admin" ? "Administrator" : "Employee";

  // ── Show/hide admin nav items ──
  const adminNav = document.getElementById("admin-nav");
  adminNav.style.display = role === "admin" ? "" : "none";

  // ── Dashboard: show appropriate panel ──
  document.getElementById("admin-dashboard").style.display    = role === "admin" ? "" : "none";
  document.getElementById("employee-dashboard").style.display = role === "employee" ? "" : "none";

  if (role === "employee") {
    document.getElementById("emp-welcome").textContent = "Welcome back, " + name + "!";
    renderEmpRecentAttendance(email);
  } else {
    // Admin: show employee count
    document.getElementById("admin-total-emp").textContent =
      Object.keys(DB.users).filter(e => DB.users[e].role === "employee").length;
  }

  // ── Attendance view ──
  renderTemporalLogs(email);
  setAttendanceStats(email);

  // ── Leave view ──
  renderLeaveHistory(email);
  // Admin sees Managerial Command section
  const manCmd = document.getElementById("managerial-command");
  if (role === "admin") {
    manCmd.style.display = "";
    renderPendingLeaves();
  } else {
    manCmd.style.display = "none";
  }

  // ── Profile view ──
  document.getElementById("profile-avatar-lg").textContent = name[0].toUpperCase();
  document.getElementById("profile-fullname").textContent  = name;
  document.getElementById("profile-role-label").textContent = role === "admin" ? "Administrator" : "Employee";
  document.getElementById("profile-name-val").textContent  = name;
  document.getElementById("profile-role-val").textContent  = role === "admin" ? "Administrator" : "Employee";
  document.getElementById("profile-email-val").textContent = email;
  document.getElementById("profile-id-val").textContent    = currentUser.id;

  // ── Users table (admin only) ──
  renderUsersTable();

  // ── Start the clock ──
  startClock();
}

/* ──────────────────────────────────────────────────────────
   CLOCK  (updates every second in the Attendance Status Hub)
────────────────────────────────────────────────────────── */
let clockInterval = null;

function startClock() {
  if (clockInterval) clearInterval(clockInterval);
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
}

function updateClock() {
  const now = new Date();
  // HH:MM:SS
  const hms = now.toLocaleTimeString("en-GB", { hour12:false });
  document.getElementById("hub-clock").textContent = hms;
  // Day, DD Month YYYY
  document.getElementById("hub-date").textContent =
    now.toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
}

/* ──────────────────────────────────────────────────────────
   CHECK IN / CHECK OUT
────────────────────────────────────────────────────────── */
function doCheckIn() {
  if (checkedIn) { showToast("Already checked in!", "warning"); return; }
  checkedIn = true;
  const now = new Date();
  const time = now.toLocaleTimeString("en-GB", { hour12:false, hour:"2-digit", minute:"2-digit" });

  // Update status hub label
  document.getElementById("hub-checkin-status").textContent = "CHECKED IN — " + time;

  // Add log to mock DB
  const log = {
    date: now.toISOString().slice(0,10),
    checkIn: time, checkOut: null,
    magnitude: "ACTIVE LOG", method: "Web Portal"
  };
  DB.attendance[currentUser.email].unshift(log);
  renderTemporalLogs(currentUser.email);
  setAttendanceStats(currentUser.email);

  showToast("Checked in successfully at " + time, "success");
}

function doCheckOut() {
  if (!checkedIn) { showToast("You are not checked in.", "warning"); return; }
  checkedIn = false;
  const now  = new Date();
  const time = now.toLocaleTimeString("en-GB", { hour12:false, hour:"2-digit", minute:"2-digit" });

  // Update the most recent ACTIVE LOG entry
  const logs = DB.attendance[currentUser.email];
  const active = logs.find(l => l.magnitude === "ACTIVE LOG" && !l.checkOut);
  if (active) {
    active.checkOut  = time;
    active.magnitude = "0.00 HR"; // simplified; real app would calculate duration
  }

  document.getElementById("hub-checkin-status").textContent = "NOT CHECKED IN";
  renderTemporalLogs(currentUser.email);
  showToast("Checked out at " + time, "success");
}

/* ──────────────────────────────────────────────────────────
   RENDER: TEMPORAL LOGS TABLE
────────────────────────────────────────────────────────── */
function renderTemporalLogs(email) {
  const logs  = DB.attendance[email] || [];
  const tbody = document.getElementById("temporal-logs-tbody");
  tbody.innerHTML = "";

  logs.slice(0, 30).forEach(log => {
    const inStr  = log.checkIn  || "--:--";
    const outStr = log.checkOut || "--:--";
    const isActive = log.magnitude === "ACTIVE LOG";

    tbody.innerHTML += `
      <tr>
        <td class="text-mono">${log.date}</td>
        <td>
          <div class="temporal-interval">
            <span class="text-mono">${inStr}</span>
            <span class="temporal-arrow">↔</span>
            <span class="text-mono">${outStr}</span>
          </div>
        </td>
        <td>
          <span class="${isActive ? "magnitude-active" : "magnitude-hours"}">
            ${log.magnitude}
          </span>
        </td>
        <td class="text-muted">${log.method}</td>
      </tr>`;
  });

  if (!logs.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-muted" style="text-align:center;padding:24px">
      No attendance records found.</td></tr>`;
  }
}

/* ──────────────────────────────────────────────────────────
   RENDER: ATTENDANCE STATS  (Active Days, Tardy Events)
────────────────────────────────────────────────────────── */
function setAttendanceStats(email) {
  const logs   = DB.attendance[email] || [];
  const active = logs.filter(l => l.checkIn).length;
  document.getElementById("att-active-days").textContent   = active;
  document.getElementById("att-tardy-events").textContent  =
    email === "admin@ams.com" ? 5 : 2; // simplified for demo
}

/* ──────────────────────────────────────────────────────────
   RENDER: EMPLOYEE RECENT ATTENDANCE (Dashboard)
────────────────────────────────────────────────────────── */
function renderEmpRecentAttendance(email) {
  const logs  = DB.attendance[email] || [];
  const tbody = document.getElementById("emp-recent-tbody");
  tbody.innerHTML = "";

  const statusMap = {
    "ACTIVE LOG": { label:"ABSENT",  cls:"badge-absent" },
    "0.04 HR":    { label:"LATE",    cls:"badge-late"   },
    "0.05 HR":    { label:"LATE",    cls:"badge-late"   },
    "0.00 HR":    { label:"PRESENT", cls:"badge-present"},
  };

  logs.slice(0,5).forEach(log => {
    const s = statusMap[log.magnitude] || { label:"PRESENT", cls:"badge-present" };
    tbody.innerHTML += `
      <tr>
        <td class="text-mono">${log.date}</td>
        <td class="text-mono">${log.checkIn  || "00:00:00"}</td>
        <td class="text-mono">${log.checkOut || "—"}</td>
        <td>${log.magnitude === "ACTIVE LOG" ? "<strong>Active</strong>" : log.magnitude}</td>
        <td><span class="badge ${s.cls}">${s.label}</span></td>
      </tr>`;
  });
}

/* ──────────────────────────────────────────────────────────
   RENDER: LEAVE HISTORY TABLE
────────────────────────────────────────────────────────── */
function renderLeaveHistory(email) {
  const leaves = DB.leaves[email] || [];
  const tbody  = document.getElementById("leave-history-tbody");
  tbody.innerHTML = "";

  leaves.forEach(l => {
    const cls = "leave-type-" + l.type.toLowerCase();
    tbody.innerHTML += `
      <tr>
        <td><span class="${cls}">${l.type}</span></td>
        <td class="text-mono">${l.start} → ${l.end}</td>
        <td class="text-muted">${l.reason}</td>
      </tr>`;
  });

  if (!leaves.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-muted" style="text-align:center;padding:24px">
      No leave history.</td></tr>`;
  }
}

/* ──────────────────────────────────────────────────────────
   RENDER: PENDING LEAVE APPROVALS (Admin)
────────────────────────────────────────────────────────── */
function renderPendingLeaves() {
  const container = document.getElementById("pending-approvals");
  container.innerHTML = "";

  DB.pendingLeaves.forEach(item => {
    container.innerHTML += `
      <div class="pending-item" id="pending-${item.id}">
        <div>
          <div class="pending-item-name">${item.name}</div>
          <div class="pending-item-detail">${item.type} | ${item.start} → ${item.end}</div>
        </div>
        <div class="pending-actions">
          <button class="action-btn action-btn-approve"
                  onclick="approveLeave(${item.id}, 'approve')">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none"
                 stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </button>
          <button class="action-btn action-btn-reject"
                  onclick="approveLeave(${item.id}, 'reject')">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none"
                 stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>`;
  });

  if (!DB.pendingLeaves.length) {
    container.innerHTML = `<p class="text-muted" style="text-align:center;padding:20px">
      No pending requests.</p>`;
  }
}

/** Approve or reject a leave request */
function approveLeave(id, action) {
  DB.pendingLeaves = DB.pendingLeaves.filter(l => l.id !== id);
  renderPendingLeaves();
  showToast(`Leave request ${action === "approve" ? "approved" : "rejected"}.`,
            action === "approve" ? "success" : "warning");
}

/* ──────────────────────────────────────────────────────────
   SUBMIT LEAVE REQUEST
────────────────────────────────────────────────────────── */
function submitLeave() {
  const type   = document.getElementById("leave-type").value;
  const start  = document.getElementById("leave-start").value;
  const end    = document.getElementById("leave-end").value;
  const reason = document.getElementById("leave-reason").value;

  if (!start || !end) { showToast("Please select start and end dates.", "warning"); return; }
  if (!reason.trim()) { showToast("Please provide a reason.", "warning"); return; }

  // Add to user's leave history (mock)
  const email = currentUser.email;
  DB.leaves[email].unshift({
    type: type.toUpperCase().replace(" ","_"), start, end, reason
  });

  // Add to pending if employee
  if (currentUser.role === "employee") {
    DB.pendingLeaves.push({
      id: Date.now(), name: currentUser.name,
      type: type.toUpperCase(), start, end
    });
  }

  renderLeaveHistory(email);

  // Reset form
  document.getElementById("leave-start").value  = "";
  document.getElementById("leave-end").value    = "";
  document.getElementById("leave-reason").value = "";

  showToast("Leave request submitted!", "success");
}

/* ──────────────────────────────────────────────────────────
   RENDER: USERS TABLE (Admin → Users view)
────────────────────────────────────────────────────────── */
function renderUsersTable() {
  const tbody = document.getElementById("users-tbody");
  tbody.innerHTML = "";

  Object.entries(DB.users).forEach(([email, u]) => {
    tbody.innerHTML += `
      <tr>
        <td>
          <div class="user-row-info">
            <div class="user-row-avatar">${u.name[0].toUpperCase()}</div>
            <span>${u.name}</span>
          </div>
        </td>
        <td>${u.role === "admin" ? "Administrator" : "Employee"}</td>
        <td class="text-muted">${email}</td>
        <td><span class="badge badge-present">Active</span></td>
        <td>
          <button class="action-btn action-btn-approve"
                  onclick="showToast('Edit user — coming soon','warning')">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none"
                 stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </td>
      </tr>`;
  });
}

/* ──────────────────────────────────────────────────────────
   SIDEBAR CLOSE BUTTON
   On small screens this hides the sidebar.
   (For desktop this is mostly cosmetic in this demo.)
────────────────────────────────────────────────────────── */
function closeSidebar() {
  // Toggle visibility on mobile; on desktop do nothing harmful
  const sidebar = document.getElementById("sidebar");
  sidebar.style.display = sidebar.style.display === "none" ? "" : "none";
}

/* ──────────────────────────────────────────────────────────
   TOAST NOTIFICATION
────────────────────────────────────────────────────────── */
let toastTimer = null;

/**
 * Shows a temporary toast notification.
 * @param {string} msg     - Message to display
 * @param {string} type    - "success" | "warning" | "error"
 */
function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  const icon  = document.getElementById("toast-icon");
  const text  = document.getElementById("toast-msg");

  // Remove previous type classes
  toast.classList.remove("toast-success", "toast-warning", "toast-error");
  toast.classList.add("toast-" + type);
  text.textContent = msg;

  // Swap icon based on type
  const icons = {
    success: `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>`,
    warning: `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
    error:   `<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>`
  };
  icon.innerHTML = icons[type] || icons.success;

  // Show
  toast.classList.add("show");

  // Auto-hide after 3s
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

/* ──────────────────────────────────────────────────────────
   KEYBOARD SHORTCUT: Enter on login form triggers login
────────────────────────────────────────────────────────── */
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && document.getElementById("page-login").classList.contains("page--active")) {
    doLogin();
  }
});

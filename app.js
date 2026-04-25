/* ================================================
   SkillThali — app.js (Payment System v4)
   PAYMENT FLOW:
   1. Client posts task → Student applies + uploads work
   2. Client sees submitted work → "Pay Now" button appears ONLY after submission
   3. Client pays → Platform fee added (25%) → status = "payment_secured"
      - Notification: Student gets "Client paid", Admin gets "New payment received"
   4. Admin sees secured payments → clicks "Pay Student"
      - Student status → "paid", task → completed
      - Notification: Student gets "Payment received", Client gets "Payment released"
================================================ */

// ============ STATE ============
let currentAuthMode = 'login';
let selectedRole = '';
let preSelectedRole = '';
let currentUser = { name: '', email: '', role: '', isNew: false };

let taskStore = [
  { id: 1, title: "Portfolio Website", category: "codethali", budget: 1200, skills: ["HTML", "CSS", "JavaScript"], desc: "Build a responsive 3-page portfolio for a mechanical engineering student. Must include About, Projects, and Contact sections.", client: "Rahul Mehta", clientEmail: "rahul@demo.com", location: "Pune, MH", rating: "4.7", projects: 8, deadline: "3 days", status: "available", paymentStatus: "pending", assignedTo: null, submittedWork: null, submittedFile: null, postedByUser: false },
  { id: 2, title: "Logo Design for StartupX", category: "creatix", budget: 800, skills: ["Adobe Illustrator", "Figma"], desc: "Need a minimalist modern logo for a tech startup. Provide 3 colour variants and SVG + PNG exports.", client: "Sneha Joshi", clientEmail: "sneha@demo.com", location: "Mumbai, MH", rating: "4.9", projects: 12, deadline: "5 days", status: "available", paymentStatus: "pending", assignedTo: null, submittedWork: null, submittedFile: null, postedByUser: false },
  { id: 3, title: "Resume Redesign", category: "quickbites", budget: 400, skills: ["MS Word", "Canva"], desc: "Redesign a fresher resume with a modern ATS-friendly template. 1-page only.", client: "Ankit Sharma", clientEmail: "ankit@demo.com", location: "Nagpur, MH", rating: "4.5", projects: 5, deadline: "2 days", status: "available", paymentStatus: "pending", assignedTo: null, submittedWork: null, submittedFile: null, postedByUser: false },
  { id: 4, title: "Hackathon Team Formation", category: "teamup", budget: 0, skills: ["Communication", "Problem Solving"], desc: "Looking for 2 teammates for Smart India Hackathon 2025. Need one designer and one backend developer.", client: "Priya Desai", clientEmail: "priya@demo.com", location: "Pune, MH", rating: "4.8", projects: 3, deadline: "7 days", status: "available", paymentStatus: "pending", assignedTo: null, submittedWork: null, submittedFile: null, postedByUser: false },
  { id: 5, title: "YouTube Thumbnail Pack", category: "creatix", budget: 600, skills: ["Photoshop", "Canva"], desc: "Create 10 eye-catching thumbnails for a tech YouTube channel. Consistent style, bold typography.", client: "Rohan Kulkarni", clientEmail: "rohan@demo.com", location: "Nashik, MH", rating: "4.6", projects: 6, deadline: "4 days", status: "available", paymentStatus: "pending", assignedTo: null, submittedWork: null, submittedFile: null, postedByUser: false },
  { id: 6, title: "LinkedIn Profile Optimisation", category: "quickbites", budget: 350, skills: ["LinkedIn", "Content Writing"], desc: "Optimise my LinkedIn headline, about section, and experience descriptions for better visibility.", client: "Kavya Nair", clientEmail: "kavya@demo.com", location: "Pune, MH", rating: "5.0", projects: 10, deadline: "1 day", status: "available", paymentStatus: "pending", assignedTo: null, submittedWork: null, submittedFile: null, postedByUser: false },
  { id: 7, title: "Android Bug Fix", category: "codethali", budget: 900, skills: ["Java", "Android Studio"], desc: "Fix 3 known bugs in an existing Android app. Source code will be shared on GitHub.", client: "Dev Mehta", clientEmail: "dev@demo.com", location: "Mumbai, MH", rating: "4.4", projects: 4, deadline: "6 days", status: "available", paymentStatus: "pending", assignedTo: null, submittedWork: null, submittedFile: null, postedByUser: false },
  { id: 8, title: "Startup Idea Brainstorm Partner", category: "teamup", budget: 0, skills: ["Business Thinking", "Research"], desc: "Need a creative co-founder to help validate and refine an EdTech startup idea. Weekly sessions.", client: "Ishaan Tiwari", clientEmail: "ishaan@demo.com", location: "Indore, MP", rating: "4.7", projects: 2, deadline: "Ongoing", status: "available", paymentStatus: "pending", assignedTo: null, submittedWork: null, submittedFile: null, postedByUser: false }
];

let studentActivity = { applied: [], active: [], completed: [], submitted: [] };
let notificationsStore = {};

// ============ PAYMENT HELPERS ============
function getPlatformFee(budget) { return Math.round(budget * 0.25); }
function getTotalClientPays(budget) { return budget + getPlatformFee(budget); }

// ============ LOCAL STORAGE ============
function saveUser(u) { try { localStorage.setItem('st_user', JSON.stringify(u)); } catch(e) {} }
function loadUser() { try { const d = localStorage.getItem('st_user'); return d ? JSON.parse(d) : null; } catch(e) { return null; } }
function clearUser() { try { localStorage.removeItem('st_user'); } catch(e) {} }
function saveUsers(arr) { try { localStorage.setItem('st_users', JSON.stringify(arr)); } catch(e) {} }
function loadUsers() { try { const d = localStorage.getItem('st_users'); return d ? JSON.parse(d) : []; } catch(e) { return []; } }
function getActivityKey(email) { return 'st_activity_' + (email || 'anon'); }
function saveTaskStore() { try { localStorage.setItem('st_tasks', JSON.stringify(taskStore)); } catch(e) {} }
function loadTaskStore() { try { const d = localStorage.getItem('st_tasks'); return d ? JSON.parse(d) : null; } catch(e) { return null; } }

// ============ LINKEDIN STORAGE ============
function getLinkedInKey(email) { return 'st_linkedin_' + (email || 'anon'); }
function saveLinkedInUrl(email, url) {
  try { localStorage.setItem(getLinkedInKey(email), url || ''); } catch(e) {}
}
function loadLinkedInUrl(email) {
  try { return localStorage.getItem(getLinkedInKey(email)) || ''; } catch(e) { return ''; }
}

// ============ APPLICATIONS STORAGE ============
function saveApplications(taskId, applicant) {
  try {
    const key = 'st_apps_' + taskId;
    const apps = loadApplications(taskId);
    const exists = apps.find(a => a.email === applicant.email);
    if (!exists) apps.push(applicant);
    localStorage.setItem(key, JSON.stringify(apps));
  } catch(e) {}
}
function loadApplications(taskId) {
  try {
    const d = localStorage.getItem('st_apps_' + taskId);
    return d ? JSON.parse(d) : [];
  } catch(e) { return []; }
}
function clearApplicationsForTask(taskId) {
  try { localStorage.removeItem('st_apps_' + taskId); } catch(e) {}
}


function saveStudentActivity(a) {
  try { localStorage.setItem(getActivityKey(currentUser.email), JSON.stringify(a)); } catch(e) {}
}
function loadStudentActivity() {
  try {
    const d = localStorage.getItem(getActivityKey(currentUser.email));
    return d ? JSON.parse(d) : { applied: [], active: [], completed: [], submitted: [] };
  } catch(e) { return { applied: [], active: [], completed: [], submitted: [] }; }
}

// ============ STUDENT EARNINGS STORAGE ============
function getEarningsKey(email) { return 'st_earnings_' + (email || 'anon'); }
function saveStudentEarnings(email, amount) {
  try {
    const current = loadStudentEarnings(email);
    localStorage.setItem(getEarningsKey(email), JSON.stringify(current + amount));
  } catch(e) {}
}
function loadStudentEarnings(email) {
  try {
    const d = localStorage.getItem(getEarningsKey(email));
    return d ? JSON.parse(d) : 0;
  } catch(e) { return 0; }
}

// ============ NOTIFICATIONS ============
function getNotifKey(email) { return 'st_notifs_' + (email || 'anon'); }
function saveNotifications(email, arr) {
  try { localStorage.setItem(getNotifKey(email), JSON.stringify(arr)); } catch(e) {}
}
function loadNotifications(email) {
  try {
    const d = localStorage.getItem(getNotifKey(email));
    return d ? JSON.parse(d) : [];
  } catch(e) { return []; }
}

function addNotification(userEmail, message, type = 'info') {
  const notifs = loadNotifications(userEmail);
  notifs.unshift({ id: Date.now(), message, type, read: false, time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) });
  saveNotifications(userEmail, notifs.slice(0, 20));
  if (userEmail === currentUser.email) updateNotifBadge();
}

function updateNotifBadge() {
  const notifs = loadNotifications(currentUser.email);
  const unread = notifs.filter(n => !n.read).length;
  ['studentNotifBadge', 'clientNotifBadge'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = unread; el.style.display = unread > 0 ? 'flex' : 'none'; }
  });
}

function markAllNotifsRead(role) {
  const notifs = loadNotifications(currentUser.email);
  notifs.forEach(n => n.read = true);
  saveNotifications(currentUser.email, notifs);
  updateNotifBadge();
  renderNotifDropdown(role);
}

function toggleNotifDropdown(role, e) {
  e.stopPropagation();
  const id = role === 'student' ? 'studentNotifDropdown' : 'clientNotifDropdown';
  const el = document.getElementById(id);
  if (!el) return;
  const isOpen = el.classList.contains('open');
  document.querySelectorAll('.notif-dropdown, .profile-dropdown-menu').forEach(d => d.classList.remove('open'));
  if (!isOpen) { el.classList.add('open'); renderNotifDropdown(role); }
}

function renderNotifDropdown(role) {
  const id = role === 'student' ? 'studentNotifList' : 'clientNotifList';
  const container = document.getElementById(id);
  if (!container) return;
  const notifs = loadNotifications(currentUser.email);
  if (!notifs.length) { container.innerHTML = '<div class="notif-empty">🔔 No notifications yet</div>'; return; }
  container.innerHTML = notifs.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
      <span class="notif-dot ${n.type}"></span>
      <div class="notif-content">
        <p>${n.message}</p>
        <span class="notif-time">${n.time}</span>
      </div>
    </div>
  `).join('');
}

// ============ NAVBAR VISIBILITY ============
function updateNavbarVisibility(id) {
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  if (id === 'home') nav.classList.remove('nav-hidden');
  else nav.classList.add('nav-hidden');
}

// ============ SECTION NAV ============
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  if (id === 'about' || id === 'categories') {
    document.getElementById('home').classList.add('active');
    updateNavbarVisibility('home');
    const anchor = document.getElementById(id);
    if (anchor) setTimeout(() => anchor.scrollIntoView({ behavior: 'smooth' }), 50);
  } else {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
    updateNavbarVisibility(id);
  }
  window.scrollTo(0, 0);
}

// ============ HERO ROLE INFO ============
function showRoleInfo(role) {
  const content = document.getElementById('roleInfoContent');
  if (role === 'student') {
    content.innerHTML = `<span class="role-icon">🎓</span><h2>I am a Student</h2><p>Showcase your skills, work on real-world projects, earn money, and build your portfolio.</p><button class="btn-primary" onclick="openAuth('signup','student')">Get Started as Student →</button>`;
  } else {
    content.innerHTML = `<span class="role-icon">💼</span><h2>I am a Client</h2><p>Post projects, hire skilled students, review their work, and get tasks completed efficiently.</p><button class="btn-primary" onclick="openAuth('signup','client')">Get Started as Client →</button>`;
  }
  document.getElementById('roleInfoPage').classList.remove('hidden');
}
function hideRoleInfo() { document.getElementById('roleInfoPage').classList.add('hidden'); }

// ============ AUTH ============
function openAuth(mode, role = '') {
  currentAuthMode = mode;
  preSelectedRole = role;
  document.getElementById('authModal').classList.remove('hidden');
  ['authName','authEmail','authPass'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  showAuthStep('authStep1');
  refreshAuthUI();
  hideRoleInfo();
}

function refreshAuthUI() {
  const isLogin = currentAuthMode === 'login';
  document.getElementById('authTitle').textContent = isLogin ? 'Welcome Back' : 'Create Account';
  document.getElementById('authSub').textContent = isLogin ? 'Login to your SkillThali account' : 'Join SkillThali today';
  document.getElementById('authSwitchText').innerHTML = isLogin
    ? "Don't have an account? <a href='#' onclick='toggleAuth()'>Sign Up</a>"
    : "Already have an account? <a href='#' onclick='toggleAuth()'>Login</a>";
  const ng = document.getElementById('authNameGroup');
  if (ng) ng.style.display = isLogin ? 'none' : 'block';
}

function toggleAuth() {
  currentAuthMode = currentAuthMode === 'login' ? 'signup' : 'login';
  ['authName','authEmail','authPass'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  refreshAuthUI();
}

function closeModal() {
  document.getElementById('authModal').classList.add('hidden');
  showAuthStep('authStep1');
  ['authName','authEmail','authPass'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}

function showAuthStep(id) {
  document.querySelectorAll('.auth-step').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function nextAuthStep() {
  const email = (document.getElementById('authEmail').value || '').trim();
  const pass = (document.getElementById('authPass').value || '').trim();
  if (!email || !pass) { shake(document.querySelector('.modal-box')); return; }

  if (email.toLowerCase() === 'admin@skillthali.com') {
    currentUser = { name: 'Admin', email: email, role: 'admin', isNew: false };
    saveUser(currentUser);
    closeModal();
    goToAdminDash();
    return;
  }

  if (currentAuthMode === 'login') {
    const users = loadUsers();
    const match = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
    if (!match) {
      shake(document.querySelector('.modal-box'));
      showToast('❌ Invalid email or password. Please try again.');
      return;
    }
    currentUser = { name: match.name, email: match.email, role: match.role, isNew: false };
    saveUser(currentUser);
    studentActivity = loadStudentActivity();
    goToDashboard(currentUser.role);
    return;
  }

  const nameEl = document.getElementById('authName');
  const name = nameEl ? nameEl.value.trim() : '';
  if (!name) { shake(document.querySelector('.modal-box')); return; }

  // Check if email already registered
  const existingUsers = loadUsers();
  if (existingUsers.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    shake(document.querySelector('.modal-box'));
    showToast('⚠️ An account with this email already exists. Please login.');
    return;
  }

  currentUser = { name, email, role: preSelectedRole || '', isNew: true };

  if (preSelectedRole) {
    // Save to users array now with the known role
    const users = loadUsers();
    if (!users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      users.push({ name, email, password: pass, role: preSelectedRole });
      saveUsers(users);
    }
    showAuthStep(preSelectedRole === 'student' ? 'onboardS1' : 'onboardC1');
    return;
  }
  showAuthStep('authStep2');
}

function selectRole(role) {
  selectedRole = role;
  currentUser.role = role;
  document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.role-card').forEach(c => {
    const h3 = c.querySelector('h3');
    if (h3 && h3.textContent.toLowerCase() === role) c.classList.add('selected');
  });
  // Save user now that we have all info (name, email, pass, role)
  const passEl = document.getElementById('authPass');
  const pass = passEl ? passEl.value : '';
  if (pass && currentUser.email) {
    const users = loadUsers();
    if (!users.find(u => u.email.toLowerCase() === currentUser.email.toLowerCase())) {
      users.push({ name: currentUser.name, email: currentUser.email, password: pass, role });
      saveUsers(users);
    }
  }
  setTimeout(() => showAuthStep(role === 'student' ? 'onboardS1' : 'onboardC1'), 150);
}

function goToDashboard(type) {
  if (!currentUser.role) currentUser.role = type;
  saveUser(currentUser);

  closeModal();
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  studentActivity = loadStudentActivity();

  if (type === 'student') {
    document.getElementById('studentDash').classList.add('active');
    updateNavbarVisibility('studentDash');
    renderAvailableTasks('all');
    switchStudentView('available', document.querySelector('#studentSidebar .sidebar-btn'));
    updateDynamicUI('student');
    updateNotifBadge();
  } else {
    document.getElementById('clientDash').classList.add('active');
    updateNavbarVisibility('clientDash');
    renderClientTasks();
    updateDynamicUI('client');
    updateNotifBadge();
  }
  window.scrollTo(0, 0);
}

// ============ ADMIN DASHBOARD ============
function goToAdminDash() {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const adminSection = document.getElementById('adminDash');
  if (adminSection) {
    adminSection.classList.add('active');
    updateNavbarVisibility('adminDash');
    renderAdminDashboard();
  }
  window.scrollTo(0, 0);
}

function renderAdminDashboard() {
  // Always reload latest task data from localStorage so new tasks/payments reflect immediately
  const savedTasks = loadTaskStore();
  if (savedTasks && savedTasks.length) taskStore = savedTasks;

  const users = loadUsers();
  const allTasks = taskStore;

  let totalReceived = 0, pendingToStudents = 0, platformEarnings = 0, releasedToStudents = 0;
  allTasks.forEach(t => {
    if (t.paymentStatus === 'payment_secured' || t.paymentStatus === 'released') {
      const fee = getPlatformFee(t.budget);
      const total = getTotalClientPays(t.budget);
      totalReceived += total;
      platformEarnings += fee;
      if (t.paymentStatus === 'payment_secured') pendingToStudents += t.budget;
      if (t.paymentStatus === 'released') releasedToStudents += t.budget;
    }
  });

  const securedCount = allTasks.filter(t => t.paymentStatus === 'payment_secured').length;
  const releasedCount = allTasks.filter(t => t.paymentStatus === 'released').length;
  const pendingCount = allTasks.filter(t => t.paymentStatus === 'pending').length;

  setEl('adminTotalMoney', '₹' + totalReceived.toLocaleString('en-IN'));
  setEl('adminPlatformEarnings', '₹' + platformEarnings.toLocaleString('en-IN'));
  setEl('adminPendingStudents', '₹' + pendingToStudents.toLocaleString('en-IN'));
  setEl('adminReleasedStudents', '₹' + releasedToStudents.toLocaleString('en-IN'));
  setEl('adminSecuredCount', securedCount);
  setEl('adminTotalTasks', allTasks.length);
  setEl('adminTotalUsers', users.length + 1);

  // ===== PENDING PAYMENT NOTIFICATIONS (secured, waiting for admin to pay student) =====
  const pendingPayEl = document.getElementById('adminPendingPayNotifs');
  if (pendingPayEl) {
    const readyTasks = allTasks.filter(t => t.status === 'submitted' && t.paymentStatus === 'payment_secured');
    if (readyTasks.length) {
      pendingPayEl.innerHTML = readyTasks.map(t => `
        <div class="admin-notif-card">
          <span class="admin-notif-icon">🔔</span>
          <div class="admin-notif-content">
            <strong>New payment received — ready to release to student</strong>
            <p>"${t.title}" — Student: <strong>${t.assignedTo || 'Unknown'}</strong> — Student receives: ₹${t.budget.toLocaleString('en-IN')}</p>
          </div>
          <button class="btn-admin-release" onclick="adminPayStudent(${t.id})">💸 Pay Student ₹${t.budget.toLocaleString('en-IN')}</button>
        </div>
      `).join('');
    } else {
      pendingPayEl.innerHTML = '<p style="color:var(--text-dim);font-size:0.85rem;padding:12px 0;">No pending payments to release.</p>';
    }
  }

  const tbody = document.getElementById('adminTransactionBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  allTasks.forEach(task => {
    const tr = document.createElement('tr');
    const statusClass = task.paymentStatus === 'released' ? 'badge-green' : task.paymentStatus === 'payment_secured' ? 'badge-blue' : 'badge-yellow';
    const taskStatusClass = task.status === 'completed' ? 'badge-green' : task.status === 'submitted' ? 'badge-purple' : task.status === 'assigned' ? 'badge-orange' : 'badge-gray';
    const fee = getPlatformFee(task.budget);
    const total = getTotalClientPays(task.budget);

    let payLabel = '⏳ Pending';
    if (task.paymentStatus === 'payment_secured') payLabel = '🔒 Secured';
    if (task.paymentStatus === 'released') payLabel = '💰 Released';

    tr.innerHTML = `
      <td><strong>${task.title}</strong></td>
      <td><span class="admin-badge badge-gray">${task.category}</span></td>
      <td>${task.client}</td>
      <td>${task.assignedTo || '<span style="color:var(--text-dim)">—</span>'}</td>
      <td>
        <strong style="color:var(--accent)">${task.budget > 0 ? '₹' + task.budget.toLocaleString('en-IN') : 'Collab'}</strong>
        ${task.budget > 0 && (task.paymentStatus === 'payment_secured' || task.paymentStatus === 'released') ? `<br><span style="font-size:0.72rem;color:var(--text-dim)">+₹${fee} fee = ₹${total} total</span>` : ''}
      </td>
      <td><span class="admin-badge ${statusClass}">${payLabel}</span></td>
      <td><span class="admin-badge ${taskStatusClass}">${task.status === 'completed' ? '✅ Done' : task.status === 'submitted' ? '📤 Submitted' : task.status === 'assigned' ? '🔥 Active' : '🟢 Open'}</span></td>
      <td>${task.status === 'submitted' && task.paymentStatus === 'payment_secured' ? `<button class="btn-admin-release" onclick="adminPayStudent(${task.id})">💸 Pay Student</button>` : '—'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ============ ADMIN: PAY STUDENT ============
// Admin clicks "Pay Student" → moves task to completed, notifies student & client
function adminPayStudent(taskId) {
  const task = taskStore.find(t => t.id === taskId);
  if (!task || task.paymentStatus !== 'payment_secured') return;

  task.status = 'completed';
  task.paymentStatus = 'released';

  // Update all student activity stores
  const allUsers = loadUsers();
  allUsers.forEach(u => {
    const key = getActivityKey(u.email);
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const act = JSON.parse(data);
        const wasSubmitted = act.submitted && act.submitted.includes(taskId);
        if (wasSubmitted) {
          if (!act.completed) act.completed = [];
          if (!act.completed.includes(taskId)) act.completed.push(taskId);
          act.submitted = act.submitted.filter(id => id !== taskId);
          act.active = (act.active || []).filter(id => id !== taskId);
          localStorage.setItem(key, JSON.stringify(act));

          // Update earnings for student
          saveStudentEarnings(u.email, task.budget);

          // Notify student
          addNotification(u.email, `💰 Payment received! ₹${task.budget.toLocaleString('en-IN')} for "${task.title}" has been credited to your account.`, 'success');
        }
      }
    } catch(e) {}
  });

  // Also update in-memory session
  if (studentActivity.submitted && studentActivity.submitted.includes(taskId)) {
    if (!studentActivity.completed) studentActivity.completed = [];
    if (!studentActivity.completed.includes(taskId)) studentActivity.completed.push(taskId);
    studentActivity.submitted = studentActivity.submitted.filter(id => id !== taskId);
    saveStudentActivity(studentActivity);
  }

  // Notify client
  const clientUser = allUsers.find(u => u.name === task.client || u.email === task.clientEmail);
  if (clientUser) {
    addNotification(clientUser.email, `✅ Payment of ₹${task.budget.toLocaleString('en-IN')} has been released to ${task.assignedTo || 'the student'} for "${task.title}".`, 'success');
  }

  // Notify admin
  addNotification('admin@skillthali.com', `💸 Admin released ₹${task.budget.toLocaleString('en-IN')} to ${task.assignedTo || 'student'} for "${task.title}".`, 'success');

  saveTaskStore();
  renderAdminDashboard();
  showToast(`💸 ₹${task.budget.toLocaleString('en-IN')} paid to ${task.assignedTo || 'student'} for "${task.title}"`);
}

// Legacy force release (kept for backwards compat)
function adminForceRelease(taskId) { adminPayStudent(taskId); }

function switchAdminView(view, btn) {
  document.querySelectorAll('#adminSidebar .sidebar-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('#adminDash .dash-view').forEach(v => v.classList.remove('active'));
  const viewEl = document.getElementById('aview-' + view);
  if (viewEl) viewEl.classList.add('active');
  if (view === 'overview') renderAdminDashboard();
  if (view === 'transactions') renderAdminTransactions();
  if (view === 'users') renderAdminUsers();
  if (view === 'earnings') renderAdminEarnings();
}

function renderAdminTransactions() {
  const tbody = document.getElementById('adminTransactionBody2');
  if (!tbody) { renderAdminDashboard(); return; }
  tbody.innerHTML = '';
  // Always reload latest task data
  const savedTasks = loadTaskStore();
  if (savedTasks && savedTasks.length) taskStore = savedTasks;
  const allTasks = taskStore;
  allTasks.forEach(task => {
    const tr = document.createElement('tr');
    const statusClass = task.paymentStatus === 'released' ? 'badge-green' : task.paymentStatus === 'payment_secured' ? 'badge-blue' : 'badge-yellow';
    const taskStatusClass = task.status === 'completed' ? 'badge-green' : task.status === 'submitted' ? 'badge-purple' : task.status === 'assigned' ? 'badge-orange' : 'badge-gray';
    const fee = getPlatformFee(task.budget);
    const total = getTotalClientPays(task.budget);
    let payLabel = '⏳ Pending';
    if (task.paymentStatus === 'payment_secured') payLabel = '🔒 Secured';
    if (task.paymentStatus === 'released') payLabel = '💰 Released';
    tr.innerHTML = `
      <td><strong>${task.title}</strong></td>
      <td><span class="admin-badge badge-gray">${task.category}</span></td>
      <td>${task.client}</td>
      <td>${task.assignedTo || '<span style="color:var(--text-dim)">—</span>'}</td>
      <td>
        <strong style="color:var(--accent)">${task.budget > 0 ? '₹' + task.budget.toLocaleString('en-IN') : 'Collab'}</strong>
        ${task.budget > 0 && (task.paymentStatus === 'payment_secured' || task.paymentStatus === 'released') ? `<br><span style="font-size:0.72rem;color:var(--text-dim)">+₹${fee} fee = ₹${total} total</span>` : ''}
      </td>
      <td><span class="admin-badge ${statusClass}">${payLabel}</span></td>
      <td><span class="admin-badge ${taskStatusClass}">${task.status === 'completed' ? '✅ Done' : task.status === 'submitted' ? '📤 Submitted' : task.status === 'assigned' ? '🔥 Active' : '🟢 Open'}</span></td>
      <td>${task.status === 'submitted' && task.paymentStatus === 'payment_secured' ? `<button class="btn-admin-release" onclick="adminPayStudent(${task.id})">💸 Pay Student</button>` : '—'}</td>
    `;
    tbody.appendChild(tr);
  });
  if (!allTasks.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-dim);padding:30px;">No transactions yet.</td></tr>';
  }
  // Also update the overview table
  renderAdminDashboard();
}

function renderAdminEarnings() {
  const container = document.getElementById('adminEarningsView');
  if (!container) return;
  const savedTasks = loadTaskStore();
  if (savedTasks && savedTasks.length) taskStore = savedTasks;
  const allTasks = taskStore;
  let rows = '';
  allTasks.filter(t => t.paymentStatus === 'payment_secured' || t.paymentStatus === 'released').forEach(t => {
    const fee = getPlatformFee(t.budget);
    const total = getTotalClientPays(t.budget);
    const statusCls = t.paymentStatus === 'released' ? 'badge-green' : 'badge-blue';
    rows += `<tr>
      <td><strong>${t.title}</strong></td>
      <td style="color:var(--accent)">₹${total.toLocaleString('en-IN')}</td>
      <td style="color:var(--green)">₹${t.budget.toLocaleString('en-IN')}</td>
      <td style="color:var(--purple)">₹${fee.toLocaleString('en-IN')}</td>
      <td><span class="admin-badge ${statusCls}">${t.paymentStatus === 'released' ? '✅ Paid Out' : '🔒 Held'}</span></td>
    </tr>`;
  });
  container.innerHTML = rows || '<tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:30px;">No transactions yet.</td></tr>';
}

function renderAdminUsers() {
  const users = loadUsers();
  const container = document.getElementById('adminUsersList');
  if (!container) return;
  container.innerHTML = '';
  const allUsers = [{ name: 'Admin', email: 'admin@skillthali.com', role: 'admin' }, ...users];
  allUsers.forEach(u => {
    const row = document.createElement('div');
    row.className = 'admin-user-row';
    const roleClass = u.role === 'admin' ? 'badge-purple' : u.role === 'client' ? 'badge-blue' : 'badge-green';
    const earnings = u.role === 'student' ? loadStudentEarnings(u.email) : 0;
    row.innerHTML = `
      <div class="admin-user-avatar">${(u.name || 'U').substring(0,2).toUpperCase()}</div>
      <div class="admin-user-info">
        <strong>${u.name}</strong>
        <span>${u.email}</span>
      </div>
      <span class="admin-badge ${roleClass}">${u.role === 'admin' ? '👑 Admin' : u.role === 'client' ? '💼 Client' : '🎓 Student'}</span>
      ${u.role === 'student' && earnings > 0 ? `<span class="admin-badge badge-green" style="margin-left:8px">💰 ₹${earnings.toLocaleString('en-IN')}</span>` : ''}
    `;
    container.appendChild(row);
  });
}

// ============ DYNAMIC UI ============
function updateDynamicUI(role) {
  const name = currentUser.name || 'User';
  const email = currentUser.email || '';
  const greeting = currentUser.isNew ? `Welcome, ${name} 🎉` : `Welcome back, ${name} 👋`;
  const initials = name.substring(0, 2).toUpperCase();

  if (role === 'student') {
    setEl('studentGreeting', greeting);
    setEl('studentNavInitials', initials);
    setEl('studentAvatarInitials', initials);
    setEl('profileDropName', name);
    setEl('profilePageName', name);
    setEl('profilePageEmail', '📧 ' + (email || 'student@college.edu'));
    setEl('profilePageInitials', initials);
    const completed = studentActivity.completed ? studentActivity.completed.length : 0;
    const active = studentActivity.active ? studentActivity.active.length : 0;
    // Use stored earnings (updated by admin pay)
    const earnings = loadStudentEarnings(currentUser.email);
    setEl('statActiveTasks', active);
    setEl('statCompletedTasks', completed);
    setEl('statEarnings', '₹' + earnings.toLocaleString('en-IN'));
  } else {
    setEl('clientGreeting', greeting);
    setEl('clientNavInitials', initials);
    setEl('clientAvatarInitials', initials);
    setEl('clientProfileDropName', name);
    setEl('clientProfilePageName', name);
    setEl('clientProfilePageEmail', '📧 ' + (email || 'client@company.com'));
    setEl('clientProfilePageInitials', initials);
    const myTasks = taskStore.filter(t => t.postedByUser && t.client === (currentUser.name || ''));
    setEl('clientStatActive', myTasks.filter(t => t.status === 'assigned').length);
    setEl('clientStatCompleted', myTasks.filter(t => t.status === 'completed').length);
  }
  updateNotifBadge();
}

function setEl(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function logout() {
  currentUser = { name: '', email: '', role: '', isNew: false };
  studentActivity = { applied: [], active: [], completed: [], submitted: [] };
  clearUser();
  document.querySelectorAll('.profile-dropdown-menu, .notif-dropdown').forEach(d => d.classList.remove('open'));
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('home').classList.add('active');
  updateNavbarVisibility('home');
  window.scrollTo(0, 0);
}

function shake(el) {
  if (!el) return;
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'shake 0.3s ease';
}

// ============ PROFILE DROPDOWN ============
function toggleStudentProfileDrop(e) {
  e.stopPropagation();
  document.getElementById('studentProfileMenu').classList.toggle('open');
  const cm = document.getElementById('clientProfileMenu');
  if (cm) cm.classList.remove('open');
  document.querySelectorAll('.notif-dropdown').forEach(d => d.classList.remove('open'));
}
function toggleClientProfileDrop(e) {
  e.stopPropagation();
  document.getElementById('clientProfileMenu').classList.toggle('open');
  const sm = document.getElementById('studentProfileMenu');
  if (sm) sm.classList.remove('open');
  document.querySelectorAll('.notif-dropdown').forEach(d => d.classList.remove('open'));
}

// ============ ONBOARDING ============
function toggleChoice(el) { el.classList.toggle('selected'); }
function selectRadioCard(el) {
  el.closest('.onboard-cards-grid').querySelectorAll('.onboard-choice-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}

// ============ STUDENT VIEWS ============
function switchStudentView(view, btn) {
  document.querySelectorAll('#studentSidebar .sidebar-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('#studentDash .dash-view').forEach(v => v.classList.remove('active'));
  const viewEl = document.getElementById('view-' + view);
  if (viewEl) viewEl.classList.add('active');
  if (view === 'available') renderAvailableTasks('all');
  if (view === 'active') renderStudentActiveTasks();
  if (view === 'completed') renderStudentCompletedTasks();
  if (view === 'submitted') renderStudentSubmittedTasks();
}

// ============ CLIENT VIEWS ============
function switchClientView(view, btn) {
  document.querySelectorAll('#clientSidebar .sidebar-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('#clientDash .dash-view').forEach(v => v.classList.remove('active'));
  const viewEl = document.getElementById('cview-' + view);
  if (viewEl) viewEl.classList.add('active');
  if (view === 'posted') renderClientTasks();
  if (view === 'submitted') renderClientSubmittedTasks();
  if (view === 'completed') renderClientCompletedTasks();
  if (view === 'applicants') renderClientApplicants();
}

// ============ CLIENT APPLICANTS DASHBOARD ============
function renderClientApplicants() {
  const container = document.getElementById('clientApplicantsList');
  if (!container) return;
  container.innerHTML = '';

  const myTasks = taskStore.filter(t => t.clientEmail === currentUser.email || (t.postedByUser && t.client === (currentUser.name || '')));
  if (!myTasks.length) {
    container.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:30px;">No tasks posted yet. Post a task to start receiving applicants!</p>';
    return;
  }

  myTasks.forEach(task => {
    const catEmoji = { codethali: '💻', creatix: '🎨', quickbites: '⚡', teamup: '🤝' }[task.category] || '📋';
    const catLabel = { codethali: 'CodeThali', creatix: 'Creatix', quickbites: 'QuickBites', teamup: 'TeamUp' }[task.category] || task.category;
    const apps = loadApplications(task.id);
    const count = apps.length;
    const card = document.createElement('div');
    card.className = 'task-card';
    card.innerHTML = `
      <div class="task-info">
        <span class="task-cat">${catEmoji} ${catLabel}</span>
        <h4>${task.title}</h4>
        <p style="font-size:0.83rem;color:var(--text-dim)">${count > 0 ? `${count} student${count > 1 ? 's' : ''} applied` : 'No applicants yet'}</p>
      </div>
      <div class="task-meta">
        <span class="budget">${fmtBudget(task.budget)}</span>
        <span style="font-size:0.78rem;color:var(--accent)">👥 ${count} applicant${count !== 1 ? 's' : ''}</span>
        <button class="btn-ghost-sm" onclick="openApplicantsModal(${task.id})" style="margin-top:6px;">👁 View Applicants</button>
      </div>`;
    container.appendChild(card);
  });
}








function openApplicantsModal(taskId) {
  const task = taskStore.find(t => t.id === taskId);
  if (!task) return;
  const apps = loadApplications(taskId);
  const content = document.getElementById('applicantsModalContent');
  if (!content) return;

  const hasAccepted = apps.some(a => a.status === 'accepted');

  let appsHtml = '';
  if (!apps.length) {
    appsHtml = '<p style="color:var(--text-dim);text-align:center;padding:20px 0;">No applicants yet for this task.</p>';
  } else {
    appsHtml = apps.map(a => {
      const isAccepted = a.status === 'accepted';
      const isRejected = a.status === 'rejected';
      const statusTag = isAccepted
        ? `<span style="color:#7cfc90;font-size:0.78rem;font-weight:600;">✅ Accepted</span>`
        : isRejected
        ? `<span style="color:#ff6b6b;font-size:0.78rem;font-weight:600;">❌ Rejected</span>`
        : '';

      const actionBtns = (!hasAccepted && !isRejected) ? `
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn-primary-sm btn-accept-applicant" data-task-id="${taskId}" data-email="${a.email}" style="white-space:nowrap;">✅ Accept</button>
          <button class="btn-ghost-sm btn-reject-applicant" data-task-id="${taskId}" data-email="${a.email}" style="background:rgba(255,107,107,0.15);border-color:rgba(255,107,107,0.4);color:#ff6b6b;white-space:nowrap;">❌ Reject</button>
        </div>` : statusTag;

      return `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--card-border);gap:12px;flex-wrap:wrap;${isRejected?'opacity:0.55':''}">
          <div style="display:flex;align-items:center;gap:12px;">
            <div class="avatar" style="flex-shrink:0;">${(a.name||'S').substring(0,2).toUpperCase()}</div>
            <div>
              <strong style="color:var(--white);display:block;font-size:0.95rem;">${a.name || 'Student'}</strong>
              <span style="color:var(--text-dim);font-size:0.75rem;">${a.appliedAt || ''}</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            ${a.linkedin
              ? `<button class="btn-ghost-sm" onclick="window.open('${a.linkedin}','_blank')" style="white-space:nowrap;">🔗 View LinkedIn</button>`
              : `<span style="font-size:0.78rem;color:var(--text-dim);">No LinkedIn</span>`
            }
            ${actionBtns}
          </div>
        </div>`;
    }).join('');
  }
























  content.innerHTML = `
    <h2 style="font-family:'Playfair Display',serif;font-size:1.5rem;color:var(--white);margin-bottom:6px;">👥 Applicants</h2>
    <p style="color:var(--text-dim);font-size:0.88rem;margin-bottom:20px;">Task: <strong style="color:var(--accent)">${task.title}</strong> &nbsp;·&nbsp; ${apps.length} applicant${apps.length !== 1 ? 's' : ''}</p>
    <div>${appsHtml}</div>
    <button class="btn-ghost ctd-close-btn" onclick="closeApplicantsModal()" style="margin-top:20px;">Close</button>
  `;

  // Attach accept/reject via addEventListener (no inline onclick)
  content.querySelectorAll('.btn-accept-applicant').forEach(btn => {
    btn.addEventListener('click', function() {
      acceptApplicant(Number(this.dataset.taskId), this.dataset.email);
    });
  });
  content.querySelectorAll('.btn-reject-applicant').forEach(btn => {
    btn.addEventListener('click', function() {
      rejectApplicant(Number(this.dataset.taskId), this.dataset.email);
    });
  });

  document.getElementById('applicantsModal').classList.remove('hidden');
}

function closeApplicantsModal() {
  const m = document.getElementById('applicantsModal');
  if (m) m.classList.add('hidden');
}

// ============ SIDEBAR TOGGLE ============
function toggleSidebar() { document.getElementById('studentSidebar').classList.toggle('open'); }
function toggleClientSidebar() { document.getElementById('clientSidebar').classList.toggle('open'); }

// ============ PROFILE NAV ============
function goToStudentProfile() {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('studentProfile').classList.add('active');
  updateNavbarVisibility('studentProfile');
  const m = document.getElementById('studentProfileMenu');
  if (m) m.classList.remove('open');
  // Load and display saved LinkedIn URL
  const savedUrl = loadLinkedInUrl(currentUser.email);
  const input = document.getElementById('linkedinUrlInput');
  const display = document.getElementById('linkedinDisplayText');
  if (input) input.value = savedUrl;
  if (display) {
    if (savedUrl) {
      display.innerHTML = `<a href="${savedUrl}" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:none;">🔗 ${savedUrl}</a>`;
    } else {
      display.textContent = 'No LinkedIn URL saved yet.';
      display.style.color = 'var(--text-dim)';
    }
  }
  window.scrollTo(0, 0);
}

function saveLinkedIn() {
  const input = document.getElementById('linkedinUrlInput');
  const url = input ? input.value.trim() : '';
  saveLinkedInUrl(currentUser.email, url);
  const display = document.getElementById('linkedinDisplayText');
  if (display) {
    if (url) {
      display.innerHTML = `<a href="${url}" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:none;">🔗 ${url}</a>`;
    } else {
      display.textContent = 'No LinkedIn URL saved yet.';
      display.style.color = 'var(--text-dim)';
    }
  }
  showToast('✅ LinkedIn profile saved!');
}

function goToClientProfile() {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('clientProfile').classList.add('active');
  updateNavbarVisibility('clientProfile');
  const m = document.getElementById('clientProfileMenu');
  if (m) m.classList.remove('open');
  window.scrollTo(0, 0);
}
function goBackToDash(role) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  if (role === 'student') { document.getElementById('studentDash').classList.add('active'); updateNavbarVisibility('studentDash'); }
  else if (role === 'admin') { document.getElementById('adminDash').classList.add('active'); updateNavbarVisibility('adminDash'); renderAdminDashboard(); }
  else { document.getElementById('clientDash').classList.add('active'); updateNavbarVisibility('clientDash'); }
  window.scrollTo(0, 0);
}

// ============ CATEGORY PANEL ============
const catData = {
  codethali: { icon: '💻', title: 'CodeThali', subtitle: 'Technical services for every project', items: [{ name: 'Web Development', desc: 'Full website builds, landing pages, and web apps.', examples: ['Portfolio site', 'Landing page for startup', 'E-commerce store'] }, { name: 'App Development', desc: 'Mobile and desktop application development.', examples: ['Android utility app', 'React Native app', 'Desktop tool in Python'] }, { name: 'Debugging', desc: 'Fix bugs and issues in existing codebases.', examples: ['Fix login errors', 'Resolve UI glitches', 'Performance issues'] }] },
  creatix: { icon: '🎨', title: 'Creatix', subtitle: 'Creative design and visual content', items: [{ name: 'Poster Design', desc: 'Eye-catching posters for events, brands, and campaigns.', examples: ['Event poster', 'Brand awareness poster', 'College fest banner'] }, { name: 'Logo Design', desc: 'Professional logos with multiple format exports.', examples: ['Startup logo', 'Personal brand mark', 'Sports team logo'] }, { name: 'Thumbnail Creation', desc: 'Click-worthy thumbnails for YouTube and social media.', examples: ['YouTube thumbnail pack', 'Instagram story covers', 'Course thumbnails'] }] },
  quickbites: { icon: '⚡', title: 'QuickBites', subtitle: 'Quick, high-quality deliverables', items: [{ name: 'LinkedIn Setup', desc: 'Complete LinkedIn profile optimisation for visibility.', examples: ['Headline + summary rewrite', 'Skills endorsement strategy', 'Featured section setup'] }, { name: 'Data Entry', desc: 'Accurate and efficient data entry tasks.', examples: ['Excel data organisation', 'Product catalog entry', 'Form data processing'] }, { name: 'Portfolio Website', desc: 'Professional portfolio to showcase your work.', examples: ['Developer portfolio', 'Designer showcase', 'Freelancer profile site'] }] },
  teamup: { icon: '🤝', title: 'TeamUp', subtitle: 'Collaborate and build together', items: [{ name: 'Group Projects', desc: 'Find teammates for academic and personal projects.', examples: ['Final year project team', 'App development team', 'Research collaboration'] }, { name: 'Hackathon Teams', desc: 'Build or join teams for hackathons and competitions.', examples: ['SIH 2025 team', 'Coding competition partner', 'Designathon teammate'] }, { name: 'Startup Ideas', desc: 'Co-founder matching and idea validation.', examples: ['EdTech co-founder', 'Fintech idea partner', 'Social impact startup'] }] }
};

function openCategory(cat) {
  const d = catData[cat];
  document.getElementById('panelIcon').textContent = d.icon;
  document.getElementById('panelTitle').textContent = d.title;
  document.getElementById('panelSubtitle').textContent = d.subtitle;
  const container = document.getElementById('panelItems');
  container.innerHTML = '';
  document.getElementById('subDetailPanel').classList.add('hidden');
  document.getElementById('catPanelGetStarted').style.display = '';
  d.items.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'panel-item';
    div.textContent = item.name;
    div.style.animationDelay = (i * 0.07) + 's';
    div.onclick = () => openSubDetail(item);
    container.appendChild(div);
  });
  document.getElementById('catPanel').classList.remove('hidden');
}
function openSubDetail(item) {
  document.getElementById('subDetailContent').innerHTML = `<h3>${item.name}</h3><p>${item.desc}</p><h4 style="font-size:0.82rem;color:var(--text-dim);margin-bottom:8px;margin-top:4px">Example Tasks</h4><ul class="sub-examples">${item.examples.map(e=>`<li>→ ${e}</li>`).join('')}</ul><button class="btn-primary" style="margin-top:16px;width:100%" onclick="openAuth('signup')">Get Started →</button>`;
  document.getElementById('subDetailPanel').classList.remove('hidden');
  document.getElementById('catPanelGetStarted').style.display = 'none';
}
function closeSubDetail() { document.getElementById('subDetailPanel').classList.add('hidden'); document.getElementById('catPanelGetStarted').style.display = ''; }
function closeCategory() { document.getElementById('catPanel').classList.add('hidden'); }

// ============ PAYMENT BADGE HELPERS ============
function paymentBadge(task) {
  if (task.paymentStatus === 'released') return `<span class="payment-badge completed-tag">💰 Paid</span>`;
  if (task.paymentStatus === 'payment_secured') return `<span class="payment-badge secured">🔒 Payment Secured</span>`;
  return `<span class="payment-badge pending-badge">⏳ Pending</span>`;
}
function statusBadge(task) {
  if (task.status === 'completed') return `<span class="payment-badge completed-tag">✅ Completed</span>`;
  if (task.status === 'submitted') return `<span class="payment-badge submitted-badge">📤 Submitted</span>`;
  if (task.status === 'assigned') return `<span class="payment-badge inprogress">🔥 In Progress</span>`;
  return `<span class="payment-badge available-badge">🟢 Available</span>`;
}
function fmtBudget(b) { return b > 0 ? '₹' + b.toLocaleString('en-IN') : '₹0 (Collab)'; }

// ============ ALLOWED FILE TYPES BY CATEGORY ============
function getAllowedFileTypes(category) {
  const map = {
    codethali: { accept: '.zip,.pdf,.js,.html,.py,.java', label: '.zip / .pdf / source files' },
    creatix: { accept: '.png,.jpg,.jpeg,.svg,.pdf,.fig', label: '.png / .jpg / .svg / .pdf' },
    quickbites: { accept: '.pdf,.doc,.docx,.png,.jpg', label: '.pdf / .docx / .png' },
    teamup: { accept: '.pdf,.ppt,.pptx,.doc,.docx', label: '.pdf / .ppt / .docx' }
  };
  return map[category] || { accept: '*', label: 'Any file' };
}

// ============ AVAILABLE TASKS ============
function renderAvailableTasks(filter) {
  const container = document.getElementById('availableTasks');
  if (!container) return;
  container.innerHTML = '';

  const userApplied = studentActivity.applied || [];
  // Only show tasks that are 'available' (not assigned/submitted/completed/deleted)
  // AND are not already applied to by this student
  // AND (if assigned) not blocked for this student
  const available = taskStore.filter(t => {
    if (t.status !== 'available') return false;
    if (userApplied.includes(t.id)) return false;
    // If task has an accepted applicant that is NOT this student, hide it
    const apps = loadApplications(t.id);
    const hasAccepted = apps.some(a => a.status === 'accepted');
    if (hasAccepted) {
      const acceptedForMe = apps.some(a => a.status === 'accepted' && a.email === currentUser.email);
      if (!acceptedForMe) return false;
    }
    return true;
  });
  const tasks = filter === 'all' ? available : available.filter(t => t.category === filter);

  tasks.forEach((task, i) => {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.style.cursor = 'pointer';
    card.style.animation = 'fadeUp 0.4s ease both';
    card.style.animationDelay = (i * 0.05) + 's';
    const catEmoji = { codethali: '💻', creatix: '🎨', quickbites: '⚡', teamup: '🤝' }[task.category];
    const catLabel = { codethali: 'CodeThali', creatix: 'Creatix', quickbites: 'QuickBites', teamup: 'TeamUp' }[task.category];
    card.innerHTML = `
      <div class="task-info" style="pointer-events:none;">
        <span class="task-cat">${catEmoji} ${catLabel}</span>
        <h4>${task.title}</h4>
        <p>${task.desc.substring(0, 72)}...</p>
        <p style="font-size:0.78rem;color:var(--text-dim);margin-top:4px">📍 ${task.location || 'India'} &nbsp;·&nbsp; By ${task.client}</p>
      </div>
      <div class="task-meta" style="pointer-events:none;">
        <span class="budget">${fmtBudget(task.budget)}</span>
        <span class="deadline">⏰ ${task.deadline}</span>
      </div>`;
    card.addEventListener('click', function(e) { e.stopPropagation(); openTaskDetail(task); });
    container.appendChild(card);
  });
  if (tasks.length === 0) container.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:30px;">No tasks in this category yet.</p>';
}

function filterTasks(cat, btn) {
  document.querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAvailableTasks(cat);
}

// ============ STUDENT ACTIVE TASKS ============
function renderStudentActiveTasks() {
  const container = document.getElementById('studentActiveTasks');
  if (!container) return;
  container.innerHTML = '';
  // Only show tasks where this student was accepted AND task is assigned/active
  const active = taskStore.filter(t => {
    if (!studentActivity.active || !studentActivity.active.includes(t.id)) return false;
    if (t.status !== 'assigned') return false;
    // Verify this student is the accepted/assigned one
    if (t.assignedEmail && t.assignedEmail !== currentUser.email) return false;
    return true;
  });
  if (!active.length) { container.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:30px;">No active tasks yet. Apply for tasks to get started! 💪</p>'; return; }
  active.forEach(task => {
    const catEmoji = { codethali: '💻', creatix: '🎨', quickbites: '⚡', teamup: '🤝' }[task.category];
    const catLabel = { codethali: 'CodeThali', creatix: 'Creatix', quickbites: 'QuickBites', teamup: 'TeamUp' }[task.category];
    const card = document.createElement('div');
    card.className = 'task-card active-task';
    card.innerHTML = `
      <div class="task-info">
        <span class="task-cat">${catEmoji} ${catLabel}</span>
        <h4>${task.title}</h4>
        <p>${task.desc.substring(0, 65)}...</p>
      </div>
      <div class="task-meta">
        <span class="budget">${fmtBudget(task.budget)}</span>
        <span class="deadline">⏰ ${task.deadline}</span>
        ${paymentBadge(task)}
        ${statusBadge(task)}
        <div class="progress-bar"><div style="width:${Math.floor(Math.random()*40)+30}%"></div></div>
        <button class="btn-upload-work" onclick="openUploadWork(${task.id})">📤 Upload Work</button>
      </div>`;
    container.appendChild(card);
  });
  updateDynamicUI('student');
}

// ============ UPLOAD WORK FLOW ============
function openUploadWork(taskId) {
  const task = taskStore.find(t => t.id === taskId);
  if (!task) return;
  const fileTypes = getAllowedFileTypes(task.category);
  const overlay = document.getElementById('uploadWorkModal');
  if (overlay) {
    document.getElementById('uploadWorkTaskTitle').textContent = task.title;
    document.getElementById('uploadWorkConfirmBtn').onclick = () => confirmUploadWork(taskId);
    document.getElementById('uploadWorkBody').innerHTML = `
      <div class="form-group">
        <label style="color:var(--text-dim);font-size:0.85rem;display:block;margin-bottom:8px">Work Description / Link</label>
        <textarea class="form-input" id="uploadWorkDesc" rows="3" placeholder="Describe your work or paste a link (GitHub, Drive, Figma, etc.)..."></textarea>
      </div>
      <div class="upload-file-zone" id="uploadDropZone" onclick="triggerFileInput(${taskId})">
        <div class="upload-file-icon">📁</div>
        <p>Click to attach file</p>
        <p style="font-size:0.78rem;color:var(--text-dim);margin-top:4px">Allowed: <strong>${fileTypes.label}</strong></p>
        <span id="uploadFileName" style="color:var(--accent);font-size:0.82rem;margin-top:8px;display:block"></span>
      </div>
      <input type="file" id="realFileInput_${taskId}" accept="${fileTypes.accept}" style="display:none" onchange="handleFileSelect(event,${taskId})"/>
    `;
    overlay.classList.remove('hidden');
  }
}

let uploadedFiles = {};

function triggerFileInput(taskId) {
  const input = document.getElementById('realFileInput_' + taskId);
  if (input) input.click();
}

function handleFileSelect(event, taskId) {
  const file = event.target.files[0];
  if (!file) return;
  const el = document.getElementById('uploadFileName');
  if (el) el.innerHTML = `✅ <strong>${file.name}</strong> <span style="color:var(--text-dim)">(${(file.size/1024).toFixed(1)} KB)</span>`;

  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedFiles[taskId] = { name: file.name, type: file.type, size: file.size, dataUrl: e.target.result };
  };
  reader.readAsDataURL(file);
}

function confirmUploadWork(taskId) {
  const task = taskStore.find(t => t.id === taskId);
  if (!task) return;
  const descEl = document.getElementById('uploadWorkDesc');
  const desc = descEl ? descEl.value.trim() : 'Work submitted';

  if (!uploadedFiles[taskId]) {
    const zone = document.getElementById('uploadDropZone');
    if (zone) zone.style.borderColor = 'var(--red)';
    showToast('⚠️ Please attach a file before submitting.');
    return;
  }

  task.status = 'submitted';
  task.submittedWork = desc || 'Work submitted by student';
  task.submittedFile = uploadedFiles[taskId];

  if (!studentActivity.submitted) studentActivity.submitted = [];
  if (!studentActivity.submitted.includes(taskId)) studentActivity.submitted.push(taskId);
  studentActivity.active = studentActivity.active.filter(id => id !== taskId);
  saveTaskStore();
  saveStudentActivity(studentActivity);

  addNotification(currentUser.email, `📤 Work submitted for "${task.title}". Waiting for client payment.`, 'info');

  const allUsers = loadUsers();
  const clientUser = allUsers.find(u => u.name === task.client || u.email === task.clientEmail);
  if (clientUser) {
    addNotification(clientUser.email, `📤 ${currentUser.name} submitted work for "${task.title}". Review and pay to approve!`, 'info');
  }

  const overlay = document.getElementById('uploadWorkModal');
  if (overlay) overlay.classList.add('hidden');
  delete uploadedFiles[taskId];

  renderStudentActiveTasks();
  renderStudentSubmittedTasks();
  updateDynamicUI('student');
  showToast('📤 Work submitted! Waiting for client payment.');
}

function closeUploadWorkModal() {
  const overlay = document.getElementById('uploadWorkModal');
  if (overlay) overlay.classList.add('hidden');
}

// ============ STUDENT SUBMITTED TASKS ============
function renderStudentSubmittedTasks() {
  const container = document.getElementById('studentSubmittedTasks');
  if (!container) return;
  container.innerHTML = '';
  if (!studentActivity.submitted) studentActivity.submitted = [];
  const submitted = taskStore.filter(t => studentActivity.submitted.includes(t.id));
  if (!submitted.length) { container.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:30px;">No submitted tasks yet. Upload your work when ready! 📤</p>'; return; }
  submitted.forEach(task => {
    const catEmoji = { codethali: '💻', creatix: '🎨', quickbites: '⚡', teamup: '🤝' }[task.category];
    const catLabel = { codethali: 'CodeThali', creatix: 'Creatix', quickbites: 'QuickBites', teamup: 'TeamUp' }[task.category];
    const card = document.createElement('div');
    card.className = 'task-card';
    const isSecured = task.paymentStatus === 'payment_secured';
    const isReleased = task.paymentStatus === 'released';
    let statusMsg = '⏳ Waiting for client to pay...';
    if (isSecured) statusMsg = '🔒 Client paid! Admin is processing your payment.';
    if (isReleased) statusMsg = '✅ Payment received! ₹' + task.budget.toLocaleString('en-IN') + ' credited to your account.';
    const msgColor = isReleased ? '#7cfc90' : isSecured ? '#c9a8e0' : '#ffb347';
    card.innerHTML = `
      <div class="task-info">
        <span class="task-cat">${catEmoji} ${catLabel}</span>
        <h4>${task.title}</h4>
        <p style="color:${msgColor};font-size:0.83rem">${statusMsg}</p>
      </div>
      <div class="task-meta">
        <span class="budget">${fmtBudget(task.budget)}</span>
        ${paymentBadge(task)}
        <span class="payment-badge submitted-badge">📤 Submitted</span>
        ${isReleased ? '<span class="payment-badge completed-tag">💰 Paid!</span>' : ''}
      </div>`;
    container.appendChild(card);
  });
}

// ============ STUDENT COMPLETED TASKS ============
function renderStudentCompletedTasks() {
  const container = document.getElementById('studentCompletedTasks');
  if (!container) return;
  container.innerHTML = '';
  if (!studentActivity.completed) studentActivity.completed = [];
  const done = taskStore.filter(t => studentActivity.completed.includes(t.id));
  if (!done.length) { container.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:30px;">No completed tasks yet. Keep going! 🚀</p>'; return; }
  done.forEach(task => {
    const catEmoji = { codethali: '💻', creatix: '🎨', quickbites: '⚡', teamup: '🤝' }[task.category];
    const catLabel = { codethali: 'CodeThali', creatix: 'Creatix', quickbites: 'QuickBites', teamup: 'TeamUp' }[task.category];
    const card = document.createElement('div');
    card.className = 'task-card';
    card.innerHTML = `
      <div class="task-info">
        <span class="task-cat">${catEmoji} ${catLabel}</span>
        <h4>${task.title}</h4>
        <p>${task.desc.substring(0, 65)}...</p>
      </div>
      <div class="task-meta">
        <span class="budget">${fmtBudget(task.budget)}</span>
        <span class="payment-badge completed-tag">✅ Completed</span>
        <span class="payment-badge completed-tag">💰 Credited</span>
        <span style="font-size:0.78rem;color:#7cfc90">⭐ 5.0</span>
      </div>`;
    container.appendChild(card);
  });
}

// ============ TASK DETAIL MODAL (STUDENT) ============
function openTaskDetail(task) {
  const catEmoji = { codethali: '💻', creatix: '🎨', quickbites: '⚡', teamup: '🤝' }[task.category];
  const catLabel = { codethali: 'CodeThali', creatix: 'Creatix', quickbites: 'QuickBites', teamup: 'TeamUp' }[task.category];
  const applied = studentActivity.applied && studentActivity.applied.includes(task.id);
  const apps = loadApplications(task.id);
  const myApp = apps.find(a => a.email === currentUser.email);
  const isAccepted = myApp && myApp.status === 'accepted';
  const isRejected = myApp && myApp.status === 'rejected';
  const hasLinkedin = !!loadLinkedInUrl(currentUser.email);

  let applyBtn = '';
  if (isRejected) {
    applyBtn = `<button class="btn-primary" style="opacity:0.6;cursor:not-allowed;pointer-events:none">❌ Not Selected</button>`;
  } else if (isAccepted) {
    applyBtn = `<button class="btn-primary" style="background:linear-gradient(135deg,#7cfc90,#4caf50);cursor:not-allowed;pointer-events:none">✅ Accepted — Work in Progress</button>`;
  } else if (applied) {
    applyBtn = `<button class="btn-primary" style="opacity:0.6;cursor:not-allowed;pointer-events:none">✅ Applied — Awaiting Review</button>`;
  } else if (!hasLinkedin) {
    applyBtn = `<button class="btn-primary" onclick="closeTaskModal();setTimeout(()=>goToStudentProfile(),400)">🔗 Add LinkedIn to Apply →</button>`;
  } else {
    applyBtn = `<button class="btn-primary" onclick="applyForTask(${task.id})">Apply Now →</button>`;
  }

  document.getElementById('taskDetailContent').innerHTML = `
    <span class="task-cat" style="margin-bottom:16px;display:inline-block">${catEmoji} ${catLabel}</span>
    <h2 style="font-family:'Playfair Display',serif;font-size:1.6rem;margin-bottom:20px;color:var(--white)">${task.title}</h2>
    <div class="client-info">
      <div class="client-avatar">${task.client.split(' ').map(w=>w[0]).join('')}</div>
      <div class="client-details"><h3>${task.client}</h3><p>📍 ${task.location} &nbsp;·&nbsp; ⭐ ${task.rating} &nbsp;·&nbsp; ${task.projects} projects posted</p></div>
    </div>
    <div class="client-meta">
      <div class="cm"><span>Budget</span><strong>${fmtBudget(task.budget)}</strong></div>
      <div class="cm"><span>Deadline</span><strong>${task.deadline}</strong></div>
      <div class="cm"><span>Status</span><strong>${task.status.charAt(0).toUpperCase()+task.status.slice(1)}</strong></div>
    </div>
    <div class="task-desc"><h4>Task Description</h4><p>${task.desc}</p></div>
    <div class="task-desc"><h4>Required Skills</h4><div class="skills-row">${task.skills.map(s=>`<span class="skill-tag">${s}</span>`).join('')}</div></div>
    ${!hasLinkedin && !applied ? `<p style="color:#ffb347;font-size:0.82rem;margin-bottom:12px;">⚠️ LinkedIn profile required to apply. <a href="#" onclick="closeTaskModal();setTimeout(()=>goToStudentProfile(),400)" style="color:var(--accent)">Add it here →</a></p>` : ''}
    <div class="detail-btns">
      <button class="btn-secondary" onclick="closeTaskModal()">Close</button>
      ${applyBtn}
    </div>`;
  document.getElementById('taskModal').classList.remove('hidden');
}

function closeTaskModal() { document.getElementById('taskModal').classList.add('hidden'); }

// ============ APPLY = SAVE APPLICATION (client must accept before task is assigned) ============
function applyForTask(taskId) {
  const task = taskStore.find(t => t.id === taskId);
  if (!task || task.status !== 'available') return;

  // Check LinkedIn
  const linkedinUrl = loadLinkedInUrl(currentUser.email);
  if (!linkedinUrl) {
    showToast('⚠️ Please add your LinkedIn profile in your Profile page before applying.');
    closeTaskModal();
    setTimeout(() => goToStudentProfile(), 400);
    return;
  }

  // Do NOT assign the task yet — just record the application
  if (!studentActivity.applied) studentActivity.applied = [];
  if (!studentActivity.applied.includes(taskId)) studentActivity.applied.push(taskId);

  // Save application data with linkedin
  saveApplications(taskId, {
    name: currentUser.name || 'Student',
    email: currentUser.email || '',
    linkedin: linkedinUrl,
    appliedAt: new Date().toLocaleString(),
    status: 'pending' // pending | accepted | rejected
  });

  saveTaskStore();
  saveStudentActivity(studentActivity);

  addNotification(currentUser.email, `✅ You applied for "${task.title}". Waiting for client review. 🚀`, 'success');

  const allUsers = loadUsers();
  const clientUser = allUsers.find(u => u.name === task.client || u.email === task.clientEmail);
  if (clientUser) {
    addNotification(clientUser.email, `👤 New applicant for "${task.title}"! Student: ${currentUser.name}`, 'info');
  }
  if (task.clientEmail && (!clientUser || clientUser.email !== task.clientEmail)) {
    addNotification(task.clientEmail, `👤 New applicant for "${task.title}"! Student: ${currentUser.name}`, 'info');
  }

  closeTaskModal();
  renderAvailableTasks('all');
  updateDynamicUI('student');
  showToast(`✅ Applied for "${task.title}"! Waiting for client to review your application.`);
}

// ============ CLIENT ACCEPTS APPLICANT ============
function acceptApplicant(taskId, applicantEmail) {
  const task = taskStore.find(t => t.id === taskId);
  if (!task) return;

  const apps = loadApplications(taskId);
  const applicant = apps.find(a => a.email === applicantEmail);
  if (!applicant) return;

  // Mark accepted applicant
  apps.forEach(a => {
    if (a.email === applicantEmail) {
      a.status = 'accepted';
    } else {
      // Reject all others
      if (a.status !== 'rejected') {
        a.status = 'rejected';
        addNotification(a.email, `❌ You were not selected for "${task.title}". Try your best next time.`, 'warning');
        // Remove task from their applied/active lists
        _removeTaskFromStudentActivity(a.email, taskId);
      }
    }
  });
  // Save updated apps
  try { localStorage.setItem('st_apps_' + taskId, JSON.stringify(apps)); } catch(e) {}

  // Now assign task to accepted student
  task.status = 'assigned';
  task.paymentStatus = 'pending';
  task.assignedTo = applicant.name || 'Student';
  task.assignedEmail = applicantEmail;

  // Update accepted student activity: move from applied → active
  const allUsers = loadUsers();
  const stuKey = getActivityKey(applicantEmail);
  try {
    const data = localStorage.getItem(stuKey);
    const act = data ? JSON.parse(data) : { applied: [], active: [], completed: [], submitted: [] };
    if (!act.active) act.active = [];
    if (!act.active.includes(taskId)) act.active.push(taskId);
    localStorage.setItem(stuKey, JSON.stringify(act));
  } catch(e) {}

  // If it's the current user's session
  if (currentUser.email === applicantEmail) {
    if (!studentActivity.active) studentActivity.active = [];
    if (!studentActivity.active.includes(taskId)) studentActivity.active.push(taskId);
    saveStudentActivity(studentActivity);
  }

  addNotification(applicantEmail, `🎉 Congratulations! You were accepted for "${task.title}". Start working now!`, 'success');
  addNotification(currentUser.email, `✅ You accepted ${applicant.name} for "${task.title}".`, 'success');

  saveTaskStore();
  openApplicantsModal(taskId); // refresh the modal
  renderClientTasks();
  showToast(`✅ ${applicant.name} accepted for "${task.title}"!`);
}

// ============ CLIENT REJECTS APPLICANT ============
function rejectApplicant(taskId, applicantEmail) {
  const task = taskStore.find(t => t.id === taskId);
  if (!task) return;

  const apps = loadApplications(taskId);
  const applicant = apps.find(a => a.email === applicantEmail);
  if (!applicant) return;

  applicant.status = 'rejected';
  try { localStorage.setItem('st_apps_' + taskId, JSON.stringify(apps)); } catch(e) {}

  addNotification(applicantEmail, `❌ You were not selected for "${task.title}". Try your best next time.`, 'warning');
  _removeTaskFromStudentActivity(applicantEmail, taskId);

  openApplicantsModal(taskId); // refresh the modal
  showToast(`❌ ${applicant.name} rejected.`);
}

// ============ HELPER: Remove task from a student's activity ============
function _removeTaskFromStudentActivity(email, taskId) {
  const key = getActivityKey(email);
  try {
    const data = localStorage.getItem(key);
    if (data) {
      const act = JSON.parse(data);
      act.applied = (act.applied || []).filter(id => id !== taskId);
      act.active  = (act.active  || []).filter(id => id !== taskId);
      localStorage.setItem(key, JSON.stringify(act));
    }
  } catch(e) {}
  // Also update in-memory if it's current user
  if (currentUser.email === email) {
    studentActivity.applied = (studentActivity.applied || []).filter(id => id !== taskId);
    studentActivity.active  = (studentActivity.active  || []).filter(id => id !== taskId);
    saveStudentActivity(studentActivity);
  }
}

// ============ CLIENT TASKS ============
function renderClientTasks() {
  const container = document.getElementById('clientPostedTasks');
  if (!container) return;
  container.innerHTML = '';
  // Only show tasks posted by this client (by email for accuracy)
  const myTasks = taskStore.filter(t => t.clientEmail === currentUser.email || (t.postedByUser && t.client === (currentUser.name || '')));
  const activeTasks = myTasks.filter(t => t.status === 'available' || t.status === 'assigned');

  if (!activeTasks.length) {
    container.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:30px;">No active tasks. Post a new task!</p>';
    return;
  }

  activeTasks.forEach(task => {
    const catEmoji = { codethali: '💻', creatix: '🎨', quickbites: '⚡', teamup: '🤝' }[task.category];
    const catLabel = { codethali: 'CodeThali', creatix: 'Creatix', quickbites: 'QuickBites', teamup: 'TeamUp' }[task.category];
    const card = document.createElement('div');
    card.className = 'task-card';
    card.setAttribute('data-task-id', task.id);
    card.innerHTML = `
      <div class="task-info">
        <span class="task-cat">${catEmoji} ${catLabel}</span>
        <h4>${task.title}</h4>
        <p>${task.desc.substring(0, 65)}...</p>
      </div>
      <div class="task-meta">
        <span class="budget">${fmtBudget(task.budget)}</span>
        <span class="deadline">⏰ ${task.deadline}</span>
        ${statusBadge(task)}
        ${paymentBadge(task)}
        <span style="font-size:0.78rem;color:var(--accent)">👥 ${loadApplications(task.id).length} applicant${loadApplications(task.id).length !== 1 ? 's' : ''}</span>
        <div class="task-action-row">
          <button class="btn-ghost-sm" onclick="event.stopPropagation();openApplicantsModal(${task.id})" style="font-size:0.75rem;padding:5px 12px;">👁 View Applicants</button>
          <button class="btn-delete-task" onclick="deleteTask(event,${task.id})">🗑️ Delete</button>
        </div>
      </div>`;
    card.onclick = () => openClientTaskDetail(task);
    container.appendChild(card);
  });
  updateDynamicUI('client');
}

// ============ CLIENT SUBMITTED TASKS — PAY NOW after submission only ============
function renderClientSubmittedTasks() {
  const container = document.getElementById('clientSubmittedTasksList');
  if (!container) return;
  container.innerHTML = '';

  // Only show tasks submitted for this client's tasks
  const submitted = taskStore.filter(t => t.status === 'submitted' && (t.clientEmail === currentUser.email || (t.postedByUser && t.client === (currentUser.name || ''))));
  if (!submitted.length) {
    container.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:30px;">No tasks submitted for review yet. Students will submit work here once done.</p>';
    return;
  }

  submitted.forEach(task => {
    const catEmoji = { codethali: '💻', creatix: '🎨', quickbites: '⚡', teamup: '🤝' }[task.category];
    const catLabel = { codethali: 'CodeThali', creatix: 'Creatix', quickbites: 'QuickBites', teamup: 'TeamUp' }[task.category];
    const fee = getPlatformFee(task.budget);
    const total = getTotalClientPays(task.budget);
    const card = document.createElement('div');
    card.className = 'task-card submitted-review-card';
    const fileHtml = task.submittedFile ? `
      <div class="submitted-file-preview">
        <span class="file-icon">${getFileIcon(task.submittedFile.name)}</span>
        <div class="file-info">
          <strong>${task.submittedFile.name}</strong>
          <span>${(task.submittedFile.size/1024).toFixed(1)} KB</span>
        </div>
        <button class="btn-file-download" onclick="event.stopPropagation();downloadFile(${task.id})">⬇ Download</button>
      </div>` : '';

    // Payment block:
    // - paymentStatus === 'pending'  → Show "Pay Now" button (payment not yet made)
    // - paymentStatus === 'payment_secured' → Show "Awaiting Admin" state
    // - budget === 0 → Show "Mark Complete" for collab tasks
    let payBlock = '';
    if (task.budget > 0) {
      if (task.paymentStatus === 'pending') {
        payBlock = `
          <div class="pay-required-notice">
            <span>💳 Pay to approve this work</span>
            <div class="fee-breakdown">
              <span>Student gets: <strong>₹${task.budget.toLocaleString('en-IN')}</strong></span>
              <span>Platform fee (25%): <strong>₹${fee.toLocaleString('en-IN')}</strong></span>
              <span class="total-pay">You pay: <strong>₹${total.toLocaleString('en-IN')}</strong></span>
            </div>
            <button class="btn-pay-now-active" onclick="event.stopPropagation();simulatePayment(${task.id})">💳 Pay ₹${total.toLocaleString('en-IN')} & Approve</button>
          </div>`;
      } else if (task.paymentStatus === 'payment_secured') {
        payBlock = `
          <div class="pay-secured-admin-notice">
            <span>🔒 Payment secured — Admin is releasing payment to student</span>
          </div>`;
      }
    } else {
      if (task.paymentStatus === 'pending') {
        payBlock = `<button class="btn-approve-release" onclick="event.stopPropagation();approveCollab(${task.id})">✅ Mark as Complete</button>`;
      }
    }

    card.innerHTML = `
      <div class="task-info">
        <span class="task-cat">${catEmoji} ${catLabel}</span>
        <h4>${task.title}</h4>
        <p style="color:var(--text-dim);font-size:0.83rem">Submitted by: <strong style="color:var(--white)">${task.assignedTo || 'Student'}</strong></p>
        ${task.submittedWork ? `<p style="font-size:0.8rem;color:var(--accent);margin-top:4px">📝 "${task.submittedWork.substring(0,80)}${task.submittedWork.length > 80 ? '...' : ''}"</p>` : ''}
        ${fileHtml}
      </div>
      <div class="task-meta">
        <span class="budget">${fmtBudget(task.budget)}</span>
        <span class="payment-badge submitted-badge">📤 Work Submitted</span>
        ${paymentBadge(task)}
        ${payBlock}
      </div>`;
    container.appendChild(card);
  });
}

// Approve collab (budget=0) task
function approveCollab(taskId) {
  const task = taskStore.find(t => t.id === taskId);
  if (!task) return;
  task.status = 'completed';
  task.paymentStatus = 'released';
  _moveStudentToCompleted(taskId, task);
  saveTaskStore();
  renderClientSubmittedTasks();
  renderClientCompletedTasks();
  showToast(`✅ Task "${task.title}" marked complete!`);
}

function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const icons = { zip: '🗜️', pdf: '📄', png: '🖼️', jpg: '🖼️', jpeg: '🖼️', svg: '🎨', fig: '🎨', html: '🌐', js: '⚙️', py: '🐍', java: '☕', doc: '📝', docx: '📝', ppt: '📊', pptx: '📊' };
  return icons[ext] || '📎';
}

function downloadFile(taskId) {
  const task = taskStore.find(t => t.id === taskId);
  if (!task || !task.submittedFile) { showToast('⚠️ No file available for download.'); return; }
  const { dataUrl, name } = task.submittedFile;
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('⬇️ Downloading: ' + name);
}

// ============ CLIENT COMPLETED TASKS ============
function renderClientCompletedTasks() {
  const container = document.getElementById('clientCompletedTasksList');
  if (!container) return;
  container.innerHTML = '';
  const completed = taskStore.filter(t => t.status === 'completed' && (t.clientEmail === currentUser.email || (t.postedByUser && t.client === (currentUser.name || ''))));
  if (!completed.length) { container.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:30px;">No completed tasks yet.</p>'; return; }
  completed.forEach(task => {
    const catEmoji = { codethali: '💻', creatix: '🎨', quickbites: '⚡', teamup: '🤝' }[task.category];
    const catLabel = { codethali: 'CodeThali', creatix: 'Creatix', quickbites: 'QuickBites', teamup: 'TeamUp' }[task.category];
    const fee = getPlatformFee(task.budget);
    const total = getTotalClientPays(task.budget);
    const card = document.createElement('div');
    card.className = 'task-card';
    card.innerHTML = `
      <div class="task-info">
        <span class="task-cat">${catEmoji} ${catLabel}</span>
        <h4>${task.title}</h4>
        <p>Completed by: <strong style="color:var(--accent)">${task.assignedTo || 'Student'}</strong></p>
        ${task.budget > 0 ? `<p style="font-size:0.78rem;color:var(--text-dim);margin-top:4px">You paid ₹${total.toLocaleString('en-IN')} (₹${task.budget.toLocaleString('en-IN')} to student + ₹${fee.toLocaleString('en-IN')} platform fee)</p>` : ''}
      </div>
      <div class="task-meta">
        <span class="budget">${fmtBudget(task.budget)}</span>
        <span class="payment-badge completed-tag">✅ Completed</span>
        <span class="payment-badge completed-tag">💰 Paid</span>
        <span style="font-size:0.78rem;color:#7cfc90">⭐ Great work!</span>
      </div>`;
    container.appendChild(card);
  });
}

// ============ SIMULATE PAYMENT — CLIENT PAYS → PAYMENT SECURED (admin must then release) ============
function simulatePayment(taskId) {
  const task = taskStore.find(t => t.id === taskId);
  if (!task || task.paymentStatus !== 'pending') return;  // prevent double-click

  const fee = getPlatformFee(task.budget);
  const total = getTotalClientPays(task.budget);

  const overlay = document.getElementById('paymentSimModal');
  if (overlay) {
    document.getElementById('paySimTaskTitle').textContent = task.title;
    document.getElementById('paySimAmount').textContent = '₹' + total.toLocaleString('en-IN');
    const feeBreakdown = document.getElementById('paySimFeeBreakdown');
    if (feeBreakdown) {
      feeBreakdown.innerHTML = `
        <div class="pay-sim-row"><span>Student receives</span><strong style="color:var(--green)">₹${task.budget.toLocaleString('en-IN')}</strong></div>
        <div class="pay-sim-row"><span>Platform fee (25%)</span><strong style="color:var(--purple)">₹${fee.toLocaleString('en-IN')}</strong></div>
        <div class="pay-sim-row total"><span>Total you pay</span><strong>₹${total.toLocaleString('en-IN')}</strong></div>
      `;
    }
    const body = document.getElementById('paySimBody');
    if (body) {
      body.innerHTML = `
        <button class="btn-primary full" id="paySimConfirmBtn" onclick="confirmPayment(${taskId})">🔒 Pay ₹${total.toLocaleString('en-IN')} & Secure</button>
        <p style="text-align:center;font-size:0.78rem;color:var(--text-dim);margin-top:12px;">🛡️ 100% secure simulation — no real payment</p>
      `;
    }
    overlay.classList.remove('hidden');
  }
}

// ============ CONFIRM PAYMENT: client pays → secured in escrow, admin notified ============
function confirmPayment(taskId) {
  const task = taskStore.find(t => t.id === taskId);
  if (!task || task.paymentStatus !== 'pending') return;  // idempotency guard

  const fee = getPlatformFee(task.budget);
  const total = getTotalClientPays(task.budget);

  // Disable the button immediately to prevent double-click
  const btn = document.getElementById('paySimConfirmBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Processing...'; }

  const body = document.getElementById('paySimBody');
  if (body) {
    body.innerHTML = `<div class="pay-processing"><div class="pay-spinner"></div><p>Processing payment...</p></div>`;
  }

  setTimeout(() => {
    // Mark payment as secured (goes to platform, admin must release to student)
    task.paymentStatus = 'payment_secured';
    saveTaskStore();

    if (body) {
      body.innerHTML = `
        <div class="pay-success">
          <div class="pay-success-icon">🔒</div>
          <h3>Payment Secured!</h3>
          <p>₹${total.toLocaleString('en-IN')} received by platform.</p>
          <div class="pay-breakdown-success">
            <div>🎓 Student will receive: <strong style="color:var(--green)">₹${task.budget.toLocaleString('en-IN')}</strong></div>
            <div>🏢 Platform fee: <strong style="color:var(--purple)">₹${fee.toLocaleString('en-IN')}</strong></div>
          </div>
          <p style="margin-top:12px;font-size:0.85rem;color:var(--blue)">⏳ Admin will release payment to student shortly.</p>
          <button class="btn-primary" onclick="closePaymentModal()" style="margin-top:16px;width:100%">Done</button>
        </div>`;
    }

    // Notify student: client has paid
    const allUsers = loadUsers();
    const studentEmail = _findStudentEmail(task, allUsers);
    if (studentEmail) {
      addNotification(studentEmail, `🔒 Client paid for "${task.title}"! ₹${task.budget.toLocaleString('en-IN')} is secured. Admin will release it to you shortly.`, 'success');
    }

    // Notify admin: new payment received
    addNotification('admin@skillthali.com', `💰 New payment received! Client paid ₹${total.toLocaleString('en-IN')} for "${task.title}". Student "${task.assignedTo}" is waiting for ₹${task.budget.toLocaleString('en-IN')}.`, 'info');

    // Notify current client
    addNotification(currentUser.email, `✅ Payment of ₹${total.toLocaleString('en-IN')} secured for "${task.title}". Admin will release to ${task.assignedTo || 'student'}.`, 'success');

    renderClientSubmittedTasks();
    updateDynamicUI('client');
    showToast(`🔒 Payment secured! Admin will release ₹${task.budget.toLocaleString('en-IN')} to ${task.assignedTo || 'student'}.`);
  }, 1500);
}

// Helper to find student email from task assignedTo name
function _findStudentEmail(task, allUsers) {
  const studentUser = allUsers.find(u => u.name === task.assignedTo || u.role === 'student');
  // Try to find by checking activity stores
  for (const u of allUsers) {
    const key = getActivityKey(u.email);
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const act = JSON.parse(data);
        if ((act.submitted && act.submitted.includes(task.id)) ||
            (act.active && act.active.includes(task.id)) ||
            (act.applied && act.applied.includes(task.id))) {
          return u.email;
        }
      }
    } catch(e) {}
  }
  return studentUser ? studentUser.email : null;
}

function closePaymentModal() {
  const overlay = document.getElementById('paymentSimModal');
  if (overlay) overlay.classList.add('hidden');
  renderClientSubmittedTasks();
  renderClientCompletedTasks();
}

// Helper: move task from submitted → completed in all student activity stores
function _moveStudentToCompleted(taskId, task) {
  const allUsers = loadUsers();
  allUsers.forEach(u => {
    const key = getActivityKey(u.email);
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const act = JSON.parse(data);
        if (act.submitted && act.submitted.includes(taskId)) {
          if (!act.completed) act.completed = [];
          if (!act.completed.includes(taskId)) act.completed.push(taskId);
          act.submitted = act.submitted.filter(id => id !== taskId);
          act.active = (act.active || []).filter(id => id !== taskId);
          localStorage.setItem(key, JSON.stringify(act));
        }
      }
    } catch(e) {}
  });

  if (studentActivity.submitted && studentActivity.submitted.includes(taskId)) {
    if (!studentActivity.completed) studentActivity.completed = [];
    if (!studentActivity.completed.includes(taskId)) studentActivity.completed.push(taskId);
    studentActivity.submitted = studentActivity.submitted.filter(id => id !== taskId);
    saveStudentActivity(studentActivity);
  }
}

// ============ DELETE TASK ============
function deleteTask(e, id) {
  e.stopPropagation();

  const task = taskStore.find(t => t.id === id);
  const taskTitle = task ? task.title : 'Task';

  // Notify all applicants that the task was removed
  const apps = loadApplications(id);
  apps.forEach(a => {
    addNotification(a.email, `⚠️ Task "${taskTitle}" was removed by the client.`, 'warning');
  });
  clearApplicationsForTask(id);

  taskStore = taskStore.filter(t => t.id !== id);

  const allUsers = loadUsers();
  allUsers.forEach(u => {
    const key = getActivityKey(u.email);
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const act = JSON.parse(data);
        act.applied   = (act.applied   || []).filter(i => i !== id);
        act.active    = (act.active    || []).filter(i => i !== id);
        act.submitted = (act.submitted || []).filter(i => i !== id);
        act.completed = (act.completed || []).filter(i => i !== id);
        localStorage.setItem(key, JSON.stringify(act));
      }
    } catch(e2) {}
  });

  studentActivity.applied   = studentActivity.applied.filter(i => i !== id);
  studentActivity.active    = studentActivity.active.filter(i => i !== id);
  if (studentActivity.submitted) studentActivity.submitted = studentActivity.submitted.filter(i => i !== id);
  if (studentActivity.completed) studentActivity.completed = studentActivity.completed.filter(i => i !== id);

  saveTaskStore();
  renderClientTasks();
  renderAvailableTasks('all');
  showToast(`🗑️ "${taskTitle}" deleted.`);
}

function openPostTask() { document.getElementById('postTaskModal').classList.remove('hidden'); }
function closePostTask() { document.getElementById('postTaskModal').classList.add('hidden'); }

// ============ CLIENT TASK DETAIL MODAL ============
function openClientTaskDetail(task) {
  const catEmoji = { codethali: '💻', creatix: '🎨', quickbites: '⚡', teamup: '🤝' }[task.category];
  const catLabel = { codethali: 'CodeThali', creatix: 'Creatix', quickbites: 'QuickBites', teamup: 'TeamUp' }[task.category];
  let payLabel = '⏳ Pending';
  if (task.paymentStatus === 'payment_secured') payLabel = '🔒 Payment Secured';
  if (task.paymentStatus === 'released') payLabel = '💰 Released';
  const statusLabel = task.status === 'completed' ? '✅ Completed' : task.status === 'submitted' ? '📤 Submitted' : task.status === 'assigned' ? '🔥 In Progress' : '🟢 Available';
  document.getElementById('clientTaskDetailContent').innerHTML = `
    <span class="task-cat" style="margin-bottom:12px;display:inline-block">${catEmoji} ${catLabel}</span>
    <h2 class="ctd-title">${task.title}</h2>
    <div class="ctd-meta">
      <div class="ctd-meta-item"><span>Budget</span><strong>${fmtBudget(task.budget)}</strong></div>
      <div class="ctd-meta-item"><span>Deadline</span><strong>⏰ ${task.deadline}</strong></div>
      <div class="ctd-meta-item"><span>Status</span><strong>${statusLabel}</strong></div>
      <div class="ctd-meta-item"><span>Payment</span><strong>${payLabel}</strong></div>
      ${task.assignedTo ? `<div class="ctd-meta-item"><span>Assigned To</span><strong>🎓 ${task.assignedTo}</strong></div>` : ''}
    </div>
    <div class="ctd-desc-block"><h4>Description</h4><p>${task.desc}</p></div>
    ${task.skills && task.skills.length ? `<div class="ctd-desc-block"><h4>Required Skills</h4><div class="skills-row">${task.skills.map(s=>`<span class="skill-tag">${s}</span>`).join('')}</div></div>` : ''}
    ${task.submittedWork ? `<div class="ctd-desc-block"><h4>📤 Submitted Work</h4><p style="color:var(--accent)">${task.submittedWork}</p></div>` : ''}
    ${task.submittedFile ? `<div class="ctd-desc-block"><h4>📎 Submitted File</h4>
      <div class="submitted-file-preview">
        <span class="file-icon">${getFileIcon(task.submittedFile.name)}</span>
        <div class="file-info"><strong>${task.submittedFile.name}</strong><span>${(task.submittedFile.size/1024).toFixed(1)} KB</span></div>
        <button class="btn-file-download" onclick="downloadFile(${task.id})">⬇ Download</button>
      </div></div>` : ''}
    <button class="btn-ghost ctd-close-btn" onclick="closeClientTaskModal()">Close</button>
  `;
  document.getElementById('clientTaskModal').classList.remove('hidden');
}
function closeClientTaskModal() { document.getElementById('clientTaskModal').classList.add('hidden'); }

function submitTask() {
  const titleEl = document.getElementById('taskTitle') || document.getElementById('taskTitle2');
  const catEl = document.getElementById('taskCategory') || document.getElementById('taskCategory2');
  const budgetEl = document.getElementById('taskBudget') || document.getElementById('taskBudget2');
  const skillsEl = document.getElementById('taskSkills') || document.getElementById('taskSkills2');
  const locationEl = document.getElementById('taskLocation') || document.getElementById('taskLocation2');
  const descEl = document.getElementById('taskDesc') || document.getElementById('taskDesc2');

  const title = titleEl ? titleEl.value.trim() : '';
  const cat = catEl ? catEl.value : '';
  const budget = budgetEl ? (parseInt(budgetEl.value) || 0) : 0;
  const skills = skillsEl ? skillsEl.value.trim() : '';
  const location = locationEl ? (locationEl.value.trim() || 'India') : 'India';
  const desc = descEl ? descEl.value.trim() : '';

  if (!title || !cat || !desc) {
    shake(document.querySelector('.post-task-inline') || document.querySelector('#postTaskModal .modal-box'));
    return;
  }

  const newTask = {
    id: Date.now(), title, category: cat, budget,
    skills: skills.split(',').map(s => s.trim()).filter(Boolean),
    desc, client: currentUser.name || 'Client',
    clientEmail: currentUser.email || '',
    location: location, rating: '4.8', projects: 1,
    deadline: '7 days', status: 'available', paymentStatus: 'pending', assignedTo: null,
    submittedWork: null, submittedFile: null, postedByUser: true
  };
  taskStore.unshift(newTask);

  saveTaskStore();
  closePostTask();
  [titleEl, budgetEl, skillsEl, locationEl, descEl].forEach(el => { if (el) el.value = ''; });
  if (catEl) catEl.value = '';
  renderClientTasks();

  addNotification(currentUser.email, `🎉 Task "${title}" posted! Students can now apply.`, 'success');
  showToast('🎉 Task posted! Students can now apply.');
}

// ============ TOAST ============
function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = `position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(20px);background:linear-gradient(135deg,rgba(68,23,82,0.97),rgba(129,116,160,0.96));border:1px solid rgba(239,182,200,0.3);border-radius:50px;padding:13px 28px;font-size:0.9rem;color:#F0ECE5;z-index:9999;opacity:0;transition:all 0.35s ease;box-shadow:0 8px 30px rgba(0,0,0,0.4);font-family:'DM Sans',sans-serif;white-space:nowrap;max-width:90vw;text-align:center;`;
  document.body.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity='1'; t.style.transform='translateX(-50%) translateY(0)'; });
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(20px)'; setTimeout(() => t.remove(), 400); }, 3500);
}

// ============ SHAKE ============
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}`;
document.head.appendChild(shakeStyle);

// ============ CLICK OUTSIDE CLOSE ============
document.addEventListener('click', (e) => {
  if (!e.target.closest('.profile-dropdown-wrapper') && !e.target.closest('.notif-bell-wrapper')) {
    document.querySelectorAll('.profile-dropdown-menu, .notif-dropdown').forEach(m => m.classList.remove('open'));
  }
  const ss = document.getElementById('studentSidebar');
  if (ss && ss.classList.contains('open') && !e.target.closest('#studentSidebar') && !e.target.closest('.dash-sidebar-toggle')) ss.classList.remove('open');
  const cs = document.getElementById('clientSidebar');
  if (cs && cs.classList.contains('open') && !e.target.closest('#clientSidebar') && !e.target.closest('.dash-sidebar-toggle')) cs.classList.remove('open');
});

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
  // Always load tasks from localStorage first so posted tasks persist and are visible to all users
  const savedTasks = loadTaskStore();
  if (savedTasks && savedTasks.length) taskStore = savedTasks;

  // Check for existing session and auto-redirect to correct dashboard
  const savedUser = loadUser();
  if (savedUser && savedUser.email && savedUser.role) {
    currentUser = savedUser;
    studentActivity = loadStudentActivity();
    if (savedUser.role === 'admin') {
      goToAdminDash();
    } else {
      goToDashboard(savedUser.role);
    }
    return;
  }

  // No session — show home page
  document.getElementById('home').classList.add('active');
  updateNavbarVisibility('home');
  renderAvailableTasks('all');
});

function selectPayMethod(btn) {
  document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}
function toggleAdminSidebar() {
  document.getElementById('adminSidebar').classList.toggle('open');
}

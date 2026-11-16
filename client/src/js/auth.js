const AUTH_STORAGE_KEY = 'vams_current_user';
const USERS_DB_KEY = 'vams_registered_users';

const DEMO_ACCOUNTS = [
  { role: 'organizer', label: '👑 Event Organizer', name: 'Priya Verma', email: 'priya.organizer@college.edu', dept: 'ACM & GDSC Chapter' },
  { role: 'attendee', label: '🎓 Student Attendee', name: 'Rahul Sharma', email: 'rahul.s@college.edu', dept: 'B.Tech CSE' },
  { role: 'venue_manager', label: '🏛️ Venue Manager', name: 'Dr. Arvind Nair', email: 'venues@college.edu', dept: 'Campus Infrastructure' },
  { role: 'staff', label: '🎫 Event Staff / QR', name: 'Vikram Joshi', email: 'gate.staff@college.edu', dept: 'Event Operations' },
  { role: 'superadmin', label: '⚡ Super Admin', name: 'Dean Student Affairs', email: 'admin@college.edu', dept: 'Administration' }
];

export class AuthManager {
  constructor() {
    this.mode = 'login'; // 'login' | 'register'
    this.selectedRole = 'organizer';
  }

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  getRegisteredUsers() {
    try {
      const raw = localStorage.getItem(USERS_DB_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveSession(userObj) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userObj));
    this.syncAppRoleAndHeader(userObj);
  }

  logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.syncAppRoleAndHeader(null);
    this.openAuthPage('login');
  }

  syncAppRoleAndHeader(user = this.getCurrentUser()) {
    const authBtn = document.getElementById('btn-header-auth');
    if (authBtn) {
      if (user && user.name) {
        authBtn.innerHTML = `👤 ${this.escapeHTML(user.name.split(' ')[0])} · Logout`;
        authBtn.title = `Signed in as ${user.name} (${user.role}). Click to switch account or logout.`;
      } else {
        authBtn.innerHTML = `🔐 Sign In`;
        authBtn.title = 'Open VAMS Login & Registration Portal';
      }
    }

    if (user && user.role && window.vamsApp) {
      document.querySelectorAll('.active-role-label').forEach(el => {
        el.textContent = user.role.toUpperCase().replace('_', ' ');
      });
      if (typeof window.vamsApp.switchRole === 'function') {
        window.vamsApp.switchRole(user.role);
      }
    }
  }

  openAuthPage(mode = 'login') {
    this.mode = mode;
    const landing = document.getElementById('view-landing');
    const dashboard = document.getElementById('view-dashboard');
    const authView = document.getElementById('view-auth');
    if (!authView) return;

    if (landing) landing.style.display = 'none';
    if (dashboard) dashboard.style.display = 'none';
    authView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.render(authView);
  }

  closeAuthPage(goToDashboard = false) {
    const landing = document.getElementById('view-landing');
    const dashboard = document.getElementById('view-dashboard');
    const authView = document.getElementById('view-auth');
    if (authView) authView.style.display = 'none';

    if (goToDashboard && window.vamsApp && typeof window.vamsApp.showDashboard === 'function') {
      window.vamsApp.showDashboard('overview');
    } else if (landing) {
      landing.style.display = 'block';
      if (dashboard) dashboard.style.display = 'none';
    }
  }

  render(container) {
    const currentUser = this.getCurrentUser();
    const isLogin = this.mode === 'login';

    container.innerHTML = `
      <div class="auth-page-wrapper">
        <div class="auth-top-bar">
          <a href="#landing" class="auth-brand-link" id="auth-back-home">
            <img src="./public/vams-logo.png" alt="VAMS Logo" class="auth-logo" />
            <div>
              <strong>VAMS Portal</strong>
              <span>Smart Campus Event Management</span>
            </div>
          </a>
          <div class="auth-top-actions">
            <button type="button" class="btn btn-outline btn-sm" data-toggle-theme title="Toggle Theme">🌓 Theme</button>
            <button type="button" class="btn btn-outline btn-sm" id="auth-return-btn">← Back to Landing</button>
          </div>
        </div>

        <div class="auth-split-grid">
          <!-- Left Visual / Demo Role Panel -->
          <div class="auth-showcase-card">
            <span class="auth-pill-tag">ENTERPRISE CAMPUS SSO & ROLE ACCESS</span>
            <h1>One unified portal for Organizers, Venues & Students.</h1>
            <p>Sign in with your university credentials or use a 1-click Demo Persona below to test role-based dashboards immediately.</p>

            <div class="auth-demo-section">
              <div class="auth-demo-heading">⚡ INSTANT 1-CLICK DEMO LOGIN</div>
              <div class="auth-demo-grid">
                ${DEMO_ACCOUNTS.map(acc => `
                  <button type="button" class="auth-demo-btn" data-demo-role="${acc.role}">
                    <span class="auth-demo-title">${acc.label}</span>
                    <span class="auth-demo-sub">${acc.name} · ${acc.email}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Right Sign In / Register Form Card -->
          <div class="auth-form-card card">
            ${currentUser ? `
              <div class="auth-active-banner">
                <div>
                  <strong>Signed in as ${this.escapeHTML(currentUser.name)}</strong>
                  <div>${this.escapeHTML(currentUser.email)} · <span class="badge badge-purple">${this.escapeHTML(currentUser.role.toUpperCase())}</span></div>
                </div>
                <div style="display:flex; gap:8px;">
                  <button type="button" class="btn btn-primary btn-sm" id="auth-continue-dash">Open Dashboard →</button>
                  <button type="button" class="btn btn-outline btn-sm" id="auth-logout-btn">Logout</button>
                </div>
              </div>
            ` : ''}

            <div class="auth-tabs">
              <button type="button" class="auth-tab ${isLogin ? 'active' : ''}" data-auth-tab="login">Sign In</button>
              <button type="button" class="auth-tab ${!isLogin ? 'active' : ''}" data-auth-tab="register">Create Account</button>
            </div>

            <form id="vams-auth-form" class="auth-form" novalidate>
              ${!isLogin ? `
                <div class="auth-field">
                  <label for="auth-fullname">Full Name</label>
                  <input type="text" id="auth-fullname" class="form-control" placeholder="e.g. Samman Gupta" required />
                </div>
              ` : ''}

              <div class="auth-field">
                <label for="auth-email">University / Institutional Email</label>
                <input type="email" id="auth-email" class="form-control" placeholder="name@college.edu" value="${isLogin ? 'priya.organizer@college.edu' : ''}" required />
              </div>

              <div class="auth-field">
                <label for="auth-password">Password</label>
                <div class="auth-pass-wrap">
                  <input type="password" id="auth-password" class="form-control" placeholder="Enter your password" value="${isLogin ? 'Campus@2026' : ''}" required minlength="6" />
                  <button type="button" class="auth-eye-btn" id="auth-toggle-pass" title="Show/Hide Password">👁️</button>
                </div>
              </div>

              <div class="auth-field">
                <label for="auth-role-select">Portal Access Role</label>
                <select id="auth-role-select" class="form-control">
                  <option value="organizer" ${this.selectedRole === 'organizer' ? 'selected' : ''}>👑 Event Organizer (Clubs & Societies)</option>
                  <option value="attendee" ${this.selectedRole === 'attendee' ? 'selected' : ''}>🎓 Student Attendee (Tickets & Seating)</option>
                  <option value="venue_manager" ${this.selectedRole === 'venue_manager' ? 'selected' : ''}>🏛️ Venue Manager (Auditoriums & Labs)</option>
                  <option value="staff" ${this.selectedRole === 'staff' ? 'selected' : ''}>🎫 Event Staff (QR Check-In Desk)</option>
                  <option value="superadmin" ${this.selectedRole === 'superadmin' ? 'selected' : ''}>⚡ Super Admin (Dean / Faculty Coordinator)</option>
                </select>
              </div>

              ${!isLogin ? `
                <div class="auth-field">
                  <label for="auth-dept">Department / Student Club</label>
                  <input type="text" id="auth-dept" class="form-control" placeholder="e.g. Computer Science & Engineering" />
                </div>
              ` : `
                <div class="auth-remember-row">
                  <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                    <input type="checkbox" id="auth-remember" checked /> Remember session on this device
                  </label>
                  <span class="auth-hint-text">Demo password pre-filled</span>
                </div>
              `}

              <div id="auth-feedback-msg" class="auth-feedback" style="display:none;"></div>

              <button type="submit" class="btn btn-primary auth-submit-btn">
                ${isLogin ? '🔐 Sign In to VAMS Portal →' : '✨ Create Account & Enter Portal →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container);
  }

  bindEvents(container) {
    container.querySelector('#auth-back-home')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.closeAuthPage(false);
    });

    container.querySelector('#auth-return-btn')?.addEventListener('click', () => {
      this.closeAuthPage(false);
    });

    container.querySelector('#auth-continue-dash')?.addEventListener('click', () => {
      this.closeAuthPage(true);
    });

    container.querySelector('#auth-logout-btn')?.addEventListener('click', () => {
      this.logout();
    });

    container.querySelectorAll('[data-auth-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        this.mode = tab.getAttribute('data-auth-tab');
        this.render(container);
      });
    });

    container.querySelector('#auth-toggle-pass')?.addEventListener('click', () => {
      const inp = container.querySelector('#auth-password');
      if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
    });

    container.querySelectorAll('[data-demo-role]').forEach(btn => {
      btn.addEventListener('click', () => {
        const role = btn.getAttribute('data-demo-role');
        const demo = DEMO_ACCOUNTS.find(d => d.role === role);
        if (!demo) return;
        this.saveSession({
          id: 'usr_' + role,
          name: demo.name,
          email: demo.email,
          role: demo.role,
          department: demo.dept,
          loggedInAt: new Date().toISOString()
        });
        this.closeAuthPage(true);
      });
    });

    container.querySelector('#vams-auth-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const feedback = container.querySelector('#auth-feedback-msg');
      const email = (container.querySelector('#auth-email')?.value || '').trim();
      const password = container.querySelector('#auth-password')?.value || '';
      const role = container.querySelector('#auth-role-select')?.value || 'organizer';
      const fullName = (container.querySelector('#auth-fullname')?.value || '').trim();
      const dept = (container.querySelector('#auth-dept')?.value || '').trim();

      if (!email || !email.includes('@')) {
        this.showFeedback(feedback, 'Please enter a valid university email address.', true);
        return;
      }
      if (password.length < 6) {
        this.showFeedback(feedback, 'Password must be at least 6 characters long.', true);
        return;
      }

      if (this.mode === 'register') {
        if (!fullName) {
          this.showFeedback(feedback, 'Please enter your full name to create an account.', true);
          return;
        }
        const users = this.getRegisteredUsers();
        const newUser = {
          id: 'usr_' + Date.now(),
          name: fullName,
          email,
          role,
          department: dept || 'Campus Member',
          loggedInAt: new Date().toISOString()
        };
        users.push({ ...newUser, password });
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
        this.saveSession(newUser);
        this.showFeedback(feedback, 'Account created! Redirecting to VAMS Dashboard...', false);
        setTimeout(() => this.closeAuthPage(true), 450);
        return;
      }

      // Login flow: check demo accounts, registered users, or valid institutional login
      const demoMatch = DEMO_ACCOUNTS.find(d => d.email.toLowerCase() === email.toLowerCase());
      const customMatch = this.getRegisteredUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
      const resolvedName = customMatch?.name || demoMatch?.name || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

      // Optional non-blocking ping to PHP endpoint when running under Apache/PHP
      try {
        fetch('../php-api/auth.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'login', email, role })
        }).catch(() => {});
      } catch {}

      this.saveSession({
        id: customMatch?.id || ('usr_' + Date.now()),
        name: resolvedName,
        email,
        role,
        department: customMatch?.department || demoMatch?.dept || 'University Portal',
        loggedInAt: new Date().toISOString()
      });

      this.showFeedback(feedback, `Welcome back, ${resolvedName}! Opening dashboard...`, false);
      setTimeout(() => this.closeAuthPage(true), 400);
    });
  }

  showFeedback(el, msg, isError) {
    if (!el) return;
    el.style.display = 'block';
    el.textContent = msg;
    el.className = `auth-feedback ${isError ? 'is-error' : 'is-success'}`;
  }

  escapeHTML(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
}

export const authManager = new AuthManager();

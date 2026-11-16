import { authManager } from './auth.js';
/**
 * VAMS Smart Event Management — Master Application Controller
 * Handles Public Website, SaaS Dashboard, Interactive Seating,
 * Agenda Conflict Detection, QR Check-In, Role Switching, and CSV Exports.
 */

import { store } from './store.js';
import { SeatingManager } from './seating.js';
import { detectScheduleConflicts } from './conflictDetector.js';
import { QRTicketService } from './qrTicket.js';
import { renderDashboardCharts } from './charts.js';

class VAMSApp {
  constructor() {
    this.store = store;
    this.qrService = new QRTicketService(this.store);
    this.currentView = 'landing'; // 'landing' | 'dashboard'
    this.currentDashboardTab = 'overview';
    this.selectedEventForBooking = null;
    this.seatingManager = null;
    this.activeCategoryFilter = 'All';
    this.searchQuery = '';

    this.init();
  }

  init() {
    this.applyTheme(localStorage.getItem('vams_active_theme') || 'light');
    this.bindGlobalEvents();
    this.renderPublicLanding();
    this.updateUserRoleBadge();
    this.initSidebarSearch();
    this.initCommandPalette();

    // Check URL hash for routing
    window.addEventListener('hashchange', () => this.handleHashRoute());
    this.handleHashRoute();
  }

  handleHashRoute() {
    const hash = window.location.hash.replace('#', '') || 'landing';
    if (hash.startsWith('dashboard')) {
      const parts = hash.split('/');
      const tab = parts[1] || 'overview';
      this.showDashboard(tab);
    } else {
      this.showLanding();
    }
  }

  showLanding() {
    this.currentView = 'landing';
    document.getElementById('view-landing').style.display = 'block';
    document.getElementById('view-dashboard').style.display = 'none';
    window.location.hash = 'landing';
    this.renderPublicLanding();
  }

  showDashboard(tab = 'overview') {
    this.currentView = 'dashboard';
    this.currentDashboardTab = tab;
    document.getElementById('view-landing').style.display = 'none';
    document.getElementById('view-dashboard').style.display = 'flex';
    window.location.hash = `dashboard/${tab}`;

    this.updateSidebarActiveState(tab);
    this.renderDashboardTab(tab);
  }

  // =========================================================================
  // PUBLIC WEBSITE RENDERING (Section 4.A)
  // =========================================================================
  renderPublicLanding() {
    this.renderPublicEvents();
    this.renderPublicVenues();
    this.renderCategoryPills();
    this.initIcons();
  }

  renderCategoryPills() {
    const pillsContainer = document.getElementById('landing-category-pills');
    if (!pillsContainer) return;

    const categories = ['All', 'Technical', 'Cultural', 'Workshop', 'Sports', 'Gaming'];
    pillsContainer.innerHTML = categories.map(cat => `
      <button 
        type="button" 
        class="filter-pill ${this.activeCategoryFilter === cat ? 'active' : ''}" 
        data-category="${cat}"
      >
        ${cat}
      </button>
    `).join('');

    pillsContainer.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.activeCategoryFilter = e.currentTarget.getAttribute('data-category');
        this.renderCategoryPills();
        this.renderPublicEvents();
      });
    });
  }

  renderPublicEvents() {
    const container = document.getElementById('public-events-grid');
    if (!container) return;

    let events = this.store.getEvents().filter(e => e.status === 'published');

    if (this.activeCategoryFilter && this.activeCategoryFilter !== 'All') {
      const targetCat = this.activeCategoryFilter.trim().toLowerCase();
      events = events.filter(e => (e.category || '').trim().toLowerCase() === targetCat);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      events = events.filter(e => 
        (e.title || '').toLowerCase().includes(q) || 
        (e.category || '').toLowerCase().includes(q) || 
        (e.venue || '').toLowerCase().includes(q) || 
        (e.tags && e.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    if (events.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; background: var(--color-surface); border: 1px dashed var(--color-border); border-radius: 12px;">
          <h4 style="font-size: 1.15rem; margin-bottom: 6px;">No Events Found</h4>
          <p style="font-size: 0.9rem; color: var(--color-text-secondary);">Try adjusting your category filter or search keywords.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = events.map(evt => {
      const seatsLeft = Math.max(0, evt.capacity - evt.registeredCount);
      const capacityPct = Math.min(100, Math.round((evt.registeredCount / evt.capacity) * 100));
      const formattedDate = new Date(evt.date).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      return `
        <div class="event-card">
          <div class="event-card-media">
            <img src="${evt.image}" alt="${evt.title}" class="event-card-img" loading="lazy" />
            <span class="badge badge-purple event-card-category">${evt.category}</span>
            <span class="event-card-price">${evt.isPaid ? `₹${evt.price}` : 'FREE ENTRY'}</span>
          </div>

          <div class="event-card-body">
            <div class="event-card-date">
              📅 ${formattedDate}
            </div>

            <h3 class="event-card-title">${evt.title}</h3>
            <p class="event-card-desc">${evt.description}</p>

            <div class="event-card-meta">
              <div class="event-card-meta-item">
                📍 <span>${evt.venue}</span>
              </div>
              <div class="event-card-meta-item">
                👥 <span>Organized by ${evt.organizerName}</span>
              </div>
            </div>

            <div class="seat-capacity-wrap">
              <div class="seat-capacity-info">
                <span>Seats: ${evt.registeredCount} / ${evt.capacity}</span>
                <span style="color: ${seatsLeft < 20 ? 'var(--color-danger)' : 'var(--color-success)'}">
                  ${seatsLeft > 0 ? `${seatsLeft} left` : 'Housefull'}
                </span>
              </div>
              <div class="seat-capacity-track">
                <div class="seat-capacity-fill" style="width: ${capacityPct}%"></div>
              </div>
            </div>

            <div class="event-card-footer">
              <button type="button" class="btn btn-outline btn-sm btn-details" data-id="${evt.id}">
                Details
              </button>
              <button 
                type="button" 
                class="btn btn-primary btn-sm btn-rsvp" 
                data-id="${evt.id}"
                ${seatsLeft === 0 ? 'disabled' : ''}
              >
                ${seatsLeft === 0 ? 'Housefull' : (evt.isPaid ? 'Select Seats' : 'RSVP Free')}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach card buttons
    container.querySelectorAll('.btn-details').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        this.openEventDetailsModal(id);
      });
    });

    container.querySelectorAll('.btn-rsvp').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        this.openBookingOrSeatingModal(id);
      });
    });
  }

  renderPublicVenues() {
    const container = document.getElementById('public-venues-grid');
    if (!container) return;

    const venues = this.store.getVenues().slice(0, 3);
    container.innerHTML = venues.map(v => `
      <div class="venue-card">
        <img src="${v.image}" alt="${v.name}" class="venue-card-img" />
        <div class="venue-card-body">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
            <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--color-primary-navy);">${v.name}</h4>
            <span class="badge badge-cyan">Max ${v.capacity} Seats</span>
          </div>
          <p style="font-size: 0.825rem; color: var(--color-text-secondary); margin-bottom: 8px;">📍 ${v.location}</p>
          <div class="venue-facility-tags">
            ${(v.facilities || []).slice(0, 4).map(f => `<span class="facility-tag">${f}</span>`).join('')}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-border-subtle); padding-top: 10px;">
            <span style="font-weight: 700; color: var(--color-secondary-purple);">₹${v.hourlyRate}/hour</span>
            <button type="button" class="btn btn-outline btn-sm btn-venue-calendar" data-id="${v.id}">
              View Availability
            </button>
          </div>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-venue-calendar').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        this.showDashboard('venues');
      });
    });
  }

  // =========================================================================
  // DASHBOARD RENDERING & TABS (Section 4.C - 4.O)
  // =========================================================================
  updateSidebarActiveState(tab) {
    document.querySelectorAll('.sidebar-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-tab') === tab);
    });

    const titleEl = document.getElementById('dashboard-view-title');
    const subtitleEl = document.getElementById('dashboard-view-subtitle');
    const titles = {
      'overview': ['Executive Overview', 'Real-time performance metrics and campus engagement summary.'],
      'events': ['Event Catalog & Management', 'Create, publish, edit, duplicate, and monitor campus events.'],
      'venues': ['Venue Allocations & Availability Matrix', 'Campus auditoriums, labs, and interactive availability schedule.'],
      'seating': ['Interactive Seating Layout Editor', 'Visual seat mapping, VIP tiers, and real-time seat reservation.'],
      'attendees': ['Attendee Management & Verification', 'Registration lists, ticket status, and export to CSV.'],
      'agenda': ['Agenda & Schedule Engine', 'Multi-session timeline with intelligent conflict detection.'],
      'qr-checkin': ['QR Ticket Scanner & Pass Generator', 'Live turnstile check-in simulator and badge printouts.'],
      'speakers': ['Distinguished Keynote Speakers', 'Speaker profiles, bios, and assigned breakout sessions.'],
      'sponsors': ['Sponsorship Management', 'Platinum, Gold, Silver partner tiers, booths, and contributions.'],
      'volunteers': ['Student Volunteer Force', 'Duty scheduling, check-in status, and logistics allocation.'],
      'budget': ['Event Financials & Budget Tracker', 'Revenue, estimated vs actual expenses, and profit/loss calculation.'],
      'analytics': ['Reports & Predictive Analytics', 'Data visualizations, trends, and exportable CSV reports.'],
      'notifications': ['Notification Center', 'Real-time alerts, milestones, and system warnings.'],
      'settings': ['System Settings & Demo Data', 'Dark/light mode switcher, role switcher, and factory data reset.']
    };

    if (titles[tab]) {
      if (titleEl) titleEl.innerText = titles[tab][0];
      if (subtitleEl) subtitleEl.innerText = titles[tab][1];
    }
  }

  renderDashboardTab(tab) {
    const contentArea = document.getElementById('dashboard-tab-content');
    if (!contentArea) return;

    switch (tab) {
      case 'overview':
        this.renderDashboardOverview(contentArea);
        break;
      case 'events':
        this.renderDashboardEvents(contentArea);
        break;
      case 'venues':
        this.renderDashboardVenues(contentArea);
        break;
      case 'seating':
        this.renderDashboardSeating(contentArea);
        break;
      case 'attendees':
        this.renderDashboardAttendees(contentArea);
        break;
      case 'agenda':
        this.renderDashboardAgenda(contentArea);
        break;
      case 'qr-checkin':
        this.renderDashboardQRCheckIn(contentArea);
        break;
      case 'speakers':
        this.renderDashboardSpeakers(contentArea);
        break;
      case 'sponsors':
        this.renderDashboardSponsors(contentArea);
        break;
      case 'volunteers':
        this.renderDashboardVolunteers(contentArea);
        break;
      case 'budget':
        this.renderDashboardBudget(contentArea);
        break;
      case 'analytics':
        this.renderDashboardAnalytics(contentArea);
        break;
      case 'notifications':
        this.renderDashboardNotifications(contentArea);
        break;
      case 'settings':
        this.renderDashboardSettings(contentArea);
        break;
      default:
        this.renderDashboardOverview(contentArea);
    }

    this.initIcons();
  }

  // TAB: Overview
  renderDashboardOverview(container) {
    const events = this.store.getEvents();
    const attendees = this.store.getAttendees();
    const budget = this.store.getBudget();
    const venues = this.store.getVenues();

    const totalEvents = events.length;
    const upcomingEvents = events.filter(e => e.status === 'published').length;
    const totalRSVPs = events.reduce((sum, e) => sum + (e.registeredCount || 0), 0);
    const totalRevenue = (budget.ticketRevenue || 0) + (budget.sponsorshipRevenue || 0);

    container.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-card-title">Total Events</span>
            <div class="kpi-card-icon" style="background: #eef2ff; color: #4f46e5;">🎪</div>
          </div>
          <div class="kpi-card-value">${totalEvents}</div>
          <div class="kpi-card-trend trend-up">↑ 4 New this month</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-card-title">Total Registrations</span>
            <div class="kpi-card-icon" style="background: #dcfce7; color: #16a34a;">🎟️</div>
          </div>
          <div class="kpi-card-value">${totalRSVPs}</div>
          <div class="kpi-card-trend trend-up">↑ 88% overall capacity</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-card-title">Gross Revenue</span>
            <div class="kpi-card-icon" style="background: #fef3c7; color: #b45309;">💰</div>
          </div>
          <div class="kpi-card-value">₹${(totalRevenue).toLocaleString('en-IN')}</div>
          <div class="kpi-card-trend trend-up">↑ Sponsorships + Tickets</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-card-title">Venues Active</span>
            <div class="kpi-card-icon" style="background: #e0f2fe; color: #0284c7;">🏛️</div>
          </div>
          <div class="kpi-card-value">${venues.length}</div>
          <div class="kpi-card-trend trend-up">94% Weekend utilization</div>
        </div>
      </div>

      <div class="charts-grid-2col">
        <div class="chart-container-card">
          <div class="chart-header">
            <h4 style="font-size: 1.1rem; font-weight: 700;">Registration & Revenue Trends</h4>
            <span class="badge badge-purple">Live Feed</span>
          </div>
          <div class="chart-canvas-wrap">
            <canvas id="chart-revenue-trends"></canvas>
          </div>
        </div>

        <div class="chart-container-card">
          <div class="chart-header">
            <h4 style="font-size: 1.1rem; font-weight: 700;">Category Distribution</h4>
            <span class="badge badge-cyan">Events</span>
          </div>
          <div class="chart-canvas-wrap">
            <canvas id="chart-category-dist"></canvas>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h4 class="card-title">Recent Registrations & Ticket Passes</h4>
          <button type="button" class="btn btn-outline btn-sm" id="btn-export-attendees-quick">
            📥 Export CSV
          </button>
        </div>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Attendee</th>
                <th>Ticket ID</th>
                <th>Event</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${attendees.slice(0, 6).map(a => {
                const evt = events.find(e => e.id === a.eventId);
                return `
                  <tr>
                    <td>
                      <strong>${a.name}</strong><br/>
                      <span style="font-size: 0.75rem; color: var(--color-text-muted);">${a.email}</span>
                    </td>
                    <td style="font-family: var(--font-family-mono); font-weight: 600;">${a.ticketId}</td>
                    <td>${evt ? evt.title.slice(0, 32) + '...' : 'Campus Event'}</td>
                    <td><span class="badge badge-navy">${a.role}</span></td>
                    <td>
                      <span class="badge ${a.status === 'checked-in' ? 'badge-success' : 'badge-warning'}">
                        ${a.status}
                      </span>
                    </td>
                    <td>
                      <button type="button" class="btn btn-ghost btn-sm btn-view-pass" data-ticket="${a.ticketId}">
                        View Pass
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    renderDashboardCharts(this.store);

    const exportBtn = container.querySelector('#btn-export-attendees-quick');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportAttendeesToCSV());
    }

    container.querySelectorAll('.btn-view-pass').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ticketId = e.currentTarget.getAttribute('data-ticket');
        this.openTicketPassModal(ticketId);
      });
    });
  }

  // TAB: Events
  renderDashboardEvents(container) {
    const events = this.store.getEvents();

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6); flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; gap: 10px;">
          <input type="text" id="dashboard-event-search" class="form-control" placeholder="Search events..." style="width: 280px;" />
          <select id="dashboard-event-status-filter" class="form-select" style="width: 160px;">
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
        <button type="button" class="btn btn-primary" id="btn-create-event-open">
          + Create Event
        </button>
      </div>

      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Event Title</th>
              <th>Category</th>
              <th>Venue</th>
              <th>Date & Time</th>
              <th>Capacity</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="dashboard-events-table-body">
            ${this.renderEventTableRows(events)}
          </tbody>
        </table>
      </div>
    `;

    container.querySelector('#btn-create-event-open').addEventListener('click', () => {
      this.openCreateEditEventModal();
    });

    const searchInput = container.querySelector('#dashboard-event-search');
    const statusFilter = container.querySelector('#dashboard-event-status-filter');

    const handleFilter = () => {
      const q = searchInput.value.toLowerCase();
      const st = statusFilter.value;
      const filtered = events.filter(e => {
        const matchesQ = e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q);
        const matchesSt = st === 'all' || e.status === st;
        return matchesQ && matchesSt;
      });
      container.querySelector('#dashboard-events-table-body').innerHTML = this.renderEventTableRows(filtered);
      this.attachEventRowActions();
    };

    searchInput.addEventListener('input', handleFilter);
    statusFilter.addEventListener('change', handleFilter);
    this.attachEventRowActions();
  }

  renderEventTableRows(events) {
    if (events.length === 0) {
      return `<tr><td colspan="8" style="text-align: center; padding: 2rem;">No events found.</td></tr>`;
    }

    return events.map(e => `
      <tr>
        <td>
          <strong>${e.title}</strong><br/>
          <span style="font-size: 0.75rem; color: var(--color-text-muted);">Organized by ${e.organizerName}</span>
        </td>
        <td><span class="badge badge-purple">${e.category}</span></td>
        <td>${e.venue}</td>
        <td>${new Date(e.date).toLocaleDateString()}</td>
        <td>${e.registeredCount || 0} / ${e.capacity}</td>
        <td>${e.isPaid ? `₹${e.price}` : 'Free'}</td>
        <td>
          <span class="badge ${e.status === 'published' ? 'badge-success' : 'badge-warning'}">
            ${e.status}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button type="button" class="btn btn-outline btn-sm btn-edit-event" data-id="${e.id}" title="Edit">✏️</button>
            <button type="button" class="btn btn-outline btn-sm btn-duplicate-event" data-id="${e.id}" title="Duplicate">📋</button>
            <button type="button" class="btn btn-danger btn-sm btn-delete-event" data-id="${e.id}" title="Delete">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  attachEventRowActions() {
    document.querySelectorAll('.btn-edit-event').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        this.openCreateEditEventModal(id);
      });
    });

    document.querySelectorAll('.btn-duplicate-event').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        this.store.duplicateEvent(id);
        this.showToast('Event duplicated as draft!', 'success');
        this.renderDashboardTab('events');
      });
    });

    document.querySelectorAll('.btn-delete-event').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
          this.store.deleteEvent(id);
          this.showToast('Event deleted successfully.', 'success');
          this.renderDashboardTab('events');
        }
      });
    });
  }

  // TAB: Interactive Seating (Standout Feature)
  renderDashboardSeating(container) {
    const events = this.store.getEvents();

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6); flex-wrap: wrap; gap: 12px;">
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 800;">Visual Seating Matrix & Reservation</h3>
          <p style="font-size: 0.85rem; color: var(--color-text-secondary);">
            View live seat occupancy, VIP/Premium tiering, and book tickets per event.
          </p>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <label style="font-size: 0.825rem; font-weight: 700;">Select Event:</label>
          <select id="seating-event-select" class="form-select" style="width: 320px;">
            ${events.map(e => `
              <option value="${e.id}">${e.title} (${e.venue})</option>
            `).join('')}
          </select>
        </div>
      </div>

      <div class="seating-editor-container" id="seating-canvas-target"></div>
    `;

    const eventSelect = container.querySelector('#seating-event-select');
    const target = container.querySelector('#seating-canvas-target');

    const loadSeatingForEvent = (evtId) => {
      const evt = this.store.getEventById(evtId) || events[0];
      const booked = this.store.getBookedSeatsForEvent(evt.id);

      this.seatingManager = new SeatingManager(target, {
        eventId: evt.id,
        isFree: !evt.isPaid,
        basePrice: evt.price || 0,
        bookedSeats: booked,
        initialSeats: [],
        onSelectionChange: (selectedSeats, total, section) => {
          console.log(`Event ${evt.id} selected seats:`, selectedSeats, total, section);
        }
      });
      this.seatingManager.render();
    };

    if (events.length > 0) {
      loadSeatingForEvent(events[0].id);
      eventSelect.addEventListener('change', (e) => {
        loadSeatingForEvent(e.target.value);
      });
    }
  }

  // Venue Short Name Helper for compact calendar chips
  getVenueShortName(venueIdOrName) {
    const map = {
      'ven_1': 'Main Audi',
      'ven_2': 'Ramanujan Lab',
      'ven_3': 'Tagore OAT',
      'ven_4': 'Seminar Hall',
      'ven_5': 'Sports Arena',
      'ven_6': 'Innovation Hub'
    };
    if (map[venueIdOrName]) return map[venueIdOrName];
    if (!venueIdOrName) return 'Venue';
    const s = venueIdOrName.toLowerCase();
    if (s.includes('audi')) return 'Main Audi';
    if (s.includes('ramanujan')) return 'Ramanujan Lab';
    if (s.includes('tagore') || s.includes('oat')) return 'Tagore OAT';
    if (s.includes('seminar') || s.includes('sarabhai')) return 'Seminar Hall';
    if (s.includes('sport')) return 'Sports Arena';
    if (s.includes('gaming') || s.includes('innovat')) return 'Innovation Hub';
    return venueIdOrName.slice(0, 12);
  }

  // Calculate day-wise venue occupancy breakdown
  getVenueDayBreakdown(dateStr) {
    const venues = this.store.getVenues();
    const events = this.store.getEvents();

    return venues.map(v => {
      // Find matching scheduled event
      const matchingEvent = events.find(e => {
        const start = (e.date || '').slice(0, 10);
        const end = (e.endDate || e.date || '').slice(0, 10);
        return e.venueId === v.id && dateStr >= start && dateStr <= end;
      });

      if (matchingEvent) {
        return {
          venue: v,
          status: 'booked',
          event: matchingEvent,
          details: `${matchingEvent.title} (${matchingEvent.organizerName || 'Organized'})`
        };
      }

      if (v.availability && v.availability[dateStr] === 'blocked') {
        return {
          venue: v,
          status: 'blocked',
          details: 'AV, Acoustics & Facility Maintenance'
        };
      }

      if (v.availability && v.availability[dateStr] === 'booked') {
        return {
          venue: v,
          status: 'booked',
          event: {
            title: 'University Academic Assembly',
            organizerName: 'Campus Administration',
            date: `${dateStr}T10:00`,
            registeredCount: v.capacity
          },
          details: 'Institutional Reserved Session'
        };
      }

      return {
        venue: v,
        status: 'free',
        details: 'Empty & Available All Day'
      };
    });
  }

  // TAB: Venues & Availability Matrix
  renderDashboardVenues(container) {
    const venues = this.store.getVenues();
    const selectedFilter = this.venueCalendarFilter || 'all';

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--space-5); flex-wrap: wrap; gap: var(--space-3);">
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--color-primary-navy);">Campus Halls & Infrastructure</h3>
          <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin: 0;">
            Real-time capacity, tech specifications, and day-wise booking availability for all 6 campus venues.
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-sm btn-outline-purple" id="btn-scroll-to-cal">
            📅 Jump to Availability Calendar Matrix
          </button>
        </div>
      </div>

      <!-- Venue Showcase Grid -->
      <div class="venue-showcase-grid" style="margin-bottom: var(--space-8);">
        ${venues.map(v => `
          <div class="venue-card" id="venue-card-${v.id}">
            <img src="${v.image}" alt="${v.name}" class="venue-card-img" />
            <div class="venue-card-body">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--color-primary-navy); line-height: 1.3;">${v.name}</h4>
                <span class="badge badge-cyan" style="white-space: nowrap;">Max ${v.capacity} Seats</span>
              </div>
              <p style="font-size: 0.825rem; color: var(--color-text-secondary); margin-bottom: 8px;">📍 ${v.location}</p>
              <div class="venue-facility-tags">
                ${(v.facilities || []).map(f => `<span class="facility-tag">${f}</span>`).join('')}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-border-subtle); padding-top: 10px; margin-bottom: 12px;">
                <span style="font-weight: 700; color: var(--color-secondary-purple);">₹${v.hourlyRate}/hour</span>
                <span class="badge badge-success">Approved</span>
              </div>
              <button class="btn btn-sm btn-outline btn-filter-to-this-venue" data-venue-id="${v.id}" style="width: 100%; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px;">
                <span>📅 Check Day-Wise Availability Matrix</span>
              </button>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Calendar-Based Venue Availability Matrix Card -->
      <div class="card" id="venue-availability-calendar-card">
        <div class="card-header" style="flex-direction: column; align-items: stretch; gap: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div>
              <h4 class="card-title" style="font-size: 1.15rem; margin-bottom: 2px;">
                Calendar-Based Venue Availability Matrix (November 2026)
              </h4>
              <p style="font-size: 0.8rem; color: var(--color-text-secondary); margin: 0;">
                Har din ka clear status: kon sa venue booked hai, kon sa empty hai, aur kon sa maintenance me hai.
              </p>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <div class="calendar-legend-group">
                <span style="display: flex; align-items: center; gap: 4px; font-size: 0.75rem;"><span class="cal-legend-dot dot-free"></span> <b>Empty / Available</b></span>
                <span style="display: flex; align-items: center; gap: 4px; font-size: 0.75rem;"><span class="cal-legend-dot dot-booked"></span> <b>Booked Event</b></span>
                <span style="display: flex; align-items: center; gap: 4px; font-size: 0.75rem;"><span class="cal-legend-dot dot-blocked"></span> <b>Maintenance</b></span>
              </div>
            </div>
          </div>

          <!-- Filter Bar -->
          <div class="calendar-toolbar" style="margin-bottom: 0;">
            <div class="calendar-toolbar-left">
              <label for="venue-cal-select" style="font-size: 0.825rem; font-weight: 700; color: var(--color-primary-navy);">
                Filter Calendar View:
              </label>
              <select id="venue-cal-select" class="form-select" style="min-width: 280px; font-size: 0.825rem; font-weight: 600; padding: 6px 12px;">
                <option value="all" ${selectedFilter === 'all' ? 'selected' : ''}>🏢 All 6 Campus Venues Overview</option>
                ${venues.map(v => `
                  <option value="${v.id}" ${selectedFilter === v.id ? 'selected' : ''}>
                    🏛️ ${v.name} (${v.capacity} seats)
                  </option>
                `).join('')}
              </select>
            </div>
            <div class="calendar-toolbar-right">
              <div class="calendar-month-badge">
                <span>🗓️ November 2026</span>
                <span class="badge badge-purple" style="font-size: 0.7rem;">30 Days Scheduled</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card-body">
          <div class="calendar-matrix">
            <div class="calendar-day-header">SUN</div>
            <div class="calendar-day-header">MON</div>
            <div class="calendar-day-header">TUE</div>
            <div class="calendar-day-header">WED</div>
            <div class="calendar-day-header">THU</div>
            <div class="calendar-day-header">FRI</div>
            <div class="calendar-day-header">SAT</div>

            ${[...Array(30).keys()].map(i => {
              const day = i + 1;
              const dateKey = `2026-11-${day < 10 ? '0' + day : day}`;
              const breakdown = this.getVenueDayBreakdown(dateKey);

              if (selectedFilter === 'all') {
                const booked = breakdown.filter(b => b.status === 'booked');
                const blocked = breakdown.filter(b => b.status === 'blocked');
                const free = breakdown.filter(b => b.status === 'free');

                const cellClass = booked.length > 0 ? 'day-has-booked' : (blocked.length > 0 ? 'day-has-blocked' : 'day-all-free');

                return `
                  <div class="calendar-day-cell ${cellClass}" data-date="${dateKey}" title="Click to inspect all venue schedules for Nov ${day}">
                    <div class="calendar-day-top">
                      <span class="calendar-day-num">${day}</span>
                      <span class="calendar-day-status-pill badge-${booked.length > 0 ? 'danger' : 'success'}">
                        ${booked.length > 0 ? `${booked.length} BOOKED` : 'ALL FREE'}
                      </span>
                    </div>

                    <div class="calendar-chips-list">
                      ${booked.map(b => `
                        <div class="cal-chip booked" title="${b.venue.name}: ${b.event.title}">
                          🔴 <b>${this.getVenueShortName(b.venue.id)}</b>: ${(b.event.title || '').slice(0, 11)}..
                        </div>
                      `).join('')}

                      ${blocked.map(b => `
                        <div class="cal-chip blocked" title="${b.venue.name}: ${b.details}">
                          🟡 <b>${this.getVenueShortName(b.venue.id)}</b>: Maint.
                        </div>
                      `).join('')}

                      ${booked.length === 0 && blocked.length === 0 ? `
                        <div class="cal-chip all-free">
                          🟢 All 6 Halls Free
                        </div>
                      ` : `
                        <div class="cal-chip free">
                          🟢 ${free.length} Halls Free
                        </div>
                      `}
                    </div>

                    <div style="font-size: 0.6rem; color: var(--color-text-secondary); text-align: right; margin-top: auto; padding-top: 3px;">
                      Inspect Day ↗
                    </div>
                  </div>
                `;
              } else {
                const targetVenue = venues.find(v => v.id === selectedFilter) || venues[0];
                const venueStatus = breakdown.find(b => b.venue.id === selectedFilter) || { status: 'free', venue: targetVenue };

                let cellClass = 'day-all-free';
                let pillBadge = '<span class="calendar-day-status-pill badge-success">EMPTY / FREE</span>';
                let contentHtml = '';

                if (venueStatus.status === 'booked') {
                  cellClass = 'day-has-booked';
                  pillBadge = '<span class="calendar-day-status-pill badge-danger">BOOKED</span>';
                  contentHtml = `
                    <div class="cal-chip booked" style="padding: 4px 6px; font-size: 0.7rem; font-weight: 700;">
                      🔴 ${venueStatus.event ? (venueStatus.event.title || 'Reserved Event').slice(0, 18) : 'Booked Event'}
                    </div>
                    <div style="font-size: 0.65rem; color: var(--color-danger); font-weight: 600; margin-top: 3px;">
                      ⏰ ${venueStatus.event && venueStatus.event.date ? venueStatus.event.date.slice(11, 16) || 'All Day' : 'Occupied'}
                    </div>
                    <div style="font-size: 0.6rem; color: var(--color-text-secondary); margin-top: 2px;">
                      👤 ${venueStatus.event ? (venueStatus.event.organizerName || 'College Club') : 'Campus'}
                    </div>
                  `;
                } else if (venueStatus.status === 'blocked') {
                  cellClass = 'day-has-blocked';
                  pillBadge = '<span class="calendar-day-status-pill badge-warning">BLOCKED</span>';
                  contentHtml = `
                    <div class="cal-chip blocked" style="padding: 4px 6px; font-size: 0.7rem; font-weight: 700;">
                      🟡 Stage & AV Maintenance
                    </div>
                    <div style="font-size: 0.65rem; color: var(--color-warning); margin-top: 2px;">Facility Closed</div>
                  `;
                } else {
                  contentHtml = `
                    <div class="cal-chip free" style="padding: 4px 6px; font-size: 0.7rem; font-weight: 700;">
                      🟢 Free All Day
                    </div>
                    <div style="font-size: 0.65rem; color: var(--color-success); font-weight: 600; margin-top: 3px;">
                      ✓ ${targetVenue.capacity} Seats Empty
                    </div>
                    <div style="font-size: 0.65rem; color: var(--color-secondary-purple); font-weight: 700; margin-top: auto; display: flex; align-items: center; gap: 2px;">
                      ➕ Click to Book →
                    </div>
                  `;
                }

                return `
                  <div class="calendar-day-cell ${cellClass}" data-date="${dateKey}" title="Click to view details or book ${targetVenue.name}">
                    <div class="calendar-day-top">
                      <span class="calendar-day-num">${day}</span>
                      ${pillBadge}
                    </div>
                    <div class="calendar-chips-list">
                      ${contentHtml}
                    </div>
                  </div>
                `;
              }
            }).join('')}
          </div>
        </div>
      </div>
    `;

    // Event Listeners:
    // 1. Filter dropdown change
    const filterSelect = container.querySelector('#venue-cal-select');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        this.venueCalendarFilter = e.target.value;
        this.renderDashboardVenues(container);
      });
    }

    // 2. Button on each venue card: "Check Day-Wise Availability Matrix"
    container.querySelectorAll('.btn-filter-to-this-venue').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const vId = e.currentTarget.getAttribute('data-venue-id');
        this.venueCalendarFilter = vId;
        this.renderDashboardVenues(container);
        const calEl = document.getElementById('venue-availability-calendar-card');
        if (calEl) calEl.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // 3. Jump to cal button
    const jumpBtn = container.querySelector('#btn-scroll-to-cal');
    if (jumpBtn) {
      jumpBtn.addEventListener('click', () => {
        const calEl = document.getElementById('venue-availability-calendar-card');
        if (calEl) calEl.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // 4. Click on any day cell in calendar
    container.querySelectorAll('.calendar-day-cell').forEach(cell => {
      cell.addEventListener('click', (e) => {
        const dateKey = e.currentTarget.getAttribute('data-date');
        this.openVenueDayInspectorModal(dateKey, this.venueCalendarFilter || 'all');
      });
    });
  }

  // Day Inspector Modal: Shows all 6 venues' exact occupancy for the selected date
  openVenueDayInspectorModal(dateStr, filterVenueId = 'all') {
    const venues = this.store.getVenues();
    const breakdown = this.getVenueDayBreakdown(dateStr);
    const dateObj = new Date(dateStr + 'T00:00:00');
    const dateFormatted = dateObj.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const bookedList = breakdown.filter(b => b.status === 'booked');
    const blockedList = breakdown.filter(b => b.status === 'blocked');
    const freeList = breakdown.filter(b => b.status === 'free');

    const modalHtml = `
      <div class="modal-overlay active" id="modal-venue-day-inspector">
        <div class="modal-dialog modal-xl">
          <div class="modal-header">
            <div>
              <span class="badge badge-purple" style="margin-bottom: 4px;">📅 Campus Venue Schedule Inspector</span>
              <h3 class="modal-title" style="margin: 0;">${dateFormatted}</h3>
            </div>
            <button type="button" class="modal-close" id="btn-close-venue-inspector">✕</button>
          </div>

          <div class="modal-body" style="padding-top: var(--space-4);">
            <!-- Status Stats Bar -->
            <div style="display: flex; gap: var(--space-3); flex-wrap: wrap; margin-bottom: var(--space-5);">
              <div style="flex: 1; min-width: 160px; padding: var(--space-3) var(--space-4); background: #FEF2F2; border: 1px solid #FECACA; border-radius: var(--radius-sm);">
                <div style="font-size: 0.75rem; font-weight: 700; color: #DC2626; text-transform: uppercase;">Occupied / Booked</div>
                <div style="font-size: 1.35rem; font-weight: 800; color: #991B1B;">${bookedList.length} Venue${bookedList.length === 1 ? '' : 's'}</div>
              </div>

              <div style="flex: 1; min-width: 160px; padding: var(--space-3) var(--space-4); background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: var(--radius-sm);">
                <div style="font-size: 0.75rem; font-weight: 700; color: #059669; text-transform: uppercase;">Empty & Available</div>
                <div style="font-size: 1.35rem; font-weight: 800; color: #065F46;">${freeList.length} Venue${freeList.length === 1 ? '' : 's'}</div>
              </div>

              <div style="flex: 1; min-width: 160px; padding: var(--space-3) var(--space-4); background: #FFFBEB; border: 1px solid #FDE68A; border-radius: var(--radius-sm);">
                <div style="font-size: 0.75rem; font-weight: 700; color: #D97706; text-transform: uppercase;">Maintenance</div>
                <div style="font-size: 1.35rem; font-weight: 800; color: #92400E;">${blockedList.length} Venue${blockedList.length === 1 ? '' : 's'}</div>
              </div>
            </div>

            <div style="margin-bottom: var(--space-4);">
              <h4 style="font-size: 1rem; font-weight: 700; color: var(--color-primary-navy); margin-bottom: 4px;">
                Detailed Status of All 6 Campus Venues on this Date:
              </h4>
              <p style="font-size: 0.8rem; color: var(--color-text-secondary); margin: 0;">
                Green venues are completely empty and ready to be booked. Red venues already have scheduled campus events.
              </p>
            </div>

            <!-- List of All 6 Venues -->
            <div style="display: flex; flex-direction: column; gap: var(--space-3);">
              ${breakdown.map(b => {
                const v = b.venue;
                const isBooked = b.status === 'booked';
                const isBlocked = b.status === 'blocked';
                const isFree = b.status === 'free';

                return `
                  <div class="venue-inspector-card ${isBooked ? 'is-booked' : (isBlocked ? 'is-blocked' : 'is-free')}">
                    <div style="display: flex; align-items: center; gap: 16px; flex: 1;">
                      <img src="${v.image}" alt="${v.name}" style="width: 90px; height: 75px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--color-border);" />
                      <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                          <h4 style="font-size: 1rem; font-weight: 700; color: var(--color-primary-navy); margin: 0;">
                            ${v.name}
                          </h4>
                          <span class="badge badge-cyan" style="font-size: 0.7rem;">Max ${v.capacity} Seats</span>
                          <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-secondary-purple);">₹${v.hourlyRate}/hour</span>
                        </div>
                        <p style="font-size: 0.775rem; color: var(--color-text-secondary); margin: 2px 0 6px;">📍 ${v.location}</p>

                        ${isBooked ? `
                          <div style="background: rgba(220, 38, 38, 0.08); border-left: 3px solid var(--color-danger); padding: 6px 10px; border-radius: 4px;">
                            <div style="display: flex; align-items: center; gap: 6px;">
                              <span class="badge badge-danger">🔴 BOOKED / OCCUPIED</span>
                              <strong style="color: var(--color-primary-navy); font-size: 0.875rem;">${b.event.title}</strong>
                            </div>
                            <div style="font-size: 0.775rem; color: var(--color-text-secondary); margin-top: 3px;">
                              ⏰ <b>Timing:</b> ${b.event.date ? b.event.date.slice(11, 16) || 'Full Day' : 'Full Day'} &bull;
                              👤 <b>Organizer:</b> ${b.event.organizerName || 'University Council'} &bull;
                              👥 <b>Registrations:</b> ${b.event.registeredCount || 0}/${v.capacity}
                            </div>
                          </div>
                        ` : ''}

                        ${isBlocked ? `
                          <div style="background: rgba(217, 119, 6, 0.08); border-left: 3px solid var(--color-warning); padding: 6px 10px; border-radius: 4px;">
                            <div style="display: flex; align-items: center; gap: 6px;">
                              <span class="badge badge-warning">🟡 MAINTENANCE / BLOCKED</span>
                              <strong style="color: #92400e; font-size: 0.875rem;">Stage, AV & Acoustic Calibration</strong>
                            </div>
                            <div style="font-size: 0.775rem; color: var(--color-text-secondary); margin-top: 2px;">
                              Campus estates and electrical division maintenance window. Unavailable for booking.
                            </div>
                          </div>
                        ` : ''}

                        ${isFree ? `
                          <div style="background: rgba(16, 185, 129, 0.08); border-left: 3px solid var(--color-success); padding: 6px 10px; border-radius: 4px;">
                            <div style="display: flex; align-items: center; gap: 6px;">
                              <span class="badge badge-success">🟢 EMPTY / AVAILABLE ALL DAY</span>
                              <span style="font-size: 0.825rem; font-weight: 600; color: var(--color-success);">Completely vacant and ready for booking</span>
                            </div>
                            <div style="font-size: 0.775rem; color: var(--color-text-secondary); margin-top: 2px;">
                              Tech Amenities: ${(v.facilities || []).slice(0, 4).join(', ')}
                            </div>
                          </div>
                        ` : ''}
                      </div>
                    </div>

                    <div style="margin-left: 16px; display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                      ${isFree ? `
                        <button class="btn btn-sm btn-primary btn-book-from-inspector" data-venue-id="${v.id}" data-date="${dateStr}" style="white-space: nowrap; font-weight: 700;">
                          ➕ Book This Hall
                        </button>
                      ` : isBooked ? `
                        <button class="btn btn-sm btn-outline btn-view-event-from-inspector" data-event-id="${b.event.id || ''}" style="white-space: nowrap;">
                          🎪 View Event
                        </button>
                      ` : `
                        <span class="badge badge-subtle">Blocked</span>
                      `}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="modal-footer" style="justify-content: space-between;">
            <div style="font-size: 0.8rem; color: var(--color-text-secondary);">
              Showing live occupancy data for <b>${dateStr}</b>
            </div>
            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn btn-secondary" id="btn-close-venue-inspector-2">Close</button>
              <button type="button" class="btn btn-primary" id="btn-inspector-schedule-new" data-date="${dateStr}">
                ➕ Create Event for ${dateStr}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.mountModal(modalHtml, 'modal-venue-day-inspector', () => {
      document.getElementById('btn-close-venue-inspector').onclick = () => this.unmountModal('modal-venue-day-inspector');
      document.getElementById('btn-close-venue-inspector-2').onclick = () => this.unmountModal('modal-venue-day-inspector');

      // Book This Hall button
      document.querySelectorAll('.btn-book-from-inspector').forEach(btn => {
        btn.onclick = (e) => {
          const vId = e.currentTarget.getAttribute('data-venue-id');
          const dStr = e.currentTarget.getAttribute('data-date');
          this.unmountModal('modal-venue-day-inspector');
          this.openCreateEditEventModal(null, { venueId: vId, date: dStr });
        };
      });

      // View Event button
      document.querySelectorAll('.btn-view-event-from-inspector').forEach(btn => {
        btn.onclick = (e) => {
          this.unmountModal('modal-venue-day-inspector');
          this.renderDashboardTab('events');
        };
      });

      // Create Event for this date button
      const schedBtn = document.getElementById('btn-inspector-schedule-new');
      if (schedBtn) {
        schedBtn.onclick = (e) => {
          const dStr = e.currentTarget.getAttribute('data-date');
          this.unmountModal('modal-venue-day-inspector');
          this.openCreateEditEventModal(null, { date: dStr });
        };
      }
    });
  }

  // TAB: Agenda & Conflict Detection (Section 4.H)
  renderDashboardAgenda(container) {
    const sessions = this.store.getSessions();
    const venues = this.store.getVenues();
    const conflicts = detectScheduleConflicts(sessions, venues);

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6);">
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 800;">Multi-Session Timetable & Conflict Engine</h3>
          <p style="font-size: 0.85rem; color: var(--color-text-secondary);">
            Automated conflict detection prevents overlapping speaker assignments and room collisions.
          </p>
        </div>
        <button type="button" class="btn btn-primary btn-sm" id="btn-add-session-open">
          + Add Session
        </button>
      </div>

      ${conflicts.length > 0 ? `
        <div class="conflict-alert-banner">
          <div style="font-size: 1.5rem;">⚠️</div>
          <div class="conflict-alert-content">
            <h5>${conflicts.length} Schedule Conflict${conflicts.length === 1 ? '' : 's'} Detected!</h5>
            ${conflicts.map(c => `
              <p>• <strong>${c.message}</strong> <em>(Suggested Fix: ${c.suggestion})</em></p>
            `).join('')}
          </div>
        </div>
      ` : `
        <div style="background: var(--color-success-light); border-left: 4px solid var(--color-success); padding: 12px 18px; border-radius: 8px; margin-bottom: 24px; font-size: 0.85rem; color: #166534; font-weight: 600;">
          ✓ All sessions verified. No speaker or venue overlaps detected!
        </div>
      `}

      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Session Title</th>
              <th>Speaker</th>
              <th>Venue / Room</th>
              <th>Day</th>
              <th>Timings</th>
              <th>Capacity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${sessions.map(s => `
              <tr>
                <td><strong>${s.title}</strong></td>
                <td><span class="badge badge-purple">${s.speaker}</span></td>
                <td>${s.room}</td>
                <td>${s.day}</td>
                <td style="font-family: var(--font-family-mono); font-weight: 600;">${s.startTime} - ${s.endTime}</td>
                <td>${s.capacity} seats</td>
                <td>
                  <button type="button" class="btn btn-danger btn-sm btn-delete-session" data-id="${s.id}">
                    Delete
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.querySelector('#btn-add-session-open').addEventListener('click', () => {
      this.openAddSessionModal();
    });

    container.querySelectorAll('.btn-delete-session').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        this.store.deleteSession(id);
        this.showToast('Session removed from timetable.', 'info');
        this.renderDashboardTab('agenda');
      });
    });
  }

  // TAB: QR Check-In & Scanner (Section 4.I)
  renderDashboardQRCheckIn(container) {
    const attendees = this.store.getAttendees();
    const checkedInCount = attendees.filter(a => a.status === 'checked-in').length;
    const rate = Math.round((checkedInCount / attendees.length) * 100);

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); margin-bottom: var(--space-8);">
        <div class="card">
          <div class="card-header">
            <h4 class="card-title">Live QR Check-In Scanner Simulation</h4>
            <span class="badge badge-success">Online Turnstile</span>
          </div>
          <div class="card-body" style="text-align: center;">
            <div class="qr-scanner-viewfinder">
              <div class="scanner-laser-line"></div>
              <div style="color: #64748b; font-size: 0.85rem;">[Live Camera Feed Simulator]</div>
            </div>

            <form id="form-scan-ticket" style="display: flex; gap: 8px; max-width: 420px; margin: 0 auto;">
              <input 
                type="text" 
                id="input-scan-ticket-id" 
                class="form-control" 
                placeholder="Scan or enter Ticket ID (e.g. TCK-EVT101-7782)..." 
                required 
              />
              <button type="submit" class="btn btn-primary">
                Verify
              </button>
            </form>
            <div id="scan-result-banner" style="margin-top: 14px;"></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h4 class="card-title">Turnstile Attendance Velocity</h4>
            <span class="badge badge-purple">${rate}% Checked-in</span>
          </div>
          <div class="card-body">
            <div style="display: flex; justify-content: space-around; text-align: center; margin-bottom: 24px;">
              <div>
                <div style="font-size: 2rem; font-weight: 800; color: var(--color-success);">${checkedInCount}</div>
                <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase;">Verified In</div>
              </div>
              <div>
                <div style="font-size: 2rem; font-weight: 800; color: var(--color-warning);">${attendees.length - checkedInCount}</div>
                <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase;">Awaiting Entry</div>
              </div>
            </div>

            <h5 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 10px;">Quick Test Tickets (Click to Scan):</h5>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${attendees.slice(0, 3).map(a => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--color-surface-subtle); border-radius: 6px; font-size: 0.85rem;">
                  <span><strong>${a.name}</strong> (${a.ticketId})</span>
                  <button type="button" class="btn btn-outline btn-sm btn-quick-scan" data-id="${a.ticketId}">
                    Simulate Scan
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    const form = container.querySelector('#form-scan-ticket');
    const input = container.querySelector('#input-scan-ticket-id');
    const resultBanner = container.querySelector('#scan-result-banner');

    const executeScan = (ticketId) => {
      const result = this.qrService.processScan(ticketId);
      if (result.success) {
        resultBanner.innerHTML = `
          <div style="background: var(--color-success-light); color: var(--color-success); padding: 12px; border-radius: 8px; font-weight: 700; font-size: 0.9rem;">
            ✓ ${result.message}
          </div>
        `;
        this.showToast(result.message, 'success');
      } else {
        resultBanner.innerHTML = `
          <div style="background: var(--color-danger-light); color: var(--color-danger); padding: 12px; border-radius: 8px; font-weight: 700; font-size: 0.9rem;">
            ✗ ${result.message}
          </div>
        `;
        this.showToast(result.message, 'danger');
      }
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      executeScan(input.value);
    });

    container.querySelectorAll('.btn-quick-scan').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        input.value = id;
        executeScan(id);
      });
    });
  }

  // TAB: Attendees & CSV Export (Section 4.G)
  renderDashboardAttendees(container) {
    const attendees = this.store.getAttendees();
    const events = this.store.getEvents();

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6); flex-wrap: wrap; gap: 12px;">
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 800;">Attendee Directory (${attendees.length} Total)</h3>
          <p style="font-size: 0.85rem; color: var(--color-text-secondary);">Manage RSVPs, view gate entry status, and export full reports.</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button type="button" class="btn btn-outline" id="btn-export-attendees-csv">
            📥 Export to CSV
          </button>
          <button type="button" class="btn btn-primary" id="btn-add-attendee-open">
            + Register Attendee
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Attendee Name</th>
              <th>Email</th>
              <th>Event</th>
              <th>Ticket ID</th>
              <th>Role</th>
              <th>Check-in Status</th>
              <th>Certificate</th>
            </tr>
          </thead>
          <tbody>
            ${attendees.map(a => {
              const evt = events.find(e => e.id === a.eventId);
              return `
                <tr>
                  <td><strong>${a.name}</strong></td>
                  <td>${a.email}</td>
                  <td>${evt ? evt.title.slice(0, 30) + '...' : 'Event'}</td>
                  <td style="font-family: var(--font-family-mono); font-weight: 600;">${a.ticketId}</td>
                  <td><span class="badge badge-navy">${a.role}</span></td>
                  <td>
                    <span class="badge ${a.status === 'checked-in' ? 'badge-success' : 'badge-warning'}">
                      ${a.status}
                    </span>
                  </td>
                  <td>
                    <button type="button" class="btn btn-outline btn-sm btn-cert-gen" data-attendee="${a.name}" data-event="${evt ? evt.title : 'VAMS Conclave'}">
                      🎓 Generate
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.querySelector('#btn-export-attendees-csv').addEventListener('click', () => {
      this.exportAttendeesToCSV();
    });

    container.querySelector('#btn-add-attendee-open').addEventListener('click', () => {
      this.openBookingOrSeatingModal();
    });

    container.querySelectorAll('.btn-cert-gen').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const attName = e.currentTarget.getAttribute('data-attendee');
        const evtTitle = e.currentTarget.getAttribute('data-event');
        this.openCertificateModal(attName, evtTitle);
      });
    });
  }

  // TAB: Speakers (Section 4.K)
  renderDashboardSpeakers(container) {
    const speakers = this.store.getSpeakers();
    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--space-6);">
        ${speakers.map(s => `
          <div class="card">
            <div class="card-body" style="display: flex; gap: 16px; align-items: flex-start;">
              <img src="${s.image}" alt="${s.name}" style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover; flex-shrink: 0;" />
              <div>
                <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--color-primary-navy);">${s.name}</h4>
                <div style="font-size: 0.8rem; color: var(--color-secondary-purple); font-weight: 700; margin-bottom: 6px;">${s.designation}</div>
                <p style="font-size: 0.825rem; color: var(--color-text-secondary); margin-bottom: 10px;">${s.bio}</p>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  ${(s.topics || []).map(t => `<span class="badge badge-purple">${t}</span>`).join('')}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // TAB: Sponsors (Section 4.K)
  renderDashboardSponsors(container) {
    const sponsors = this.store.getSponsors();
    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-6);">
        ${sponsors.map(sp => `
          <div class="card">
            <div class="card-body">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h4 style="font-size: 1.15rem; font-weight: 800;">${sp.name}</h4>
                <span class="badge ${sp.tier === 'Platinum' ? 'badge-purple' : 'badge-cyan'}">${sp.tier} Partner</span>
              </div>
              <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 6px;">📍 <strong>${sp.booth}</strong></p>
              <div style="font-size: 1.25rem; font-weight: 800; color: var(--color-success); margin-bottom: 8px;">
                ₹${(sp.contribution).toLocaleString('en-IN')}
              </div>
              <p style="font-size: 0.75rem; color: var(--color-text-muted);">Contact: ${sp.contact}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // TAB: Volunteers (Section 4.L)
  renderDashboardVolunteers(container) {
    const volunteers = this.store.getVolunteers();
    container.innerHTML = `
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Volunteer Name</th>
              <th>Assigned Duty</th>
              <th>Shift Window</th>
              <th>Contact</th>
              <th>Check-in Status</th>
            </tr>
          </thead>
          <tbody>
            ${volunteers.map(v => `
              <tr>
                <td><strong>${v.name}</strong></td>
                <td><span class="badge badge-cyan">${v.duty}</span></td>
                <td style="font-family: var(--font-family-mono);">${v.shift}</td>
                <td>${v.phone}</td>
                <td>
                  <span class="badge ${v.status === 'checked-in' ? 'badge-success' : 'badge-warning'}">
                    ${v.status}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // TAB: Budget & Expenses (Section 4.M)
  renderDashboardBudget(container) {
    const budget = this.store.getBudget();
    const totalExpenses = (budget.expenses || []).reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = (budget.sponsorshipRevenue || 0) + (budget.ticketRevenue || 0);
    const netProfit = totalIncome - totalExpenses;

    container.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-card-title">Estimated Budget</div>
          <div class="kpi-card-value">₹${(budget.estimatedBudget).toLocaleString('en-IN')}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-card-title">Actual Expenses</div>
          <div class="kpi-card-value" style="color: var(--color-danger);">₹${totalExpenses.toLocaleString('en-IN')}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-card-title">Total Inflow (Sponsors + Tickets)</div>
          <div class="kpi-card-value" style="color: var(--color-success);">₹${totalIncome.toLocaleString('en-IN')}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-card-title">Net Profit / Reserve</div>
          <div class="kpi-card-value" style="color: ${netProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)'};">
            ₹${netProfit.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      <div class="chart-container-card" style="margin-bottom: var(--space-8);">
        <div class="chart-header">
          <h4 style="font-size: 1.1rem; font-weight: 700;">Expense Breakdown by Department</h4>
          <span class="badge badge-purple">Budget 2026</span>
        </div>
        <div class="chart-canvas-wrap">
          <canvas id="chart-budget-expenses"></canvas>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h4 class="card-title">Itemized Expense Registry</h4>
        </div>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Expense Item</th>
                <th>Category</th>
                <th>Amount (₹)</th>
                <th>Disbursement Status</th>
              </tr>
            </thead>
            <tbody>
              ${(budget.expenses || []).map(exp => `
                <tr>
                  <td><strong>${exp.title}</strong></td>
                  <td><span class="badge badge-navy">${exp.category}</span></td>
                  <td style="font-weight: 700;">₹${exp.amount.toLocaleString('en-IN')}</td>
                  <td>
                    <span class="badge ${exp.status === 'Paid' ? 'badge-success' : 'badge-warning'}">
                      ${exp.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    renderDashboardCharts(this.store);
  }

  // TAB: Analytics (Section 4.O)
  renderDashboardAnalytics(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6);">
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 800;">SaaS Growth & Performance Analytics</h3>
          <p style="font-size: 0.85rem; color: var(--color-text-secondary);">Calculated dynamically from real demo records.</p>
        </div>
        <button type="button" class="btn btn-outline" id="btn-export-analytics-csv">
          📥 Export Analytics Report
        </button>
      </div>

      <div class="charts-grid-2col">
        <div class="chart-container-card">
          <div class="chart-header">
            <h4 style="font-size: 1.1rem; font-weight: 700;">Registration Trajectory (7 Days)</h4>
          </div>
          <div class="chart-canvas-wrap">
            <canvas id="chart-revenue-trends"></canvas>
          </div>
        </div>

        <div class="chart-container-card">
          <div class="chart-header">
            <h4 style="font-size: 1.1rem; font-weight: 700;">Category Market Share</h4>
          </div>
          <div class="chart-canvas-wrap">
            <canvas id="chart-category-dist"></canvas>
          </div>
        </div>
      </div>
    `;

    renderDashboardCharts(this.store);

    container.querySelector('#btn-export-analytics-csv').addEventListener('click', () => {
      this.exportAnalyticsReportCSV();
    });
  }

  // TAB: Notifications (Section 4.N)
  renderDashboardNotifications(container) {
    const notifs = this.store.getNotifications();
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6);">
        <h3 style="font-size: 1.25rem; font-weight: 800;">Notification Inbox</h3>
        <button type="button" class="btn btn-outline btn-sm" id="btn-mark-all-read">
          Mark All As Read
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${notifs.map(n => `
          <div class="card" style="border-left: 4px solid ${n.type === 'warning' ? 'var(--color-warning)' : (n.type === 'success' ? 'var(--color-success)' : 'var(--color-secondary-purple)')}; opacity: ${n.isRead ? 0.75 : 1};">
            <div class="card-body" style="padding: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <h5 style="font-size: 0.95rem; font-weight: 700;">${n.title}</h5>
                <span style="font-size: 0.75rem; color: var(--color-text-muted);">${n.time}</span>
              </div>
              <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin-top: 4px;">${n.message}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelector('#btn-mark-all-read').addEventListener('click', () => {
      this.store.markAllNotificationsRead();
      this.showToast('All notifications marked as read.', 'info');
      this.renderDashboardTab('notifications');
    });
  }

  // TAB: Settings & Demo Data Manager (Section 9)
  renderDashboardSettings(container) {
    const user = this.store.getCurrentUser();
    const activeTheme = localStorage.getItem('vams_active_theme') || 'light';

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6);">
        <div class="card">
          <div class="card-header">
            <h4 class="card-title">User Profile & Demo Role</h4>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Active User Name</label>
              <input type="text" class="form-control" value="${user.name}" readonly />
            </div>
            <div class="form-group">
              <label class="form-label">Department / Title</label>
              <input type="text" class="form-control" value="${user.department}" readonly />
            </div>
            <div class="form-group">
              <label class="form-label">Switch Role Profile</label>
              <select id="select-settings-role" class="form-select">
                <option value="superadmin" ${user.role === 'superadmin' ? 'selected' : ''}>Super Admin</option>
                <option value="organizer" ${user.role === 'organizer' ? 'selected' : ''}>Event Organizer</option>
                <option value="venue_manager" ${user.role === 'venue_manager' ? 'selected' : ''}>Venue Manager</option>
                <option value="staff" ${user.role === 'staff' ? 'selected' : ''}>Event Staff / QR Desk</option>
                <option value="attendee" ${user.role === 'attendee' ? 'selected' : ''}>Student Attendee</option>
              </select>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h4 class="card-title">System & Storage Preferences</h4>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Theme Mode</label>
              <select id="select-settings-theme" class="form-select">
                <option value="light" ${activeTheme === 'light' ? 'selected' : ''}>Light Theme (Default)</option>
                <option value="dark" ${activeTheme === 'dark' ? 'selected' : ''}>Dark Theme (Enterprise)</option>
              </select>
            </div>

            <div style="border-top: 1px solid var(--color-border-subtle); padding-top: 16px; margin-top: 16px;">
              <h5 style="color: var(--color-danger); font-size: 0.95rem; font-weight: 700; margin-bottom: 6px;">
                Reset Demo Data
              </h5>
              <p style="font-size: 0.8rem; color: var(--color-text-secondary); margin-bottom: 14px;">
                Restore factory default demo records (events, venues, tickets, and sessions).
              </p>
              <button type="button" class="btn btn-danger btn-sm" id="btn-reset-demo-storage">
                ⚠️ Reset All Demo Data
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#select-settings-role').addEventListener('change', (e) => {
      this.switchRole(e.target.value);
    });

    container.querySelector('#select-settings-theme').addEventListener('change', (e) => {
      this.applyTheme(e.target.value);
    });

    container.querySelector('#btn-reset-demo-storage').addEventListener('click', () => {
      if (confirm('Reset all VAMS data back to default demo state?')) {
        this.store.resetAll();
        this.showToast('Demo data restored successfully!', 'success');
        this.renderDashboardTab('settings');
      }
    });
  }

  // =========================================================================
  // MODALS & INTERACTION POPUPS
  // =========================================================================
  openCreateEditEventModal(eventId = null, prefill = {}) {
    const isEdit = !!eventId;
    const existing = isEdit ? this.store.getEventById(eventId) : null;
    const venues = this.store.getVenues();
    const targetVenueId = existing ? existing.venueId : (prefill.venueId || (venues[0] ? venues[0].id : ''));
    const defaultDate = existing ? existing.date : (prefill.date ? `${prefill.date}T10:00` : '2026-11-25T10:00');
    const defaultEndDate = existing ? existing.endDate : (prefill.date ? `${prefill.date}T18:00` : '2026-11-25T18:00');

    const modalHtml = `
      <div class="modal-overlay active" id="modal-create-event">
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <h3 class="modal-title">${isEdit ? 'Edit Campus Event' : 'Create New Campus Event'}</h3>
            <button type="button" class="modal-close" id="btn-close-create-event">✕</button>
          </div>
          <form id="form-create-event">
            <div class="modal-body">
              <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 14px;">
                <div class="form-group">
                  <label class="form-label">Event Title *</label>
                  <input type="text" name="title" class="form-control" value="${existing ? existing.title : ''}" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Category *</label>
                  <select name="category" class="form-select" required>
                    <option value="Technical" ${existing && existing.category === 'Technical' ? 'selected' : ''}>Technical</option>
                    <option value="Cultural" ${existing && existing.category === 'Cultural' ? 'selected' : ''}>Cultural</option>
                    <option value="Workshop" ${existing && existing.category === 'Workshop' ? 'selected' : ''}>Workshop</option>
                    <option value="Sports" ${existing && existing.category === 'Sports' ? 'selected' : ''}>Sports</option>
                    <option value="Gaming" ${existing && existing.category === 'Gaming' ? 'selected' : ''}>Gaming</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Event Description</label>
                <textarea name="description" class="form-textarea" required>${existing ? existing.description : ''}</textarea>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div class="form-group">
                  <label class="form-label">Venue *</label>
                  <select name="venueId" class="form-select" required id="select-event-venue">
                    ${venues.map(v => `
                      <option value="${v.id}" data-name="${v.name}" ${targetVenueId === v.id ? 'selected' : ''}>
                        ${v.name} (Max ${v.capacity})
                      </option>
                    `).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Max Seating Capacity *</label>
                  <input type="number" name="capacity" class="form-control" min="10" max="2000" value="${existing ? existing.capacity : 200}" required />
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div class="form-group">
                  <label class="form-label">Start Date & Time *</label>
                  <input type="datetime-local" name="date" class="form-control" value="${defaultDate}" required />
                </div>
                <div class="form-group">
                  <label class="form-label">End Date & Time *</label>
                  <input type="datetime-local" name="endDate" class="form-control" value="${defaultEndDate}" required />
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div class="form-group">
                  <label class="form-label">Ticket Price (₹) <span class="optional">(0 = Free)</span></label>
                  <input type="number" name="price" class="form-control" min="0" value="${existing ? existing.price : 0}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Organizer / Club Name</label>
                  <input type="text" name="organizerName" class="form-control" value="${existing ? existing.organizerName : 'Technical Society'}" required />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Cover Image URL</label>
                <input type="url" name="image" class="form-control" value="${existing ? existing.image : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}" />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" id="btn-cancel-create-event">Cancel</button>
              <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Publish Event'}</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.mountModal(modalHtml, 'modal-create-event', () => {
      document.getElementById('btn-close-create-event').onclick = () => this.unmountModal('modal-create-event');
      document.getElementById('btn-cancel-create-event').onclick = () => this.unmountModal('modal-create-event');

      document.getElementById('form-create-event').onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const venueSelect = document.getElementById('select-event-venue');
        const selectedOption = venueSelect.options[venueSelect.selectedIndex];

        const payload = {
          title: formData.get('title'),
          category: formData.get('category'),
          description: formData.get('description'),
          venueId: formData.get('venueId'),
          venue: selectedOption ? selectedOption.getAttribute('data-name') : 'Main Campus',
          capacity: parseInt(formData.get('capacity'), 10),
          date: formData.get('date'),
          endDate: formData.get('endDate'),
          price: parseInt(formData.get('price') || 0, 10),
          isPaid: parseInt(formData.get('price') || 0, 10) > 0,
          organizerName: formData.get('organizerName'),
          image: formData.get('image') || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
        };

        if (isEdit) payload.id = eventId;
        this.store.saveEvent(payload);
        this.unmountModal('modal-create-event');
        this.showToast(isEdit ? 'Event updated successfully!' : 'New campus event published!', 'success');
        this.renderDashboardTab('events');
      };
    });
  }

  openBookingOrSeatingModal(eventId = null) {
    const events = this.store.getEvents();
    const event = eventId ? this.store.getEventById(eventId) : events[0];
    const booked = this.store.getBookedSeatsForEvent(event.id);

    let selectedSeatsArray = ['A3'];
    let selectedTotalAmount = event.isPaid ? Math.round((event.price || 250) * 1.5) : 0;
    let selectedSectionName = 'VIP Front Stage Tier';

    const modalHtml = `
      <div class="modal-overlay active" id="modal-booking">
        <div class="modal-dialog modal-xl">
          <div class="modal-header">
            <div>
              <span class="badge badge-purple">${event.category}</span>
              <h3 class="modal-title" style="margin-top: 4px;">Select Seats & Book Pass: ${event.title}</h3>
              <p style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 2px;">
                📍 ${event.venue} &bull; 📅 ${new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>
            <button type="button" class="modal-close" id="btn-close-booking">✕</button>
          </div>

          <div class="modal-body" style="padding: 20px;">
            <!-- STEP 1: Interactive Visual Seating Layout -->
            <div id="booking-step-1-seating">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--color-primary-navy);">
                  Step 1: Choose Your Preferred Seats
                </h4>
                <span class="badge badge-cyan">Click seat to select</span>
              </div>

              <!-- Interactive Seating Canvas Target -->
              <div id="booking-seating-canvas-target" style="border: 1px solid var(--color-border); border-radius: 12px; padding: 18px; background: var(--color-surface); margin-bottom: 16px;"></div>

              <div style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--color-border); padding-top: 14px;">
                <button type="button" class="btn btn-outline" id="btn-cancel-step-1">Cancel</button>
                <button type="button" class="btn btn-primary" id="btn-proceed-to-step-2">
                  Continue to Attendee Details →
                </button>
              </div>
            </div>

            <!-- STEP 2: Attendee Information & Ticket Confirmation -->
            <div id="booking-step-2-form" style="display: none;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--color-primary-navy);">
                  Step 2: Attendee Details & Pass Confirmation
                </h4>
                <button type="button" class="btn btn-ghost btn-sm" id="btn-back-to-step-1">
                  ← Change Seats
                </button>
              </div>

              <!-- Selected Seat Highlight Box -->
              <div style="background: linear-gradient(135deg, rgba(115, 87, 255, 0.08) 0%, rgba(0, 194, 215, 0.08) 100%); border: 2px solid var(--color-secondary-purple); border-radius: 10px; padding: 14px 18px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <div>
                  <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 800; color: var(--color-secondary-purple);">RESERVED SEAT(S) FOR TICKET:</span>
                  <div id="booking-confirmed-seats-label" style="font-size: 1.25rem; font-weight: 800; color: var(--color-primary-navy);">
                    💺 Seat(s): A3 (VIP Front Stage Tier)
                  </div>
                </div>
                <div style="text-align: right;">
                  <span style="font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase;">Total Payable:</span>
                  <div id="booking-confirmed-price-label" style="font-size: 1.35rem; font-weight: 800; color: var(--color-secondary-purple);">
                    ${event.isPaid ? '₹' + selectedTotalAmount : 'FREE RSVP'}
                  </div>
                </div>
              </div>

              <form id="form-booking-rsvp">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                  <div class="form-group">
                    <label class="form-label">Full Name *</label>
                    <input type="text" name="name" class="form-control" placeholder="e.g. Rahul Sharma" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Student / Work Email *</label>
                    <input type="email" name="email" class="form-control" placeholder="e.g. rahul.s@college.edu" required />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Department / College ID</label>
                  <input type="text" name="department" class="form-control" placeholder="e.g. CS2024-042" />
                </div>

                <div class="form-group">
                  <label class="form-label">Discount Coupon Code</label>
                  <div style="display: flex; gap: 8px;">
                    <input type="text" id="input-coupon" class="form-control" placeholder="Try 'EARLYBIRD20' or 'VAMS100'" />
                    <button type="button" class="btn btn-outline" id="btn-apply-coupon">Apply</button>
                  </div>
                  <div id="coupon-message" style="font-size: 0.75rem; margin-top: 4px;"></div>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--color-border); padding-top: 14px; margin-top: 18px;">
                  <button type="button" class="btn btn-outline" id="btn-cancel-booking-form">Cancel</button>
                  <button type="submit" class="btn btn-primary" id="btn-confirm-ticket-pass">
                    🎟️ Confirm Booking & Generate Ticket Pass
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    this.mountModal(modalHtml, 'modal-booking', () => {
      document.getElementById('btn-close-booking').onclick = () => this.unmountModal('modal-booking');
      document.getElementById('btn-cancel-step-1').onclick = () => this.unmountModal('modal-booking');
      document.getElementById('btn-cancel-booking-form').onclick = () => this.unmountModal('modal-booking');

      const step1 = document.getElementById('booking-step-1-seating');
      const step2 = document.getElementById('booking-step-2-form');
      const btnProceed = document.getElementById('btn-proceed-to-step-2');
      const btnBack = document.getElementById('btn-back-to-step-1');
      const seatCanvasTarget = document.getElementById('booking-seating-canvas-target');

      const seatsLabel = document.getElementById('booking-confirmed-seats-label');
      const priceLabel = document.getElementById('booking-confirmed-price-label');

      // Initialize Seating Manager directly for this event
      const seatingManager = new SeatingManager(seatCanvasTarget, {
        eventId: event.id,
        isFree: !event.isPaid,
        basePrice: event.price || 0,
        bookedSeats: booked,
        initialSeats: ['A3'],
        onSelectionChange: (seats, total, section) => {
          selectedSeatsArray = seats;
          selectedTotalAmount = total;
          selectedSectionName = section;

          if (seats.length === 0) {
            btnProceed.disabled = true;
            btnProceed.innerText = 'Select At Least 1 Seat';
          } else {
            btnProceed.disabled = false;
            btnProceed.innerText = `Continue with ${seats.join(', ')} (${seats.length} Seat${seats.length === 1 ? '' : 's'}) →`;
          }
        }
      });
      seatingManager.render();

      // Step Navigation
      btnProceed.onclick = () => {
        if (selectedSeatsArray.length === 0) {
          this.showToast('Please select at least one seat to continue.', 'warning');
          return;
        }
        seatsLabel.innerText = `💺 Seat(s): ${selectedSeatsArray.join(', ')} (${selectedSectionName})`;
        priceLabel.innerText = event.isPaid ? `₹${selectedTotalAmount}` : 'FREE RSVP';
        step1.style.display = 'none';
        step2.style.display = 'block';
      };

      btnBack.onclick = () => {
        step2.style.display = 'none';
        step1.style.display = 'block';
      };

      // Coupon Engine
      const couponInput = document.getElementById('input-coupon');
      const couponBtn = document.getElementById('btn-apply-coupon');
      const couponMsg = document.getElementById('coupon-message');

      couponBtn.onclick = () => {
        const code = (couponInput.value || '').trim().toUpperCase();
        if (code === 'EARLYBIRD20') {
          const discounted = Math.round(selectedTotalAmount * 0.8);
          couponMsg.innerHTML = '<span style="color: var(--color-success); font-weight: bold;">✓ 20% Discount Applied!</span>';
          priceLabel.innerText = `₹${discounted} (20% Off)`;
        } else if (code === 'VAMS100') {
          const discounted = Math.max(0, selectedTotalAmount - 100);
          couponMsg.innerHTML = '<span style="color: var(--color-success); font-weight: bold;">✓ ₹100 Flat Voucher Applied!</span>';
          priceLabel.innerText = `₹${discounted} (₹100 Off)`;
        } else {
          couponMsg.innerHTML = '<span style="color: var(--color-danger);">Invalid code. Try EARLYBIRD20</span>';
        }
      };

      // Final Confirmation
      document.getElementById('form-booking-rsvp').onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const attendee = this.store.addAttendee({
          name: formData.get('name'),
          email: formData.get('email'),
          eventId: event.id,
          role: 'Student',
          seats: selectedSeatsArray,
          seatSection: selectedSectionName,
          totalPrice: selectedTotalAmount
        });

        this.unmountModal('modal-booking');
        this.showToast(`🎉 Success! Seat(s) ${selectedSeatsArray.join(', ')} booked for ${attendee.name}!`, 'success');

        // Automated Email Notification dispatch (Feature 6: Nodemailer Integration)
        fetch('http://localhost:5000/api/notifications/send-ticket-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: attendee.email,
            name: attendee.name,
            ticketId: attendee.ticketId,
            eventTitle: event.title,
            venue: event.venue,
            date: event.date,
            seats: attendee.seats,
            seatSection: attendee.seatSection
          })
        }).then(res => res.json())
          .then(data => {
            if (data.success) {
              this.showToast(`📧 Confirmation email sent to ${attendee.email}!`, 'success');
              if (data.previewUrl) {
                console.log('Ethereal Email Web Preview:', data.previewUrl);
              }
            }
          })
          .catch(err => console.log('Notification server info:', err.message));

        this.openTicketPassModal(attendee.ticketId);
        this.renderPublicEvents();
      };
    });
  }

  openTicketPassModal(ticketId) {
    const attendees = this.store.getAttendees();
    const attendee = attendees.find(a => a.ticketId === ticketId);
    if (!attendee) return;

    const event = this.store.getEventById(attendee.eventId);
    const passHtml = this.qrService.generateTicketPassHtml(attendee, event);

    const modalHtml = `
      <div class="modal-overlay active" id="modal-ticket-pass">
        <div class="modal-dialog modal-md">
          <div class="modal-header">
            <h3 class="modal-title">Official Digital Ticket Pass</h3>
            <button type="button" class="modal-close" id="btn-close-pass">✕</button>
          </div>
          <div class="modal-body" style="padding: 24px;">
            ${passHtml}
          </div>
        </div>
      </div>
    `;

    this.mountModal(modalHtml, 'modal-ticket-pass', () => {
      document.getElementById('btn-close-pass').onclick = () => this.unmountModal('modal-ticket-pass');
      this.qrService.renderQRCode('qr-target-container', attendee, event);
    });
  }

  openCertificateModal(attendeeName, eventTitle) {
    const certId = `CERT-VAMS-${Math.floor(100000 + Math.random() * 900000)}`;
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const modalHtml = `
      <div class="modal-overlay active" id="modal-certificate">
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <h3 class="modal-title">Certificate of Participation</h3>
            <button type="button" class="modal-close" id="btn-close-cert">✕</button>
          </div>
          <div class="modal-body" style="text-align: center; padding: 40px; background: #fff; border: 12px solid #14213D; border-radius: 8px;">
            <div style="font-size: 0.8rem; font-weight: 800; letter-spacing: 0.2em; color: #7357FF; text-transform: uppercase;">
              VAMS SMART EVENT SYSTEM • OFFICIAL CREDENTIAL
            </div>
            <h2 style="font-size: 2.2rem; font-weight: 800; color: #14213D; margin: 18px 0 6px;">
              CERTIFICATE OF MERIT
            </h2>
            <p style="font-size: 0.9rem; color: #64748B;">This is proudly presented to</p>
            <div style="font-size: 1.8rem; font-weight: 800; color: #7357FF; text-decoration: underline; margin: 12px 0;">
              ${attendeeName}
            </div>
            <p style="font-size: 0.95rem; color: #14213D; max-width: 580px; margin: 0 auto 24px; line-height: 1.6;">
              for exemplary active participation and contribution to <strong>${eventTitle}</strong> held under the auspices of the University Academic Council.
            </p>
            <div style="display: flex; justify-content: space-around; border-top: 1px solid #E2E8F0; padding-top: 20px; font-size: 0.8rem; color: #64748B;">
              <div>Verified ID: <strong>${certId}</strong></div>
              <div>Date Issued: <strong>${dateStr}</strong></div>
              <div>Authorized Signatory: <strong>Dean Academics</strong></div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-navy" onclick="window.print()">🖨️ Print Certificate</button>
          </div>
        </div>
      </div>
    `;

    this.mountModal(modalHtml, 'modal-certificate', () => {
      document.getElementById('btn-close-cert').onclick = () => this.unmountModal('modal-certificate');
    });
  }

  // =========================================================================
  // CSV EXPORTERS (Section 4.G & 4.O)
  // =========================================================================
  exportAttendeesToCSV() {
    const attendees = this.store.getAttendees();
    const events = this.store.getEvents();

    let csv = 'Attendee Name,Email,Ticket ID,Event Title,Role,Status,Registration Date\n';
    attendees.forEach(a => {
      const evt = events.find(e => e.id === a.eventId);
      const title = evt ? evt.title.replace(/,/g, ' ') : 'Campus Event';
      csv += `"${a.name}","${a.email}","${a.ticketId}","${title}","${a.role}","${a.status}","${a.regDate}"\n`;
    });

    this.downloadCSV(csv, `VAMS_Attendees_${new Date().toISOString().split('T')[0]}.csv`);
    this.showToast('Attendee CSV exported successfully!', 'success');
  }

  exportAnalyticsReportCSV() {
    const events = this.store.getEvents();
    let csv = 'Event ID,Title,Category,Venue,Registrations,Capacity,Utilization (%)\n';
    events.forEach(e => {
      const util = Math.round((e.registeredCount / e.capacity) * 100);
      csv += `"${e.id}","${e.title.replace(/,/g, ' ')}","${e.category}","${e.venue}","${e.registeredCount}","${e.capacity}","${util}%"\n`;
    });

    this.downloadCSV(csv, `VAMS_Analytics_Report_${new Date().toISOString().split('T')[0]}.csv`);
    this.showToast('Analytics CSV exported successfully!', 'success');
  }

  downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // =========================================================================
  // TOASTS, MODAL MOUNTERS & UTILITIES
  // =========================================================================
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-title">${type === 'danger' ? 'Error' : 'Notification'}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button type="button" class="toast-close">✕</button>
    `;

    toast.querySelector('.toast-close').onclick = () => toast.remove();
    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 4500);
  }

  mountModal(htmlString, modalId, onMounted) {
    this.unmountModal(modalId);
    const div = document.createElement('div');
    div.id = modalId + '-wrapper';
    div.innerHTML = htmlString;
    document.body.appendChild(div);
    if (onMounted) onMounted();
  }

  unmountModal(modalId) {
    const existing = document.getElementById(modalId + '-wrapper');
    if (existing) existing.remove();
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vams_active_theme', theme);
  }

  switchRole(role) {
    this.store.setCurrentUserRole(role);
    this.updateUserRoleBadge();
    this.showToast(`Switched active role to: ${role.toUpperCase()}`, 'info');
    if (this.currentView === 'dashboard') {
      this.renderDashboardTab(this.currentDashboardTab);
    }
  }

  updateUserRoleBadge() {
    const user = this.store.getCurrentUser();
    document.querySelectorAll('.active-role-label').forEach(el => {
      el.innerText = user.role.toUpperCase();
    });
    document.querySelectorAll('.active-user-name').forEach(el => {
      el.innerText = user.name;
    });
    document.querySelectorAll('.active-user-avatar').forEach(el => {
      el.innerText = user.avatar;
    });
  }

  initSidebarSearch() {
    const input = document.getElementById('sidebar-nav-search');
    const clearBtn = document.getElementById('btn-clear-sidebar-search');
    const items = document.querySelectorAll('.sidebar-item');
    const sectionTitles = document.querySelectorAll('.sidebar-section-title');
    const searchResultsContainer = document.getElementById('sidebar-search-results-list');

    if (!input) return;

    input.addEventListener('input', (e) => {
      const q = (e.target.value || '').trim().toLowerCase();
      if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';

      if (!q) {
        items.forEach(el => el.style.display = 'flex');
        sectionTitles.forEach(el => el.style.display = 'block');
        if (searchResultsContainer) searchResultsContainer.innerHTML = '';
        return;
      }

      // Hide section titles during active search
      sectionTitles.forEach(el => el.style.display = 'none');

      // Filter sidebar items directly
      items.forEach(el => {
        const label = el.querySelector('.sidebar-item-label')?.innerText.toLowerCase() || '';
        const match = label.includes(q);
        el.style.display = match ? 'flex' : 'none';
      });

      // Also search Events and Venues to show 1-click jumps in the sidebar
      const events = this.store.getEvents().filter(evt => evt.title.toLowerCase().includes(q) || evt.category.toLowerCase().includes(q));
      const venues = this.store.getVenues().filter(ven => ven.name.toLowerCase().includes(q));

      if (searchResultsContainer) {
        let html = '';
        if (events.length > 0) {
          html += `<div class="sidebar-search-subhead">MATCHING EVENTS</div>`;
          events.slice(0, 3).forEach(evt => {
            html += `
              <div class="sidebar-search-result-item" data-event-id="${evt.id}">
                <span>🎪 ${evt.title.slice(0, 20)}...</span>
                <span class="badge badge-purple" style="font-size: 0.65rem;">RSVP</span>
              </div>
            `;
          });
        }
        if (venues.length > 0) {
          html += `<div class="sidebar-search-subhead">MATCHING VENUES</div>`;
          venues.slice(0, 2).forEach(ven => {
            html += `
              <div class="sidebar-search-result-item" data-venue-tab="venues">
                <span>🏛️ ${ven.name.slice(0, 20)}...</span>
                <span class="badge badge-cyan" style="font-size: 0.65rem;">View</span>
              </div>
            `;
          });
        }
        searchResultsContainer.innerHTML = html;

        searchResultsContainer.querySelectorAll('[data-event-id]').forEach(btn => {
          btn.addEventListener('click', (ev) => {
            const id = ev.currentTarget.getAttribute('data-event-id');
            this.openBookingOrSeatingModal(id);
          });
        });
        searchResultsContainer.querySelectorAll('[data-venue-tab]').forEach(btn => {
          btn.addEventListener('click', () => {
            this.showDashboard('venues');
          });
        });
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        input.dispatchEvent(new Event('input'));
        input.focus();
      });
    }
  }

  initCommandPalette() {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openCommandPalette();
      }
    });
  }

  openCommandPalette() {
    const overlay = document.getElementById('command-palette-overlay');
    if (overlay) {
      overlay.classList.add('active');
      const input = overlay.querySelector('.command-palette-input');
      if (input) {
        input.value = '';
        input.focus();
      }
    }
  }

  closeCommandPalette() {
    const overlay = document.getElementById('command-palette-overlay');
    if (overlay) overlay.classList.remove('active');
  }

  bindGlobalEvents() {
    // 3-Line Hamburger Navigation Drawer bindings
    const openDrawerBtn = document.getElementById('btn-open-nav-drawer');
    const closeDrawerBtn = document.getElementById('btn-close-nav-drawer');
    const drawerOverlay = document.getElementById('nav-drawer-overlay');
    const navDrawer = document.getElementById('nav-drawer');

    const openDrawer = () => {
      if (navDrawer) navDrawer.classList.add('active');
      if (drawerOverlay) drawerOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      const searchInput = document.getElementById('drawer-search-input');
      if (searchInput) setTimeout(() => searchInput.focus(), 150);
    };

    const closeDrawer = () => {
      if (navDrawer) navDrawer.classList.remove('active');
      if (drawerOverlay) drawerOverlay.classList.remove('active');
      document.body.style.overflow = '';
    };

    if (openDrawerBtn) openDrawerBtn.addEventListener('click', openDrawer);
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
    if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

    // Auto-close drawer on item selection
    document.querySelectorAll('.drawer-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        closeDrawer();
      });
    });

    // Navigation link buttons
    document.querySelectorAll('[data-route]').forEach(el => {
      el.addEventListener('click', (e) => {
        const route = e.currentTarget.getAttribute('data-route');
        if (route === 'landing') this.showLanding();
        if (route.startsWith('dashboard')) {
          const tab = route.split('/')[1] || 'overview';
          this.showDashboard(tab);
        }
      });
    });

    // Sidebar items
    document.querySelectorAll('.sidebar-item').forEach(el => {
      el.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        this.showDashboard(tab);
      });
    });

    // Sidebar toggle (collapse / expand)
    const sidebarToggle = document.getElementById('btn-sidebar-toggle');
    const sidebar = document.querySelector('.dashboard-sidebar');

    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });
    }

    // Role switcher dropdown buttons
    document.querySelectorAll('[data-role-switch]').forEach(el => {
      el.addEventListener('click', (e) => {
        const role = e.currentTarget.getAttribute('data-role-switch');
        this.switchRole(role);
      });
    });

    // Theme toggle button
    document.querySelectorAll('[data-toggle-theme]').forEach(el => {
      el.addEventListener('click', () => {
        const current = localStorage.getItem('vams_active_theme') || 'light';
        const next = current === 'light' ? 'dark' : 'light';
        this.applyTheme(next);
      });
    });

    // Command palette close
    const paletteOverlay = document.getElementById('command-palette-overlay');
    if (paletteOverlay) {
      paletteOverlay.addEventListener('click', (e) => {
        if (e.target === paletteOverlay) this.closeCommandPalette();
      });
    }
  }

  initIcons() {
    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons();
    }
  }
}

// Instantiate and attach to window
window.vamsApp = new VAMSApp();


// Expose Auth Manager globally and sync header button on load
window.vamsAuth = authManager;
window.addEventListener('DOMContentLoaded', () => {
  authManager.syncAppRoleAndHeader();
  if (window.location.hash === '#login') {
    authManager.openAuthPage('login');
  }
});
window.addEventListener('hashchange', () => {
  if (window.location.hash === '#login') {
    authManager.openAuthPage('login');
  }
});

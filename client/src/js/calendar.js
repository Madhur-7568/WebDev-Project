import { store } from './store.js';

const CATEGORY_COLORS = {
  Technical: '#7357ff',
  Cultural: '#ec4899',
  Workshop: '#00c2d7',
  Sports: '#10b981',
  Gaming: '#f59e0b'
};

export class CalendarManager {
  constructor() {
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth(); // 0-11
    this.selectedDateStr = this.formatDateKey(today);
    this.categoryFilter = 'All';
  }

  formatDateKey(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getEventsForDate(dateKey, allEvents) {
    return allEvents.filter(evt => {
      if (this.categoryFilter !== 'All' && (evt.category || '').toLowerCase() !== this.categoryFilter.toLowerCase()) {
        return false;
      }
      const startDay = (evt.date || '').split('T')[0];
      const endDay = (evt.endDate || evt.date || '').split('T')[0];
      return startDay && dateKey >= startDay && dateKey <= endDay;
    });
  }

  render(container) {
    const allEvents = store.getEvents ? store.getEvents() : [];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const todayKey = this.formatDateKey(new Date());

    // Build calendar cells
    let cellsHTML = '';
    for (let i = 0; i < firstDayOfMonth; i++) {
      cellsHTML += `<div class="cal-cell cal-cell-empty"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(this.currentYear, this.currentMonth, day);
      const dateKey = this.formatDateKey(dateObj);
      const dayEvents = this.getEventsForDate(dateKey, allEvents);
      const isToday = dateKey === todayKey;
      const isSelected = dateKey === this.selectedDateStr;

      cellsHTML += `
        <div class="cal-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}" data-date="${dateKey}">
          <div class="cal-cell-top">
            <span class="cal-day-num">${day}</span>
            ${dayEvents.length ? `<span class="cal-count-dot">${dayEvents.length}</span>` : ''}
          </div>
          <div class="cal-cell-events">
            ${dayEvents.slice(0, 2).map(evt => {
              const color = CATEGORY_COLORS[evt.category] || '#7357ff';
              return `
                <div class="cal-event-pill" style="border-left: 3px solid ${color}; background: ${color}18;" title="${this.escapeHTML(evt.title)}">
                  ${this.escapeHTML(evt.title)}
                </div>
              `;
            }).join('')}
            ${dayEvents.length > 2 ? `<div class="cal-more-label">+${dayEvents.length - 2} more</div>` : ''}
          </div>
        </div>
      `;
    }

    const selectedEvents = this.getEventsForDate(this.selectedDateStr, allEvents);

    container.innerHTML = `
      <div class="calendar-module">
        <div class="cal-toolbar card">
          <div class="cal-nav-group">
            <button type="button" class="btn btn-outline btn-sm" id="cal-prev-month">← Prev</button>
            <h2 class="cal-month-title">${monthNames[this.currentMonth]} ${this.currentYear}</h2>
            <button type="button" class="btn btn-outline btn-sm" id="cal-next-month">Next →</button>
            <button type="button" class="btn btn-outline btn-sm" id="cal-today-btn">Today</button>
          </div>

          <div class="cal-filter-group">
            <label for="cal-cat-filter">Category:</label>
            <select id="cal-cat-filter" class="form-control">
              <option value="All" ${this.categoryFilter === 'All' ? 'selected' : ''}>All Categories</option>
              ${Object.keys(CATEGORY_COLORS).map(cat => `
                <option value="${cat}" ${this.categoryFilter === cat ? 'selected' : ''}>${cat}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="cal-main-grid">
          <div class="cal-board card">
            <div class="cal-weekdays">
              ${dayNames.map(d => `<div class="cal-weekday">${d}</div>`).join('')}
            </div>
            <div class="cal-days-grid">
              ${cellsHTML}
            </div>
          </div>

          <div class="cal-side-panel card">
            <div class="cal-side-header">
              <span class="cal-date-badge">📅 ${this.selectedDateStr}</span>
              <h3>Scheduled Events (${selectedEvents.length})</h3>
            </div>

            ${selectedEvents.length === 0 ? `
              <div class="cal-empty-day">
                <p>No campus events scheduled on this date.</p>
                <small>Click any highlighted date on the grid or jump to Event Catalog to schedule one.</small>
              </div>
            ` : `
              <div class="cal-day-list">
                ${selectedEvents.map(evt => {
                  const color = CATEGORY_COLORS[evt.category] || '#7357ff';
                  const timeStr = (evt.date && evt.date.includes('T')) ? evt.date.split('T')[1] : 'All Day';
                  return `
                    <div class="cal-detail-card" style="border-left: 4px solid ${color};">
                      <div class="cal-detail-meta">
                        <span class="badge" style="background: ${color}20; color: ${color};">${evt.category || 'Event'}</span>
                        <span>⏰ ${timeStr}</span>
                      </div>
                      <h4>${this.escapeHTML(evt.title)}</h4>
                      <p class="cal-detail-venue">🏛️ ${this.escapeHTML(evt.venue || 'Campus Venue')}</p>
                      <div class="cal-detail-stats">
                        <span>👥 ${evt.registeredCount || 0} / ${evt.capacity || 100} registered</span>
                        <button type="button" class="btn btn-outline btn-sm cal-jump-btn" data-tab-jump="events">Manage →</button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container);
  }

  bindEvents(container) {
    container.querySelector('#cal-prev-month')?.addEventListener('click', () => {
      if (this.currentMonth === 0) {
        this.currentMonth = 11;
        this.currentYear--;
      } else {
        this.currentMonth--;
      }
      this.render(container);
    });

    container.querySelector('#cal-next-month')?.addEventListener('click', () => {
      if (this.currentMonth === 11) {
        this.currentMonth = 0;
        this.currentYear++;
      } else {
        this.currentMonth++;
      }
      this.render(container);
    });

    container.querySelector('#cal-today-btn')?.addEventListener('click', () => {
      const now = new Date();
      this.currentYear = now.getFullYear();
      this.currentMonth = now.getMonth();
      this.selectedDateStr = this.formatDateKey(now);
      this.render(container);
    });

    container.querySelector('#cal-cat-filter')?.addEventListener('change', (e) => {
      this.categoryFilter = e.target.value;
      this.render(container);
    });

    container.querySelectorAll('.cal-cell[data-date]').forEach(cell => {
      cell.addEventListener('click', () => {
        this.selectedDateStr = cell.getAttribute('data-date');
        this.render(container);
      });
    });

    container.querySelectorAll('.cal-jump-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.vamsApp) window.vamsApp.showDashboard('events');
      });
    });
  }

  escapeHTML(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
}

export const calendarManager = new CalendarManager();

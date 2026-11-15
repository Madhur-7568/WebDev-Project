import { store } from './store.js';

const REVIEWS_KEY = 'vams_event_reviews_v1';

const DEFAULT_REVIEWS = [
  {
    id: 'rev-101',
    eventId: 'evt-1',
    eventTitle: 'HackIIIT 2026 — 36-Hour National Hackathon',
    author: 'Rahul Sharma',
    role: 'Student Attendee',
    rating: 5,
    comment: 'Incredible problem statements, seamless QR check-in at the gate, and responsive mentors throughout the night!',
    date: '2026-11-10',
    helpful: 14
  },
  {
    id: 'rev-102',
    eventId: 'evt-2',
    eventTitle: 'AI & Systems Architecture Symposium',
    author: 'Priya Verma',
    role: 'Event Organizer',
    rating: 4,
    comment: 'Great keynote sessions and zero hall scheduling overlaps thanks to the agenda conflict detector.',
    date: '2026-11-12',
    helpful: 9
  }
];

export class ReviewsManager {
  constructor() {
    if (!localStorage.getItem(REVIEWS_KEY)) {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(DEFAULT_REVIEWS));
    }
    this.selectedRating = 5;
    this.filterEventId = 'all';
  }

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(REVIEWS_KEY)) || [];
    } catch {
      return DEFAULT_REVIEWS;
    }
  }

  saveAll(reviews) {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  }

  getStats(reviews) {
    if (!reviews.length) return { avg: '0.0', total: 0, counts: [0, 0, 0, 0, 0] };
    const counts = [0, 0, 0, 0, 0];
    let sum = 0;
    reviews.forEach(r => {
      const idx = Math.min(5, Math.max(1, Number(r.rating))) - 1;
      counts[idx]++;
      sum += Number(r.rating);
    });
    return {
      avg: (sum / reviews.length).toFixed(1),
      total: reviews.length,
      counts
    };
  }

  render(container) {
    const events = store.getEvents ? store.getEvents() : [];
    const user = store.getCurrentUser ? store.getCurrentUser() : { name: 'Student Attendee', role: 'attendee' };
    const allReviews = this.getAll();
    const filtered = this.filterEventId === 'all'
      ? allReviews
      : allReviews.filter(r => r.eventId === this.filterEventId);
    const stats = this.getStats(allReviews);

    container.innerHTML = `
      <div class="reviews-module">
        <div class="reviews-header-banner">
          <div>
            <h2>⭐ Event Reviews, Ratings & Campus Feedback</h2>
            <p>Verified post-event attendee ratings, speaker feedback, and sentiment insights.</p>
          </div>
          <div class="reviews-filter-box">
            <label for="review-event-filter">Filter by Event:</label>
            <select id="review-event-filter" class="form-control">
              <option value="all">All Campus Events (${allReviews.length})</option>
              ${events.map(e => `<option value="${e.id}" ${this.filterEventId === e.id ? 'selected' : ''}>${e.title}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="reviews-grid-layout">
          <div class="reviews-sidebar-col">
            <div class="card review-summary-card">
              <div class="avg-score-row">
                <span class="avg-big-number">${stats.avg}</span>
                <div>
                  <div class="stars-display">${'★'.repeat(Math.round(Number(stats.avg)))}${'☆'.repeat(5 - Math.round(Number(stats.avg)))}</div>
                  <small>Based on ${stats.total} verified campus reviews</small>
                </div>
              </div>
              <div class="rating-bars">
                ${[5, 4, 3, 2, 1].map(star => {
                  const count = stats.counts[star - 1];
                  const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
                  return `
                    <div class="rating-bar-row">
                      <span>${star} ★</span>
                      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
                      <span>${count}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <form id="vams-review-form" class="card review-form-card">
              <h3>Submit Event Feedback</h3>
              <p class="form-sub">Posting as <strong>${user.name}</strong></p>

              <label>Select Event</label>
              <select id="rev-event-select" class="form-control" required>
                ${events.length
                  ? events.map(e => `<option value="${e.id}" data-title="${e.title}">${e.title}</option>`).join('')
                  : '<option value="evt-1" data-title="HackIIIT 2026">HackIIIT 2026</option>'}
              </select>

              <label>Your Star Rating</label>
              <div class="star-picker" id="star-picker">
                ${[1, 2, 3, 4, 5].map(n => `
                  <button type="button" class="star-btn ${n <= this.selectedRating ? 'active' : ''}" data-val="${n}">★</button>
                `).join('')}
              </div>

              <label>Review & Suggestions</label>
              <textarea id="rev-comment" class="form-control" rows="3" placeholder="Share what you liked about the venue, speakers, or organization..." required></textarea>

              <button type="submit" class="btn btn-primary" style="width:100%; margin-top: 12px;">Publish Review</button>
            </form>
          </div>

          <div class="reviews-feed-col">
            ${filtered.length === 0 ? `
              <div class="card empty-reviews">
                <p>No reviews yet for this event. Be the first to share your feedback!</p>
              </div>
            ` : filtered.map(rev => `
              <div class="card review-item-card">
                <div class="review-item-top">
                  <div>
                    <span class="review-event-tag">${rev.eventTitle}</span>
                    <h4>${rev.author} <small>• ${rev.role}</small></h4>
                  </div>
                  <div class="review-stars-badge">${'★'.repeat(rev.rating)}${'☆'.repeat(5 - rev.rating)}</div>
                </div>
                <p class="review-body">${this.escapeHTML(rev.comment)}</p>
                <div class="review-footer">
                  <span>Posted on ${rev.date}</span>
                  <button type="button" class="btn-helpful" data-id="${rev.id}">👍 Helpful (${rev.helpful || 0})</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container);
  }

  bindEvents(container) {
    const filterEl = container.querySelector('#review-event-filter');
    if (filterEl) {
      filterEl.addEventListener('change', (e) => {
        this.filterEventId = e.target.value;
        this.render(container);
      });
    }

    container.querySelectorAll('.star-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedRating = Number(btn.getAttribute('data-val'));
        container.querySelectorAll('.star-btn').forEach(b => {
          b.classList.toggle('active', Number(b.getAttribute('data-val')) <= this.selectedRating);
        });
      });
    });

    const form = container.querySelector('#vams-review-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const select = container.querySelector('#rev-event-select');
        const comment = container.querySelector('#rev-comment').value.trim();
        if (!comment) return;

        const user = store.getCurrentUser ? store.getCurrentUser() : { name: 'Student Attendee', role: 'Student' };
        const selectedOption = select.options[select.selectedIndex];

        const newReview = {
          id: 'rev-' + Date.now(),
          eventId: select.value,
          eventTitle: selectedOption ? selectedOption.getAttribute('data-title') : 'Campus Event',
          author: user.name,
          role: user.department || user.role,
          rating: this.selectedRating,
          comment,
          date: new Date().toISOString().split('T')[0],
          helpful: 0
        };

        const updated = [newReview, ...this.getAll()];
        this.saveAll(updated);

        try {
          fetch('../php-api/reviews.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newReview)
          }).catch(() => {});
        } catch {}

        this.render(container);
      });
    }

    container.querySelectorAll('.btn-helpful').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const updated = this.getAll().map(r => r.id === id ? { ...r, helpful: (r.helpful || 0) + 1 } : r);
        this.saveAll(updated);
        this.render(container);
      });
    });
  }

  escapeHTML(str) {
    return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
}

export const reviewsManager = new ReviewsManager();

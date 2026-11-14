/**
 * VAMS Visual Seating Management Engine (Uncluttered, High-Performance)
 * Provides an intuitive interactive stage seating map, tier-based pricing (VIP, Premium, General),
 * real-time seat selection, auto-allocation ("Best Available"), and seat-to-ticket pass binding.
 */

export class SeatingManager {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.eventId = options.eventId || 'evt_101';
    this.isFreeEvent = options.isFree !== undefined ? options.isFree : false;
    this.basePrice = options.basePrice || (this.isFreeEvent ? 0 : 250);
    this.bookedSeats = options.bookedSeats || ['A2', 'B4', 'C1', 'D5'];
    this.onSelectionChange = options.onSelectionChange || null;

    this.selectedSeats = new Set(options.initialSeats || []);

    // Clean Section Pricing Structure
    this.pricing = {
      vip: this.isFreeEvent ? 0 : Math.round(this.basePrice * 1.5),
      premium: this.isFreeEvent ? 0 : Math.round(this.basePrice * 1.2),
      general: this.isFreeEvent ? 0 : this.basePrice
    };

    this.seatLayout = this.buildSeatGrid();
  }

  buildSeatGrid() {
    const rows = [
      { row: 'A', section: 'vip', name: 'VIP Front Row', price: this.pricing.vip },
      { row: 'B', section: 'vip', name: 'VIP Row 2', price: this.pricing.vip },
      { row: 'C', section: 'premium', name: 'Premium Center', price: this.pricing.premium },
      { row: 'D', section: 'premium', name: 'Premium Row 2', price: this.pricing.premium },
      { row: 'E', section: 'general', name: 'General Gallery', price: this.pricing.general },
      { row: 'F', section: 'general', name: 'General Row 2', price: this.pricing.general }
    ];

    const grid = [];
    rows.forEach(r => {
      for (let num = 1; num <= 12; num++) {
        const id = `${r.row}${num}`;
        const isBooked = this.bookedSeats.includes(id);
        grid.push({
          id,
          row: r.row,
          number: num,
          section: r.section,
          sectionName: r.name,
          price: r.price,
          status: isBooked ? 'booked' : 'available'
        });
      }
    });
    return grid;
  }

  render() {
    if (!this.container) return;

    // Group by row letter
    const groupedByRow = {};
    this.seatLayout.forEach(seat => {
      if (!groupedByRow[seat.row]) groupedByRow[seat.row] = [];
      groupedByRow[seat.row].push(seat);
    });

    const selectedCount = this.selectedSeats.size;
    const selectedTotal = this.getSelectedTotal();
    const selectedList = Array.from(this.selectedSeats);

    let html = `
      <div class="seating-wrapper-clean">
        <!-- Curved Stage Display -->
        <div class="seating-stage-display">
          <span>★ &nbsp; AUDITORIUM MAIN STAGE / SCREEN &nbsp; ★</span>
        </div>

        <!-- Clean Color Legend -->
        <div class="seating-legend">
          <div class="legend-item">
            <div class="legend-seat seat-vip"></div>
            <span>VIP (${this.isFreeEvent ? 'Free' : '₹' + this.pricing.vip})</span>
          </div>
          <div class="legend-item">
            <div class="legend-seat seat-premium"></div>
            <span>Premium (${this.isFreeEvent ? 'Free' : '₹' + this.pricing.premium})</span>
          </div>
          <div class="legend-item">
            <div class="legend-seat seat-general"></div>
            <span>General (${this.isFreeEvent ? 'Free' : '₹' + this.pricing.general})</span>
          </div>
          <div class="legend-item">
            <div class="legend-seat seat-selected"></div>
            <span>Selected</span>
          </div>
          <div class="legend-item">
            <div class="legend-seat seat-booked"></div>
            <span>Booked / Reserved</span>
          </div>
        </div>

        <!-- Seating Grid -->
        <div class="seating-grid-canvas">
    `;

    Object.keys(groupedByRow).forEach(rowLetter => {
      html += `
        <div class="seating-row">
          <div class="row-label">${rowLetter}</div>
      `;

      groupedByRow[rowLetter].forEach(seat => {
        const isSelected = this.selectedSeats.has(seat.id);
        const isBooked = seat.status === 'booked';
        let seatClass = `seat-node seat-${seat.section}`;
        if (isBooked) seatClass += ' seat-booked';
        if (isSelected) seatClass += ' seat-selected';

        html += `
          <button 
            type="button" 
            class="${seatClass}" 
            data-seat-id="${seat.id}"
            title="Seat ${seat.id} • ${seat.sectionName} (${this.isFreeEvent ? 'Free' : '₹' + seat.price})"
            ${isBooked ? 'disabled' : ''}
          >
            ${seat.number}
          </button>
        `;
      });

      html += `
          <div class="row-label">${rowLetter}</div>
        </div>
      `;
    });

    html += `
        </div>

        <!-- Live Selection Footer Bar -->
        <div class="seating-live-bar">
          <div>
            <span style="font-size: 0.78rem; text-transform: uppercase; color: var(--color-text-muted); font-weight: 700;">YOUR SEAT SELECTION:</span>
            <div style="font-size: 1.05rem; font-weight: 800; color: var(--color-primary-navy);">
              ${selectedCount > 0 ? selectedList.join(', ') : '<span style="color: var(--color-text-muted); font-weight: normal;">Click on any seat to select</span>'}
              <span style="font-size: 0.85rem; font-weight: 600; color: var(--color-text-secondary); margin-left: 8px;">
                (${selectedCount} seat${selectedCount === 1 ? '' : 's'})
              </span>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 12px;">
            <button type="button" class="btn btn-outline btn-sm" id="btn-auto-best-seat">
              ⚡ Best Available
            </button>
            <div style="text-align: right;">
              <span style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Total</span>
              <div style="font-size: 1.25rem; font-weight: 800; color: var(--color-secondary-purple);">
                ${this.isFreeEvent ? 'FREE' : '₹' + selectedTotal}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEvents();
  }

  attachEvents() {
    this.container.querySelectorAll('.seat-node:not(.seat-booked)').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const seatId = e.currentTarget.getAttribute('data-seat-id');
        this.toggleSeat(seatId);
      });
    });

    const autoBtn = this.container.querySelector('#btn-auto-best-seat');
    if (autoBtn) {
      autoBtn.addEventListener('click', () => {
        this.autoPickBestSeats(1);
      });
    }
  }

  toggleSeat(seatId) {
    if (this.selectedSeats.has(seatId)) {
      this.selectedSeats.delete(seatId);
    } else {
      this.selectedSeats.add(seatId);
    }
    this.render();
    if (this.onSelectionChange) {
      this.onSelectionChange(Array.from(this.selectedSeats), this.getSelectedTotal(), this.getPrimarySection());
    }
  }

  autoPickBestSeats(count = 1) {
    const available = this.seatLayout.filter(s => s.status === 'available' && !this.selectedSeats.has(s.id));
    this.selectedSeats.clear();
    for (let i = 0; i < Math.min(count, available.length); i++) {
      this.selectedSeats.add(available[i].id);
    }
    this.render();
    if (this.onSelectionChange) {
      this.onSelectionChange(Array.from(this.selectedSeats), this.getSelectedTotal(), this.getPrimarySection());
    }
  }

  getSelectedTotal() {
    if (this.isFreeEvent) return 0;
    let total = 0;
    this.selectedSeats.forEach(id => {
      const seat = this.seatLayout.find(s => s.id === id);
      if (seat) total += seat.price;
    });
    return total;
  }

  getPrimarySection() {
    const first = Array.from(this.selectedSeats)[0];
    if (!first) return 'General Section';
    if (first.startsWith('A') || first.startsWith('B')) return 'VIP Front Stage Tier';
    if (first.startsWith('C') || first.startsWith('D')) return 'Premium Center Tier';
    return 'General Campus Gallery';
  }

  getSelectedSeatsArray() {
    return Array.from(this.selectedSeats);
  }
}

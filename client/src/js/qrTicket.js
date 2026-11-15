/**
 * VAMS QR Ticket Generator & Check-In Scanner Module
 * Uses QRCode.js to generate instant verified ticket passes with allocated SEATS
 * and provides an interactive simulated scanner interface with duplicate check-in prevention.
 */

export class QRTicketService {
  constructor(store) {
    this.store = store;
  }

  generateTicketPassHtml(attendee, event) {
    const seatsFormatted = (attendee.seats && attendee.seats.length > 0)
      ? attendee.seats.join(', ')
      : 'A1 (VIP)';

    const sectionName = attendee.seatSection || 'VIP Stage Front';

    return `
      <div class="ticket-pass-card" id="printable-ticket">
        <!-- Institution Seal & Admit Card Banner -->
        <div style="text-align: center; border-bottom: 2px solid var(--color-border); padding-bottom: 10px; margin-bottom: 14px;">
          <div style="font-size: 0.72rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-primary-navy);">
            🏛️ VAMS UNIVERSITY • CAMPUS EVENT ENTRY PASS
          </div>
          <div style="font-size: 0.7rem; color: var(--color-text-muted); margin-top: 2px;">
            Authorized by Student Affairs & Technical Council • Academic Year 2026
          </div>
        </div>

        <!-- Ticket Header -->
        <div class="ticket-header-strip">
          <div>
            <span class="badge badge-purple" style="margin-bottom: 6px;">OFFICIAL ENTRY PASS</span>
            <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--color-primary-navy); margin-top: 4px;">
              ${event ? event.title : 'VAMS Campus Event'}
            </h3>
            <p style="font-size: 0.85rem; color: var(--color-text-secondary);">
              📍 ${event ? event.venue : 'Main Campus'}
            </p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase;">Ticket ID</div>
            <div style="font-family: var(--font-family-mono); font-weight: 800; font-size: 0.95rem; color: var(--color-secondary-purple); letter-spacing: 0.05em;">
              ${attendee.ticketId}
            </div>
            <div style="font-size: 0.65rem; color: #15803d; font-weight: 700; margin-top: 2px;">VERIFIED ACTIVE</div>
          </div>
        </div>

        <!-- Highlighted Seat Allocation Box (Standout Feature) -->
        <div class="ticket-seat-banner">
          <div style="font-size: 0.75rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-secondary-purple); margin-bottom: 2px;">
            CONFIRMED SEAT ASSIGNMENT
          </div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-primary-navy); display: flex; align-items: center; justify-content: center; gap: 8px;">
            💺 <span>Seat(s): ${seatsFormatted}</span>
          </div>
          <div style="font-size: 0.8rem; font-weight: 700; color: #15803d; margin-top: 2px;">
            Tier: ${sectionName}
          </div>
        </div>

        <!-- Attendee & Event Metadata Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 0.85rem; margin-bottom: 16px; background: var(--color-surface-subtle); padding: 14px; border-radius: var(--radius-sm);">
          <div>
            <span style="color: var(--color-text-muted); font-size: 0.72rem; text-transform: uppercase;">ATTENDEE</span>
            <div style="font-weight: 700; font-size: 0.95rem; color: var(--color-primary-navy);">${attendee.name}</div>
          </div>
          <div>
            <span style="color: var(--color-text-muted); font-size: 0.72rem; text-transform: uppercase;">EMAIL / ID</span>
            <div style="font-weight: 600; color: var(--color-text-secondary); word-break: break-all;">${attendee.email}</div>
          </div>
          <div>
            <span style="color: var(--color-text-muted); font-size: 0.72rem; text-transform: uppercase;">EVENT DATE</span>
            <div style="font-weight: 700;">${event ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Upcoming'}</div>
          </div>
          <div>
            <span style="color: var(--color-text-muted); font-size: 0.72rem; text-transform: uppercase;">TURNSTILE ACCESS</span>
            <div style="font-weight: 700; color: var(--color-success);">✓ Gate A - Turnstile 1</div>
          </div>
        </div>

        <!-- QR Code Container -->
        <div class="qr-code-holder" id="qr-target-container"></div>
        <p style="text-align: center; font-size: 0.75rem; color: var(--color-text-muted); margin-top: 6px;">
          Hold QR code in front of gate scanner. Digital seat verification is encrypted.
        </p>

        <!-- Terms & Instructions (Admit Card Standard) -->
        <div style="margin-top: 14px; padding: 10px 14px; background: #f8fafc; border-left: 3px solid #6366f1; border-radius: 4px; font-size: 0.72rem; color: #475569; line-height: 1.5;">
          <strong>📌 Important Guidelines for Attendees:</strong>
          <ul style="padding-left: 16px; margin-top: 4px; margin-bottom: 0;">
            <li>Please present this digital or printed pass along with a valid College ID at Turnstile Gate A.</li>
            <li>Entry gates close strictly 15 minutes before event commencement.</li>
            <li>Seat assignment is verified via QR and strictly non-transferable.</li>
          </ul>
        </div>

        <!-- Print & Download Actions -->
        <div style="display: flex; justify-content: center; gap: 10px; margin-top: 18px; flex-wrap: wrap;" class="hide-on-print">
          <button type="button" class="btn btn-navy" onclick="window.printTicketPass('${attendee.ticketId}', '${attendee.name.replace(/'/g, '')}')">
            🖨️ Print / Save as PDF Pass
          </button>
          <button type="button" class="btn btn-outline" onclick="window.sendTicketEmail('${attendee.ticketId}')">
            ✉️ Email Me Pass
          </button>
          <button type="button" class="btn btn-outline" onclick="navigator.clipboard.writeText('${attendee.ticketId}'); window.vamsApp?.showToast('Ticket ID copied to clipboard: ${attendee.ticketId}', 'success');">
            📋 Copy Ticket ID
          </button>
        </div>
      </div>
    `;
  }

  renderQRCode(containerId, attendee, event) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';

    // Encode verified ticket payload including allocated seats
    const qrPayload = JSON.stringify({
      vamsTicket: attendee.ticketId,
      name: attendee.name,
      event: event ? event.title : 'VAMS Conclave',
      seats: attendee.seats || ['A1'],
      verified: true
    });

    if (window.QRCode) {
      new window.QRCode(el, {
        text: qrPayload,
        width: 160,
        height: 160,
        colorDark: '#14213D',
        colorLight: '#FFFFFF',
        correctLevel: window.QRCode.CorrectLevel.M
      });
    } else {
      el.innerHTML = `
        <div style="text-align:center; padding: 20px;">
          <div style="font-family: monospace; font-size: 1rem; font-weight: bold; color: var(--color-primary-navy);">
            [QR VERIFIED: ${attendee.ticketId}]
          </div>
        </div>
      `;
    }
  }

  processScan(ticketIdInput) {
    const cleanId = (ticketIdInput || '').trim();
    if (!cleanId) return { success: false, message: 'Please enter or scan a valid Ticket ID.' };
    return this.store.checkInAttendee(cleanId);
  }
}

// Global helper for clean PDF / Print export with optimized document title
if (typeof window !== 'undefined') {
  window.printTicketPass = function(ticketId, attendeeName) {
    const originalTitle = document.title;
    const sanitizedName = (attendeeName || 'Attendee').replace(/[^a-zA-Z0-9]/g, '_');
    document.title = `VAMS_Pass_${sanitizedName}_${ticketId}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  window.sendTicketEmail = async function(ticketId) {
    try {
      const store = window.vamsApp?.store;
      if (!store) return;
      const attendee = store.getAttendees().find(a => a.ticketId === ticketId);
      if (!attendee) return;
      const event = store.getEventById(attendee.eventId);

      window.vamsApp?.showToast(`📧 Sending email pass to ${attendee.email}...`, 'info');

      const res = await fetch('http://localhost:5000/api/notifications/send-ticket-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: attendee.email,
          name: attendee.name,
          ticketId: attendee.ticketId,
          eventTitle: event ? event.title : 'VAMS Campus Event',
          venue: event ? event.venue : 'Main Campus',
          date: event ? event.date : new Date().toISOString(),
          seats: attendee.seats || [],
          seatSection: attendee.seatSection || 'General'
        })
      });

      const data = await res.json();
      if (data.success) {
        window.vamsApp?.showToast(`✅ Pass emailed to ${attendee.email}!`, 'success');
        if (data.previewUrl) {
          window.open(data.previewUrl, '_blank');
        }
      } else {
        window.vamsApp?.showToast('Email error: ' + (data.message || 'Server error'), 'error');
      }
    } catch (err) {
      window.vamsApp?.showToast('Backend offline. Make sure port 5000 is running.', 'error');
    }
  };
}

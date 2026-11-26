const { query } = require('../config/db');
const { syncTableToCsv } = require('../db/csvSync');

const mapBookingRow = (r) => ({
  id: r.id,
  ticketId: r.id,
  eventId: r.event_id,
  userId: r.user_id,
  name: r.attendee_name,
  email: r.attendee_email,
  ticketType: r.ticket_type,
  sectionName: r.section_name,
  seatNumber: r.seat_number,
  totalAmount: Number(r.total_amount || 0),
  paymentStatus: r.payment_status,
  qrPayload: r.qr_payload,
  checkedIn: Boolean(r.checked_in),
  checkinTime: r.checkin_time,
  createdAt: r.created_at
});

// @desc    Get all bookings / attendees (optional ?eventId=...)
// @route   GET /api/bookings
// @access  Public
const getBookings = async (req, res, next) => {
  try {
    const { eventId } = req.query;
    const result = eventId
      ? await query('SELECT * FROM bookings WHERE event_id = $1 ORDER BY created_at DESC', [eventId])
      : await query('SELECT * FROM bookings ORDER BY created_at DESC');

    res.status(200).json({
      success: true,
      count: result.rows.length,
      bookings: result.rows.map(mapBookingRow)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Book seat(s) & issue QR pass (atomic double-booking protection)
// @route   POST /api/bookings
// @access  Public
const createBooking = async (req, res, next) => {
  try {
    const { eventId, name, email, ticketType, sectionName, seats, seatNumber, totalAmount } = req.body;

    if (!eventId || !name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide eventId, attendee name, and email.'
      });
    }

    const seatList = Array.isArray(seats) && seats.length > 0
      ? seats
      : [seatNumber || `GEN-${Math.floor(100 + Math.random() * 900)}`];

    const createdBookings = [];
    const perSeatAmount = seatList.length > 0 ? Math.round((Number(totalAmount) || 0) / seatList.length) : 0;

    for (const seat of seatList) {
      const bookingId = `VAMS-TKT-${Math.floor(100000 + Math.random() * 900000)}`;
      const qrPayload = `VAMS|${eventId}|${seat}|${email.trim().toLowerCase()}|${bookingId}`;

      try {
        const resInsert = await query(
          `INSERT INTO bookings (id, event_id, user_id, attendee_name, attendee_email, ticket_type, section_name, seat_number, total_amount, qr_payload, checked_in)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE)
           RETURNING *`,
          [
            bookingId,
            eventId,
            req.user ? req.user.id : null,
            name.trim(),
            email.trim().toLowerCase(),
            ticketType || 'Standard Pass',
            sectionName || 'General Admission',
            seat,
            perSeatAmount,
            qrPayload
          ]
        );
        createdBookings.push(mapBookingRow(resInsert.rows[0]));
      } catch (err) {
        if (err.code === '23505') {
          return res.status(409).json({
            success: false,
            message: `Seat ${seat} is already booked for this event! Please choose another seat.`
          });
        }
        throw err;
      }
    }

    await query(
      'UPDATE events SET registered_count = registered_count + $1 WHERE id = $2',
      [createdBookings.length, eventId]
    );

    await syncTableToCsv('bookings', query);
    await syncTableToCsv('events', query);

    res.status(201).json({
      success: true,
      message: 'Booking confirmed and saved to PostgreSQL!',
      bookings: createdBookings,
      booking: createdBookings[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify & mark QR ticket checked-in (prevents duplicate scan)
// @route   POST /api/bookings/checkin
// @access  Public
const checkInBooking = async (req, res, next) => {
  try {
    const { ticketId, qrPayload } = req.body;
    const lookup = ticketId || qrPayload;

    if (!lookup) {
      return res.status(400).json({
        success: false,
        message: 'Please provide ticketId or qrPayload.'
      });
    }

    const found = await query(
      'SELECT * FROM bookings WHERE id = $1 OR qr_payload = $1 LIMIT 1',
      [lookup.trim()]
    );

    if (found.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid Ticket ID or QR code. Record not found in PostgreSQL.'
      });
    }

    const booking = found.rows[0];
    if (booking.checked_in) {
      return res.status(409).json({
        success: false,
        alreadyCheckedIn: true,
        message: `Duplicate Check-In Blocked! ${booking.attendee_name} (Seat ${booking.seat_number}) was already checked in.`,
        booking: mapBookingRow(booking)
      });
    }

    const updated = await query(
      'UPDATE bookings SET checked_in = TRUE, checkin_time = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [booking.id]
    );

    await syncTableToCsv('bookings', query);

    res.status(200).json({
      success: true,
      message: `Check-In Successful! Welcome ${booking.attendee_name} (Seat ${booking.seat_number}).`,
      booking: mapBookingRow(updated.rows[0])
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBookings,
  createBooking,
  checkInBooking
};

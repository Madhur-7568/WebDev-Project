const { query } = require('../config/db');
const { syncTableToCsv } = require('../db/csvSync');

const mapEventRow = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  venueId: row.venue_id,
  venue: row.venue,
  date: row.date,
  endDate: row.end_date,
  capacity: Number(row.capacity),
  registeredCount: Number(row.registered_count || 0),
  price: Number(row.price || 0),
  isPaid: Boolean(row.is_paid),
  status: row.status,
  visibility: row.visibility,
  image: row.image,
  organizerId: row.organizer_id,
  organizerName: row.organizer_name,
  tags: Array.isArray(row.tags) ? row.tags : []
});

// @desc    Get all events with optional filters & search
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res, next) => {
  try {
    const { category, search, status } = req.query;
    const conditions = [];
    const params = [];

    if (category && category !== 'All') {
      params.push(category.toLowerCase());
      conditions.push(`LOWER(category) = $${params.length}`);
    }
    if (status) {
      params.push(status.toLowerCase());
      conditions.push(`LOWER(status) = $${params.length}`);
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(`(LOWER(title) LIKE $${params.length} OR LOWER(description) LIKE $${params.length} OR LOWER(venue) LIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(`SELECT * FROM events ${whereClause} ORDER BY date ASC`, params);
    const events = result.rows.map(mapEventRow);

    res.status(200).json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Event not found with ID ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      event: mapEventRow(result.rows[0])
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new event
// @route   POST /api/events
// @access  Public / Demo SaaS & Organizer
const createEvent = async (req, res, next) => {
  try {
    const { id, title, description, category, venueId, venue, date, endDate, capacity, price, isPaid, status, visibility, tags, image, organizerName } = req.body;

    if (!title || !category || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide required fields: title, category, and date.'
      });
    }

    const eventId = id || `evt_${Date.now()}`;
    const parsedPrice = Number(price) || 0;
    const parsedTags = Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map(t => t.trim()) : []);

    const result = await query(
      `INSERT INTO events (id, title, description, category, venue_id, venue, date, end_date, capacity, registered_count, price, is_paid, status, visibility, image, organizer_id, organizer_name, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10, $11, $12, $13, $14, $15, $16, $17::jsonb)
       RETURNING *`,
      [
        eventId,
        title,
        description || '',
        category,
        venueId || null,
        venue || 'Campus Hall',
        date,
        endDate || date,
        Number(capacity) || 100,
        parsedPrice,
        isPaid !== undefined ? Boolean(isPaid) : parsedPrice > 0,
        status || 'published',
        visibility || 'public',
        image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
        req.user ? req.user.id : 'usr_org_1',
        organizerName || (req.user ? req.user.name : 'Technical Society'),
        JSON.stringify(parsedTags)
      ]
    );

    await syncTableToCsv('events', query);

    res.status(201).json({
      success: true,
      message: 'Event created and saved to PostgreSQL!',
      event: mapEventRow(result.rows[0])
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing event
// @route   PUT /api/events/:id
// @access  Public / Demo SaaS & Organizer
const updateEvent = async (req, res, next) => {
  try {
    const existingRes = await query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Event not found with ID ${req.params.id}`
      });
    }

    const curr = existingRes.rows[0];
    const b = req.body;
    const parsedPrice = b.price !== undefined ? Number(b.price) : Number(curr.price);
    const parsedTags = b.tags !== undefined
      ? (Array.isArray(b.tags) ? b.tags : String(b.tags).split(',').map(t => t.trim()))
      : curr.tags;

    const result = await query(
      `UPDATE events SET
        title = $1,
        description = $2,
        category = $3,
        venue_id = $4,
        venue = $5,
        date = $6,
        end_date = $7,
        capacity = $8,
        price = $9,
        is_paid = $10,
        status = $11,
        image = $12,
        organizer_name = $13,
        tags = $14::jsonb
       WHERE id = $15
       RETURNING *`,
      [
        b.title ?? curr.title,
        b.description ?? curr.description,
        b.category ?? curr.category,
        b.venueId !== undefined ? b.venueId : curr.venue_id,
        b.venue ?? curr.venue,
        b.date ?? curr.date,
        b.endDate ?? curr.end_date,
        b.capacity !== undefined ? Number(b.capacity) : curr.capacity,
        parsedPrice,
        b.isPaid !== undefined ? Boolean(b.isPaid) : parsedPrice > 0,
        b.status ?? curr.status,
        b.image ?? curr.image,
        b.organizerName ?? curr.organizer_name,
        JSON.stringify(parsedTags || []),
        req.params.id
      ]
    );

    await syncTableToCsv('events', query);

    res.status(200).json({
      success: true,
      message: 'Event updated in PostgreSQL!',
      event: mapEventRow(result.rows[0])
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Public / Demo SaaS & Organizer
const deleteEvent = async (req, res, next) => {
  try {
    const result = await query('DELETE FROM events WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Event not found with ID ${req.params.id}`
      });
    }

    await syncTableToCsv('events', query);

    res.status(200).json({
      success: true,
      message: 'Event deleted from PostgreSQL.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get platform stats summary
// @route   GET /api/events/stats/overview
// @access  Public
const getStats = async (req, res, next) => {
  try {
    const eventStats = await query('SELECT COUNT(*)::int AS total_events, COALESCE(SUM(registered_count), 0)::int AS total_rsvps FROM events');
    const bookingStats = await query('SELECT COUNT(*)::int AS total_bookings, COALESCE(SUM(total_amount), 0)::numeric AS total_revenue FROM bookings');

    res.status(200).json({
      success: true,
      stats: {
        totalEvents: eventStats.rows[0].total_events,
        totalRsvps: eventStats.rows[0].total_rsvps,
        totalBookings: bookingStats.rows[0].total_bookings,
        totalRevenue: Number(bookingStats.rows[0].total_revenue)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getStats
};

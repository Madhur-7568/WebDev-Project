const dataStore = require('../models/dataStore');

// @desc    Get all events with optional filters & search
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res, next) => {
  try {
    const { category, search, status } = req.query;
    const events = dataStore.getAllEvents({ category, search, status });

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
    const event = dataStore.findEventById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: `Event not found with ID ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new event
// @route   POST /api/events
// @access  Private (organizer, admin)
const createEvent = async (req, res, next) => {
  try {
    const { title, description, category, venue, date, endDate, capacity, tags, image } = req.body;

    if (!title || !description || !category || !venue || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, category, venue, and date.'
      });
    }

    const newEvent = dataStore.createEvent({
      title,
      description,
      category,
      venue,
      date: new Date(date).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : null,
      capacity: Number(capacity) || 100,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
      image: image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60',
      organizerId: req.user.id,
      organizerName: req.user.name
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully!',
      event: newEvent
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing event
// @route   PUT /api/events/:id
// @access  Private (organizer who created it, or admin)
const updateEvent = async (req, res, next) => {
  try {
    const event = dataStore.findEventById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: `Event not found with ID ${req.params.id}`
      });
    }

    // Authorization check
    if (event.organizerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this event.'
      });
    }

    const updated = dataStore.updateEvent(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Event updated successfully!',
      event: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private (organizer who created it, or admin)
const deleteEvent = async (req, res, next) => {
  try {
    const event = dataStore.findEventById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: `Event not found with ID ${req.params.id}`
      });
    }

    if (event.organizerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event.'
      });
    }

    dataStore.deleteEvent(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register / RSVP for an event
// @route   POST /api/events/:id/register
// @access  Private (logged-in user)
const registerForEvent = async (req, res, next) => {
  try {
    const result = dataStore.registerUserForEvent(req.params.id, req.user.id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      success: true,
      message: result.message,
      ticketId: result.ticketId,
      event: result.event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel RSVP for an event
// @route   DELETE /api/events/:id/register
// @access  Private (logged-in user)
const cancelRegistration = async (req, res, next) => {
  try {
    const result = dataStore.cancelUserRegistration(req.params.id, req.user.id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get platform stats summary
// @route   GET /api/events/stats/overview
// @access  Public
const getStats = async (req, res, next) => {
  try {
    const stats = dataStore.getStats();
    res.status(200).json({
      success: true,
      stats
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
  registerForEvent,
  cancelRegistration,
  getStats
};


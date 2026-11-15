const express = require('express');
const router = express.Router();
const { sendTicketConfirmationEmail } = require('../services/emailService');

// @desc    Send ticket confirmation email to attendee
// @route   POST /api/notifications/send-ticket-email
// @access  Public
router.post('/send-ticket-email', async (req, res, next) => {
  try {
    const { email, name, ticketId, eventTitle, venue, date, seats, seatSection } = req.body;

    if (!email || !ticketId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email and ticketId are required.'
      });
    }

    const result = await sendTicketConfirmationEmail({
      email,
      name: name || 'Student',
      ticketId,
      eventTitle: eventTitle || 'Campus Event',
      venue: venue || 'Auditorium',
      date: date || new Date().toISOString(),
      seats: seats || [],
      seatSection: seatSection || 'General'
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send confirmation email',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: `Confirmation email dispatched to ${email}`,
      previewUrl: result.previewUrl
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Test email service health
// @route   GET /api/notifications/test
// @access  Public
router.get('/test', async (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'VAMS Notification & Nodemailer Engine',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

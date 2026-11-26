const express = require('express');
const router = express.Router();
const { getBookings, createBooking, checkInBooking } = require('../controllers/bookingController');

router.get('/', getBookings);
router.post('/', createBooking);
router.post('/checkin', checkInBooking);

module.exports = router;

const { query } = require('../config/db');

// @desc    Get all campus venues
// @route   GET /api/venues
// @access  Public
const getVenues = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM venues ORDER BY id ASC');
    const venues = result.rows.map(v => ({
      id: v.id,
      name: v.name,
      description: v.description,
      location: v.location,
      capacity: Number(v.capacity),
      hourlyRate: Number(v.hourly_rate),
      facilities: Array.isArray(v.facilities) ? v.facilities : [],
      image: v.image,
      status: v.status,
      availability: v.availability || {}
    }));

    res.status(200).json({
      success: true,
      count: venues.length,
      venues
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getVenues };

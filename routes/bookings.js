const express = require('express');
const router = express.Router();
const auth = require('../middleware/authmiddleware');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Worker = require('../models/Worker');

// Create a new booking (client only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'client') {
      return res.status(403).json({ error: 'Only clients can create bookings' });
    }

    const { serviceId, date, note } = req.body;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    if (!service.isAvailable) {
      return res.status(400).json({ error: 'Service is not available' });
    }

    const booking = new Booking({
      service: service._id,
      client: req.user._id,
      worker: service.worker,
      date: new Date(date),
      note
    });

    await booking.save();

    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get client bookings
router.get('/client', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'client') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const bookings = await Booking.find({ client: req.user._id })
      .populate({
        path: 'service',
        select: 'title description price serviceType'
      })
      .populate({
        path: 'worker',
        select: 'serviceType rating',
        populate: {
          path: 'user',
          select: 'name phone'
        }
      })
      .sort({ date: -1 });

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get worker bookings
router.get('/worker', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'worker') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const worker = await Worker.findOne({ user: req.user._id });
    if (!worker) {
      return res.status(404).json({ error: 'Worker profile not found' });
    }

    const bookings = await Booking.find({ worker: worker._id })
      .populate({
        path: 'service',
        select: 'title description price serviceType'
      })
      .populate({
        path: 'client',
        select: 'name phone location'
      })
      .sort({ date: -1 });

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update booking status (worker only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'worker') {
      return res.status(403).json({ error: 'Only workers can update booking status' });
    }

    const { status } = req.body;
    if (!['confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const worker = await Worker.findOne({ user: req.user._id });
    if (!worker) {
      return res.status(404).json({ error: 'Worker profile not found' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if this worker owns the booking
    if (booking.worker.toString() !== worker._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this booking' });
    }

    booking.status = status;
    await booking.save();

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Rate completed booking (client only)
router.post('/:id/rate', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'client') {
      return res.status(403).json({ error: 'Only clients can rate bookings' });
    }

    const { score, comment } = req.body;
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if this client owns the booking
    if (booking.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to rate this booking' });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Can only rate completed bookings' });
    }

    // Check if already rated
    if (booking.rating && booking.rating.score) {
      return res.status(400).json({ error: 'Booking already rated' });
    }

    booking.rating = { score, comment };
    await booking.save();

    // Update worker rating
    const worker = await Worker.findById(booking.worker);
    if (worker) {
      const newTotal = worker.totalRatings + 1;
      const newRating = ((worker.rating * worker.totalRatings) + score) / newTotal;
      
      worker.rating = parseFloat(newRating.toFixed(2));
      worker.totalRatings = newTotal;
      await worker.save();
    }

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
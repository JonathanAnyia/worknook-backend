const express = require('express');
const router = express.Router();
const auth = require('../middleware/authmiddleware');
const Worker = require('../models/Worker');

// Rate a worker
router.post('/', auth, async (req, res) => {
  try {
    const { workerId, rating } = req.body;

    if (!workerId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid rating input' });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // Calculate new average rating
    const newTotalRatings = worker.totalRatings + 1;
    const newRating = ((worker.rating * worker.totalRatings) + rating) / newTotalRatings;

    worker.rating = newRating;
    worker.totalRatings = newTotalRatings;

    await worker.save();

    res.json({ message: 'Rating submitted successfully', newRating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

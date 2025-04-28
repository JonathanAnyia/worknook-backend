const express = require('express');
const router = express.Router();
const auth = require('../middleware/authmiddleware');
const User = require('../models/User');
const Worker = require('../models/Worker');

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    let userData = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      userType: req.user.userType
    };

    if (req.user.userType === 'client') {
      userData.location = req.user.location;
    } else if (req.user.userType === 'worker') {
      userData.address = req.user.address;
      
      // Get worker profile
      const worker = await Worker.findOne({ user: req.user._id });
      if (worker) {
        userData.worker = {
          id: worker._id,
          serviceType: worker.serviceType,
          experience: worker.experience,
          bio: worker.bio,
          isVerified: worker.isVerified,
          rating: worker.rating
        };
      }
    }

    res.json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/me', auth, async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    // Update allowed fields
    if (name) req.user.name = name;
    if (phone) req.user.phone = phone;

    if (req.user.userType === 'client' && req.body.location) {
      req.user.location = req.body.location;
    }

    if (req.user.userType === 'worker' && req.body.address) {
      req.user.address = req.body.address;
    }

    await req.user.save();

    // If worker, update worker profile
    if (req.user.userType === 'worker') {
      const { serviceType, bio, experience } = req.body;
      
      if (serviceType || bio || experience) {
        const worker = await Worker.findOne({ user: req.user._id });
        
        if (worker) {
          if (serviceType) worker.serviceType = serviceType;
          if (bio) worker.bio = bio;
          if (experience) worker.experience = experience;
          
          await worker.save();
        }
      }
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all workers (for clients)
router.get('/workers', async (req, res) => {
  try {
    const { serviceType } = req.query;
    
    let query = {};
    if (serviceType) {
      query.serviceType = serviceType;
    }

    const workers = await Worker.find(query)
      .populate({
        path: 'user',
        select: 'name phone address'
      });

    const formattedWorkers = workers.map(worker => ({
      id: worker._id,
      name: worker.user.name,
      phone: worker.user.phone,
      address: worker.user.address,
      serviceType: worker.serviceType,
      experience: worker.experience,
      bio: worker.bio,
      isVerified: worker.isVerified,
      rating: worker.rating,
      totalRatings: worker.totalRatings
    }));

    res.json(formattedWorkers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get worker by ID
router.get('/workers/:id', async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id)
      .populate({
        path: 'user',
        select: 'name phone address'
      });

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    res.json({
      id: worker._id,
      name: worker.user.name,
      phone: worker.user.phone,
      address: worker.user.address,
      serviceType: worker.serviceType,
      experience: worker.experience,
      bio: worker.bio,
      isVerified: worker.isVerified,
      rating: worker.rating,
      totalRatings: worker.totalRatings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
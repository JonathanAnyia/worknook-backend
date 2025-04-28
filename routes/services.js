const express = require('express');
const router = express.Router();
const auth = require('../middleware/authmiddleware');
const Service = require('../models/Service');
const Worker = require('../models/Worker');

// Create a new service (worker only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'worker') {
      return res.status(403).json({ error: 'Only workers can create services' });
    }

    const worker = await Worker.findOne({ user: req.user._id });
    if (!worker) {
      return res.status(404).json({ error: 'Worker profile not found' });
    }

    const { title, description, price } = req.body;

    const service = new Service({
      worker: worker._id,
      title,
      description,
      serviceType: worker.serviceType,
      price
    });

    await service.save();

    res.status(201).json(service);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all services
router.get('/', async (req, res) => {
  try {
    const { serviceType } = req.query;
    
    let query = {};
    if (serviceType) {
      query.serviceType = serviceType;
    }

    const services = await Service.find(query)
      .populate({
        path: 'worker',
        select: 'serviceType experience rating',
        populate: {
          path: 'user',
          select: 'name'
        }
      });

    res.json(services);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate({
        path: 'worker',
        select: 'serviceType experience rating',
        populate: {
          path: 'user',
          select: 'name phone address'
        }
      });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update service (worker only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'worker') {
      return res.status(403).json({ error: 'Only workers can update services' });
    }

    const worker = await Worker.findOne({ user: req.user._id });
    if (!worker) {
      return res.status(404).json({ error: 'Worker profile not found' });
    }

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Check if this worker owns the service
    if (service.worker.toString() !== worker._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this service' });
    }

    const { title, description, price, isAvailable } = req.body;

    if (title) service.title = title;
    if (description) service.description = description;
    if (price) service.price = price;
    if (isAvailable !== undefined) service.isAvailable = isAvailable;

    await service.save();

    res.json(service);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete service (worker only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'worker') {
      return res.status(403).json({ error: 'Only workers can delete services' });
    }

    const worker = await Worker.findOne({ user: req.user._id });
    if (!worker) {
      return res.status(404).json({ error: 'Worker profile not found' });
    }

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Check if this worker owns the service
    if (service.worker.toString() !== worker._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this service' });
    }

    await service.remove();

    res.json({ message: 'Service removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
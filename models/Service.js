const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    enum: ['cleaning', 'plumbing', 'carpentry','gardening'],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Service', serviceSchema);

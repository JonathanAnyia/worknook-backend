const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceType: {
    type: String,
    enum: ['cleaning', 'plumbing', 'carpentry','gardening'],
    required: true
  },
  experience: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    required: true
  },
  idDocument: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Worker', workerSchema);

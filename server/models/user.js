const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  locationHistory: {
    type: [
      {
        latitude: Number,
        longitude: Number,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;

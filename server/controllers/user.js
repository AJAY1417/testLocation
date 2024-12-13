const User = require('../models/user');
const { success, error } = require('../utils/apiResponse');

const loginUser = async (req, res) => {
  try {
    const { email, password, latitude, longitude } = req.body;

    // Placeholder for password check - in real app, hash and compare passwords
    if (!email || !password) {
      return error(res, 'Email and password are required', 400);
    }

    const user = new User({
      email,
      latitude,
      longitude,
    });

    await user.save();

    success(res, 'User logged in successfully', {
      email: user.email,
      latitude: user.latitude,
      longitude: user.longitude,
    });
  } catch (err) {
    console.error(err);
    error(res, 'Error logging in user', 500);
  }
};

const updateLocation = async (req, res) => {
  try {
    const { email, latitude, longitude } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return error(res, 'User not found', 404);
    }

    user.locationHistory.push({ latitude, longitude });

    if (user.locationHistory.length > 10) {
      user.locationHistory.shift();
    }

    user.latitude = latitude;
    user.longitude = longitude;

    await user.save();

    success(res, 'Location updated successfully', {
      latitude: user.latitude,
      longitude: user.longitude,
      locationHistory: user.locationHistory,
    });
  } catch (err) {
    console.error(err);
    error(res, 'Error updating location', 500);
  }
};

module.exports = { loginUser, updateLocation };

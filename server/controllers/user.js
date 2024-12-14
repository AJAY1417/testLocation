const User = require('../models/user');
const { success, error } = require('../utils/apiResponse');

const loginUser = async (req, res, next) => {
  try {
    const { email, latitude, longitude } = req.body;
    console.log('Received login data:', { email, latitude, longitude });

    if (!email) {
      throw new Error('Email is required');
    }

    if (!latitude || !longitude) {
      throw new Error('Location data is required');
    }

    // Try to find existing user
    let user = await User.findOne({ email });
    console.log('Existing user:', user);

    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        email,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        locationHistory: [{
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        }]
      });
      console.log('Creating new user:', user);
    } else {
      // Update location for existing user
      user.latitude = parseFloat(latitude);
      user.longitude = parseFloat(longitude);
      user.locationHistory.push({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      });
      console.log('Updating user location:', user);
    }
    
    await user.save();
    console.log('Saved user:', user);

    // Send back the redirect URL with the response
    return success(res, 'Login successful', {
      redirectUrl: `/dashboard?email=${encodeURIComponent(email)}`,
      user: {
        email: user.email,
        latitude: user.latitude,
        longitude: user.longitude
      }
    });
  } catch (err) {
    next(err);
  }
};

const updateLocation = async (req, res, next) => {
  try {
    const { email, latitude, longitude } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    user.latitude = parseFloat(latitude);
    user.longitude = parseFloat(longitude);
    user.locationHistory.push({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    });

    if (user.locationHistory.length > 10) {
      user.locationHistory.shift();
    }

    await user.save();
    return success(res, 'Location updated successfully', {
      latitude: user.latitude,
      longitude: user.longitude,
      locationHistory: user.locationHistory,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { loginUser, updateLocation };

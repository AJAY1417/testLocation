const { error } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Handle MongoDB errors
    if (err.name === 'MongoError' || err.name === 'MongoServerError') {
        return error(res, 'Database error occurred', 500);
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
        return error(res, err.message, 400);
    }

    // Handle location errors
    if (err.message.includes('location')) {
        return error(res, 'Error processing location data', 400);
    }

    // Default error
    return error(res, err.message || 'Something went wrong', err.status || 500);
};

module.exports = errorHandler;

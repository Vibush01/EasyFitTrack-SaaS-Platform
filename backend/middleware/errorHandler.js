const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';

    // Mongoose bad ObjectId (CastError)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue)[0];
        message = `Duplicate value for ${field}. Please use another value.`;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        const errors = Object.values(err.errors).map((val) => val.message);
        message = `Validation failed: ${errors.join(', ')}`;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    // Log error in development
    if (process.env.NODE_ENV !== 'production') {
        logger.error('Error:', err);
    }

    res.status(statusCode).json({
        message,
        ...(process.env.NODE_ENV !== 'production' && { error: err.message, stack: err.stack }),
    });
};

module.exports = errorHandler;

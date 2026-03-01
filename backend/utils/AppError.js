class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message = 'Bad request') {
        return new AppError(message, 400);
    }

    static unauthorized(message = 'Unauthorized') {
        return new AppError(message, 401);
    }

    static forbidden(message = 'Access denied') {
        return new AppError(message, 403);
    }

    static notFound(message = 'Resource not found') {
        return new AppError(message, 404);
    }
}

module.exports = AppError;

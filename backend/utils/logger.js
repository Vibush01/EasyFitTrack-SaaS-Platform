const { createLogger, format, transports } = require('winston');
const path = require('path');

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.json(),
    ),
    defaultMeta: { service: 'easyfittrack-api' },
    transports: [
        // Write errors to error.log
        new transports.File({
            filename: path.join(__dirname, '../logs/error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Write all logs to combined.log
        new transports.File({
            filename: path.join(__dirname, '../logs/combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
});

// In development, also log to console with colors
if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.timestamp({ format: 'HH:mm:ss' }),
                format.printf(({ timestamp, level, message, service: _service, ...meta }) => {
                    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                    return `${timestamp} [${level}]: ${message}${metaStr}`;
                }),
            ),
        }),
    );
}

module.exports = logger;

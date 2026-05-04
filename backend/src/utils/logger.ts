import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

// Define custom log format
const myFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
});

export const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        myFormat
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ],
});

logger.add(new winston.transports.Console({
    format: combine(
        colorize(),
        myFormat
    )
}));

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const globalErrorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Lütfen daha sonra tekrar deneyin.';

    // Log the error for internal tracking (only if not operational or if in development)
    if (process.env.NODE_ENV !== 'production' || !err.isOperational) {
        logger.error(`[ERROR] ${err.name}: ${err.message}`, { stack: err.stack });
    }

    // Handle JWT Errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Geçersiz oturum anahtarı. Lütfen tekrar giriş yapın.';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Oturum süreniz doldu. Lütfen güvenlik için tekrar giriş yapın.';
    }

    // Handle Prisma specific errors
    if (err.code === 'P2002') {
        statusCode = 400;
        message = 'Girdiğiniz bilgilerden bazıları (örn. e-posta) sistemde zaten kullanımda.';
    }
    if (err.code === 'P2025') {
        statusCode = 404;
        message = 'İşlem yapmak istediğiniz kayıt bulunamadı.';
    }

    const responseBody: any = { error: message };

    // Validation Errors (e.g., Zod, Joi, or custom ValidationError)
    if (err.name === 'ValidationError' && err.errors) {
        statusCode = 400;
        responseBody.validationErrors = err.errors;
    }

    if (process.env.NODE_ENV === 'development') {
        responseBody.stack = err.stack;
    }

    res.status(statusCode).json(responseBody);
};

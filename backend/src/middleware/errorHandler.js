import { ApiError } from '../utils/ApiError.js';

export const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const isOperational = err instanceof ApiError;

  if (!isOperational) {
    console.error(err);
  }

  res.status(statusCode).json({
    message: isOperational ? err.message : 'Internal server error',
    details: err.details,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

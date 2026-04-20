import { logger } from '../lib/logger.js';

export function errorHandlerMiddleware(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const correlationId = req.context?.correlationId;

  logger.error('http.request.failed', {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    correlationId,
    err
  });

  res.status(statusCode).json({
    error: {
      code: statusCode,
      message: statusCode >= 500 ? 'Internal server error' : err.message,
      correlationId,
      details: err.details || undefined
    }
  });
}

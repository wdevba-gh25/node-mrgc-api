import morgan from 'morgan';
import { logger } from '../lib/logger.js';

morgan.token('correlation-id', (req) => req.context?.correlationId || '-');

export const httpLoggerMiddleware = morgan(function format(tokens, req, res) {
  const message = {
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: Number(tokens.status(req, res)),
    responseTimeMs: Number(tokens['response-time'](req, res)),
    contentLength: tokens.res(req, res, 'content-length'),
    correlationId: tokens['correlation-id'](req, res)
  };

  logger.info('http.request.completed', message);
  return null;
}, {
  stream: {
    write: () => {}
  }
});

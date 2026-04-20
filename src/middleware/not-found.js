import { HttpError } from '../lib/http-error.js';

export function notFoundMiddleware(req, _res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

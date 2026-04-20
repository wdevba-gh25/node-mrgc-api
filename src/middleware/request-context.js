import crypto from 'node:crypto';

export function requestContextMiddleware(req, res, next) {
  const correlationId = req.get('x-correlation-id') || crypto.randomUUID();
  req.context = {
    correlationId,
    startedAt: Date.now()
  };

  res.setHeader('x-correlation-id', correlationId);
  next();
}

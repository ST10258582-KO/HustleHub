import logger from '../utils/logger.js';

export function notFound(req, res) {
  res.status(404).json({ error: 'The requested resource does not exist.' });
}

export function errorHandler(err, req, res, _next) {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    requestId: req.id,
  });
  res.status(err.status || 500).json({ error: 'An unexpected error occurred.' });
}

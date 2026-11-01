import { randomUUID } from 'crypto';

/**
 * Assigns a unique UUID to every request for end-to-end log correlation.
 * The ID is returned in the X-Request-Id response header so clients can
 * reference it when reporting errors.
 */
export function requestId(req, res, next) {
  const id = randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}

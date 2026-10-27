import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

export function authenticate(req, res, next) {
  const header = req.get('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'hustlehub-plus' });
    next();
  } catch (err) {
    logger.warn('JWT verification failed', { reason: err.message, requestId: req.id, ip: req.ip });
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

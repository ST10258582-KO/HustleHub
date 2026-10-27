/**
 * Role-Based Access Control middleware.
 * Usage: allowRoles('admin') or allowRoles('freelancer', 'admin')
 */
export const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'You are not authorised to perform this action.' });
  }
  next();
};

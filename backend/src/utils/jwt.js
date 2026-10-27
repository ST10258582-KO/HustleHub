import jwt from 'jsonwebtoken';

export function createToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h', issuer: 'hustlehub-plus' }
  );
}

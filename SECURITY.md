# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |

## Reporting a Vulnerability

Please open a private GitHub issue or email the maintainer directly. Do not disclose security vulnerabilities publicly until a fix is in place.

## Security Features

- HTTPS with TLS (self-signed for development)
- JWT authentication with issuer validation and 1h expiry
- bcrypt password hashing (work factor 12)
- Account lockout after 5 failed attempts (15 min ban)
- Request ID middleware for end-to-end log tracing
- Helmet HTTP security headers with strict CSP
- Rate limiting: 200/15min global, 20/15min auth, 30/15min bookings
- NoSQL injection prevention via express-mongo-sanitize
- XSS sanitisation on user-generated gig content
- RBAC: client / freelancer / admin role enforcement
- Optional cloud logging via Logtail/Better Stack

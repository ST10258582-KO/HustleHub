# Contributing to HustleHub+

## Development Setup

```bash
# Backend
cd backend && npm install
npm start       # starts HTTPS server on port 3443

# Frontend  
cd frontend && npm install
npm run dev     # starts Vite dev server on port 5173
```

## Running Tests

```bash
cd backend && npm test          # Jest 11 tests
cd frontend && npm test -- --run # Vitest 4 tests
npx newman run postman/HustleHub-Part2.postman_collection.json --insecure
```

## Code Style

- Backend: ESLint with `eslint-plugin-security` (zero warnings policy)
- Commits: imperative mood, no colons, no AI watermarks
- Branches: feature/*, fix/*, chore/*

## Security Guidelines

- Never commit `.env` files or private keys
- Validate all user input with express-validator
- Use `allowRoles()` on all protected routes
- Run `npm audit --audit-level=high` before merging

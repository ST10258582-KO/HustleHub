import 'dotenv/config';
import https from 'https';
import fs from 'fs';
import app from './app.js';
import { connectDatabase } from './db.js';
import { config } from './config.js';

const port = config.port;
const keyPath = new URL('../certs/server.key', import.meta.url);
const certPath = new URL('../certs/server.crt', import.meta.url);

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters.');
}

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) { // eslint-disable-line security/detect-non-literal-fs-filename
  throw new Error('Local SSL certificate missing. Generate backend/certs/server.key and server.crt before starting.');
}

if (process.env.USE_MONGO === 'true') {
  await connectDatabase();
} else {
  console.log('Using file-based user storage (Part 1 mode).');
}
https.createServer({ key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }, app) // eslint-disable-line security/detect-non-literal-fs-filename
  .listen(port, () => console.log(`HustleHub+ API running at https://localhost:${port}`));

import winston from 'winston';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const logsDir = join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const { combine, timestamp, errors, json } = winston.format;

const transports = [
  new winston.transports.File({ filename: join(logsDir, 'error.log'), level: 'error' }),
  new winston.transports.File({ filename: join(logsDir, 'combined.log') }),
];

if (process.env.NODE_ENV !== 'test') {
  transports.push(new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  }));
}

if (process.env.LOGTAIL_TOKEN) {
  try {
    const { Logtail } = await import('@logtail/node');
    const { LogtailTransport } = await import('@logtail/winston');
    const logtail = new Logtail(process.env.LOGTAIL_TOKEN);
    transports.push(new LogtailTransport(logtail));
  } catch (_e) {
    // Logtail packages unavailable, continuing without cloud logging
  }
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json(),
  ),
  transports,
});

export const morganStream = { write: (message) => logger.http(message.trim()) };
export default logger;

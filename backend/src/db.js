import mongoose from 'mongoose';
import { config } from './config.js';
import logger from './utils/logger.js';

export async function connectDatabase() {
  await mongoose.connect(config.mongoUri);
  logger.info('MongoDB connected', { uri: config.mongoUri.replace(/\/\/.*@/, '//***@') });
}

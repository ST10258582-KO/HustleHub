import mongoose from 'mongoose';
import User from '../models/User.js';
import Gig from '../models/Gig.js';
import Booking from '../models/Booking.js';
import logger from '../utils/logger.js';

export async function listUsers(_req, res) {
  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
  res.json({ users, count: users.length });
}

export async function listAllGigs(_req, res) {
  const gigs = await Gig.find().sort({ createdAt: -1 }).lean();
  res.json({ gigs, count: gigs.length });
}

export async function listAllBookings(_req, res) {
  const bookings = await Booking.find().sort({ createdAt: -1 }).lean();
  res.json({ bookings, count: bookings.length });
}

export async function deleteUser(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid user ID.' });
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  logger.info('Admin deleted user', { adminId: req.user.sub, deletedUserId: req.params.id });
  res.json({ message: 'User deleted.' });
}

export async function forceDeleteGig(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid gig ID.' });
  }
  const gig = await Gig.findByIdAndDelete(req.params.id);
  if (!gig) return res.status(404).json({ error: 'Gig not found.' });
  logger.info('Admin force-deleted gig', { adminId: req.user.sub, deletedGigId: req.params.id });
  res.json({ message: 'Gig permanently removed.' });
}

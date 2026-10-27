import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
// Note: atomic transactions require a MongoDB replica set (production).
// Sequential creates are used here for standalone local development.
import Gig from '../models/Gig.js';
import Booking from '../models/Booking.js';
import Transaction from '../models/Transaction.js';
import logger from '../utils/logger.js';

export async function createBooking(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty() || !mongoose.isValidObjectId(req.body.gigId)) {
    return res.status(400).json({ error: 'Invalid gig ID.' });
  }

  const gig = await Gig.findOne({ _id: req.body.gigId, active: true });
  if (!gig) return res.status(404).json({ error: 'Gig not found.' });
  if (gig.freelancerId === req.user.sub) return res.status(400).json({ error: 'A freelancer cannot book their own gig.' });

  try {
    const booking = await Booking.create({
      gigId: gig._id,
      clientId: req.user.sub,
      freelancerId: gig.freelancerId,
      amount: gig.price,
    });

    const transaction = await Transaction.create({
      bookingId: booking._id,
      clientId: req.user.sub,
      freelancerId: gig.freelancerId,
      amount: gig.price,
    });

    logger.info('Booking created', {
      bookingId: booking._id.toString(),
      clientId: req.user.sub,
      freelancerId: gig.freelancerId,
      amount: gig.price,
      requestId: req.id,
    });

    res.status(201).json({ message: 'Booking confirmed. Payment is simulated.', booking, transaction });
  } catch (err) {
    logger.error('Booking creation failed', { message: err.message, clientId: req.user.sub, gigId: req.body.gigId, requestId: req.id });
    res.status(500).json({ error: 'Booking could not be completed. No charge was applied.' });
  }
}

export async function myBookings(req, res) {
  const bookings = await Booking.find({
    $or: [{ clientId: req.user.sub }, { freelancerId: req.user.sub }],
  }).lean();
  res.json({ bookings });
}

export async function myFinance(req, res) {
  const transactions = await Transaction.find({ freelancerId: req.user.sub }).lean();
  const totalIncome = transactions.reduce((sum, t) => sum + t.amount, 0);
  const estimatedTax = totalIncome * 0.20;
  res.json({
    transactionCount: transactions.length,
    totalIncome,
    estimatedTax,
    netAfterEstimatedTax: totalIncome - estimatedTax,
    transactions,
  });
}

import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import xss from 'xss';
import Gig from '../models/Gig.js';
import logger from '../utils/logger.js';

const xssOptions = { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script', 'style'] };

export async function listGigs(_req, res) {
  const gigs = await Gig.find({ active: true }).sort({ createdAt: -1 }).lean();
  res.json({ gigs });
}

export async function getGig(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid gig ID.' });
  }
  const gig = await Gig.findOne({ _id: req.params.id, active: true }).lean().catch(() => null);
  if (!gig) return res.status(404).json({ error: 'Gig not found.' });
  res.json({ gig });
}

export async function createGig(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid input.', details: errors.array().map(e => e.msg) });

  const cleanTitle = xss(req.body.title, xssOptions);
  const cleanDescription = xss(req.body.description, xssOptions);

  if (!cleanTitle) return res.status(400).json({ error: 'Content contains disallowed markup.' });
  if (!cleanDescription) return res.status(400).json({ error: 'Content contains disallowed markup.' });

  const gig = await Gig.create({
    freelancerId: req.user.sub,
    title: cleanTitle,
    description: cleanDescription,
    price: Number(req.body.price),
  });

  logger.info('Gig created', { gigId: gig._id.toString(), freelancerId: req.user.sub, requestId: req.id });
  res.status(201).json({ gig });
}

export async function updateGig(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid input.', details: errors.array().map(e => e.msg) });

  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid gig ID.' });
  }

  const gig = await Gig.findById(req.params.id);
  if (!gig) return res.status(404).json({ error: 'Gig not found.' });
  if (gig.freelancerId !== req.user.sub) return res.status(403).json({ error: 'You can only modify your own gigs.' });

  if (req.body.title !== undefined) {
    const cleanTitle = xss(req.body.title, xssOptions);
    if (!cleanTitle) return res.status(400).json({ error: 'Content contains disallowed markup.' });
    gig.title = cleanTitle;
  }
  if (req.body.description !== undefined) {
    const cleanDescription = xss(req.body.description, xssOptions);
    if (!cleanDescription) return res.status(400).json({ error: 'Content contains disallowed markup.' });
    gig.description = cleanDescription;
  }
  if (req.body.price !== undefined) gig.price = Number(req.body.price);

  await gig.save();
  res.json({ gig });
}

export async function deleteGig(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid gig ID.' });
  }

  const gig = await Gig.findById(req.params.id);
  if (!gig) return res.status(404).json({ error: 'Gig not found.' });
  if (gig.freelancerId !== req.user.sub) return res.status(403).json({ error: 'You can only delete your own gigs.' });

  gig.active = false;
  await gig.save();
  logger.info('Gig deleted', { gigId: gig._id.toString(), freelancerId: req.user.sub, requestId: req.id });
  res.json({ message: 'Gig deleted.' });
}

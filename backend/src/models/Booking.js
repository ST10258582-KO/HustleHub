import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  gigId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
  clientId: { type: String, required: true, index: true },
  freelancerId: { type: String, required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, default: 'confirmed' },
}, { timestamps: true });

export default mongoose.model('Booking', schema);

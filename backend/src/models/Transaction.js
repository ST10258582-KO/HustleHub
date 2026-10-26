import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  clientId: { type: String, required: true },
  freelancerId: { type: String, required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, default: 'simulated-paid' },
}, { timestamps: true });

export default mongoose.model('Transaction', schema);

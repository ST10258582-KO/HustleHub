import mongoose from 'mongoose';

const gigSchema = new mongoose.Schema({
  freelancerId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  price: { type: Number, required: true, min: 1 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Gig', gigSchema);

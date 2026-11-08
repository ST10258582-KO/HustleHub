/**
 * Development seed script — creates demo accounts for quick testing.
 * Run with: node src/seed.js
 * Only works when USE_MONGO=true and MongoDB is running.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from './models/User.js';
import Gig from './models/Gig.js';
import { config } from './config.js';

await mongoose.connect(config.mongoUri);

async function seed() {
  const hash = (p) => bcrypt.hash(p, 12);

  const admin = await User.findOneAndUpdate(
    { email: 'admin@hustlehub.dev' },
    { name: 'Admin User', email: 'admin@hustlehub.dev', passwordHash: await hash('Admin@1234'), role: 'admin' },
    { upsert: true, new: true }
  );
  const freelancer = await User.findOneAndUpdate(
    { email: 'freelancer@hustlehub.dev' },
    { name: 'Demo Freelancer', email: 'freelancer@hustlehub.dev', passwordHash: await hash('Freelancer@1234'), role: 'freelancer' },
    { upsert: true, new: true }
  );
  await User.findOneAndUpdate(
    { email: 'client@hustlehub.dev' },
    { name: 'Demo Client', email: 'client@hustlehub.dev', passwordHash: await hash('Client@1234'), role: 'client' },
    { upsert: true, new: true }
  );
  await Gig.findOneAndUpdate(
    { freelancerId: freelancer._id.toString(), title: 'Full-Stack Web Development' },
    { freelancerId: freelancer._id.toString(), title: 'Full-Stack Web Development', description: 'React frontend with Node.js/Express backend, MongoDB, and REST API design.', price: 4500 },
    { upsert: true }
  );
  await Gig.findOneAndUpdate(
    { freelancerId: freelancer._id.toString(), title: 'UI/UX Design' },
    { freelancerId: freelancer._id.toString(), title: 'UI/UX Design', description: 'Figma wireframes, design system, and high-fidelity mockups for your product.', price: 2800 },
    { upsert: true }
  );

  console.log('Seed complete. Admin:', admin.email, '| Freelancer:', freelancer.email);
  await mongoose.disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });

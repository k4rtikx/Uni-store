import 'dotenv/config';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seedFreeDonation = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[DB] Connected to MongoDB for Free Donation seed');

    const usersCol = mongoose.connection.collection('users');
    const listingsCol = mongoose.connection.collection('listings');

    // 1. Locate an existing RJIT senior seller account (e.g., Rohit Sharma or any RJIT student)
    let seniorSeller = await usersCol.findOne({
      email: { $regex: /rjit\.ac\.in$/i }
    });

    if (!seniorSeller) {
      console.log('[Seed] No RJIT user found, creating Rohit Sharma senior account...');
      const demoSeller = {
        name: 'Rohit Sharma (Senior CSE)',
        email: '0902cs221045@rjit.ac.in',
        college: 'Rustamji Institute of Technology (RJIT), Tekanpur',
        phone: '+91 98260 12345',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const res = await usersCol.insertOne(demoSeller);
      seniorSeller = { _id: res.insertedId, ...demoSeller };
    }

    console.log(`[Seed] Using senior seller: ${seniorSeller.name} (${seniorSeller.email})`);

    // 2. Check if this donation listing already exists
    const existingListing = await listingsCol.findOne({
      title: 'RGPV B.Tech CSE 3rd Sem Solved PYQs & Handwritten Notes'
    });

    if (existingListing) {
      console.log('[Seed] Free donation listing already exists. Updating price to 0 and status to AVAILABLE.');
      await listingsCol.updateOne(
        { _id: existingListing._id },
        {
          $set: {
            price: 0,
            status: 'AVAILABLE',
            category: 'Books',
            condition: 'Good',
            updatedAt: new Date(),
          }
        }
      );
      console.log(`[Seed] Updated existing listing: ${existingListing._id}`);
    } else {
      const freeDonationListing = {
        title: 'RGPV B.Tech CSE 3rd Sem Solved PYQs & Handwritten Notes',
        description:
          '🎁 Free donation for 2nd/3rd year juniors! Complete handwritten notes for OOPs (Object Oriented Programming), Discrete Mathematics, and Data Structures along with last 5 years RGPV solved mid-sem and end-sem question papers. Free handover near RJIT Central Library or Canteen.',
        price: 0,
        category: 'Books',
        condition: 'Good',
        imageUrl:
          'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
        seller: seniorSeller._id,
        status: 'AVAILABLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await listingsCol.insertOne(freeDonationListing);
      console.log(`[Seed] Successfully inserted free donation listing ID: ${result.insertedId}`);
    }

    await mongoose.disconnect();
    console.log('[DB] Disconnected cleanly.');
  } catch (error) {
    console.error('[Error] Free donation seed failed:', error);
    process.exit(1);
  }
};

seedFreeDonation();

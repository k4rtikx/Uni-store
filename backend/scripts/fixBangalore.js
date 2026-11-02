import 'dotenv/config';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/uni-store');
  console.log('[DB] Connected');

  const users = mongoose.connection.collection('users');
  const listings = mongoose.connection.collection('listings');

  // Update college field in all user documents
  const u = await users.updateMany(
    { college: /Tekanpur/i },
    { $set: { college: 'CED - Alliance University (CED), Bangalore' } }
  );
  console.log(`Users updated: ${u.modifiedCount}`);

  // Update listing descriptions/titles
  const allListings = await listings.find({}).toArray();
  let lCount = 0;
  for (const listing of allListings) {
    const updates = {};
    if (listing.description && /Tekanpur/i.test(listing.description)) {
      updates.description = listing.description.replace(/Tekanpur/gi, 'Bangalore');
    }
    if (listing.title && /Tekanpur/i.test(listing.title)) {
      updates.title = listing.title.replace(/Tekanpur/gi, 'Bangalore');
    }
    if (Object.keys(updates).length > 0) {
      await listings.updateOne({ _id: listing._id }, { $set: updates });
      lCount++;
    }
  }
  console.log(`Listings updated: ${lCount}`);
  console.log('[Done] Tekanpur -> Bangalore in database');
  await mongoose.disconnect();
};

run().catch(console.error);


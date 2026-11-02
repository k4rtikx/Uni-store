import 'dotenv/config';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[DB] Connected to MongoDB');

    const usersCol = mongoose.connection.collection('users');
    const listingsCol = mongoose.connection.collection('listings');

    // 1. Find Abhishek pachori's account to ensure it is kept intact
    const userAbhishek = await usersCol.findOne({ email: '0902cs241008@rjit.ac.in' });
    if (!userAbhishek) {
      console.warn('[Warning] Abhishek account not found, proceeding with caution.');
    } else {
      console.log(`[Keep] Abhishek account identified: ${userAbhishek._id}`);
    }

    // 2. Remove all test users EXCEPT Abhishek and any rjit account
    const removeUsersResult = await usersCol.deleteMany({
      email: { $ne: '0902cs241008@rjit.ac.in' }
    });
    console.log(`[Clean] Deleted ${removeUsersResult.deletedCount} old test users.`);

    // 3. Remove listings belonging to deleted test users (keep Abhishek's listings)
    const deleteListingsQuery = userAbhishek
      ? { seller: { $ne: userAbhishek._id } }
      : {};
    const removeListingsResult = await listingsCol.deleteMany(deleteListingsQuery);
    console.log(`[Clean] Deleted ${removeListingsResult.deletedCount} test listings.`);

    // 4. Create or ensure a realistic RJIT demo senior student seller
    const salt = await bcrypt.genSalt(10);
    const demoPasswordHash = await bcrypt.hash('rjit2026', salt);

    const demoSeller = {
      name: 'Rohit Sharma (Senior CSE)',
      email: '0902cs221045@rjit.ac.in',
      passwordHash: demoPasswordHash,
      college: 'Rustamji Institute of Technology (RJIT), Tekanpur',
      phone: '+91 98260 12345',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertedSeller = await usersCol.insertOne(demoSeller);
    const demoSellerId = insertedSeller.insertedId;
    console.log(`[Seed] Created demo RJIT student seller: ${demoSeller.name} (${demoSeller.email})`);

    // 5. Seed the 4 realistic RJIT campus listings requested
    const rjitListings = [
      {
        title: 'Engineering Drawing Mini Drafter & Sheet Holder',
        description: 'Omega professional mini drafter with clamp and waterproof sheet container tube. Perfect condition for 1st year Mechanical / Civil / CS engineering drawing practicals at RJIT. Can hand over near Academic Block 2.',
        price: 350,
        category: 'Lab Equipment',
        condition: 'Good',
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        seller: demoSellerId,
        status: 'AVAILABLE',
        createdAt: new Date(Date.now() - 3600000 * 5),
        updatedAt: new Date(Date.now() - 3600000 * 5),
      },
      {
        title: 'Casio fx-991EX ClassWiz Scientific Calculator',
        description: 'Original Casio ClassWiz 552 functions calculator with QR code display. Essential for Engineering Mathematics, Electrical Network Analysis, and B.Tech semester exams. Scratch-free solar panel, working battery included.',
        price: 650,
        category: 'Electronics',
        condition: 'Like New',
        imageUrl: 'https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48f?auto=format&fit=crop&w=800&q=80',
        seller: demoSellerId,
        status: 'AVAILABLE',
        createdAt: new Date(Date.now() - 3600000 * 12),
        updatedAt: new Date(Date.now() - 3600000 * 12),
      },
      {
        title: 'Data Structures & Algorithms in C++ / DBMS Textbook',
        description: 'Standard RGPV prescribed reference book for DSA and Database Management Systems. Contains previous 5 years solved question papers, neat notes, and algorithms diagrams. Meet at Central Library or Canteen.',
        price: 280,
        category: 'Books',
        condition: 'Good',
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
        seller: demoSellerId,
        status: 'AVAILABLE',
        createdAt: new Date(Date.now() - 3600000 * 24),
        updatedAt: new Date(Date.now() - 3600000 * 24),
      },
      {
        title: 'Chemistry / Workshop White Lab Coat - Size M',
        description: '100% thick cotton white lab apron required for Chemistry lab and Workshop practicals. Clean, properly washed, with all buttons intact and college standard collar length. Ready for immediate use.',
        price: 200,
        category: 'Clothing',
        condition: 'Like New',
        imageUrl: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=80',
        seller: demoSellerId,
        status: 'AVAILABLE',
        createdAt: new Date(Date.now() - 3600000 * 36),
        updatedAt: new Date(Date.now() - 3600000 * 36),
      },
    ];

    const insertResult = await listingsCol.insertMany(rjitListings);
    console.log(`[Seed] Successfully inserted ${insertResult.insertedCount} realistic RJIT listings!`);

    await mongoose.disconnect();
    console.log('[DB] Disconnected.');
  } catch (error) {
    console.error('[Error] Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();

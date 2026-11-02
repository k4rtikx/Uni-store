import 'dotenv/config';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/uni-store';

// ────────────────────────────────────────────────────────────
// College accessories with real Unsplash image URLs + INR prices
// ────────────────────────────────────────────────────────────
const LISTINGS = [
  {
    title: 'Casio FX-991EX Scientific Calculator',
    description: 'Casio ClassWiz FX-991EX scientific calculator. 552 functions, spreadsheet mode, QR code feature. Used for 1 semester only. Works perfectly, original box included. Essential for Engineering Maths, Physics, and all science subjects.',
    price: 650,
    category: 'Lab Equipment',
    condition: 'Like New',
    imageUrl: 'https://images.unsplash.com/photo-1564473185935-42db0e2f3949?w=600&q=80',
  },
  {
    title: 'Drafter Set (Engineering Drawing Set) - Full Kit',
    description: 'Complete engineering drawing drafter kit: 60cm mini drafter, set squares (30-60 and 45), compass, divider, french curves, scale, and pencils. Used for 1 year ED labs. All instruments intact, no missing parts. Must-have for B.Tech 1st & 2nd year.',
    price: 900,
    category: 'Lab Equipment',
    condition: 'Good',
    imageUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80',
  },
  {
    title: 'Backpack - Wildcraft 32L Campus Bag (Black)',
    description: 'Wildcraft 32L college backpack in black. Multiple compartments, padded laptop sleeve (fits 15.6"), ergonomic shoulder straps. Used for 2 semesters, good condition with minor wear. Perfect for college daily use.',
    price: 750,
    category: 'Bags & Accessories',
    condition: 'Good',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
  },
  {
    title: 'B.Tech CSE Semester 3 & 4 Textbook Bundle (6 Books)',
    description: 'Complete set of B.Tech CSE Sem 3 & 4 textbooks: Data Structures (Cormen), DBMS (Korth), OS (Galvin), Computer Networks (Forouzan), COA (Morris Mano), TOC (Michael Sipser). All books in good condition with light pencil markings.',
    price: 1400,
    category: 'Books',
    condition: 'Good',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
  },
  {
    title: 'Wireless Bluetooth Headphones - boAt Rockerz 450',
    description: 'boAt Rockerz 450 Bluetooth headphones. 15hr playtime, 40mm drivers, foldable design. Bought 6 months ago, like new condition. Comes with charging cable and carry pouch. Great for online classes, music, and commuting.',
    price: 1100,
    category: 'Electronics',
    condition: 'Like New',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
  },
  {
    title: 'Staedtler Mars Comfort Geometry Box (Full Set)',
    description: 'Staedtler Mars Comfort geometry and stationery set. Includes compass, dividers, rulers, protractor, set squares. Premium metal instruments. Used only for 1 semester. All pieces present and in excellent condition.',
    price: 350,
    category: 'Stationery',
    condition: 'Like New',
    imageUrl: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=600&q=80',
  },
  {
    title: 'Lab Coat (White) - Size M / Unisex',
    description: 'Standard white lab coat, size Medium, suitable for both male and female students. Used for Chemistry and Biology labs. Washed and clean. Required for all science lab sessions at CED. Selling as upgraded to larger size.',
    price: 280,
    category: 'Clothing',
    condition: 'Good',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80',
  },
  {
    title: 'HP 15 Laptop Bag / Sleeve (15.6 inch)',
    description: 'HP branded 15.6 inch laptop sleeve/bag with extra accessory pocket. Thick padding, water resistant. Fits HP, Dell, Lenovo, Asus laptops. Received with laptop purchase, barely used. Ideal for college commute.',
    price: 300,
    category: 'Bags & Accessories',
    condition: 'Like New',
    imageUrl: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80',
  },
  {
    title: 'Classmate Premium Hardbound Notebooks (Set of 5)',
    description: 'Set of 5 Classmate hardbound premium notebooks, 200 pages each. Single ruled. Unused and sealed. Perfect for lab records, class notes, and assignments. Bought in bulk, selling extras.',
    price: 220,
    category: 'Stationery',
    condition: 'New',
    imageUrl: 'https://images.unsplash.com/photo-1531346680769-a1d79b57de5c?w=600&q=80',
  },
  {
    title: 'USB-C Hub (7-in-1) for Laptop',
    description: '7-in-1 USB-C hub with HDMI (4K), 3x USB 3.0, SD card reader, TF card reader, and PD charging port. Works great for connecting to projectors in labs and classrooms. Used for 1 year, fully functional.',
    price: 850,
    category: 'Electronics',
    condition: 'Good',
    imageUrl: 'https://images.unsplash.com/photo-1625895197185-efcec01cffe0?w=600&q=80',
  },
  {
    title: 'Arduino Uno R3 + Starter Kit Components',
    description: 'Arduino Uno R3 microcontroller with starter kit: breadboard, jumper wires, LEDs, resistors, capacitors, LDR, temperature sensor (LM35), buzzer. Used for 1 semester in EC lab. All components working and tested.',
    price: 700,
    category: 'Lab Equipment',
    condition: 'Good',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
  },
  {
    title: 'Engineering Graph Paper Sheets Bundle (100 sheets)',
    description: 'Bundle of 100 A4 engineering graph sheets (1mm, 5mm grid). Standard size for practicals, surveys, and ED assignments. Fresh stock, never used. Saving ₹50+ vs buying from campus stationery.',
    price: 120,
    category: 'Stationery',
    condition: 'New',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80',
  },
];

const seedListings = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('\n[DB] Connected to MongoDB:', MONGO_URI);

    const usersCol = mongoose.connection.collection('users');
    const listingsCol = mongoose.connection.collection('listings');

    // ── 1. Find or create the seller account ─────────────────
    const sellerEmail = 'jsahilbtech24@ced.alliance.edu.in';
    let seller = await usersCol.findOne({ email: sellerEmail });

    if (!seller) {
      console.log('[Seed] Creating seller account...');
      const hashedPass = await bcrypt.hash('Sahil@06', 10);
      const res = await usersCol.insertOne({
        name: 'Sahil Jaiswal',
        email: sellerEmail,
        password: hashedPass,
        phone: '+918409793323',
        college: 'CED - Alliance University (CED), Bangalore',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      seller = await usersCol.findOne({ _id: res.insertedId });
      console.log('[Seed] Created seller:', seller.name, '(' + seller.email + ')');
    } else {
      console.log('[Seed] Found existing seller:', seller.name, '(' + seller.email + ')');
    }

    // ── 2. Remove any old seed listings by this seller ───────
    const deleteResult = await listingsCol.deleteMany({ seller: seller._id });
    console.log(`[Seed] Removed ${deleteResult.deletedCount} old listings for this seller`);

    // ── 3. Insert fresh listings ──────────────────────────────
    const now = new Date();
    const docs = LISTINGS.map((item, i) => ({
      ...item,
      seller: seller._id,
      creatorId: seller._id,
      status: 'Available',
      views: Math.floor(Math.random() * 40) + 5,
      createdAt: new Date(now.getTime() - i * 3600_000), // stagger by 1hr each
      updatedAt: now,
    }));

    const result = await listingsCol.insertMany(docs);
    console.log(`\n[Seed] ✓ Inserted ${result.insertedCount} listings:\n`);

    docs.forEach((d, i) => {
      console.log(`  ${i + 1}. ${d.title.padEnd(55)} ₹${d.price}  [${d.condition}]`);
    });

    console.log('\n[Seed] Done! Open http://localhost:5173 to see them in the feed.\n');
  } catch (err) {
    console.error('[Seed] Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
};

seedListings();


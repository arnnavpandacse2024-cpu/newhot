require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { MenuItem, FoodBooking, HallBooking, Settings } = require('./database/models');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// ─── MongoDB Connection Cache (Critical for Vercel Serverless) ────────────────
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI environment variable is not set.');
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  isConnected = true;
  console.log('MongoDB Connected ✅');
  await seedDatabase();
}

// ─── Database Seeding ─────────────────────────────────────────────────────────
async function seedDatabase() {
  try {
    const count = await Settings.countDocuments();
    if (count === 0) {
      await Settings.create({
        kmPrices: [
          { upTo: 3,  price: 15 },
          { upTo: 6,  price: 20 },
          { upTo: 10, price: 25 },
        ],
      });
      console.log('Default settings created.');
    }

    const menuCount = await MenuItem.countDocuments();
    if (menuCount === 0) {
      await MenuItem.insertMany([
        { id: 1,  name: 'Paneer Butter Masala', category: 'Veg Main',          price: 220, emoji: '🍛', available: true,  discount: 0  },
        { id: 2,  name: 'Dal Makhani',          category: 'Veg Main',          price: 180, emoji: '🫕', available: true,  discount: 10 },
        { id: 3,  name: 'Chole Bhature',        category: 'Veg Snacks',        price: 130, emoji: '🫓', available: true,  discount: 0  },
        { id: 4,  name: 'Chicken Biryani',      category: 'Non-Veg Rice',      price: 280, emoji: '🍚', available: true,  discount: 15 },
        { id: 5,  name: 'Mutton Curry',         category: 'Non-Veg Main',      price: 350, emoji: '🍖', available: true,  discount: 0  },
        { id: 6,  name: 'Veg Fried Rice',       category: 'Veg Rice',          price: 160, emoji: '🍳', available: true,  discount: 0  },
        { id: 7,  name: 'Gulab Jamun',          category: 'Desserts',          price: 80,  emoji: '🍮', available: true,  discount: 0  },
        { id: 8,  name: 'Masala Chai',          category: 'Beverages',         price: 40,  emoji: '🍵', available: true,  discount: 0  },
        { id: 9,  name: 'Lassi',                category: 'Beverages',         price: 70,  emoji: '🥛', available: false, discount: 0  },
        { id: 10, name: 'Naan (2 pcs)',         category: 'Breads',            price: 60,  emoji: '🫓', available: true,  discount: 0  },
        { id: 11, name: 'Samosa (4 pcs)',       category: 'Veg Snacks',        price: 60,  emoji: '🔺', available: true,  discount: 0  },
        { id: 12, name: 'Chicken Tikka',        category: 'Non-Veg Starters',  price: 260, emoji: '🍗', available: true,  discount: 20 },
      ]);
      console.log('Default menu seeded.');
    }
  } catch (err) {
    console.error('Seeding error:', err.message);
  }
}

// ─── DB Connection Middleware ──────────────────────────────────────────────────
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB middleware error:', err.message);
    res.status(500).json({ error: 'Database connection failed. Check MONGODB_URI in Vercel environment variables.' });
  }
});

// ─── API ROUTES ───────────────────────────────────────────────────────────────

// Admin config (credentials from environment variables, never hardcoded)
app.get('/api/config', (req, res) => {
  res.json({
    adminUser: process.env.ADMIN_USER || 'admin',
    adminPass: process.env.ADMIN_PASS || 'bhaiya123',
  });
});

// Full application state
app.get('/api/state', async (req, res) => {
  try {
    const [settings, menuItems, foodBookings, hallBookings] = await Promise.all([
      Settings.findOne(),
      MenuItem.find().sort({ id: 1 }),
      FoodBooking.find().sort({ createdAt: -1 }),
      HallBooking.find().sort({ createdAt: -1 }),
    ]);
    res.json({ settings, menuItems, foodBookings, hallBookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Settings
app.put('/api/settings', async (req, res) => {
  try {
    const updated = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true, runValidators: false });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Menu
app.post('/api/menu', async (req, res) => {
  try {
    const item = new MenuItem(req.body);
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/menu/:id', async (req, res) => {
  try {
    const item = await MenuItem.findOneAndUpdate(
      { id: Number(req.params.id) },
      req.body,
      { new: true }
    );
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/menu/:id', async (req, res) => {
  try {
    await MenuItem.findOneAndDelete({ id: Number(req.params.id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Food Booking
app.post('/api/bookings/food', async (req, res) => {
  try {
    const booking = new FoodBooking(req.body);
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hall Booking
app.post('/api/bookings/hall', async (req, res) => {
  try {
    const booking = new HallBooking(req.body);
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SPA Fallback (must be LAST) ──────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Local Dev Server ─────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Local server running: http://localhost:${PORT}`);
  });
}

// ─── Export for Vercel Serverless ─────────────────────────────────────────────
module.exports = app;

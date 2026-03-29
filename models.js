const mongoose = require('mongoose');

// ─── Settings ─────────────────────────────────────────────────────────────────
const SettingsSchema = new mongoose.Schema({
  foodBookingOpen:  { type: Boolean, default: true },
  hallBookingOpen:  { type: Boolean, default: true },
  hallPricingMode:  { type: String,  default: 'hour' },
  hallPriceAmount:  { type: Number,  default: 500 },
  kmPrices: [{
    upTo:  { type: Number },
    price: { type: Number },
  }],
  payment: {
    upi:          { type: String, default: '' },
    name:         { type: String, default: '' },
    other:        { type: String, default: '' },
    adminContact: { type: String, default: '' },
  },
}, { timestamps: true });

// ─── Menu Item ─────────────────────────────────────────────────────────────────
const MenuItemSchema = new mongoose.Schema({
  id:        { type: Number, required: true, unique: true },
  name:      { type: String, required: true },
  category:  { type: String, required: true },
  price:     { type: Number, required: true },
  emoji:     { type: String, default: '🍽️' },
  available: { type: Boolean, default: true },
  discount:  { type: Number, default: 0 },
}, { timestamps: true });

// ─── Food Booking ──────────────────────────────────────────────────────────────
const FoodBookingSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  phone:    { type: String, required: true },
  address:  { type: String, required: true },
  km:       { type: Number, required: true },
  mapUrl:   { type: String, default: '' },
  items: [{
    name:  String,
    qty:   Number,
    price: Number,
  }],
  subtotal: Number,
  discount: Number,
  delivery: Number,
  total:    Number,
  date:     { type: String, default: () => new Date().toLocaleString('en-IN') },
}, { timestamps: true });

// ─── Hall Booking ──────────────────────────────────────────────────────────────
const HallBookingSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  phone:        { type: String, required: true },
  functionType: { type: String, required: true },
  date:         { type: String, required: true },
  time:         { type: String, required: true },
  hours:        { type: Number, required: true },
  members:      { type: Number, required: true },
  cabin:        { type: Number, required: true },
  total:        { type: Number, required: true },
  bookedAt:     { type: String, default: () => new Date().toLocaleString('en-IN') },
}, { timestamps: true });

module.exports = {
  Settings:    mongoose.models.Settings    || mongoose.model('Settings',    SettingsSchema),
  MenuItem:    mongoose.models.MenuItem    || mongoose.model('MenuItem',    MenuItemSchema),
  FoodBooking: mongoose.models.FoodBooking || mongoose.model('FoodBooking', FoodBookingSchema),
  HallBooking: mongoose.models.HallBooking || mongoose.model('HallBooking', HallBookingSchema),
};

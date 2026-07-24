const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, enum: ['Furniture', 'Appliance'], required: true },
  subCategory: String,
  description: String,
  monthlyRent: { type: Number, required: true, min: 0 },
  securityDeposit: { type: Number, required: true, min: 0 },
  tenureOptions: [{
    months: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 }
  }],
  images: [{ type: String }],
  stock: { type: Number, default: 1, min: 0 },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Available', 'Rented', 'Maintenance'], default: 'Available' },
  specs: mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
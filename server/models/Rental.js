const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tenureMonths: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'Active', 'Returned', 'Cancelled', 'Overdue'], default: 'Pending' },
  deliveryAddress: mongoose.Schema.Types.Mixed,
  deliveryDate: Date,
  pickupDate: Date,
  amountPaid: Number,
  depositPaid: { type: Boolean, default: false },
  hasDamage: { type: Boolean, default: false },
  damageNote: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Rental', rentalSchema);
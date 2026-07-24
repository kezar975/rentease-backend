const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  rental: { type: mongoose.Schema.Types.ObjectId, ref: 'Rental', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issue: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' },
  resolvedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Maintenance', maintenanceSchema);
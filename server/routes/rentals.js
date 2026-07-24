const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const Rental = require('../models/Rental');
const Product = require('../models/Product');
const Maintenance = require('../models/Maintenance');

router.post('/', protect, [
  body('productId').isMongoId(),
  body('tenureMonths').isInt({ min: 1 }),
  body('startDate').isISO8601(),
  body('deliveryAddress').notEmpty()
], validate, async (req, res) => {
  try {
    const { productId, tenureMonths, startDate, deliveryAddress } = req.body;
    const product = await Product.findById(productId);
    if (!product || product.stock < 1) return res.status(400).json({ message: 'Product unavailable' });

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + tenureMonths);

    const rental = await Rental.create({
      user: req.user._id,
      product: productId,
      vendor: product.vendor,
      tenureMonths,
      startDate,
      endDate,
      deliveryAddress,
      amountPaid: product.monthlyRent * tenureMonths
    });

    const newStock = product.stock - 1;
    await Product.findByIdAndUpdate(productId, {
      stock: newStock,
      status: newStock < 1 ? 'Rented' : 'Available'
    });

    res.status(201).json(rental);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/my', protect, async (req, res) => {
  try {
    const rentals = await Rental.find({ user: req.user._id })
      .populate('product', 'name category monthlyRent images')
      .sort({ createdAt: -1 });
    res.json(rentals);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/maintenance', protect, [
  body('issue').trim().isLength({ min: 5 }).withMessage('Please describe the issue in at least 5 characters')
], validate, async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id);
    if (!rental) return res.status(404).json({ message: 'Rental not found' });
    if (String(rental.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized for this rental' });
    }

    const request = await Maintenance.create({
      rental: rental._id,
      user: req.user._id,
      issue: req.body.issue
    });

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
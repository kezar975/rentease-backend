const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const Product = require('../models/Product');

router.get('/', async (req, res) => {
  try {
    const { category, minRent, maxRent, page = 1, limit = 12 } = req.query;
    const filter = { status: 'Available' };
    if (category) filter.category = category;
    if (minRent || maxRent) filter.monthlyRent = {};
    if (minRent) filter.monthlyRent.$gte = Number(minRent);
    if (maxRent) filter.monthlyRent.$lte = Number(maxRent);

    const products = await Product.find(filter)
      .populate('vendor', 'name businessName services')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);
    res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('vendor', 'name businessName services');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', protect, authorize('vendor', 'admin'), [
  body('name').trim().notEmpty(),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('monthlyRent').isNumeric(),
  body('securityDeposit').isNumeric(),
  body('tenureOptions').isArray()
], validate, async (req, res) => {
  try {
    const product = await Product.create({ ...req.body, vendor: req.user._id });
    await req.user.updateOne({ $push: { products: product._id } });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', protect, authorize('vendor', 'admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (req.user.role !== 'admin' && String(product.vendor) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to edit this product' });
    }

    const updatable = [
      'name', 'category', 'subCategory', 'description',
      'monthlyRent', 'securityDeposit', 'tenureOptions',
      'images', 'stock', 'status', 'specs'
    ];
    updatable.forEach(field => {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    });

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', protect, authorize('vendor', 'admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (req.user.role !== 'admin' && String(product.vendor) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
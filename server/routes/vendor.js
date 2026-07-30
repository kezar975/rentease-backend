const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Product = require('../models/Product');
const Rental = require('../models/Rental');
const Maintenance = require('../models/Maintenance');

router.use(protect, authorize('vendor'));

router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.user._id });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

router.post('/products', async (req, res) => {
  try {
    const product = await Product.create({ ...req.body, vendor: req.user._id });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create product' });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, vendor: req.user._id });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    Object.assign(product, req.body);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update product' });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, vendor: req.user._id });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

router.get('/rentals', async (req, res) => {
  try {
    const rentals = await Rental.find({ vendor: req.user._id })
      .populate('user', 'name email')
      .populate('product', 'name category monthlyRent');
    res.json(rentals);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch rentals' });
  }
});

router.put('/rentals/:id', async (req, res) => {
  try {
    const { status, damageNote, hasDamage } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (damageNote !== undefined) updateData.damageNote = damageNote;
    if (hasDamage !== undefined) updateData.hasDamage = hasDamage;

    const rental = await Rental.findOneAndUpdate(
      { _id: req.params.id, vendor: req.user._id },
      updateData,
      { new: true }
    ).populate('user', 'name email').populate('product', 'name category monthlyRent');

    if (!rental) return res.status(404).json({ message: 'Rental not found' });
    res.json(rental);
  } catch (err) {
    console.error('Error updating rental:', err);
    res.status(500).json({ message: 'Failed to update rental' });
  }
});

router.put('/maintenance/:id', async (req, res) => {
  try {
    const request = await Maintenance.findById(req.params.id).populate({
      path: 'rental',
      populate: { path: 'product', select: 'vendor name' }
    });

    if (!request) return res.status(404).json({ message: 'Maintenance request not found' });

    if (String(request.rental.vendor || request.rental.product?.vendor) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }

    request.status = req.body.status;
    await request.save();
    await request.populate({
      path: 'rental',
      populate: [{ path: 'user', select: 'name' }, { path: 'product', select: 'name' }]
    });

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update maintenance request' });
  }
});
module.exports = router;
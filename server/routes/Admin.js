const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Rental = require('../models/Rental');
const Maintenance = require('../models/Maintenance');


router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { role }, 
      { returnDocument: 'after' } 
    ).select('-password');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});


router.get('/rentals', async (req, res) => {
  try {
    const rentals = await Rental.find()
      .populate('user', 'name email')
      .populate('product', 'name category monthlyRent'); 
    res.json(rentals);
  } catch (err) {
    console.error('Error fetching rentals:', err);
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

    const rental = await Rental.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { returnDocument: 'after' }
    ).populate('user', 'name email').populate('product', 'name category monthlyRent');
    
    if (!rental) return res.status(404).json({ message: 'Rental not found' });
    res.json(rental);
  } catch (err) {
    console.error('Error updating rental:', err);
    res.status(500).json({ message: 'Failed to update rental' });
  }
});


router.get('/maintenance', async (req, res) => {
  try {
    const requests = await Maintenance.find()
      .populate({
        path: 'rental',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'product', select: 'name category' }
        ]
      })
      .sort({ createdAt: -1 });
      
    res.json(requests);
  } catch (err) {
    console.error('Error fetching maintenance requests:', err);
    res.status(500).json({ message: 'Failed to fetch maintenance requests' });
  }
});

router.put('/maintenance/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    const request = await Maintenance.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: 'after' }
    ).populate({
      path: 'rental',
      populate: [
        { path: 'user', select: 'name' },
        { path: 'product', select: 'name' }
      ]
    });

    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    res.json(request);
  } catch (err) {
    console.error('Error updating maintenance request:', err);
    res.status(500).json({ message: 'Failed to update maintenance request' });
  }
});

module.exports = router;
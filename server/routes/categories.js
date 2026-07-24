const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    console.error('GET categories error:', err);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Category name is required' });
    
    const newCategory = await Category.create({ name: name.trim() });
    res.status(201).json(newCategory);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'This category already exists' });
    console.error('POST category error:', err);
    res.status(500).json({ message: 'Failed to add category' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    console.log(' PUT /categories/:id called with ID:', req.params.id, 'Body:', req.body);
    
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Category name is required' });
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true } 
    );
    
    if (!category) {
      console.log('Category not found for ID:', req.params.id);
      return res.status(404).json({ message: 'Category not found' });
    }
    
    console.log('Category updated successfully:', category.name);
    res.json(category);
  } catch (err) {
    console.error('PUT category error:', err);
    if (err.code === 11000) return res.status(400).json({ message: 'Category name already exists' });
    res.status(500).json({ message: 'Failed to update category' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    console.log(' DELETE /categories/:id called with ID:', req.params.id);
    
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    
    console.log('Category deleted successfully');
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('DELETE category error:', err);
    res.status(500).json({ message: 'Failed to delete category' });
  }
});

module.exports = router;
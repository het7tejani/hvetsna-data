const express = require('express');
const router = express.Router();
const Preset = require('../models/Preset');

// @route   GET /api/presets
// @desc    Get all saved predefined items
router.get('/', async (req, res) => {
  try {
    const presets = await Preset.find().sort({ createdAt: -1 });
    res.status(200).json(presets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch presets' });
  }
});

// @route   POST /api/presets
// @desc    Create a new predefined item preset
router.post('/', async (req, res) => {
  try {
    const { name, price, quantity } = req.body;
    
    // Check if preset name already exists
    const existing = await Preset.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ error: 'A preset with this name already exists' });
    }

    const newPreset = new Preset({
      name: name.trim(),
      price: parseFloat(price),
    });

    const savedPreset = await newPreset.save();
    res.status(201).json(savedPreset);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to save preset' });
  }
});

// @route   DELETE /api/presets/:id
// @desc    Delete a predefined item preset
router.delete('/:id', async (req, res) => {
  try {
    const preset = await Preset.findById(req.params.id);
    if (!preset) {
      return res.status(404).json({ error: 'Preset not found' });
    }
    await preset.deleteOne();
    res.status(200).json({ success: true, message: 'Preset removed cleanly' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete preset' });
  }
});

module.exports = router;
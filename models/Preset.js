const mongoose = require('mongoose');

const PresetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Preset name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      default: 'personal',
      trim: true,
      lowercase: true,
    }
  },
  { timestamps: true }
);

// Allow same name presets in different modes (e.g. personal and office)
PresetSchema.index({ name: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Preset', PresetSchema);
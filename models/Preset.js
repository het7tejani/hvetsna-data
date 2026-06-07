const mongoose = require('mongoose');

const PresetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Preset name is required'],
      trim: true,
      unique: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Preset', PresetSchema);
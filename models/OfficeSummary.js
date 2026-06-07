const mongoose = require('mongoose');

const OfficeSummarySchema = new mongoose.Schema(
  {
    month: {
      type: String, // YYYY-MM
      required: true,
      unique: true,
      trim: true,
    },
    totalImports: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalPaid: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    netDue: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OfficeSummary', OfficeSummarySchema);

const mongoose = require('mongoose');

// Schema for individual items within an expense
const ExpenseItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  total: { type: Number, required: true } // calculated as price * quantity
});

const ExpenseSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [200, 'Description too long'],
    },
    items: [ExpenseItemSchema], // Array supporting multi-item receipt logging
    category: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'misc',
      enum: ['food', 'transport', 'fuel', 'groceries', 'medicine', 'shopping', 'bills', 'entertainment', 'chai', 'misc'],
    },
    source: { type: String, enum: ['voice', 'manual'], default: 'manual' },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
  },
  { timestamps: true }
);

ExpenseSchema.index({ date: 1 });

// Schema for Saved Default Products (Preset List)
const ProductRegistrySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  defaultPrice: { type: Number, required: true, min: 0 },
  defaultCategory: { type: String, default: 'misc' }
});

module.exports = {
  Expense: mongoose.model('Expense', ExpenseSchema),
  ProductRegistry: mongoose.model('ProductRegistry', ProductRegistrySchema)
};
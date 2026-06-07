const { Expense } = require('../models/Expense');

// Category auto-detection keywords
const CATEGORY_MAP = {
  food: ['food', 'lunch', 'dinner', 'breakfast', 'biryani', 'pizza', 'burger', 'khana', 'nashta', 'snack', 'snacks', 'thali', 'meal'],
  transport: ['transport', 'uber', 'ola', 'auto', 'rickshaw', 'cab', 'taxi', 'bus', 'train', 'metro', 'fare'],
  fuel: ['fuel', 'petrol', 'diesel', 'gas', 'cng', 'tank'],
  groceries: ['groceries', 'grocery', 'sabji', 'sabzi', 'vegetables', 'fruits', 'ration', 'kirana'],
  medicine: ['medicine', 'medical', 'pharmacy', 'dawa', 'doctor', 'hospital', 'health', 'tablet'],
  shopping: ['shopping', 'clothes', 'shoes', 'kapde', 'amazon', 'flipkart', 'online', 'order'],
  bills: ['bill', 'bills', 'recharge', 'electricity', 'bijli', 'water', 'wifi', 'internet', 'phone', 'rent', 'emi'],
  entertainment: ['entertainment', 'movie', 'film', 'netflix', 'game', 'outing', 'party'],
  chai: ['chai', 'tea', 'coffee', 'juice', 'lassi', 'drink', 'soda', 'cold drink', 'pani', 'water bottle'],
};

function detectCategory(text) {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return category;
    }
  }
  return 'misc';
}

function parseExpenseText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return null;
  }

  let text = rawText.trim().toLowerCase();

  // Remove common filler words at the start
  text = text.replace(/^(hey google|ok google|log expense|add expense|hisab|kharch|kharcha|add|log|note)\s*/i, '');
  text = text.trim();

  if (!text) return null;

  let amount = null;
  let description = null;

  // Pattern 1: "spent 150 on petrol" / "spend 200 on food"
  let match = text.match(/(?:spent|spend|paid|gave)\s+(\d+)\s+(?:on|for|in)\s+(.+)/i);
  if (match) {
    amount = parseFloat(match[1]);
    description = match[2].trim();
  }

  // Pattern 2: "150 rupees for chai" / "150 rs on petrol" / "150 for food"
  if (!amount) {
    match = text.match(/(\d+)\s*(?:rupees|rupee|rs|inr|₹)?\s*(?:on|for|pe|ka|ki|ke)\s+(.+)/i);
    if (match) {
      amount = parseFloat(match[1]);
      description = match[2].trim();
    }
  }

  // Pattern 3: "petrol 150" / "chai 50" (description first, amount at end)
  if (!amount) {
    match = text.match(/^([a-z\s]+?)\s+(\d+)\s*(?:rupees|rupee|rs|inr|₹)?$/i);
    if (match) {
      amount = parseFloat(match[2]);
      description = match[1].trim();
    }
  }

  // Pattern 4: "150 petrol" / "200 medicine" (amount first, then description)
  if (!amount) {
    match = text.match(/^(\d+)\s*(?:rupees|rupee|rs|inr|₹)?\s+([a-z\s]+)$/i);
    if (match) {
      amount = parseFloat(match[1]);
      description = match[2].trim();
    }
  }

  // Pattern 5: Just a number — amount only, no description
  if (!amount) {
    match = text.match(/^(\d+)\s*(?:rupees|rupee|rs|inr|₹)?$/i);
    if (match) {
      amount = parseFloat(match[1]);
      description = 'unnamed expense';
    }
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    return null;
  }

  // Clean up description — remove trailing filler
  if (description) {
    description = description.replace(/\s*(laga|lagi|lagey|hua|hue|kiya|ki|the|tha)\s*$/i, '').trim();
  }

  if (!description) description = 'unnamed expense';

  const category = detectCategory(description);

  return {
    amount,
    description,
    category,
  };
}

// Helper: get today's date as YYYY-MM-DD in IST
function getTodayIST() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().split('T')[0];
}

// ─── CONTROLLERS ────────────────────────────────────────────────────

// POST /api/v1/hisab/voice-entry
// Called by IFTTT webhook
exports.voiceEntry = async (req, res) => {
  try {
    // Validate webhook secret (optional but recommended)
    const secret = req.headers['x-webhook-secret'] || req.query.secret;
    if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized — invalid webhook secret',
      });
    }

    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Missing "text" field in request body',
      });
    }

    const parsed = parseExpenseText(text);

    if (!parsed) {
      return res.status(400).json({
        success: false,
        message: `Could not parse expense from: "${text}"`,
      });
    }

    const expense = await Expense.create({
      amount: parsed.amount,
      description: parsed.description,
      category: parsed.category,
      rawText: text,
      source: 'voice',
      date: getTodayIST(),
    });

    console.log(`🎤 Voice entry: ₹${parsed.amount} — ${parsed.description} [${parsed.category}]`);

    return res.status(201).json({
      success: true,
      message: `Logged ₹${parsed.amount} for ${parsed.description}`,
      data: expense,
    });
  } catch (error) {
    console.error('Voice entry error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/v1/hisab/manual-entry
// Called from the frontend manual form
exports.manualEntry = async (req, res) => {
  try {
    const { amount, description, category } = req.body;

    if (!amount || !description) {
      return res.status(400).json({
        success: false,
        message: 'Amount and description are required',
      });
    }

    const expense = await Expense.create({
      amount: parseFloat(amount),
      description: description.trim(),
      category: category || detectCategory(description),
      rawText: `manual: ${amount} ${description}`,
      source: 'manual',
      date: getTodayIST(),
    });

    return res.status(201).json({ success: true, data: expense });
  } catch (error) {
    console.error('Manual entry error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/v1/hisab/entries?date=2026-05-31
// Get entries for a specific date (defaults to today)
exports.getEntries = async (req, res) => {
  try {
    const date = req.query.date || getTodayIST();
    const entries = await Expense.find({ date }).sort({ createdAt: -1 });
    const total = entries.reduce((sum, e) => sum + e.amount, 0);

    return res.json({
      success: true,
      date,
      total,
      count: entries.length,
      data: entries,
    });
  } catch (error) {
    console.error('Get entries error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/v1/hisab/today
// Quick summary for today
exports.getToday = async (req, res) => {
  try {
    const date = getTodayIST();
    const entries = await Expense.find({ date }).sort({ createdAt: -1 });
    const total = entries.reduce((sum, e) => sum + e.amount, 0);

    // Group by category
    const byCategory = {};
    entries.forEach((e) => {
      if (!byCategory[e.category]) byCategory[e.category] = 0;
      byCategory[e.category] += e.amount;
    });

    return res.json({
      success: true,
      date,
      total,
      count: entries.length,
      byCategory,
      data: entries,
    });
  } catch (error) {
    console.error('Get today error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/v1/hisab/monthly?month=2026-05
// Monthly summary grouped by category
exports.getMonthlySummary = async (req, res) => {
  try {
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const defaultMonth = ist.toISOString().slice(0, 7); // "2026-05"
    const month = req.query.month || defaultMonth;

    const entries = await Expense.find({
      date: { $regex: `^${month}` },
    }).sort({ date: 1, createdAt: -1 });

    const total = entries.reduce((sum, e) => sum + e.amount, 0);

    // Group by category
    const byCategory = {};
    entries.forEach((e) => {
      if (!byCategory[e.category]) byCategory[e.category] = 0;
      byCategory[e.category] += e.amount;
    });

    // Group by date
    const byDate = {};
    entries.forEach((e) => {
      if (!byDate[e.date]) byDate[e.date] = 0;
      byDate[e.date] += e.amount;
    });

    return res.json({
      success: true,
      month,
      total,
      count: entries.length,
      byCategory,
      byDate,
      data: entries,
    });
  } catch (error) {
    console.error('Monthly summary error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/v1/hisab/entries/:id
exports.deleteEntry = async (req, res) => {
  try {
    const entry = await Expense.findByIdAndDelete(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }
    return res.json({ success: true, message: 'Entry deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

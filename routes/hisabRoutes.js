const express = require('express');
const router = express.Router();
const {
  voiceEntry,
  manualEntry,
  getEntries,
  getToday,
  getMonthlySummary,
  deleteEntry,
} = require('../controllers/hisabController');

// IFTTT webhook — voice entry
router.post('/voice-entry', voiceEntry);

// Manual entry from frontend
router.post('/manual-entry', manualEntry);

// Get entries for a specific date
router.get('/entries', getEntries);

// Get today's summary
router.get('/today', getToday);

// Monthly summary
router.get('/monthly', getMonthlySummary);

// Delete an entry
router.delete('/entries/:id', deleteEntry);

module.exports = router;

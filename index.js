require('dotenv').config({
  path: __dirname + '/.env',
});

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const hisabRoutes = require('./routes/hisabRoutes');

// Debug
console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('PORT:', process.env.PORT);
console.log('CLIENT_URL:', process.env.CLIENT_URL);

const app = express();

// Middleware
app.use(
  cors({
    origin: function(origin, callback) {
      // Allow all origins (works for local and deployed frontend)
      callback(null, true);
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/hisab', hisabRoutes);
app.use('/api/presets', require('./routes/presets'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'Hisab API',
    version: '1.0.0',
  });
});

// Start Server
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
})();
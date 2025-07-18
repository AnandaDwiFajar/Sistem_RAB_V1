// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db'); // Renamed from db to pool for clarity

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors()); // TODO: Configure specific origins for production
app.use(express.json());

// --- Placeholder for Auth Middleware ---
// In a real app, you'd have middleware to verify tokens and attach user info to req
// For example: const authMiddleware = require('./middleware/authMiddleware');
// app.use(authMiddleware); // Apply to protected routes

// --- API Routes ---
const unitRoutes = require('./routes/unitRoutes');
const workItemCategoryRoutes = require('./routes/workItemCategoryRoutes');
const cashFlowCategoryRoutes = require('./routes/cashFlowCategoryRoutes');
const materialPriceRoutes = require('./routes/materialPriceRoutes');
const workItemDefinitionRoutes = require('./routes/workItemDefinitionRoutes');
const projectRoutes = require('./routes/projectRoutes');
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reportRoutes');


app.use('/api/units', unitRoutes);
app.use('/api/work-item-categories', workItemCategoryRoutes);
app.use('/api/cash-flow-categories', cashFlowCategoryRoutes);
app.use('/api/material-prices', materialPriceRoutes);
app.use('/api/work-item-definitions', workItemDefinitionRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);

// --- Test Database Connection ---
app.get('/api/health', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT "Database connection healthy" as message');
    res.json({ server: 'Running', database: results[0].message, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ server: 'Running', database: 'Connection failed', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Indonesia current time: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`);
});
require('dotenv').config();
const express      = require('express');
const cors         = require('cors');

const authRoutes        = require('./routes/auth');
const taskRoutes        = require('./routes/tasks');
const applicationRoutes = require('./routes/applications');
const skillRoutes       = require('./routes/skills');
const transactionRoutes = require('./routes/transactions');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────
app.use('/auth',         authRoutes);
app.use('/tasks',        taskRoutes);
app.use('/applications', applicationRoutes);
app.use('/skills',       skillRoutes);
app.use('/transactions', transactionRoutes);

// ─── Health check ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'SkillThali API is running.' });
});

// ─── 404 handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ─── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error.', detail: err.message });
});

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`SkillThali backend running on http://localhost:${PORT}`);
});

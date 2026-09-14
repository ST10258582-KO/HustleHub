require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const authRoutes = require('./src/routes/auth.routes');

const app = express();

app.use(helmet());
app.use(express.json());

app.use('/api/auth', authRoutes);

// 404 — unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler — never expose internals
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err.message);
  res.status(500).json({ error: 'An internal server error occurred' });
});

module.exports = app;

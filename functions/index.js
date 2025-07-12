const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// functions/index.js
const functions = require('firebase-functions');
const express   = require('express');
const cors      = require('cors');
const mysql     = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// -- Configure your DB pool --
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  // for Cloud SQL socketPath, if using Cloud SQL proxy:
  // socketPath: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`
});

// -- Define routes on `app` --
app.get('/ping', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    res.json({ ok: true, result: rows[0].result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.toString() });
  }
});

// … your other CRUD routes here …

// -- Export the Express app as an HTTPS function called `api` --
exports.api = functions
  .runWith({ memory: '256MB', timeoutSeconds: 10 })
  .https.onRequest(app);

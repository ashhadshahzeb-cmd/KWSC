// Vercel Serverless API Handler
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import the Express app from parent directory
const app = require('../index.js');

// Export for Vercel
module.exports = app;

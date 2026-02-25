const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Set test environment so server.js doesn't start listening
process.env.NODE_ENV = 'test';

// Fallback JWT_SECRET for tests so tests don't depend on real secrets
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';

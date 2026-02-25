const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Fallback JWT_SECRET for tests so tests don't depend on real secrets
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';

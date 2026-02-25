const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const Member = require('../../models/Member');

// Generate unique test email to avoid collisions across runs
const testEmail = `integration-test-${Date.now()}@test.com`;
const testPassword = 'TestPassword123';
let authToken;

describe('Auth API Routes', () => {
    // Connect to DB (server.js already calls connectDB, but ensure connection is ready)
    beforeAll(async () => {
        // Wait for the mongoose connection to be ready
        if (mongoose.connection.readyState !== 1) {
            await new Promise((resolve) => {
                mongoose.connection.once('connected', resolve);
                // If already connecting, just wait
                setTimeout(resolve, 3000);
            });
        }
    });

    // Clean up test data and close connection
    afterAll(async () => {
        await Member.deleteMany({ email: testEmail });
        await mongoose.connection.close();
    });

    // ==========================================
    // POST /api/auth/register
    // ==========================================
    describe('POST /api/auth/register', () => {
        it('should register a new member successfully (201)', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    role: 'member',
                    name: 'Integration Test User',
                    email: testEmail,
                    password: testPassword,
                    contact: '9999999999',
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user).toHaveProperty('id');
            expect(res.body.user.email).toBe(testEmail);
            expect(res.body.user.role).toBe('member');

            // Save token for later tests
            authToken = res.body.token;
        });

        it('should reject duplicate email (400)', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    role: 'member',
                    name: 'Duplicate User',
                    email: testEmail,
                    password: 'AnotherPassword123',
                    contact: '8888888888',
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Email already exists');
        });

        it('should reject invalid role (400)', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    role: 'invalidrole',
                    name: 'Bad Role User',
                    email: 'invalid-role@test.com',
                    password: 'Password123',
                    contact: '7777777777',
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Invalid role');
        });
    });

    // ==========================================
    // POST /api/auth/login
    // ==========================================
    describe('POST /api/auth/login', () => {
        it('should login with correct credentials (200)', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    role: 'member',
                    email: testEmail,
                    password: testPassword,
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user.email).toBe(testEmail);
            expect(res.body.user.role).toBe('member');

            // Update token for profile tests
            authToken = res.body.token;
        });

        it('should reject wrong password (400)', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    role: 'member',
                    email: testEmail,
                    password: 'WrongPassword',
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Invalid credentials');
        });

        it('should reject missing fields (400)', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testEmail,
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Email, password, and role are required');
        });
    });

    // ==========================================
    // GET /api/auth/profile
    // ==========================================
    describe('GET /api/auth/profile', () => {
        it('should return user profile with valid token (200)', async () => {
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', 'Integration Test User');
            expect(res.body).toHaveProperty('email', testEmail);
            expect(res.body).not.toHaveProperty('password'); // password should be excluded
        });

        it('should return 401 without a token', async () => {
            const res = await request(app).get('/api/auth/profile');

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Authorization header missing or malformed');
        });

        it('should return 401 with an invalid token', async () => {
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer totally-invalid-token');

            expect(res.status).toBe(401);
        });
    });
});

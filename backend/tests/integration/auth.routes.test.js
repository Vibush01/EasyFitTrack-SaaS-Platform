const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const Member = require('../../models/Member');

const testEmail = `integration-test-${Date.now()}@test.com`;
const testPassword = 'TestPassword123';
let authToken;

describe('Auth API Routes', () => {
    beforeAll(async () => {
        if (mongoose.connection.readyState !== 1) {
            await new Promise((resolve) => {
                mongoose.connection.once('connected', resolve);
                setTimeout(resolve, 3000);
            });
        }
    });

    afterAll(async () => {
        await Member.deleteMany({ email: testEmail });
        await mongoose.connection.close();
    });

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
            expect(res.body.message).toBe('Validation failed');
            expect(res.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: 'role', message: 'Invalid role' }),
                ])
            );
        });
    });

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
            expect(res.body.message).toBe('Validation failed');
            expect(res.body.errors).toBeDefined();
            expect(res.body.errors.length).toBeGreaterThan(0);
        });
    });

    describe('GET /api/auth/profile', () => {
        it('should return user profile with valid token (200)', async () => {
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', 'Integration Test User');
            expect(res.body).toHaveProperty('email', testEmail);
            expect(res.body).not.toHaveProperty('password');
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

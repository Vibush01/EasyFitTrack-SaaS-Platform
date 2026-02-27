const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Member = require('../../models/Member');

describe('Member Model', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URI);
    });

    afterAll(async () => {
        await Member.deleteMany({ email: /^unittest-/ });
        await mongoose.connection.close();
    });

    describe('Schema Validation', () => {
        it('should fail validation when required fields are missing', async () => {
            const member = new Member({});
            const error = member.validateSync();

            expect(error).toBeDefined();
            expect(error.errors.name).toBeDefined();
            expect(error.errors.email).toBeDefined();
            expect(error.errors.password).toBeDefined();
            expect(error.errors.contact).toBeDefined();
        });

        it('should pass validation when all required fields are provided', async () => {
            const member = new Member({
                name: 'Test User',
                email: 'unittest-validation@test.com',
                password: 'Password123',
                contact: '1234567890',
            });
            const error = member.validateSync();

            expect(error).toBeUndefined();
        });

        it('should default role to member', () => {
            const member = new Member({
                name: 'Test User',
                email: 'unittest-role@test.com',
                password: 'Password123',
                contact: '1234567890',
            });

            expect(member.role).toBe('member');
        });

        it('should default gym to null', () => {
            const member = new Member({
                name: 'Test User',
                email: 'unittest-gym@test.com',
                password: 'Password123',
                contact: '1234567890',
            });

            expect(member.gym).toBeNull();
        });
    });

    describe('Password Hashing (pre-save hook)', () => {
        it('should hash the password before saving', async () => {
            const rawPassword = 'MySecurePassword123';
            const member = new Member({
                name: 'Hash Test User',
                email: `unittest-hash-${Date.now()}@test.com`,
                password: rawPassword,
                contact: '9876543210',
            });

            await member.save();

            expect(member.password).not.toBe(rawPassword);
            const isHashed = await bcrypt.compare(rawPassword, member.password);
            expect(isHashed).toBe(true);
        });
    });

    describe('matchPassword Method', () => {
        let savedMember;
        const testPassword = 'CorrectPassword123';

        beforeAll(async () => {
            savedMember = new Member({
                name: 'Match Test User',
                email: `unittest-match-${Date.now()}@test.com`,
                password: testPassword,
                contact: '5555555555',
            });
            await savedMember.save();
        });

        it('should return true for a correct password', async () => {
            const isMatch = await savedMember.matchPassword(testPassword);
            expect(isMatch).toBe(true);
        });

        it('should return false for an incorrect password', async () => {
            const isMatch = await savedMember.matchPassword('WrongPassword');
            expect(isMatch).toBe(false);
        });
    });
});

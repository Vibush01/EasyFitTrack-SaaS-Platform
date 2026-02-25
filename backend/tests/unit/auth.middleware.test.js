const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const authMiddleware = require('../../middleware/auth');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            header: vi.fn(),
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
        next = vi.fn();
    });

    it('should return 401 if no Authorization header is present', async () => {
        req.header.mockReturnValue(undefined);

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Authorization header missing or malformed',
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if Authorization header does not start with Bearer', async () => {
        req.header.mockReturnValue('Basic some-token');

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Authorization header missing or malformed',
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if the JWT token is invalid', async () => {
        req.header.mockReturnValue('Bearer invalid-token-here');

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Token is not valid' })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if the token has an invalid user ID', async () => {
        const token = jwt.sign(
            { id: 'not-a-valid-objectid', role: 'member' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        req.header.mockReturnValue(`Bearer ${token}`);

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Invalid token: user ID is missing or invalid',
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if the token has no role', async () => {
        const validObjectId = new mongoose.Types.ObjectId().toString();
        const token = jwt.sign(
            { id: validObjectId },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        req.header.mockReturnValue(`Bearer ${token}`);

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Invalid token: role is missing',
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next() and attach user to req when token is valid', async () => {
        const validObjectId = new mongoose.Types.ObjectId().toString();
        const token = jwt.sign(
            { id: validObjectId, role: 'member' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        req.header.mockReturnValue(`Bearer ${token}`);

        await authMiddleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toBeDefined();
        expect(req.user.id).toBe(validObjectId);
        expect(req.user.role).toBe('member');
    });
});

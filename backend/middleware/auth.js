import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const authMiddleware = async (req, res, next) => {
    // Check for Authorization header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization header missing or malformed' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Validate the decoded token
        if (!decoded.id || !mongoose.Types.ObjectId.isValid(decoded.id)) {
            return res
                .status(401)
                .json({ message: 'Invalid token: user ID is missing or invalid' });
        }

        if (!decoded.role) {
            return res.status(401).json({ message: 'Invalid token: role is missing' });
        }

        req.user = decoded; // Attach user data to request
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid', error: error.message });
    }
};

export default authMiddleware;

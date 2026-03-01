const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const EventLog = require('../models/EventLog');

// Log an event (Authenticated users only)
router.post('/log', authMiddleware, async (req, res, next) => {
    try {
        const { event, page, details } = req.body;

        const userModelMap = {
            admin: 'Admin',
            gym: 'Gym',
            trainer: 'Trainer',
            member: 'Member',
        };

        const eventLog = new EventLog({
            event: event || 'Page View',
            page: page || 'N/A',
            user: req.user.id,
            userModel: userModelMap[req.user.role],
            details: details || `${userModelMap[req.user.role]} visited ${page}`,
        });

        await eventLog.save();
        res.status(201).json({ message: 'Event logged' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

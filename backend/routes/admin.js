const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Gym = require('../models/Gym');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const EventLog = require('../models/EventLog');
const paginate = require('../utils/paginate');

// Get all gyms (Admin only)
router.get('/gyms', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const filter = {};
        const query = Gym.find(filter)
            .populate('members', 'name email membership')
            .populate('trainers', 'name email');
        const result = await paginate(Gym, filter, query, req);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Delete a gym (Admin only)
router.delete('/gyms/:id', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const gym = await Gym.findById(req.params.id);
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        // Remove gym association from Members and Trainers
        await Member.updateMany({ gym: gym._id }, { $unset: { gym: 1, membership: 1 } });
        await Trainer.updateMany({ gym: gym._id }, { $unset: { gym: 1 } });

        await gym.deleteOne();

        // Log the gym deletion event
        const eventLog = new EventLog({
            event: 'Gym Deletion',
            page: '/admin-dashboard',
            user: req.user.id,
            userModel: 'Admin',
            details: `Admin deleted gym ${gym.gymName}`,
        });
        await eventLog.save();

        res.json({ message: 'Gym deleted' });
    } catch (error) {
        next(error);
    }
});

// Get analytics data (Admin only)
router.get('/analytics', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        // Page Views (for bar chart)
        const pageViews = await EventLog.aggregate([
            { $match: { event: 'Page View' } },
            {
                $group: {
                    _id: '$page',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
        ]);

        // User Distribution (for pie chart)
        const userDistribution = await EventLog.aggregate([
            { $match: { event: { $in: ['Login', 'Register'] } } },
            {
                $group: {
                    _id: '$userModel',
                    count: { $sum: 1 },
                },
            },
        ]);

        // Latest 20 Events (for table)
        const events = await EventLog.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({
            pageViews,
            userDistribution,
            events,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
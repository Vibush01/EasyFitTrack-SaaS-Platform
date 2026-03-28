const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
    macroLogValidation,
    macroIdValidation,
    progressLogValidation,
    progressIdValidation,
    membershipUpdateValidation,
    workoutLogValidation,
    workoutLogIdValidation,
} = require('../validators/member.validators');
const paginate = require('../utils/paginate');
const Member = require('../models/Member');
const Gym = require('../models/Gym');
const EventLog = require('../models/EventLog');
const MembershipRequest = require('../models/MembershipRequest');
const MacroLog = require('../models/MacroLog');
const ProgressLog = require('../models/ProgressLog');
const WorkoutLog = require('../models/WorkoutLog');
const cloudinary = require('cloudinary').v2;

// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Log a macro entry (Member only)
router.post('/macros', authMiddleware, macroLogValidation, validate, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { food, macros } = req.body;

    try {
        const macroLog = new MacroLog({
            member: req.user.id,
            food,
            macros,
        });

        await macroLog.save();
        res.status(201).json({ message: 'Macro logged', macroLog });
    } catch (error) {
        next(error);
    }
});

// Get all macro logs for the member
router.get('/macros', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const filter = { member: req.user.id };
        const query = MacroLog.find(filter).sort({ date: -1 });
        const result = await paginate(MacroLog, filter, query, req);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Update a macro log
router.put(
    '/macros/:id',
    authMiddleware,
    macroIdValidation,
    macroLogValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'member') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { food, macros } = req.body;

        try {
            const macroLog = await MacroLog.findById(req.params.id);
            if (!macroLog) {
                return res.status(404).json({ message: 'Macro log not found' });
            }

            if (macroLog.member.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Not authorized to edit this log' });
            }

            macroLog.food = food;
            macroLog.macros = macros;
            await macroLog.save();

            res.json({ message: 'Macro log updated', macroLog });
        } catch (error) {
            next(error);
        }
    },
);

// Delete a macro log
router.delete(
    '/macros/:id',
    authMiddleware,
    macroIdValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'member') {
            return res.status(403).json({ message: 'Access denied' });
        }

        try {
            const macroLog = await MacroLog.findById(req.params.id);
            if (!macroLog) {
                return res.status(404).json({ message: 'Macro log not found' });
            }

            if (macroLog.member.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Not authorized to delete this log' });
            }

            await macroLog.deleteOne();
            res.json({ message: 'Macro log deleted' });
        } catch (error) {
            next(error);
        }
    },
);

// Log a progress entry (Member only)
router.post(
    '/progress',
    authMiddleware,
    upload.array('images', 3),
    progressLogValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'member') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { weight, muscleMass, fatPercentage } = req.body;

        try {
            let images = [];
            if (req.files && req.files.length > 0) {
                const uploadPromises = req.files.map(
                    (file) =>
                        new Promise((resolve, reject) => {
                            cloudinary.uploader
                                .upload_stream({ folder: 'progress_images' }, (error, result) => {
                                    if (error) reject(error);
                                    resolve(result.secure_url);
                                })
                                .end(file.buffer);
                        }),
                );
                images = await Promise.all(uploadPromises);
            }

            const progressLog = new ProgressLog({
                member: req.user.id,
                weight,
                muscleMass,
                fatPercentage,
                images,
            });

            await progressLog.save();
            res.status(201).json({ message: 'Progress logged', progressLog });
        } catch (error) {
            next(error);
        }
    },
);

// Get all progress logs for the member
router.get('/progress', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const filter = { member: req.user.id };
        const query = ProgressLog.find(filter).sort({ date: -1 });
        const result = await paginate(ProgressLog, filter, query, req);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Update a progress log
router.put(
    '/progress/:id',
    authMiddleware,
    upload.array('images', 3),
    progressIdValidation,
    progressLogValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'member') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { weight, muscleMass, fatPercentage, deleteImages } = req.body;

        try {
            const progressLog = await ProgressLog.findById(req.params.id);
            if (!progressLog) {
                return res.status(404).json({ message: 'Progress log not found' });
            }

            if (progressLog.member.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Not authorized to edit this log' });
            }

            progressLog.weight = weight;
            progressLog.muscleMass = muscleMass;
            progressLog.fatPercentage = fatPercentage;

            // Handle image deletions
            if (deleteImages) {
                const imagesToDelete = JSON.parse(deleteImages);
                for (const imageUrl of imagesToDelete) {
                    const publicId = imageUrl.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(`progress_images/${publicId}`);
                    progressLog.images = progressLog.images.filter((image) => image !== imageUrl);
                }
            }

            // Handle new image uploads
            if (req.files && req.files.length > 0) {
                const uploadPromises = req.files.map(
                    (file) =>
                        new Promise((resolve, reject) => {
                            cloudinary.uploader
                                .upload_stream({ folder: 'progress_images' }, (error, result) => {
                                    if (error) reject(error);
                                    resolve(result.secure_url);
                                })
                                .end(file.buffer);
                        }),
                );
                const uploadedImages = await Promise.all(uploadPromises);
                progressLog.images.push(...uploadedImages);
            }

            await progressLog.save();
            res.json({ message: 'Progress log updated', progressLog });
        } catch (error) {
            next(error);
        }
    },
);

// Delete a progress log
router.delete(
    '/progress/:id',
    authMiddleware,
    progressIdValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'member') {
            return res.status(403).json({ message: 'Access denied' });
        }

        try {
            const progressLog = await ProgressLog.findById(req.params.id);
            if (!progressLog) {
                return res.status(404).json({ message: 'Progress log not found' });
            }

            if (progressLog.member.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Not authorized to delete this log' });
            }

            // Delete images from Cloudinary
            if (progressLog.images && progressLog.images.length > 0) {
                for (const imageUrl of progressLog.images) {
                    const publicId = imageUrl.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(`progress_images/${publicId}`);
                }
            }

            await progressLog.deleteOne();
            res.json({ message: 'Progress log deleted' });
        } catch (error) {
            next(error);
        }
    },
);

// ─── Workout Log CRUD ─────────────────────────────────────────────

// Log a workout (Member only)
router.post(
    '/workout-log',
    authMiddleware,
    workoutLogValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'member') {
            return res.status(403).json({ message: 'Access denied' });
        }

        try {
            // Normalize to midnight UTC
            let logDate;
            if (req.body.date) {
                logDate = new Date(req.body.date);
            } else {
                logDate = new Date();
            }
            logDate.setUTCHours(0, 0, 0, 0);

            const workoutLog = new WorkoutLog({
                member: req.user.id,
                date: logDate,
                note: req.body.note || '',
            });

            await workoutLog.save();
            res.status(201).json({ message: 'Workout logged', workoutLog });
        } catch (error) {
            // Handle duplicate key error (already logged this day)
            if (error.code === 11000) {
                return res.status(409).json({ message: 'Workout already logged for this date' });
            }
            next(error);
        }
    },
);

// Get workout logs for the member (last 30 days by default)
router.get('/workout-log', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const days = Math.min(365, Math.max(1, parseInt(req.query.days) || 30));
        const since = new Date();
        since.setUTCHours(0, 0, 0, 0);
        since.setUTCDate(since.getUTCDate() - days);

        const filter = { member: req.user.id, date: { $gte: since } };
        const query = WorkoutLog.find(filter).sort({ date: -1 });
        const result = await paginate(WorkoutLog, filter, query, req);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Delete a workout log (undo)
router.delete(
    '/workout-log/:id',
    authMiddleware,
    workoutLogIdValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'member') {
            return res.status(403).json({ message: 'Access denied' });
        }

        try {
            const workoutLog = await WorkoutLog.findById(req.params.id);
            if (!workoutLog) {
                return res.status(404).json({ message: 'Workout log not found' });
            }

            if (workoutLog.member.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Not authorized to delete this log' });
            }

            await workoutLog.deleteOne();
            res.json({ message: 'Workout log deleted' });
        } catch (error) {
            next(error);
        }
    },
);

// ─── Streak Calculation ───────────────────────────────────────────

// Get workout streak stats (Member only)
router.get('/streak', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        // Fetch all logs sorted by date descending
        const logs = await WorkoutLog.find({ member: req.user.id })
            .sort({ date: -1 })
            .select('date')
            .lean();

        const totalWorkouts = logs.length;

        // Build a Set of date strings for O(1) lookup
        const loggedDates = new Set(
            logs.map((log) => {
                const d = new Date(log.date);
                return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
            }),
        );

        // Helper: get date key for a Date object
        const dateKey = (d) => `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;

        // Today at midnight UTC
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const todayLogged = loggedDates.has(dateKey(today));

        // Calculate current streak: walk backwards from today (or yesterday if today not logged)
        let currentStreak = 0;
        const cursor = new Date(today);
        if (!todayLogged) {
            cursor.setUTCDate(cursor.getUTCDate() - 1);
        }
        while (loggedDates.has(dateKey(cursor))) {
            currentStreak++;
            cursor.setUTCDate(cursor.getUTCDate() - 1);
        }

        // Calculate longest streak: scan sorted dates
        let longestStreak = 0;
        if (logs.length > 0) {
            // Sort dates ascending for sequential scan
            const sortedDates = logs
                .map((log) => {
                    const d = new Date(log.date);
                    d.setUTCHours(0, 0, 0, 0);
                    return d.getTime();
                })
                .sort((a, b) => a - b);

            // Remove duplicates (shouldn't exist due to unique index, but just in case)
            const uniqueDates = [...new Set(sortedDates)];

            let streak = 1;
            longestStreak = 1;
            const ONE_DAY = 86400000;

            for (let i = 1; i < uniqueDates.length; i++) {
                if (uniqueDates[i] - uniqueDates[i - 1] === ONE_DAY) {
                    streak++;
                    longestStreak = Math.max(longestStreak, streak);
                } else {
                    streak = 1;
                }
            }
        }

        // Last 7 days activity (for visual dots)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setUTCDate(d.getUTCDate() - i);
            last7Days.push({
                date: d.toISOString().split('T')[0],
                logged: loggedDates.has(dateKey(d)),
            });
        }

        res.json({
            currentStreak,
            longestStreak,
            totalWorkouts,
            todayLogged,
            last7Days,
        });
    } catch (error) {
        next(error);
    }
});

// Leave gym (Member only)
router.post('/leave-gym', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const member = await Member.findById(req.user.id);
        if (!member || !member.gym) {
            return res.status(404).json({ message: 'Member not found or not in a gym' });
        }

        const gym = await Gym.findById(member.gym);
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        // Remove member from gym
        gym.members = gym.members.filter((id) => id.toString() !== req.user.id);
        await gym.save();

        // Clear gym and membership from member
        member.gym = undefined;
        member.membership = undefined;
        await member.save();

        // Log the leave gym event
        const eventLog = new EventLog({
            event: 'Leave Gym',
            page: '/member-dashboard',
            user: req.user.id,
            userModel: 'Member',
            details: `Member left gym ${gym.gymName}`,
        });
        await eventLog.save();

        res.json({ message: 'Left gym successfully' });
    } catch (error) {
        next(error);
    }
});

// Request membership update (Member only)
router.post(
    '/membership-request',
    authMiddleware,
    membershipUpdateValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'member') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { requestedDuration } = req.body;

        try {
            const member = await Member.findById(req.user.id);
            if (!member || !member.gym) {
                return res.status(404).json({ message: 'Member not found or not in a gym' });
            }

            const gym = await Gym.findById(member.gym);
            if (!gym) {
                return res.status(404).json({ message: 'Gym not found' });
            }

            const existingRequest = await MembershipRequest.findOne({
                member: req.user.id,
                gym: member.gym,
                status: 'pending',
            });
            if (existingRequest) {
                return res
                    .status(400)
                    .json({ message: 'You already have a pending membership request' });
            }

            const membershipRequest = new MembershipRequest({
                member: req.user.id,
                gym: member.gym,
                requestedDuration,
            });

            await membershipRequest.save();

            // Log the membership request event
            const eventLog = new EventLog({
                event: 'Membership Request',
                page: '/membership-update',
                user: req.user.id,
                userModel: 'Member',
                details: `Member requested membership update to ${requestedDuration}`,
            });
            await eventLog.save();

            res.status(201).json({ message: 'Membership request sent', membershipRequest });
        } catch (error) {
            next(error);
        }
    },
);

// Get membership requests for a Member
router.get('/membership-requests', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const member = await Member.findById(req.user.id);
        if (!member || !member.gym) {
            return res.status(404).json({ message: 'Member not found or not in a gym' });
        }

        const filter = { member: req.user.id };
        const query = MembershipRequest.find(filter)
            .populate('gym', 'gymName')
            .sort({ createdAt: -1 });
        const result = await paginate(MembershipRequest, filter, query, req);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = router;

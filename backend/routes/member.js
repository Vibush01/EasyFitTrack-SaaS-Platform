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
    scheduleValidation,
} = require('../validators/member.validators');
const paginate = require('../utils/paginate');
const Member = require('../models/Member');
const Gym = require('../models/Gym');
const EventLog = require('../models/EventLog');
const MembershipRequest = require('../models/MembershipRequest');
const MacroLog = require('../models/MacroLog');
const ProgressLog = require('../models/ProgressLog');
const WorkoutLog = require('../models/WorkoutLog');
const WorkoutSession = require('../models/WorkoutSession');
const WorkoutPlan = require('../models/WorkoutPlan');
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

// ─── Workout Schedule ─────────────────────────────────────────────

// Update workout schedule (Member only)
router.put('/schedule', authMiddleware, scheduleValidation, validate, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const member = await Member.findById(req.user.id);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        member.workoutSchedule = req.body.workoutSchedule;
        await member.save();

        res.json({ message: 'Workout schedule updated', workoutSchedule: member.workoutSchedule });
    } catch (error) {
        next(error);
    }
});

// Get workout schedule (Member only)
router.get('/schedule', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const member = await Member.findById(req.user.id).select('workoutSchedule').lean();
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        res.json({ workoutSchedule: member.workoutSchedule });
    } catch (error) {
        next(error);
    }
});

// ─── Streak Calculation (Schedule-Aware) ──────────────────────────

// Get workout streak stats (Member only)
router.get('/streak', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        // Fetch member schedule
        const member = await Member.findById(req.user.id).select('workoutSchedule').lean();
        const schedule = new Set(member?.workoutSchedule ?? [0, 1, 2, 3, 4, 5, 6]);

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

        // Helper: check if a date is a scheduled gym day
        const isGymDay = (d) => schedule.has(d.getUTCDay());

        // Today at midnight UTC
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const todayLogged = loggedDates.has(dateKey(today));
        const todayIsGymDay = isGymDay(today);

        // ── Current Streak (schedule-aware) ──
        // Walk backwards. Rest days are skipped (streak stays).
        // Gym days must be logged or streak breaks.
        // Bonus: working out on a rest day also counts as +1.
        let currentStreak = 0;
        const cursor = new Date(today);

        // If today is a gym day and not yet logged, start from yesterday
        if (todayIsGymDay && !todayLogged) {
            cursor.setUTCDate(cursor.getUTCDate() - 1);
        }
        // If today is a rest day and not logged, start from yesterday
        else if (!todayIsGymDay && !todayLogged) {
            cursor.setUTCDate(cursor.getUTCDate() - 1);
        }

        // Walk backwards up to 365 days max
        const maxLookback = 365;
        let daysChecked = 0;

        while (daysChecked < maxLookback) {
            const logged = loggedDates.has(dateKey(cursor));
            const gymDay = isGymDay(cursor);

            if (gymDay) {
                // Must be logged on a gym day
                if (logged) {
                    currentStreak++;
                } else {
                    break; // Missed a gym day → streak broken
                }
            } else {
                // Rest day: if they logged anyway, bonus +1; otherwise just skip
                if (logged) {
                    currentStreak++;
                }
                // else: rest day not logged → streak continues, no penalty
            }

            cursor.setUTCDate(cursor.getUTCDate() - 1);
            daysChecked++;
        }

        // ── Longest Streak (schedule-aware) ──
        let longestStreak = 0;
        if (logs.length > 0) {
            // Build sorted unique timestamps ascending
            const sortedTimestamps = [
                ...new Set(
                    logs.map((log) => {
                        const d = new Date(log.date);
                        d.setUTCHours(0, 0, 0, 0);
                        return d.getTime();
                    }),
                ),
            ].sort((a, b) => a - b);

            let streak = 1;
            longestStreak = 1;
            const ONE_DAY = 86400000;

            for (let i = 1; i < sortedTimestamps.length; i++) {
                const prev = new Date(sortedTimestamps[i - 1]);
                const curr = new Date(sortedTimestamps[i]);
                const gap = sortedTimestamps[i] - sortedTimestamps[i - 1];

                if (gap === ONE_DAY) {
                    // Consecutive days
                    streak++;
                } else {
                    // Check if all days in the gap are rest days
                    let allRestDays = true;
                    const check = new Date(prev);
                    check.setUTCDate(check.getUTCDate() + 1);
                    while (check.getTime() < curr.getTime()) {
                        if (isGymDay(check)) {
                            allRestDays = false;
                            break;
                        }
                        check.setUTCDate(check.getUTCDate() + 1);
                    }
                    if (allRestDays) {
                        streak++;
                    } else {
                        streak = 1;
                    }
                }
                longestStreak = Math.max(longestStreak, streak);
            }
        }

        // Last 7 days activity (for visual dots) — includes rest-day info
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setUTCDate(d.getUTCDate() - i);
            last7Days.push({
                date: d.toISOString().split('T')[0],
                logged: loggedDates.has(dateKey(d)),
                isRestDay: !isGymDay(d),
            });
        }

        res.json({
            currentStreak,
            longestStreak,
            totalWorkouts,
            todayLogged,
            todayIsGymDay,
            workoutSchedule: member?.workoutSchedule ?? [0, 1, 2, 3, 4, 5, 6],
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

// ─── Workout Sessions (Interactive Checklist) ────────────────────

// GET today's session(s) for the member, optionally filtered by planId
router.get('/workout-sessions', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const filter = { member: req.user.id };
        if (req.query.planId) filter.workoutPlan = req.query.planId;

        const sessions = await WorkoutSession.find(filter).sort({ date: -1 }).lean();
        res.json(sessions);
    } catch (error) {
        next(error);
    }
});

// POST: create or return today's session for a given workout plan
router.post('/workout-sessions', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { planId } = req.body;
    if (!planId) return res.status(400).json({ message: 'planId is required' });

    try {
        // Verify the plan belongs to this member
        const plan = await WorkoutPlan.findById(planId);
        if (!plan || plan.member.toString() !== req.user.id) {
            return res.status(404).json({ message: 'Workout plan not found' });
        }

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        // Upsert: return existing session if one already exists for today
        let session = await WorkoutSession.findOne({
            member: req.user.id,
            workoutPlan: planId,
            date: today,
        });

        if (!session) {
            session = await WorkoutSession.create({
                member: req.user.id,
                workoutPlan: planId,
                date: today,
                completedExercises: [],
                status: 'in_progress',
            });
        }

        res.status(201).json(session);
    } catch (error) {
        next(error);
    }
});

// PUT: update completedExercises; auto-complete + auto-log streak when all done
router.put('/workout-sessions/:id', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { completedExercises } = req.body;
    if (!Array.isArray(completedExercises)) {
        return res.status(400).json({ message: 'completedExercises must be an array of indices' });
    }

    try {
        const session = await WorkoutSession.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });
        if (session.member.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Fetch the plan to know total exercises count
        const plan = await WorkoutPlan.findById(session.workoutPlan);
        if (!plan) return res.status(404).json({ message: 'Workout plan not found' });

        session.completedExercises = completedExercises;

        const allDone = completedExercises.length >= plan.exercises.length;
        if (allDone && session.status !== 'completed') {
            session.status = 'completed';

            // Auto-log workout for the streak (idempotent — ignore duplicate)
            const logDate = new Date(session.date);
            logDate.setUTCHours(0, 0, 0, 0);
            const existing = await WorkoutLog.findOne({ member: req.user.id, date: logDate });
            if (!existing) {
                await WorkoutLog.create({
                    member: req.user.id,
                    date: logDate,
                    note: `Completed: ${plan.title}`,
                });
            }
        }

        await session.save();
        res.json({ session, streakLogged: allDone });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

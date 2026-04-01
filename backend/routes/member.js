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
const CustomWorkout = require('../models/CustomWorkout');
const DailyLog = require('../models/DailyLog');
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

        const { weight, muscleMass, fatPercentage, lifts } = req.body;

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

            // Parse lifts — might arrive as JSON string from FormData
            let parsedLifts = [];
            if (lifts) {
                parsedLifts = typeof lifts === 'string' ? JSON.parse(lifts) : lifts;
            }

            const progressLog = new ProgressLog({
                member: req.user.id,
                weight: weight || null,
                muscleMass: muscleMass || null,
                fatPercentage: fatPercentage || null,
                images,
                lifts: parsedLifts,
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

// Get 1RM time-series data (strength tracking)
router.get('/1rm', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }
    try {
        const { exercise } = req.query; // optional: 'squat','bench','deadlift','ohp'
        // Fetch only logs that contain lifts, sorted by date ascending
        const logs = await ProgressLog.find({
            member: req.user.id,
            'lifts.0': { $exists: true }, // only docs with at least one lift
        })
            .sort({ date: 1 })
            .select('date lifts')
            .lean();

        // Build a per-exercise time-series
        const series = {}; // { squat: [{ date, weight1RM }], bench: [...] }
        for (const log of logs) {
            for (const lift of log.lifts) {
                const key =
                    lift.exercise === 'custom' ? lift.customName || 'custom' : lift.exercise;
                if (exercise && key !== exercise) continue; // filter if requested
                if (!series[key]) series[key] = [];
                series[key].push({ date: log.date, weight1RM: lift.weight1RM });
            }
        }

        // Compute PRs per exercise
        const prs = {};
        for (const [key, entries] of Object.entries(series)) {
            const best = entries.reduce(
                (max, e) => (e.weight1RM > max.weight1RM ? e : max),
                entries[0],
            );
            prs[key] = best;
        }

        res.json({ series, prs });
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

// ─── Custom (Self-Directed) Workouts ─────────────────────────

// GET: fetch all custom workouts for the member (optionally filter by ?date=YYYY-MM-DD)
router.get('/custom-workouts', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const filter = { member: req.user.id };

        if (req.query.date) {
            const d = new Date(req.query.date);
            d.setUTCHours(0, 0, 0, 0);
            const dEnd = new Date(d);
            dEnd.setUTCDate(dEnd.getUTCDate() + 1);
            filter.date = { $gte: d, $lt: dEnd };
        }

        const workouts = await CustomWorkout.find(filter).sort({ createdAt: -1 }).lean();
        res.json(workouts);
    } catch (error) {
        next(error);
    }
});

// POST: create a new custom workout for today
router.post('/custom-workouts', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { title, exercises } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ message: 'Title is required' });
    }
    if (!Array.isArray(exercises) || exercises.length === 0) {
        return res.status(400).json({ message: 'At least one exercise is required' });
    }

    try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const workout = await CustomWorkout.create({
            member: req.user.id,
            title: title.trim(),
            date: today,
            exercises,
            completedExercises: [],
            status: 'in_progress',
        });

        res.status(201).json(workout);
    } catch (error) {
        next(error);
    }
});

// PUT: update completedExercises (checklist) OR update title/exercises (edit mode)
// ─ If 'completedExercises' is present  → checklist progress update + auto-streak
// ─ If 'title' or 'exercises' is present → edit the workout definition; reset checklist
router.put('/custom-workouts/:id', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { completedExercises, title, exercises } = req.body;
    const isEditMode = title !== undefined || exercises !== undefined;

    try {
        const workout = await CustomWorkout.findById(req.params.id);
        if (!workout) return res.status(404).json({ message: 'Custom workout not found' });
        if (workout.member.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // ── EDIT MODE: update definition ─────────────────────────────
        if (isEditMode) {
            if (title !== undefined) {
                if (!title.trim())
                    return res.status(400).json({ message: 'Title cannot be empty' });
                workout.title = title.trim();
            }
            if (exercises !== undefined) {
                if (!Array.isArray(exercises) || exercises.length === 0) {
                    return res.status(400).json({ message: 'At least one exercise is required' });
                }
                workout.exercises = exercises;
                // Reset checklist so indices stay valid after exercise list changes
                workout.completedExercises = [];
                workout.status = 'in_progress';
            }
            await workout.save();
            return res.json({ workout, streakLogged: false });
        }

        // ── CHECKLIST MODE: update progress ──────────────────────────
        if (!Array.isArray(completedExercises)) {
            return res
                .status(400)
                .json({ message: 'completedExercises must be an array of indices' });
        }

        workout.completedExercises = completedExercises;

        const allDone = completedExercises.length >= workout.exercises.length;
        if (allDone && workout.status !== 'completed') {
            workout.status = 'completed';

            // Auto-log workout for the streak (idempotent)
            const logDate = new Date(workout.date);
            logDate.setUTCHours(0, 0, 0, 0);
            const existing = await WorkoutLog.findOne({ member: req.user.id, date: logDate });
            if (!existing) {
                await WorkoutLog.create({
                    member: req.user.id,
                    date: logDate,
                    note: `Custom workout: ${workout.title}`,
                });
            }
        }

        await workout.save();
        res.json({ workout, streakLogged: allDone });
    } catch (error) {
        next(error);
    }
});

// DELETE: remove a custom workout
router.delete('/custom-workouts/:id', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const workout = await CustomWorkout.findById(req.params.id);
        if (!workout) return res.status(404).json({ message: 'Custom workout not found' });
        if (workout.member.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await workout.deleteOne();
        res.json({ message: 'Custom workout deleted' });
    } catch (error) {
        next(error);
    }
});

// ─── Workout Templates (reusable custom plans) ───────────────────

router.get('/workout-templates', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') return res.status(403).json({ message: 'Access denied' });
    try {
        const templates = await CustomWorkout.find({ member: req.user.id, isTemplate: true })
            .sort({ createdAt: -1 })
            .lean();
        res.json(templates);
    } catch (err) {
        next(err);
    }
});

router.post('/workout-templates', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') return res.status(403).json({ message: 'Access denied' });
    const { title, exercises } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });
    if (!Array.isArray(exercises) || exercises.length === 0)
        return res.status(400).json({ message: 'At least one exercise is required' });
    try {
        const template = await CustomWorkout.create({
            member: req.user.id,
            title: title.trim(),
            isTemplate: true,
            date: null,
            exercises,
            completedExercises: [],
            status: 'in_progress',
        });
        res.status(201).json(template);
    } catch (err) {
        next(err);
    }
});

router.put('/workout-templates/:id', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') return res.status(403).json({ message: 'Access denied' });
    const { title, exercises } = req.body;
    try {
        const template = await CustomWorkout.findById(req.params.id);
        if (!template || !template.isTemplate)
            return res.status(404).json({ message: 'Template not found' });
        if (template.member.toString() !== req.user.id)
            return res.status(403).json({ message: 'Not authorized' });
        if (title) template.title = title.trim();
        if (exercises) template.exercises = exercises;
        await template.save();
        res.json(template);
    } catch (err) {
        next(err);
    }
});

router.delete('/workout-templates/:id', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') return res.status(403).json({ message: 'Access denied' });
    try {
        const template = await CustomWorkout.findById(req.params.id);
        if (!template || !template.isTemplate)
            return res.status(404).json({ message: 'Template not found' });
        if (template.member.toString() !== req.user.id)
            return res.status(403).json({ message: 'Not authorized' });
        await template.deleteOne();
        res.json({ message: 'Template deleted' });
    } catch (err) {
        next(err);
    }
});

// ─── Daily Logs (Today's Workout Hub) ───────────────────────

// GET history of past completed logs (must be before /:id route)
router.get('/daily-logs/history', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') return res.status(403).json({ message: 'Access denied' });
    try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const page = parseInt(req.query.page) || 1;
        const limit = 25;
        const logs = await DailyLog.find({ member: req.user.id, date: { $lt: today } })
            .sort({ date: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        res.json(logs);
    } catch (err) {
        next(err);
    }
});

// GET today's (or any date's) logs
router.get('/daily-logs', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') return res.status(403).json({ message: 'Access denied' });
    try {
        const dateStr = req.query.date || new Date().toISOString().split('T')[0];
        const d = new Date(dateStr);
        d.setUTCHours(0, 0, 0, 0);
        const dEnd = new Date(d);
        dEnd.setUTCDate(dEnd.getUTCDate() + 1);
        const logs = await DailyLog.find({ member: req.user.id, date: { $gte: d, $lt: dEnd } })
            .sort({ createdAt: 1 })
            .lean();
        res.json(logs);
    } catch (err) {
        next(err);
    }
});

// POST: opt a plan/template into today's workout
router.post('/daily-logs', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') return res.status(403).json({ message: 'Access denied' });
    const { sourceType, sourcePlanId, sourceTemplateId } = req.body;
    if (!['trainer_plan', 'custom_template'].includes(sourceType)) {
        return res.status(400).json({ message: 'Invalid sourceType' });
    }
    try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        let title, exercises, dupFilter;

        if (sourceType === 'trainer_plan') {
            if (!sourcePlanId) return res.status(400).json({ message: 'sourcePlanId required' });
            const plan = await WorkoutPlan.findById(sourcePlanId);
            if (!plan || plan.member.toString() !== req.user.id)
                return res.status(404).json({ message: 'Plan not found' });
            title = plan.title;
            exercises = plan.exercises.map((e) => ({
                name: e.name,
                sets: e.sets,
                reps: e.reps,
                rest: e.rest || '',
            }));
            dupFilter = { member: req.user.id, sourcePlanId, date: today };
        } else {
            if (!sourceTemplateId)
                return res.status(400).json({ message: 'sourceTemplateId required' });
            const tmpl = await CustomWorkout.findById(sourceTemplateId);
            if (!tmpl || !tmpl.isTemplate || tmpl.member.toString() !== req.user.id)
                return res.status(404).json({ message: 'Template not found' });
            title = tmpl.title;
            exercises = tmpl.exercises.map((e) => ({
                name: e.name,
                sets: e.sets,
                reps: e.reps,
                rest: e.rest || '',
            }));
            dupFilter = { member: req.user.id, sourceTemplateId, date: today };
        }

        // Idempotent: return existing log if already opted today
        const existing = await DailyLog.findOne(dupFilter);
        if (existing) return res.status(200).json(existing);

        const log = await DailyLog.create({
            member: req.user.id,
            date: today,
            sourceType,
            sourcePlanId: sourcePlanId || null,
            sourceTemplateId: sourceTemplateId || null,
            title,
            exercises,
            completedExercises: [],
            status: 'in_progress',
        });
        res.status(201).json(log);
    } catch (err) {
        next(err);
    }
});

// PUT: update completedExercises; auto-complete + auto-streak when all done
router.put('/daily-logs/:id', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') return res.status(403).json({ message: 'Access denied' });
    const { completedExercises } = req.body;
    if (!Array.isArray(completedExercises))
        return res.status(400).json({ message: 'completedExercises must be an array' });
    try {
        const log = await DailyLog.findById(req.params.id);
        if (!log) return res.status(404).json({ message: 'Log not found' });
        if (log.member.toString() !== req.user.id)
            return res.status(403).json({ message: 'Not authorized' });

        log.completedExercises = completedExercises;
        const allDone = completedExercises.length >= log.exercises.length;
        if (allDone && log.status !== 'completed') {
            log.status = 'completed';
            const logDate = new Date(log.date);
            logDate.setUTCHours(0, 0, 0, 0);
            const existing = await WorkoutLog.findOne({ member: req.user.id, date: logDate });
            if (!existing) {
                await WorkoutLog.create({
                    member: req.user.id,
                    date: logDate,
                    note: `Completed: ${log.title}`,
                });
            }
        }
        await log.save();
        res.json({ log, streakLogged: allDone });
    } catch (err) {
        next(err);
    }
});

// DELETE: remove an in-progress log from today
router.delete('/daily-logs/:id', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') return res.status(403).json({ message: 'Access denied' });
    try {
        const log = await DailyLog.findById(req.params.id);
        if (!log) return res.status(404).json({ message: 'Log not found' });
        if (log.member.toString() !== req.user.id)
            return res.status(403).json({ message: 'Not authorized' });
        if (log.status === 'completed')
            return res.status(400).json({ message: 'Cannot remove a completed workout' });
        await log.deleteOne();
        res.json({ message: 'Removed from today' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
    workoutPlanValidation,
    workoutPlanUpdateValidation,
    dietPlanValidation,
    dietPlanUpdateValidation,
    planIdValidation,
    scheduleValidation,
    scheduleUpdateValidation,
    scheduleIdValidation,
    planRequestValidation,
    planRequestActionValidation,
    trainerScheduleValidation,
    bookSessionValidation,
    coachingRequestValidation,
    coachingRequestActionValidation,
} = require('../validators/trainer.validators');
const paginate = require('../utils/paginate');
const WorkoutPlan = require('../models/WorkoutPlan');
const WorkoutSchedule = require('../models/WorkoutSchedule');
const PlanRequest = require('../models/PlanRequest');
const DietPlan = require('../models/DietPlan');
const TrainerSchedule = require('../models/TrainerSchedule');
const Trainer = require('../models/Trainer');
const Member = require('../models/Member');
const Gym = require('../models/Gym');
const CoachingRequest = require('../models/CoachingRequest');

// ─── Trainer Discovery ──────────────────────────────────────────
// GET /trainer/browse — public list of trainers for members to discover
router.get('/browse', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Only members can browse trainers' });
    }

    try {
        const { search } = req.query;
        const filter = {};
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        const trainers = await Trainer.find(filter)
            .select('name email profileImage experienceYears experienceMonths gym personalClients')
            .populate('gym', 'gymName address')
            .lean();

        // Add metadata without exposing sensitive data
        const result = trainers.map((t) => ({
            _id: t._id,
            name: t.name,
            email: t.email,
            profileImage: t.profileImage,
            experienceYears: t.experienceYears,
            experienceMonths: t.experienceMonths,
            gym: t.gym, // { _id, gymName, address } or null
            personalClientCount: t.personalClients?.length || 0,
        }));

        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Create a workout plan (Trainer only — supports both gym and personal clients)
router.post(
    '/workout-plans',
    authMiddleware,
    workoutPlanValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'trainer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { memberId, title, description, exercises, clientType } = req.body;

        try {
            const trainer = await Trainer.findById(req.user.id);
            if (!trainer) {
                return res.status(404).json({ message: 'Trainer not found' });
            }

            const member = await Member.findById(memberId);
            if (!member) {
                return res.status(404).json({ message: 'Member not found' });
            }

            let planGym = null;
            let planClientType = 'gym';

            if (clientType === 'personal') {
                // Personal client — verify they are in trainer's personalClients
                if (!trainer.personalClients.map((id) => id.toString()).includes(memberId)) {
                    return res
                        .status(403)
                        .json({ message: 'This member is not your personal client' });
                }
                planClientType = 'personal';
            } else {
                // Gym client — verify same gym
                if (!trainer.gym) {
                    return res.status(400).json({
                        message: 'You are not associated with a gym. Set clientType to personal.',
                    });
                }
                if (!member.gym || member.gym.toString() !== trainer.gym.toString()) {
                    return res
                        .status(404)
                        .json({ message: 'Member not found or not in the same gym' });
                }
                planGym = trainer.gym;
            }

            const workoutPlan = new WorkoutPlan({
                trainer: req.user.id,
                member: memberId,
                gym: planGym,
                clientType: planClientType,
                title,
                description,
                exercises,
            });

            await workoutPlan.save();

            // Update plan request status to fulfilled if applicable
            const planRequest = await PlanRequest.findOne({
                member: memberId,
                trainer: req.user.id,
                requestType: 'workout',
                status: 'approved',
            });
            if (planRequest) {
                planRequest.status = 'fulfilled';
                await planRequest.save();
            }

            res.status(201).json({ message: 'Workout plan created', workoutPlan });
        } catch (error) {
            next(error);
        }
    },
);

// Get all workout plans created by the trainer
router.get('/workout-plans', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'trainer') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const filter = { trainer: req.user.id };
        const query = WorkoutPlan.find(filter)
            .populate('member', 'name email')
            .sort({ createdAt: -1 });
        const result = await paginate(WorkoutPlan, filter, query, req);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Update a workout plan (Trainer only)
router.put(
    '/workout-plans/:id',
    authMiddleware,
    workoutPlanUpdateValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'trainer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { title, description, exercises } = req.body;

        try {
            const workoutPlan = await WorkoutPlan.findById(req.params.id);
            if (!workoutPlan) {
                return res.status(404).json({ message: 'Workout plan not found' });
            }

            if (workoutPlan.trainer.toString() !== req.user.id) {
                return res
                    .status(403)
                    .json({ message: 'Not authorized to edit this workout plan' });
            }

            workoutPlan.title = title;
            workoutPlan.description = description;
            workoutPlan.exercises = exercises;
            workoutPlan.updatedAt = Date.now();

            await workoutPlan.save();
            res.json({ message: 'Workout plan updated', workoutPlan });
        } catch (error) {
            next(error);
        }
    },
);

// Delete a workout plan (Trainer only)
router.delete(
    '/workout-plans/:id',
    authMiddleware,
    planIdValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'trainer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        try {
            const workoutPlan = await WorkoutPlan.findById(req.params.id);
            if (!workoutPlan) {
                return res.status(404).json({ message: 'Workout plan not found' });
            }

            if (workoutPlan.trainer.toString() !== req.user.id) {
                return res
                    .status(403)
                    .json({ message: 'Not authorized to delete this workout plan' });
            }

            // Delete associated schedules
            await WorkoutSchedule.deleteMany({ workoutPlan: req.params.id });

            await workoutPlan.deleteOne();
            res.json({ message: 'Workout plan deleted' });
        } catch (error) {
            next(error);
        }
    },
);

// Create a diet plan (Trainer only — supports both gym and personal clients)
router.post('/diet-plans', authMiddleware, dietPlanValidation, validate, async (req, res, next) => {
    if (req.user.role !== 'trainer') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { memberId, title, description, meals, clientType } = req.body;

    try {
        const trainer = await Trainer.findById(req.user.id);
        if (!trainer) {
            return res.status(404).json({ message: 'Trainer not found' });
        }

        const member = await Member.findById(memberId);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        let planGym = null;
        let planClientType = 'gym';

        if (clientType === 'personal') {
            if (!trainer.personalClients.map((id) => id.toString()).includes(memberId)) {
                return res.status(403).json({ message: 'This member is not your personal client' });
            }
            planClientType = 'personal';
        } else {
            if (!trainer.gym) {
                return res.status(400).json({
                    message: 'You are not associated with a gym. Set clientType to personal.',
                });
            }
            if (!member.gym || member.gym.toString() !== trainer.gym.toString()) {
                return res.status(404).json({ message: 'Member not found or not in the same gym' });
            }
            planGym = trainer.gym;
        }

        const dietPlan = new DietPlan({
            trainer: req.user.id,
            member: memberId,
            gym: planGym,
            clientType: planClientType,
            title,
            description,
            meals,
        });

        await dietPlan.save();

        // Update plan request status to fulfilled if applicable
        const planRequest = await PlanRequest.findOne({
            member: memberId,
            trainer: req.user.id,
            requestType: 'diet',
            status: 'approved',
        });
        if (planRequest) {
            planRequest.status = 'fulfilled';
            await planRequest.save();
        }

        res.status(201).json({ message: 'Diet plan created', dietPlan });
    } catch (error) {
        next(error);
    }
});

// Get all diet plans created by the trainer
router.get('/diet-plans', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'trainer') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const filter = { trainer: req.user.id };
        const query = DietPlan.find(filter)
            .populate('member', 'name email')
            .sort({ createdAt: -1 });
        const result = await paginate(DietPlan, filter, query, req);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Update a diet plan (Trainer only)
router.put(
    '/diet-plans/:id',
    authMiddleware,
    dietPlanUpdateValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'trainer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { title, description, meals } = req.body;

        try {
            const dietPlan = await DietPlan.findById(req.params.id);
            if (!dietPlan) {
                return res.status(404).json({ message: 'Diet plan not found' });
            }

            if (dietPlan.trainer.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Not authorized to edit this diet plan' });
            }

            dietPlan.title = title;
            dietPlan.description = description;
            dietPlan.meals = meals;
            dietPlan.updatedAt = Date.now();

            await dietPlan.save();
            res.json({ message: 'Diet plan updated', dietPlan });
        } catch (error) {
            next(error);
        }
    },
);

// Delete a diet plan (Trainer only)
router.delete(
    '/diet-plans/:id',
    authMiddleware,
    planIdValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'trainer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        try {
            const dietPlan = await DietPlan.findById(req.params.id);
            if (!dietPlan) {
                return res.status(404).json({ message: 'Diet plan not found' });
            }

            if (dietPlan.trainer.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Not authorized to delete this diet plan' });
            }

            await dietPlan.deleteOne();
            res.json({ message: 'Diet plan deleted' });
        } catch (error) {
            next(error);
        }
    },
);

// Schedule a workout session (Trainer only)
router.post('/schedules', authMiddleware, scheduleValidation, validate, async (req, res, next) => {
    if (req.user.role !== 'trainer') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { workoutPlanId, memberId, dateTime } = req.body;

    try {
        const trainer = await Trainer.findById(req.user.id);
        if (!trainer || !trainer.gym) {
            return res
                .status(404)
                .json({ message: 'Trainer not found or not associated with a gym' });
        }

        const member = await Member.findById(memberId);
        if (!member || member.gym.toString() !== trainer.gym.toString()) {
            return res.status(404).json({ message: 'Member not found or not in the same gym' });
        }

        const workoutPlan = await WorkoutPlan.findById(workoutPlanId);
        if (!workoutPlan || workoutPlan.trainer.toString() !== req.user.id) {
            return res
                .status(404)
                .json({ message: 'Workout plan not found or not created by this trainer' });
        }

        const workoutSchedule = new WorkoutSchedule({
            trainer: req.user.id,
            member: memberId,
            gym: trainer.gym,
            workoutPlan: workoutPlanId,
            dateTime: new Date(dateTime),
        });

        await workoutSchedule.save();
        res.status(201).json({ message: 'Workout session scheduled', workoutSchedule });
    } catch (error) {
        next(error);
    }
});

// Get all schedules created by the trainer (legacy)
router.get('/schedules', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'trainer') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const schedules = await WorkoutSchedule.find({ trainer: req.user.id })
            .populate('member', 'name email')
            .populate('workoutPlan', 'title')
            .sort({ dateTime: 1 });
        res.json(schedules);
    } catch (error) {
        next(error);
    }
});

// Update a workout schedule (legacy)
router.put(
    '/schedules/:id',
    authMiddleware,
    scheduleUpdateValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'trainer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { dateTime } = req.body;

        try {
            const workoutSchedule = await WorkoutSchedule.findById(req.params.id);
            if (!workoutSchedule) {
                return res.status(404).json({ message: 'Workout schedule not found' });
            }

            if (workoutSchedule.trainer.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Not authorized to edit this schedule' });
            }

            workoutSchedule.dateTime = new Date(dateTime);
            await workoutSchedule.save();

            res.json({ message: 'Workout schedule updated', workoutSchedule });
        } catch (error) {
            next(error);
        }
    },
);

// Delete a workout schedule (legacy)
router.delete(
    '/schedules/:id',
    authMiddleware,
    scheduleIdValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'trainer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        try {
            const workoutSchedule = await WorkoutSchedule.findById(req.params.id);
            if (!workoutSchedule) {
                return res.status(404).json({ message: 'Workout schedule not found' });
            }

            if (workoutSchedule.trainer.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Not authorized to delete this schedule' });
            }

            await workoutSchedule.deleteOne();
            res.json({ message: 'Workout schedule deleted' });
        } catch (error) {
            next(error);
        }
    },
);

// Get workout plans for a Member
router.get('/member/workout-plans', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const workoutPlans = await WorkoutPlan.find({ member: req.user.id })
            .populate('trainer', 'name email')
            .sort({ createdAt: -1 });
        res.json(workoutPlans);
    } catch (error) {
        next(error);
    }
});

// Get diet plans for a Member
router.get('/member/diet-plans', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const dietPlans = await DietPlan.find({ member: req.user.id })
            .populate('trainer', 'name email')
            .sort({ createdAt: -1 });
        res.json(dietPlans);
    } catch (error) {
        next(error);
    }
});

// Get workout schedules for a Member (legacy)
router.get('/member/schedules', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const schedules = await WorkoutSchedule.find({ member: req.user.id })
            .populate('trainer', 'name email')
            .populate('workoutPlan', 'title description exercises')
            .sort({ dateTime: 1 });
        res.json(schedules);
    } catch (error) {
        next(error);
    }
});

// Request a workout or diet plan (Member only)
router.post(
    '/plan-requests',
    authMiddleware,
    planRequestValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'member') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { trainerId, requestType } = req.body;

        try {
            const member = await Member.findById(req.user.id);
            if (!member || !member.gym) {
                return res
                    .status(404)
                    .json({ message: 'Member not found or not associated with a gym' });
            }

            const trainer = await Trainer.findById(trainerId);
            if (!trainer || trainer.gym.toString() !== member.gym.toString()) {
                return res
                    .status(404)
                    .json({ message: 'Trainer not found or not in the same gym' });
            }

            const existingRequest = await PlanRequest.findOne({
                member: req.user.id,
                trainer: trainerId,
                requestType,
                status: 'pending',
            });
            if (existingRequest) {
                return res.status(400).json({
                    message: 'You already have a pending request of this type with this trainer',
                });
            }

            const planRequest = new PlanRequest({
                member: req.user.id,
                trainer: trainerId,
                gym: member.gym,
                requestType,
            });

            await planRequest.save();
            res.status(201).json({ message: 'Plan request sent', planRequest });
        } catch (error) {
            next(error);
        }
    },
);

// Get all plan requests for a Member
router.get('/member/plan-requests', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const filter = { member: req.user.id };
        const query = PlanRequest.find(filter)
            .populate('trainer', 'name email')
            .populate('gym', 'gymName')
            .sort({ createdAt: -1 });
        const result = await paginate(PlanRequest, filter, query, req);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Get all plan requests for a Trainer
router.get('/plan-requests', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'trainer') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const filter = { trainer: req.user.id };
        const query = PlanRequest.find(filter)
            .populate('member', 'name email')
            .populate('gym', 'gymName')
            .sort({ createdAt: -1 });
        const result = await paginate(PlanRequest, filter, query, req);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Approve or deny a plan request (Trainer only)
router.post(
    '/plan-requests/:id/action',
    authMiddleware,
    planRequestActionValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'trainer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { action } = req.body;

        try {
            const planRequest = await PlanRequest.findById(req.params.id);
            if (!planRequest) {
                return res.status(404).json({ message: 'Plan request not found' });
            }

            if (planRequest.trainer.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Not authorized to manage this request' });
            }

            if (planRequest.status !== 'pending') {
                return res.status(400).json({ message: 'Request has already been processed' });
            }

            planRequest.status = action === 'approve' ? 'approved' : 'denied';
            await planRequest.save();

            res.json({ message: `Plan request ${action}d`, planRequest });
        } catch (error) {
            next(error);
        }
    },
);

// Post a free schedule slot (Trainer only)
router.post(
    '/trainer-schedules',
    authMiddleware,
    trainerScheduleValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'trainer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { startTime, endTime } = req.body;

        try {
            const trainer = await Trainer.findById(req.user.id);
            if (!trainer || !trainer.gym) {
                return res
                    .status(404)
                    .json({ message: 'Trainer not found or not associated with a gym' });
            }

            const start = new Date(startTime);
            const end = new Date(endTime);
            if (start >= end) {
                return res.status(400).json({ message: 'End time must be after start time' });
            }

            const overlappingSchedule = await TrainerSchedule.findOne({
                trainer: req.user.id,
                $or: [
                    { startTime: { $lt: end, $gte: start } },
                    { endTime: { $gt: start, $lte: end } },
                ],
            });
            if (overlappingSchedule) {
                return res
                    .status(400)
                    .json({ message: 'This time slot overlaps with an existing schedule' });
            }

            const trainerSchedule = new TrainerSchedule({
                trainer: req.user.id,
                gym: trainer.gym,
                startTime: start,
                endTime: end,
            });

            await trainerSchedule.save();
            res.status(201).json({ message: 'Schedule slot posted', trainerSchedule });
        } catch (error) {
            next(error);
        }
    },
);

// Get all free schedule slots for a Trainer
router.get('/trainer-schedules', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'trainer') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const schedules = await TrainerSchedule.find({ trainer: req.user.id })
            .populate('bookedBy', 'name email')
            .sort({ startTime: 1 });
        res.json(schedules);
    } catch (error) {
        next(error);
    }
});

// Delete a free schedule slot (Trainer only)
router.delete(
    '/trainer-schedules/:id',
    authMiddleware,
    scheduleIdValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'trainer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        try {
            const schedule = await TrainerSchedule.findById(req.params.id);
            if (!schedule) {
                return res.status(404).json({ message: 'Schedule slot not found' });
            }

            if (schedule.trainer.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Not authorized to delete this schedule' });
            }

            if (schedule.status === 'booked') {
                return res.status(400).json({ message: 'Cannot delete a booked schedule slot' });
            }

            await schedule.deleteOne();
            res.json({ message: 'Schedule slot deleted' });
        } catch (error) {
            next(error);
        }
    },
);

// Get available schedule slots for a Member (to book a session)
router.get('/member/available-schedules', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const member = await Member.findById(req.user.id);
        if (!member || !member.gym) {
            return res
                .status(404)
                .json({ message: 'Member not found or not associated with a gym' });
        }

        const schedules = await TrainerSchedule.find({
            gym: member.gym,
            status: 'available',
            startTime: { $gte: new Date() }, // Only future slots
        })
            .populate('trainer', 'name email')
            .sort({ startTime: 1 });

        res.json(schedules);
    } catch (error) {
        next(error);
    }
});

// Book a session (Member only)
router.post(
    '/book-session/:scheduleId',
    authMiddleware,
    bookSessionValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'member') {
            return res.status(403).json({ message: 'Access denied' });
        }

        try {
            const member = await Member.findById(req.user.id);
            if (!member || !member.gym) {
                return res
                    .status(404)
                    .json({ message: 'Member not found or not associated with a gym' });
            }

            const schedule = await TrainerSchedule.findById(req.params.scheduleId);
            if (!schedule) {
                return res.status(404).json({ message: 'Schedule slot not found' });
            }

            if (schedule.gym.toString() !== member.gym.toString()) {
                return res.status(403).json({ message: 'Schedule slot not in your gym' });
            }

            if (schedule.status !== 'available') {
                return res.status(400).json({ message: 'This slot is no longer available' });
            }

            if (schedule.startTime < new Date()) {
                return res.status(400).json({ message: 'Cannot book a past slot' });
            }

            schedule.status = 'booked';
            schedule.bookedBy = req.user.id;
            await schedule.save();

            res.json({ message: 'Session booked successfully', schedule });
        } catch (error) {
            next(error);
        }
    },
);

// Get booked sessions for a Member
router.get('/member/booked-sessions', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const schedules = await TrainerSchedule.find({
            bookedBy: req.user.id,
            status: 'booked',
        })
            .populate('trainer', 'name email')
            .sort({ startTime: 1 });

        res.json(schedules);
    } catch (error) {
        next(error);
    }
});

// Get all bookings for a Trainer
router.get('/bookings', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'trainer') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const bookings = await TrainerSchedule.find({
            trainer: req.user.id,
            status: 'booked',
        })
            .populate('bookedBy', 'name email')
            .sort({ startTime: 1 });

        res.json(bookings);
    } catch (error) {
        next(error);
    }
});

// Update gym details (Gym only)
router.put('/gym/update', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'gym') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { gymName, address, ownerName, ownerEmail, membershipPlans } = req.body;

    try {
        const gym = await Gym.findById(req.user.id);
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        if (gymName) gym.gymName = gymName;
        if (address) gym.address = address;
        if (ownerName) gym.ownerName = ownerName;
        if (ownerEmail) gym.ownerEmail = ownerEmail;
        if (membershipPlans) gym.membershipPlans = JSON.parse(membershipPlans);

        await gym.save();
        res.json({ message: 'Gym details updated', gym });
    } catch (error) {
        next(error);
    }
});

// ─── Personal Coaching Requests ──────────────────────────────

// POST /trainer/coaching-requests — Member sends a coaching request to any trainer
router.post(
    '/coaching-requests',
    authMiddleware,
    coachingRequestValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'member') {
            return res.status(403).json({ message: 'Only members can send coaching requests' });
        }

        const { trainerId, message } = req.body;

        try {
            if (!trainerId) {
                return res.status(400).json({ message: 'trainerId is required' });
            }

            const trainer = await Trainer.findById(trainerId);
            if (!trainer) {
                return res.status(404).json({ message: 'Trainer not found' });
            }

            // Check if already a personal client
            if (trainer.personalClients.map((id) => id.toString()).includes(req.user.id)) {
                return res
                    .status(400)
                    .json({ message: 'You are already a personal client of this trainer' });
            }

            // Check for existing pending request
            const existing = await CoachingRequest.findOne({
                member: req.user.id,
                trainer: trainerId,
                status: 'pending',
            });
            if (existing) {
                return res.status(400).json({
                    message: 'You already have a pending coaching request with this trainer',
                });
            }

            const request = await CoachingRequest.create({
                member: req.user.id,
                trainer: trainerId,
                message: message || '',
            });

            res.status(201).json({ message: 'Coaching request sent', request });
        } catch (error) {
            next(error);
        }
    },
);

// GET /trainer/coaching-requests — Trainer views incoming coaching requests
router.get('/coaching-requests', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'trainer') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const requests = await CoachingRequest.find({ trainer: req.user.id })
            .populate('member', 'name email profileImage contact')
            .sort({ createdAt: -1 })
            .lean();
        res.json(requests);
    } catch (error) {
        next(error);
    }
});

// POST /trainer/coaching-requests/:id/action — Accept or deny a coaching request
router.post(
    '/coaching-requests/:id/action',
    authMiddleware,
    coachingRequestActionValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'trainer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { action } = req.body; // 'accept' or 'deny'
        if (!['accept', 'deny'].includes(action)) {
            return res.status(400).json({ message: 'Action must be accept or deny' });
        }

        try {
            const request = await CoachingRequest.findById(req.params.id);
            if (!request) {
                return res.status(404).json({ message: 'Coaching request not found' });
            }
            if (request.trainer.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Not authorized' });
            }
            if (request.status !== 'pending') {
                return res.status(400).json({ message: 'Request has already been processed' });
            }

            if (action === 'accept') {
                request.status = 'accepted';
                await request.save();

                // Add member to trainer's personalClients (idempotent)
                await Trainer.findByIdAndUpdate(req.user.id, {
                    $addToSet: { personalClients: request.member },
                });

                res.json({ message: 'Coaching request accepted — client added', request });
            } else {
                request.status = 'denied';
                await request.save();
                res.json({ message: 'Coaching request denied', request });
            }
        } catch (error) {
            next(error);
        }
    },
);

// ─── Client Roster ───────────────────────────────────────────

// GET /trainer/clients — full client roster (gym + personal)
router.get('/clients', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'trainer') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const trainer = await Trainer.findById(req.user.id)
            .populate('personalClients', 'name email profileImage contact gym')
            .lean();

        if (!trainer) {
            return res.status(404).json({ message: 'Trainer not found' });
        }

        // Gym clients
        let gymClients = [];
        if (trainer.gym) {
            const gym = await Gym.findById(trainer.gym)
                .populate('members', 'name email profileImage contact')
                .lean();
            gymClients = gym?.members || [];
        }

        res.json({
            gymClients,
            personalClients: trainer.personalClients || [],
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /trainer/personal-clients/:memberId — Remove a personal client
router.delete('/personal-clients/:memberId', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'trainer') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const { memberId } = req.params;
        const trainer = await Trainer.findById(req.user.id);
        if (!trainer) {
            return res.status(404).json({ message: 'Trainer not found' });
        }

        if (!trainer.personalClients.map((id) => id.toString()).includes(memberId)) {
            return res.status(404).json({ message: 'This member is not your personal client' });
        }

        await Trainer.findByIdAndUpdate(req.user.id, {
            $pull: { personalClients: memberId },
        });

        res.json({ message: 'Personal client removed' });
    } catch (error) {
        next(error);
    }
});

// GET /trainer/coaching-requests/member — Member views their sent coaching requests
router.get('/coaching-requests/member', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const requests = await CoachingRequest.find({ member: req.user.id })
            .populate('trainer', 'name email profileImage experienceYears experienceMonths gym')
            .sort({ createdAt: -1 })
            .lean();
        res.json(requests);
    } catch (error) {
        next(error);
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
    gymUpdateValidation,
    joinGymValidation,
    memberIdValidation,
    trainerIdValidation,
    requestActionValidation,
    membershipRequestActionValidation,
} = require('../validators/gym.validators');
const paginate = require('../utils/paginate');
const logger = require('../utils/logger');
const Gym = require('../models/Gym');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const JoinRequest = require('../models/JoinRequest');
const EventLog = require('../models/EventLog');
const MembershipRequest = require('../models/MembershipRequest');

// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Get all gyms (for Members/Trainers to browse)
router.get('/', async (req, res, next) => {
    try {
        const filter = {};
        const query = Gym.find(filter).select('-password');
        const result = await paginate(Gym, filter, query, req);

        // Log page view event if user is authenticated
        if (req.headers.authorization) {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userModelMap = {
                admin: 'Admin',
                gym: 'Gym',
                trainer: 'Trainer',
                member: 'Member',
            };
            const eventLog = new EventLog({
                event: 'Page View',
                page: '/gyms',
                user: decoded.id,
                userModel: userModelMap[decoded.role],
                details: `${userModelMap[decoded.role]} viewed gym list`,
            });
            await eventLog.save();
        }

        res.json(result);
    } catch (error) {
        logger.error('Error in GET /gyms:', error);
        next(error);
    }
});

// Browse gyms with search, city filter, and hiring status filter
router.get('/browse', async (req, res, next) => {
    try {
        const { search, city, hiringStatus, page = 1, limit = 20 } = req.query;
        const filter = {};

        if (search) {
            filter.gymName = { $regex: search, $options: 'i' };
        }
        if (city) {
            filter.city = { $regex: `^${city}$`, $options: 'i' };
        }
        if (hiringStatus && ['hiring', 'not_hiring'].includes(hiringStatus)) {
            filter.hiringStatus = hiringStatus;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Gym.countDocuments(filter);
        const gyms = await Gym.find(filter)
            .select(
                'gymName address city primaryImage photos membershipPlans members trainers hiringStatus salaryRange profileImage',
            )
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Add counts without exposing full arrays
        const result = gyms.map((gym) => ({
            ...gym,
            memberCount: gym.members?.length || 0,
            trainerCount: gym.trainers?.length || 0,
            members: undefined,
            trainers: undefined,
        }));

        // Get distinct cities for filter dropdown
        const cities = await Gym.distinct('city', { city: { $ne: '' } });

        res.json({
            gyms: result,
            cities: cities.sort(),
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
        });
    } catch (error) {
        logger.error('Error in GET /browse:', error);
        next(error);
    }
});

// Send join request (Member/Trainer)
router.post('/join/:gymId', authMiddleware, joinGymValidation, validate, async (req, res, next) => {
    if (req.user.role !== 'member' && req.user.role !== 'trainer') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const gym = await Gym.findById(req.params.gymId);
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        const userModel = req.user.role === 'member' ? Member : Trainer;
        const user = await userModel.findById(req.user.id);
        if (user.gym) {
            return res.status(400).json({ message: 'You are already in a gym' });
        }

        const existingRequest = await JoinRequest.findOne({
            user: req.user.id,
            gym: req.params.gymId,
            status: 'pending',
        });
        if (existingRequest) {
            return res
                .status(400)
                .json({ message: 'You already have a pending request for this gym' });
        }

        let membershipDuration;
        if (req.user.role === 'member') {
            membershipDuration = req.body.membershipDuration;
            if (!membershipDuration) {
                return res
                    .status(400)
                    .json({ message: 'Membership duration is required for members' });
            }
            const validDurations = ['1 week', '1 month', '3 months', '6 months', '1 year'];
            if (!validDurations.includes(membershipDuration)) {
                return res.status(400).json({ message: 'Invalid membership duration' });
            }
        }

        // Block trainer join if gym is not hiring
        if (req.user.role === 'trainer' && gym.hiringStatus === 'not_hiring') {
            return res.status(400).json({ message: 'This gym is not currently hiring trainers' });
        }

        const joinRequestData = {
            user: req.user.id,
            userModel: req.user.role === 'member' ? 'Member' : 'Trainer',
            gym: req.params.gymId,
            message: req.body.message || '',
        };

        if (req.user.role === 'member') {
            joinRequestData.membershipDuration = membershipDuration;
        }

        const joinRequest = new JoinRequest(joinRequestData);

        await joinRequest.save();
        gym.joinRequests.push(joinRequest._id);
        await gym.save();

        // Log the join request event
        const eventLog = new EventLog({
            event: 'Join Request',
            page: `/gym/${req.params.gymId}`,
            user: req.user.id,
            userModel: req.user.role === 'member' ? 'Member' : 'Trainer',
            details: `${req.user.role === 'member' ? 'Member' : 'Trainer'} sent join request to gym ${gym.gymName}`,
        });
        await eventLog.save();

        res.status(201).json({ message: 'Join request sent', joinRequest });
    } catch (error) {
        logger.error('Error in POST /join/:gymId:', error);
        next(error);
    }
});

// Update gym details (including photo upload/delete)
router.put(
    '/update',
    authMiddleware,
    upload.array('photos', 5),
    gymUpdateValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'gym') {
            return res.status(403).json({ message: 'Access denied' });
        }

        try {
            const gym = await Gym.findById(req.user.id);
            if (!gym) {
                return res.status(404).json({ message: 'Gym not found' });
            }

            const {
                gymName,
                address,
                city,
                ownerName,
                ownerEmail,
                membershipPlans,
                deletePhotos,
                hiringStatus,
                salaryRange,
            } = req.body;

            if (gymName) gym.gymName = gymName;
            if (address) gym.address = address;
            if (city !== undefined) gym.city = city;
            if (hiringStatus && ['hiring', 'not_hiring'].includes(hiringStatus))
                gym.hiringStatus = hiringStatus;
            if (salaryRange !== undefined) gym.salaryRange = salaryRange;
            if (ownerName) gym.ownerName = ownerName;
            if (ownerEmail) gym.ownerEmail = ownerEmail;
            if (req.body.primaryImage !== undefined) {
                gym.primaryImage = req.body.primaryImage;
            }
            if (membershipPlans) {
                if (typeof membershipPlans !== 'string') {
                    return res
                        .status(400)
                        .json({ message: 'membershipPlans must be a JSON string' });
                }
                try {
                    gym.membershipPlans = JSON.parse(membershipPlans);
                } catch (parseError) {
                    logger.error('Error parsing membershipPlans:', parseError);
                    return res.status(400).json({
                        message: 'Invalid membershipPlans format',
                        error: parseError.message,
                    });
                }
            }

            if (deletePhotos) {
                const photosToDelete = JSON.parse(deletePhotos);
                for (const photoUrl of photosToDelete) {
                    const urlParts = photoUrl.split('/');
                    const fileName = urlParts[urlParts.length - 1];
                    const publicId = fileName.split('.')[0];
                    const folderPath = urlParts[urlParts.length - 2];
                    const fullPublicId = `${folderPath}/${publicId}`;
                    await cloudinary.uploader.destroy(fullPublicId);
                    gym.photos = gym.photos.filter((photo) => photo !== photoUrl);
                    if (gym.primaryImage === photoUrl) {
                        gym.primaryImage = null;
                    }
                }
            }

            if (req.files && req.files.length > 0) {
                const uploadPromises = req.files.map(
                    (file) =>
                        new Promise((resolve, reject) => {
                            cloudinary.uploader
                                .upload_stream({ folder: 'gym_photos' }, (error, result) => {
                                    if (error) reject(error);
                                    resolve(result.secure_url);
                                })
                                .end(file.buffer);
                        }),
                );
                const uploadedPhotos = await Promise.all(uploadPromises);
                gym.photos.push(...uploadedPhotos);
            }

            await gym.save();

            const eventLog = new EventLog({
                event: 'Gym Update',
                page: '/update-gym',
                user: req.user.id,
                userModel: 'Gym',
                details: `Gym ${gym.gymName} updated details`,
            });
            await eventLog.save();

            res.json({ message: 'Gym updated', gym });
        } catch (error) {
            logger.error('Error in PUT /update:', error);
            next(error);
        }
    },
);

// Get join requests (Gym and Trainers)
router.get('/requests', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'gym' && req.user.role !== 'trainer') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        let gym;
        if (req.user.role === 'gym') {
            gym = await Gym.findById(req.user.id).populate({
                path: 'joinRequests',
                populate: {
                    path: 'user',
                    select: 'name email profileImage experienceYears experienceMonths',
                },
            });
        } else {
            const trainer = await Trainer.findById(req.user.id);
            if (!trainer || !trainer.gym) {
                return res
                    .status(404)
                    .json({ message: 'Trainer not found or not associated with a gym' });
            }
            gym = await Gym.findById(trainer.gym).populate({
                path: 'joinRequests',
                populate: {
                    path: 'user',
                    select: 'name email profileImage experienceYears experienceMonths',
                },
            });
        }

        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        const pendingRequests = Array.isArray(gym.joinRequests)
            ? gym.joinRequests.filter((req) => req && req.status === 'pending')
            : [];

        // Trainers can only see Member requests
        if (req.user.role === 'trainer') {
            return res.json(pendingRequests.filter((req) => req.userModel === 'Member'));
        }

        res.json(pendingRequests);
    } catch (error) {
        logger.error('Error in GET /requests:', error);
        next(error);
    }
});

// Get members for membership management (Gym and Trainers)
router.get('/members', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'gym' && req.user.role !== 'trainer') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        // Validate req.user
        if (!req.user || !req.user.id) {
            logger.error('Invalid user in req:', req.user);
            return res.status(401).json({ message: 'User authentication failed' });
        }

        // Validate gym ID
        if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
            logger.error(`Invalid gym ID in req.user.id: ${req.user.id}`);
            return res.status(400).json({ message: 'Invalid gym ID' });
        }

        let gym;
        if (req.user.role === 'gym') {
            gym = await Gym.findById(req.user.id);
            if (!gym) {
                logger.error(`Gym not found for ID ${req.user.id}`);
                return res.status(404).json({ message: 'Gym not found' });
            }
            gym = await Gym.findById(req.user.id).populate({
                path: 'members',
                select: 'name email membership',
                match: { _id: { $ne: null } }, // Ensure member exists
            });
        } else {
            const trainer = await Trainer.findById(req.user.id);
            if (!trainer) {
                logger.error(`Trainer not found for ID ${req.user.id}`);
                return res.status(404).json({ message: 'Trainer not found' });
            }
            if (!trainer.gym) {
                logger.error(`Trainer with ID ${req.user.id} is not associated with a gym`);
                return res.status(404).json({ message: 'Trainer not associated with a gym' });
            }
            gym = await Gym.findById(trainer.gym).populate({
                path: 'members',
                select: 'name email membership',
                match: { _id: { $ne: null } }, // Ensure member exists
            });
        }

        if (!gym) {
            logger.error('Gym not found after population');
            return res.status(404).json({ message: 'Gym not found' });
        }

        const members = gym.members || [];
        res.json(members);
    } catch (error) {
        logger.error('Error in GET /members:', error);
        next(error);
    }
});

// ─── Membership Retention: Expiring Soon ───────────────────
// GET /gym/members/expiring-soon — Gym sees members expiring in 7 days
router.get('/members/expiring-soon', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'gym') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const gym = await Gym.findById(req.user.id);
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        const now = new Date();
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

        // Find members of this gym whose endDate is between now and now+7days
        const expiringMembers = await Member.find({
            _id: { $in: gym.members },
            'membership.endDate': { $gte: now, $lte: sevenDaysLater },
        })
            .select('name email profileImage membership')
            .sort({ 'membership.endDate': 1 })
            .lean();

        // Add daysRemaining to each member
        const result = expiringMembers.map((member) => {
            const endDate = new Date(member.membership.endDate);
            const diffMs = endDate - now;
            const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            return { ...member, daysRemaining };
        });

        res.json(result);
    } catch (error) {
        logger.error('Error in GET /members/expiring-soon:', error);
        next(error);
    }
});

// Get trainers for membership management (Gym only)
router.get('/trainers', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'gym') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        // Validate req.user
        if (!req.user || !req.user.id) {
            logger.error('Invalid user in req:', req.user);
            return res.status(401).json({ message: 'User authentication failed' });
        }

        // Validate gym ID
        if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
            logger.error(`Invalid gym ID in req.user.id: ${req.user.id}`);
            return res.status(400).json({ message: 'Invalid gym ID' });
        }

        const gym = await Gym.findById(req.user.id).populate({
            path: 'trainers',
            select: 'name email',
            match: { _id: { $ne: null } }, // Ensure trainer exists
        });

        if (!gym) {
            logger.error(`Gym not found for ID ${req.user.id}`);
            return res.status(404).json({ message: 'Gym not found' });
        }

        const trainers = gym.trainers || [];

        res.json(trainers);
    } catch (error) {
        logger.error('Error in GET /trainers:', error);
        next(error);
    }
});

// Remove a member from the gym (Gym only)
router.delete(
    '/members/:memberId',
    authMiddleware,
    memberIdValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'gym') {
            return res.status(403).json({ message: 'Access denied' });
        }

        try {
            const gym = await Gym.findById(req.user.id);
            if (!gym) {
                return res.status(404).json({ message: 'Gym not found' });
            }

            const member = await Member.findById(req.params.memberId);
            if (!member || member.gym.toString() !== gym._id.toString()) {
                return res.status(404).json({ message: 'Member not found or not in this gym' });
            }

            // Remove member from gym
            gym.members = gym.members.filter((id) => id.toString() !== req.params.memberId);
            await gym.save();

            // Clear gym and membership from member
            member.gym = undefined;
            member.membership = undefined;
            await member.save();

            // Remove any pending membership requests for this member
            await MembershipRequest.deleteMany({
                member: req.params.memberId,
                gym: gym._id,
                status: 'pending',
            });

            // Log the member removal event
            const eventLog = new EventLog({
                event: 'Member Removed',
                page: '/membership-management',
                user: req.user.id,
                userModel: 'Gym',
                details: `Gym removed member ${member.name}`,
            });
            await eventLog.save();

            res.json({ message: 'Member removed successfully' });
        } catch (error) {
            logger.error('Error in DELETE /members/:memberId:', error);
            next(error);
        }
    },
);

// // Remove a trainer from the gym (Gym only)
router.delete(
    '/trainers/:trainerId',
    authMiddleware,
    trainerIdValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'gym') {
            return res.status(403).json({ message: 'Access denied' });
        }

        try {
            const gym = await Gym.findById(req.user.id);
            if (!gym) {
                return res.status(404).json({ message: 'Gym not found' });
            }

            const trainer = await Trainer.findById(req.params.trainerId);
            if (!trainer || trainer.gym.toString() !== gym._id.toString()) {
                return res.status(404).json({ message: 'Trainer not found or not in this gym' });
            }

            // Remove trainer from gym
            gym.trainers = gym.trainers.filter((id) => id.toString() !== req.params.trainerId);
            await gym.save();

            // Clear gym from trainer
            trainer.gym = undefined;
            await trainer.save();

            // Log the trainer removal event
            const eventLog = new EventLog({
                event: 'Trainer Removed',
                page: '/membership-management',
                user: req.user.id,
                userModel: 'Gym',
                details: `Gym removed trainer ${trainer.name}`,
            });
            await eventLog.save();

            res.json({ message: 'Trainer removed successfully' });
        } catch (error) {
            logger.error('Error in DELETE /trainers/:trainerId:', error);
            next(error);
        }
    },
);

// Get members for membership management (Gym and Trainers)
router.get('/members', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'gym' && req.user.role !== 'trainer') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        // Validate req.user
        if (!req.user || !req.user.id) {
            logger.error('Invalid user in req:', req.user);
            return res.status(401).json({ message: 'User authentication failed' });
        }

        let gym;
        if (req.user.role === 'gym') {
            gym = await Gym.findById(req.user.id);
            if (!gym) {
                logger.error(`Gym not found for ID ${req.user.id}`);
                return res.status(404).json({ message: 'Gym not found' });
            }
            gym = await Gym.findById(req.user.id).populate({
                path: 'members',
                select: 'name email membership',
                match: { _id: { $ne: null } }, // Ensure member exists
            });
        } else {
            const trainer = await Trainer.findById(req.user.id);
            if (!trainer) {
                logger.error(`Trainer not found for ID ${req.user.id}`);
                return res.status(404).json({ message: 'Trainer not found' });
            }
            if (!trainer.gym) {
                logger.error(`Trainer with ID ${req.user.id} is not associated with a gym`);
                return res.status(404).json({ message: 'Trainer not associated with a gym' });
            }
            gym = await Gym.findById(trainer.gym).populate({
                path: 'members',
                select: 'name email membership',
                match: { _id: { $ne: null } }, // Ensure member exists
            });
        }

        if (!gym) {
            logger.error('Gym not found after population');
            return res.status(404).json({ message: 'Gym not found' });
        }

        const members = gym.members || [];
        res.json(members);
    } catch (error) {
        logger.error('Error in GET /members:', error);
        next(error);
    }
});

// Get membership requests (Gym and Trainers)
router.get('/membership-requests', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'gym' && req.user.role !== 'trainer') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        // Validate req.user
        if (!req.user || !req.user.id) {
            logger.error('Invalid user in req:', req.user);
            return res.status(401).json({ message: 'User authentication failed' });
        }

        let gym;
        if (req.user.role === 'gym') {
            gym = await Gym.findById(req.user.id);
        } else {
            const trainer = await Trainer.findById(req.user.id);
            if (!trainer) {
                logger.error(`Trainer not found for ID ${req.user.id}`);
                return res.status(404).json({ message: 'Trainer not found' });
            }
            if (!trainer.gym) {
                logger.error(`Trainer with ID ${req.user.id} is not associated with a gym`);
                return res.status(404).json({ message: 'Trainer not associated with a gym' });
            }
            gym = await Gym.findById(trainer.gym);
        }

        if (!gym) {
            logger.error('Gym not found after population');
            return res.status(404).json({ message: 'Gym not found' });
        }

        const membershipRequests = await MembershipRequest.find({ gym: gym._id })
            .populate({
                path: 'member',
                select: 'name email',
                match: { _id: { $ne: null } }, // Ensure member exists
            })
            .sort({ createdAt: -1 });

        // Filter out requests where member population failed (null)
        const validRequests = membershipRequests.filter((req) => req.member !== null);

        res.json(validRequests);
    } catch (error) {
        logger.error('Error in GET /membership-requests:', error);
        next(error);
    }
});

// Get specific gym details (MUST BE AFTER /members and /membership-requests routes)
router.get('/:id', async (req, res, next) => {
    try {
        // Validate the ID parameter
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            logger.error(`Invalid gym ID: ${req.params.id}`);
            return res.status(400).json({ message: 'Invalid gym ID' });
        }

        const gym = await Gym.findById(req.params.id)
            .select('-password')
            .populate('members', 'name email')
            .populate('trainers', 'name email');
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        // Log page view event if user is authenticated
        if (req.headers.authorization) {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userModelMap = {
                admin: 'Admin',
                gym: 'Gym',
                trainer: 'Trainer',
                member: 'Member',
            };
            const eventLog = new EventLog({
                event: 'Page View',
                page: `/gym/${req.params.id}`,
                user: decoded.id,
                userModel: userModelMap[decoded.role],
                details: `${userModelMap[decoded.role]} viewed gym ${gym.gymName}`,
            });
            await eventLog.save();
        }

        res.json(gym);
    } catch (error) {
        logger.error('Error in GET /:id:', error);
        next(error);
    }
});

// Accept join request (Gym and Trainers)
router.post(
    '/requests/:requestId/accept',
    authMiddleware,
    requestActionValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'gym' && req.user.role !== 'trainer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        try {
            const joinRequest = await JoinRequest.findById(req.params.requestId).populate('user');
            if (!joinRequest || joinRequest.status !== 'pending') {
                return res.status(404).json({ message: 'Request not found or already processed' });
            }

            let gym;
            if (req.user.role === 'gym') {
                gym = await Gym.findById(req.user.id);
            } else {
                const trainer = await Trainer.findById(req.user.id);
                if (!trainer || !trainer.gym) {
                    return res
                        .status(404)
                        .json({ message: 'Trainer not found or not associated with a gym' });
                }
                gym = await Gym.findById(trainer.gym);
                // Trainers can only accept Member requests
                if (joinRequest.userModel !== 'Member') {
                    return res
                        .status(403)
                        .json({ message: 'Trainers can only manage Member join requests' });
                }
            }

            if (joinRequest.gym.toString() !== gym._id.toString()) {
                return res.status(403).json({ message: 'Request does not belong to this gym' });
            }

            joinRequest.status = 'accepted';
            await joinRequest.save();

            const userModel = joinRequest.userModel === 'Member' ? Member : Trainer;
            const user = await userModel.findById(joinRequest.user._id);
            user.gym = gym._id;

            if (joinRequest.userModel === 'Member') {
                const duration = joinRequest.membershipDuration;
                const startDate = new Date();
                let endDate;
                switch (duration) {
                    case '1 week':
                        endDate = new Date(startDate.setDate(startDate.getDate() + 7));
                        break;
                    case '1 month':
                        endDate = new Date(startDate.setMonth(startDate.getMonth() + 1));
                        break;
                    case '3 months':
                        endDate = new Date(startDate.setMonth(startDate.getMonth() + 3));
                        break;
                    case '6 months':
                        endDate = new Date(startDate.setMonth(startDate.getMonth() + 6));
                        break;
                    case '1 year':
                        endDate = new Date(startDate.setFullYear(startDate.getFullYear() + 1));
                        break;
                }
                user.membership = { duration, startDate: new Date(), endDate };
                gym.members.push(user._id);
            } else {
                gym.trainers.push(user._id);
            }

            await user.save();
            await gym.save();

            // Log the join request acceptance event
            const eventLog = new EventLog({
                event: 'Join Request Accepted',
                page: '/gym-dashboard',
                user: req.user.id,
                userModel: req.user.role === 'gym' ? 'Gym' : 'Trainer',
                details: `${req.user.role === 'gym' ? 'Gym' : 'Trainer'} accepted join request from ${joinRequest.userModel} ${joinRequest.user.name}`,
            });
            await eventLog.save();

            res.json({ message: 'Request accepted' });
        } catch (error) {
            logger.error('Error in POST /requests/:requestId/accept:', error);
            next(error);
        }
    },
);

// Deny join request (Gym and Trainers)
router.post(
    '/requests/:requestId/deny',
    authMiddleware,
    requestActionValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'gym' && req.user.role !== 'trainer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        try {
            const joinRequest = await JoinRequest.findById(req.params.requestId);
            if (!joinRequest || joinRequest.status !== 'pending') {
                return res.status(404).json({ message: 'Request not found or already processed' });
            }

            let gym;
            if (req.user.role === 'gym') {
                gym = await Gym.findById(req.user.id);
            } else {
                const trainer = await Trainer.findById(req.user.id);
                if (!trainer || !trainer.gym) {
                    return res
                        .status(404)
                        .json({ message: 'Trainer not found or not associated with a gym' });
                }
                gym = await Gym.findById(trainer.gym);
                if (joinRequest.userModel !== 'Member') {
                    return res
                        .status(403)
                        .json({ message: 'Trainers can only manage Member join requests' });
                }
            }

            if (joinRequest.gym.toString() !== gym._id.toString()) {
                return res.status(403).json({ message: 'Request does not belong to this gym' });
            }

            joinRequest.status = 'denied';
            await joinRequest.save();

            // Log the join request denial event
            const eventLog = new EventLog({
                event: 'Join Request Denied',
                page: '/gym-dashboard',
                user: req.user.id,
                userModel: req.user.role === 'gym' ? 'Gym' : 'Trainer',
                details: `${req.user.role === 'gym' ? 'Gym' : 'Trainer'} denied join request from ${joinRequest.userModel}`,
            });
            await eventLog.save();

            res.json({ message: 'Request denied' });
        } catch (error) {
            logger.error('Error in POST /requests/:requestId/deny:', error);
            next(error);
        }
    },
);

// Update membership (Gym and Trainers)
router.put(
    '/members/:memberId/membership',
    authMiddleware,
    memberIdValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'gym' && req.user.role !== 'trainer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { duration } = req.body;

        if (!duration) {
            return res.status(400).json({ message: 'Duration is required' });
        }

        const validDurations = ['1 week', '1 month', '3 months', '6 months', '1 year'];
        if (!validDurations.includes(duration)) {
            return res.status(400).json({ message: 'Invalid membership duration' });
        }

        try {
            let gym;
            if (req.user.role === 'gym') {
                gym = await Gym.findById(req.user.id);
            } else {
                const trainer = await Trainer.findById(req.user.id);
                if (!trainer || !trainer.gym) {
                    return res
                        .status(404)
                        .json({ message: 'Trainer not found or not associated with a gym' });
                }
                gym = await Gym.findById(trainer.gym);
            }

            if (!gym) {
                return res.status(404).json({ message: 'Gym not found' });
            }

            const member = await Member.findById(req.params.memberId);
            if (!member || member.gym.toString() !== gym._id.toString()) {
                return res.status(404).json({ message: 'Member not found or not in this gym' });
            }

            const startDate = new Date();
            let endDate;
            switch (duration) {
                case '1 week':
                    endDate = new Date(startDate.setDate(startDate.getDate() + 7));
                    break;
                case '1 month':
                    endDate = new Date(startDate.setMonth(startDate.getMonth() + 1));
                    break;
                case '3 months':
                    endDate = new Date(startDate.setMonth(startDate.getMonth() + 3));
                    break;
                case '6 months':
                    endDate = new Date(startDate.setMonth(startDate.getMonth() + 6));
                    break;
                case '1 year':
                    endDate = new Date(startDate.setFullYear(startDate.getFullYear() + 1));
                    break;
            }

            member.membership = { duration, startDate: new Date(), endDate };
            await member.save();

            // If this update is in response to a membership request, update the request status
            const membershipRequest = await MembershipRequest.findOne({
                member: member._id,
                gym: gym._id,
                status: 'pending',
                requestedDuration: duration,
            });
            if (membershipRequest) {
                membershipRequest.status = 'approved';
                await membershipRequest.save();
            }

            // Log the membership update event
            const eventLog = new EventLog({
                event: 'Membership Update',
                page: '/membership-management',
                user: req.user.id,
                userModel: req.user.role === 'gym' ? 'Gym' : 'Trainer',
                details: `${req.user.role === 'gym' ? 'Gym' : 'Trainer'} updated membership for member ${member.name} to ${duration}`,
            });
            await eventLog.save();

            res.json({ message: 'Membership updated', member });
        } catch (error) {
            logger.error('Error in PUT /members/:memberId/membership:', error);
            next(error);
        }
    },
);

// Approve or deny membership request (Gym and Trainers)
router.post(
    '/membership-requests/:requestId/action',
    authMiddleware,
    membershipRequestActionValidation,
    validate,
    async (req, res, next) => {
        if (req.user.role !== 'gym' && req.user.role !== 'trainer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { action } = req.body;

        if (!action || !['approve', 'deny'].includes(action)) {
            return res.status(400).json({ message: 'Action (approve or deny) is required' });
        }

        try {
            let gym;
            if (req.user.role === 'gym') {
                gym = await Gym.findById(req.user.id);
            } else {
                const trainer = await Trainer.findById(req.user.id);
                if (!trainer || !trainer.gym) {
                    return res
                        .status(404)
                        .json({ message: 'Trainer not found or not associated with a gym' });
                }
                gym = await Gym.findById(trainer.gym);
            }

            if (!gym) {
                return res.status(404).json({ message: 'Gym not found' });
            }

            const membershipRequest = await MembershipRequest.findById(
                req.params.requestId,
            ).populate('member');
            if (!membershipRequest) {
                return res.status(404).json({ message: 'Membership request not found' });
            }

            if (membershipRequest.gym.toString() !== gym._id.toString()) {
                return res.status(403).json({ message: 'Request does not belong to this gym' });
            }

            if (membershipRequest.status !== 'pending') {
                return res.status(400).json({ message: 'Request has already been processed' });
            }

            membershipRequest.status = action === 'approve' ? 'approved' : 'denied';
            await membershipRequest.save();

            if (action === 'approve') {
                const member = await Member.findById(membershipRequest.member._id);
                const startDate = new Date();
                let endDate;
                switch (membershipRequest.requestedDuration) {
                    case '1 week':
                        endDate = new Date(startDate.setDate(startDate.getDate() + 7));
                        break;
                    case '1 month':
                        endDate = new Date(startDate.setMonth(startDate.getMonth() + 1));
                        break;
                    case '3 months':
                        endDate = new Date(startDate.setMonth(startDate.getMonth() + 3));
                        break;
                    case '6 months':
                        endDate = new Date(startDate.setMonth(startDate.getMonth() + 6));
                        break;
                    case '1 year':
                        endDate = new Date(startDate.setFullYear(startDate.getFullYear() + 1));
                        break;
                }
                member.membership = {
                    duration: membershipRequest.requestedDuration,
                    startDate: new Date(),
                    endDate,
                };
                await member.save();
            }

            // Log the membership request action event
            const eventLog = new EventLog({
                event: `Membership Request ${action === 'approve' ? 'Approved' : 'Denied'}`,
                page: '/membership-management',
                user: req.user.id,
                userModel: req.user.role === 'gym' ? 'Gym' : 'Trainer',
                details: `${req.user.role === 'gym' ? 'Gym' : 'Trainer'} ${action === 'approve' ? 'approved' : 'denied'} membership request for member ${membershipRequest.member.name}`,
            });
            await eventLog.save();

            res.json({ message: `Membership request ${action}d`, membershipRequest });
        } catch (error) {
            logger.error('Error in POST /membership-requests/:requestId/action:', error);
            next(error);
        }
    },
);

module.exports = router;

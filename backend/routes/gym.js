const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
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
router.get('/', async (req, res) => {
    try {
        const gyms = await Gym.find().select('-password');

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

        res.json(gyms);
    } catch (error) {
        console.error('Error in GET /gyms:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Send join request (Member/Trainer)
router.post('/join/:gymId', authMiddleware, async (req, res) => {
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
            return res.status(400).json({ message: 'You already have a pending request for this gym' });
        }

        let membershipDuration;
        if (req.user.role === 'member') {
            membershipDuration = req.body.membershipDuration;
            if (!membershipDuration) {
                return res.status(400).json({ message: 'Membership duration is required for members' });
            }
            const validDurations = ['1 week', '1 month', '3 months', '6 months', '1 year'];
            if (!validDurations.includes(membershipDuration)) {
                return res.status(400).json({ message: 'Invalid membership duration' });
            }
        }

        const joinRequestData = {
            user: req.user.id,
            userModel: req.user.role === 'member' ? 'Member' : 'Trainer',
            gym: req.params.gymId,
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
        console.error('Error in POST /join/:gymId:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update gym details (including photo upload/delete)
router.put('/update', authMiddleware, upload.array('photos', 5), async (req, res) => {
    if (req.user.role !== 'gym') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const gym = await Gym.findById(req.user.id);
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        const { gymName, address, ownerName, ownerEmail, membershipPlans, deletePhotos } = req.body;

        console.log('Received membershipPlans:', membershipPlans); // Add logging
        console.log('Type of membershipPlans:', typeof membershipPlans); // Check the type

        if (gymName) gym.gymName = gymName;
        if (address) gym.address = address;
        if (ownerName) gym.ownerName = ownerName;
        if (ownerEmail) gym.ownerEmail = ownerEmail;
        if (req.body.primaryImage !== undefined) {
            gym.primaryImage = req.body.primaryImage;
        }
        if (membershipPlans) {
            if (typeof membershipPlans !== 'string') {
                return res.status(400).json({ message: 'membershipPlans must be a JSON string' });
            }
            try {
                gym.membershipPlans = JSON.parse(membershipPlans);
            } catch (parseError) {
                console.error('Error parsing membershipPlans:', parseError);
                return res.status(400).json({ message: 'Invalid membershipPlans format', error: parseError.message });
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
            const uploadPromises = req.files.map((file) =>
                new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        { folder: 'gym_photos' },
                        (error, result) => {
                            if (error) reject(error);
                            resolve(result.secure_url);
                        }
                    ).end(file.buffer);
                })
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
        console.error('Error in PUT /update:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get join requests (Gym and Trainers)
router.get('/requests', authMiddleware, async (req, res) => {
    if (req.user.role !== 'gym' && req.user.role !== 'trainer') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        let gym;
        if (req.user.role === 'gym') {
            gym = await Gym.findById(req.user.id).populate({
                path: 'joinRequests',
                populate: { path: 'user', select: 'name email' },
            });
        } else {
            const trainer = await Trainer.findById(req.user.id);
            if (!trainer || !trainer.gym) {
                return res.status(404).json({ message: 'Trainer not found or not associated with a gym' });
            }
            gym = await Gym.findById(trainer.gym).populate({
                path: 'joinRequests',
                populate: { path: 'user', select: 'name email' },
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
        console.error('Error in GET /requests:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get members for membership management (Gym and Trainers)
router.get('/members', authMiddleware, async (req, res) => {
    if (req.user.role !== 'gym' && req.user.role !== 'trainer') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        // Validate req.user
        if (!req.user || !req.user.id) {
            console.error('Invalid user in req:', req.user);
            return res.status(401).json({ message: 'User authentication failed' });
        }

        // Validate gym ID
        if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
            console.error(`Invalid gym ID in req.user.id: ${req.user.id}`);
            return res.status(400).json({ message: 'Invalid gym ID' });
        }

        let gym;
        if (req.user.role === 'gym') {
            console.log(`Fetching gym with ID ${req.user.id} for gym role`);
            gym = await Gym.findById(req.user.id);
            if (!gym) {
                console.error(`Gym not found for ID ${req.user.id}`);
                return res.status(404).json({ message: 'Gym not found' });
            }
            gym = await Gym.findById(req.user.id).populate({
                path: 'members',
                select: 'name email membership',
                match: { _id: { $ne: null } }, // Ensure member exists
            });
        } else {
            console.log(`Fetching trainer with ID ${req.user.id} for trainer role`);
            const trainer = await Trainer.findById(req.user.id);
            if (!trainer) {
                console.error(`Trainer not found for ID ${req.user.id}`);
                return res.status(404).json({ message: 'Trainer not found' });
            }
            if (!trainer.gym) {
                console.error(`Trainer with ID ${req.user.id} is not associated with a gym`);
                return res.status(404).json({ message: 'Trainer not associated with a gym' });
            }
            console.log(`Fetching gym with ID ${trainer.gym} for trainer`);
            gym = await Gym.findById(trainer.gym).populate({
                path: 'members',
                select: 'name email membership',
                match: { _id: { $ne: null } }, // Ensure member exists
            });
        }

        if (!gym) {
            console.error('Gym not found after population');
            return res.status(404).json({ message: 'Gym not found' });
        }

        // Log the gym document to debug
        console.log('Gym document:', gym);

        // Handle case where members array might be null or undefined
        const members = gym.members || [];
        console.log('Members after population:', members);

        res.json(members);
    } catch (error) {
        console.error('Error in GET /members:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get trainers for membership management (Gym only)
router.get('/trainers', authMiddleware, async (req, res) => {
    if (req.user.role !== 'gym') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        // Validate req.user
        if (!req.user || !req.user.id) {
            console.error('Invalid user in req:', req.user);
            return res.status(401).json({ message: 'User authentication failed' });
        }

        // Validate gym ID
        if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
            console.error(`Invalid gym ID in req.user.id: ${req.user.id}`);
            return res.status(400).json({ message: 'Invalid gym ID' });
        }

        console.log(`Fetching gym with ID ${req.user.id} for gym role`);
        const gym = await Gym.findById(req.user.id).populate({
            path: 'trainers',
            select: 'name email',
            match: { _id: { $ne: null } }, // Ensure trainer exists
        });

        if (!gym) {
            console.error(`Gym not found for ID ${req.user.id}`);
            return res.status(404).json({ message: 'Gym not found' });
        }

        // Log the gym document to debug
        console.log('Gym document:', gym);

        // Handle case where trainers array might be null or undefined
        const trainers = gym.trainers || [];
        console.log('Trainers after population:', trainers);

        res.json(trainers);
    } catch (error) {
        console.error('Error in GET /trainers:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Remove a member from the gym (Gym only)
router.delete('/members/:memberId', authMiddleware, async (req, res) => {
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
        console.error('Error in DELETE /members/:memberId:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// // Remove a trainer from the gym (Gym only)
router.delete('/trainers/:trainerId', authMiddleware, async (req, res) => {
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
        console.error('Error in DELETE /trainers/:trainerId:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get members for membership management (Gym and Trainers)
router.get('/members', authMiddleware, async (req, res) => {
    if (req.user.role !== 'gym' && req.user.role !== 'trainer') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        // Validate req.user
        if (!req.user || !req.user.id) {
            console.error('Invalid user in req:', req.user);
            return res.status(401).json({ message: 'User authentication failed' });
        }

        let gym;
        if (req.user.role === 'gym') {
            console.log(`Fetching gym with ID ${req.user.id} for gym role`);
            gym = await Gym.findById(req.user.id);
            if (!gym) {
                console.error(`Gym not found for ID ${req.user.id}`);
                return res.status(404).json({ message: 'Gym not found' });
            }
            gym = await Gym.findById(req.user.id).populate({
                path: 'members',
                select: 'name email membership',
                match: { _id: { $ne: null } }, // Ensure member exists
            });
        } else {
            console.log(`Fetching trainer with ID ${req.user.id} for trainer role`);
            const trainer = await Trainer.findById(req.user.id);
            if (!trainer) {
                console.error(`Trainer not found for ID ${req.user.id}`);
                return res.status(404).json({ message: 'Trainer not found' });
            }
            if (!trainer.gym) {
                console.error(`Trainer with ID ${req.user.id} is not associated with a gym`);
                return res.status(404).json({ message: 'Trainer not associated with a gym' });
            }
            console.log(`Fetching gym with ID ${trainer.gym} for trainer`);
            gym = await Gym.findById(trainer.gym).populate({
                path: 'members',
                select: 'name email membership',
                match: { _id: { $ne: null } }, // Ensure member exists
            });
        }

        if (!gym) {
            console.error('Gym not found after population');
            return res.status(404).json({ message: 'Gym not found' });
        }

        // Log the gym document to debug
        console.log('Gym document:', gym);

        // Handle case where members array might be null or undefined
        const members = gym.members || [];
        console.log('Members after population:', members);

        res.json(members);
    } catch (error) {
        console.error('Error in GET /members:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get membership requests (Gym and Trainers)
router.get('/membership-requests', authMiddleware, async (req, res) => {
    if (req.user.role !== 'gym' && req.user.role !== 'trainer') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        // Validate req.user
        if (!req.user || !req.user.id) {
            console.error('Invalid user in req:', req.user);
            return res.status(401).json({ message: 'User authentication failed' });
        }

        let gym;
        if (req.user.role === 'gym') {
            console.log(`Fetching gym with ID ${req.user.id} for gym role`);
            gym = await Gym.findById(req.user.id);
        } else {
            console.log(`Fetching trainer with ID ${req.user.id} for trainer role`);
            const trainer = await Trainer.findById(req.user.id);
            if (!trainer) {
                console.error(`Trainer not found for ID ${req.user.id}`);
                return res.status(404).json({ message: 'Trainer not found' });
            }
            if (!trainer.gym) {
                console.error(`Trainer with ID ${req.user.id} is not associated with a gym`);
                return res.status(404).json({ message: 'Trainer not associated with a gym' });
            }
            console.log(`Fetching gym with ID ${trainer.gym} for trainer`);
            gym = await Gym.findById(trainer.gym);
        }

        if (!gym) {
            console.error('Gym not found after population');
            return res.status(404).json({ message: 'Gym not found' });
        }

        console.log('Gym document:', gym);

        const membershipRequests = await MembershipRequest.find({ gym: gym._id })
            .populate({
                path: 'member',
                select: 'name email',
                match: { _id: { $ne: null } }, // Ensure member exists
            })
            .sort({ createdAt: -1 });

        // Filter out requests where member population failed (null)
        const validRequests = membershipRequests.filter((req) => req.member !== null);
        console.log('Membership requests after population:', validRequests);

        res.json(validRequests);
    } catch (error) {
        console.error('Error in GET /membership-requests:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get specific gym details (MUST BE AFTER /members and /membership-requests routes)
router.get('/:id', async (req, res) => {
    try {
        // Validate the ID parameter
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.error(`Invalid gym ID: ${req.params.id}`);
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
        console.error('Error in GET /:id:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Accept join request (Gym and Trainers)
router.post('/requests/:requestId/accept', authMiddleware, async (req, res) => {
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
                return res.status(404).json({ message: 'Trainer not found or not associated with a gym' });
            }
            gym = await Gym.findById(trainer.gym);
            // Trainers can only accept Member requests
            if (joinRequest.userModel !== 'Member') {
                return res.status(403).json({ message: 'Trainers can only manage Member join requests' });
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
        console.error('Error in POST /requests/:requestId/accept:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Deny join request (Gym and Trainers)
router.post('/requests/:requestId/deny', authMiddleware, async (req, res) => {
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
                return res.status(404).json({ message: 'Trainer not found or not associated with a gym' });
            }
            gym = await Gym.findById(trainer.gym);
            if (joinRequest.userModel !== 'Member') {
                return res.status(403).json({ message: 'Trainers can only manage Member join requests' });
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
        console.error('Error in POST /requests/:requestId/deny:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update membership (Gym and Trainers)
router.put('/members/:memberId/membership', authMiddleware, async (req, res) => {
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
                return res.status(404).json({ message: 'Trainer not found or not associated with a gym' });
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
        console.error('Error in PUT /members/:memberId/membership:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Approve or deny membership request (Gym and Trainers)
router.post('/membership-requests/:requestId/action', authMiddleware, async (req, res) => {
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
                return res.status(404).json({ message: 'Trainer not found or not associated with a gym' });
            }
            gym = await Gym.findById(trainer.gym);
        }

        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        const membershipRequest = await MembershipRequest.findById(req.params.requestId).populate('member');
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
        console.error('Error in POST /membership-requests/:requestId/action:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;

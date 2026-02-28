const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const ChatMessage = require('../models/ChatMessage');
const Announcement = require('../models/Announcement');
const Trainer = require('../models/Trainer');
const Member = require('../models/Member');
const Gym = require('../models/Gym');
const paginate = require('../utils/paginate');

// Get chat messages between sender and receiver within a gym
router.get('/messages/:gymId/:receiverId', authMiddleware, async (req, res, next) => {
    const { gymId, receiverId } = req.params;

    try {
        const senderModel = req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1);
        const receiver = await getUserModel(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: 'Receiver not found' });
        }
        const receiverModel = receiver.role.charAt(0).toUpperCase() + receiver.role.slice(1);

        // Chat restrictions
        if (req.user.role === 'trainer') {
            // Trainers can chat with Members and Gym Profile
            if (receiverModel !== 'Member' && receiverModel !== 'Gym') {
                return res.status(403).json({ message: 'Trainers can only chat with Members and the Gym Profile' });
            }
        } else if (req.user.role === 'member') {
            // Members can only chat with Trainers
            if (receiverModel !== 'Trainer') {
                return res.status(403).json({ message: 'Members can only chat with Trainers' });
            }
        } else if (req.user.role === 'gym') {
            // Gym Profiles can only chat with Trainers
            if (receiverModel !== 'Trainer') {
                return res.status(403).json({ message: 'Gym Profiles can only chat with Trainers' });
            }
        }

        const messages = await ChatMessage.find({
            $or: [
                { sender: req.user.id, senderModel, receiver: receiverId, receiverModel, gym: gymId },
                { sender: receiverId, senderModel: receiverModel, receiver: req.user.id, receiverModel: senderModel, gym: gymId },
            ],
        }).sort({ timestamp: 1 });

        res.json(messages);
    } catch (error) {
        next(error);
    }
});

// Post an announcement (Gym only)
router.post('/announcements', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'gym') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ message: 'Message is required' });
    }

    try {
        const announcement = new Announcement({
            gym: req.user.id,
            sender: req.user.id,
            senderModel: 'Gym',
            message,
        });

        await announcement.save();

        // Emit announcement to all connected Members in the gym
        const io = req.app.get('socketio');
        io.to(req.user.id).emit('announcement', announcement);

        res.status(201).json({ message: 'Announcement posted', announcement });
    } catch (error) {
        next(error);
    }
});

// Update an announcement (Gym only)
router.put('/announcements/:id', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'gym') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ message: 'Message is required' });
    }

    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        if (announcement.sender.toString() !== req.user.id || announcement.senderModel !== 'Gym') {
            return res.status(403).json({ message: 'Not authorized to edit this announcement' });
        }

        announcement.message = message;
        await announcement.save();

        // Emit updated announcement to all connected Members in the gym
        const io = req.app.get('socketio');
        io.to(announcement.gym.toString()).emit('announcementUpdate', announcement);

        res.json({ message: 'Announcement updated', announcement });
    } catch (error) {
        next(error);
    }
});

// Delete an announcement (Gym only)
router.delete('/announcements/:id', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'gym') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        if (announcement.sender.toString() !== req.user.id || announcement.senderModel !== 'Gym') {
            return res.status(403).json({ message: 'Not authorized to delete this announcement' });
        }

        await announcement.deleteOne();

        // Emit deletion event to all connected Members in the gym
        const io = req.app.get('socketio');
        io.to(announcement.gym.toString()).emit('announcementDelete', req.params.id);

        res.json({ message: 'Announcement deleted' });
    } catch (error) {
        next(error);
    }
});

// Get announcements for a Member's gym
router.get('/announcements', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const member = await Member.findById(req.user.id);
        if (!member || !member.gym) {
            return res.status(404).json({ message: 'Member not found or not associated with a gym' });
        }

        const filter = { gym: member.gym };
        const query = Announcement.find(filter)
            .populate('sender', 'name email gymName')
            .sort({ timestamp: -1 });
        const result = await paginate(Announcement, filter, query, req);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Get announcements for a Gym Profile
router.get('/announcements/gym', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'gym') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const filter = { gym: req.user.id };
        const query = Announcement.find(filter)
            .populate('sender', 'name email gymName')
            .sort({ timestamp: -1 });
        const result = await paginate(Announcement, filter, query, req);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Helper function to determine user model
async function getUserModel(userId) {
    let user = await Member.findById(userId);
    if (user) return user;

    user = await Trainer.findById(userId);
    if (user) return user;

    user = await Gym.findById(userId);
    if (user) return user;

    return null;
}

module.exports = router;
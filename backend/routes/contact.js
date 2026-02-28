const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const ContactMessage = require('../models/ContactMessage');
const { contactValidation, messageIdValidation } = require('../validators/contact.validators');

// Submit a contact message (public route)
router.post('/messages', contactValidation, validate, async (req, res, next) => {
    const { name, email, phone, subject, message } = req.body;

    try {
        const contactMessage = new ContactMessage({
            name,
            email,
            phone,
            subject,
            message,
        });

        await contactMessage.save();
        res.status(201).json({ message: 'Contact message submitted successfully' });
    } catch (error) {
        next(error);
    }
});

// Get all contact messages (Admin only)
router.get('/messages', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const messages = await ContactMessage.find().sort({ createdAt: -1 });
        res.json(messages);
    } catch (error) {
        next(error);
    }
});

// Delete a contact message (Admin only)
router.delete('/messages/:id', authMiddleware, messageIdValidation, validate, async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const message = await ContactMessage.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ message: 'Contact message not found' });
        }

        await message.deleteOne();
        res.json({ message: 'Contact message deleted' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
import express from 'express';
const router = express.Router();
import authMiddleware from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import ContactMessage from '../models/ContactMessage.js';
import { contactValidation, messageIdValidation } from '../validators/contact.validators.js';
import paginate from '../utils/paginate.js';

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
        const filter = {};
        const query = ContactMessage.find(filter).sort({ createdAt: -1 });
        const result = await paginate(ContactMessage, filter, query, req);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Delete a contact message (Admin only)
router.delete(
    '/messages/:id',
    authMiddleware,
    messageIdValidation,
    validate,
    async (req, res, next) => {
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
    },
);

export default router;

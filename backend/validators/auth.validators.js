const { body } = require('express-validator');

const registerValidation = [
    body('role')
        .trim()
        .notEmpty().withMessage('Role is required')
        .isIn(['admin', 'gym', 'trainer', 'member']).withMessage('Invalid role'),
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('contact')
        .if(body('role').isIn(['member', 'trainer']))
        .trim()
        .notEmpty().withMessage('Contact is required for members and trainers'),
];

const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required'),
    body('role')
        .trim()
        .notEmpty().withMessage('Role is required')
        .isIn(['admin', 'gym', 'trainer', 'member']).withMessage('Invalid role'),
];

const profileUpdateValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('password')
        .optional()
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

module.exports = {
    registerValidation,
    loginValidation,
    profileUpdateValidation,
};

const { body, param } = require('express-validator');

const gymUpdateValidation = [
    body('gymName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Gym name must be between 2 and 100 characters'),
    body('address')
        .optional()
        .trim()
        .isLength({ min: 5 }).withMessage('Address must be at least 5 characters'),
    body('ownerName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Owner name must be between 2 and 50 characters'),
    body('ownerEmail')
        .optional()
        .trim()
        .isEmail().withMessage('Please provide a valid owner email')
        .normalizeEmail(),
];

const joinGymValidation = [
    param('gymId')
        .isMongoId().withMessage('Invalid gym ID'),
];

const memberIdValidation = [
    param('memberId')
        .isMongoId().withMessage('Invalid member ID'),
];

const trainerIdValidation = [
    param('trainerId')
        .isMongoId().withMessage('Invalid trainer ID'),
];

const requestActionValidation = [
    param('requestId')
        .isMongoId().withMessage('Invalid request ID'),
    body('action')
        .trim()
        .notEmpty().withMessage('Action is required')
        .isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
];

const membershipRequestActionValidation = [
    param('requestId')
        .isMongoId().withMessage('Invalid request ID'),
    body('action')
        .trim()
        .notEmpty().withMessage('Action is required')
        .isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
];

module.exports = {
    gymUpdateValidation,
    joinGymValidation,
    memberIdValidation,
    trainerIdValidation,
    requestActionValidation,
    membershipRequestActionValidation,
};

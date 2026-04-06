const { body, param } = require('express-validator');

const gymUpdateValidation = [
    body('gymName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Gym name must be between 2 and 100 characters'),
    body('address')
        .optional()
        .trim()
        .isLength({ min: 5 })
        .withMessage('Address must be at least 5 characters'),
    body('ownerName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Owner name must be between 2 and 50 characters'),
    body('ownerEmail')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Please provide a valid owner email')
        .normalizeEmail(),
    body('city')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('City name must be at most 100 characters'),
    body('hiringStatus')
        .optional()
        .trim()
        .isIn(['hiring', 'not_hiring'])
        .withMessage('Hiring status must be hiring or not_hiring'),
];

const joinGymValidation = [
    param('gymId').isMongoId().withMessage('Invalid gym ID'),
    body('message')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Application message must be at most 500 characters'),
];

const memberIdValidation = [param('memberId').isMongoId().withMessage('Invalid member ID')];

const trainerIdValidation = [param('trainerId').isMongoId().withMessage('Invalid trainer ID')];

const requestActionValidation = [
    param('requestId').isMongoId().withMessage('Invalid request ID'),
    body('action')
        .trim()
        .notEmpty()
        .withMessage('Action is required')
        .isIn(['approve', 'reject'])
        .withMessage('Action must be approve or reject'),
];

const membershipRequestActionValidation = [
    param('requestId').isMongoId().withMessage('Invalid request ID'),
    body('action')
        .trim()
        .notEmpty()
        .withMessage('Action is required')
        .isIn(['approve', 'reject'])
        .withMessage('Action must be approve or reject'),
];

module.exports = {
    gymUpdateValidation,
    joinGymValidation,
    memberIdValidation,
    trainerIdValidation,
    requestActionValidation,
    membershipRequestActionValidation,
};

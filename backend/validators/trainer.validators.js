const { body, param } = require('express-validator');

const workoutPlanValidation = [
    body('memberId')
        .notEmpty().withMessage('Member ID is required')
        .isMongoId().withMessage('Invalid member ID'),
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ min: 2, max: 100 }).withMessage('Title must be between 2 and 100 characters'),
    body('exercises')
        .isArray({ min: 1 }).withMessage('At least one exercise is required'),
];

const workoutPlanUpdateValidation = [
    param('id')
        .isMongoId().withMessage('Invalid workout plan ID'),
    body('title')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Title must be between 2 and 100 characters'),
    body('exercises')
        .optional()
        .isArray({ min: 1 }).withMessage('At least one exercise is required'),
];

const dietPlanValidation = [
    body('memberId')
        .notEmpty().withMessage('Member ID is required')
        .isMongoId().withMessage('Invalid member ID'),
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ min: 2, max: 100 }).withMessage('Title must be between 2 and 100 characters'),
    body('meals')
        .isArray({ min: 1 }).withMessage('At least one meal is required'),
];

const dietPlanUpdateValidation = [
    param('id')
        .isMongoId().withMessage('Invalid diet plan ID'),
    body('title')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Title must be between 2 and 100 characters'),
    body('meals')
        .optional()
        .isArray({ min: 1 }).withMessage('At least one meal is required'),
];

const planIdValidation = [
    param('id')
        .isMongoId().withMessage('Invalid plan ID'),
];

const scheduleValidation = [
    body('workoutPlanId')
        .notEmpty().withMessage('Workout plan ID is required')
        .isMongoId().withMessage('Invalid workout plan ID'),
    body('memberId')
        .notEmpty().withMessage('Member ID is required')
        .isMongoId().withMessage('Invalid member ID'),
    body('dateTime')
        .notEmpty().withMessage('Date and time is required')
        .isISO8601().withMessage('Invalid date format'),
];

const scheduleUpdateValidation = [
    param('id')
        .isMongoId().withMessage('Invalid schedule ID'),
    body('dateTime')
        .notEmpty().withMessage('Date and time is required')
        .isISO8601().withMessage('Invalid date format'),
];

const scheduleIdValidation = [
    param('id')
        .isMongoId().withMessage('Invalid schedule ID'),
];

const planRequestValidation = [
    body('trainerId')
        .notEmpty().withMessage('Trainer ID is required')
        .isMongoId().withMessage('Invalid trainer ID'),
    body('requestType')
        .trim()
        .notEmpty().withMessage('Request type is required')
        .isIn(['workout', 'diet']).withMessage('Request type must be workout or diet'),
];

const planRequestActionValidation = [
    param('id')
        .isMongoId().withMessage('Invalid request ID'),
    body('action')
        .trim()
        .notEmpty().withMessage('Action is required')
        .isIn(['approve', 'deny']).withMessage('Action must be approve or deny'),
];

const trainerScheduleValidation = [
    body('startTime')
        .notEmpty().withMessage('Start time is required')
        .isISO8601().withMessage('Invalid start time format'),
    body('endTime')
        .notEmpty().withMessage('End time is required')
        .isISO8601().withMessage('Invalid end time format'),
];

const bookSessionValidation = [
    param('scheduleId')
        .isMongoId().withMessage('Invalid schedule ID'),
];

module.exports = {
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
};

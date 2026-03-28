const { body, param } = require('express-validator');

const macroLogValidation = [
    body('food').trim().notEmpty().withMessage('Food name is required'),
    body('macros')
        .notEmpty()
        .withMessage('Macros data is required')
        .isObject()
        .withMessage('Macros must be an object'),
    body('macros.calories')
        .notEmpty()
        .withMessage('Calories is required')
        .isNumeric()
        .withMessage('Calories must be a number'),
    body('macros.protein')
        .notEmpty()
        .withMessage('Protein is required')
        .isNumeric()
        .withMessage('Protein must be a number'),
    body('macros.carbs')
        .notEmpty()
        .withMessage('Carbs is required')
        .isNumeric()
        .withMessage('Carbs must be a number'),
    body('macros.fats')
        .notEmpty()
        .withMessage('Fats is required')
        .isNumeric()
        .withMessage('Fats must be a number'),
];

const macroIdValidation = [param('id').isMongoId().withMessage('Invalid macro log ID')];

const progressLogValidation = [
    body('weight')
        .notEmpty()
        .withMessage('Weight is required')
        .isNumeric()
        .withMessage('Weight must be a number'),
    body('muscleMass')
        .notEmpty()
        .withMessage('Muscle mass is required')
        .isNumeric()
        .withMessage('Muscle mass must be a number'),
    body('fatPercentage')
        .notEmpty()
        .withMessage('Fat percentage is required')
        .isNumeric()
        .withMessage('Fat percentage must be a number'),
];

const progressIdValidation = [param('id').isMongoId().withMessage('Invalid progress log ID')];

const membershipUpdateValidation = [
    body('requestedDuration')
        .trim()
        .notEmpty()
        .withMessage('Duration is required')
        .isIn(['1 week', '1 month', '3 months', '6 months', '1 year'])
        .withMessage('Invalid membership duration'),
];

const workoutLogValidation = [
    body('date')
        .optional()
        .isISO8601()
        .withMessage('Date must be a valid ISO 8601 date')
        .custom((value) => {
            const inputDate = new Date(value);
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            if (inputDate > today) {
                throw new Error('Date cannot be in the future');
            }
            return true;
        }),
    body('note')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Note must be 200 characters or less'),
];

const workoutLogIdValidation = [param('id').isMongoId().withMessage('Invalid workout log ID')];

const scheduleValidation = [
    body('workoutSchedule')
        .isArray({ min: 1, max: 7 })
        .withMessage('workoutSchedule must be an array with 1–7 entries')
        .custom((arr) => {
            if (!arr.every((v) => Number.isInteger(v) && v >= 0 && v <= 6)) {
                throw new Error('Each value must be an integer 0 (Sun) – 6 (Sat)');
            }
            if (new Set(arr).size !== arr.length) {
                throw new Error('Duplicate days are not allowed');
            }
            return true;
        }),
];

module.exports = {
    macroLogValidation,
    macroIdValidation,
    progressLogValidation,
    progressIdValidation,
    membershipUpdateValidation,
    workoutLogValidation,
    workoutLogIdValidation,
    scheduleValidation,
};

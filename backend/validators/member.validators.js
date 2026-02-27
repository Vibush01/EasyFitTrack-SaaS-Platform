const { body, param } = require('express-validator');

const macroLogValidation = [
    body('food')
        .trim()
        .notEmpty().withMessage('Food name is required'),
    body('macros')
        .notEmpty().withMessage('Macros data is required')
        .isObject().withMessage('Macros must be an object'),
    body('macros.calories')
        .notEmpty().withMessage('Calories is required')
        .isNumeric().withMessage('Calories must be a number'),
    body('macros.protein')
        .notEmpty().withMessage('Protein is required')
        .isNumeric().withMessage('Protein must be a number'),
    body('macros.carbs')
        .notEmpty().withMessage('Carbs is required')
        .isNumeric().withMessage('Carbs must be a number'),
    body('macros.fats')
        .notEmpty().withMessage('Fats is required')
        .isNumeric().withMessage('Fats must be a number'),
];

const macroIdValidation = [
    param('id')
        .isMongoId().withMessage('Invalid macro log ID'),
];

const progressLogValidation = [
    body('weight')
        .notEmpty().withMessage('Weight is required')
        .isNumeric().withMessage('Weight must be a number'),
    body('muscleMass')
        .notEmpty().withMessage('Muscle mass is required')
        .isNumeric().withMessage('Muscle mass must be a number'),
    body('fatPercentage')
        .notEmpty().withMessage('Fat percentage is required')
        .isNumeric().withMessage('Fat percentage must be a number'),
];

const progressIdValidation = [
    param('id')
        .isMongoId().withMessage('Invalid progress log ID'),
];

const membershipUpdateValidation = [
    body('duration')
        .trim()
        .notEmpty().withMessage('Duration is required')
        .isIn(['1 week', '1 month', '3 months', '6 months', '1 year']).withMessage('Invalid membership duration'),
];

module.exports = {
    macroLogValidation,
    macroIdValidation,
    progressLogValidation,
    progressIdValidation,
    membershipUpdateValidation,
};

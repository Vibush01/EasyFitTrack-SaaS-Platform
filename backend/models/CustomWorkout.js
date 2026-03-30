const mongoose = require('mongoose');

const customWorkoutSchema = new mongoose.Schema(
    {
        member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
        title: { type: String, required: true, trim: true, maxlength: 100 },
        isTemplate: { type: Boolean, default: false }, // true = reusable template (no date)
        date: { type: Date, default: null }, // null for templates; midnight UTC for day-sessions
        exercises: [
            {
                name: { type: String, required: true },
                sets: { type: Number, required: true, min: 1 },
                reps: { type: Number, required: true, min: 1 },
                rest: { type: String, default: '' },
            },
        ],
        completedExercises: { type: [Number], default: [] },
        status: {
            type: String,
            enum: ['in_progress', 'completed'],
            default: 'in_progress',
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model('CustomWorkout', customWorkoutSchema);

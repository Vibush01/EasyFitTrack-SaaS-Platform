const mongoose = require('mongoose');

const customWorkoutSchema = new mongoose.Schema(
    {
        member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
        title: { type: String, required: true, trim: true, maxlength: 100 },
        date: { type: Date, required: true }, // midnight UTC of the workout day
        exercises: [
            {
                name: { type: String, required: true },
                sets: { type: Number, required: true, min: 1 },
                reps: { type: Number, required: true, min: 1 },
                rest: { type: String, default: '' }, // e.g. "60s"
            },
        ],
        completedExercises: { type: [Number], default: [] }, // indices of checked exercises
        status: {
            type: String,
            enum: ['in_progress', 'completed'],
            default: 'in_progress',
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model('CustomWorkout', customWorkoutSchema);

const mongoose = require('mongoose');

const workoutSessionSchema = new mongoose.Schema(
    {
        member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
        workoutPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutPlan', required: true },
        date: { type: Date, required: true }, // midnight UTC of the session day
        completedExercises: { type: [Number], default: [] }, // indices of checked exercises
        status: {
            type: String,
            enum: ['in_progress', 'completed'],
            default: 'in_progress',
        },
    },
    { timestamps: true },
);

// One session per member + plan + day
workoutSessionSchema.index({ member: 1, workoutPlan: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('WorkoutSession', workoutSessionSchema);

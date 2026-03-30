const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema(
    {
        member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
        date: { type: Date, required: true }, // midnight UTC
        sourceType: {
            type: String,
            enum: ['trainer_plan', 'custom_template'],
            required: true,
        },
        sourcePlanId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WorkoutPlan',
            default: null,
        },
        sourceTemplateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CustomWorkout',
            default: null,
        },
        title: { type: String, required: true },
        // Snapshot of exercises at opt-in time (so editing template later won't affect in-progress session)
        exercises: [
            {
                name: { type: String, required: true },
                sets: { type: Number, required: true },
                reps: { type: Number, required: true },
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

// Efficient lookup for today's logs
dailyLogSchema.index({ member: 1, date: 1, status: 1 });

module.exports = mongoose.model('DailyLog', dailyLogSchema);

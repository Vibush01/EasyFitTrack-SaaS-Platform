const mongoose = require('mongoose');

const workoutPlanSchema = new mongoose.Schema({
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    gym: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', default: null },
    clientType: { type: String, enum: ['gym', 'personal'], default: 'gym' },
    title: { type: String, required: true },
    description: { type: String },
    exercises: [
        {
            name: { type: String, required: true },
            sets: { type: Number, required: true },
            reps: { type: Number, required: true },
            rest: { type: String }, // e.g., "30 seconds"
        },
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);

const mongoose = require('mongoose');

const workoutLogSchema = new mongoose.Schema(
    {
        member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
        date: { type: Date, required: true },
        note: { type: String, maxlength: 200, default: '' },
    },
    { timestamps: true },
);

// Prevent duplicate logs for the same member on the same day
workoutLogSchema.index({ member: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);

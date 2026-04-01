const mongoose = require('mongoose');

const liftSchema = new mongoose.Schema(
    {
        exercise: {
            type: String,
            enum: ['squat', 'bench', 'deadlift', 'ohp', 'custom'],
            required: true,
        },
        customName: { type: String, default: '' }, // only when exercise === 'custom'
        weight1RM: { type: Number, required: true, min: 0 }, // kg
    },
    { _id: false },
);

const progressLogSchema = new mongoose.Schema({
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    // Body composition fields — all optional so a strength-only entry is valid
    weight: { type: Number, default: null },
    muscleMass: { type: Number, default: null },
    fatPercentage: { type: Number, default: null },
    images: [{ type: String }], // Cloudinary URLs
    // Strength tracking — array of lifts logged in this session
    lifts: { type: [liftSchema], default: [] },
    date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ProgressLog', progressLogSchema);

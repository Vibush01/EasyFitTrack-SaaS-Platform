const mongoose = require('mongoose');

const coachingRequestSchema = new mongoose.Schema({
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true },
    message: { type: String, default: '', maxlength: 500 }, // Member's introduction / reason
    status: { type: String, enum: ['pending', 'accepted', 'denied'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
});

// Prevent duplicate pending requests from the same member to the same trainer
coachingRequestSchema.index({ member: 1, trainer: 1, status: 1 });

module.exports = mongoose.model('CoachingRequest', coachingRequestSchema);

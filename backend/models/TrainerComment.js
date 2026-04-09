const mongoose = require('mongoose');

const trainerCommentSchema = new mongoose.Schema(
    {
        // Who wrote the comment
        author: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'authorModel' },
        authorModel: {
            type: String,
            required: true,
            enum: ['Trainer', 'Member'],
        },

        // The member this conversation thread concerns
        member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },

        // The trainer in the conversation
        trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true },

        // What log entry this comment is about
        targetType: {
            type: String,
            required: true,
            enum: ['workout_log', 'macro_log'],
        },
        targetId: { type: mongoose.Schema.Types.ObjectId, required: true },

        // Threading: null = top-level comment, ObjectId = reply to another comment
        parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainerComment', default: null },

        // The comment text
        comment: { type: String, required: true, maxlength: 300 },
    },
    { timestamps: true },
);

// Efficient lookups: all comments for a member, or all comments on a specific log entry
trainerCommentSchema.index({ member: 1, trainer: 1, createdAt: -1 });
trainerCommentSchema.index({ targetType: 1, targetId: 1, createdAt: 1 });

module.exports = mongoose.model('TrainerComment', trainerCommentSchema);

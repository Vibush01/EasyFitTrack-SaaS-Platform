const mongoose = require('mongoose');
const logger = require('../utils/logger');

const eventLogSchema = new mongoose.Schema({
    event: { type: String, required: true }, // e.g., "Login", "Register"
    page: { type: String }, // e.g., "N/A", "/gyms"
    user: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'userModel' },
    userModel: { type: String, required: true, enum: ['Admin', 'Gym', 'Trainer', 'Member'] },
    details: { type: String }, // e.g., "Admin logged in"
    createdAt: { type: Date, default: Date.now },
});

// On-demand cleanup: runs inline after each save (no cron needed — safe for Render free tier)
eventLogSchema.post('save', async function (doc) {
    try {
        const count = await mongoose.model('EventLog').countDocuments();
        if (count > 1000) {
            const oldestEvents = await mongoose
                .model('EventLog')
                .find()
                .sort({ createdAt: 1 })
                .limit(count - 1000);
            const idsToDelete = oldestEvents.map((event) => event._id);
            await mongoose.model('EventLog').deleteMany({ _id: { $in: idsToDelete } });
        }
    } catch (error) {
        logger.error('Error in event log cleanup:', error);
    }
});

module.exports = mongoose.model('EventLog', eventLogSchema);

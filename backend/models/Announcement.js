import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
    gym: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'senderModel' },
    senderModel: { type: String, required: true, enum: ['Gym'] }, // Only Gym Profiles can post
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

export default mongoose.model('Announcement', announcementSchema);

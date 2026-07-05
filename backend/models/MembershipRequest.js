import mongoose from 'mongoose';

const membershipRequestSchema = new mongoose.Schema({
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    gym: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
    requestedDuration: {
        type: String,
        enum: ['1 week', '1 month', '3 months', '6 months', '1 year'],
        required: true,
    },
    status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('MembershipRequest', membershipRequestSchema);

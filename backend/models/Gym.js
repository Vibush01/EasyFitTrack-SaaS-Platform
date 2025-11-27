const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const gymSchema = new mongoose.Schema({
    gymName: { type: String, required: true },
    address: { type: String, required: true },
    photos: [{ type: String }], // Cloudinary URLs
    primaryImage: { type: String }, // URL of the primary image
    ownerName: { type: String, required: true },
    ownerEmail: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'gym' },
    profileImage: { type: String },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }], // List of member IDs
    trainers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trainer' }], // List of trainer IDs
    membershipPlans: [{
        duration: { type: String, enum: ['1 week', '1 month', '3 months', '6 months', '1 year'] },
        price: { type: Number },
    }],
    joinRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'JoinRequest' }], // Pending requests
});

gymSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

gymSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Gym', gymSchema);
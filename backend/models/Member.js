const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const memberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    contact: { type: String, required: true },
    role: { type: String, default: 'member' },
    profileImage: { type: String },
    gym: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', default: null },
    membership: {
        duration: { type: String, enum: ['1 week', '1 month', '3 months', '6 months', '1 year'] },
        startDate: { type: Date },
        endDate: { type: Date },
    },
    // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    workoutSchedule: {
        type: [Number],
        default: [0, 1, 2, 3, 4, 5, 6],
        validate: {
            validator: (arr) => arr.every((v) => Number.isInteger(v) && v >= 0 && v <= 6),
            message: 'workoutSchedule must contain integers 0-6',
        },
    },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Virtual: compute membership status from endDate
memberSchema.virtual('membershipStatus').get(function () {
    if (!this.membership || !this.membership.endDate) return 'none';
    const now = new Date();
    const end = new Date(this.membership.endDate);
    const diffMs = now - end; // positive = past expiry
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays <= 0) return 'active';       // not expired yet
    if (diffDays <= 5) return 'grace';         // 1-5 days past expiry
    if (diffDays <= 10) return 'suspended';    // 5-10 days past expiry
    return 'terminated';                       // >10 days past expiry
});

memberSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

memberSchema.methods.matchPassword = async function (enteredPassword) {
    try {
        if (!this.password || typeof this.password !== 'string') {
            throw new Error('Password is missing or invalid in the database');
        }
        return await bcrypt.compare(enteredPassword, this.password);
    } catch (error) {
        throw new Error(`Password comparison failed: ${error.message}`);
    }
};

module.exports = mongoose.model('Member', memberSchema);

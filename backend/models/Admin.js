import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' },
    profileImage: { type: String },
});

adminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

adminSchema.methods.matchPassword = async function (enteredPassword) {
    try {
        if (!this.password || typeof this.password !== 'string') {
            throw new Error('Password is missing or invalid in the database');
        }
        return await bcrypt.compare(enteredPassword, this.password);
    } catch (error) {
        throw new Error(`Password comparison failed: ${error.message}`);
    }
};

export default mongoose.model('Admin', adminSchema);

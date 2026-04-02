const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const trainerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    experienceYears: { type: Number, required: true },
    experienceMonths: { type: Number, required: true },
    role: { type: String, default: 'trainer' },
    profileImage: { type: String },
    gym: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', default: null }, // Gym they belong to
    personalClients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }], // Independent coaching clients
});

trainerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

trainerSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Trainer', trainerSchema);

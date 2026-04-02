const mongoose = require('mongoose');

const dietPlanSchema = new mongoose.Schema({
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    gym: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', default: null },
    clientType: { type: String, enum: ['gym', 'personal'], default: 'gym' },
    title: { type: String, required: true },
    description: { type: String },
    meals: [
        {
            name: { type: String, required: true },
            calories: { type: Number, required: true },
            protein: { type: Number, required: true },
            carbs: { type: Number, required: true },
            fats: { type: Number, required: true },
            time: { type: String }, // e.g., "8:00 AM"
        },
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('DietPlan', dietPlanSchema);

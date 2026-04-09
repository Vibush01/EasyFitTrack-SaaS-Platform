const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema(
    {
        mealName: { type: String, required: true },
        calories: { type: Number, required: true, min: 0 },
        protein: { type: Number, required: true, min: 0 },
        carbs: { type: Number, required: true, min: 0 },
        fats: { type: Number, required: true, min: 0 },
        time: { type: String, default: '' }, // e.g. "8:00 AM"
    },
    { _id: true },
);

const memberDietScheduleSchema = new mongoose.Schema(
    {
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Member',
            required: true,
            unique: true, // One schedule per member
        },
        schedule: {
            monday: { type: [mealSchema], default: [] },
            tuesday: { type: [mealSchema], default: [] },
            wednesday: { type: [mealSchema], default: [] },
            thursday: { type: [mealSchema], default: [] },
            friday: { type: [mealSchema], default: [] },
            saturday: { type: [mealSchema], default: [] },
            sunday: { type: [mealSchema], default: [] },
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model('MemberDietSchedule', memberDietScheduleSchema);

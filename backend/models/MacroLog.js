import mongoose from 'mongoose';

const macroLogSchema = new mongoose.Schema({
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    food: { type: String, required: true },
    macros: {
        calories: { type: Number, required: true },
        protein: { type: Number, required: true },
        carbs: { type: Number, required: true },
        fats: { type: Number, required: true },
    },
    date: { type: Date, default: Date.now },
});

export default mongoose.model('MacroLog', macroLogSchema);

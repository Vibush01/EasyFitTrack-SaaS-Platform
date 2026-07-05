import mongoose from 'mongoose';

const workoutScheduleSchema = new mongoose.Schema({
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    gym: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
    workoutPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutPlan', required: true },
    dateTime: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('WorkoutSchedule', workoutScheduleSchema);

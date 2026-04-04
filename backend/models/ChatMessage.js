const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'senderModel' },
    senderModel: { type: String, required: true, enum: ['Member', 'Trainer', 'Gym'] },
    receiver: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'receiverModel' },
    receiverModel: { type: String, required: true, enum: ['Member', 'Trainer', 'Gym'] },
    gym: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', default: null },
    chatType: { type: String, enum: ['gym', 'personal'], default: 'gym' },
    message: { type: String, required: true },
    status: { type: String, enum: ['sent', 'read'], default: 'sent' },
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);

const ChatMessage = require('../models/ChatMessage');
const logger = require('../utils/logger');

/**
 * Initialize Socket.IO event handlers.
 * Extracts all socket logic from server.js for cleaner separation of concerns.
 *
 * @param {import('socket.io').Server} io - The Socket.IO server instance
 */
const initializeSocket = (io) => {
    io.on('connection', (socket) => {

        // Join a gym room
        socket.on('joinGym', (gymId) => {
            socket.join(gymId);
        });

        // Handle chat messages
        socket.on('sendMessage', async (messageData) => {
            const { senderId, senderModel, receiverId, receiverModel, gymId, message } = messageData;

            try {
                const chatMessage = new ChatMessage({
                    sender: senderId,
                    senderModel,
                    receiver: receiverId,
                    receiverModel,
                    gym: gymId,
                    message,
                    status: 'sent',
                });

                await chatMessage.save();

                // Emit the message to both sender and receiver
                io.to(gymId).emit('message', chatMessage);
            } catch (error) {
                logger.error('Error saving message:', error);
            }
        });

        // Handle marking messages as read
        socket.on('markMessagesAsRead', async ({ senderId, receiverId, gymId }) => {
            try {
                // Update all messages sent by senderId to receiverId that are 'sent' to 'read'
                await ChatMessage.updateMany(
                    { sender: senderId, receiver: receiverId, status: 'sent' },
                    { $set: { status: 'read' } }
                );

                // Emit event to notify the sender that their messages were read
                io.to(gymId).emit('messagesRead', { senderId, receiverId });
            } catch (error) {
                logger.error('Error marking messages as read:', error);
            }
        });

        socket.on('disconnect', () => {
        });
    });
};

module.exports = initializeSocket;

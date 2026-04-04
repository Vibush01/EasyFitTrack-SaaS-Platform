const ChatMessage = require('../models/ChatMessage');
const logger = require('../utils/logger');

/**
 * Generate a deterministic DM room name from two user IDs.
 * Sorting ensures both users get the same room regardless of who initiates.
 */
const getDMRoom = (userId1, userId2) => {
    const sorted = [userId1, userId2].sort();
    return `dm_${sorted[0]}_${sorted[1]}`;
};

/**
 * Initialize Socket.IO event handlers.
 * Extracts all socket logic from server.js for cleaner separation of concerns.
 *
 * @param {import('socket.io').Server} io - The Socket.IO server instance
 */
const initializeSocket = (io) => {
    io.on('connection', (socket) => {
        // ─── Gym Chat (existing) ─────────────────────────────────

        // Join a gym room
        socket.on('joinGym', (gymId) => {
            socket.join(gymId);
        });

        // Handle chat messages
        socket.on('sendMessage', async (messageData) => {
            const { senderId, senderModel, receiverId, receiverModel, gymId, message } =
                messageData;

            try {
                const chatMessage = new ChatMessage({
                    sender: senderId,
                    senderModel,
                    receiver: receiverId,
                    receiverModel,
                    gym: gymId,
                    chatType: 'gym',
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
                await ChatMessage.updateMany(
                    { sender: senderId, receiver: receiverId, status: 'sent' },
                    { $set: { status: 'read' } },
                );

                io.to(gymId).emit('messagesRead', { senderId, receiverId });
            } catch (error) {
                logger.error('Error marking messages as read:', error);
            }
        });

        // ─── Personal DM Chat (new) ─────────────────────────────

        // Join a personal DM room
        socket.on('joinPersonalRoom', ({ myId, otherUserId }) => {
            const room = getDMRoom(myId, otherUserId);
            socket.join(room);
        });

        // Handle personal DM messages
        socket.on('sendPersonalMessage', async (messageData) => {
            const { senderId, senderModel, receiverId, receiverModel, message } = messageData;

            try {
                const chatMessage = new ChatMessage({
                    sender: senderId,
                    senderModel,
                    receiver: receiverId,
                    receiverModel,
                    gym: null,
                    chatType: 'personal',
                    message,
                    status: 'sent',
                });

                await chatMessage.save();

                const room = getDMRoom(senderId, receiverId);
                io.to(room).emit('personalMessage', chatMessage);
            } catch (error) {
                logger.error('Error saving personal message:', error);
            }
        });

        // Handle marking personal DM messages as read
        socket.on('markPersonalMessagesAsRead', async ({ senderId, receiverId }) => {
            try {
                await ChatMessage.updateMany(
                    {
                        sender: senderId,
                        receiver: receiverId,
                        chatType: 'personal',
                        status: 'sent',
                    },
                    { $set: { status: 'read' } },
                );

                const room = getDMRoom(senderId, receiverId);
                io.to(room).emit('personalMessagesRead', { senderId, receiverId });
            } catch (error) {
                logger.error('Error marking personal messages as read:', error);
            }
        });

        socket.on('disconnect', () => {});
    });
};

module.exports = initializeSocket;

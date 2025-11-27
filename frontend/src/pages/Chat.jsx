import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const Chat = () => {
    const { user, userDetails } = useContext(AuthContext);
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [receivers, setReceivers] = useState([]);
    const [selectedReceiver, setSelectedReceiver] = useState(null);
    const [error, setError] = useState('');
    const [unreadCounts, setUnreadCounts] = useState({}); // Track unread messages
    const [showChat, setShowChat] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        // Determine the gym ID based on user role
        let gymId;
        if (user.role === 'gym') {
            gymId = user.id; // Gym Profiles use their own ID as the gym ID
        } else {
            if (!userDetails || !userDetails.gym) {
                setError('You must be in a gym to chat');
                return;
            }
            gymId = userDetails.gym;
        }

        // Initialize Socket.IO
        // Remove /api from the URL for socket connection
        const socketUrl = API_URL.replace('/api', '');
        socketRef.current = io(socketUrl);

        socketRef.current.on('connect', () => {
            socketRef.current.emit('joinGym', gymId);
        });

        socketRef.current.on('message', (newMessage) => {
            setMessages((prev) => {
                // If the message is from the selected receiver, add it to the list
                if (selectedReceiver && newMessage.sender === selectedReceiver._id) {
                    // Mark as read immediately if chat is open
                    socketRef.current.emit('markMessagesAsRead', {
                        senderId: newMessage.sender,
                        receiverId: user.id,
                        gymId
                    });
                    return [...prev, { ...newMessage, status: 'read' }];
                } else if (newMessage.sender === user.id) {
                    // If I sent the message, add it
                    return [...prev, newMessage];
                }
                return prev;
            });

            // If the message is NOT from the selected receiver (or no receiver selected), increment unread count
            if (!selectedReceiver || newMessage.sender !== selectedReceiver._id) {
                if (newMessage.sender !== user.id) {
                    setUnreadCounts((prev) => ({
                        ...prev,
                        [newMessage.sender]: (prev[newMessage.sender] || 0) + 1,
                    }));
                    toast.info(`New message from ${newMessage.senderModel}`, { position: 'top-right' });
                }
            }
        });

        socketRef.current.on('messagesRead', ({ senderId, receiverId }) => {
            // If I am the sender (senderId) and the other person (receiverId) read my messages
            if (senderId === user.id) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.receiver === receiverId ? { ...msg, status: 'read' } : msg
                    )
                );
            }
        });

        // Fetch gym members and trainers based on role restrictions
        const fetchReceivers = async () => {
            try {
                const res = await axios.get(`${API_URL}/gym/${gymId}`);
                const gym = res.data;
                const receiversList = [];

                if (user.role === 'gym') {
                    // Gym Profiles can only chat with Trainers
                    gym.trainers.forEach((trainer) =>
                        receiversList.push({ _id: trainer._id, name: trainer.name, role: 'trainer' })
                    );
                } else if (user.role === 'trainer') {
                    // Trainers can chat with Members and the Gym Profile
                    receiversList.push({ _id: gym._id, name: gym.gymName, role: 'gym' });
                    gym.members.forEach((member) =>
                        receiversList.push({ _id: member._id, name: member.name, role: 'member' })
                    );
                } else if (user.role === 'member') {
                    // Members can only chat with Trainers
                    gym.trainers.forEach((trainer) =>
                        receiversList.push({ _id: trainer._id, name: trainer.name, role: 'trainer' })
                    );
                }

                setReceivers(receiversList);
            } catch (err) {
                setError('Failed to fetch receivers');
                toast.error('Failed to fetch receivers' + err, { position: 'top-right' });
            }
        };

        fetchReceivers();

        return () => {
            socketRef.current.disconnect();
        };
    }, [user, userDetails, selectedReceiver]); // Add selectedReceiver to dependency array to handle unread logic correctly

    const fetchMessages = async (receiverId) => {
        try {
            const gymId = user.role === 'gym' ? user.id : userDetails.gym;
            const res = await axios.get(`${API_URL}/chat/messages/${gymId}/${receiverId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setMessages(res.data);

            // Mark messages as read when fetching
            socketRef.current.emit('markMessagesAsRead', {
                senderId: receiverId,
                receiverId: user.id,
                gymId
            });

            // Clear unread count for this receiver
            setUnreadCounts((prev) => {
                const newCounts = { ...prev };
                delete newCounts[receiverId];
                return newCounts;
            });

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch messages');
            toast.error(err.response?.data?.message || 'Failed to fetch messages', { position: 'top-right' });
        }
    };

    const handleReceiverSelect = (receiver) => {
        setSelectedReceiver(receiver);
        setShowChat(true);
        fetchMessages(receiver._id);
    };

    const handleBackToReceivers = () => {
        setShowChat(false);
        setSelectedReceiver(null);
    };

    const handleSendMessage = () => {
        if (!message.trim() || !selectedReceiver) return;

        const senderModel = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        const receiverModel = selectedReceiver.role.charAt(0).toUpperCase() + selectedReceiver.role.slice(1);
        const gymId = user.role === 'gym' ? user.id : userDetails.gym;

        const messageData = {
            senderId: user.id,
            senderModel,
            receiverId: selectedReceiver._id,
            receiverModel,
            gymId,
            message,
        };

        socketRef.current.emit('sendMessage', messageData);
        setMessage('');
    };

    // Animation Variants
    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
    };

    const zoomIn = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
    };

    const buttonHover = {
        hover: { scale: 1.05, boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)', transition: { duration: 0.3 } },
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 transition-colors duration-300">
                <motion.p
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="text-red-500 text-lg sm:text-xl font-semibold text-center"
                >
                    You must be logged in to access chat
                </motion.p>
            </div>
        );
    }

    if ((user.role !== 'gym' && (!userDetails || !userDetails.gym)) || error) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 transition-colors duration-300">
                <motion.p
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="text-red-500 text-lg sm:text-xl font-semibold text-center"
                >
                    {error || 'You must be in a gym to access chat'}
                </motion.p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="container mx-auto flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6 h-[calc(100vh-100px)]">
                {/* Receivers List */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className={`w-full lg:w-1/4 bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)] flex-col ${showChat ? 'hidden lg:flex' : 'flex'}`}
                >
                    <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-[var(--text-primary)]">Chat With</h2>
                    {error && (
                        <motion.p
                            initial="hidden"
                            animate="visible"
                            variants={fadeIn}
                            className="text-red-500 mb-6 text-sm sm:text-base"
                        >
                            {error}
                        </motion.p>
                    )}
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {receivers.length > 0 ? (
                            <ul className="space-y-3">
                                {receivers.map((receiver) => (
                                    <motion.li
                                        key={receiver._id}
                                        onClick={() => handleReceiverSelect(receiver)}
                                        className={`p-4 rounded-xl cursor-pointer transition-all duration-300 text-sm sm:text-base font-medium flex items-center justify-between gap-3 ${selectedReceiver?._id === receiver._id
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card)] border border-[var(--border-color)]'
                                            }`}
                                        whileHover={{ scale: 1.02 }}
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: true }}
                                        variants={zoomIn}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${selectedReceiver?._id === receiver._id ? 'bg-white' : 'bg-blue-500'}`}></div>
                                            <div>
                                                <span className="block">{receiver.name}</span>
                                                <span className="text-xs opacity-70">({receiver.role})</span>
                                            </div>
                                        </div>
                                        {unreadCounts[receiver._id] > 0 && (
                                            <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                {unreadCounts[receiver._id]}
                                            </div>
                                        )}
                                    </motion.li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-[var(--text-secondary)] text-sm sm:text-base">No users to chat with</p>
                        )}
                    </div>
                </motion.div>

                {/* Chat Messages */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className={`w-full lg:w-3/4 bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)] flex-col ${showChat ? 'flex' : 'hidden lg:flex'}`}
                >
                    <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-[var(--text-primary)] flex items-center gap-3">
                        {selectedReceiver && (
                            <button
                                onClick={handleBackToReceivers}
                                className="lg:hidden p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        {selectedReceiver ? `Chat with ${selectedReceiver.name}` : 'Chat'}
                    </h2>
                    {selectedReceiver ? (
                        <>
                            <div className="flex-1 overflow-y-auto mb-6 p-4 border border-[var(--border-color)] rounded-xl bg-[var(--bg-primary)] custom-scrollbar">
                                {messages.map((msg, index) => (
                                    <motion.div
                                        key={index}
                                        className={`mb-4 flex ${msg.sender.toString() === user.id ? 'justify-end' : 'justify-start'
                                            }`}
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: true }}
                                        variants={zoomIn}
                                    >
                                        <div className={`max-w-[70%] ${msg.sender.toString() === user.id ? 'items-end' : 'items-start'} flex flex-col`}>
                                            <p
                                                className={`p-4 rounded-2xl text-sm sm:text-base shadow-md ${msg.sender.toString() === user.id
                                                    ? 'bg-blue-600 text-white rounded-br-none'
                                                    : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-bl-none border border-[var(--border-color)]'
                                                    }`}
                                            >
                                                {msg.message}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1 px-1">
                                                <p className="text-[var(--text-secondary)] text-xs">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                {msg.sender.toString() === user.id && (
                                                    <span className={`text-xs ${msg.status === 'read' ? 'text-blue-400' : 'text-gray-500'}`}>
                                                        {msg.status === 'read' ? '✓✓' : '✓'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="flex space-x-4">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    className="flex-1 p-3 sm:p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[var(--text-primary)] placeholder-gray-500 transition-all duration-300"
                                    placeholder="Type a message..."
                                />
                                <motion.button
                                    onClick={handleSendMessage}
                                    whileHover="hover"
                                    variants={buttonHover}
                                    className="bg-blue-600 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:bg-blue-700 transition-all duration-300 shadow-lg shadow-blue-600/20"
                                >
                                    Send
                                </motion.button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-secondary)]">
                            <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <p className="text-lg">Select a user to start chatting</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Chat;
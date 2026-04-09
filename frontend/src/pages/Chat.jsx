import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const Chat = () => {
    const { user, userDetails } = useContext(AuthContext);
    const navigate = useNavigate();

    // ─── State ──────────────────────────────────────────
    const [chatMode, setChatMode] = useState('gym'); // 'gym' | 'personal'
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [receivers, setReceivers] = useState([]);
    const [selectedReceiver, setSelectedReceiver] = useState(null);
    const [error, setError] = useState('');
    const [unreadCounts, setUnreadCounts] = useState({});
    const [showChat, setShowChat] = useState(false);
    const [hasPersonalConnections, setHasPersonalConnections] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    const hasGym = user?.role === 'gym' || userDetails?.gym;

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-select mode based on what's available
    useEffect(() => {
        if (!hasGym && hasPersonalConnections) {
            setChatMode('personal');
        }
    }, [hasGym, hasPersonalConnections]);

    // ─── Socket Setup ──────────────────────────────────
    useEffect(() => {
        const socketUrl = API_URL.replace('/api', '');
        socketRef.current = io(socketUrl);

        const gymId = user?.role === 'gym' ? user.id : userDetails?.gym;

        socketRef.current.on('connect', () => {
            // Join gym room if available
            if (gymId) {
                socketRef.current.emit('joinGym', gymId);
            }
        });

        // ── Gym Chat events ──
        socketRef.current.on('message', (newMessage) => {
            if (chatMode !== 'gym') return;
            setMessages((prev) => {
                if (selectedReceiver && newMessage.sender === selectedReceiver._id) {
                    socketRef.current.emit('markMessagesAsRead', {
                        senderId: newMessage.sender,
                        receiverId: user.id,
                        gymId
                    });
                    return [...prev, { ...newMessage, status: 'read' }];
                } else if (newMessage.sender === user.id) {
                    return [...prev, newMessage];
                }
                return prev;
            });

            if (!selectedReceiver || newMessage.sender !== selectedReceiver._id) {
                if (newMessage.sender !== user.id) {
                    setUnreadCounts((prev) => ({
                        ...prev,
                        [newMessage.sender]: (prev[newMessage.sender] || 0) + 1,
                    }));
                }
            }
        });

        socketRef.current.on('messagesRead', ({ senderId, receiverId }) => {
            if (senderId === user.id) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.receiver === receiverId ? { ...msg, status: 'read' } : msg
                    )
                );
            }
        });

        // ── Personal DM events ──
        socketRef.current.on('personalMessage', (newMessage) => {
            if (chatMode !== 'personal') return;
            setMessages((prev) => {
                if (selectedReceiver && newMessage.sender === selectedReceiver._id) {
                    socketRef.current.emit('markPersonalMessagesAsRead', {
                        senderId: newMessage.sender,
                        receiverId: user.id,
                    });
                    return [...prev, { ...newMessage, status: 'read' }];
                } else if (newMessage.sender === user.id) {
                    return [...prev, newMessage];
                }
                return prev;
            });

            if (!selectedReceiver || newMessage.sender !== selectedReceiver._id) {
                if (newMessage.sender !== user.id) {
                    setUnreadCounts((prev) => ({
                        ...prev,
                        [`dm_${newMessage.sender}`]: (prev[`dm_${newMessage.sender}`] || 0) + 1,
                    }));
                }
            }
        });

        socketRef.current.on('personalMessagesRead', ({ senderId, receiverId }) => {
            if (senderId === user.id) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.receiver === receiverId ? { ...msg, status: 'read' } : msg
                    )
                );
            }
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [user, userDetails, selectedReceiver, chatMode]);

    // ─── Fetch Receivers ───────────────────────────────
    useEffect(() => {
        if (chatMode === 'gym') {
            fetchGymReceivers();
        } else {
            fetchPersonalReceivers();
        }
        // Clear selection and search when switching modes
        setSelectedReceiver(null);
        setMessages([]);
        setShowChat(false);
        setSearchQuery('');
    }, [chatMode]);

    const fetchGymReceivers = async () => {
        const gymId = user?.role === 'gym' ? user.id : userDetails?.gym;
        if (!gymId) return;

        try {
            const res = await axios.get(`${API_URL}/gym/${gymId}`);
            const gym = res.data;
            const receiversList = [];

            if (user.role === 'gym') {
                gym.trainers.forEach((trainer) =>
                    receiversList.push({ _id: trainer._id, name: trainer.name, role: 'trainer' })
                );
            } else if (user.role === 'trainer') {
                receiversList.push({ _id: gym._id, name: gym.gymName, role: 'gym' });
                gym.members.forEach((member) =>
                    receiversList.push({ _id: member._id, name: member.name, role: 'member' })
                );

                // Cross-reference with personal clients to add PT badge
                try {
                    const clientsRes = await axios.get(`${API_URL}/trainer/clients`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    });
                    const personalIds = new Set(
                        (clientsRes.data.personalClients || []).map(c => c._id)
                    );
                    receiversList.forEach(r => {
                        if (personalIds.has(r._id)) r.isPT = true;
                    });
                    if (personalIds.size > 0) setHasPersonalConnections(true);
                } catch { /* badge is non-critical */ }
            } else if (user.role === 'member') {
                gym.trainers.forEach((trainer) =>
                    receiversList.push({ _id: trainer._id, name: trainer.name, role: 'trainer' })
                );

                // Cross-reference with coaching requests to badge personal coaches
                try {
                    const reqsRes = await axios.get(`${API_URL}/trainer/coaching-requests/member`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    });
                    const coachIds = new Set(
                        (reqsRes.data || []).filter(r => r.status === 'accepted').map(r => r.trainer?._id || r.trainer)
                    );
                    receiversList.forEach(r => {
                        if (coachIds.has(r._id)) r.isPT = true;
                    });
                    if (coachIds.size > 0) setHasPersonalConnections(true);
                } catch { /* silent */ }
            }

            // Sort: PT clients first
            receiversList.sort((a, b) => (b.isPT ? 1 : 0) - (a.isPT ? 1 : 0));

            setReceivers(receiversList);
        } catch (err) {
            setError('Failed to fetch receivers');
        }
    };

    const fetchPersonalReceivers = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const receiversList = [];

            if (user.role === 'trainer') {
                const res = await axios.get(`${API_URL}/trainer/clients`, { headers });
                (res.data.personalClients || []).forEach(c => {
                    receiversList.push({ _id: c._id, name: c.name, role: 'member', isPT: true, profileImage: c.profileImage });
                });
            } else if (user.role === 'member') {
                const res = await axios.get(`${API_URL}/trainer/coaching-requests/member`, { headers });
                (res.data || []).filter(r => r.status === 'accepted').forEach(r => {
                    const trainer = r.trainer;
                    if (trainer) {
                        receiversList.push({
                            _id: trainer._id || trainer,
                            name: trainer.name || 'Trainer',
                            role: 'trainer',
                            isPT: true,
                            profileImage: trainer.profileImage,
                        });
                    }
                });
            }

            setHasPersonalConnections(receiversList.length > 0);

            // Join personal DM rooms for all connections
            receiversList.forEach(r => {
                socketRef.current?.emit('joinPersonalRoom', { myId: user.id, otherUserId: r._id });
            });

            setReceivers(receiversList);
        } catch (err) {
            setError('Failed to fetch personal contacts');
        }
    };

    // ─── Fetch Messages ────────────────────────────────
    const fetchMessages = async (receiverId) => {
        try {
            let res;
            if (chatMode === 'gym') {
                const gymId = user.role === 'gym' ? user.id : userDetails.gym;
                res = await axios.get(`${API_URL}/chat/messages/${gymId}/${receiverId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                socketRef.current.emit('markMessagesAsRead', {
                    senderId: receiverId,
                    receiverId: user.id,
                    gymId
                });
            } else {
                res = await axios.get(`${API_URL}/chat/dm/${receiverId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                socketRef.current.emit('markPersonalMessagesAsRead', {
                    senderId: receiverId,
                    receiverId: user.id,
                });
            }

            setMessages(res.data);

            // Clear unread for this receiver
            setUnreadCounts((prev) => {
                const newCounts = { ...prev };
                const key = chatMode === 'personal' ? `dm_${receiverId}` : receiverId;
                delete newCounts[key];
                return newCounts;
            });
        } catch (err) {
            toast.error('Failed to fetch messages', { position: 'top-right' });
        }
    };

    // ─── Handlers ──────────────────────────────────────
    const handleReceiverSelect = (receiver) => {
        setSelectedReceiver(receiver);
        setShowChat(true);

        // Join DM room if personal mode
        if (chatMode === 'personal') {
            socketRef.current?.emit('joinPersonalRoom', { myId: user.id, otherUserId: receiver._id });
        }

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

        if (chatMode === 'gym') {
            const gymId = user.role === 'gym' ? user.id : userDetails.gym;
            socketRef.current.emit('sendMessage', {
                senderId: user.id,
                senderModel,
                receiverId: selectedReceiver._id,
                receiverModel,
                gymId,
                message,
            });
        } else {
            socketRef.current.emit('sendPersonalMessage', {
                senderId: user.id,
                senderModel,
                receiverId: selectedReceiver._id,
                receiverModel,
                message,
            });
        }

        setMessage('');
    };

    // ─── Render Helpers ────────────────────────────────
    const getUnreadKey = (receiverId) => chatMode === 'personal' ? `dm_${receiverId}` : receiverId;

    // Show mode tabs whenever user has a gym OR personal connections (so gym users always see both tabs)
    const showModeTabs = hasGym || hasPersonalConnections;
    const showOnlyPersonal = !hasGym && hasPersonalConnections;

    // Filter receivers by search query
    const filteredReceivers = receivers.filter((receiver) =>
        receiver.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receiver.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ─── Access Check ──────────────────────────────────
    if (!user) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
                <p className="text-red-500 text-lg font-semibold text-center">
                    You must be logged in to access chat
                </p>
            </div>
        );
    }

    if (!hasGym && !hasPersonalConnections && chatMode === 'gym') {
        // Check for personal connections on mount
        if (user.role === 'trainer' || user.role === 'member') {
            // Will be resolved by useEffect
        }
    }

    if (!hasGym && !hasPersonalConnections) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <p className="text-[var(--text-primary)] font-bold text-lg mb-2">No Chat Available</p>
                    <p className="text-[var(--text-secondary)] text-sm">
                        Join a gym or connect with a personal coach to start chatting
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
            <div className="h-[100dvh] flex flex-col pt-2 sm:pt-6 pb-2 sm:pb-6 px-2 sm:px-6 lg:px-8">
                <div className="container mx-auto flex flex-col flex-1 min-h-0 gap-2 sm:gap-4">

                    {/* Mode Toggle — show whenever user has gym or personal connections */}
                    {showModeTabs && (
                        <div className="flex gap-2 px-1">
                            {hasGym && (
                                <button
                                    onClick={() => setChatMode('gym')}
                                    className={`flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all duration-300 ${
                                        chatMode === 'gym'
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                            : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                                    }`}
                                >
                                    🏢 Gym Chat
                                </button>
                            )}
                            <button
                                onClick={() => setChatMode('personal')}
                                className={`flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all duration-300 ${
                                    chatMode === 'personal'
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                                        : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                                }`}
                            >
                                💬 Personal DMs
                            </button>
                        </div>
                    )}

                    {/* Chat Layout */}
                    <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-2 sm:gap-4">

                        {/* ── Sidebar: Receivers List ── */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`w-full lg:w-1/4 bg-[var(--bg-card)] rounded-xl sm:rounded-2xl shadow-xl border border-[var(--border-color)] flex-col min-h-0 ${showChat ? 'hidden lg:flex' : 'flex'}`}
                        >
                            <div className="p-4 sm:p-6 border-b border-[var(--border-color)]">
                                <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                                    {chatMode === 'gym' ? '🏢 Gym Chat' : '💬 Personal DMs'}
                                </h2>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">
                                    {chatMode === 'gym' ? 'Chat with your gym' : 'Chat with your coaches / clients'}
                                </p>
                                {/* Search / filter bar */}
                                <div className="mt-3 relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search members, trainers..."
                                        className="w-full pl-9 pr-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-gray-500 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-300"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 sm:p-3 custom-scrollbar">
                                {filteredReceivers.length > 0 ? (
                                    <ul className="space-y-1.5 sm:space-y-2">
                                        {filteredReceivers.map((receiver) => (
                                            <li
                                                key={receiver._id}
                                                onClick={() => handleReceiverSelect(receiver)}
                                                className={`p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-200 text-sm font-medium flex items-center justify-between gap-2 ${
                                                    selectedReceiver?._id === receiver._id
                                                        ? chatMode === 'personal'
                                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                                                            : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] border border-transparent hover:border-[var(--border-color)]'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    {/* Avatar */}
                                                    {receiver.profileImage ? (
                                                        <img src={receiver.profileImage} alt="" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0" />
                                                    ) : (
                                                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                                                            receiver.isPT ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-blue-500 to-blue-600'
                                                        }`}>
                                                            {receiver.name?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <span className="block truncate text-sm leading-tight">
                                                            {receiver.name}
                                                        </span>
                                                        <span className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="text-[11px] opacity-60">{receiver.role}</span>
                                                            {receiver.isPT && (
                                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                                                    selectedReceiver?._id === receiver._id
                                                                        ? 'bg-white/20 text-white'
                                                                        : 'bg-purple-500/20 text-purple-400'
                                                                }`}>⭐ PT</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                                {unreadCounts[getUnreadKey(receiver._id)] > 0 && (
                                                    <div className={`${chatMode === 'personal' ? 'bg-purple-500' : 'bg-red-500'} text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0`}>
                                                        {unreadCounts[getUnreadKey(receiver._id)]}
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : receivers.length > 0 && searchQuery ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                        <svg className="w-10 h-10 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <p className="text-[var(--text-secondary)] text-sm">
                                            No results for "{searchQuery}"
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                        <p className="text-[var(--text-secondary)] text-sm">
                                            {chatMode === 'gym' ? 'No gym members to chat with' : 'No personal connections yet'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* ── Main Chat Area ── */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`w-full lg:w-3/4 bg-[var(--bg-card)] rounded-xl sm:rounded-2xl shadow-xl border border-[var(--border-color)] flex-col min-h-0 ${showChat ? 'flex' : 'hidden lg:flex'}`}
                        >
                            {selectedReceiver ? (
                                <>
                                    {/* Chat Header */}
                                    <div className="flex items-center gap-3 p-3 sm:p-5 border-b border-[var(--border-color)]">
                                        <button
                                            onClick={handleBackToReceivers}
                                            className="lg:hidden p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        {selectedReceiver.profileImage ? (
                                            <img src={selectedReceiver.profileImage} alt="" className="w-9 h-9 rounded-full object-cover" />
                                        ) : (
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                                selectedReceiver.isPT ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-blue-600'
                                            }`}>
                                                {selectedReceiver.name?.charAt(0)?.toUpperCase()}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] truncate">
                                                {selectedReceiver.name}
                                            </h2>
                                            <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                                                {selectedReceiver.role}
                                                {selectedReceiver.isPT && (
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400">⭐ PT</span>
                                                )}
                                                {chatMode === 'personal' && (
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400">Personal DM</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-3 sm:p-5 custom-scrollbar bg-[var(--bg-primary)]/50">
                                        {messages.length === 0 ? (
                                            <div className="flex items-center justify-center h-full">
                                                <p className="text-[var(--text-secondary)] text-sm">No messages yet. Say hi! 👋</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 sm:space-y-3">
                                                {messages.map((msg, index) => {
                                                    const isMine = msg.sender?.toString() === user.id;
                                                    return (
                                                        <div key={index} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`max-w-[80%] sm:max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                                                                <p className={`px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl text-[13px] sm:text-sm leading-relaxed shadow-sm ${
                                                                    isMine
                                                                        ? chatMode === 'personal'
                                                                            ? 'bg-purple-600 text-white rounded-br-md'
                                                                            : 'bg-blue-600 text-white rounded-br-md'
                                                                        : 'bg-[var(--bg-card)] text-[var(--text-primary)] rounded-bl-md border border-[var(--border-color)]'
                                                                }`}>
                                                                    {msg.message}
                                                                </p>
                                                                <div className="flex items-center gap-1 mt-0.5 px-1">
                                                                    <p className="text-[var(--text-secondary)] text-[10px] sm:text-xs">
                                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                    {isMine && (
                                                                        <span className={`text-[10px] sm:text-xs ${msg.status === 'read' ? 'text-blue-400' : 'text-gray-500'}`}>
                                                                            {msg.status === 'read' ? '✓✓' : '✓'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div ref={messagesEndRef} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Message Input */}
                                    <div className="p-2.5 sm:p-4 border-t border-[var(--border-color)]">
                                        <div className="flex gap-2 sm:gap-3">
                                            <input
                                                type="text"
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                                className="flex-1 px-3.5 py-2.5 sm:px-4 sm:py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[var(--text-primary)] placeholder-gray-500 text-sm transition-all duration-300"
                                                placeholder="Type a message..."
                                            />
                                            <motion.button
                                                onClick={handleSendMessage}
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                                className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-white text-sm transition-all duration-300 shadow-lg ${
                                                    chatMode === 'personal'
                                                        ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20'
                                                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                                                }`}
                                            >
                                                Send
                                            </motion.button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-secondary)] p-8">
                                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-4 ${
                                        chatMode === 'personal' ? 'bg-purple-500/10' : 'bg-[var(--bg-secondary)]'
                                    }`}>
                                        <svg className={`w-8 h-8 sm:w-10 sm:h-10 ${chatMode === 'personal' ? 'text-purple-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <p className="text-base sm:text-lg font-medium">
                                        {chatMode === 'personal' ? 'Select a personal coaching contact' : 'Select a user to start chatting'}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import io from 'socket.io-client';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const Announcements = () => {
    const { user, userDetails } = useContext(AuthContext);
    const [announcements, setAnnouncements] = useState([]);
    const [error, setError] = useState('');
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!user || !userDetails || !userDetails.gym) {
            setError('You must be in a gym to view announcements');
            return;
        }

        // Initialize Socket.IO
        // Remove /api from the URL for socket connection
        const socketUrl = API_URL.replace('/api', '');
        const socketInstance = io(socketUrl);
        setSocket(socketInstance);

        socketInstance.on('connect', () => {
            socketInstance.emit('joinGym', userDetails.gym);
        });

        socketInstance.on('announcement', (announcement) => {
            setAnnouncements((prev) => [announcement, ...prev]);
        });

        socketInstance.on('announcementUpdate', (updatedAnnouncement) => {
            setAnnouncements((prev) =>
                prev.map((ann) => (ann._id === updatedAnnouncement._id ? updatedAnnouncement : ann))
            );
        });

        socketInstance.on('announcementDelete', (announcementId) => {
            setAnnouncements((prev) => prev.filter((ann) => ann._id !== announcementId));
        });

        // Fetch announcements
        const fetchAnnouncements = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/chat/announcements`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAnnouncements(res.data.data || res.data);
            } catch (err) {
                console.error('Error fetching announcements:', err);
                setError('Failed to fetch announcements');
                toast.error('Failed to fetch announcements' + err, { position: "top-right" });
            }
        };

        fetchAnnouncements();

        return () => {
            socketInstance.disconnect();
        };
    }, [user, userDetails]);

    // Animation Variants
    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
    };

    const zoomIn = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
    };

    if (user?.role !== 'member') {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 transition-colors duration-300">
                <motion.p
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="text-red-500 text-lg sm:text-xl font-semibold text-center"
                >
                    Access denied. This page is only for Members.
                </motion.p>
            </div>
        );
    }

    if (!userDetails?.gym) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 transition-colors duration-300">
                <motion.p
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="text-red-500 text-lg sm:text-xl font-semibold text-center"
                >
                    {error}
                </motion.p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4 sm:py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="container mx-auto max-w-3xl relative z-10">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="text-center mb-8 sm:mb-12"
                >
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        Announcements
                    </h1>
                    <p className="text-[var(--text-secondary)] text-base sm:text-lg max-w-xl mx-auto px-2">
                        Stay updated with the latest news, events, and important information from your gym.
                    </p>
                </motion.div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 text-center backdrop-blur-sm"
                    >
                        {error}
                    </motion.div>
                )}

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="space-y-4 sm:space-y-6"
                >
                    {announcements.length > 0 ? (
                        announcements.map((announcement) => (
                            <motion.div
                                key={announcement._id}
                                variants={zoomIn}
                                className="group relative bg-[var(--bg-card)]/80 backdrop-blur-md border border-[var(--border-color)] p-5 sm:p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:bg-[var(--bg-card)] transition-all duration-300 overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shrink-0">
                                            {announcement.sender?.gymName?.charAt(0) || announcement.sender?.name?.charAt(0) || 'G'}
                                        </div>
                                        <div>
                                            <h3 className="text-[var(--text-primary)] font-semibold text-base sm:text-lg">
                                                {announcement.sender?.gymName || announcement.sender?.name || 'Gym Admin'}
                                            </h3>
                                            <span className="text-[10px] sm:text-xs text-blue-400 font-medium px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                                                Gym Owner
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-[var(--text-secondary)] text-xs sm:text-sm font-medium bg-black/20 px-3 py-1 rounded-full whitespace-nowrap self-start sm:self-auto">
                                        {new Date(announcement.timestamp).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </span>
                                </div>

                                <div className="pl-0 sm:pl-16">
                                    <p className="text-[var(--text-primary)] leading-relaxed text-sm sm:text-base border-l-2 border-[var(--border-color)] pl-4 sm:border-none sm:pl-0 break-words">
                                        {announcement.message}
                                    </p>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div
                            variants={zoomIn}
                            className="bg-[var(--bg-card)]/80 backdrop-blur-md border border-[var(--border-color)] p-8 sm:p-12 rounded-2xl text-center shadow-xl"
                        >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-2">No Announcements Yet</h3>
                            <p className="text-[var(--text-secondary)] text-sm sm:text-base max-w-md mx-auto">
                                Your gym hasn't posted any announcements recently. Check back later for updates!
                            </p>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Announcements;
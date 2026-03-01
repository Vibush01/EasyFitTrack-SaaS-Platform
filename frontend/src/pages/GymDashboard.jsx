import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const GymDashboard = () => {
    const { user, userDetails } = useContext(AuthContext);
    const [requests, setRequests] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [announcementForm, setAnnouncementForm] = useState('');
    const [editAnnouncementId, setEditAnnouncementId] = useState(null);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/gym/requests`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRequests(res.data);
            } catch (err) {
                toast.error('Failed to fetch join requests' + err, { position: "top-right" });
            }
        };

        const fetchAnnouncements = async () => {
            if (user?.role === 'gym') {
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(`${API_URL}/chat/announcements/gym`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setAnnouncements(res.data.data || res.data);
                } catch (err) {
                    toast.error('Failed to fetch announcements' + err, { position: "top-right" });
                }
            }
        };

        if (user?.role === 'gym' || (user?.role === 'trainer' && userDetails?.gym)) {
            fetchRequests();
        }
        if (user?.role === 'gym') {
            fetchAnnouncements();
        }
    }, [user, userDetails]);

    const handleAccept = async (requestId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/gym/requests/${requestId}/accept`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRequests(requests.filter((req) => req._id !== requestId));
            toast.success('Request accepted', { position: "top-right" });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to accept request', { position: "top-right" });
        }
    };

    const handleDeny = async (requestId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/gym/requests/${requestId}/deny`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRequests(requests.filter((req) => req._id !== requestId));
            toast.success('Request denied', { position: "top-right" });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to deny request', { position: "top-right" });
        }
    };

    const handlePostAnnouncement = async (e) => {
        e.preventDefault();
        if (!announcementForm.trim()) {
            toast.error('Announcement message is required', { position: "top-right" });
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (editAnnouncementId) {
                const res = await axios.put(`${API_URL}/chat/announcements/${editAnnouncementId}`, { message: announcementForm }, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAnnouncements(announcements.map((ann) => (ann._id === editAnnouncementId ? res.data.announcement : ann)));
                setEditAnnouncementId(null);
                toast.success('Announcement updated', { position: "top-right" });
            } else {
                const res = await axios.post(`${API_URL}/chat/announcements`, { message: announcementForm }, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAnnouncements([res.data.announcement, ...announcements]);
                toast.success('Announcement posted', { position: "top-right" });
            }
            setAnnouncementForm('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to post announcement', { position: "top-right" });
        }
    };

    const handleEditAnnouncement = (announcement) => {
        setAnnouncementForm(announcement.message);
        setEditAnnouncementId(announcement._id);
    };

    const handleDeleteAnnouncement = async (announcementId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/chat/announcements/${announcementId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAnnouncements(announcements.filter((ann) => ann._id !== announcementId));
            toast.success('Announcement deleted', { position: "top-right" });
        } catch (err) {
            toast.error('Failed to delete announcement' + err, { position: "top-right" });
        }
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
        hover: { scale: 1.02, transition: { duration: 0.2 } },
    };

    if (user?.role !== 'gym' && user?.role !== 'trainer') {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 transition-colors duration-300">
                <motion.p
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="text-red-500 text-lg sm:text-xl font-semibold text-center"
                >
                    Access denied. This page is only for Gym Profiles and Trainers.
                </motion.p>
            </div>
        );
    }

    const isTrainerInGym = user?.role === 'trainer' && userDetails?.gym;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="container mx-auto max-w-6xl">
                <motion.h1
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="text-3xl sm:text-4xl font-bold mb-12 text-center text-[var(--text-primary)] tracking-tight"
                >
                    {user.role === 'gym' ? 'Gym Dashboard' : 'Trainer Dashboard'}
                </motion.h1>

                {/* Quick Links for Trainers Not in a Gym */}
                {user.role === 'trainer' && !isTrainerInGym && (
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)] mb-8"
                    >
                        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-[var(--text-primary)]">Quick Links</h2>
                        <div className="flex flex-col space-y-4">
                            <motion.div whileHover="hover" variants={buttonHover}>
                                <Link
                                    to="/gyms"
                                    className="block bg-blue-600 text-white px-6 py-4 rounded-xl hover:bg-blue-700 transition-all duration-300 text-center text-sm sm:text-base font-bold shadow-lg shadow-blue-600/20"
                                >
                                    Find Gym
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {/* Announcements Section for Gym Profile */}
                {user.role === 'gym' && (
                    <div className="mb-12">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeIn}
                            className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)] mb-8"
                        >
                            <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">
                                {editAnnouncementId ? 'Edit Announcement' : 'Post Announcement'}
                            </h2>
                            <form onSubmit={handlePostAnnouncement}>
                                <motion.div variants={fadeIn} className="mb-6">
                                    <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">
                                        Message
                                    </label>
                                    <textarea
                                        value={announcementForm}
                                        onChange={(e) => setAnnouncementForm(e.target.value)}
                                        className="w-full p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[var(--text-primary)] placeholder-gray-500 transition-all duration-300"
                                        rows="3"
                                        placeholder="Type your announcement here..."
                                        required
                                    />
                                </motion.div>
                                <div className="flex gap-4">
                                    <motion.button
                                        type="submit"
                                        whileHover="hover"
                                        variants={buttonHover}
                                        className="flex-1 bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition-all duration-300 shadow-lg shadow-blue-600/20"
                                    >
                                        {editAnnouncementId ? 'Update' : 'Post'}
                                    </motion.button>
                                    {editAnnouncementId && (
                                        <motion.button
                                            type="button"
                                            onClick={() => {
                                                setEditAnnouncementId(null);
                                                setAnnouncementForm('');
                                            }}
                                            whileHover="hover"
                                            variants={buttonHover}
                                            className="flex-1 bg-gray-700 text-white p-4 rounded-xl font-bold hover:bg-gray-600 transition-all duration-300"
                                        >
                                            Cancel
                                        </motion.button>
                                    )}
                                </div>
                            </form>
                        </motion.div>

                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeIn}
                            className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)]"
                        >
                            <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">Your Announcements</h2>
                            {announcements.length > 0 ? (
                                <ul className="space-y-4">
                                    {announcements.map((announcement) => (
                                        <motion.li
                                            key={announcement._id}
                                            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 rounded-xl hover:border-blue-500/50 transition-all duration-300"
                                            initial="hidden"
                                            whileInView="visible"
                                            viewport={{ once: true }}
                                            variants={zoomIn}
                                        >
                                            <p className="text-[var(--text-primary)] mb-4 text-lg">
                                                {announcement.message}
                                            </p>
                                            <p className="text-[var(--text-secondary)] text-sm mb-4">
                                                Posted: {new Date(announcement.timestamp).toLocaleString()}
                                            </p>
                                            <div className="flex gap-3">
                                                <motion.button
                                                    onClick={() => handleEditAnnouncement(announcement)}
                                                    whileHover="hover"
                                                    variants={buttonHover}
                                                    className="px-4 py-2 bg-yellow-600/20 text-yellow-500 border border-yellow-600/50 rounded-lg hover:bg-yellow-600 hover:text-white transition-all duration-300 text-sm font-semibold"
                                                >
                                                    Edit
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => handleDeleteAnnouncement(announcement._id)}
                                                    whileHover="hover"
                                                    variants={buttonHover}
                                                    className="px-4 py-2 bg-red-600/20 text-red-500 border border-red-600/50 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-300 text-sm font-semibold"
                                                >
                                                    Delete
                                                </motion.button>
                                            </div>
                                        </motion.li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                        </svg>
                                    </div>
                                    <p className="text-[var(--text-secondary)]">No announcements posted yet</p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}

                {/* Join Requests Section (Only for Gym or Trainer in a Gym) */}
                {(user.role === 'gym' || isTrainerInGym) && (
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)]"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">
                            {user.role === 'gym' ? 'Join Requests' : 'Member Join Requests'}
                        </h2>
                        {requests.length > 0 ? (
                            <ul className="space-y-4">
                                {requests.map((request) => (
                                    <motion.li
                                        key={request._id}
                                        className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 rounded-xl hover:border-blue-500/50 transition-all duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: true }}
                                        variants={zoomIn}
                                    >
                                        <div>
                                            <p className="text-[var(--text-primary)] font-bold text-lg mb-1">
                                                {request.user.name}
                                            </p>
                                            <p className="text-[var(--text-secondary)] text-sm mb-2">
                                                {request.user.email} • {request.userModel}
                                            </p>
                                            {request.userModel === 'Member' && (
                                                <p className="text-blue-400 text-sm font-medium mb-1">
                                                    Duration: {request.membershipDuration}
                                                </p>
                                            )}
                                            <p className="text-[var(--text-secondary)] text-xs">
                                                Requested: {new Date(request.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-3 w-full sm:w-auto">
                                            <motion.button
                                                onClick={() => handleAccept(request._id)}
                                                whileHover="hover"
                                                variants={buttonHover}
                                                className="flex-1 sm:flex-none px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 font-bold shadow-lg shadow-green-600/20"
                                            >
                                                Accept
                                            </motion.button>
                                            <motion.button
                                                onClick={() => handleDeny(request._id)}
                                                whileHover="hover"
                                                variants={buttonHover}
                                                className="flex-1 sm:flex-none px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 font-bold shadow-lg shadow-red-600/20"
                                            >
                                                Deny
                                            </motion.button>
                                        </div>
                                    </motion.li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                </div>
                                <p className="text-[var(--text-secondary)]">No pending join requests</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default GymDashboard;
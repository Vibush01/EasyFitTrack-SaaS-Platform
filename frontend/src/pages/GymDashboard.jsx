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
    const [expiringMembers, setExpiringMembers] = useState([]);
    const [peakHours, setPeakHours] = useState([]);
    const [growthData, setGrowthData] = useState({ monthlyGrowth: [], totalMembers: 0, totalTrainers: 0 });

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

            // Fetch members expiring within 7 days
            const fetchExpiringMembers = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(`${API_URL}/gym/members/expiring-soon`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setExpiringMembers(res.data);
                } catch (err) {
                    console.error('Failed to fetch expiring members:', err);
                }
            };
            fetchExpiringMembers();

            const fetchPeakHours = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(`${API_URL}/gym/analytics/peak-hours`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setPeakHours(res.data);
                } catch (err) {
                    console.error('Failed to fetch peak hours:', err);
                }
            };
            fetchPeakHours();

            const fetchGrowthData = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(`${API_URL}/gym/analytics/growth`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setGrowthData(res.data);
                } catch (err) {
                    console.error('Failed to fetch growth data:', err);
                }
            };
            fetchGrowthData();
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

    const formatHour = (hour) => {
        if (hour === 0) return '12 AM';
        if (hour === 12) return '12 PM';
        return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
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

                {/* Expiring Soon Section — Gym Owner Only */}
                {user.role === 'gym' && (
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)] mb-8"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center">
                                <span className="bg-orange-500 w-1.5 h-8 rounded-full mr-3"></span>
                                🔔 Expiring Soon
                            </h2>
                            {expiringMembers.length > 0 && (
                                <span className="bg-red-500/15 text-red-400 text-sm font-bold px-3 py-1 rounded-full border border-red-500/25">
                                    {expiringMembers.length} member{expiringMembers.length > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {expiringMembers.length > 0 ? (
                            <ul className="space-y-4">
                                {expiringMembers.map((member) => (
                                    <motion.li
                                        key={member._id}
                                        className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl hover:border-orange-500/50 transition-all duration-300"
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: true }}
                                        variants={zoomIn}
                                    >
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                {member.profileImage ? (
                                                    <img src={member.profileImage} alt={member.name} className="w-12 h-12 rounded-full object-cover border-2 border-[var(--border-color)]" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-lg">
                                                        {member.name?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[var(--text-primary)] font-bold text-base">{member.name}</p>
                                                    <p className="text-[var(--text-secondary)] text-sm">{member.email}</p>
                                                    <p className="text-[var(--text-secondary)] text-xs mt-1">
                                                        Expires: {new Date(member.membership.endDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    member.daysRemaining <= 2
                                                        ? 'bg-red-500/15 text-red-400 border border-red-500/25'
                                                        : member.daysRemaining <= 5
                                                        ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25'
                                                        : 'bg-green-500/15 text-green-400 border border-green-500/25'
                                                }`}>
                                                    {member.daysRemaining} day{member.daysRemaining !== 1 ? 's' : ''} left
                                                </span>
                                                <Link
                                                    to="/chat"
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 text-sm font-semibold shadow-lg shadow-blue-600/20"
                                                >
                                                    Message
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-[var(--text-secondary)]">All memberships are healthy!</p>
                                <p className="text-[var(--text-secondary)] text-sm mt-1">No expirations in the next 7 days.</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Peak Hours Section — Gym Owner Only */}
                {user.role === 'gym' && (
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)] mb-8"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] flex items-center">
                            <span className="bg-purple-500 w-1.5 h-8 rounded-full mr-3"></span>
                            ⏰ Peak Hours Estimate
                        </h2>
                        <p className="text-[var(--text-secondary)] text-sm mb-6">
                            Based on member workout activity over the last 30 days
                        </p>

                        {peakHours.some((h) => h.count > 0) ? (
                            <>
                                {/* Bar Chart */}
                                <div className="flex items-end gap-1 h-48 mb-4">
                                    {peakHours.map((h) => {
                                        const maxCount = Math.max(...peakHours.map((p) => p.count));
                                        const heightPercent = maxCount > 0 ? (h.count / maxCount) * 100 : 0;
                                        return (
                                            <div key={h.hour} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                    {formatHour(h.hour)}: {h.count} sessions
                                                </div>
                                                <div
                                                    className="w-full rounded-t transition-all duration-300 group-hover:opacity-80"
                                                    style={{
                                                        height: `${Math.max(heightPercent, 2)}%`,
                                                        background: heightPercent > 75 ? '#ef4444' : heightPercent > 50 ? '#f97316' : heightPercent > 25 ? '#3b82f6' : '#6b7280',
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* X-axis labels */}
                                <div className="flex gap-1">
                                    {peakHours.map((h) => (
                                        <div key={h.hour} className="flex-1 text-center text-[8px] sm:text-[10px] text-[var(--text-secondary)]">
                                            {h.hour % 3 === 0 ? formatHour(h.hour) : ''}
                                        </div>
                                    ))}
                                </div>

                                {/* Top 3 Busiest Hours */}
                                <div className="mt-6 flex flex-wrap gap-3">
                                    <span className="text-[var(--text-secondary)] text-sm font-medium">Busiest:</span>
                                    {[...peakHours]
                                        .sort((a, b) => b.count - a.count)
                                        .slice(0, 3)
                                        .filter((h) => h.count > 0)
                                        .map((h) => (
                                            <span key={h.hour} className="bg-orange-500/15 text-orange-400 border border-orange-500/25 text-xs font-bold px-3 py-1 rounded-full">
                                                {formatHour(h.hour)} ({h.count})
                                            </span>
                                        ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-[var(--text-secondary)]">Not enough data yet</p>
                                <p className="text-[var(--text-secondary)] text-sm mt-1">Peak hours will appear once members start logging workouts.</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Growth Analytics Section — Gym Owner Only */}
                {user.role === 'gym' && (
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)] mb-8"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] flex items-center">
                            <span className="bg-green-500 w-1.5 h-8 rounded-full mr-3"></span>
                            📊 Growth Analytics
                        </h2>

                        {/* Stat Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl text-center">
                                <p className="text-3xl font-bold text-blue-400">{growthData.totalMembers}</p>
                                <p className="text-[var(--text-secondary)] text-sm mt-1">Total Members</p>
                            </div>
                            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl text-center">
                                <p className="text-3xl font-bold text-purple-400">{growthData.totalTrainers}</p>
                                <p className="text-[var(--text-secondary)] text-sm mt-1">Active Trainers</p>
                            </div>
                            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl text-center">
                                <p className="text-3xl font-bold text-green-400">
                                    {growthData.monthlyGrowth.length > 0
                                        ? growthData.monthlyGrowth[growthData.monthlyGrowth.length - 1].newMembers
                                        : 0}
                                </p>
                                <p className="text-[var(--text-secondary)] text-sm mt-1">This Month's Signups</p>
                            </div>
                        </div>

                        {/* Monthly Growth Bar Chart */}
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Member Growth (Last 6 Months)</h3>
                        {growthData.monthlyGrowth.length > 0 ? (
                            <div className="flex items-end gap-3 h-40">
                                {growthData.monthlyGrowth.map((item) => {
                                    const maxVal = Math.max(...growthData.monthlyGrowth.map((g) => g.newMembers));
                                    const heightPct = maxVal > 0 ? (item.newMembers / maxVal) * 100 : 0;
                                    // Make sure parsing dates like "2026-04" ignores timezone by appending "-01T00:00:00"
                                    const dateStr = item.month + '-01T00:00:00';
                                    const monthLabel = new Date(dateStr).toLocaleDateString('en-US', { month: 'short' });
                                    return (
                                        <div key={item.month} className="flex-1 flex flex-col items-center justify-end h-full">
                                            <span className="text-[var(--text-primary)] text-xs font-bold mb-1">{item.newMembers}</span>
                                            <div
                                                className="w-full bg-blue-600 rounded-t hover:bg-blue-500 transition-all duration-300"
                                                style={{ height: `${Math.max(heightPct, 5)}%` }}
                                            />
                                            <span className="text-[var(--text-secondary)] text-xs mt-2">{monthLabel}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-[var(--bg-secondary)] p-8 rounded-xl text-center text-[var(--text-secondary)] italic border border-[var(--border-color)] border-dashed">
                                No growth data available yet. New member signups will appear here.
                            </div>
                        )}
                    </motion.div>
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
                                        className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 sm:p-6 rounded-xl hover:border-blue-500/50 transition-all duration-300"
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: true }}
                                        variants={zoomIn}
                                    >
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                            {/* Left: User Info */}
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                {/* Profile Image */}
                                                <div className="flex-shrink-0">
                                                    {request.user.profileImage ? (
                                                        <img
                                                            src={request.user.profileImage}
                                                            alt={request.user.name}
                                                            className="w-12 h-12 rounded-full object-cover border-2 border-[var(--border-color)]"
                                                        />
                                                    ) : (
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${request.userModel === 'Trainer' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                                                            {request.user.name?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <p className="text-[var(--text-primary)] font-bold text-base sm:text-lg">
                                                            {request.user.name}
                                                        </p>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${request.userModel === 'Trainer' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/25' : 'bg-blue-500/15 text-blue-400 border border-blue-500/25'}`}>
                                                            {request.userModel}
                                                        </span>
                                                    </div>
                                                    <p className="text-[var(--text-secondary)] text-sm mb-1">
                                                        {request.user.email}
                                                    </p>

                                                    {/* Trainer Experience */}
                                                    {request.userModel === 'Trainer' && (request.user.experienceYears || request.user.experienceMonths) && (
                                                        <p className="text-purple-400 text-xs font-medium mb-1">
                                                            💪 {request.user.experienceYears || 0}y {request.user.experienceMonths || 0}m experience
                                                        </p>
                                                    )}

                                                    {/* Member Duration */}
                                                    {request.userModel === 'Member' && request.membershipDuration && (
                                                        <p className="text-blue-400 text-xs font-medium mb-1">
                                                            📅 Duration: {request.membershipDuration}
                                                        </p>
                                                    )}

                                                    {/* Application Message */}
                                                    {request.message && request.message.trim() && (
                                                        <div className="mt-2 bg-[var(--bg-primary)] border-l-3 border-blue-500 rounded-lg p-3" style={{ borderLeftWidth: '3px', borderLeftColor: request.userModel === 'Trainer' ? '#a855f7' : '#3b82f6' }}>
                                                            <p className="text-[var(--text-secondary)] text-xs italic leading-relaxed">
                                                                "{request.message}"
                                                            </p>
                                                        </div>
                                                    )}

                                                    <p className="text-[var(--text-secondary)] text-xs mt-2">
                                                        Requested: {new Date(request.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Right: Action Buttons */}
                                            <div className="flex gap-3 w-full sm:w-auto flex-shrink-0">
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
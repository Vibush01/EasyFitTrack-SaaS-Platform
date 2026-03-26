import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Register Chart.js components and set defaults for dark theme
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);
ChartJS.defaults.color = '#9CA3AF';
ChartJS.defaults.borderColor = '#374151';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const [gyms, setGyms] = useState([]);
    const [selectedGym, setSelectedGym] = useState(null);
    const [contactMessages, setContactMessages] = useState([]);
    const [toggleview, setToggleView] = useState(false);
    const [analytics, setAnalytics] = useState({
        pageViews: [],
        userDistribution: [],
        events: [],
    });

    useEffect(() => {
        const fetchGyms = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/admin/gyms`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setGyms(res.data.data || res.data);
            } catch (err) {
                toast.error('Failed to fetch gyms' + err, { position: "top-right" });
            }
        };

        const fetchContactMessages = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/contact/messages`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setContactMessages(res.data.data || res.data);
            } catch (err) {
                toast.error('Failed to fetch contact messages' + err, { position: "top-right" });
            }
        };

        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/admin/analytics`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAnalytics(res.data);
            } catch (err) {
                toast.error('Failed to fetch analytics data' + err, { position: "top-right" });
            }
        };

        if (user?.role === 'admin') {
            fetchGyms();
            fetchContactMessages();
            fetchAnalytics();
        }
    }, [user]);

    const handleViewGym = (gym) => {
        setSelectedGym(gym);
        setToggleView(!toggleview);
    };

    const handleDeleteGym = async (gymId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/admin/gyms/${gymId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setGyms(gyms.filter((gym) => gym._id !== gymId));
            setSelectedGym(null);
            toast.success('Gym deleted successfully', { position: "top-right" });
        } catch (err) {
            toast.error('Failed to delete gym' + err, { position: "top-right" });
        }
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/contact/messages/${messageId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setContactMessages(contactMessages.filter((message) => message._id !== messageId));
            toast.success('Contact message deleted successfully', { position: "top-right" });
        } catch (err) {
            toast.error('Failed to delete contact message' + err, { position: "top-right" });
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
        hover: { scale: 1.05, boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)', transition: { duration: 0.3 } },
    };

    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 transition-colors duration-300">
                <motion.p
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="text-red-500 text-lg sm:text-xl font-semibold text-center"
                >
                    Access denied. This page is only for Admins.
                </motion.p>
            </div>
        );
    }

    // Prepare chart data
    const pageViewsData = {
        labels: analytics.pageViews.map((pv) => pv._id),
        datasets: [
            {
                label: 'Page Views',
                data: analytics.pageViews.map((pv) => pv.count),
                backgroundColor: 'rgba(59, 130, 246, 0.6)', // Blue-500
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
            },
        ],
    };

    const userDistributionData = {
        labels: analytics.userDistribution.map((ud) => ud._id),
        datasets: [
            {
                label: 'User Distribution',
                data: analytics.userDistribution.map((ud) => ud.count),
                backgroundColor: [
                    'rgba(239, 68, 68, 0.6)',   // Red-500
                    'rgba(59, 130, 246, 0.6)',  // Blue-500
                    'rgba(245, 158, 11, 0.6)',  // Amber-500
                    'rgba(16, 185, 129, 0.6)',  // Emerald-500
                ],
                borderColor: [
                    'rgba(239, 68, 68, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(16, 185, 129, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="container mx-auto max-w-7xl">
                <motion.h1
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="text-3xl sm:text-4xl font-bold mb-12 text-center text-[var(--text-primary)] tracking-tight"
                >
                    Admin Dashboard
                </motion.h1>

                {/* Gyms List */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeIn}
                    className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)] mb-8"
                >
                    <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-[var(--text-primary)]">Gyms</h2>
                    {gyms.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm sm:text-base">
                                <thead>
                                    <tr className="bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                                        <th className="p-4 rounded-tl-lg">Gym Name</th>
                                        <th className="p-4">Address</th>
                                        <th className="p-4">Owner Name</th>
                                        <th className="p-4">Owner Email</th>
                                        <th className="p-4">Email</th>
                                        <th className="p-4 rounded-tr-lg">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[var(--text-secondary)]">
                                    {gyms.map((gym) => (
                                        <motion.tr
                                            key={gym._id}
                                            className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-all duration-300"
                                            initial="hidden"
                                            whileInView="visible"
                                            viewport={{ once: true }}
                                            variants={zoomIn}
                                        >
                                            <td className="p-4 font-medium text-[var(--text-primary)]">{gym.gymName}</td>
                                            <td className="p-4">{gym.address}</td>
                                            <td className="p-4">{gym.ownerName}</td>
                                            <td className="p-4">{gym.ownerEmail}</td>
                                            <td className="p-4">{gym.email}</td>
                                            <td className="p-4 flex space-x-2">
                                                <motion.button
                                                    onClick={() => handleViewGym(gym)}
                                                    whileHover="hover"
                                                    variants={buttonHover}
                                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-300 text-sm font-bold shadow-lg shadow-green-600/20"
                                                >
                                                    View
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => handleDeleteGym(gym._id)}
                                                    whileHover="hover"
                                                    variants={buttonHover}
                                                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-300 text-sm font-bold shadow-lg shadow-red-600/20"
                                                >
                                                    Delete
                                                </motion.button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-[var(--text-secondary)] text-center py-8">No gyms found</p>
                    )}
                </motion.div>

                {/* Gym Details (Members and Trainers) */}
                {selectedGym && toggleview && (
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)] mb-8"
                    >
                        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-[var(--text-primary)]">
                            Users in <span className="text-blue-500">{selectedGym.gymName}</span>
                        </h2>
                        <div className="flex flex-col lg:flex-row lg:space-x-8 gap-8">
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-4 text-[var(--text-secondary)] border-b border-[var(--border-color)] pb-2">Members</h3>
                                {selectedGym.members.length > 0 ? (
                                    <ul className="space-y-4">
                                        {selectedGym.members.map((member) => (
                                            <motion.li
                                                key={member._id}
                                                className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)] hover:border-blue-500/50 transition-all duration-300"
                                                initial="hidden"
                                                whileInView="visible"
                                                viewport={{ once: true }}
                                                variants={zoomIn}
                                            >
                                                <p className="text-[var(--text-primary)] font-medium">
                                                    {member.name}
                                                </p>
                                                <p className="text-[var(--text-secondary)] text-sm">
                                                    {member.email}
                                                </p>
                                                <p className="text-blue-400 text-sm mt-1">
                                                    Membership: {member.membership?.duration || 'N/A'}
                                                </p>
                                            </motion.li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-[var(--text-secondary)] italic">No members</p>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-4 text-[var(--text-secondary)] border-b border-[var(--border-color)] pb-2">Trainers</h3>
                                {selectedGym.trainers.length > 0 ? (
                                    <ul className="space-y-4">
                                        {selectedGym.trainers.map((trainer) => (
                                            <motion.li
                                                key={trainer._id}
                                                className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)] hover:border-blue-500/50 transition-all duration-300"
                                                initial="hidden"
                                                whileInView="visible"
                                                viewport={{ once: true }}
                                                variants={zoomIn}
                                            >
                                                <p className="text-[var(--text-primary)] font-medium">
                                                    {trainer.name}
                                                </p>
                                                <p className="text-[var(--text-secondary)] text-sm">
                                                    {trainer.email}
                                                </p>
                                            </motion.li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-[var(--text-secondary)] italic">No trainers</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Contact Messages */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeIn}
                    className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)] mb-8"
                >
                    <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-[var(--text-primary)]">Contact Messages</h2>
                    {contactMessages.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm sm:text-base">
                                <thead>
                                    <tr className="bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                                        <th className="p-4 rounded-tl-lg">Name</th>
                                        <th className="p-4">Email</th>
                                        <th className="p-4">Phone</th>
                                        <th className="p-4">Subject</th>
                                        <th className="p-4">Message</th>
                                        <th className="p-4">Received On</th>
                                        <th className="p-4 rounded-tr-lg">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[var(--text-secondary)]">
                                    {contactMessages.map((message) => (
                                        <motion.tr
                                            key={message._id}
                                            className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-all duration-300"
                                            initial="hidden"
                                            whileInView="visible"
                                            viewport={{ once: true }}
                                            variants={zoomIn}
                                        >
                                            <td className="p-4 font-medium text-[var(--text-primary)]">{message.name}</td>
                                            <td className="p-4">{message.email}</td>
                                            <td className="p-4">{message.phone}</td>
                                            <td className="p-4">{message.subject}</td>
                                            <td className="p-4 max-w-xs truncate" title={message.message}>{message.message}</td>
                                            <td className="p-4">{new Date(message.createdAt).toLocaleString()}</td>
                                            <td className="p-4">
                                                <motion.button
                                                    onClick={() => handleDeleteMessage(message._id)}
                                                    whileHover="hover"
                                                    variants={buttonHover}
                                                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-300 text-sm font-bold shadow-lg shadow-red-600/20"
                                                >
                                                    Delete
                                                </motion.button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-[var(--text-secondary)] text-center py-8">No contact messages</p>
                    )}
                </motion.div>

                {/* Analytics Overview (Charts) */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeIn}
                    className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)] mb-8"
                >
                    <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-[var(--text-primary)]">Analytics Overview</h2>
                    <div className="flex flex-col lg:flex-row lg:space-x-8 gap-8">
                        <motion.div
                            className="flex-1 min-w-0"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={zoomIn}
                        >
                            <h3 className="text-xl font-semibold mb-6 text-[var(--text-secondary)] text-center">Page Views</h3>
                            <div className="h-64 sm:h-80 bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)] relative w-full">
                                {analytics.pageViews && analytics.pageViews.length > 0 ? (
                                    <Bar
                                        data={pageViewsData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: { position: 'top', labels: { color: '#9CA3AF' } },
                                                title: { display: false },
                                            },
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    grid: { color: '#374151' },
                                                    ticks: { color: '#9CA3AF', stepSize: 1 },
                                                },
                                                x: {
                                                    grid: { color: '#374151' },
                                                    ticks: { color: '#9CA3AF' },
                                                },
                                            },
                                        }}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
                                        No page view data available
                                    </div>
                                )}
                            </div>
                        </motion.div>
                        <motion.div
                            className="flex-1 min-w-0"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={zoomIn}
                        >
                            <h3 className="text-xl font-semibold mb-6 text-[var(--text-secondary)] text-center">User Distribution</h3>
                            <div className="h-64 sm:h-80 bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)] relative w-full">
                                {analytics.userDistribution && analytics.userDistribution.length > 0 ? (
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        <Pie
                                            data={userDistributionData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: { position: 'right', labels: { color: '#9CA3AF', boxWidth: 12 } },
                                                    title: { display: false },
                                                },
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
                                        No user distribution data available
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Analytics Events */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeIn}
                    className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)]"
                >
                    <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-[var(--text-primary)]">Analytics - All Events</h2>
                    {analytics.events.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm sm:text-base">
                                <thead>
                                    <tr className="bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                                        <th className="p-4 rounded-tl-lg">Event</th>
                                        <th className="p-4">Page</th>
                                        <th className="p-4">User</th>
                                        <th className="p-4">Role</th>
                                        <th className="p-4">Details</th>
                                        <th className="p-4 rounded-tr-lg">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[var(--text-secondary)]">
                                    {analytics.events.map((event) => (
                                        <motion.tr
                                            key={event._id}
                                            className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-all duration-300"
                                            initial="hidden"
                                            whileInView="visible"
                                            viewport={{ once: true }}
                                            variants={zoomIn}
                                        >
                                            <td className="p-4 font-medium text-[var(--text-primary)]">{event.event}</td>
                                            <td className="p-4">{event.page || 'N/A'}</td>
                                            <td className="p-4">{event.user?.name} ({event.user?.email})</td>
                                            <td className="p-4">{event.userModel}</td>
                                            <td className="p-4">{event.details}</td>
                                            <td className="p-4">{new Date(event.createdAt).toLocaleString()}</td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-[var(--text-secondary)] text-center py-8">No events recorded</p>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default AdminDashboard;
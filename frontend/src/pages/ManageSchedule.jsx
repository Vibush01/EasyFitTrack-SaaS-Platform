import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const ManageSchedule = () => {
    const { user } = useContext(AuthContext);
    const [schedules, setSchedules] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        startTime: '',
        endTime: '',
    });

    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/trainer/trainer-schedules`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setSchedules(res.data);
            } catch (err) {
                setError('Failed to fetch schedules');
                toast.error('Failed to fetch schedules' + err, { position: 'top-right' });
            }
        };

        if (user?.role === 'trainer') {
            fetchSchedules();
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const data = {
                // Convert local datetime-local values to proper UTC ISO strings
                // so the backend stores the correct absolute point in time
                startTime: new Date(formData.startTime).toISOString(),
                endTime: new Date(formData.endTime).toISOString(),
            };

            const res = await axios.post(`${API_URL}/trainer/trainer-schedules`, data, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSchedules([res.data.trainerSchedule, ...schedules]);
            setSuccess('Schedule slot posted');
            toast.success('Schedule slot posted', { position: 'top-right' });
            setFormData({
                startTime: '',
                endTime: '',
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post schedule slot');
            toast.error(err.response?.data?.message || 'Failed to post schedule slot', { position: 'top-right' });
        }
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/trainer/trainer-schedules/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSchedules(schedules.filter((schedule) => schedule._id !== id));
            setSuccess('Schedule slot deleted');
            toast.success('Schedule slot deleted', { position: 'top-right' });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete schedule slot');
            toast.error(err.response?.data?.message || 'Failed to delete schedule slot', { position: 'top-right' });
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
        hover: { scale: 1.05, boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)', transition: { duration: 0.3 } },
    };

    if (user?.role !== 'trainer') {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 transition-colors duration-300">
                <motion.p
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="text-red-500 text-lg sm:text-xl font-semibold text-center"
                >
                    Access denied. This page is only for Trainers.
                </motion.p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-5 fixed"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)]/95 to-[var(--bg-primary)] fixed"></div>

            <div className="container mx-auto max-w-5xl relative z-10">
                <motion.h1
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="text-3xl sm:text-4xl font-bold mb-8 text-center text-[var(--text-primary)] tracking-tight"
                >
                    Manage Schedule
                </motion.h1>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-8 text-center backdrop-blur-sm"
                    >
                        {error}
                    </motion.div>
                )}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-500/10 border border-green-500/50 text-green-500 p-4 rounded-xl mb-8 text-center backdrop-blur-sm"
                    >
                        {success}
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Post Schedule Slot Form */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="lg:col-span-1 bg-[var(--bg-card)]/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)] h-fit"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] flex items-center">
                            <span className="bg-blue-600 w-1.5 h-8 rounded-full mr-3"></span>
                            Add Slot
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">
                                    Start Time
                                </label>
                                <input
                                    type="datetime-local"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">
                                    End Time
                                </label>
                                <input
                                    type="datetime-local"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                    required
                                />
                            </div>
                            <motion.button
                                type="submit"
                                whileHover="hover"
                                variants={buttonHover}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all duration-300"
                            >
                                Post Slot
                            </motion.button>
                        </form>
                    </motion.div>

                    {/* Schedule Slots List */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="lg:col-span-2 bg-[var(--bg-card)]/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)]"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] flex items-center">
                            <span className="bg-purple-600 w-1.5 h-8 rounded-full mr-3"></span>
                            Your Schedule Slots
                        </h2>
                        {schedules.length > 0 ? (
                            <div className="space-y-4">
                                {schedules.map((schedule) => (
                                    <motion.div
                                        key={schedule._id}
                                        className="bg-[var(--bg-secondary)]/50 p-5 rounded-xl border border-[var(--border-color)] hover:border-purple-500/50 transition-all duration-300"
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: true }}
                                        variants={zoomIn}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                                            <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                                                <span className={`w-3 h-3 rounded-full ${schedule.status === 'available' ? 'bg-green-500' : 'bg-red-500'
                                                    }`}></span>
                                                <span className="text-[var(--text-primary)] font-semibold capitalize">{schedule.status}</span>
                                            </div>
                                            <span className="text-[var(--text-secondary)] text-xs">
                                                Created: {new Date(schedule.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                            <div className="bg-[var(--bg-primary)]/50 p-3 rounded-lg">
                                                <p className="text-[var(--text-secondary)] text-xs uppercase mb-1">Start Time</p>
                                                <p className="text-[var(--text-primary)] text-sm font-medium">
                                                    {new Date(schedule.startTime).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="bg-[var(--bg-primary)]/50 p-3 rounded-lg">
                                                <p className="text-[var(--text-secondary)] text-xs uppercase mb-1">End Time</p>
                                                <p className="text-[var(--text-primary)] text-sm font-medium">
                                                    {new Date(schedule.endTime).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        {schedule.bookedBy && (
                                            <div className="bg-blue-900/20 border border-blue-900/50 p-3 rounded-lg mb-4">
                                                <p className="text-blue-400 text-xs uppercase mb-1">Booked By</p>
                                                <p className="text-[var(--text-primary)] text-sm font-medium">
                                                    {schedule.bookedBy.name} <span className="text-[var(--text-secondary)] font-normal">({schedule.bookedBy.email})</span>
                                                </p>
                                            </div>
                                        )}

                                        {schedule.status === 'available' && (
                                            <div className="flex justify-end">
                                                <motion.button
                                                    onClick={() => handleDelete(schedule._id)}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="bg-red-600/20 text-red-500 px-4 py-2 rounded-lg hover:bg-red-600/30 transition-colors text-sm font-medium flex items-center"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    Delete Slot
                                                </motion.button>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-[var(--bg-secondary)]/50 p-12 rounded-xl text-center border border-[var(--border-color)] border-dashed">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-[var(--text-secondary)] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-[var(--text-secondary)] text-lg font-medium">No schedule slots posted</p>
                                <p className="text-[var(--text-secondary)] text-sm mt-2">Add your available times to let members book sessions.</p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ManageSchedule;
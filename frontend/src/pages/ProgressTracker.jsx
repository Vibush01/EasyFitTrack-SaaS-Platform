import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const ProgressTracker = () => {
    const { user } = useContext(AuthContext);
    const [logs, setLogs] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        weight: '',
        muscleMass: '',
        fatPercentage: '',
        images: [],
    });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/member/progress`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                // Sort logs by date ascending for the chart
                const sortedLogs = res.data.sort((a, b) => new Date(a.date) - new Date(b.date));
                setLogs(sortedLogs);
            } catch (err) {
                setError('Failed to fetch progress logs');
                toast.error('Failed to fetch progress logs' + err, { position: 'top-right' });
            }
        };
        if (user?.role === 'member') {
            fetchLogs();
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, images: e.target.files });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const data = new FormData();
            data.append('weight', formData.weight);
            data.append('muscleMass', formData.muscleMass);
            data.append('fatPercentage', formData.fatPercentage);
            for (let i = 0; i < formData.images.length; i++) {
                data.append('images', formData.images[i]);
            }

            const res = await axios.post(`${API_URL}/member/progress`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            setLogs([...logs, res.data.progressLog].sort((a, b) => new Date(a.date) - new Date(b.date)));
            setSuccess('Progress logged successfully');
            toast.success('Progress logged successfully', { position: 'top-right' });
            setFormData({ weight: '', muscleMass: '', fatPercentage: '', images: [] });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to log progress');
            toast.error(err.response?.data?.message || 'Failed to log progress', { position: 'top-right' });
        } finally {
            setUploading(false);
        }
    };

    const chartData = {
        labels: logs.map((log) => new Date(log.date).toLocaleDateString()),
        datasets: [
            {
                label: 'Weight (kg)',
                data: logs.map((log) => log.weight),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                tension: 0.4,
            },
            {
                label: 'Muscle Mass (kg)',
                data: logs.map((log) => log.muscleMass),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.5)',
                tension: 0.4,
            },
            {
                label: 'Fat Percentage (%)',
                data: logs.map((log) => log.fatPercentage),
                borderColor: '#F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.5)',
                tension: 0.4,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: 'var(--text-secondary)' },
            },
            title: {
                display: true,
                text: 'Progress Over Time',
                color: 'var(--text-primary)',
                font: { size: 16 },
            },
        },
        scales: {
            y: {
                grid: { color: 'var(--border-color)' },
                ticks: { color: 'var(--text-secondary)' },
            },
            x: {
                grid: { color: 'var(--border-color)' },
                ticks: { color: 'var(--text-secondary)' },
            },
        },
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

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-5 fixed"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)]/95 to-[var(--bg-primary)] fixed"></div>

            <div className="container mx-auto max-w-6xl relative z-10">
                <motion.h1
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="text-3xl sm:text-4xl font-bold mb-8 text-center text-[var(--text-primary)] tracking-tight"
                >
                    Progress Tracker
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
                    {/* Progress Logging Form */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="lg:col-span-1 bg-[var(--bg-card)]/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)] h-fit"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] flex items-center">
                            <span className="bg-blue-600 w-1.5 h-8 rounded-full mr-3"></span>
                            Log Progress
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">Weight (kg)</label>
                                <input
                                    type="number"
                                    name="weight"
                                    value={formData.weight}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.1"
                                    className="w-full p-3 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">Muscle Mass (kg)</label>
                                <input
                                    type="number"
                                    name="muscleMass"
                                    value={formData.muscleMass}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.1"
                                    className="w-full p-3 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">Fat Percentage (%)</label>
                                <input
                                    type="number"
                                    name="fatPercentage"
                                    value={formData.fatPercentage}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.1"
                                    className="w-full p-3 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">Progress Photos</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        name="images"
                                        multiple
                                        onChange={handleFileChange}
                                        className="w-full p-3 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all duration-300"
                                    />
                                </div>
                            </div>

                            <motion.button
                                type="submit"
                                disabled={uploading}
                                whileHover={!uploading ? "hover" : {}}
                                variants={buttonHover}
                                whileTap={!uploading ? { scale: 0.98 } : {}}
                                className={`w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all duration-300 mt-4 flex justify-center items-center ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {uploading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Uploading...
                                    </>
                                ) : (
                                    'Log Progress'
                                )}
                            </motion.button>
                        </form>
                    </motion.div>

                    {/* Progress Chart and History */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Chart */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeIn}
                            className="bg-[var(--bg-card)]/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-[var(--border-color)]"
                        >
                            <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] flex items-center">
                                <span className="bg-purple-600 w-1.5 h-8 rounded-full mr-3"></span>
                                Analytics
                            </h2>
                            <div className="h-80 w-full">
                                {logs.length > 0 ? (
                                    <Line data={chartData} options={chartOptions} />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-[var(--text-secondary)]">
                                        No data available for chart
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Recent Logs */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeIn}
                            className="bg-[var(--bg-card)]/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-[var(--border-color)]"
                        >
                            <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] flex items-center">
                                <span className="bg-green-600 w-1.5 h-8 rounded-full mr-3"></span>
                                Recent Logs
                            </h2>
                            {logs.length > 0 ? (
                                <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                                    {[...logs].reverse().map((log) => (
                                        <motion.div
                                            key={log._id}
                                            className="bg-[var(--bg-secondary)]/50 p-5 rounded-xl border border-[var(--border-color)] hover:border-green-500/50 transition-all duration-300"
                                            initial="hidden"
                                            whileInView="visible"
                                            viewport={{ once: true }}
                                            variants={zoomIn}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-[var(--text-secondary)] text-xs font-medium bg-[var(--bg-primary)] px-2 py-1 rounded-full inline-block mb-2">
                                                        {new Date(log.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </p>
                                                    <div className="flex gap-4 text-sm sm:text-base">
                                                        <span className="text-[var(--text-primary)]"><span className="font-bold text-blue-400">Weight:</span> {log.weight} kg</span>
                                                        <span className="text-[var(--text-primary)]"><span className="font-bold text-green-400">Muscle:</span> {log.muscleMass} kg</span>
                                                        <span className="text-[var(--text-primary)]"><span className="font-bold text-yellow-400">Fat:</span> {log.fatPercentage}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {log.images && log.images.length > 0 && (
                                                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                                    {log.images.map((img, idx) => (
                                                        <img
                                                            key={idx}
                                                            src={img.startsWith('http') ? img : `${API_URL.replace('/api', '')}${img}`}
                                                            alt={`Progress ${idx + 1}`}
                                                            className="w-20 h-20 object-cover rounded-lg border border-[var(--border-color)] hover:scale-110 transition-transform duration-300 cursor-pointer"
                                                            onClick={() => window.open(img.startsWith('http') ? img : `${API_URL.replace('/api', '')}${img}`, '_blank')}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-[var(--text-secondary)]">
                                    No logs found. Start tracking your progress!
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgressTracker;
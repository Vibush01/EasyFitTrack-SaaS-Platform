import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const MacroCalculator = () => {
    const { user } = useContext(AuthContext);
    const [logs, setLogs] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        food: '',
        calories: '',
        protein: '',
        carbs: '',
        fats: '',
    });
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/member/macros`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setLogs(res.data.data || res.data);
            } catch (err) {
                setError('Failed to fetch macro logs');
                toast.error('Failed to fetch macro logs' + err, { position: 'top-right' });
            }
        };
        if (user?.role === 'member') {
            fetchLogs();
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
                food: formData.food,
                macros: {
                    calories: parseFloat(formData.calories),
                    protein: parseFloat(formData.protein),
                    carbs: parseFloat(formData.carbs),
                    fats: parseFloat(formData.fats),
                },
            };

            if (editId) {
                const res = await axios.put(`${API_URL}/member/macros/${editId}`, data, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setLogs(logs.map((log) => (log._id === editId ? res.data.macroLog : log)));
                setSuccess('Macro log updated');
                toast.success('Macro log updated', { position: 'top-right' });
                setEditId(null);
            } else {
                const res = await axios.post(`${API_URL}/member/macros`, data, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setLogs([res.data.macroLog, ...logs]);
                setSuccess('Macro logged');
                toast.success('Macro logged', { position: 'top-right' });
            }

            setFormData({ food: '', calories: '', protein: '', carbs: '', fats: '' });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to log macro');
            toast.error(err.response?.data?.message || 'Failed to log macro', { position: 'top-right' });
        }
    };

    const handleEdit = (log) => {
        setFormData({
            food: log.food,
            calories: log.macros.calories,
            protein: log.macros.protein,
            carbs: log.macros.carbs,
            fats: log.macros.fats,
        });
        setEditId(log._id);
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/member/macros/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setLogs(logs.filter((log) => log._id !== id));
            setSuccess('Macro log deleted');
            toast.success('Macro log deleted', { position: 'top-right' });
        } catch (err) {
            setError('Failed to delete macro log');
            toast.error('Failed to delete macro log' + err, { position: 'top-right' });
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
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-5 fixed"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)]/95 to-[var(--bg-primary)] fixed"></div>

            <div className="container mx-auto max-w-6xl relative z-10">
                <motion.h1
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="text-3xl sm:text-4xl font-bold mb-8 text-center text-[var(--text-primary)] tracking-tight"
                >
                    Macro Calculator
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
                    {/* Macro Logging Form */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="lg:col-span-1 bg-[var(--bg-card)]/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)] h-fit"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] flex items-center">
                            <span className="bg-blue-600 w-1.5 h-8 rounded-full mr-3"></span>
                            {editId ? 'Edit Macro Log' : 'Log a Meal'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">Food</label>
                                <input
                                    type="text"
                                    name="food"
                                    value={formData.food}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">Calories (kcal)</label>
                                    <input
                                        type="number"
                                        name="calories"
                                        value={formData.calories}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.1"
                                        className="w-full p-3 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">Protein (g)</label>
                                    <input
                                        type="number"
                                        name="protein"
                                        value={formData.protein}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.1"
                                        className="w-full p-3 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">Carbs (g)</label>
                                    <input
                                        type="number"
                                        name="carbs"
                                        value={formData.carbs}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.1"
                                        className="w-full p-3 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">Fats (g)</label>
                                    <input
                                        type="number"
                                        name="fats"
                                        value={formData.fats}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.1"
                                        className="w-full p-3 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                        required
                                    />
                                </div>
                            </div>

                            <motion.button
                                type="submit"
                                whileHover="hover"
                                variants={buttonHover}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all duration-300 mt-4"
                            >
                                {editId ? 'Update Log' : 'Log Meal'}
                            </motion.button>

                            {editId && (
                                <motion.button
                                    type="button"
                                    onClick={() => {
                                        setEditId(null);
                                        setFormData({ food: '', calories: '', protein: '', carbs: '', fats: '' });
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    className="w-full bg-gray-700 text-white p-3 rounded-xl font-medium hover:bg-gray-600 transition-all duration-300"
                                >
                                    Cancel
                                </motion.button>
                            )}
                        </form>
                    </motion.div>

                    {/* Macro Logs */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="lg:col-span-2 bg-[var(--bg-card)]/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-[var(--border-color)]"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] flex items-center">
                            <span className="bg-green-600 w-1.5 h-8 rounded-full mr-3"></span>
                            Your Food Diary
                        </h2>
                        {logs.length > 0 ? (
                            <div className="space-y-4">
                                {logs.map((log) => (
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
                                                <h3 className="text-[var(--text-primary)] font-bold text-lg">{log.food}</h3>
                                                <p className="text-[var(--text-secondary)] text-xs">
                                                    {new Date(log.date).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <motion.button
                                                    onClick={() => handleEdit(log)}
                                                    whileHover={{ scale: 1.1 }}
                                                    className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg hover:bg-yellow-500/20 transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                    </svg>
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => handleDelete(log._id)}
                                                    whileHover={{ scale: 1.1 }}
                                                    className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </motion.button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2 text-center">
                                            <div className="bg-[var(--bg-primary)]/50 p-2 rounded-lg">
                                                <p className="text-[var(--text-secondary)] text-[10px] uppercase">Calories</p>
                                                <p className="text-[var(--text-primary)] font-bold">{log.macros.calories}</p>
                                            </div>
                                            <div className="bg-[var(--bg-primary)]/50 p-2 rounded-lg">
                                                <p className="text-[var(--text-secondary)] text-[10px] uppercase">Protein</p>
                                                <p className="text-blue-400 font-bold">{log.macros.protein}g</p>
                                            </div>
                                            <div className="bg-[var(--bg-primary)]/50 p-2 rounded-lg">
                                                <p className="text-[var(--text-secondary)] text-[10px] uppercase">Carbs</p>
                                                <p className="text-green-400 font-bold">{log.macros.carbs}g</p>
                                            </div>
                                            <div className="bg-[var(--bg-primary)]/50 p-2 rounded-lg">
                                                <p className="text-[var(--text-secondary)] text-[10px] uppercase">Fats</p>
                                                <p className="text-yellow-400 font-bold">{log.macros.fats}g</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-[var(--bg-secondary)]/50 p-12 rounded-xl text-center border border-[var(--border-color)] border-dashed">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                <p className="text-[var(--text-secondary)] text-lg font-medium">No meals logged yet</p>
                                <p className="text-gray-600 text-sm mt-2">Start tracking your nutrition today!</p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default MacroCalculator;
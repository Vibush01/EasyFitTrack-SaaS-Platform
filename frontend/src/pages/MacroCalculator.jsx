import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const MacroCalculator = () => {
    const { user } = useContext(AuthContext);
    const [logs, setLogs] = useState([]);
    const [plannedDiet, setPlannedDiet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        food: '', calories: '', protein: '', carbs: '', fats: '',
    });
    const [editId, setEditId] = useState(null);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        if (user?.role === 'member') {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch logs and today's diet schedule in parallel
            const [logsRes, dietRes] = await Promise.all([
                axios.get(`${API_URL}/member/macros`, { headers }),
                axios.get(`${API_URL}/member/diet-schedule/today`, { headers }).catch(() => ({ data: null }))
            ]);
            
            setLogs(logsRes.data.data || logsRes.data);
            if (dietRes.data) {
                setPlannedDiet(dietRes.data);
            }
        } catch (err) {
            toast.error('Failed to fetch data', { position: 'top-right' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await submitLog({
            food: formData.food,
            macros: {
                calories: parseFloat(formData.calories),
                protein: parseFloat(formData.protein),
                carbs: parseFloat(formData.carbs),
                fats: parseFloat(formData.fats),
            }
        });
    };

    const handleLogPlannedMeal = async (meal) => {
        await submitLog({
            food: `${meal.mealName} (Planned)`,
            macros: {
                calories: meal.calories,
                protein: meal.protein,
                carbs: meal.carbs,
                fats: meal.fats
            }
        });
    };

    const submitLog = async (data) => {
        try {
            if (editId) {
                const res = await axios.put(`${API_URL}/member/macros/${editId}`, data, { headers });
                setLogs(logs.map((log) => (log._id === editId ? res.data.macroLog : log)));
                toast.success('Macro log updated', { position: 'top-right' });
                setEditId(null);
            } else {
                const res = await axios.post(`${API_URL}/member/macros`, data, { headers });
                setLogs([res.data.macroLog, ...logs]);
                toast.success('Meal logged successfully', { position: 'top-right' });
                
                // Update local planned diet totals if recording a new meal today
                if (plannedDiet) {
                    const newLog = res.data.macroLog;
                    if (new Date(newLog.date).toDateString() === new Date().toDateString()) {
                        setPlannedDiet(prev => ({
                            ...prev,
                            todayMacroLogs: [newLog, ...prev.todayMacroLogs],
                            totalLogged: {
                                calories: prev.totalLogged.calories + newLog.macros.calories,
                                protein: prev.totalLogged.protein + newLog.macros.protein,
                                carbs: prev.totalLogged.carbs + newLog.macros.carbs,
                                fats: prev.totalLogged.fats + newLog.macros.fats,
                            }
                        }));
                    }
                }
            }
            setFormData({ food: '', calories: '', protein: '', carbs: '', fats: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to log macro', { position: 'top-right' });
        }
    };

    const handleEdit = (log) => {
        setFormData({
            food: log.food.replace(' (Planned)', ''), // strip tag for editing
            calories: log.macros.calories,
            protein: log.macros.protein,
            carbs: log.macros.carbs,
            fats: log.macros.fats,
        });
        setEditId(log._id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_URL}/member/macros/${id}`, { headers });
            
            // Find deleted log to subtract from totals
            const deletedLog = logs.find(l => l._id === id);
            setLogs(logs.filter((log) => log._id !== id));
            
            if (deletedLog && plannedDiet && new Date(deletedLog.date).toDateString() === new Date().toDateString()) {
                setPlannedDiet(prev => ({
                    ...prev,
                    todayMacroLogs: prev.todayMacroLogs.filter(l => l._id !== id),
                    totalLogged: {
                        calories: Math.max(0, prev.totalLogged.calories - deletedLog.macros.calories),
                        protein: Math.max(0, prev.totalLogged.protein - deletedLog.macros.protein),
                        carbs: Math.max(0, prev.totalLogged.carbs - deletedLog.macros.carbs),
                        fats: Math.max(0, prev.totalLogged.fats - deletedLog.macros.fats),
                    }
                }));
            }
            
            toast.success('Macro log deleted', { position: 'top-right' });
        } catch (err) {
            toast.error('Failed to delete macro log', { position: 'top-right' });
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
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
                <p className="text-red-500 text-lg font-semibold text-center">Access denied. This page is only for Members.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4 flex justify-center items-center">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    const plannedCals = plannedDiet?.totalPlanned?.calories || 0;
    const loggedCals = plannedDiet?.totalLogged?.calories || 0;
    const calPercent = plannedCals > 0 ? Math.min(Math.round((loggedCals / plannedCals) * 100), 100) : 0;
    const isOverCals = loggedCals > plannedCals * 1.1; // 10% tolerance

    const hasPlannedMeals = plannedDiet?.plannedMeals?.length > 0;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-5 fixed"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)]/95 to-[var(--bg-primary)] fixed"></div>

            <div className="container mx-auto max-w-6xl relative z-10">
                <motion.div initial="hidden" animate="visible" variants={fadeIn} className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 text-center md:text-left">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
                            Macro Tracker
                        </h1>
                        <p className="text-[var(--text-secondary)] mt-1">Log foods and track your daily nutrition</p>
                    </div>

                    {/* Compact Daily Progress Bar */}
                    {hasPlannedMeals && (
                        <div className="bg-[var(--bg-card)]/80 backdrop-blur-md border border-[var(--border-color)] rounded-2xl px-6 py-3 shadow-lg w-full md:w-64">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-xs font-bold text-[var(--text-secondary)]">Today's Calories</span>
                                <span className={`text-xs font-bold ${isOverCals ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>
                                    {loggedCals} / {plannedCals}
                                </span>
                            </div>
                            <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2 overflow-hidden border border-[var(--border-color)]">
                                <div className={`h-2 rounded-full transition-all duration-500 ${isOverCals ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${calPercent}%` }}></div>
                            </div>
                        </div>
                    )}
                </motion.div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left Column: Logging & Planned */}
                    <div className="xl:col-span-1 space-y-6">
                        
                        {/* Today's Planned Meals (if any) */}
                        {hasPlannedMeals && (
                            <motion.div
                                initial="hidden" animate="visible" variants={fadeIn}
                                className="bg-[var(--bg-card)]/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-emerald-500/30"
                            >
                                <h2 className="text-lg font-bold mb-4 text-[var(--text-primary)] flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <span className="bg-emerald-500 w-1.5 h-6 rounded-full"></span>
                                        Today's Plan
                                    </span>
                                </h2>
                                <div className="space-y-3">
                                    {plannedDiet.plannedMeals.map((meal, index) => {
                                        // Quick and dirty check if they've logged this based on exact cals/protein matching logs today
                                        const isLogged = plannedDiet.todayMacroLogs.some(log => 
                                            Math.abs(log.macros.calories - meal.calories) < 2 && 
                                            log.food.includes("Planned")
                                        );

                                        return (
                                            <div key={index} className={`p-4 rounded-xl border transition-all ${isLogged ? 'bg-emerald-500/10 border-emerald-500/30 opacity-70' : 'bg-[var(--bg-secondary)] border-[var(--border-color)]'}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="font-bold text-[var(--text-primary)] text-sm">{meal.mealName}</h3>
                                                        <p className="text-[10px] text-[var(--text-secondary)]">{meal.calories} kcal • {meal.protein}g P</p>
                                                    </div>
                                                    {isLogged ? (
                                                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-500 text-[10px] font-bold rounded-lg uppercase">Logged</span>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleLogPlannedMeal(meal)}
                                                            className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                                                        >
                                                            Log Meal
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* Manual Form Area */}
                        <motion.div
                            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
                            className="bg-[var(--bg-card)]/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)]"
                        >
                            <h2 className="text-xl font-bold mb-6 text-[var(--text-primary)] flex items-center">
                                <span className="bg-blue-600 w-1.5 h-6 rounded-full mr-3"></span>
                                {editId ? 'Edit Macro Log' : (hasPlannedMeals ? 'Log Extra Meal / Snack' : 'Log a Meal')}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[var(--text-secondary)] font-medium mb-1.5 text-xs uppercase tracking-wider">Food / Meal Name</label>
                                    <input
                                        type="text"
                                        name="food"
                                        value={formData.food}
                                        onChange={handleChange}
                                        placeholder={hasPlannedMeals ? 'e.g. Protein Bar' : 'e.g. Scrambled Eggs'}
                                        className="w-full p-3 bg-[var(--bg-secondary)] focus:bg-[var(--bg-secondary)]/80 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[var(--text-secondary)] font-medium mb-1.5 text-xs uppercase tracking-wider">Calories</label>
                                        <input
                                            type="number" name="calories" value={formData.calories} onChange={handleChange} min="0" step="0.1"
                                            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-blue-400 font-medium mb-1.5 text-xs uppercase tracking-wider">Protein (g)</label>
                                        <input
                                            type="number" name="protein" value={formData.protein} onChange={handleChange} min="0" step="0.1"
                                            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-blue-500/50 rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-orange-400 font-medium mb-1.5 text-xs uppercase tracking-wider">Carbs (g)</label>
                                        <input
                                            type="number" name="carbs" value={formData.carbs} onChange={handleChange} min="0" step="0.1"
                                            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-orange-500/50 rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all" required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-yellow-500 font-medium mb-1.5 text-xs uppercase tracking-wider">Fats (g)</label>
                                        <input
                                            type="number" name="fats" value={formData.fats} onChange={handleChange} min="0" step="0.1"
                                            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-yellow-500/50 rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all" required
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    type="submit"
                                    whileHover="hover"
                                    variants={buttonHover}
                                    whileTap={{ scale: 0.98 }}
                                    className={`w-full text-white p-4 rounded-xl font-bold transition-all duration-300 mt-4 shadow-lg ${editId ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 shadow-yellow-500/20' : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-600/20'}`}
                                >
                                    {editId ? 'Update Log' : (hasPlannedMeals ? '+ Add Extra Log' : '+ Log Meal')}
                                </motion.button>

                                {editId && (
                                    <button
                                        type="button"
                                        onClick={() => { setEditId(null); setFormData({ food: '', calories: '', protein: '', carbs: '', fats: '' }); }}
                                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] p-3 rounded-xl font-medium hover:bg-[var(--bg-primary)] transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </form>
                        </motion.div>
                    </div>

                    {/* Right Column: Macro Logs History */}
                    <div className="xl:col-span-2">
                        <motion.div
                            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
                            className="bg-[var(--bg-card)]/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-[var(--border-color)] h-full"
                        >
                            <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] flex items-center">
                                <span className="bg-purple-600 w-1.5 h-8 rounded-full mr-3"></span>
                                Your Food Diary
                            </h2>
                            {logs.length > 0 ? (
                                <div className="space-y-4">
                                    {logs.map((log) => {
                                        const isPlannedLog = log.food.includes('(Planned)');
                                        const displayName = log.food.replace('(Planned)', '').trim();

                                        return (
                                            <motion.div
                                                key={log._id}
                                                className={`bg-[var(--bg-secondary)]/50 p-5 rounded-xl border hover:shadow-md transition-all duration-300 ${isPlannedLog ? 'border-emerald-500/30 hover:border-emerald-500/50' : 'border-[var(--border-color)] hover:border-blue-500/50'}`}
                                                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={zoomIn}
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="text-[var(--text-primary)] font-bold text-lg">{displayName}</h3>
                                                            {isPlannedLog ? (
                                                                <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-500 text-[9px] font-bold uppercase tracking-widest rounded mb-0.5 inline-block border border-emerald-500/20">Planned</span>
                                                            ) : (
                                                                hasPlannedMeals && <span className="px-2 py-0.5 bg-gray-500/15 text-gray-400 text-[9px] font-bold uppercase tracking-widest rounded mb-0.5 inline-block border border-gray-500/20">Extra</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[var(--text-secondary)] text-xs">
                                                            {new Date(log.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                        </p>
                                                    </div>
                                                    <div className="flex space-x-2 shrink-0">
                                                        <motion.button onClick={() => handleEdit(log)} whileHover={{ scale: 1.1 }} className="p-2 bg-[var(--bg-primary)] border border-[var(--border-color)] text-blue-400 rounded-lg hover:bg-blue-500/10 transition-colors">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                                        </motion.button>
                                                        <motion.button onClick={() => handleDelete(log._id)} whileHover={{ scale: 1.1 }} className="p-2 bg-[var(--bg-primary)] border border-[var(--border-color)] text-red-500 rounded-lg hover:bg-red-500/10 transition-colors">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                        </motion.button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-4 gap-2 text-center">
                                                    <div className="bg-[var(--bg-primary)]/80 border border-[var(--border-color)] p-2 rounded-xl">
                                                        <p className="text-[var(--text-secondary)] text-[10px] uppercase font-medium mb-0.5">Calories</p>
                                                        <p className="text-[var(--text-primary)] font-bold text-sm block">{log.macros.calories}</p>
                                                    </div>
                                                    <div className="bg-[var(--bg-primary)]/80 border border-blue-500/20 p-2 rounded-xl">
                                                        <p className="text-blue-500 text-[10px] uppercase font-medium mb-0.5">Protein</p>
                                                        <p className="text-blue-400 font-bold text-sm block">{log.macros.protein}g</p>
                                                    </div>
                                                    <div className="bg-[var(--bg-primary)]/80 border border-orange-500/20 p-2 rounded-xl">
                                                        <p className="text-orange-500 text-[10px] uppercase font-medium mb-0.5">Carbs</p>
                                                        <p className="text-orange-400 font-bold text-sm block">{log.macros.carbs}g</p>
                                                    </div>
                                                    <div className="bg-[var(--bg-primary)]/80 border border-yellow-500/20 p-2 rounded-xl">
                                                        <p className="text-yellow-600 text-[10px] uppercase font-medium mb-0.5">Fats</p>
                                                        <p className="text-yellow-500 font-bold text-sm block">{log.macros.fats}g</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-[var(--bg-secondary)]/50 p-12 rounded-2xl text-center border border-[var(--border-color)] border-dashed mt-4">
                                    <span className="text-5xl block mb-4">🥗</span>
                                    <p className="text-[var(--text-primary)] text-lg font-bold">No meals logged yet</p>
                                    <p className="text-[var(--text-secondary)] text-sm mt-2">Log your first meal to start tracking today's progress.</p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MacroCalculator;
import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DietSchedule = () => {
    const { user } = useContext(AuthContext);
    const [activeDay, setActiveDay] = useState('monday');
    const [schedule, setSchedule] = useState({
        monday: [], tuesday: [], wednesday: [], thursday: [],
        friday: [], saturday: [], sunday: []
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state for new meal
    const [newMeal, setNewMeal] = useState({
        mealName: '', calories: '', protein: '', carbs: '', fats: ''
    });

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        if (user?.role === 'member') {
            fetchSchedule();
            // Default to today
            const todayIndex = new Date().getDay(); // 0 is Sunday
            const dayName = todayIndex === 0 ? 'sunday' : DAYS[todayIndex - 1];
            setActiveDay(dayName);
        }
    }, [user]);

    const fetchSchedule = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/member/diet-schedule`, { headers });
            if (res.data && res.data.schedule) {
                setSchedule(res.data.schedule);
            }
        } catch (err) {
            toast.error('Failed to load diet schedule', { position: 'top-right' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSchedule = async () => {
        try {
            setSaving(true);
            await axios.put(`${API_URL}/member/diet-schedule`, { schedule }, { headers });
            toast.success('Weekly diet schedule saved successfully!', { position: 'top-right' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save schedule', { position: 'top-right' });
        } finally {
            setSaving(false);
        }
    };

    const handleAddMeal = (e) => {
        e.preventDefault();
        if (!newMeal.mealName || !newMeal.calories || !newMeal.protein || !newMeal.carbs || !newMeal.fats) {
            toast.error('Please fill in all meal details');
            return;
        }

        const meal = {
            mealName: newMeal.mealName,
            calories: Number(newMeal.calories),
            protein: Number(newMeal.protein),
            carbs: Number(newMeal.carbs),
            fats: Number(newMeal.fats)
        };

        setSchedule(prev => ({
            ...prev,
            [activeDay]: [...prev[activeDay], meal]
        }));

        setNewMeal({ mealName: '', calories: '', protein: '', carbs: '', fats: '' });
    };

    const handleRemoveMeal = (index) => {
        setSchedule(prev => ({
            ...prev,
            [activeDay]: prev[activeDay].filter((_, i) => i !== index)
        }));
    };

    const copyFromYesterday = () => {
        const todayIndex = DAYS.indexOf(activeDay);
        if (todayIndex === 0) {
            toast.info("Monday is the first day of the week. Copy from Sunday instead?", {
                onClick: () => {
                    setSchedule(prev => ({ ...prev, monday: [...prev.sunday] }));
                }
            });
            return;
        }
        const yesterday = DAYS[todayIndex - 1];
        setSchedule(prev => ({ ...prev, [activeDay]: [...prev[yesterday]] }));
        toast.success(`Copied meals from ${yesterday.charAt(0).toUpperCase() + yesterday.slice(1)}`);
    };

    const calculateDailyTotals = (dayMeals) => {
        return dayMeals.reduce((acc, meal) => ({
            calories: acc.calories + (meal.calories || 0),
            protein: acc.protein + (meal.protein || 0),
            carbs: acc.carbs + (meal.carbs || 0),
            fats: acc.fats + (meal.fats || 0)
        }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4 flex justify-center items-center">
                <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    const currentDayMeals = schedule[activeDay] || [];
    const dailyTotals = calculateDailyTotals(currentDayMeals);

    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            {/* Background */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-5 fixed"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)]/95 to-[var(--bg-primary)] fixed"></div>

            <div className="container mx-auto max-w-5xl relative z-10">
                <motion.div initial="hidden" animate="visible" variants={fadeIn} className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                    <div>
                        <Link to="/member-dashboard" className="text-emerald-500 hover:text-emerald-400 flex items-center gap-1 font-medium mb-4 transition-colors w-fit">
                            <span>←</span> Back to Dashboard
                        </Link>
                        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
                            Weekly Diet Schedule
                        </h1>
                        <p className="text-[var(--text-secondary)] mt-1">Plan your meals for the week to track adherence.</p>
                    </div>

                    <button
                        onClick={handleSaveSchedule}
                        disabled={saving}
                        className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Saving...</>
                        ) : (
                            <>💾 Save Schedule</>
                        )}
                    </button>
                </motion.div>

                {/* Day Navigation */}
                <div className="bg-[var(--bg-card)]/80 backdrop-blur-md rounded-2xl p-2 mb-6 flex flex-wrap gap-2 justify-center shadow-lg border border-[var(--border-color)]">
                    {DAYS.map(day => (
                        <button
                            key={day}
                            onClick={() => setActiveDay(day)}
                            className={`flex-1 min-w-[80px] py-2.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 capitalize ${
                                activeDay === day
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            {day.substring(0, 3)}
                            {schedule[day]?.length > 0 && (
                                <span className={`ml-2 w-1.5 h-1.5 rounded-full inline-block ${activeDay === day ? 'bg-white' : 'bg-emerald-500'}`}></span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Col: Meal List */}
                    <div className="lg:col-span-2 space-y-6">
                        <motion.div
                            key={activeDay}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-[var(--bg-card)]/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border border-[var(--border-color)]"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-[var(--text-primary)] capitalize flex items-center gap-2">
                                    {activeDay}'s Meals
                                </h2>
                                <button 
                                    onClick={copyFromYesterday}
                                    className="text-sm font-medium px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500/20 transition-colors flex items-center gap-2"
                                >
                                    📋 Copy from Prev Day
                                </button>
                            </div>

                            {currentDayMeals.length === 0 ? (
                                <div className="text-center py-12 bg-[var(--bg-secondary)]/50 rounded-2xl border border-dashed border-[var(--border-color)]">
                                    <span className="text-4xl block mb-3">🍽️</span>
                                    <p className="text-[var(--text-primary)] font-bold text-lg">No meals planned</p>
                                    <p className="text-[var(--text-secondary)]">Add a meal below to start planning.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {currentDayMeals.map((meal, index) => (
                                        <div key={index} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-4 flex justify-between items-center group">
                                            <div>
                                                <h3 className="font-bold text-[var(--text-primary)] text-lg">{meal.mealName}</h3>
                                                <div className="flex gap-4 mt-1 text-sm font-medium">
                                                    <span className="text-[var(--text-secondary)]">{meal.calories} kcal</span>
                                                    <span className="text-blue-400">{meal.protein}g P</span>
                                                    <span className="text-orange-400">{meal.carbs}g C</span>
                                                    <span className="text-yellow-500">{meal.fats}g F</span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleRemoveMeal(index)}
                                                className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Summary Totals */}
                            {currentDayMeals.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
                                    <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Daily Goals / Totals</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="bg-[var(--bg-primary)] rounded-xl p-3 text-center border border-[var(--border-color)]">
                                            <span className="block text-xs text-[var(--text-secondary)] mb-1">Calories</span>
                                            <span className="font-bold text-[var(--text-primary)] text-lg">{dailyTotals.calories}</span>
                                        </div>
                                        <div className="bg-[var(--bg-primary)] rounded-xl p-3 text-center border border-blue-500/20">
                                            <span className="block text-xs text-blue-400 mb-1">Protein</span>
                                            <span className="font-bold text-[var(--text-primary)] text-lg">{dailyTotals.protein}g</span>
                                        </div>
                                        <div className="bg-[var(--bg-primary)] rounded-xl p-3 text-center border border-orange-500/20">
                                            <span className="block text-xs text-orange-400 mb-1">Carbs</span>
                                            <span className="font-bold text-[var(--text-primary)] text-lg">{dailyTotals.carbs}g</span>
                                        </div>
                                        <div className="bg-[var(--bg-primary)] rounded-xl p-3 text-center border border-yellow-500/20">
                                            <span className="block text-xs text-yellow-500 mb-1">Fats</span>
                                            <span className="font-bold text-[var(--text-primary)] text-lg">{dailyTotals.fats}g</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Right Col: Add Meal Form */}
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="bg-[var(--bg-card)]/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-[var(--border-color)] sticky top-24"
                        >
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-5">Add New Meal</h3>
                            <form onSubmit={handleAddMeal} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-[var(--text-secondary)] mb-1">Meal Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Breakfast, Chicken & Rice"
                                        value={newMeal.mealName}
                                        onChange={e => setNewMeal({...newMeal, mealName: e.target.value})}
                                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-[var(--text-secondary)] mb-1">Calories</label>
                                        <input
                                            type="number"
                                            value={newMeal.calories}
                                            onChange={e => setNewMeal({...newMeal, calories: e.target.value})}
                                            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-blue-400 mb-1">Protein (g)</label>
                                        <input
                                            type="number"
                                            value={newMeal.protein}
                                            onChange={e => setNewMeal({...newMeal, protein: e.target.value})}
                                            className="w-full bg-[var(--bg-secondary)] border border-blue-500/30 text-[var(--text-primary)] px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-orange-400 mb-1">Carbs (g)</label>
                                        <input
                                            type="number"
                                            value={newMeal.carbs}
                                            onChange={e => setNewMeal({...newMeal, carbs: e.target.value})}
                                            className="w-full bg-[var(--bg-secondary)] border border-orange-500/30 text-[var(--text-primary)] px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-yellow-500 mb-1">Fats (g)</label>
                                        <input
                                            type="number"
                                            value={newMeal.fats}
                                            onChange={e => setNewMeal({...newMeal, fats: e.target.value})}
                                            className="w-full bg-[var(--bg-secondary)] border border-yellow-500/30 text-[var(--text-primary)] px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full mt-4 py-3 bg-[var(--bg-secondary)] hover:bg-emerald-500/10 text-[var(--text-primary)] hover:text-emerald-500 border border-[var(--border-color)] hover:border-emerald-500/50 rounded-xl font-bold transition-colors"
                                >
                                    + Add to {activeDay.substring(0, 3)}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DietSchedule;

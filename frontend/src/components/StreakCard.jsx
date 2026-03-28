import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const StreakCard = () => {
    const [streakData, setStreakData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [logging, setLogging] = useState(false);
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const fetchStreak = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/member/streak`, { headers });
            setStreakData(res.data);
            setError('');
        } catch (err) {
            console.error('Failed to fetch streak:', err);
            setError('Could not load streak data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStreak();
    }, [fetchStreak]);

    const handleLogWorkout = async () => {
        if (logging) return;
        setLogging(true);

        try {
            if (streakData?.todayLogged) {
                // Find today's log and delete it
                const logsRes = await axios.get(`${API_URL}/member/workout-log?days=1&limit=1`, { headers });
                const todayLog = logsRes.data?.data?.[0];
                if (todayLog) {
                    await axios.delete(`${API_URL}/member/workout-log/${todayLog._id}`, { headers });
                }
            } else {
                await axios.post(`${API_URL}/member/workout-log`, {}, { headers });
            }
            await fetchStreak();
        } catch (err) {
            console.error('Failed to log workout:', err);
            setError(err.response?.data?.message || 'Failed to log workout');
            setTimeout(() => setError(''), 3000);
        } finally {
            setLogging(false);
        }
    };

    // Day labels for the 7-day tracker
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    if (loading) {
        return (
            <div className="bg-[var(--bg-card)]/80 backdrop-blur-md rounded-3xl shadow-2xl border border-[var(--border-color)] p-6 sm:p-8 mb-8 animate-pulse">
                <div className="h-8 bg-[var(--bg-secondary)] rounded-lg w-48 mb-4"></div>
                <div className="h-24 bg-[var(--bg-secondary)] rounded-xl"></div>
            </div>
        );
    }

    const { currentStreak = 0, longestStreak = 0, totalWorkouts = 0, todayLogged = false, last7Days = [] } = streakData || {};

    // Determine streak intensity for visual effects
    const getStreakGlow = () => {
        if (currentStreak >= 30) return 'shadow-orange-500/40 border-orange-400/50';
        if (currentStreak >= 14) return 'shadow-orange-500/30 border-orange-400/40';
        if (currentStreak >= 7) return 'shadow-orange-500/20 border-orange-400/30';
        if (currentStreak >= 3) return 'shadow-amber-500/15 border-amber-400/20';
        return 'shadow-2xl border-[var(--border-color)]';
    };

    const getStreakEmoji = () => {
        if (currentStreak >= 30) return '🏆';
        if (currentStreak >= 14) return '💪';
        if (currentStreak >= 7) return '🔥';
        if (currentStreak >= 3) return '⚡';
        return '🎯';
    };

    const getMotivationalText = () => {
        if (currentStreak >= 30) return 'Legendary! Nothing stops you!';
        if (currentStreak >= 14) return 'Two weeks strong! Beast mode!';
        if (currentStreak >= 7) return 'One week down! Keep crushing it!';
        if (currentStreak >= 3) return 'Building momentum!';
        if (currentStreak >= 1) return 'Great start! Keep going!';
        return todayLogged ? 'Day 0 — fresh start!' : 'Ready to start your streak?';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`bg-[var(--bg-card)]/80 backdrop-blur-md rounded-3xl shadow-2xl border p-6 sm:p-8 mb-8 relative overflow-hidden ${getStreakGlow()}`}
        >
            {/* Decorative background gradient */}
            {currentStreak >= 3 && (
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 pointer-events-none"></div>
            )}

            <div className="relative z-10">
                {/* Header Row */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <span>Workout Streak</span>
                    </h2>

                    {/* Log Workout Button */}
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleLogWorkout}
                        disabled={logging}
                        className={`
                            relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm sm:text-base
                            transition-all duration-300 cursor-pointer
                            ${todayLogged
                                ? 'bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25'
                                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 hover:from-blue-500 hover:to-blue-600'
                            }
                            ${logging ? 'opacity-60 cursor-not-allowed' : ''}
                        `}
                    >
                        {logging ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                        ) : todayLogged ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                        )}
                        <span>{todayLogged ? 'Logged Today' : 'Log Workout'}</span>
                    </motion.button>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-red-400 text-sm mb-4 bg-red-500/10 px-3 py-2 rounded-lg"
                        >
                            {error}
                        </motion.p>
                    )}
                </AnimatePresence>

                {/* Main Streak Display */}
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
                    {/* Fire + Count */}
                    <div className="flex items-center gap-3">
                        <motion.span
                            className="text-4xl sm:text-5xl"
                            animate={currentStreak > 0 ? { scale: [1, 1.15, 1] } : {}}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            {getStreakEmoji()}
                        </motion.span>
                        <div>
                            <motion.span
                                key={currentStreak}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent"
                            >
                                {currentStreak}
                            </motion.span>
                            <p className="text-sm text-[var(--text-secondary)] font-medium">
                                {currentStreak === 1 ? 'Day Streak' : 'Day Streak'}
                            </p>
                        </div>
                    </div>

                    {/* Motivational Text */}
                    <motion.p
                        key={getMotivationalText()}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-[var(--text-secondary)] text-sm sm:text-base italic text-center sm:text-left"
                    >
                        {getMotivationalText()}
                    </motion.p>
                </div>

                {/* 7-Day Activity Tracker */}
                <div className="mb-6">
                    <p className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-3">Last 7 Days</p>
                    <div className="flex items-center gap-2 sm:gap-3">
                        {last7Days.map((day, index) => {
                            const date = new Date(day.date + 'T00:00:00');
                            const dayOfWeek = dayLabels[date.getDay() === 0 ? 6 : date.getDay() - 1];
                            const isToday = index === last7Days.length - 1;

                            return (
                                <motion.div
                                    key={day.date}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05, duration: 0.3 }}
                                    className="flex flex-col items-center gap-1.5 flex-1"
                                >
                                    <span className={`text-[10px] sm:text-xs font-medium ${isToday ? 'text-blue-400' : 'text-[var(--text-secondary)]'}`}>
                                        {isToday ? 'Today' : dayOfWeek}
                                    </span>
                                    <motion.div
                                        whileHover={{ scale: 1.2 }}
                                        className={`
                                            w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center
                                            transition-all duration-300 text-sm sm:text-base
                                            ${day.logged
                                                ? 'bg-green-500/20 text-green-400 ring-2 ring-green-500/30'
                                                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]/50 ring-1 ring-[var(--border-color)]'
                                            }
                                            ${isToday && !day.logged ? 'ring-2 ring-blue-500/30 ring-dashed' : ''}
                                        `}
                                    >
                                        {day.logged ? '✓' : '·'}
                                    </motion.div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    {[
                        { label: 'Current', value: currentStreak, icon: '🔥', color: 'from-orange-500/10 to-amber-500/10' },
                        { label: 'Longest', value: longestStreak, icon: '🏅', color: 'from-yellow-500/10 to-orange-500/10' },
                        { label: 'Total', value: totalWorkouts, icon: '💪', color: 'from-blue-500/10 to-cyan-500/10' },
                    ].map((stat) => (
                        <motion.div
                            key={stat.label}
                            whileHover={{ y: -2 }}
                            className={`bg-gradient-to-br ${stat.color} rounded-xl p-3 sm:p-4 text-center border border-[var(--border-color)]/50`}
                        >
                            <span className="text-lg sm:text-xl">{stat.icon}</span>
                            <p className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-1">{stat.value}</p>
                            <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default StreakCard;

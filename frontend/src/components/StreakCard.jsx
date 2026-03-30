import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const StreakCard = () => {
    const [streakData, setStreakData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [logging, setLogging] = useState(false);
    const [error, setError] = useState('');
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [editSchedule, setEditSchedule] = useState([0, 1, 2, 3, 4, 5, 6]);
    const [savingSchedule, setSavingSchedule] = useState(false);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const fetchStreak = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/member/streak`, { headers });
            setStreakData(res.data);
            setEditSchedule(res.data.workoutSchedule || [0, 1, 2, 3, 4, 5, 6]);
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

    const toggleDay = (day) => {
        setEditSchedule((prev) => {
            if (prev.includes(day)) {
                if (prev.length <= 1) return prev; // Must keep at least 1 day
                return prev.filter((d) => d !== day);
            }
            return [...prev, day].sort((a, b) => a - b);
        });
    };

    const handleSaveSchedule = async () => {
        setSavingSchedule(true);
        try {
            await axios.put(`${API_URL}/member/schedule`, { workoutSchedule: editSchedule }, { headers });
            await fetchStreak();
            setShowScheduleModal(false);
        } catch (err) {
            console.error('Failed to save schedule:', err);
            setError(err.response?.data?.message || 'Failed to save schedule');
            setTimeout(() => setError(''), 3000);
        } finally {
            setSavingSchedule(false);
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

    const {
        currentStreak = 0,
        longestStreak = 0,
        totalWorkouts = 0,
        todayLogged = false,
        todayIsGymDay = true,
        workoutSchedule = [0, 1, 2, 3, 4, 5, 6],
        last7Days = [],
    } = streakData || {};

    const gymDaysPerWeek = workoutSchedule.length;
    const isEveryDay = gymDaysPerWeek === 7;

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
        if (!todayIsGymDay && !todayLogged) return '😴 Rest day — recharge & come back stronger!';
        if (currentStreak >= 30) return 'Legendary! Nothing stops you!';
        if (currentStreak >= 14) return 'Two weeks strong! Beast mode!';
        if (currentStreak >= 7) return 'One week down! Keep crushing it!';
        if (currentStreak >= 3) return 'Building momentum!';
        if (currentStreak >= 1) return 'Great start! Keep going!';
        return todayLogged ? 'Day 0 — fresh start!' : 'Ready to start your streak?';
    };

    const getStreakLabel = () => {
        if (isEveryDay) return 'Day Streak';
        return 'Gym Day Streak';
    };

    return (
        <>
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
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <span>Workout Streak</span>
                            </h2>
                            {/* Settings Button */}
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 20 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                    setEditSchedule(workoutSchedule);
                                    setShowScheduleModal(true);
                                }}
                                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/60 transition-all duration-200 cursor-pointer"
                                title="Configure workout schedule"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </motion.button>
                        </div>

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
                                    : !todayIsGymDay
                                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-600/25 hover:shadow-purple-500/40'
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
                            <span>
                                {todayLogged ? 'Logged Today' : !todayIsGymDay ? 'Bonus Workout' : 'Log Workout'}
                            </span>
                        </motion.button>
                    </div>

                    {/* Schedule Badge */}
                    {!isEveryDay && (
                        <div className="mb-4 flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">Schedule:</span>
                            <div className="flex gap-1">
                                {DAY_NAMES.map((name, idx) => (
                                    <span
                                        key={idx}
                                        className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded font-medium ${
                                            workoutSchedule.includes(idx)
                                                ? 'bg-blue-500/15 text-blue-400'
                                                : 'bg-[var(--bg-secondary)]/40 text-[var(--text-secondary)]/50 line-through'
                                        }`}
                                    >
                                        {name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

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
                                    {getStreakLabel()}
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
                                const isRestDay = day.isRestDay;

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
                                                    ? isRestDay
                                                        ? 'bg-purple-500/20 text-purple-400 ring-2 ring-purple-500/30'
                                                        : 'bg-green-500/20 text-green-400 ring-2 ring-green-500/30'
                                                    : isRestDay
                                                        ? 'bg-[var(--bg-secondary)]/30 text-[var(--text-secondary)]/30 ring-1 ring-dashed ring-[var(--border-color)]/50'
                                                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]/50 ring-1 ring-[var(--border-color)]'
                                                }
                                                ${isToday && !day.logged && !isRestDay ? 'ring-2 ring-blue-500/30' : ''}
                                            `}
                                            title={isRestDay ? 'Rest day' : 'Gym day'}
                                        >
                                            {day.logged ? '✓' : isRestDay ? '−' : '·'}
                                        </motion.div>
                                    </motion.div>
                                );
                            })}
                        </div>
                        {/* Legend */}
                        {!isEveryDay && (
                            <div className="flex items-center gap-4 mt-3 text-[10px] sm:text-xs text-[var(--text-secondary)]">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500/40 inline-block"></span> Gym day
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-purple-500/40 inline-block"></span> Bonus (rest day)
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-[var(--bg-secondary)] inline-block border border-dashed border-[var(--border-color)]"></span> Rest day
                                </span>
                            </div>
                        )}
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

            {/* Schedule Settings Modal */}
            <AnimatePresence>
                {showScheduleModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowScheduleModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl p-6 sm:p-8 w-full max-w-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                                    <span>⚙️</span> Workout Schedule
                                </h3>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowScheduleModal(false)}
                                    className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/60 transition-colors cursor-pointer"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </motion.button>
                            </div>

                            <p className="text-[var(--text-secondary)] text-sm mb-6">
                                Select your gym days. Your streak won&apos;t break on rest days!
                            </p>

                            {/* Day Toggle Grid */}
                            <div className="grid grid-cols-7 gap-2 mb-6">
                                {DAY_NAMES.map((name, idx) => {
                                    const isSelected = editSchedule.includes(idx);
                                    return (
                                        <motion.button
                                            key={idx}
                                            whileHover={{ scale: 1.08 }}
                                            whileTap={{ scale: 0.92 }}
                                            onClick={() => toggleDay(idx)}
                                            className={`
                                                flex flex-col items-center gap-1 py-3 rounded-xl font-semibold text-xs sm:text-sm
                                                transition-all duration-200 cursor-pointer border
                                                ${isSelected
                                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/25'
                                                    : 'bg-[var(--bg-secondary)]/50 border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'
                                                }
                                            `}
                                        >
                                            <span>{isSelected ? '🏋️' : '😴'}</span>
                                            <span>{name}</span>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Summary */}
                            <div className="bg-[var(--bg-secondary)]/40 rounded-xl p-4 mb-6 border border-[var(--border-color)]/50">
                                <p className="text-sm text-[var(--text-secondary)]">
                                    <span className="font-semibold text-[var(--text-primary)]">{editSchedule.length}</span> gym day{editSchedule.length !== 1 ? 's' : ''} per week,{' '}
                                    <span className="font-semibold text-[var(--text-primary)]">{7 - editSchedule.length}</span> rest day{7 - editSchedule.length !== 1 ? 's' : ''}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowScheduleModal(false)}
                                    className="flex-1 py-3 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-secondary)]/50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSaveSchedule}
                                    disabled={savingSchedule}
                                    className={`flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 transition-all cursor-pointer ${
                                        savingSchedule ? 'opacity-60 cursor-not-allowed' : ''
                                    }`}
                                >
                                    {savingSchedule ? 'Saving...' : 'Save Schedule'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default StreakCard;

import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// ── Shared animation keyframes ────────────────────────────────────────
const sharedStyles = `
@keyframes confetti-fall {
    0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(80px)  rotate(720deg); opacity: 0; }
}
.confetti-piece {
    position: absolute; width: 8px; height: 8px; border-radius: 2px;
    animation: confetti-fall 1s ease-out forwards;
}
@keyframes pulse-rest {
    0%,100% { opacity: 1; } 50% { opacity: 0.35; }
}
.rest-pulse { animation: pulse-rest 1.4s ease-in-out 3; }
`;
const CONFETTI_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#ef4444'];

const DEFAULT_EXERCISE = { name: '', sets: '', reps: '', rest: '' };

// ── Edit Workout Modal ────────────────────────────────────────────────
const EditWorkoutModal = ({ workout, onClose, onSave }) => {
    const [title, setTitle] = useState(workout.title);
    const [exercises, setExercises] = useState(
        workout.exercises.map((ex) => ({ ...ex })),
    );
    const [saving, setSaving] = useState(false);

    const handleExerciseChange = (idx, field, value) => {
        const updated = [...exercises];
        updated[idx] = { ...updated[idx], [field]: value };
        setExercises(updated);
    };
    const addExercise = () => setExercises((prev) => [...prev, { ...DEFAULT_EXERCISE }]);
    const removeExercise = (idx) => setExercises((prev) => prev.filter((_, i) => i !== idx));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        const valid = exercises.every((ex) => ex.name && ex.sets && ex.reps);
        if (!valid) return;
        setSaving(true);
        await onSave(workout._id, title, exercises);
        setSaving(false);
    };

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                {/* Modal panel */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 20 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
                >
                    {/* Modal header */}
                    <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--border-color)]">
                        <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                            <span className="bg-amber-500 w-1.5 h-6 rounded-full" />
                            Edit Workout
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--bg-secondary)]"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    {/* Modal body — scrollable */}
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-[var(--text-secondary)] text-sm font-medium mb-1.5">Workout Name</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full p-3 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                                    required
                                />
                            </div>

                            {/* Exercises */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-[var(--text-primary)] font-bold text-sm">Exercises</h3>
                                    <button
                                        type="button"
                                        onClick={addExercise}
                                        className="text-amber-400 text-sm hover:text-amber-300 font-semibold transition-colors"
                                    >
                                        + Add Exercise
                                    </button>
                                </div>

                                {exercises.map((ex, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-[var(--bg-secondary)]/50 p-3 rounded-xl border border-[var(--border-color)] relative group"
                                    >
                                        {exercises.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeExercise(idx)}
                                                className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        )}
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={ex.name}
                                                onChange={(e) => handleExerciseChange(idx, 'name', e.target.value)}
                                                placeholder="Exercise name"
                                                className="w-full p-2 bg-[var(--bg-primary)]/50 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500"
                                                required
                                            />
                                            <div className="grid grid-cols-3 gap-2">
                                                <input
                                                    type="number"
                                                    value={ex.sets}
                                                    onChange={(e) => handleExerciseChange(idx, 'sets', e.target.value)}
                                                    placeholder="Sets"
                                                    min="1"
                                                    className="w-full p-2 bg-[var(--bg-primary)]/50 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-amber-500"
                                                    required
                                                />
                                                <input
                                                    type="number"
                                                    value={ex.reps}
                                                    onChange={(e) => handleExerciseChange(idx, 'reps', e.target.value)}
                                                    placeholder="Reps"
                                                    min="1"
                                                    className="w-full p-2 bg-[var(--bg-primary)]/50 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-amber-500"
                                                    required
                                                />
                                                <input
                                                    type="text"
                                                    value={ex.rest}
                                                    onChange={(e) => handleExerciseChange(idx, 'rest', e.target.value)}
                                                    placeholder="Rest"
                                                    className="w-full p-2 bg-[var(--bg-primary)]/50 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-amber-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Reset chip info */}
                            <p className="text-xs text-amber-400/70 flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                Changing exercises will reset your checklist progress for this workout.
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="px-6 pb-6 pt-3 border-t border-[var(--border-color)] flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] font-semibold text-sm hover:bg-[var(--bg-secondary)] transition-all"
                            >
                                Cancel
                            </button>
                            <motion.button
                                type="submit"
                                disabled={saving}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all disabled:opacity-60"
                            >
                                {saving ? 'Saving…' : '✓ Save Changes'}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ── Inline Checklist for a custom workout doc ─────────────────────────
const CustomChecklist = ({ workout, onUpdate, onDelete, onEdit }) => {
    const [checked, setChecked] = useState(workout.completedExercises ?? []);
    const [saving, setSaving] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [lastChecked, setLastChecked] = useState(null);
    const nextRef = useRef(null);

    const total = workout.exercises.length;
    const done = checked.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const isComplete = done >= total && total > 0;

    useEffect(() => {
        if (nextRef.current)
            nextRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [checked]);

    const handleToggle = useCallback(
        async (idx) => {
            if (workout.status === 'completed') return;
            const isNow = !checked.includes(idx);
            const newChecked = isNow ? [...checked, idx] : checked.filter((i) => i !== idx);
            setChecked(newChecked);
            if (isNow) setLastChecked(idx);
            setSaving(true);
            try {
                const token = localStorage.getItem('token');
                const res = await axios.put(
                    `${API_URL}/member/custom-workouts/${workout._id}`,
                    { completedExercises: newChecked },
                    { headers: { Authorization: `Bearer ${token}` } },
                );
                if (res.data.streakLogged) {
                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 2000);
                    toast.success('🏆 Custom workout complete! Streak updated!', {
                        position: 'top-right',
                        autoClose: 4000,
                    });
                }
                onUpdate(res.data.workout);
            } catch {
                setChecked(checked);
                toast.error('Failed to save progress', { position: 'top-right' });
            } finally {
                setSaving(false);
                setTimeout(() => setLastChecked(null), 2500);
            }
        },
        [workout, checked, onUpdate],
    );

    return (
        <div className="mt-3 space-y-3">
            {/* Progress Bar */}
            <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-[var(--text-secondary)]">{done} / {total} done</span>
                    <span className={isComplete ? 'text-green-400' : 'text-purple-400'}>{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--bg-primary)] overflow-hidden">
                    <motion.div
                        className={`h-full rounded-full ${isComplete
                            ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                            : 'bg-gradient-to-r from-purple-600 to-purple-400'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                    />
                </div>
            </div>

            {/* Completion banner */}
            <AnimatePresence>
                {isComplete && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative overflow-hidden p-3 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-center"
                    >
                        {showConfetti && (
                            <div className="absolute inset-0 pointer-events-none flex justify-center">
                                {CONFETTI_COLORS.map((color, i) => (
                                    <span
                                        key={i}
                                        className="confetti-piece"
                                        style={{
                                            backgroundColor: color,
                                            left: `${10 + i * 14}%`,
                                            animationDelay: `${i * 0.08}s`,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                        <p className="text-purple-300 font-bold text-sm">💪 Workout Complete! Streak protected.</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Exercises */}
            <div className="space-y-2">
                {workout.exercises.map((ex, idx) => {
                    const isDone = checked.includes(idx);
                    const isNext = !isDone && workout.exercises.slice(0, idx).every((_, i) => checked.includes(i));
                    const justChecked = lastChecked === idx;

                    return (
                        <motion.div
                            key={idx}
                            ref={isNext ? nextRef : null}
                            layout
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            onClick={() => handleToggle(idx)}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all duration-200 ${
                                isDone
                                    ? 'bg-green-500/8 border-green-500/20 opacity-70'
                                    : isNext
                                    ? 'bg-purple-500/8 border-purple-500/30 shadow-sm shadow-purple-500/10'
                                    : 'bg-[var(--bg-primary)]/50 border-[var(--border-color)] hover:border-purple-500/30'
                            }`}
                        >
                            {/* Checkbox */}
                            <motion.div
                                whileTap={{ scale: 0.85 }}
                                className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors duration-200 ${
                                    isDone ? 'bg-green-500 border-green-500' : 'border-[var(--border-color)]'
                                }`}
                            >
                                <AnimatePresence>
                                    {isDone && (
                                        <motion.svg
                                            key="check"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            transition={{ duration: 0.18 }}
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-3 h-3 text-white"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </motion.svg>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate transition-all duration-200 ${isDone ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                                    {ex.name}
                                </p>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                    {ex.sets} sets × {ex.reps} reps
                                    {ex.rest && (
                                        <span className={`ml-2 ${justChecked ? 'text-amber-400 rest-pulse' : ''}`}>
                                            · Rest: {ex.rest}
                                        </span>
                                    )}
                                </p>
                            </div>

                            {/* Badge */}
                            <span className={`flex-shrink-0 text-xs px-2 py-1 rounded-lg font-bold ${isDone ? 'bg-green-500/10 text-green-400' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                                {ex.sets}×{ex.reps}
                            </span>
                        </motion.div>
                    );
                })}
            </div>

            {/* Action row: Edit + Delete */}
            <div className="flex items-center gap-4 mt-1">
                <button
                    onClick={() => onEdit(workout)}
                    className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors flex items-center gap-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    Edit workout
                </button>
                <button
                    onClick={() => onDelete(workout._id)}
                    className="text-xs text-red-400/60 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Delete workout
                </button>
            </div>

            {saving && (
                <p className="text-xs text-[var(--text-secondary)] text-right animate-pulse">Saving…</p>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────
// Main MyWorkouts Page
// ─────────────────────────────────────────────────────────────────────
const MyWorkouts = () => {
    const { user } = useContext(AuthContext);

    // Form state
    const [title, setTitle] = useState('');
    const [exercises, setExercises] = useState([{ ...DEFAULT_EXERCISE }]);
    const [submitting, setSubmitting] = useState(false);

    // List state
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter: show today or all
    const [showTodayOnly, setShowTodayOnly] = useState(true);

    const fadeIn = {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    };

    // Edit modal state
    const [editingWorkout, setEditingWorkout] = useState(null);
    const navigate = undefined; // not needed here

    // ── Fetch workouts ────────────────────────────────────────────────
    const fetchWorkouts = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            // New system: fetch reusable templates only
            const res = await axios.get(`${API_URL}/member/workout-templates`, { headers: { Authorization: `Bearer ${token}` } });
            setWorkouts(res.data);
        } catch {
            toast.error('Failed to load templates', { position: 'top-right' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user?.role === 'member') fetchWorkouts();
    }, [user, fetchWorkouts]);

    // ── Exercise form helpers ─────────────────────────────────────────
    const handleExerciseChange = (idx, field, value) => {
        const updated = [...exercises];
        updated[idx] = { ...updated[idx], [field]: value };
        setExercises(updated);
    };

    const addExercise = () => setExercises((prev) => [...prev, { ...DEFAULT_EXERCISE }]);
    const removeExercise = (idx) =>
        setExercises((prev) => prev.filter((_, i) => i !== idx));

    // ── Submit custom workout ─────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return toast.error('Please enter a workout name', { position: 'top-right' });
        const valid = exercises.every((ex) => ex.name && ex.sets && ex.reps);
        if (!valid) return toast.error('Fill in all exercise fields', { position: 'top-right' });

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${API_URL}/member/custom-workouts`,
                { title, exercises },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            setWorkouts((prev) => [res.data, ...prev]);
            setTitle('');
            setExercises([{ ...DEFAULT_EXERCISE }]);
            toast.success('💪 Workout created! Go crush it.', { position: 'top-right' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create workout', { position: 'top-right' });
        } finally {
            setSubmitting(false);
        }
    };

    // ── Update a workout in list ──────────────────────────────────────
    const handleUpdate = useCallback((updatedWorkout) => {
        setWorkouts((prev) =>
            prev.map((w) => (w._id === updatedWorkout._id ? updatedWorkout : w)),
        );
    }, []);

    // ── Edit save handler ─────────────────────────────────────────────
    const handleEditSave = useCallback(async (id, newTitle, newExercises) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(
                `${API_URL}/member/workout-templates/${id}`,
                { title: newTitle, exercises: newExercises },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            setWorkouts((prev) =>
                prev.map((w) => (w._id === id ? res.data : w)),
            );
            setEditingWorkout(null);
            toast.success('✏️ Template updated!', { position: 'top-right' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update template', { position: 'top-right' });
        }
    }, []);

    // ── Log Today handler ─────────────────────────────────────────────
    const handleLogToday = useCallback(async (templateId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/member/daily-logs`,
                { sourceType: 'custom_template', sourceTemplateId: templateId },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            toast.success('✅ Added to today\'s workout! Go to Today to log it.', {
                position: 'top-right',
                autoClose: 4000,
            });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add to today', { position: 'top-right' });
        }
    }, []);

    // ── Delete a template ──────────────────────────────────────────────
    const handleDelete = useCallback(async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/member/workout-templates/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setWorkouts((prev) => prev.filter((w) => w._id !== id));
            toast.success('Template deleted', { position: 'top-right' });
        } catch {
            toast.error('Failed to delete template', { position: 'top-right' });
        }
    }, []);

    if (user?.role !== 'member') {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
                <p className="text-red-500 text-lg font-semibold text-center">
                    Access denied. This page is only for Members.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <style>{sharedStyles}</style>

            {/* Background */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-5 fixed pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)]/95 to-[var(--bg-primary)] fixed pointer-events-none" />

            <div className="container mx-auto max-w-6xl relative z-10">
                {/* Page header */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="mb-10 text-center"
                >
                    <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
                        My Workout Templates
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2">
                        Build reusable workout plans. Hit <strong className="text-indigo-400">Log Today</strong> on any template to add it to <a href="/today" className="text-indigo-400 underline">Today's Workout</a>.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* ── Left: Create Form ──────────────────────────────── */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                        className="lg:col-span-2 bg-[var(--bg-card)]/80 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-[var(--border-color)] h-fit"
                    >
                        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center mb-6">
                            <span className="bg-purple-600 w-1.5 h-7 rounded-full mr-3" />
                            Create Template
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Workout name */}
                            <div>
                                <label className="block text-[var(--text-secondary)] text-sm font-medium mb-1.5">
                                    Workout Name
                                </label>
                                <input
                                    id="custom-workout-title"
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Push Day, Leg Blast…"
                                    className="w-full p-3 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                    required
                                />
                            </div>

                            {/* Exercises */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-[var(--text-primary)] font-bold text-sm">Exercises</h3>
                                    <button
                                        type="button"
                                        onClick={addExercise}
                                        className="text-purple-400 text-sm hover:text-purple-300 font-semibold transition-colors"
                                    >
                                        + Add Exercise
                                    </button>
                                </div>

                                {exercises.map((ex, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-[var(--bg-secondary)]/50 p-3 rounded-xl border border-[var(--border-color)] relative group"
                                    >
                                        {exercises.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeExercise(idx)}
                                                className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        )}
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={ex.name}
                                                onChange={(e) => handleExerciseChange(idx, 'name', e.target.value)}
                                                placeholder="Exercise name"
                                                className="w-full p-2 bg-[var(--bg-primary)]/50 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                                required
                                            />
                                            <div className="grid grid-cols-3 gap-2">
                                                <input
                                                    type="number"
                                                    value={ex.sets}
                                                    onChange={(e) => handleExerciseChange(idx, 'sets', e.target.value)}
                                                    placeholder="Sets"
                                                    min="1"
                                                    className="w-full p-2 bg-[var(--bg-primary)]/50 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-purple-500"
                                                    required
                                                />
                                                <input
                                                    type="number"
                                                    value={ex.reps}
                                                    onChange={(e) => handleExerciseChange(idx, 'reps', e.target.value)}
                                                    placeholder="Reps"
                                                    min="1"
                                                    className="w-full p-2 bg-[var(--bg-primary)]/50 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-purple-500"
                                                    required
                                                />
                                                <input
                                                    type="text"
                                                    value={ex.rest}
                                                    onChange={(e) => handleExerciseChange(idx, 'rest', e.target.value)}
                                                    placeholder="Rest"
                                                    className="w-full p-2 bg-[var(--bg-primary)]/50 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-purple-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <motion.button
                                type="submit"
                                disabled={submitting}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Saving…' : '📋 Save Template'}
                            </motion.button>
                        </form>
                    </motion.div>

                    {/* ── Right: Workout List ────────────────────────────── */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                        className="lg:col-span-3 space-y-5"
                    >
                        {/* Filter toggle */}
                        <div className="flex items-center justify-between bg-[var(--bg-card)]/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-[var(--border-color)]">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">My Templates</h2>
                            <span className="text-xs text-[var(--text-secondary)] px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-purple-500/20">
                                {workouts.length} template{workouts.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <svg className="animate-spin w-8 h-8 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                            </div>
                        ) : workouts.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-[var(--bg-card)]/80 backdrop-blur-md p-14 rounded-3xl border border-[var(--border-color)] border-dashed text-center"
                            >
                                <div className="text-5xl mb-4">📋</div>
                                <p className="text-[var(--text-primary)] font-bold text-lg">No templates yet</p>
                                <p className="text-[var(--text-secondary)] text-sm mt-2">
                                    Create your first workout template using the form on the left.
                                </p>
                            </motion.div>
                        ) : (
                            <AnimatePresence>
                                {workouts.map((workout) => (
                                    <motion.div
                                        key={workout._id}
                                        layout
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.97 }}
                                        transition={{ duration: 0.3 }}
                                        className={`bg-[var(--bg-card)]/80 backdrop-blur-md p-5 rounded-2xl border transition-colors duration-300 ${
                                            workout.status === 'completed'
                                                ? 'border-green-500/30'
                                                : 'border-[var(--border-color)] hover:border-purple-500/30'
                                        }`}
                                    >
                                        {/* Card header */}
                                        <div className="flex items-start justify-between mb-1">
                                            <div>
                                                <h3 className="text-[var(--text-primary)] font-bold text-base">
                                                    {workout.title}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                                        workout.status === 'completed'
                                                            ? 'bg-green-500/10 text-green-400'
                                                            : 'bg-purple-500/10 text-purple-400'
                                                    }`}>
                                                        {workout.status === 'completed' ? '✓ Completed' : 'In Progress'}
                                                    </span>
                                                    <span className="text-xs text-[var(--text-secondary)]">
                                                        {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-[var(--text-secondary)]">
                                                {new Date(workout.date).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {/* Template action row */}
                                        <div className="mt-3 space-y-2">
                                            <p className="text-xs text-[var(--text-secondary)]">
                                                {workout.exercises.slice(0, 3).map((e, i) => (
                                                    <span key={i}>{e.name}{i < Math.min(2, workout.exercises.length - 1) ? ', ' : ''}</span>
                                                ))}
                                                {workout.exercises.length > 3 && ` +${workout.exercises.length - 3} more`}
                                            </p>
                                            <div className="flex items-center gap-2 pt-1">
                                                <motion.button
                                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                    onClick={() => handleLogToday(workout._id)}
                                                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all flex items-center justify-center gap-1.5"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                                                    </svg>
                                                    Log Today
                                                </motion.button>
                                                <button onClick={() => setEditingWorkout(workout)}
                                                    className="px-3 py-2 rounded-xl border border-amber-500/25 text-amber-400 hover:bg-amber-500/10 text-xs font-semibold transition-all"
                                                >✏️</button>
                                                <button onClick={() => handleDelete(workout._id)}
                                                    className="px-3 py-2 rounded-xl border border-red-500/20 text-red-400/70 hover:bg-red-500/10 hover:text-red-400 text-xs font-semibold transition-all"
                                                >🗑️</button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Edit Modal */}
            {editingWorkout && (
                <EditWorkoutModal
                    workout={editingWorkout}
                    onClose={() => setEditingWorkout(null)}
                    onSave={handleEditSave}
                />
            )}
        </div>
    );
};

export default MyWorkouts;

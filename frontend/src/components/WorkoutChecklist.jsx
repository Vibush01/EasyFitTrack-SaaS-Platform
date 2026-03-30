import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// ── Confetti burst (pure CSS via inline keyframes) ──────────────────
const confettiStyles = `
@keyframes confetti-fall {
    0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(80px) rotate(720deg); opacity: 0; }
}
.confetti-piece {
    position: absolute;
    width: 8px; height: 8px;
    border-radius: 2px;
    animation: confetti-fall 1s ease-out forwards;
}
@keyframes pulse-rest {
    0%,100% { opacity: 1; } 50% { opacity: 0.35; }
}
.rest-pulse { animation: pulse-rest 1.4s ease-in-out 3; }
`;

const CONFETTI_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#ef4444'];

const WorkoutChecklist = ({ plan, onSessionUpdate }) => {
    const [session, setSession] = useState(null);          // persisted session doc
    const [checked, setChecked] = useState([]);            // local Set of completed indices
    const [loading, setLoading] = useState(false);
    const [starting, setStarting] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [lastChecked, setLastChecked] = useState(null);  // index of most-recently checked exercise
    const nextUncheckedRef = useRef(null);

    const totalExercises = plan.exercises?.length ?? 0;
    const doneCount = checked.length;
    const progressPct = totalExercises > 0 ? Math.round((doneCount / totalExercises) * 100) : 0;
    const isComplete = doneCount >= totalExercises && totalExercises > 0;

    // ── Load today's existing session on mount ──────────────────────
    useEffect(() => {
        const fetchSession = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/member/workout-sessions?planId=${plan._id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const sessions = res.data;
                // Find today's session
                const todayStr = new Date().toISOString().split('T')[0];
                const todaySession = sessions.find(
                    (s) => new Date(s.date).toISOString().split('T')[0] === todayStr,
                );
                if (todaySession) {
                    setSession(todaySession);
                    setChecked(todaySession.completedExercises ?? []);
                    if (todaySession.status === 'completed') setShowConfetti(false); // already done
                }
            } catch {
                // silent — member hasn't started yet
            }
        };
        if (plan?._id) fetchSession();
    }, [plan._id]);

    // ── Start a new session ─────────────────────────────────────────
    const handleStart = async () => {
        setStarting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${API_URL}/member/workout-sessions`,
                { planId: plan._id },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            setSession(res.data);
            setChecked(res.data.completedExercises ?? []);
            toast.info('🏋️ Session started! Check off exercises as you go.', { position: 'top-right' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to start session', { position: 'top-right' });
        } finally {
            setStarting(false);
        }
    };

    // ── Toggle an exercise checkbox ─────────────────────────────────
    const handleToggle = useCallback(
        async (index) => {
            if (!session || session.status === 'completed') return;

            const isNowChecked = !checked.includes(index);

            const newChecked = isNowChecked
                ? [...checked, index]
                : checked.filter((i) => i !== index);

            setChecked(newChecked);
            if (isNowChecked) setLastChecked(index);

            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await axios.put(
                    `${API_URL}/member/workout-sessions/${session._id}`,
                    { completedExercises: newChecked },
                    { headers: { Authorization: `Bearer ${token}` } },
                );
                const updatedSession = res.data.session;
                setSession(updatedSession);

                if (res.data.streakLogged) {
                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 2000);
                    toast.success('🏆 Workout complete! Streak updated!', {
                        position: 'top-right',
                        autoClose: 4000,
                    });
                    onSessionUpdate?.();
                }
            } catch (err) {
                // Revert local on error
                setChecked(checked);
                toast.error('Failed to save progress', { position: 'top-right' });
            } finally {
                setLoading(false);
                setTimeout(() => setLastChecked(null), 2500);
            }
        },
        [session, checked, onSessionUpdate],
    );

    // ── Auto-scroll to next unchecked exercise ──────────────────────
    useEffect(() => {
        if (nextUncheckedRef.current) {
            nextUncheckedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [checked]);

    // ── Render ──────────────────────────────────────────────────────
    return (
        <>
            {/* Inject animation keyframes once */}
            <style>{confettiStyles}</style>

            <div className="relative mt-3">
                {/* Session Header */}
                {session ? (
                    <>
                        {/* Progress Bar */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-1.5 text-xs font-semibold">
                                <span className="text-[var(--text-secondary)]">
                                    {doneCount} / {totalExercises} Exercises
                                </span>
                                <span
                                    className={`${
                                        isComplete ? 'text-green-400' : 'text-blue-400'
                                    } tabular-nums`}
                                >
                                    {progressPct}%
                                </span>
                            </div>
                            <div className="h-2 rounded-full bg-[var(--bg-primary)] overflow-hidden">
                                <motion.div
                                    className={`h-full rounded-full ${
                                        isComplete
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                                            : 'bg-gradient-to-r from-blue-600 to-blue-400'
                                    }`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPct}%` }}
                                    transition={{ duration: 0.4, ease: 'easeOut' }}
                                />
                            </div>
                        </div>

                        {/* Completion Banner */}
                        <AnimatePresence>
                            {isComplete && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="relative overflow-hidden mb-4 p-3 rounded-xl bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 text-center"
                                >
                                    {/* Confetti */}
                                    {showConfetti && (
                                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
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
                                    <p className="text-green-400 font-bold text-sm">
                                        💪 Workout Complete! Streak protected.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Exercise Checklist */}
                        <div className="space-y-2">
                            {plan.exercises.map((exercise, idx) => {
                                const isDone = checked.includes(idx);
                                const isNextUnchecked =
                                    !isDone &&
                                    plan.exercises
                                        .slice(0, idx)
                                        .every((_, i) => checked.includes(i));
                                const wasJustChecked = lastChecked === idx;

                                return (
                                    <motion.div
                                        key={idx}
                                        ref={isNextUnchecked ? nextUncheckedRef : null}
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.04, duration: 0.3 }}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 cursor-pointer select-none ${
                                            isDone
                                                ? 'bg-green-500/8 border-green-500/20 opacity-75'
                                                : isNextUnchecked
                                                ? 'bg-blue-500/8 border-blue-500/30 shadow-sm shadow-blue-500/10'
                                                : 'bg-[var(--bg-primary)]/50 border-[var(--border-color)] hover:border-[var(--border-color)]/80'
                                        }`}
                                        onClick={() =>
                                            session.status !== 'completed' && handleToggle(idx)
                                        }
                                    >
                                        {/* Custom Checkbox */}
                                        <motion.div
                                            className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors duration-200 ${
                                                isDone
                                                    ? 'bg-green-500 border-green-500'
                                                    : 'border-[var(--border-color)]'
                                            }`}
                                            whileTap={{ scale: 0.85 }}
                                        >
                                            <AnimatePresence>
                                                {isDone && (
                                                    <motion.svg
                                                        key="check"
                                                        initial={{ scale: 0, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
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

                                        {/* Exercise Info */}
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className={`text-sm font-semibold transition-all duration-200 truncate ${
                                                    isDone
                                                        ? 'line-through text-[var(--text-secondary)]'
                                                        : 'text-[var(--text-primary)]'
                                                }`}
                                            >
                                                {exercise.name}
                                            </p>
                                            {wasJustChecked && !isDone ? null : (
                                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                                    {exercise.sets} sets × {exercise.reps} reps
                                                    {exercise.rest && (
                                                        <span
                                                            className={`ml-2 ${
                                                                wasJustChecked
                                                                    ? 'text-amber-400 rest-pulse'
                                                                    : ''
                                                            }`}
                                                        >
                                                            · Rest: {exercise.rest}
                                                        </span>
                                                    )}
                                                </p>
                                            )}
                                        </div>

                                        {/* Sets/Reps Badge */}
                                        <span
                                            className={`flex-shrink-0 text-xs px-2 py-1 rounded-lg font-bold tabular-nums ${
                                                isDone
                                                    ? 'bg-green-500/10 text-green-400'
                                                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                                            }`}
                                        >
                                            {exercise.sets}×{exercise.reps}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {loading && (
                            <p className="text-xs text-[var(--text-secondary)] mt-2 text-right animate-pulse">
                                Saving…
                            </p>
                        )}
                    </>
                ) : (
                    /* ── No session yet: CTA ── */
                    <div className="space-y-3">
                        {/* Static preview */}
                        <div className="space-y-1.5 opacity-50">
                            {plan.exercises?.slice(0, 3).map((ex, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--border-color)]"
                                >
                                    <div className="w-4 h-4 rounded border-2 border-[var(--border-color)] flex-shrink-0" />
                                    <span className="text-xs text-[var(--text-secondary)] truncate flex-1">
                                        {ex.name}
                                    </span>
                                    <span className="text-xs text-[var(--text-secondary)]">
                                        {ex.sets}×{ex.reps}
                                    </span>
                                </div>
                            ))}
                            {plan.exercises?.length > 3 && (
                                <p className="text-xs text-[var(--text-secondary)] text-center pt-1">
                                    +{plan.exercises.length - 3} more exercises…
                                </p>
                            )}
                        </div>

                        {/* Start Button */}
                        <motion.button
                            onClick={handleStart}
                            disabled={starting}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-600/20 hover:shadow-blue-600/40 transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {starting ? (
                                <>
                                    <svg
                                        className="animate-spin w-4 h-4"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v8H4z"
                                        />
                                    </svg>
                                    Starting…
                                </>
                            ) : (
                                <>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Start Today's Session
                                </>
                            )}
                        </motion.button>
                    </div>
                )}
            </div>
        </>
    );
};

export default WorkoutChecklist;

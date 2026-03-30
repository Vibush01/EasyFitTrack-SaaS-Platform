import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const animStyles = `
@keyframes confetti-fall {
    0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(80px)  rotate(720deg); opacity: 0; }
}
.confetti-piece { position:absolute; width:8px; height:8px; border-radius:2px; animation:confetti-fall 1s ease-out forwards; }
@keyframes pulse-rest { 0%,100% { opacity:1; } 50% { opacity:.35; } }
.rest-pulse { animation: pulse-rest 1.4s ease-in-out 3; }
`;
const CONFETTI_COLORS = ['#f59e0b','#3b82f6','#10b981','#ec4899','#8b5cf6','#ef4444'];

// ── Reusable exercise row ───────────────────────────────────────────────────
const ExRow = ({ ex, idx, isDone, isNext, justChecked, refProp, onClick, disabled }) => (
    <motion.div
        ref={refProp}
        layout
        initial={{ opacity:0, x:-8 }}
        animate={{ opacity:1, x:0 }}
        transition={{ delay: idx * 0.04 }}
        onClick={disabled ? undefined : onClick}
        className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
            disabled ? 'cursor-default' : 'cursor-pointer select-none'
        } ${
            isDone  ? 'bg-green-500/8 border-green-500/20 opacity-70'
            : isNext? 'bg-indigo-500/8 border-indigo-500/30 shadow-sm shadow-indigo-500/10'
            : 'bg-[var(--bg-primary)]/50 border-[var(--border-color)] hover:border-indigo-500/30'
        }`}
    >
        <motion.div whileTap={disabled ? {} : { scale:0.85 }}
            className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors duration-200 ${
                isDone ? 'bg-green-500 border-green-500' : 'border-[var(--border-color)]'
            }`}
        >
            <AnimatePresence>
                {isDone && (
                    <motion.svg key="chk" initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }} transition={{ duration:.18 }}
                        xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor"
                    >
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </motion.svg>
                )}
            </AnimatePresence>
        </motion.div>
        <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate transition-all duration-200 ${isDone ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>{ex.name}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {ex.sets} sets × {ex.reps} reps
                {ex.rest && <span className={`ml-2 ${justChecked ? 'text-amber-400 rest-pulse' : ''}`}>· Rest: {ex.rest}</span>}
            </p>
        </div>
        <span className={`flex-shrink-0 text-xs px-2 py-1 rounded-lg font-bold ${isDone ? 'bg-green-500/10 text-green-400' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
            {ex.sets}×{ex.reps}
        </span>
    </motion.div>
);

// ── DailyLogChecklist ──────────────────────────────────────────────────────
const DailyLogChecklist = ({ log, onUpdate, onRemove }) => {
    const [checked, setChecked] = useState(log.completedExercises ?? []);
    const [saving, setSaving]   = useState(false);
    const [confetti, setConfetti] = useState(false);
    const [lastIdx, setLastIdx]   = useState(null);
    const [open, setOpen]         = useState(true);
    const nextRef = useRef(null);

    const total = log.exercises.length;
    const done  = checked.length;
    const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
    const isComplete = done >= total && total > 0;

    useEffect(() => {
        if (nextRef.current) nextRef.current.scrollIntoView({ behavior:'smooth', block:'nearest' });
    }, [checked]);

    const handleToggle = useCallback(async (idx) => {
        if (log.status === 'completed') return;
        const nowChecked = !checked.includes(idx);
        const newChecked = nowChecked ? [...checked, idx] : checked.filter(i => i !== idx);
        setChecked(newChecked);
        if (nowChecked) setLastIdx(idx);
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(
                `${API_URL}/member/daily-logs/${log._id}`,
                { completedExercises: newChecked },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            if (res.data.streakLogged) {
                setConfetti(true);
                setTimeout(() => setConfetti(false), 2000);
                toast.success('🏆 Workout complete! Streak updated!', { autoClose: 4000, position: 'top-right' });
            }
            onUpdate(res.data.log);
        } catch {
            setChecked(checked);
            toast.error('Failed to save progress', { position: 'top-right' });
        } finally {
            setSaving(false);
            setTimeout(() => setLastIdx(null), 2500);
        }
    }, [log, checked, onUpdate]);

    const badge = log.sourceType === 'trainer_plan'
        ? { label: 'Trainer Plan', cls: 'bg-blue-500/10 text-blue-400' }
        : { label: 'My Template',  cls: 'bg-purple-500/10 text-purple-400' };

    return (
        <motion.div layout className={`bg-[var(--bg-card)]/80 backdrop-blur-md rounded-2xl border overflow-hidden transition-colors duration-300 ${
            isComplete ? 'border-green-500/30' : 'border-[var(--border-color)]'
        }`}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer" onClick={() => setOpen(o => !o)}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                        isComplete ? 'bg-green-500/15 text-green-400' : 'bg-indigo-500/15 text-indigo-400'
                    }`}>
                        {isComplete
                            ? <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                            : <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[var(--text-primary)] font-bold text-sm truncate">{log.title}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badge.cls}`}>{badge.label}</span>
                            <span className="text-xs text-[var(--text-secondary)]">{done}/{total} done</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className={`text-sm font-bold tabular-nums ${isComplete ? 'text-green-400' : 'text-indigo-400'}`}>{pct}%</span>
                    <svg className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd"/>
                    </svg>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-[var(--bg-primary)]">
                <motion.div className={`h-full ${isComplete ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-indigo-600 to-indigo-400'}`}
                    initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:.4, ease:'easeOut' }}
                />
            </div>

            {/* Body */}
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:.22 }} className="overflow-hidden">
                        <div className="px-5 pb-5 pt-3 space-y-2">
                            <AnimatePresence>
                                {isComplete && (
                                    <motion.div initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                                        className="relative overflow-hidden p-3 rounded-xl bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 text-center mb-2"
                                    >
                                        {confetti && (
                                            <div className="absolute inset-0 pointer-events-none flex justify-center">
                                                {CONFETTI_COLORS.map((c,i) => <span key={i} className="confetti-piece" style={{ backgroundColor:c, left:`${10+i*14}%`, animationDelay:`${i*.08}s` }}/>)}
                                            </div>
                                        )}
                                        <p className="text-green-400 font-bold text-sm">💪 Done! Great work.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {log.exercises.map((ex, idx) => {
                                const isDone = checked.includes(idx);
                                const isNext = !isDone && log.exercises.slice(0,idx).every((_,i) => checked.includes(i));
                                return (
                                    <ExRow key={idx} ex={ex} idx={idx} isDone={isDone} isNext={isNext}
                                        justChecked={lastIdx === idx} refProp={isNext ? nextRef : null}
                                        onClick={() => handleToggle(idx)} disabled={isComplete}
                                    />
                                );
                            })}

                            <div className="flex items-center justify-between pt-1">
                                {saving && <span className="text-xs text-[var(--text-secondary)] animate-pulse">Saving…</span>}
                                {!isComplete && (
                                    <button onClick={() => onRemove(log._id)}
                                        className="ml-auto text-xs text-red-400/50 hover:text-red-400 transition-colors flex items-center gap-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                                        </svg>
                                        Remove from today
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ── Workout Picker Modal ────────────────────────────────────────────────────
const WorkoutPickerModal = ({ onClose, onAdd, todayLogs }) => {
    const [tab, setTab]             = useState('templates');
    const [templates, setTemplates] = useState([]);
    const [trainerPlans, setTrainerPlans] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [addingId, setAddingId]   = useState(null);

    const todaySourceIds = todayLogs.map(l => (l.sourcePlanId || l.sourceTemplateId)?.toString()).filter(Boolean);

    useEffect(() => {
        const load = async () => {
            try {
                const token = localStorage.getItem('token');
                const [tRes, pRes] = await Promise.all([
                    axios.get(`${API_URL}/member/workout-templates`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/trainer/member/workout-plans`, { headers: { Authorization: `Bearer ${token}` } }),
                ]);
                setTemplates(tRes.data);
                setTrainerPlans(pRes.data.data || pRes.data);
            } catch {
                toast.error('Failed to load plans', { position: 'top-right' });
            } finally { setLoading(false); }
        };
        load();
    }, []);

    const handleAdd = async (sourceType, id) => {
        setAddingId(id);
        try {
            const body = sourceType === 'trainer_plan'
                ? { sourceType, sourcePlanId: id }
                : { sourceType, sourceTemplateId: id };
            await onAdd(body);
            onClose();
        } finally { setAddingId(null); }
    };

    const tabBtn = (key, label) => (
        <button onClick={() => setTab(key)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                tab === key ? 'bg-indigo-600 text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
        >{label}</button>
    );

    const items = tab === 'templates' ? templates : trainerPlans;

    return (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:40 }}
                transition={{ duration:.25, ease:'easeOut' }} onClick={e => e.stopPropagation()}
                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl shadow-2xl w-full max-w-md max-h-[75vh] flex flex-col"
            >
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">Add Today's Workout</h2>
                    <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 px-6 p-1 bg-[var(--bg-secondary)]/50 mx-6 rounded-xl mb-4">
                    {tabBtn('templates', '🏋️ My Templates')}
                    {tabBtn('trainer', '📋 Trainer Plans')}
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1 px-6 pb-6 space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <svg className="animate-spin w-7 h-7 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                            </svg>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-10 text-[var(--text-secondary)]">
                            <p className="text-3xl mb-2">{tab === 'templates' ? '📝' : '📋'}</p>
                            <p className="text-sm">{tab === 'templates' ? 'No templates yet. Create one in My Workouts.' : 'No trainer plans assigned yet.'}</p>
                        </div>
                    ) : items.map(item => {
                        const id = item._id.toString();
                        const alreadyAdded = todaySourceIds.includes(id);
                        const isAdding = addingId === id;
                        const exerciseCount = item.exercises?.length ?? 0;
                        const sourceType = tab === 'templates' ? 'custom_template' : 'trainer_plan';
                        return (
                            <div key={id} className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${
                                alreadyAdded ? 'bg-green-500/5 border-green-500/20 opacity-70' : 'bg-[var(--bg-secondary)]/50 border-[var(--border-color)] hover:border-indigo-500/30'
                            }`}>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[var(--text-primary)] font-semibold text-sm truncate">{item.title}</p>
                                    <p className="text-[var(--text-secondary)] text-xs mt-0.5">{exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}</p>
                                </div>
                                {alreadyAdded ? (
                                    <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                        </svg>
                                        Added
                                    </span>
                                ) : (
                                    <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:.95 }}
                                        onClick={() => handleAdd(sourceType, id)}
                                        disabled={!!isAdding}
                                        className="flex-shrink-0 px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors shadow-sm disabled:opacity-60"
                                    >
                                        {isAdding ? '…' : '+ Add'}
                                    </motion.button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </motion.div>
    );
};

// ── History View ────────────────────────────────────────────────────────────
const HistoryView = ({ logs, loading }) => {
    if (loading) return (
        <div className="flex justify-center py-16">
            <svg className="animate-spin w-8 h-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
        </div>
    );
    if (logs.length === 0) return (
        <div className="text-center py-16">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-[var(--text-primary)] font-semibold">No history yet</p>
            <p className="text-[var(--text-secondary)] text-sm mt-1">Complete workouts and they'll appear here</p>
        </div>
    );

    // Group by date
    const grouped = logs.reduce((acc, log) => {
        const d = new Date(log.date).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
        (acc[d] = acc[d] || []).push(log);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {Object.entries(grouped).map(([date, dayLogs]) => (
                <div key={date}>
                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 px-1">{date}</p>
                    <div className="space-y-2">
                        {dayLogs.map(log => (
                            <div key={log._id} className="flex items-center gap-3 p-4 bg-[var(--bg-card)]/80 backdrop-blur-md rounded-xl border border-[var(--border-color)]">
                                <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[var(--text-primary)] font-semibold text-sm truncate">{log.title}</p>
                                    <p className="text-[var(--text-secondary)] text-xs">{log.exercises.length} exercises · {log.sourceType === 'trainer_plan' ? 'Trainer Plan' : 'My Template'}</p>
                                </div>
                                <span className="text-xs text-green-400 font-semibold">✓ Done</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// ── Main TodayWorkout Page ──────────────────────────────────────────────────
const TodayWorkout = () => {
    const { user } = useContext(AuthContext);
    const [todayLogs, setTodayLogs]   = useState([]);
    const [loading, setLoading]       = useState(true);
    const [showPicker, setShowPicker] = useState(false);
    const [mainTab, setMainTab]       = useState('today');
    const [history, setHistory]       = useState([]);
    const [histLoading, setHistLoading] = useState(false);

    const activeLogs    = todayLogs.filter(l => l.status === 'in_progress');
    const completedLogs = todayLogs.filter(l => l.status === 'completed');

    const todayStr = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });

    // Fetch today's logs — runs on every mount so navigation away + back reloads data
    useEffect(() => {
        if (user?.role !== 'member') return;
        setLoading(true);
        const fetchToday = async () => {
            try {
                const token = localStorage.getItem('token');
                const d = new Date().toISOString().split('T')[0];
                const res = await axios.get(`${API_URL}/member/daily-logs?date=${d}`, { headers: { Authorization: `Bearer ${token}` } });
                setTodayLogs(res.data);
            } catch { toast.error('Failed to load today\'s workouts', { position: 'top-right' }); }
            finally { setLoading(false); }
        };
        fetchToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load history when tab switches
    const loadHistory = useCallback(async () => {
        setHistLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/member/daily-logs/history`, { headers: { Authorization: `Bearer ${token}` } });
            setHistory(res.data);
        } catch { toast.error('Failed to load history', { position: 'top-right' }); }
        finally { setHistLoading(false); }
    }, []);

    useEffect(() => { if (mainTab === 'history' && history.length === 0) loadHistory(); }, [mainTab]);

    // Add a plan to today
    const handleAdd = useCallback(async (body) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/member/daily-logs`, body, { headers: { Authorization: `Bearer ${token}` } });
            // Add if new, or replace if already present (idempotent)
            setTodayLogs(prev => {
                const exists = prev.find(l => l._id === res.data._id);
                if (exists) return prev;
                return [...prev, res.data];
            });
            toast.success(`✅ ${res.data.title} added! Go crush it.`, { position: 'top-right' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add workout', { position: 'top-right' });
        }
    }, []);

    // Update a log in state
    const handleUpdate = useCallback((updated) => {
        setTodayLogs(prev => prev.map(l => l._id === updated._id ? updated : l));
    }, []);

    // Remove a log
    const handleRemove = useCallback(async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/member/daily-logs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            setTodayLogs(prev => prev.filter(l => l._id !== id));
            toast.success('Removed from today', { position: 'top-right' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to remove', { position: 'top-right' });
        }
    }, []);

    if (user?.role !== 'member') return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
            <p className="text-red-500 font-semibold">Access denied. Members only.</p>
        </div>
    );

    const fadeIn = { hidden:{ opacity:0, y:20 }, visible:{ opacity:1, y:0, transition:{ duration:.45, ease:'easeOut' } } };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-10 px-4 sm:px-6 relative overflow-hidden">
            <style>{animStyles}</style>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-5 fixed pointer-events-none"/>
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)]/95 to-[var(--bg-primary)] fixed pointer-events-none"/>

            <div className="container mx-auto max-w-2xl relative z-10">
                {/* Page header */}
                <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mb-8 text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">Today's Workout</h1>
                    <p className="text-[var(--text-secondary)] mt-1 text-sm">{todayStr}</p>
                </motion.div>

                {/* Tab bar */}
                <motion.div initial="hidden" animate="visible" variants={fadeIn}
                    className="flex gap-1 p-1 bg-[var(--bg-card)]/80 backdrop-blur-md rounded-2xl border border-[var(--border-color)] mb-6"
                >
                    {[['today','🏋️ Today'],['history','📅 History']].map(([key, label]) => (
                        <button key={key} onClick={() => setMainTab(key)}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                                mainTab === key ? 'bg-indigo-600 text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >{label}</button>
                    ))}
                </motion.div>

                {/* Today tab */}
                {mainTab === 'today' && (
                    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-4">
                        {/* Active checklists */}
                        <AnimatePresence>
                            {activeLogs.map(log => (
                                <DailyLogChecklist key={log._id} log={log} onUpdate={handleUpdate} onRemove={handleRemove}/>
                            ))}
                        </AnimatePresence>

                        {/* Add workout button */}
                        <motion.button
                            id="add-today-workout-btn"
                            onClick={() => setShowPicker(true)}
                            whileHover={{ scale:1.01 }} whileTap={{ scale:.98 }}
                            className="w-full py-3.5 rounded-2xl border-2 border-dashed border-indigo-500/30 text-indigo-400 font-semibold text-sm hover:border-indigo-500/60 hover:bg-indigo-500/5 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                            </svg>
                            {activeLogs.length === 0 ? "What are you training today?" : "Add another workout"}
                        </motion.button>

                        {/* Empty state */}
                        {!loading && activeLogs.length === 0 && completedLogs.length === 0 && (
                            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                                className="text-center py-10 bg-[var(--bg-card)]/80 backdrop-blur-md rounded-2xl border border-dashed border-[var(--border-color)]"
                            >
                                <p className="text-5xl mb-3">🏋️</p>
                                <p className="text-[var(--text-primary)] font-bold text-lg">No workout planned yet</p>
                                <p className="text-[var(--text-secondary)] text-sm mt-1">Pick from your templates or trainer plans above</p>
                            </motion.div>
                        )}

                        {/* Loading skeleton */}
                        {loading && (
                            <div className="space-y-3">
                                {[1,2].map(i => <div key={i} className="h-20 rounded-2xl bg-[var(--bg-card)]/60 animate-pulse"/>)}
                            </div>
                        )}

                        {/* Completed section */}
                        {completedLogs.length > 0 && (
                            <div className="mt-4">
                                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                    </svg>
                                    Completed Today ({completedLogs.length})
                                </p>
                                <div className="space-y-2">
                                    {completedLogs.map(log => (
                                        <DailyLogChecklist key={log._id} log={log} onUpdate={handleUpdate} onRemove={handleRemove}/>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* History tab */}
                {mainTab === 'history' && (
                    <motion.div initial="hidden" animate="visible" variants={fadeIn}>
                        <HistoryView logs={history} loading={histLoading}/>
                    </motion.div>
                )}
            </div>

            {/* Picker modal */}
            <AnimatePresence>
                {showPicker && (
                    <WorkoutPickerModal onClose={() => setShowPicker(false)} onAdd={handleAdd} todayLogs={todayLogs}/>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TodayWorkout;

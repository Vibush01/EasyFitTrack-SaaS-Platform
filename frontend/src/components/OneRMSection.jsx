import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
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
    Filler,
} from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// ── Constants ────────────────────────────────────────────────
const CORE_LIFTS = [
    { key: 'squat',    label: 'Squat',    emoji: '🏋️', color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  gradient: ['rgba(239,68,68,0.25)', 'rgba(239,68,68,0.02)'] },
    { key: 'bench',    label: 'Bench',    emoji: '💪', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  gradient: ['rgba(59,130,246,0.25)', 'rgba(59,130,246,0.02)'] },
    { key: 'deadlift', label: 'Deadlift', emoji: '🔩', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', gradient: ['rgba(245,158,11,0.25)', 'rgba(245,158,11,0.02)'] },
    { key: 'ohp',      label: 'OHP',      emoji: '🙌', color: '#10b981', bg: 'rgba(16,185,129,0.08)', gradient: ['rgba(16,185,129,0.25)', 'rgba(16,185,129,0.02)'] },
];
const RANGES = [
    { key: '1m',  label: '1M',  days: 30 },
    { key: '3m',  label: '3M',  days: 90 },
    { key: '6m',  label: '6M',  days: 180 },
    { key: 'all', label: 'All', days: Infinity },
];

// ── Epley formula: est 1RM = w × (1 + r/30) ─────────────────
const epley = (w, r) => (r <= 0 || w <= 0) ? 0 : Math.round(w * (1 + r / 30));

// ── PR Badge plugin for Chart.js ─────────────────────────────
const prBadgePlugin = {
    id: 'prBadge',
    afterDatasetsDraw(chart) {
        const { ctx } = chart;
        chart.data.datasets.forEach((ds, dsIdx) => {
            if (!ds._prIndex && ds._prIndex !== 0) return;
            const meta = chart.getDatasetMeta(dsIdx);
            const point = meta.data[ds._prIndex];
            if (!point) return;
            const x = point.x;
            const y = point.y;
            ctx.save();
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.fillStyle = ds.borderColor;
            ctx.textAlign = 'center';
            ctx.fillText('🏆 PR', x, y - 14);
            ctx.restore();
        });
    },
};

// ── Main Component ───────────────────────────────────────────
const OneRMSection = ({ chartColors, theme, onLogComplete }) => {
    // Data state
    const [series, setSeries]   = useState({});
    const [prs, setPrs]         = useState({});
    const [loading, setLoading] = useState(true);
    const [range, setRange]     = useState('all');

    // Form state
    const [selLift, setSelLift]       = useState('squat');
    const [customName, setCustomName] = useState('');
    const [weight1RM, setWeight1RM]   = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Epley calculator
    const [showCalc, setShowCalc]   = useState(false);
    const [calcWeight, setCalcWeight] = useState('');
    const [calcReps, setCalcReps]     = useState('');
    const estimated1RM = useMemo(() => epley(+calcWeight, +calcReps), [calcWeight, calcReps]);

    const chartRef = useRef(null);

    // ── Fetch 1RM data ───────────────────────────────────────
    const fetchData = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/member/1rm`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSeries(res.data.series || {});
            setPrs(res.data.prs || {});
        } catch {
            // silent — chart just stays empty
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Submit a new 1RM entry ───────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        const w = parseFloat(weight1RM);
        if (!w || w <= 0) return toast.error('Enter a valid weight', { position: 'top-right' });
        if (selLift === 'custom' && !customName.trim()) return toast.error('Name your custom lift', { position: 'top-right' });

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const lift = {
                exercise: selLift,
                customName: selLift === 'custom' ? customName.trim() : '',
                weight1RM: w,
            };
            await axios.post(
                `${API_URL}/member/progress`,
                { lifts: JSON.stringify([lift]) },
                { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } },
            );
            toast.success('💪 1RM logged!', { position: 'top-right' });
            setWeight1RM('');
            setCalcWeight('');
            setCalcReps('');
            fetchData();
            onLogComplete?.();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to log', { position: 'top-right' });
        } finally {
            setSubmitting(false);
        }
    };

    // ── Filter data by time range ────────────────────────────
    const filteredSeries = useMemo(() => {
        if (range === 'all') return series;
        const cutoff = new Date();
        const rd = RANGES.find(r => r.key === range);
        cutoff.setDate(cutoff.getDate() - (rd?.days || 365));
        const result = {};
        for (const [key, entries] of Object.entries(series)) {
            result[key] = entries.filter(e => new Date(e.date) >= cutoff);
        }
        return result;
    }, [series, range]);

    // ── Build chart data ─────────────────────────────────────
    const chartData = useMemo(() => {
        // Gather all unique dates across all lifts
        const allDates = new Set();
        for (const entries of Object.values(filteredSeries)) {
            for (const e of entries) {
                allDates.add(new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            }
        }
        const labels = [...allDates];

        const datasets = CORE_LIFTS
            .filter(lift => filteredSeries[lift.key]?.length)
            .map(lift => {
                const entries = filteredSeries[lift.key] || [];
                // Determine PR point index
                let prIdx = -1;
                let maxW = -1;
                const data = entries.map((e, i) => {
                    if (e.weight1RM > maxW) { maxW = e.weight1RM; prIdx = i; }
                    return e.weight1RM;
                });
                const entryLabels = entries.map(e =>
                    new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                );

                return {
                    label: `${lift.emoji} ${lift.label}`,
                    data,
                    labels: entryLabels,
                    borderColor: lift.color,
                    backgroundColor: (ctx) => {
                        if (!ctx.chart.chartArea) return lift.gradient[0];
                        const gradient = ctx.chart.ctx.createLinearGradient(0, ctx.chart.chartArea.top, 0, ctx.chart.chartArea.bottom);
                        gradient.addColorStop(0, lift.gradient[0]);
                        gradient.addColorStop(1, lift.gradient[1]);
                        return gradient;
                    },
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2.5,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    pointBackgroundColor: lift.color,
                    pointBorderColor: 'transparent',
                    _prIndex: prIdx,
                };
            });

        // Use the longest label set
        const longestLabels = datasets.reduce((a, ds) => (ds.labels?.length > a.length ? ds.labels : a), []);

        return { labels: longestLabels, datasets };
    }, [filteredSeries]);

    // ── Chart options ────────────────────────────────────────
    const chartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: chartColors.secondaryTextColor,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 16,
                    font: { size: 12, weight: '600', family: 'Inter, sans-serif' },
                },
            },
            title: { display: false },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.85)',
                titleFont: { size: 13, weight: '700', family: 'Inter, sans-serif' },
                bodyFont: { size: 12, family: 'Inter, sans-serif' },
                padding: 12,
                cornerRadius: 10,
                displayColors: true,
                callbacks: {
                    label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} kg`,
                },
            },
        },
        scales: {
            y: {
                grid: { color: chartColors.gridColor, lineWidth: 0.6 },
                ticks: { color: chartColors.secondaryTextColor, font: { size: 11 } },
                title: { display: true, text: 'Weight (kg)', color: chartColors.secondaryTextColor, font: { size: 11 } },
            },
            x: {
                grid: { display: false },
                ticks: { color: chartColors.secondaryTextColor, font: { size: 11 }, maxRotation: 45 },
            },
        },
    }), [chartColors]);

    // ── Helper: find lift meta ────────────────────────────────
    const liftMeta = (key) => CORE_LIFTS.find(l => l.key === key) || { label: key, emoji: '🏋️', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' };

    // ── Animation variants ───────────────────────────────────
    const fadeIn = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

    const hasData = Object.values(filteredSeries).some(arr => arr.length > 0);

    return (
        <div className="space-y-6">
            {/* ── PR Summary Strip ──────────────────────────────── */}
            {Object.keys(prs).length > 0 && (
                <motion.div initial="hidden" animate="visible" variants={fadeIn}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                >
                    {CORE_LIFTS.map(lift => {
                        const pr = prs[lift.key];
                        if (!pr) return (
                            <div key={lift.key} className="bg-[var(--bg-card)]/80 backdrop-blur-md rounded-2xl border border-[var(--border-color)] p-4 text-center opacity-40">
                                <p className="text-2xl">{lift.emoji}</p>
                                <p className="text-xs text-[var(--text-secondary)] font-semibold mt-1">{lift.label}</p>
                                <p className="text-sm text-[var(--text-secondary)] mt-0.5">—</p>
                            </div>
                        );
                        return (
                            <motion.div key={lift.key} whileHover={{ scale: 1.03 }}
                                className="bg-[var(--bg-card)]/80 backdrop-blur-md rounded-2xl border border-[var(--border-color)] p-4 text-center"
                                style={{ borderColor: `${lift.color}25` }}
                            >
                                <p className="text-2xl">{lift.emoji}</p>
                                <p className="text-xs text-[var(--text-secondary)] font-semibold mt-1">{lift.label}</p>
                                <p className="text-xl font-bold mt-0.5" style={{ color: lift.color }}>{pr.weight1RM} kg</p>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                    {new Date(pr.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* ── Chart ─────────────────────────────────────────── */}
            <motion.div initial="hidden" animate="visible" variants={fadeIn}
                className="bg-[var(--bg-card)]/80 backdrop-blur-md rounded-3xl border border-[var(--border-color)] shadow-xl overflow-hidden"
            >
                {/* Chart header with range pills */}
                <div className="flex items-center justify-between px-6 pt-6 pb-2">
                    <h3 className="text-[var(--text-primary)] font-bold text-lg flex items-center gap-2">
                        <span className="bg-indigo-600 w-1.5 h-7 rounded-full" />
                        1RM Over Time
                    </h3>
                    <div className="flex gap-1 p-0.5 bg-[var(--bg-secondary)]/50 rounded-lg">
                        {RANGES.map(r => (
                            <button key={r.key} onClick={() => setRange(r.key)}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all duration-200 ${
                                    range === r.key
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                            >{r.label}</button>
                        ))}
                    </div>
                </div>

                <div className="px-6 pb-6 pt-2">
                    {loading ? (
                        <div className="h-72 flex items-center justify-center">
                            <svg className="animate-spin w-8 h-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                            </svg>
                        </div>
                    ) : !hasData ? (
                        <div className="h-72 flex flex-col items-center justify-center text-center">
                            <p className="text-4xl mb-3">📈</p>
                            <p className="text-[var(--text-primary)] font-semibold">No strength data yet</p>
                            <p className="text-[var(--text-secondary)] text-sm mt-1">Log your first lift below to see your progress chart</p>
                        </div>
                    ) : (
                        <div className="h-72">
                            <Line ref={chartRef} key={theme} data={chartData} options={chartOptions} plugins={[prBadgePlugin]} />
                        </div>
                    )}
                </div>
            </motion.div>

            {/* ── Log 1RM Form ──────────────────────────────────── */}
            <motion.div initial="hidden" animate="visible" variants={fadeIn}
                className="bg-[var(--bg-card)]/80 backdrop-blur-md rounded-3xl border border-[var(--border-color)] shadow-xl p-6"
            >
                <h3 className="text-[var(--text-primary)] font-bold text-lg flex items-center gap-2 mb-5">
                    <span className="bg-green-600 w-1.5 h-7 rounded-full" />
                    Log a Lift
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Lift selector pills */}
                    <div>
                        <label className="block text-[var(--text-secondary)] text-xs font-semibold mb-2 uppercase tracking-wider">Exercise</label>
                        <div className="flex flex-wrap gap-2">
                            {[...CORE_LIFTS, { key: 'custom', label: 'Custom', emoji: '✏️', color: '#8b5cf6' }].map(lift => (
                                <button key={lift.key} type="button" onClick={() => setSelLift(lift.key)}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                                        selLift === lift.key
                                            ? 'text-white shadow-md'
                                            : 'text-[var(--text-secondary)] border-[var(--border-color)] hover:border-indigo-500/30 bg-transparent'
                                    }`}
                                    style={selLift === lift.key ? { backgroundColor: lift.color, borderColor: lift.color } : {}}
                                >
                                    {lift.emoji} {lift.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom name field */}
                    <AnimatePresence>
                        {selLift === 'custom' && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <label className="block text-[var(--text-secondary)] text-xs font-semibold mb-2 uppercase tracking-wider">Lift Name</label>
                                <input type="text" value={customName} onChange={e => setCustomName(e.target.value)}
                                    placeholder="e.g. Barbell Row, Leg Press…"
                                    className="w-full p-3 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Weight input */}
                    <div>
                        <label className="block text-[var(--text-secondary)] text-xs font-semibold mb-2 uppercase tracking-wider">
                            1RM Weight (kg)
                        </label>
                        <div className="flex items-center gap-3">
                            <input type="number" value={weight1RM} onChange={e => setWeight1RM(e.target.value)}
                                placeholder="e.g. 120" min="0" step="0.5"
                                className="flex-1 p-3 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg font-semibold tabular-nums"
                            />
                            <button type="button" onClick={() => setShowCalc(v => !v)}
                                className={`px-4 py-3 rounded-xl border text-xs font-bold transition-all duration-200 ${
                                    showCalc
                                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                        : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-amber-500/30 hover:text-amber-400'
                                }`}
                            >
                                🧮 Calc
                            </button>
                        </div>
                    </div>

                    {/* Epley calculator panel */}
                    <AnimatePresence>
                        {showCalc && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-amber-400 text-sm font-bold">🧮 Epley 1RM Calculator</span>
                                        <span className="text-xs text-[var(--text-secondary)]">1RM = weight × (1 + reps ÷ 30)</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-[var(--text-secondary)] font-medium mb-1 block">Weight lifted (kg)</label>
                                            <input type="number" value={calcWeight} onChange={e => setCalcWeight(e.target.value)}
                                                placeholder="100" min="0" step="0.5"
                                                className="w-full p-2.5 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-[var(--text-secondary)] font-medium mb-1 block">Reps performed</label>
                                            <input type="number" value={calcReps} onChange={e => setCalcReps(e.target.value)}
                                                placeholder="5" min="1" max="30"
                                                className="w-full p-2.5 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                    {estimated1RM > 0 && (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                            className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl"
                                        >
                                            <span className="text-amber-400 font-semibold text-sm">Estimated 1RM:</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-amber-300 font-bold text-xl tabular-nums">{estimated1RM} kg</span>
                                                <button type="button"
                                                    onClick={() => { setWeight1RM(String(estimated1RM)); setShowCalc(false); }}
                                                    className="px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-400 transition-colors shadow-sm"
                                                >
                                                    Use this ↑
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit */}
                    <motion.button type="submit" disabled={submitting}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Saving…' : `Log ${liftMeta(selLift).emoji} ${selLift === 'custom' ? (customName || 'Custom') : liftMeta(selLift).label} 1RM`}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default OneRMSection;

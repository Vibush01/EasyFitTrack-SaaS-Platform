import { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const GymList = () => {
    const { user } = useContext(AuthContext);

    // ─── State ──────────────────────────────────────────
    const [gyms, setGyms] = useState([]);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [search, setSearch] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [hiringFilter, setHiringFilter] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [total, setTotal] = useState(0);

    const isTrainer = user?.role === 'trainer';

    // ─── Debounce search ────────────────────────────────
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    // ─── Fetch Gyms ─────────────────────────────────────
    const fetchGyms = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (debouncedSearch) params.set('search', debouncedSearch);
            if (selectedCity) params.set('city', selectedCity);
            if (hiringFilter) params.set('hiringStatus', hiringFilter);
            params.set('limit', '50');

            const res = await axios.get(`${API_URL}/gym/browse?${params.toString()}`);
            setGyms(res.data.gyms || []);
            setCities(res.data.cities || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            setError('Failed to fetch gyms');
            toast.error('Failed to fetch gyms', { position: 'top-right' });
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, selectedCity, hiringFilter]);

    useEffect(() => {
        fetchGyms();
    }, [fetchGyms]);

    // ─── Helpers ────────────────────────────────────────
    const clearFilters = () => {
        setSearch('');
        setSelectedCity('');
        setHiringFilter('');
    };

    const hasActiveFilters = search || selectedCity || hiringFilter;

    const getHiringBadge = (status) => {
        if (status === 'hiring') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Hiring Trainers
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Not Hiring
            </span>
        );
    };

    const getPriceRange = (plans) => {
        if (!plans || plans.length === 0) return null;
        const prices = plans.map(p => p.price).filter(Boolean);
        if (prices.length === 0) return null;
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        if (min === max) return `₹${min.toLocaleString()}`;
        return `₹${min.toLocaleString()} – ₹${max.toLocaleString()}`;
    };

    // ─── Animations ─────────────────────────────────────
    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    };

    const stagger = {
        visible: { transition: { staggerChildren: 0.08 } },
    };

    const cardVariant = {
        hidden: { opacity: 0, y: 30, scale: 0.97 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
    };

    // ─── Access Check ───────────────────────────────────
    if (user?.role !== 'member' && user?.role !== 'trainer') {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
                <p className="text-red-500 text-lg font-semibold text-center">
                    Access denied. This page is only for Members and Trainers.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-6 sm:py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="container mx-auto max-w-7xl">

                {/* ── Header ── */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="text-center mb-8 sm:mb-10"
                >
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
                        Find a Gym
                    </h1>
                    <p className="text-[var(--text-secondary)] text-sm sm:text-base max-w-lg mx-auto">
                        {isTrainer
                            ? 'Discover gyms looking for trainers and send your application'
                            : 'Browse gyms near you and join the one that fits your goals'}
                    </p>
                </motion.div>

                {/* ── Search & Filters Bar ── */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="bg-[var(--bg-card)] p-4 sm:p-5 rounded-2xl shadow-lg border border-[var(--border-color)] mb-6 sm:mb-8"
                >
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by gym name..."
                                className="w-full pl-11 pr-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>

                        {/* City Filter */}
                        <div className="relative sm:w-48">
                            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <select
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                                className="w-full pl-10 pr-8 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all"
                            >
                                <option value="">All Cities</option>
                                {cities.map((city) => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>

                        {/* Hiring Status Filter (trainers only) */}
                        {isTrainer && (
                            <div className="relative sm:w-44">
                                <select
                                    value={hiringFilter}
                                    onChange={(e) => setHiringFilter(e.target.value)}
                                    className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all"
                                >
                                    <option value="">All Status</option>
                                    <option value="hiring">🟢 Hiring</option>
                                    <option value="not_hiring">🔴 Not Hiring</option>
                                </select>
                                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Active Filters & Count */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-color)]">
                        <p className="text-[var(--text-secondary)] text-xs sm:text-sm">
                            {loading ? 'Searching...' : (
                                <>
                                    <span className="font-semibold text-[var(--text-primary)]">{total}</span> gym{total !== 1 ? 's' : ''} found
                                    {hasActiveFilters && <span className="text-blue-400"> (filtered)</span>}
                                </>
                            )}
                        </p>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* ── Gym Grid ── */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-[var(--text-secondary)] text-sm">Finding gyms...</p>
                    </div>
                ) : gyms.length === 0 ? (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                        className="flex flex-col items-center justify-center py-20"
                    >
                        <div className="w-20 h-20 bg-[var(--bg-card)] rounded-full flex items-center justify-center mb-4 border border-[var(--border-color)]">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <p className="text-[var(--text-primary)] font-bold text-lg mb-1">No gyms found</p>
                        <p className="text-[var(--text-secondary)] text-sm mb-4">Try adjusting your search or filters</p>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                            >
                                Clear Filters
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={stagger}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
                    >
                        {gyms.map((gym) => {
                            const displayImage = gym.primaryImage || (gym.photos && gym.photos.length > 0 ? gym.photos[0] : null);
                            const priceRange = getPriceRange(gym.membershipPlans);

                            return (
                                <motion.div
                                    key={gym._id}
                                    variants={cardVariant}
                                    className="bg-[var(--bg-card)] rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-[var(--border-color)] flex flex-col h-full overflow-hidden group"
                                >
                                    {/* Image */}
                                    <div className="relative aspect-video w-full overflow-hidden bg-[var(--bg-secondary)]">
                                        {displayImage ? (
                                            <img
                                                src={displayImage}
                                                alt={gym.gymName}
                                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)]">
                                                <svg className="h-14 w-14 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                            </div>
                                        )}

                                        {/* Hiring Badge (overlay on image) */}
                                        {isTrainer && (
                                            <div className="absolute top-3 right-3">
                                                {getHiringBadge(gym.hiringStatus || 'hiring')}
                                            </div>
                                        )}

                                        {/* Gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>

                                    {/* Content */}
                                    <div className="p-4 sm:p-5 flex flex-col flex-1">
                                        <div className="flex-1">
                                            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-1 leading-tight">
                                                {gym.gymName}
                                            </h2>

                                            {/* City & Address */}
                                            <div className="flex items-start gap-1.5 mb-3">
                                                <svg className="w-3.5 h-3.5 text-[var(--text-secondary)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <p className="text-[var(--text-secondary)] text-xs sm:text-sm leading-snug">
                                                    {gym.city ? `${gym.city} · ` : ''}{gym.address}
                                                </p>
                                            </div>

                                            {/* Stats Row */}
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center">
                                                        <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-xs text-[var(--text-secondary)]">
                                                        <span className="font-semibold text-[var(--text-primary)]">{gym.memberCount || 0}</span> members
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-6 h-6 rounded-full bg-purple-500/15 flex items-center justify-center">
                                                        <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-xs text-[var(--text-secondary)]">
                                                        <span className="font-semibold text-[var(--text-primary)]">{gym.trainerCount || 0}</span> trainers
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Price Range */}
                                            {priceRange && (
                                                <div className="flex items-center gap-1.5 mb-4">
                                                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="text-xs font-semibold text-emerald-400">{priceRange}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* CTA Button */}
                                        <Link
                                            to={`/gym/${gym._id}`}
                                            className="block w-full bg-blue-600 text-white px-4 py-2.5 sm:py-3 rounded-xl hover:bg-blue-700 transition-all duration-300 text-center text-sm font-bold shadow-lg shadow-blue-600/15 hover:shadow-blue-600/25 mt-auto"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default GymList;
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const FindTrainer = () => {
    const { user } = useContext(AuthContext);
    const [trainers, setTrainers] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modalTrainer, setModalTrainer] = useState(null);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        if (user?.role === 'member') {
            fetchTrainers();
            fetchMyRequests();
        }
    }, [user]);

    const fetchTrainers = async (q = '') => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/trainer/browse`, {
                headers,
                params: q ? { search: q } : {},
            });
            setTrainers(res.data);
        } catch (err) {
            toast.error('Failed to load trainers', { position: 'top-right' });
        } finally {
            setLoading(false);
        }
    };

    const fetchMyRequests = async () => {
        try {
            const res = await axios.get(`${API_URL}/trainer/coaching-requests/member`, { headers });
            setMyRequests(res.data);
        } catch { /* silent */ }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchTrainers(search);
    };

    const handleSendRequest = async () => {
        if (!modalTrainer) return;
        setSending(true);
        try {
            await axios.post(`${API_URL}/trainer/coaching-requests`, {
                trainerId: modalTrainer._id,
                message,
            }, { headers });
            toast.success('Coaching request sent!', { position: 'top-right' });
            setModalTrainer(null);
            setMessage('');
            fetchMyRequests();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send request', { position: 'top-right' });
        } finally {
            setSending(false);
        }
    };

    // Check request status for a trainer
    const getRequestStatus = (trainerId) => {
        const req = myRequests.find(r => r.trainer?._id === trainerId || r.trainer === trainerId);
        return req?.status || null;
    };

    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
    };
    const cardVariant = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    };

    if (user?.role !== 'member') {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
                <p className="text-red-500 text-lg font-semibold">Access denied. This page is only for Members.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            {/* Background */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1571019614242-c5c5dee9f50a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-5 fixed"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)]/95 to-[var(--bg-primary)] fixed"></div>

            <div className="container mx-auto max-w-5xl relative z-10">
                <motion.div initial="hidden" animate="visible" variants={fadeIn} className="text-center mb-10">
                    <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight mb-3">
                        Find a Trainer
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        Hire a personal coach for 1-on-1 workout & diet guidance
                    </p>
                </motion.div>

                {/* Search */}
                <motion.form
                    onSubmit={handleSearch}
                    initial="hidden" animate="visible" variants={fadeIn}
                    className="flex gap-3 mb-10 max-w-2xl mx-auto"
                >
                    <div className="flex-1 relative">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by trainer name..."
                            className="w-full pl-12 pr-4 py-3.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                    </div>
                    <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        className="px-6 py-3.5 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20"
                    >
                        Search
                    </motion.button>
                </motion.form>

                {/* Trainers Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-[var(--text-secondary)]">Loading trainers...</p>
                    </div>
                ) : trainers.length > 0 ? (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {trainers.map(trainer => {
                            const status = getRequestStatus(trainer._id);
                            const expTotal = (trainer.experienceYears || 0) * 12 + (trainer.experienceMonths || 0);
                            const expLabel = trainer.experienceYears
                                ? `${trainer.experienceYears}y ${trainer.experienceMonths || 0}m`
                                : `${trainer.experienceMonths || 0}m`;

                            return (
                                <motion.div
                                    key={trainer._id}
                                    variants={cardVariant}
                                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                                    className="bg-[var(--bg-card)]/80 backdrop-blur-md border border-[var(--border-color)] rounded-3xl p-6 hover:border-purple-500/30 transition-all duration-300 group"
                                >
                                    {/* Avatar + Name */}
                                    <div className="flex items-center gap-4 mb-5">
                                        {trainer.profileImage ? (
                                            <img src={trainer.profileImage} alt={trainer.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-[var(--border-color)] group-hover:border-purple-500/40 transition-colors" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl border-2 border-[var(--border-color)]">
                                                {trainer.name?.charAt(0)?.toUpperCase()}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <h3 className="text-[var(--text-primary)] font-bold text-lg truncate">{trainer.name}</h3>
                                            <p className="text-[var(--text-secondary)] text-sm truncate">{trainer.email}</p>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-3 mb-5">
                                        <div className="bg-[var(--bg-secondary)]/60 rounded-xl p-3 text-center">
                                            <p className="text-xs text-[var(--text-secondary)] font-medium">Experience</p>
                                            <p className="text-[var(--text-primary)] font-bold text-sm mt-0.5">{expLabel}</p>
                                        </div>
                                        <div className="bg-[var(--bg-secondary)]/60 rounded-xl p-3 text-center">
                                            <p className="text-xs text-[var(--text-secondary)] font-medium">Clients</p>
                                            <p className="text-[var(--text-primary)] font-bold text-sm mt-0.5">{trainer.personalClientCount}</p>
                                        </div>
                                    </div>

                                    {/* Gym Badge */}
                                    {trainer.gym && (
                                        <div className="flex items-center gap-2 mb-5 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2">
                                            <span className="text-xs">🏢</span>
                                            <span className="text-blue-400 text-xs font-semibold truncate">{trainer.gym.gymName}</span>
                                        </div>
                                    )}

                                    {/* Action */}
                                    {status === 'accepted' ? (
                                        <div className="w-full py-3 rounded-xl bg-green-600/15 border border-green-500/30 text-green-400 text-center font-bold text-sm">
                                            ✓ Your Coach
                                        </div>
                                    ) : status === 'pending' ? (
                                        <div className="w-full py-3 rounded-xl bg-yellow-600/15 border border-yellow-500/30 text-yellow-400 text-center font-bold text-sm">
                                            ⏳ Request Pending
                                        </div>
                                    ) : status === 'denied' ? (
                                        <button
                                            onClick={() => { setModalTrainer(trainer); setMessage(''); }}
                                            className="w-full py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-purple-500/40 hover:text-purple-400 transition-all font-bold text-sm"
                                        >
                                            Request Again
                                        </button>
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => { setModalTrainer(trainer); setMessage(''); }}
                                            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-600/20"
                                        >
                                            Request Coaching
                                        </motion.button>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-[var(--bg-card)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--border-color)]">
                            <span className="text-4xl">🔍</span>
                        </div>
                        <p className="text-[var(--text-primary)] font-bold text-lg mb-2">No trainers found</p>
                        <p className="text-[var(--text-secondary)] text-sm">Try a different search term</p>
                    </div>
                )}
            </div>

            {/* Coaching Request Modal */}
            <AnimatePresence>
                {modalTrainer && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setModalTrainer(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Trainer info */}
                            <div className="flex items-center gap-4 mb-6">
                                {modalTrainer.profileImage ? (
                                    <img src={modalTrainer.profileImage} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 border-[var(--border-color)]" />
                                ) : (
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                                        {modalTrainer.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-[var(--text-primary)] font-bold text-lg">{modalTrainer.name}</h3>
                                    <p className="text-[var(--text-secondary)] text-sm">
                                        {modalTrainer.experienceYears}y {modalTrainer.experienceMonths || 0}m experience
                                    </p>
                                </div>
                            </div>

                            <h2 className="text-[var(--text-primary)] font-bold text-lg mb-2">Request Personal Coaching</h2>
                            <p className="text-[var(--text-secondary)] text-sm mb-5">
                                Send a message introducing yourself and your fitness goals.
                            </p>

                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Hi! I'm looking for help with..."
                                maxLength={500}
                                rows={4}
                                className="w-full p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none mb-2"
                            />
                            <p className="text-[var(--text-secondary)] text-xs text-right mb-5">{message.length}/500</p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setModalTrainer(null)}
                                    className="flex-1 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] font-bold hover:bg-[var(--bg-primary)] transition-all"
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    onClick={handleSendRequest}
                                    disabled={sending}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
                                >
                                    {sending ? 'Sending...' : 'Send Request'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FindTrainer;

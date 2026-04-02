import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const ClientRoster = () => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('gym');
    const [gymClients, setGymClients] = useState([]);
    const [personalClients, setPersonalClients] = useState([]);
    const [coachingRequests, setCoachingRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        if (user?.role === 'trainer') {
            fetchClients();
            fetchCoachingRequests();
        }
    }, [user]);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/trainer/clients`, { headers });
            setGymClients(res.data.gymClients || []);
            setPersonalClients(res.data.personalClients || []);
        } catch (err) {
            toast.error('Failed to load clients', { position: 'top-right' });
        } finally {
            setLoading(false);
        }
    };

    const fetchCoachingRequests = async () => {
        try {
            const res = await axios.get(`${API_URL}/trainer/coaching-requests`, { headers });
            setCoachingRequests(res.data.filter(r => r.status === 'pending'));
        } catch (err) {
            toast.error('Failed to load coaching requests', { position: 'top-right' });
        }
    };

    const handleRequestAction = async (requestId, action) => {
        try {
            await axios.post(`${API_URL}/trainer/coaching-requests/${requestId}/action`, { action }, { headers });
            toast.success(`Request ${action}ed`, { position: 'top-right' });
            fetchCoachingRequests();
            fetchClients();
        } catch (err) {
            toast.error(err.response?.data?.message || `Failed to ${action} request`, { position: 'top-right' });
        }
    };

    const handleRemovePersonalClient = async (memberId, memberName) => {
        if (!window.confirm(`Remove ${memberName} from your personal clients?`)) return;
        try {
            await axios.delete(`${API_URL}/trainer/personal-clients/${memberId}`, { headers });
            toast.success('Client removed', { position: 'top-right' });
            setPersonalClients(prev => prev.filter(c => c._id !== memberId));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to remove client', { position: 'top-right' });
        }
    };

    // Animation variants
    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
    };
    const cardVariant = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
    };

    if (user?.role !== 'trainer') {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
                <p className="text-red-500 text-lg font-semibold">Access denied. This page is only for Trainers.</p>
            </div>
        );
    }

    const ClientCard = ({ client, type }) => (
        <motion.div
            variants={cardVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-[var(--bg-secondary)]/60 border border-[var(--border-color)] rounded-2xl p-5 hover:border-blue-500/40 transition-all duration-300 group"
        >
            <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    {client.profileImage ? (
                        <img src={client.profileImage} alt={client.name} className="w-14 h-14 rounded-full object-cover border-2 border-[var(--border-color)] group-hover:border-blue-500/50 transition-colors" />
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl border-2 border-[var(--border-color)]">
                            {client.name?.charAt(0)?.toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[var(--text-primary)] font-bold text-base truncate">{client.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            type === 'gym'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                        }`}>
                            {type}
                        </span>
                    </div>
                    <p className="text-[var(--text-secondary)] text-sm truncate">{client.email}</p>
                    {client.contact && (
                        <p className="text-[var(--text-secondary)] text-xs mt-0.5">📞 {client.contact}</p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex gap-2">
                    <Link
                        to={`/workout-plans?memberId=${client._id}&clientType=${type}`}
                        className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-colors"
                        title="Create Workout Plan"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                    </Link>
                    {type === 'personal' && (
                        <button
                            onClick={() => handleRemovePersonalClient(client._id, client.name)}
                            className="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
                            title="Remove Client"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );

    const clients = activeTab === 'gym' ? gymClients : personalClients;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            {/* Background */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-5 fixed"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)]/95 to-[var(--bg-primary)] fixed"></div>

            <div className="container mx-auto max-w-5xl relative z-10">
                <motion.h1
                    initial="hidden" animate="visible" variants={fadeIn}
                    className="text-3xl sm:text-4xl font-bold mb-3 text-center text-[var(--text-primary)] tracking-tight"
                >
                    Client Roster
                </motion.h1>
                <motion.p
                    initial="hidden" animate="visible" variants={fadeIn}
                    className="text-center text-[var(--text-secondary)] mb-10"
                >
                    Manage your gym and personal coaching clients
                </motion.p>

                {/* Coaching Requests */}
                {coachingRequests.length > 0 && (
                    <motion.div
                        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
                        className="bg-[var(--bg-card)]/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-[var(--border-color)] mb-8"
                    >
                        <h2 className="text-xl font-bold mb-5 text-[var(--text-primary)] flex items-center">
                            <span className="bg-yellow-500 w-1.5 h-7 rounded-full mr-3"></span>
                            Incoming Coaching Requests
                            <span className="ml-3 px-2.5 py-0.5 bg-yellow-500/15 text-yellow-400 text-xs font-bold rounded-full">
                                {coachingRequests.length}
                            </span>
                        </h2>
                        <div className="space-y-3">
                            {coachingRequests.map(request => (
                                <motion.div
                                    key={request._id}
                                    variants={cardVariant} initial="hidden" whileInView="visible" viewport={{ once: true }}
                                    className="bg-[var(--bg-secondary)]/60 border border-yellow-500/20 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                                >
                                    <div className="flex items-center gap-4">
                                        {request.member?.profileImage ? (
                                            <img src={request.member.profileImage} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-[var(--border-color)]" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                                                {request.member?.name?.charAt(0)?.toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-[var(--text-primary)] font-bold">{request.member?.name}</p>
                                            <p className="text-[var(--text-secondary)] text-sm">{request.member?.email}</p>
                                            {request.message && (
                                                <p className="text-[var(--text-secondary)] text-sm mt-1 italic">"{request.message}"</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            onClick={() => handleRequestAction(request._id, 'accept')}
                                            className="flex-1 sm:flex-none px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold text-sm shadow-lg shadow-green-600/20"
                                        >
                                            Accept
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            onClick={() => handleRequestAction(request._id, 'deny')}
                                            className="flex-1 sm:flex-none px-5 py-2.5 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-600 hover:text-white transition-all font-bold text-sm"
                                        >
                                            Deny
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-8">
                    <button
                        onClick={() => setActiveTab('gym')}
                        className={`flex-1 py-3.5 rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 ${
                            activeTab === 'gym'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-blue-500/30'
                        }`}
                    >
                        🏢 Gym Clients
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                            activeTab === 'gym' ? 'bg-white/20' : 'bg-[var(--bg-secondary)]'
                        }`}>{gymClients.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('personal')}
                        className={`flex-1 py-3.5 rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 ${
                            activeTab === 'personal'
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-purple-500/30'
                        }`}
                    >
                        👤 Personal Clients
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                            activeTab === 'personal' ? 'bg-white/20' : 'bg-[var(--bg-secondary)]'
                        }`}>{personalClients.length}</span>
                    </button>
                </div>

                {/* Client List */}
                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
                    className="bg-[var(--bg-card)]/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-[var(--border-color)]"
                >
                    {loading ? (
                        <div className="text-center py-16">
                            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-[var(--text-secondary)]">Loading clients...</p>
                        </div>
                    ) : clients.length > 0 ? (
                        <div className="space-y-3">
                            {clients.map(client => (
                                <ClientCard key={client._id} client={client} type={activeTab} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-4xl">{activeTab === 'gym' ? '🏢' : '👤'}</span>
                            </div>
                            <p className="text-[var(--text-primary)] font-bold text-lg mb-2">
                                No {activeTab === 'gym' ? 'gym' : 'personal'} clients yet
                            </p>
                            <p className="text-[var(--text-secondary)] text-sm">
                                {activeTab === 'gym'
                                    ? 'Join a gym to start managing gym members'
                                    : 'Members can request personal coaching from your profile'}
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default ClientRoster;

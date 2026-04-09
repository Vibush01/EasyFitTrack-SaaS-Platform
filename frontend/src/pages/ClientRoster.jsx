import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const ClientRoster = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('gym');
    const [gymClients, setGymClients] = useState([]);
    const [personalClients, setPersonalClients] = useState([]);
    const [coachingRequests, setCoachingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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
            const res = await axios.get(`${API_URL}/trainer/clients/stats`, { headers });
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

    const clients = activeTab === 'gym' ? gymClients : personalClients;

    // Filter by search query
    const filteredClients = clients.filter(c => 
        (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate Summary Stats for current tab
    const totalClients = clients.length;
    const avgAdherence = totalClients > 0 
        ? Math.round(clients.reduce((sum, c) => sum + (c.dietAdherence || 0), 0) / totalClients) 
        : 0;

    // Helper to format days ago
    const getDaysAgoText = (dateString) => {
        if (!dateString) return { text: 'Never', colorClass: 'bg-red-500/15 text-red-500 border-red-500/30' };
        
        const date = new Date(dateString);
        const today = new Date();
        const diffTime = Math.abs(today - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return { text: 'Today', colorClass: 'bg-green-500/15 text-green-500 border-green-500/30' };
        if (diffDays === 1) return { text: 'Yesterday', colorClass: 'bg-green-500/15 text-green-500 border-green-500/30' };
        if (diffDays <= 3) return { text: `${diffDays} days ago`, colorClass: 'bg-green-500/15 text-green-500 border-green-500/30' };
        if (diffDays <= 6) return { text: `${diffDays} days ago`, colorClass: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30' };
        return { text: `${diffDays} days ago`, colorClass: 'bg-red-500/15 text-red-500 border-red-500/30' };
    };

    const getAdherenceBadge = (percent) => {
        if (percent >= 80) return 'bg-green-500/15 text-green-500 border-green-500/30';
        if (percent >= 50) return 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30';
        return 'bg-red-500/15 text-red-500 border-red-500/30';
    };

    const ClientCard = ({ client, type }) => {
        const lastWorkout = getDaysAgoText(client.lastWorkoutDate);
        return (
            <motion.div
                variants={cardVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-[var(--bg-secondary)]/60 border border-[var(--border-color)] rounded-2xl p-5 hover:border-blue-500/40 transition-all duration-300 group flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
                {/* Left: Avatar & Basic Info */}
                <div className="flex items-center gap-4 min-w-[250px]">
                    <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate(`/client-activity/${client._id}`)}>
                        {client.profileImage ? (
                            <img src={client.profileImage} alt={client.name} className="w-14 h-14 rounded-full object-cover border-2 border-[var(--border-color)] group-hover:border-blue-500/50 transition-colors" />
                        ) : (
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl border-2 border-[var(--border-color)]">
                                {client.name?.charAt(0)?.toUpperCase()}
                            </div>
                        )}
                    </div>

                    <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1 cursor-pointer" onClick={() => navigate(`/client-activity/${client._id}`)}>
                            <h3 className="text-[var(--text-primary)] font-bold text-base truncate group-hover:text-blue-500 transition-colors">{client.name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                type === 'gym'
                                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                    : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                            }`}>
                                {type}
                            </span>
                        </div>
                        <p className="text-[var(--text-secondary)] text-sm truncate">{client.email}</p>
                    </div>
                </div>

                {/* Middle: Activity Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 flex-grow">
                    <div className="bg-[var(--bg-primary)] rounded-xl p-2.5 border border-[var(--border-color)] flex flex-col items-center justify-center text-center">
                        <span className="text-xs text-[var(--text-secondary)] mb-1">Last Workout</span>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${lastWorkout.colorClass}`}>
                            {lastWorkout.text}
                        </span>
                    </div>
                    <div className="bg-[var(--bg-primary)] rounded-xl p-2.5 border border-[var(--border-color)] flex flex-col items-center justify-center text-center">
                        <span className="text-xs text-[var(--text-secondary)] mb-1">Diet Adherence</span>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${getAdherenceBadge(client.dietAdherence || 0)}`}>
                            {client.dietAdherence || 0}%
                        </span>
                    </div>
                    <div className="bg-[var(--bg-primary)] rounded-xl p-2.5 border border-[var(--border-color)] hidden lg:flex flex-col items-center justify-center text-center">
                        <span className="text-xs text-[var(--text-secondary)] mb-1">Active Plans</span>
                        <span className="text-xs font-bold text-[var(--text-primary)]">
                            {client.activeWorkoutPlans || 0} 🏋️ • {client.activeDietPlans || 0} 🥗
                        </span>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex-shrink-0 flex items-center justify-end gap-2 mt-2 md:mt-0">
                    <button
                        onClick={() => navigate(`/client-activity/${client._id}`)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-1.5"
                    >
                        <span>Activity</span>
                        <span>→</span>
                    </button>

                    <Link
                        to={`/workout-plans?memberId=${client._id}&clientType=${type}`}
                        className="p-2.5 bg-[var(--bg-primary)] text-[var(--text-secondary)] rounded-xl hover:text-blue-500 hover:bg-blue-500/10 border border-[var(--border-color)] transition-colors"
                        title="Manage Plans"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                    </Link>
                    
                    {type === 'personal' && (
                        <button
                            onClick={() => handleRemovePersonalClient(client._id, client.name)}
                            className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                            title="Remove Client"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            {/* Background */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-5 fixed"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)]/95 to-[var(--bg-primary)] fixed"></div>

            <div className="container mx-auto max-w-6xl relative z-10">
                <motion.div initial="hidden" animate="visible" variants={fadeIn} className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
                            Client Dashboard
                        </h1>
                        <p className="text-[var(--text-secondary)] mt-1">Manage and monitor your clients' progress</p>
                    </div>

                    <div className="flex gap-3">
                         <div className="bg-[var(--bg-card)]/80 backdrop-blur-md border border-[var(--border-color)] rounded-xl px-4 py-2 flex flex-col items-center shadow-lg">
                            <span className="text-xs text-[var(--text-secondary)] font-medium">Total Clients</span>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500">
                                {gymClients.length + personalClients.length}
                            </span>
                         </div>
                         <div className="bg-[var(--bg-card)]/80 backdrop-blur-md border border-[var(--border-color)] rounded-xl px-4 py-2 hidden sm:flex flex-col items-center shadow-lg">
                            <span className="text-xs text-[var(--text-secondary)] font-medium">Avg Adherence</span>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-500">
                                {avgAdherence}%
                            </span>
                         </div>
                    </div>
                </motion.div>

                {/* Coaching Requests */}
                {coachingRequests.length > 0 && (
                    <motion.div
                        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
                        className="bg-[var(--bg-card)]/80 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-[var(--border-color)] mb-8"
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
                                            className="flex-1 sm:flex-none px-5 py-2.5 bg-red-600/20 text-red-500 border border-red-500/30 rounded-xl hover:bg-red-600 hover:text-white transition-all font-bold text-sm"
                                        >
                                            Deny
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Tabs & Search */}
                <div className="bg-[var(--bg-card)]/80 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-[var(--border-color)] mb-6 flex flex-col md:flex-row gap-4 justify-between items-center z-20 relative">
                    <div className="flex gap-2 w-full md:w-auto p-1 bg-[var(--bg-secondary)] rounded-2xl">
                        <button
                            onClick={() => setActiveTab('gym')}
                            className={`flex-1 md:w-40 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                                activeTab === 'gym'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                            }`}
                        >
                            🏢 Gym
                            <span className={`px-2 py-0.5 rounded-md text-xs ${activeTab === 'gym' ? 'bg-white/20' : 'bg-[var(--bg-primary)] border border-[var(--border-color)]'}`}>
                                {gymClients.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('personal')}
                            className={`flex-1 md:w-48 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                                activeTab === 'personal'
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                            }`}
                        >
                            👤 Personal
                            <span className={`px-2 py-0.5 rounded-md text-xs ${activeTab === 'personal' ? 'bg-white/20' : 'bg-[var(--bg-primary)] border border-[var(--border-color)]'}`}>
                                {personalClients.length}
                            </span>
                        </button>
                    </div>

                    <div className="relative w-full md:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl leading-5 text-[var(--text-primary)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Client List */}
                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
                >
                    {loading ? (
                        <div className="bg-[var(--bg-card)]/80 backdrop-blur-md p-16 rounded-3xl shadow-xl border border-[var(--border-color)] text-center">
                            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-[var(--text-secondary)] font-medium">Loading roster & stats...</p>
                        </div>
                    ) : filteredClients.length > 0 ? (
                        <div className="space-y-4">
                            {filteredClients.map(client => (
                                <ClientCard key={client._id} client={client} type={activeTab} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-[var(--bg-card)]/80 backdrop-blur-md p-16 rounded-3xl shadow-xl border border-[var(--border-color)] text-center">
                            <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--border-color)]">
                                {searchQuery ? (
                                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                ) : (
                                    <span className="text-4xl">{activeTab === 'gym' ? '🏢' : '👤'}</span>
                                )}
                            </div>
                            <p className="text-[var(--text-primary)] font-bold text-lg mb-2">
                                {searchQuery ? 'No clients found matching your search' : `No ${activeTab === 'gym' ? 'gym' : 'personal'} clients yet`}
                            </p>
                            {!searchQuery && (
                                <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto">
                                    {activeTab === 'gym'
                                        ? 'Join a gym to start managing gym members and tracking their progress.'
                                        : 'Members can request personal coaching from your public profile.'}
                                </p>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default ClientRoster;

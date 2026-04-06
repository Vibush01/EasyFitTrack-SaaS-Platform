import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const GymProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, userDetails } = useContext(AuthContext);
    const [gym, setGym] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [membershipDuration, setMembershipDuration] = useState('1 month');
    const [applicationMessage, setApplicationMessage] = useState('');

    useEffect(() => {
        const fetchGym = async () => {
            try {
                const res = await axios.get(`${API_URL}/gym/${id}`);
                setGym(res.data);
            } catch (err) {
                setError('Failed to fetch gym details');
                toast.error('Failed to fetch gym details' + err, { position: 'top-right' });
            }
        };

        fetchGym();
    }, [id]);

    const handleJoinRequest = async () => {
        try {
            const token = localStorage.getItem('token');
            const body = {};
            if (user?.role === 'member') {
                body.membershipDuration = membershipDuration;
            }
            if (applicationMessage.trim()) {
                body.message = applicationMessage.trim();
            }
            await axios.post(`${API_URL}/gym/join/${id}`, body, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSuccess('Join request sent successfully');
            toast.success('Join request sent successfully', { position: 'top-right' });
            setTimeout(() => navigate('/gyms'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send join request');
            toast.error(err.response?.data?.message || 'Failed to send join request', { position: 'top-right' });
        }
    };

    // Animation Variants
    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
    };

    const zoomIn = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
    };

    const buttonHover = {
        hover: { scale: 1.05, boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)', transition: { duration: 0.3 } },
    };

    if (!gym) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 transition-colors duration-300">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center space-y-4"
                >
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[var(--text-secondary)] text-lg font-medium">Loading Gym Details...</p>
                </motion.div>
            </div>
        );
    }

    const canJoin = (user?.role === 'member' || user?.role === 'trainer') && !userDetails?.gym;
    const isMemberOrTrainer = (user?.role === 'member' || user?.role === 'trainer') && userDetails?.gym === id;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="container mx-auto max-w-6xl">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="mb-8 text-center"
                >
                    <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
                        {gym.gymName}
                    </h1>
                    <p className="text-[var(--text-secondary)] text-lg">{gym.address}</p>
                </motion.div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-8 text-center"
                    >
                        {error}
                    </motion.div>
                )}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-500/10 border border-green-500/50 text-green-500 p-4 rounded-xl mb-8 text-center"
                    >
                        {success}
                    </motion.div>
                )}

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeIn}
                    className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)]"
                >
                    {isMemberOrTrainer && (
                        <div className="mb-8 bg-green-500/10 border border-green-500/30 p-4 rounded-xl flex items-center justify-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-green-500 font-semibold">
                                You are a registered {user.role} of this gym
                            </span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                        <div className="lg:col-span-2 space-y-8">
                            {/* Photos Section */}
                            <div>
                                <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] flex items-center">
                                    <span className="bg-blue-600 w-1 h-8 rounded-full mr-3"></span>
                                    Gallery
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {gym.photos.length > 0 ? (
                                        gym.photos.map((photo, index) => (
                                            <motion.div
                                                key={index}
                                                className="relative group overflow-hidden rounded-xl aspect-video"
                                                initial="hidden"
                                                whileInView="visible"
                                                viewport={{ once: true }}
                                                variants={zoomIn}
                                            >
                                                <img
                                                    src={photo}
                                                    alt={`Gym ${index}`}
                                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="col-span-full bg-[var(--bg-secondary)] p-8 rounded-xl text-center text-[var(--text-secondary)] italic">
                                            No photos available
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Membership Plans */}
                            <div>
                                <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] flex items-center">
                                    <span className="bg-purple-600 w-1 h-8 rounded-full mr-3"></span>
                                    Membership Plans
                                </h2>
                                {gym.membershipPlans.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {gym.membershipPlans.map((plan, index) => (
                                            <motion.div
                                                key={index}
                                                className="bg-[var(--bg-secondary)] p-6 rounded-xl border border-[var(--border-color)] hover:border-purple-500/50 transition-all duration-300 group"
                                                initial="hidden"
                                                whileInView="visible"
                                                viewport={{ once: true }}
                                                variants={zoomIn}
                                            >
                                                <h3 className="text-[var(--text-secondary)] text-sm font-medium uppercase tracking-wider mb-2">Duration</h3>
                                                <p className="text-xl font-bold text-[var(--text-primary)] mb-4">{plan.duration}</p>
                                                <div className="flex items-baseline">
                                                    <span className="text-2xl font-bold text-purple-400">Rs {plan.price}</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-[var(--bg-secondary)] p-8 rounded-xl text-center text-[var(--text-secondary)] italic">
                                        No membership plans available
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Contact Info */}
                            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl border border-[var(--border-color)]">
                                <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">Contact Info</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[var(--text-secondary)] text-sm mb-1">Owner</p>
                                        <p className="text-[var(--text-primary)] font-medium">{gym.ownerName}</p>
                                    </div>
                                    <div>
                                        <p className="text-[var(--text-secondary)] text-sm mb-1">Email</p>
                                        <p className="text-blue-400 break-all">{gym.ownerEmail}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Join Section */}
                            {canJoin && (
                                <motion.div
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    variants={fadeIn}
                                    className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-6 rounded-xl border border-blue-500/30"
                                >
                                    {/* Hiring Status Badge */}
                                    {user.role === 'trainer' && (
                                        <div className="mb-4">
                                            {gym.hiringStatus === 'not_hiring' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/25">
                                                    <span className="w-2 h-2 rounded-full bg-red-400" />
                                                    Not Hiring Trainers
                                                </span>
                                            ) : (
                                                <div className="flex flex-col gap-2">
                                                    <span className="inline-flex w-fit items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                        Hiring Trainers
                                                    </span>
                                                    {gym.salaryRange && (
                                                        <span className="inline-flex w-fit items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                                                            Pays: {gym.salaryRange}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Not Hiring Block for Trainers */}
                                    {user.role === 'trainer' && gym.hiringStatus === 'not_hiring' ? (
                                        <div className="text-center py-4">
                                            <p className="text-[var(--text-secondary)] text-sm">
                                                This gym is not currently accepting trainer applications.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">
                                                {user.role === 'trainer' ? 'Apply to Join' : 'Ready to Join?'}
                                            </h3>

                                            {/* Member: Duration Selector */}
                                            {user.role === 'member' && (
                                                <div className="mb-4">
                                                    <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">
                                                        Select Duration
                                                    </label>
                                                    <div className="relative">
                                                        <select
                                                            value={membershipDuration}
                                                            onChange={(e) => setMembershipDuration(e.target.value)}
                                                            className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                                        >
                                                            <option value="1 week">1 Week</option>
                                                            <option value="1 month">1 Month</option>
                                                            <option value="3 months">3 Months</option>
                                                            <option value="6 months">6 Months</option>
                                                            <option value="1 year">1 Year</option>
                                                        </select>
                                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                                            <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Trainer: Application Message */}
                                            {user.role === 'trainer' && (
                                                <div className="mb-4">
                                                    <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">
                                                        Application Message <span className="text-gray-500">(optional)</span>
                                                    </label>
                                                    <textarea
                                                        value={applicationMessage}
                                                        onChange={(e) => setApplicationMessage(e.target.value)}
                                                        maxLength={500}
                                                        rows={4}
                                                        placeholder="Tell the gym about yourself, your experience, and why you'd like to join..."
                                                        className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                                                    />
                                                    <p className="text-xs text-[var(--text-secondary)] mt-1 text-right">
                                                        {applicationMessage.length}/500
                                                    </p>
                                                </div>
                                            )}

                                            <motion.button
                                                onClick={handleJoinRequest}
                                                whileHover="hover"
                                                variants={buttonHover}
                                                whileTap={{ scale: 0.98 }}
                                                className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all duration-300"
                                            >
                                                {user.role === 'trainer' ? 'Send Application' : 'Send Join Request'}
                                            </motion.button>
                                        </>
                                    )}
                                </motion.div>
                            )}

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)] text-center">
                                    <p className="text-3xl font-bold text-[var(--text-primary)] mb-1">{gym.members.length}</p>
                                    <p className="text-[var(--text-secondary)] text-xs uppercase tracking-wider">Members</p>
                                </div>
                                <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)] text-center">
                                    <p className="text-3xl font-bold text-[var(--text-primary)] mb-1">{gym.trainers.length}</p>
                                    <p className="text-[var(--text-secondary)] text-xs uppercase tracking-wider">Trainers</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Members & Trainers Lists */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-[var(--border-color)]">
                        <div>
                            <h3 className="text-xl font-bold mb-6 text-[var(--text-primary)]">Active Members</h3>
                            {gym.members.length > 0 ? (
                                <ul className="space-y-3">
                                    {gym.members.map((member) => (
                                        <motion.li
                                            key={member._id}
                                            className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-color)] flex items-center space-x-3"
                                            initial="hidden"
                                            whileInView="visible"
                                            viewport={{ once: true }}
                                            variants={zoomIn}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                                                {member.name.charAt(0)}
                                            </div>
                                            <span className="text-[var(--text-secondary)] font-medium">{member.name}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-[var(--text-secondary)] italic">No members yet</p>
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-6 text-[var(--text-primary)]">Our Trainers</h3>
                            {gym.trainers.length > 0 ? (
                                <ul className="space-y-3">
                                    {gym.trainers.map((trainer) => (
                                        <motion.li
                                            key={trainer._id}
                                            className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-color)] flex items-center space-x-3"
                                            initial="hidden"
                                            whileInView="visible"
                                            viewport={{ once: true }}
                                            variants={zoomIn}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs">
                                                {trainer.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-[var(--text-secondary)] font-medium">{trainer.name}</p>
                                                <p className="text-[var(--text-secondary)] text-xs">{trainer.email}</p>
                                            </div>
                                        </motion.li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-[var(--text-secondary)] italic">No trainers yet</p>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default GymProfile;
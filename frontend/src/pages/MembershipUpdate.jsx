import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const MembershipUpdate = () => {
    const { user, userDetails } = useContext(AuthContext);
    const [requests, setRequests] = useState([]);
    const [requestedDuration, setRequestedDuration] = useState('');

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/member/membership-requests`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRequests(res.data.data || res.data);
            } catch (err) {
                toast.error('Failed to fetch membership requests' + err, { position: "top-right" });
            }
        };

        if (user?.role === 'member') {
            fetchRequests();
        }
    }, [user]);

    const handleRequest = async () => {
        if (!requestedDuration) {
            toast.error('Please select a duration', { position: "top-right" });
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/member/membership-request`, {
                requestedDuration,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRequests([res.data.membershipRequest, ...requests]);
            setRequestedDuration('');
            toast.success('Membership request sent successfully', { position: "top-right" });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send membership request', { position: "top-right" });
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

    if (user?.role !== 'member') {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 transition-colors duration-300">
                <motion.p
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="text-red-500 text-lg sm:text-xl font-semibold text-center"
                >
                    Access denied. This page is only for Members.
                </motion.p>
            </div>
        );
    }

    if (!userDetails?.gym) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 transition-colors duration-300">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="bg-[var(--bg-card)] p-8 rounded-2xl shadow-xl border border-[var(--border-color)] text-center max-w-md"
                >
                    <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Gym Membership</h2>
                    <p className="text-[var(--text-secondary)] mb-6">
                        You must be a member of a gym to request a membership update. Please join a gym first.
                    </p>
                    <a href="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                        Find a Gym
                    </a>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="container mx-auto max-w-4xl">
                <motion.h1
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="text-3xl sm:text-4xl font-bold mb-8 text-center text-[var(--text-primary)] tracking-tight"
                >
                    Membership Management
                </motion.h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Current Membership */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)] relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -mr-8 -mt-8"></div>
                        <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] flex items-center relative z-10">
                            <span className="bg-blue-600 w-1 h-8 rounded-full mr-3"></span>
                            Current Plan
                        </h2>
                        <div className="space-y-4 relative z-10">
                            <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)]">
                                <p className="text-[var(--text-secondary)] text-sm mb-1">Duration</p>
                                <p className="text-[var(--text-primary)] text-lg font-semibold">{userDetails?.membership?.duration || 'N/A'}</p>
                            </div>
                            <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)]">
                                <p className="text-[var(--text-secondary)] text-sm mb-1">Expires On</p>
                                <p className="text-[var(--text-primary)] text-lg font-semibold">
                                    {userDetails?.membership?.endDate ? new Date(userDetails.membership.endDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                                </p>
                            </div>
                            <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)]">
                                <p className="text-[var(--text-secondary)] text-sm mb-1">Status</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${userDetails?.membership?.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                    }`}>
                                    {userDetails?.membership?.status || 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Request Membership Update */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)]"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] flex items-center">
                            <span className="bg-green-600 w-1 h-8 rounded-full mr-3"></span>
                            Extend Membership
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">Select Duration</label>
                                <div className="relative">
                                    <select
                                        value={requestedDuration}
                                        onChange={(e) => setRequestedDuration(e.target.value)}
                                        className="w-full p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                                    >
                                        <option value="">Choose duration...</option>
                                        <option value="1 week">1 Week</option>
                                        <option value="1 month">1 Month</option>
                                        <option value="3 months">3 Months</option>
                                        <option value="6 months">6 Months</option>
                                        <option value="1 year">1 Year</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--text-secondary)]">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <motion.button
                                onClick={handleRequest}
                                whileHover="hover"
                                variants={buttonHover}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-xl font-bold shadow-lg shadow-green-600/20 hover:shadow-green-600/40 transition-all duration-300 flex items-center justify-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                </svg>
                                Send Request
                            </motion.button>
                        </div>
                    </motion.div>
                </div>

                {/* Membership Requests History */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeIn}
                    className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)]"
                >
                    <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] flex items-center">
                        <span className="bg-purple-600 w-1 h-8 rounded-full mr-3"></span>
                        Request History
                    </h2>
                    {requests.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm sm:text-base">
                                <thead>
                                    <tr className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-b border-[var(--border-color)]">
                                        <th className="p-4 rounded-tl-xl">Gym</th>
                                        <th className="p-4">Requested Duration</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 rounded-tr-xl">Requested On</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[var(--text-secondary)]">
                                    {requests.map((request) => (
                                        <motion.tr
                                            key={request._id}
                                            className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]/50 transition-all duration-300"
                                            initial="hidden"
                                            whileInView="visible"
                                            viewport={{ once: true }}
                                            variants={zoomIn}
                                        >
                                            <td className="p-4 font-medium text-[var(--text-primary)]">{request.gym.gymName}</td>
                                            <td className="p-4">{request.requestedDuration}</td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${request.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                                    request.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                                    }`}>
                                                    {request.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-[var(--text-secondary)] text-sm">{new Date(request.createdAt).toLocaleDateString()}</td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-[var(--bg-secondary)] p-8 rounded-xl text-center border border-[var(--border-color)]">
                            <p className="text-[var(--text-secondary)]">No membership requests found.</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default MembershipUpdate;
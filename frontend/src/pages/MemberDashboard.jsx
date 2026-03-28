import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import StreakCard from '../components/StreakCard';

const MemberDashboard = () => {
    const { user, userDetails } = useContext(AuthContext);
    const [error, setError] = useState('');

    // Animation Variants
    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
    };

    const buttonHover = {
        hover: { scale: 1.02, transition: { duration: 0.2 } },
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

    const isInGym = !!userDetails?.gym;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-10 fixed"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)]/90 to-[var(--bg-primary)] fixed"></div>

            <div className="container mx-auto max-w-4xl relative z-10">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="text-center mb-12"
                >
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight mb-4">
                        Member Dashboard
                    </h1>
                    <p className="text-[var(--text-secondary)] text-lg">Welcome back, {userDetails?.name}</p>
                </motion.div>

                {error && (
                    <motion.p
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                        className="text-red-500 mb-6 text-center text-sm sm:text-base bg-red-500/10 py-2 rounded-lg"
                    >
                        {error}
                    </motion.p>
                )}

                {/* Streak Card — only when member is in a gym */}
                {isInGym && <StreakCard />}

                {/* Quick Links */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeIn}
                    className="bg-[var(--bg-card)]/80 backdrop-blur-md p-6 sm:p-10 rounded-3xl shadow-2xl border border-[var(--border-color)]"
                >
                    <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-[var(--text-primary)] border-b border-[var(--border-color)] pb-4">Quick Actions</h2>
                    <div className="grid gap-6 sm:grid-cols-2">
                        {isInGym ? (
                            <>
                                <motion.div whileHover="hover" variants={buttonHover} className="w-full">
                                    <Link
                                        to="/request-plan"
                                        className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-2xl hover:from-blue-500 hover:to-blue-600 transition-all duration-300 shadow-lg shadow-blue-600/20 group"
                                    >
                                        <svg className="w-10 h-10 mb-3 text-white/90 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                        <span className="text-lg font-bold text-center">Request Plans</span>
                                        <span className="text-sm text-blue-100 mt-2 text-center">Get personalized workout & diet plans</span>
                                    </Link>
                                </motion.div>
                                <motion.div whileHover="hover" variants={buttonHover} className="w-full">
                                    <Link
                                        to="/book-session"
                                        className="flex flex-col items-center justify-center h-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] p-6 rounded-2xl hover:bg-[var(--bg-card)] hover:border-gray-600 transition-all duration-300 group"
                                    >
                                        <svg className="w-10 h-10 mb-3 text-gray-400 group-hover:text-[var(--text-primary)] transition-colors group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-lg font-bold text-center">Book a Session</span>
                                        <span className="text-sm text-[var(--text-secondary)] mt-2 text-center group-hover:text-[var(--text-primary)]">Schedule time with a trainer</span>
                                    </Link>
                                </motion.div>
                            </>
                        ) : (
                            <motion.div whileHover="hover" variants={buttonHover} className="col-span-full">
                                <Link
                                    to="/gyms"
                                    className="flex flex-col items-center justify-center w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-2xl hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-xl shadow-blue-600/20 group"
                                >
                                    <svg className="w-12 h-12 mb-4 text-white/90 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <span className="text-2xl font-bold">Find a Gym</span>
                                    <span className="text-base text-blue-100 mt-2">Search and join a gym to get started</span>
                                </Link>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default MemberDashboard;
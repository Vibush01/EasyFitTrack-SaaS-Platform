import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const RoleSelection = () => {
    const [role, setRole] = useState('');
    const location = useLocation();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!role) {
            toast.error('Please select a role', { position: "top-right" });
        }
    };

    // Animation Variants
    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
    };

    const buttonHover = {
        hover: { scale: 1.02, transition: { duration: 0.2 } },
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-10"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)]/90 to-[var(--bg-primary)]"></div>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="relative bg-[var(--bg-card)]/80 border border-[var(--border-color)] p-6 sm:p-10 rounded-3xl shadow-2xl w-full max-w-md backdrop-blur-md"
            >
                <motion.div variants={fadeIn} className="text-center mb-8 sm:mb-10">
                    <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-2 tracking-tight">
                        Join EasyFitTrack
                    </h1>
                    <p className="text-[var(--text-secondary)] text-sm sm:text-base">Choose how you want to use the platform</p>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                    <motion.div variants={fadeIn}>
                        <label className="block text-[var(--text-secondary)] font-medium mb-4 text-sm text-center">
                            Select your role to continue
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                {
                                    id: 'member', label: 'Member', icon: (
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    )
                                },
                                {
                                    id: 'trainer', label: 'Trainer', icon: (
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    )
                                },
                                {
                                    id: 'gym', label: 'Gym Owner', icon: (
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    )
                                }
                            ].map((roleOption) => (
                                <Link
                                    key={roleOption.id}
                                    to={`/signup/${roleOption.id}`}
                                    state={{ from: location.state?.from }}
                                    className="group relative bg-[var(--bg-secondary)] hover:bg-blue-600 border border-[var(--border-color)] hover:border-blue-500 p-6 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-4 text-center hover:shadow-xl hover:shadow-blue-600/20 hover:-translate-y-1"
                                >
                                    <div className="p-3 rounded-full bg-black/20 group-hover:bg-white/20 text-[var(--text-secondary)] group-hover:text-white transition-colors">
                                        {roleOption.icon}
                                    </div>
                                    <span className="font-semibold text-[var(--text-secondary)] group-hover:text-white text-lg">
                                        {roleOption.label}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                </form>

                <motion.p
                    variants={fadeIn}
                    className="mt-6 sm:mt-8 text-center text-[var(--text-secondary)] text-sm"
                >
                    Already have an account?{' '}
                    <a href="/login" className="text-blue-500 hover:text-blue-400 font-semibold transition-colors">
                        Sign In
                    </a>
                </motion.p>
            </motion.div>
        </div>
    );
};

export default RoleSelection;

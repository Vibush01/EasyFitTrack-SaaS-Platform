import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const TrainerSignup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        contact: '',
        experienceYears: '',
        experienceMonths: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/auth/register`, {
                ...formData,
                role: 'trainer',
            });
            localStorage.setItem('token', res.data.token);
            toast.success('Signup successful', { position: "top-right" });
            navigate('/profile');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Signup failed', { position: "top-right" });
        }
    };

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
                        Trainer Signup
                    </h1>
                    <p className="text-[var(--text-secondary)] text-sm sm:text-base">Join as a trainer and inspire others</p>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                    <motion.div variants={fadeIn}>
                        <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">
                            Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[var(--text-primary)] placeholder-gray-500 transition-all duration-300 text-sm sm:text-base"
                            required
                        />
                    </motion.div>

                    <motion.div variants={fadeIn}>
                        <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[var(--text-primary)] placeholder-gray-500 transition-all duration-300 text-sm sm:text-base"
                            required
                        />
                    </motion.div>

                    <motion.div variants={fadeIn}>
                        <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[var(--text-primary)] placeholder-gray-500 transition-all duration-300 text-sm sm:text-base"
                                required
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute inset-y-0 right-0 flex items-center pr-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.418 0-8-3.582-8-8s3.582-8 8-8a10.05 10.05 0 011.875.175M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </motion.div>

                    <motion.div variants={fadeIn}>
                        <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">
                            Contact
                        </label>
                        <input
                            type="text"
                            name="contact"
                            value={formData.contact}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[var(--text-primary)] placeholder-gray-500 transition-all duration-300 text-sm sm:text-base"
                            required
                        />
                    </motion.div>

                    <div className="grid grid-cols-2 gap-4">
                        <motion.div variants={fadeIn}>
                            <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">
                                Exp (Years)
                            </label>
                            <input
                                type="number"
                                name="experienceYears"
                                value={formData.experienceYears}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[var(--text-primary)] placeholder-gray-500 transition-all duration-300 text-sm sm:text-base"
                                required
                            />
                        </motion.div>
                        <motion.div variants={fadeIn}>
                            <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">
                                Exp (Months)
                            </label>
                            <input
                                type="number"
                                name="experienceMonths"
                                value={formData.experienceMonths}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[var(--text-primary)] placeholder-gray-500 transition-all duration-300 text-sm sm:text-base"
                                required
                            />
                        </motion.div>
                    </div>

                    <motion.button
                        type="submit"
                        whileHover="hover"
                        whileTap={{ scale: 0.98 }}
                        variants={buttonHover}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 sm:p-4 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all duration-300 mt-6 sm:mt-8 text-sm sm:text-base"
                    >
                        Sign Up
                    </motion.button>
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

export default TrainerSignup;
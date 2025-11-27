import { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.role) {
            toast.error('Please select a role', { position: "top-right" });
            return;
        }

        setIsLoading(true);
        try {
            const res = await axios.post(`${API_URL}/auth/login`, formData);
            login(res.data.user, res.data.token);
            toast.success('Login successful', { position: "top-right" });

            const from = location.state?.from?.pathname || getRedirectPath(res.data.user.role);
            navigate(from, { replace: true });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed', { position: "top-right" });
        } finally {
            setIsLoading(false);
        }
    };

    const getRedirectPath = (role) => {
        switch (role) {
            case 'member':
                return '/member-dashboard';
            case 'trainer':
                return '/gym-dashboard';
            case 'gym':
                return '/gym-dashboard';
            case 'admin':
                return '/admin-dashboard';
            default:
                return '/login';
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
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-10"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)]/90 to-[var(--bg-primary)]"></div>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="relative bg-[var(--bg-card)]/80 border border-[var(--border-color)] p-6 sm:p-10 rounded-3xl shadow-2xl w-full max-w-md backdrop-blur-md"
            >
                <motion.div variants={fadeIn} className="text-center mb-8 sm:mb-10">
                    <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-2 tracking-tight">
                        Welcome Back
                    </h1>
                    <p className="text-[var(--text-secondary)] text-sm sm:text-base">Sign in to continue your fitness journey</p>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                    <motion.div variants={fadeIn}>
                        <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[var(--text-primary)] placeholder-gray-500 transition-all duration-300 text-sm sm:text-base"
                            placeholder="you@example.com"
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
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-300 transition-colors"
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
                        <label className="block text-[var(--text-secondary)] font-medium mb-3 text-sm">
                            Select Role
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                {
                                    id: 'member', label: 'Member', icon: (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    )
                                },
                                {
                                    id: 'trainer', label: 'Trainer', icon: (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    )
                                },
                                {
                                    id: 'gym', label: 'Gym Owner', icon: (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    )
                                },
                                {
                                    id: 'admin', label: 'Admin', icon: (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    )
                                }
                            ].map((roleOption) => (
                                <div
                                    key={roleOption.id}
                                    onClick={() => setFormData({ ...formData, role: roleOption.id })}
                                    className={`cursor-pointer p-4 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 group ${formData.role === roleOption.id
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                                        : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:border-gray-600 hover:text-[var(--text-primary)]'
                                        }`}
                                >
                                    <div className={`p-2 rounded-full ${formData.role === roleOption.id ? 'bg-white/20' : 'bg-black/20 group-hover:bg-black/40'
                                        }`}>
                                        {roleOption.icon}
                                    </div>
                                    <span className="font-medium text-sm">{roleOption.label}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={!isLoading ? "hover" : {}}
                        whileTap={!isLoading ? { scale: 0.98 } : {}}
                        variants={buttonHover}
                        className={`w-full p-3 sm:p-4 rounded-xl font-bold shadow-lg transition-all duration-300 mt-6 sm:mt-8 text-sm sm:text-base ${isLoading
                            ? 'bg-blue-400 cursor-not-allowed text-white/80'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                            }`}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Signing In...</span>
                            </div>
                        ) : (
                            'Sign In'
                        )}
                    </motion.button>
                </form>

                <motion.p
                    variants={fadeIn}
                    className="mt-6 sm:mt-8 text-center text-[var(--text-secondary)] text-sm"
                >
                    Don't have an account?{' '}
                    <a href="/signup" className="text-blue-500 hover:text-blue-400 font-semibold transition-colors">
                        Create Account
                    </a>
                </motion.p>
            </motion.div>
        </div>
    );
};

export default Login;

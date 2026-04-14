import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { compressImage } from '../utils/compressImage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const Profile = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        profileImage: null,
    });
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setFormData({
                    name: res.data.name || '',
                    email: res.data.email || '',
                    password: '',
                    profileImage: null,
                });
                setPreviewImage(res.data.profileImage || null);
            } catch (err) {
                console.error('Error fetching profile:', err);
                toast.error(err.response?.data?.message || 'Failed to fetch profile', { position: "top-right" });
            }
        };

        if (user) {
            fetchProfile();
        }
    }, [user]);

    const handleChange = async (e) => {
        if (e.target.name === 'profileImage') {
            const file = e.target.files[0];
            if (file) {
                setPreviewImage(URL.createObjectURL(file));
                // Compress before storing — keeps Cloudinary within free tier
                const compressed = await compressImage(file);
                setFormData({ ...formData, profileImage: compressed });
            }
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const data = new FormData();
            if (formData.name) data.append('name', formData.name);
            if (formData.password) data.append('password', formData.password);
            if (formData.profileImage) data.append('profileImage', formData.profileImage);

            await axios.put(`${API_URL}/auth/profile`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            setFormData({ ...formData, password: '' });
            toast.success('Profile updated successfully', { position: "top-right" });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile', { position: "top-right" });
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Animation Variants
    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
    };

    const buttonHover = {
        hover: { scale: 1.05, boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)', transition: { duration: 0.3 } },
    };

    const logoutHover = {
        hover: { scale: 1.05, boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)', transition: { duration: 0.3 } },
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 transition-colors duration-300">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)] w-full max-w-md relative overflow-hidden"
            >
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-600 blur-md opacity-75"></div>

                <motion.h1
                    variants={fadeIn}
                    className="text-2xl sm:text-3xl font-bold mb-8 text-center text-[var(--text-primary)] tracking-tight"
                >
                    My Profile
                </motion.h1>

                <motion.div
                    variants={fadeIn}
                    className="flex justify-center mb-8"
                >
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[var(--border-color)] group-hover:border-blue-500 transition-colors duration-300">
                            <img
                                src={previewImage || 'https://via.placeholder.com/150'}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <input
                            type="file"
                            name="profileImage"
                            id="profileImage"
                            onChange={handleChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            accept="image/*"
                            aria-label="Upload Profile Image"
                        />
                        <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg transform translate-x-1/4 translate-y-1/4 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                        </div>
                    </div>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <motion.div variants={fadeIn}>
                        <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">
                            Full Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                            placeholder="Enter your name"
                        />
                    </motion.div>

                    <motion.div variants={fadeIn}>
                        <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            disabled
                            className="w-full p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-gray-500 cursor-not-allowed"
                        />
                    </motion.div>

                    <motion.div variants={fadeIn}>
                        <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">
                            New Password <span className="text-gray-600 text-xs">(Optional)</span>
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                            placeholder="••••••••"
                        />
                    </motion.div>

                    <motion.button
                        type="submit"
                        whileHover="hover"
                        variants={buttonHover}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all duration-300"
                    >
                        Save Changes
                    </motion.button>
                </form>

                <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
                    <motion.button
                        onClick={handleLogout}
                        whileHover="hover"
                        variants={logoutHover}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-transparent border border-red-500/30 text-red-500 p-4 rounded-xl font-semibold hover:bg-red-500/10 transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                        </svg>
                        <span>Sign Out</span>
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

export default Profile;
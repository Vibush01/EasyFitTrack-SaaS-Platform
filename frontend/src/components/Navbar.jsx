import React, { useState, useRef, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Dropdown = ({ title, icon, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div
            className="relative"
            ref={dropdownRef}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-1 text-white hover:text-gray-200 text-sm sm:text-base font-medium transition-colors duration-300 focus:outline-none"
            >
                {icon && <span className="mr-1">{icon}</span>}
                <span>{title}</span>
                <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 bg-[#1E1E1E] border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50"
                    >
                        <div className="py-1">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Navbar = () => {
    const { user, userDetails, logout } = useContext(AuthContext);
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setIsOpen(false);
    };

    // Determine if the user can access the Chat page
    const canAccessChat = () => {
        if (!user) return false;
        if (user.role === 'gym') return true; // Gym Profiles can always access Chat
        return (user.role === 'member' || user.role === 'trainer') && userDetails?.gym; // Members and Trainers need to be in a gym
    };

    // Animation Variants
    const fadeIn = {
        hidden: { opacity: 0, y: -20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    };

    const linkHover = {
        hover: { scale: 1.05, transition: { duration: 0.2 } },
    };

    return (
        <nav className="bg-blue-600 p-4 shadow-lg fixed top-0 w-full z-50">
            <div className="container mx-auto flex justify-between items-center">
                {/* Logo */}
                <Link to="/" className="text-white text-2xl sm:text-3xl font-bold tracking-tight">
                    EasyFitTrack
                </Link>

                {/* Hamburger Menu for Mobile */}
                <div className="md:hidden">
                    <motion.button
                        onClick={() => setIsOpen(!isOpen)}
                        className="text-white focus:outline-none"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Toggle Menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
                        </svg>
                    </motion.button>
                </div>

                {/* Links (Desktop) */}
                <div className="hidden md:flex items-center space-x-6">
                    {user ? (
                        <>
                            {/* Dashboard Link */}
                            {(user.role === 'member') && (
                                <motion.div whileHover="hover" variants={linkHover}>
                                    <Link to="/member-dashboard" className="text-white hover:text-gray-200 text-sm sm:text-base font-medium transition-colors duration-300">
                                        Dashboard
                                    </Link>
                                </motion.div>
                            )}
                            {(user.role === 'gym' || user.role === 'trainer') && (
                                <motion.div whileHover="hover" variants={linkHover}>
                                    <Link to="/gym-dashboard" className="text-white hover:text-gray-200 text-sm sm:text-base font-medium transition-colors duration-300">
                                        Dashboard
                                    </Link>
                                </motion.div>
                            )}
                            {user.role === 'admin' && (
                                <motion.div whileHover="hover" variants={linkHover}>
                                    <Link to="/admin-dashboard" className="text-white hover:text-gray-200 text-sm sm:text-base font-medium transition-colors duration-300">
                                        Dashboard
                                    </Link>
                                </motion.div>
                            )}

                            {/* Gym Dropdown (Member) */}
                            {user.role === 'member' && (
                                <Dropdown title="Gym">
                                    {userDetails?.gym ? (
                                        <>
                                            <Link to={`/gym/${userDetails.gym}`} className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">
                                                My Gym
                                            </Link>
                                            <Link to="/membership-update" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">
                                                Membership Update
                                            </Link>
                                            <Link to="/book-session" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">
                                                Book Session
                                            </Link>
                                            <Link to="/request-plan" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">
                                                Request Plan
                                            </Link>
                                        </>
                                    ) : (
                                        <Link to="/gyms" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">
                                            Find a Gym
                                        </Link>
                                    )}
                                </Dropdown>
                            )}

                            {/* Trainer Dropdown */}
                            {user.role === 'trainer' && userDetails?.gym && (
                                <Dropdown title="Trainer Tools">
                                    <Link to={`/gym/${userDetails.gym}`} className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">
                                        My Gym
                                    </Link>
                                    <Link to="/membership-management" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">
                                        Membership Management
                                    </Link>
                                    <Link to="/workout-plans" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">
                                        Workout Plans
                                    </Link>
                                    <Link to="/manage-schedule" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">
                                        Manage Schedule
                                    </Link>
                                    <Link to="/view-bookings" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">
                                        View Bookings
                                    </Link>
                                </Dropdown>
                            )}

                            {/* Gym Admin Dropdown */}
                            {user.role === 'gym' && (
                                <Dropdown title="Gym Admin">
                                    <Link to="/membership-management" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">
                                        Membership Management
                                    </Link>
                                    <Link to="/update-gym" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">
                                        Update Gym
                                    </Link>
                                </Dropdown>
                            )}


                            {/* Announcements */}
                            {user.role === 'member' && userDetails?.gym && (
                                <motion.div whileHover="hover" variants={linkHover}>
                                    <Link to="/announcements" className="text-white hover:text-gray-200 text-sm sm:text-base font-medium transition-colors duration-300">
                                        Announcements
                                    </Link>
                                </motion.div>
                            )}

                            {/* Chat */}
                            {canAccessChat() && (
                                <motion.div whileHover="hover" variants={linkHover}>
                                    <Link to="/chat" className="text-white hover:text-gray-200 text-sm sm:text-base font-medium transition-colors duration-300">
                                        Chat
                                    </Link>
                                </motion.div>
                            )}

                            {/* Tracker Dropdown (Member) */}
                            {user.role === 'member' && (
                                <Dropdown title="Tracker">
                                    <Link to="/macro-calculator" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">
                                        Macro Calculator
                                    </Link>
                                    <Link to="/progress-tracker" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">
                                        Progress Tracker
                                    </Link>
                                </Dropdown>
                            )}

                            {/* Profile Dropdown */}
                            <Dropdown
                                title=""
                                icon={
                                    userDetails?.profileImage ? (
                                        <img src={userDetails.profileImage} alt="Profile" className="w-8 h-8 rounded-full object-cover border-2 border-white/20" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center text-white font-bold border-2 border-white/20">
                                            {userDetails?.name?.charAt(0) || user.role.charAt(0).toUpperCase()}
                                        </div>
                                    )
                                }
                            >
                                <Link to="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">
                                    Profile
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                                >
                                    Logout
                                </button>
                            </Dropdown>
                        </>
                    ) : (
                        <>
                            <motion.div whileHover="hover" variants={linkHover}>
                                <Link to="/signup" className="text-white hover:text-gray-200 text-sm sm:text-base font-medium transition-colors duration-300">
                                    Signup
                                </Link>
                            </motion.div>
                            <motion.div whileHover="hover" variants={linkHover}>
                                <Link to="/login" className="text-white hover:text-gray-200 text-sm sm:text-base font-medium transition-colors duration-300">
                                    Login
                                </Link>
                            </motion.div>
                        </>
                    )}

                    {/* Theme Toggle Button (Desktop) */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none"
                        aria-label="Toggle Theme"
                    >
                        {theme === 'dark' ? (
                            <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="md:hidden absolute top-16 left-0 w-full bg-blue-700 shadow-xl z-50 rounded-b-lg"
                >
                    <div className="flex flex-col space-y-2 p-4">
                        {user ? (
                            <>
                                {/* Mobile links */}
                                {user.role === 'member' && (
                                    <Link to="/member-dashboard" className="text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-base font-medium block" onClick={() => setIsOpen(false)}>
                                        Dashboard
                                    </Link>
                                )}
                                {(user.role === 'gym' || user.role === 'trainer') && (
                                    <Link to="/gym-dashboard" className="text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-base font-medium block" onClick={() => setIsOpen(false)}>
                                        Dashboard
                                    </Link>
                                )}
                                {user.role === 'admin' && (
                                    <Link to="/admin-dashboard" className="text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-base font-medium block" onClick={() => setIsOpen(false)}>
                                        Dashboard
                                    </Link>
                                )}

                                {user.role === 'member' && (
                                    <>
                                        <div className="px-4 py-2 text-blue-200 text-sm font-semibold uppercase tracking-wider">Gym</div>
                                        {userDetails?.gym ? (
                                            <>
                                                <Link to={`/gym/${userDetails.gym}`} className="text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-base font-medium block pl-8" onClick={() => setIsOpen(false)}>My Gym</Link>
                                                <Link to="/membership-update" className="text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-base font-medium block pl-8" onClick={() => setIsOpen(false)}>Membership Update</Link>
                                                <Link to="/book-session" className="text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-base font-medium block pl-8" onClick={() => setIsOpen(false)}>Book Session</Link>
                                                <Link to="/request-plan" className="text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-base font-medium block pl-8" onClick={() => setIsOpen(false)}>Request Plan</Link>
                                            </>
                                        ) : (
                                            <Link to="/gyms" className="text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-base font-medium block pl-8" onClick={() => setIsOpen(false)}>Find a Gym</Link>
                                        )}

                                        <div className="px-4 py-2 text-blue-200 text-sm font-semibold uppercase tracking-wider">Tracker</div>
                                        <Link to="/macro-calculator" className="text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-base font-medium block pl-8" onClick={() => setIsOpen(false)}>Macro Calculator</Link>
                                        <Link to="/progress-tracker" className="text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-base font-medium block pl-8" onClick={() => setIsOpen(false)}>Progress Tracker</Link>
                                    </>
                                )}

                                {user.role === 'trainer' && userDetails?.gym && (
                                    <>
                                        <div className="px-4 py-2 text-blue-200 text-sm font-semibold uppercase tracking-wider">Trainer Tools</div>
                                        <Link to={`/gym/${userDetails.gym}`} className="text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-base font-medium block pl-8" onClick={() => setIsOpen(false)}>My Gym</Link>
                                        <Link to="/membership-management" className="text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-base font-medium block pl-8" onClick={() => setIsOpen(false)}>Membership Management</Link>
                                        <Link to="/workout-plans" className="text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-base font-medium block pl-8" onClick={() => setIsOpen(false)}>Workout Plans</Link>
                                        <Link to="/manage-schedule" className="text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-base font-medium block pl-8" onClick={() => setIsOpen(false)}>Manage Schedule</Link>
                                        <Link to="/view-bookings" className="text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-base font-medium block pl-8" onClick={() => setIsOpen(false)}>View Bookings</Link>
                                    </>
                                )}

                                {user.role === 'gym' && (
                                    <>
                                        <div className="px-4 py-2 text-blue-200 text-sm font-semibold uppercase tracking-wider">Gym Admin</div>
                                        <Link to="/membership-management" className="text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-base font-medium block pl-8" onClick={() => setIsOpen(false)}>Membership Management</Link>
                                        <Link to="/update-gym" className="text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-base font-medium block pl-8" onClick={() => setIsOpen(false)}>Update Gym</Link>
                                    </>
                                )}

                                {canAccessChat() && (
                                    <Link to="/chat" className="text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-base font-medium block" onClick={() => setIsOpen(false)}>
                                        Chat
                                    </Link>
                                )}

                                {user.role === 'member' && userDetails?.gym && (
                                    <Link to="/announcements" className="text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-base font-medium block" onClick={() => setIsOpen(false)}>
                                        Announcements
                                    </Link>
                                )}

                                <div className="border-t border-blue-500 my-2 pt-2">
                                    <Link to="/profile" className="text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-base font-medium block" onClick={() => setIsOpen(false)}>
                                        Profile
                                    </Link>
                                    <button onClick={() => { handleLogout(); setIsOpen(false); }} className="text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-base font-medium text-left block w-full">
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/signup" className="text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-base font-medium block" onClick={() => setIsOpen(false)}>
                                    Signup
                                </Link>
                                <Link to="/login" className="text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-base font-medium block" onClick={() => setIsOpen(false)}>
                                    Login
                                </Link>
                            </>
                        )}

                        {/* Theme Toggle (Mobile) */}
                        <button
                            onClick={() => { toggleTheme(); setIsOpen(false); }}
                            className="text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-base font-medium text-left block w-full flex items-center justify-between"
                        >
                            <span>{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
                            {theme === 'dark' ? (
                                <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </motion.div>
            )}
        </nav>
    );
};

export default Navbar;
import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const Home = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/contact/messages`, formData);
            toast.success(res.data.message, { position: "top-right" });
            setFormData({
                name: '',
                email: '',
                phone: '',
                subject: '',
                message: '',
            });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit contact form', { position: "top-right" });
        }
    };

    // Animation Variants
    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
    };

    const slideInLeft = {
        hidden: { opacity: 0, x: -50 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } },
    };

    const slideInRight = {
        hidden: { opacity: 0, x: 50 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } },
    };

    const zoomIn = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut" } },
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-x-hidden transition-colors duration-300">
            {/* Hero Section */}
            <motion.section
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden"
            >
                {/* Background Elements */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)]/80 via-[var(--bg-primary)]/50 to-[var(--bg-primary)]"></div>

                <div className="relative container mx-auto px-6 text-center z-10">
                    <motion.div variants={fadeIn} className="inline-block mb-4 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm">
                        <span className="text-blue-400 font-semibold tracking-wide uppercase text-sm">Welcome to the Future of Fitness</span>
                    </motion.div>

                    <motion.h1
                        variants={fadeIn}
                        className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight tracking-tight text-[var(--text-primary)]"
                    >
                        Transform Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Body & Mind</span>
                    </motion.h1>

                    <motion.p
                        variants={fadeIn}
                        className="text-xl md:text-2xl text-[var(--text-secondary)] mb-12 max-w-3xl mx-auto leading-relaxed"
                    >
                        The ultimate ecosystem connecting gym owners, elite trainers, and members.
                        Elevate your fitness journey with data-driven insights and community support.
                    </motion.p>

                    <motion.div variants={zoomIn} className="flex flex-col sm:flex-row gap-6 justify-center">
                        <a
                            href="#contact"
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-600/30 transition-all duration-300 hover:-translate-y-1"
                        >
                            Start Your Journey
                        </a>
                        <a
                            href="#features"
                            className="px-8 py-4 bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl font-bold text-lg transition-all duration-300 hover:-translate-y-1"
                        >
                            Explore Features
                        </a>
                    </motion.div>
                </div>
            </motion.section>

            {/* About Section */}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                className="py-32 bg-[var(--bg-primary)]"
            >
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <motion.div variants={slideInLeft} className="flex-1 relative group">
                            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-30 blur-xl group-hover:opacity-50 transition duration-500"></div>
                            <img
                                src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80"
                                alt="Fitness"
                                className="relative w-full h-[500px] object-cover rounded-2xl shadow-2xl"
                            />
                        </motion.div>

                        <motion.div variants={slideInRight} className="flex-1">
                            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight text-[var(--text-primary)]">
                                More Than Just a <span className="text-blue-500">Gym Platform</span>
                            </h2>
                            <div className="space-y-6 text-lg text-[var(--text-secondary)]">
                                <p>
                                    EasyFitTrack is your all-in-one fitness command center. We've reimagined how gyms operate and how members achieve their goals by bridging the gap between technology and physical wellness.
                                </p>
                                <p>
                                    Whether you're a gym owner looking to streamline operations, a trainer wanting to scale your impact, or a member chasing a new PR, our platform provides the tools you need to succeed.
                                </p>
                                <div className="pt-6 grid grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-2">10k+</h3>
                                        <p className="text-sm uppercase tracking-wider text-[var(--text-secondary)]">Active Members</p>
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-2">500+</h3>
                                        <p className="text-sm uppercase tracking-wider text-[var(--text-secondary)]">Partner Gyms</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* Features Section */}
            <motion.section
                id="features"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                className="py-32 bg-[var(--bg-secondary)]"
            >
                <div className="container mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[var(--text-primary)]">Why Choose <span className="text-blue-500">EasyFitTrack</span>?</h2>
                        <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">Comprehensive tools designed for every role in the fitness ecosystem.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Gym Management",
                                desc: "Streamline operations with automated member tracking, billing, and staff management.",
                                icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4"
                            },
                            {
                                title: "Trainer Support",
                                desc: "Create personalized workout plans, track client progress, and schedule sessions effortlessly.",
                                icon: "M13 10V3L4 14h7v7l9-11h-7z"
                            },
                            {
                                title: "Member Success",
                                desc: "Access macro calculators, progress tracking, and booking tools to crush your goals.",
                                icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                variants={zoomIn}
                                className="bg-[var(--bg-card)] p-8 rounded-2xl border border-[var(--border-color)] hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 group"
                            >
                                <div className="w-16 h-16 bg-blue-600/10 rounded-xl flex items-center justify-center mb-8 group-hover:bg-blue-600 transition-colors duration-300">
                                    <svg className="w-8 h-8 text-blue-500 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feature.icon}></path>
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">{feature.title}</h3>
                                <p className="text-[var(--text-secondary)] leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* Testimonials Section */}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                className="py-32 bg-[var(--bg-primary)]"
            >
                <div className="container mx-auto px-6">
                    <h2 className="text-4xl md:text-5xl font-bold text-center mb-20 text-[var(--text-primary)]">Community <span className="text-blue-500">Voices</span></h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                quote: "EasyFitTrack has transformed the way I manage my gym. The platform is intuitive, and I can easily oversee my trainers and members.",
                                author: "John Doe",
                                role: "Gym Owner"
                            },
                            {
                                quote: "As a trainer, EasyFitTrack makes my job so much easier. I can create plans, schedule sessions, and chat with my clients all in one place.",
                                author: "Jane Smith",
                                role: "Personal Trainer"
                            },
                            {
                                quote: "I love how EasyFitTrack helps me track my progress and connect with my trainer. It’s the best fitness app I’ve ever used!",
                                author: "Mike Johnson",
                                role: "Member"
                            }
                        ].map((testimonial, index) => (
                            <motion.div
                                key={index}
                                variants={zoomIn}
                                className="bg-[var(--bg-card)] p-10 rounded-2xl relative"
                            >
                                <div className="absolute top-8 left-8 text-blue-600 opacity-20">
                                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.896 14.912 16 16.017 16H19.017C19.569 16 20.017 15.552 20.017 15V9C20.017 8.448 19.569 8 19.017 8H15.017C14.465 8 14.017 8.448 14.017 9V11C14.017 11.552 13.569 12 13.017 12H12.017V5H22.017V15C22.017 18.314 19.331 21 16.017 21H14.017ZM5.01697 21L5.01697 18C5.01697 16.896 5.91197 16 7.01697 16H10.017C10.569 16 11.017 15.552 11.017 15V9C11.017 8.448 10.569 8 10.017 8H6.01697C5.46497 8 5.01697 8.448 5.01697 9V11C5.01697 11.552 4.56897 12 4.01697 12H3.01697V5H13.017V15C13.017 18.314 10.331 21 7.01697 21H5.01697Z" /></svg>
                                </div>
                                <p className="text-[var(--text-secondary)] mb-8 relative z-10 leading-relaxed pt-8">"{testimonial.quote}"</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center font-bold text-xl text-blue-500">
                                        {testimonial.author[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[var(--text-primary)]">{testimonial.author}</p>
                                        <p className="text-sm text-blue-500">{testimonial.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* Contact Section */}
            <motion.section
                id="contact"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                className="py-32 bg-[var(--bg-secondary)]"
            >
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[var(--text-primary)]">Get in <span className="text-blue-500">Touch</span></h2>
                            <p className="text-[var(--text-secondary)]">Have questions? We'd love to hear from you.</p>
                        </div>

                        <motion.div
                            variants={fadeIn}
                            className="bg-[var(--bg-card)] p-8 md:p-12 rounded-3xl border border-[var(--border-color)] shadow-2xl"
                        >
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[var(--text-primary)] transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[var(--text-primary)] transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Phone</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[var(--text-primary)] transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Subject</label>
                                        <input
                                            type="text"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[var(--text-primary)] transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Message</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[var(--text-primary)] transition-all h-32 resize-none"
                                        required
                                    />
                                </div>

                                <motion.button
                                    type="submit"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-600/20 transition-all duration-300"
                                >
                                    Send Message
                                </motion.button>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* Footer */}
            <footer className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] py-12 border-t border-[var(--border-color)]">
                <div className="container mx-auto px-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">B</span>
                        </div>
                        <span className="text-[var(--text-primary)] text-2xl font-bold">EasyFit<span className="text-blue-500">Track</span></span>
                    </div>
                    <p className="mb-8">© 2025 EasyFitTrack. All rights reserved.</p>
                    <div className="flex justify-center space-x-8">
                        <a href="#" className="hover:text-blue-500 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-blue-500 transition-colors">Terms of Service</a>
                        <a href="#contact" className="hover:text-blue-500 transition-colors">Contact Us</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;

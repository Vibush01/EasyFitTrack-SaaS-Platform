import { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import WorkoutChecklist from '../components/WorkoutChecklist';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const RequestPlan = () => {
    const { user } = useContext(AuthContext);
    const [trainers, setTrainers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [workoutPlans, setWorkoutPlans] = useState([]);  // raw workout plan docs
    const [dietPlans, setDietPlans] = useState([]);        // raw diet plan docs
    const [plans, setPlans] = useState([]);                // combined display list
    const [selectedTrainer, setSelectedTrainer] = useState('');
    const [requestType, setRequestType] = useState('workout');

    useEffect(() => {
        const fetchTrainers = async () => {
            try {
                const token = localStorage.getItem('token');
                const memberRes = await axios.get(`${API_URL}/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const gymId = memberRes.data.gym;
                const gymRes = await axios.get(`${API_URL}/gym/${gymId}`);
                setTrainers(gymRes.data.trainers);
            } catch (err) {
                toast.error('Failed to fetch trainers' + err, { position: "top-right" });
            }
        };

        const fetchRequests = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/trainer/member/plan-requests`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRequests(res.data.data || res.data);
            } catch (err) {
                toast.error('Failed to fetch plan requests' + err, { position: "top-right" });
            }
        };

        const fetchPlans = async () => {
            try {
                const token = localStorage.getItem('token');
                const workoutPlansRes = await axios.get(`${API_URL}/trainer/member/workout-plans`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const dietPlansRes = await axios.get(`${API_URL}/trainer/member/diet-plans`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const rawWorkout = workoutPlansRes.data.data || workoutPlansRes.data;
                const rawDiet = dietPlansRes.data.data || dietPlansRes.data;

                setWorkoutPlans(rawWorkout);
                setDietPlans(rawDiet);

                const combinedPlans = [
                    ...rawWorkout.map((plan) => ({
                        _id: plan._id,
                        type: 'Workout Plan',
                        title: plan.title,
                        raw: plan,  // keep full object for checklist
                        trainer: plan.trainer,
                        gym: plan.gym,
                        receivedOn: plan.createdAt,
                    })),
                    ...rawDiet.map((plan) => ({
                        type: 'Diet Plan',
                        title: plan.title,
                        description: plan.meals.map((meal) => `${meal.name}: ${meal.calories} kcal, Protein: ${meal.protein}g, Carbs: ${meal.carbs}g, Fats: ${meal.fats}g, Time: ${meal.time || 'N/A'}`).join('; '),
                        trainer: plan.trainer,
                        gym: plan.gym,
                        receivedOn: plan.createdAt,
                    })),
                ].sort((a, b) => new Date(b.receivedOn) - new Date(a.receivedOn));

                setPlans(combinedPlans);
            } catch (err) {
                toast.error('Failed to fetch plans' + err, { position: "top-right" });
            }
        };

        if (user?.role === 'member') {
            fetchTrainers();
            fetchRequests();
            fetchPlans();
        }
    }, [user]);

    // Callback passed to WorkoutChecklist so it can trigger a re-fetch after session update
    const refreshPlans = useCallback(() => {
        // Re-trigger plan fetch by toggling a counter (simple approach)
        setPlans((prev) => [...prev]);
    }, []);

    // Debug logs
    console.log('Requests:', requests);
    console.log('Plans:', plans);

    const handleRequest = async () => {
        if (!selectedTrainer) {
            toast.error('Please select a trainer', { position: "top-right" });
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/trainer/plan-requests`, {
                trainerId: selectedTrainer,
                requestType,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRequests([res.data.planRequest, ...requests]);
            setSelectedTrainer('');
            toast.success('Request sent successfully', { position: "top-right" });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send request', { position: "top-right" });
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

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-5 fixed"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)]/95 to-[var(--bg-primary)] fixed"></div>

            <div className="container mx-auto max-w-6xl relative z-10">
                <motion.h1
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="text-3xl sm:text-4xl font-bold mb-8 text-center text-[var(--text-primary)] tracking-tight"
                >
                    Request Workout & Diet Plan
                </motion.h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Request a Plan */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="lg:col-span-1 bg-[var(--bg-card)]/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)] h-fit"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] flex items-center">
                            <span className="bg-blue-600 w-1.5 h-8 rounded-full mr-3"></span>
                            New Request
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">Select Trainer</label>
                                <select
                                    value={selectedTrainer}
                                    onChange={(e) => setSelectedTrainer(e.target.value)}
                                    className="w-full p-4 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                >
                                    <option value="">Choose a trainer...</option>
                                    {trainers.map((trainer) => (
                                        <option key={trainer._id} value={trainer._id}>
                                            {trainer.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">Request Type</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setRequestType('workout')}
                                        className={`p-4 rounded-xl border transition-all duration-300 ${requestType === 'workout'
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : 'bg-[var(--bg-secondary)]/50 border-[var(--border-color)] text-[var(--text-secondary)] hover:border-gray-500'
                                            }`}
                                    >
                                        Workout Plan
                                    </button>
                                    <button
                                        onClick={() => setRequestType('diet')}
                                        className={`p-4 rounded-xl border transition-all duration-300 ${requestType === 'diet'
                                            ? 'bg-green-600 border-green-600 text-white'
                                            : 'bg-[var(--bg-secondary)]/50 border-[var(--border-color)] text-[var(--text-secondary)] hover:border-gray-500'
                                            }`}
                                    >
                                        Diet Plan
                                    </button>
                                </div>
                            </div>
                            <motion.button
                                onClick={handleRequest}
                                whileHover="hover"
                                variants={buttonHover}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all duration-300"
                            >
                                Send Request
                            </motion.button>
                        </div>
                    </motion.div>

                    <div className="lg:col-span-2 space-y-8">
                        {/* Your Plan Requests */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeIn}
                            className="bg-[var(--bg-card)]/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)]"
                        >
                            <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] flex items-center">
                                <span className="bg-yellow-500 w-1.5 h-8 rounded-full mr-3"></span>
                                Pending Requests
                            </h2>
                            {requests.length > 0 ? (
                                <div className="space-y-4">
                                    {requests.map((request) => (
                                        <motion.div
                                            key={request._id}
                                            className="bg-[var(--bg-secondary)]/50 p-4 rounded-xl border border-[var(--border-color)] flex justify-between items-center"
                                            initial="hidden"
                                            whileInView="visible"
                                            viewport={{ once: true }}
                                            variants={zoomIn}
                                        >
                                            <div>
                                                <p className="text-[var(--text-primary)] font-semibold">{request.requestType === 'workout' ? 'Workout Plan' : 'Diet Plan'}</p>
                                                <p className="text-[var(--text-secondary)] text-sm">Trainer: {request.trainer.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${request.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                                    request.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                                    }`}>
                                                    {request.status}
                                                </span>
                                                <p className="text-[var(--text-secondary)] text-xs mt-1">{new Date(request.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[var(--text-secondary)] text-center py-4">No pending requests</p>
                            )}
                        </motion.div>

                        {/* Your Plans */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeIn}
                            className="bg-[var(--bg-card)]/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)]"
                        >
                            <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] flex items-center">
                                <span className="bg-purple-600 w-1.5 h-8 rounded-full mr-3"></span>
                                Your Plans
                            </h2>
                            {plans.length > 0 ? (
                                <div className="space-y-4">
                                    {plans.map((plan, index) => (
                                        <motion.div
                                            key={plan._id || index}
                                            className={`bg-[var(--bg-secondary)]/50 p-5 rounded-xl border transition-all duration-300 ${
                                                plan.type === 'Workout Plan'
                                                    ? 'border-[var(--border-color)] hover:border-blue-500/40'
                                                    : 'border-[var(--border-color)] hover:border-green-500/40'
                                            }`}
                                            initial="hidden"
                                            whileInView="visible"
                                            viewport={{ once: true }}
                                            variants={zoomIn}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="text-[var(--text-primary)] font-bold text-lg">{plan.title}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                                            plan.type === 'Workout Plan'
                                                                ? 'bg-blue-500/10 text-blue-400'
                                                                : 'bg-green-500/10 text-green-400'
                                                        }`}>
                                                            {plan.type}
                                                        </span>
                                                        {plan.type === 'Workout Plan' && plan.raw?.exercises?.length > 0 && (
                                                            <span className="text-xs text-[var(--text-secondary)]">
                                                                {plan.raw.exercises.length} exercise{plan.raw.exercises.length !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[var(--text-secondary)] text-xs">Trainer: {plan.trainer.name}</p>
                                                    <p className="text-[var(--text-secondary)] text-xs">{new Date(plan.receivedOn).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        <div className="bg-[var(--bg-primary)]/50 p-4 rounded-lg text-[var(--text-secondary)] text-sm leading-relaxed">
                                                {plan.type === 'Workout Plan' && plan.raw ? (
                                                    <WorkoutChecklist
                                                        plan={plan.raw}
                                                        onSessionUpdate={refreshPlans}
                                                    />
                                                ) : (
                                                    plan.description
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-[var(--bg-secondary)]/50 p-12 rounded-xl text-center border border-[var(--border-color)] border-dashed">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-[var(--text-secondary)] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-[var(--text-secondary)] text-lg font-medium">No plans received yet</p>
                                    <p className="text-[var(--text-secondary)] text-sm mt-2">Request a plan from your trainer to get started!</p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestPlan;
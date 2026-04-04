import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const WorkoutPlans = () => {
    const { user } = useContext(AuthContext);
    const [plans, setPlans] = useState([]);
    const [dietPlans, setDietPlans] = useState([]);
    const [requests, setRequests] = useState([]);
    const [members, setMembers] = useState({ gymClients: [], personalClients: [] });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('workout');
    const [workoutForm, setWorkoutForm] = useState({
        memberId: '',
        clientType: 'gym',
        title: '',
        description: '',
        exercises: [{ name: '', sets: '', reps: '', rest: '' }],
    });
    const [dietForm, setDietForm] = useState({
        memberId: '',
        clientType: 'gym',
        title: '',
        description: '',
        meals: [{ name: '', calories: '', protein: '', carbs: '', fats: '', time: '' }],
    });
    const [editWorkoutId, setEditWorkoutId] = useState(null);
    const [editDietId, setEditDietId] = useState(null);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const token = localStorage.getItem('token');
                const workoutRes = await axios.get(`${API_URL}/trainer/workout-plans`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setPlans(workoutRes.data.data || workoutRes.data);

                const dietRes = await axios.get(`${API_URL}/trainer/diet-plans`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setDietPlans(dietRes.data.data || dietRes.data);
            } catch (err) {
                setError('Failed to fetch plans');
                toast.error('Failed to fetch plans' + err, { position: 'top-right' });
            }
        };

        const fetchRequests = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/trainer/plan-requests`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRequests(res.data.data || res.data);
            } catch (err) {
                setError('Failed to fetch plan requests');
                toast.error('Failed to fetch plan requests' + err, { position: 'top-right' });
            }
        };

        const fetchMembers = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/trainer/clients`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setMembers({
                    gymClients: res.data.gymClients || [],
                    personalClients: res.data.personalClients || [],
                });
            } catch (err) {
                setError('Failed to fetch members');
                toast.error('Failed to fetch members' + err, { position: 'top-right' });
            }
        };

        if (user?.role === 'trainer') {
            fetchPlans();
            fetchRequests();
            fetchMembers();
        }
    }, [user]);

    const handleWorkoutChange = (e, index) => {
        if (e.target.name.startsWith('exercise')) {
            const exercises = [...workoutForm.exercises];
            const field = e.target.name.split('.')[1];
            exercises[index][field] = e.target.value;
            setWorkoutForm({ ...workoutForm, exercises });
        } else if (e.target.name === 'memberId') {
            // Auto-detect clientType based on which group the member belongs to
            const memberId = e.target.value;
            const isPersonal = members.personalClients.some(m => m._id === memberId);
            setWorkoutForm({ ...workoutForm, memberId, clientType: isPersonal ? 'personal' : 'gym' });
        } else {
            setWorkoutForm({ ...workoutForm, [e.target.name]: e.target.value });
        }
    };

    const handleDietChange = (e, index) => {
        if (e.target.name.startsWith('meal')) {
            const meals = [...dietForm.meals];
            const field = e.target.name.split('.')[1];
            meals[index][field] = e.target.value;
            setDietForm({ ...dietForm, meals });
        } else if (e.target.name === 'memberId') {
            const memberId = e.target.value;
            const isPersonal = members.personalClients.some(m => m._id === memberId);
            setDietForm({ ...dietForm, memberId, clientType: isPersonal ? 'personal' : 'gym' });
        } else {
            setDietForm({ ...dietForm, [e.target.name]: e.target.value });
        }
    };

    const addExercise = () => {
        setWorkoutForm({
            ...workoutForm,
            exercises: [...workoutForm.exercises, { name: '', sets: '', reps: '', rest: '' }],
        });
    };

    const removeExercise = (index) => {
        setWorkoutForm({
            ...workoutForm,
            exercises: workoutForm.exercises.filter((_, i) => i !== index),
        });
    };

    const addMeal = () => {
        setDietForm({
            ...dietForm,
            meals: [...dietForm.meals, { name: '', calories: '', protein: '', carbs: '', fats: '', time: '' }],
        });
    };

    const removeMeal = (index) => {
        setDietForm({
            ...dietForm,
            meals: dietForm.meals.filter((_, i) => i !== index),
        });
    };

    const handleWorkoutSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const data = {
                memberId: workoutForm.memberId,
                clientType: workoutForm.clientType,
                title: workoutForm.title,
                description: workoutForm.description,
                exercises: workoutForm.exercises,
            };

            if (editWorkoutId) {
                const res = await axios.put(`${API_URL}/trainer/workout-plans/${editWorkoutId}`, data, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setPlans(plans.map((plan) => (plan._id === editWorkoutId ? res.data.workoutPlan : plan)));
                setSuccess('Workout plan updated');
                toast.success('Workout plan updated', { position: 'top-right' });
                setEditWorkoutId(null);
            } else {
                const res = await axios.post(`${API_URL}/trainer/workout-plans`, data, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setPlans([res.data.workoutPlan, ...plans]);
                setSuccess('Workout plan created');
                toast.success('Workout plan created', { position: 'top-right' });
            }

            setWorkoutForm({
                memberId: '',
                clientType: 'gym',
                title: '',
                description: '',
                exercises: [{ name: '', sets: '', reps: '', rest: '' }],
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save workout plan');
            toast.error(err.response?.data?.message || 'Failed to save workout plan', { position: 'top-right' });
        }
    };

    const handleDietSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const data = {
                memberId: dietForm.memberId,
                clientType: dietForm.clientType,
                title: dietForm.title,
                description: dietForm.description,
                meals: dietForm.meals,
            };

            if (editDietId) {
                const res = await axios.put(`${API_URL}/trainer/diet-plans/${editDietId}`, data, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setDietPlans(dietPlans.map((plan) => (plan._id === editDietId ? res.data.dietPlan : plan)));
                setSuccess('Diet plan updated');
                toast.success('Diet plan updated', { position: 'top-right' });
                setEditDietId(null);
            } else {
                const res = await axios.post(`${API_URL}/trainer/diet-plans`, data, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setDietPlans([res.data.dietPlan, ...dietPlans]);
                setSuccess('Diet plan created');
                toast.success('Diet plan created', { position: 'top-right' });
            }

            setDietForm({
                memberId: '',
                clientType: 'gym',
                title: '',
                description: '',
                meals: [{ name: '', calories: '', protein: '', carbs: '', fats: '', time: '' }],
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save diet plan');
            toast.error(err.response?.data?.message || 'Failed to save diet plan', { position: 'top-right' });
        }
    };

    const handleWorkoutEdit = (plan) => {
        setWorkoutForm({
            memberId: plan.member._id,
            clientType: plan.clientType || 'gym',
            title: plan.title,
            description: plan.description,
            exercises: plan.exercises,
        });
        setEditWorkoutId(plan._id);
        setActiveTab('workout');
    };

    const handleDietEdit = (plan) => {
        setDietForm({
            memberId: plan.member._id,
            clientType: plan.clientType || 'gym',
            title: plan.title,
            description: plan.description,
            meals: plan.meals,
        });
        setEditDietId(plan._id);
        setActiveTab('diet');
    };

    const handleWorkoutDelete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/trainer/workout-plans/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPlans(plans.filter((plan) => plan._id !== id));
            setSuccess('Workout plan deleted');
            toast.success('Workout plan deleted', { position: 'top-right' });
        } catch (err) {
            setError('Failed to delete workout plan');
            toast.error('Failed to delete workout plan' + err, { position: 'top-right' });
        }
    };

    const handleDietDelete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/trainer/diet-plans/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setDietPlans(dietPlans.filter((plan) => plan._id !== id));
            setSuccess('Diet plan deleted');
            toast.success('Diet plan deleted', { position: 'top-right' });
        } catch (err) {
            setError('Failed to delete diet plan');
            toast.error('Failed to delete diet plan' + err, { position: 'top-right' });
        }
    };

    const handleRequestAction = async (requestId, action) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/trainer/plan-requests/${requestId}/action`, { action }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRequests(requests.map((req) => (req._id === requestId ? res.data.planRequest : req)));
            setSuccess(`Request ${action}d`);
            toast.success(`Request ${action}d`, { position: 'top-right' });
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${action} request`);
            toast.error(err.response?.data?.message || `Failed to ${action} request`, { position: 'top-right' });
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

    if (user?.role !== 'trainer') {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 transition-colors duration-300">
                <motion.p
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="text-red-500 text-lg sm:text-xl font-semibold text-center"
                >
                    Access denied. This page is only for Trainers.
                </motion.p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-5 fixed"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)]/95 to-[var(--bg-primary)] fixed"></div>

            <div className="container mx-auto max-w-7xl relative z-10">
                <motion.h1
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="text-3xl sm:text-4xl font-bold mb-8 text-center text-[var(--text-primary)] tracking-tight"
                >
                    Workout & Diet Plans
                </motion.h1>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-8 text-center backdrop-blur-sm"
                    >
                        {error}
                    </motion.div>
                )}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-500/10 border border-green-500/50 text-green-500 p-4 rounded-xl mb-8 text-center backdrop-blur-sm"
                    >
                        {success}
                    </motion.div>
                )}

                {/* Plan Requests */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeIn}
                    className="bg-[var(--bg-card)]/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-[var(--border-color)] mb-8"
                >
                    <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] flex items-center">
                        <span className="bg-yellow-500 w-1.5 h-8 rounded-full mr-3"></span>
                        Plan Requests
                    </h2>
                    {requests.length > 0 ? (
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left text-sm sm:text-base min-w-[800px]">
                                <thead>
                                    <tr className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-b border-[var(--border-color)]">
                                        <th className="p-4 rounded-tl-xl">Member</th>
                                        <th className="p-4">Request Type</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Requested On</th>
                                        <th className="p-4 rounded-tr-xl">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[var(--text-primary)]">
                                    {requests.map((request) => (
                                        <motion.tr
                                            key={request._id}
                                            className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]/50 transition-all duration-300"
                                            initial="hidden"
                                            whileInView="visible"
                                            viewport={{ once: true }}
                                            variants={zoomIn}
                                        >
                                            <td className="p-4 font-medium text-[var(--text-primary)]">
                                                {request.member.name} <span className="text-[var(--text-secondary)] text-xs block">{request.member.email}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${request.requestType === 'workout' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
                                                    }`}>
                                                    {request.requestType} Plan
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${request.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                                    request.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                                    }`}>
                                                    {request.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-[var(--text-secondary)] text-sm">{new Date(request.createdAt).toLocaleDateString()}</td>
                                            <td className="p-4 flex space-x-2">
                                                {request.status === 'pending' && (
                                                    <>
                                                        <motion.button
                                                            onClick={() => handleRequestAction(request._id, 'approve')}
                                                            whileHover={{ scale: 1.1 }}
                                                            className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition-colors"
                                                            title="Approve"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </motion.button>
                                                        <motion.button
                                                            onClick={() => handleRequestAction(request._id, 'deny')}
                                                            whileHover={{ scale: 1.1 }}
                                                            className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                                                            title="Deny"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        </motion.button>
                                                    </>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-[var(--bg-secondary)]/50 p-8 rounded-xl text-center border border-[var(--border-color)] border-dashed">
                            <p className="text-[var(--text-secondary)]">No pending plan requests.</p>
                        </div>
                    )}
                </motion.div>

                {/* Tabs */}
                <div className="flex space-x-4 mb-8 border-b border-[var(--border-color)] pb-4">
                    <button
                        onClick={() => setActiveTab('workout')}
                        className={`pb-2 text-lg font-semibold transition-colors ${activeTab === 'workout' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                    >
                        Workout Plans
                    </button>
                    <button
                        onClick={() => setActiveTab('diet')}
                        className={`pb-2 text-lg font-semibold transition-colors ${activeTab === 'diet' ? 'text-green-500 border-b-2 border-green-500' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                    >
                        Diet Plans
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form Section */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="lg:col-span-1 bg-[var(--bg-card)]/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-[var(--border-color)] h-fit"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] flex items-center">
                            <span className={`w-1.5 h-8 rounded-full mr-3 ${activeTab === 'workout' ? 'bg-blue-600' : 'bg-green-600'}`}></span>
                            {activeTab === 'workout'
                                ? (editWorkoutId ? 'Edit Workout Plan' : 'Create Workout Plan')
                                : (editDietId ? 'Edit Diet Plan' : 'Create Diet Plan')}
                        </h2>

                        {activeTab === 'workout' ? (
                            <form onSubmit={handleWorkoutSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">Member</label>
                                    <select
                                        name="memberId"
                                        value={workoutForm.memberId}
                                        onChange={handleWorkoutChange}
                                        className="w-full p-3 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                        required
                                    >
                                        <option value="">Select Member</option>
                                        {members.gymClients.length > 0 && (
                                            <optgroup label="🏢 Gym Clients">
                                                {members.gymClients.map((member) => (
                                                    <option key={member._id} value={member._id}>{member.name}</option>
                                                ))}
                                            </optgroup>
                                        )}
                                        {members.personalClients.length > 0 && (
                                            <optgroup label="👤 Personal Clients">
                                                {members.personalClients.map((member) => (
                                                    <option key={member._id} value={member._id}>{member.name}</option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={workoutForm.title}
                                        onChange={handleWorkoutChange}
                                        className="w-full p-3 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">Description</label>
                                    <textarea
                                        name="description"
                                        value={workoutForm.description}
                                        onChange={handleWorkoutChange}
                                        className="w-full p-3 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                        rows="3"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-[var(--text-primary)] font-bold">Exercises</h3>
                                        <button
                                            type="button"
                                            onClick={addExercise}
                                            className="text-blue-500 text-sm hover:text-blue-400 font-medium"
                                        >
                                            + Add Exercise
                                        </button>
                                    </div>
                                    {workoutForm.exercises.map((exercise, index) => (
                                        <div key={index} className="bg-[var(--bg-secondary)]/50 p-4 rounded-xl border border-[var(--border-color)] relative group">
                                            {workoutForm.exercises.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeExercise(index)}
                                                    className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            )}
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    name={`exercise.name.${index}`}
                                                    value={exercise.name}
                                                    onChange={(e) => handleWorkoutChange(e, index)}
                                                    placeholder="Exercise Name"
                                                    className="w-full p-2 bg-[var(--bg-primary)]/50 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500"
                                                    required
                                                />
                                                <div className="grid grid-cols-3 gap-2">
                                                    <input
                                                        type="number"
                                                        name={`exercise.sets.${index}`}
                                                        value={exercise.sets}
                                                        onChange={(e) => handleWorkoutChange(e, index)}
                                                        placeholder="Sets"
                                                        className="w-full p-2 bg-[var(--bg-primary)]/50 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500"
                                                        required
                                                    />
                                                    <input
                                                        type="number"
                                                        name={`exercise.reps.${index}`}
                                                        value={exercise.reps}
                                                        onChange={(e) => handleWorkoutChange(e, index)}
                                                        placeholder="Reps"
                                                        className="w-full p-2 bg-[var(--bg-primary)]/50 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500"
                                                        required
                                                    />
                                                    <input
                                                        type="text"
                                                        name={`exercise.rest.${index}`}
                                                        value={exercise.rest}
                                                        onChange={(e) => handleWorkoutChange(e, index)}
                                                        placeholder="Rest"
                                                        className="w-full p-2 bg-[var(--bg-primary)]/50 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <motion.button
                                    type="submit"
                                    whileHover="hover"
                                    variants={buttonHover}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all duration-300 mt-4"
                                >
                                    {editWorkoutId ? 'Update Plan' : 'Create Plan'}
                                </motion.button>
                                {editWorkoutId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditWorkoutId(null);
                                            setWorkoutForm({ memberId: '', clientType: 'gym', title: '', description: '', exercises: [{ name: '', sets: '', reps: '', rest: '' }] });
                                        }}
                                        className="w-full bg-gray-700 text-white p-3 rounded-xl font-medium hover:bg-gray-600 transition-all duration-300 mt-2"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </form>
                        ) : (
                            <form onSubmit={handleDietSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">Member</label>
                                    <select
                                        name="memberId"
                                        value={dietForm.memberId}
                                        onChange={handleDietChange}
                                        className="w-full p-3 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                                        required
                                    >
                                        <option value="">Select Member</option>
                                        {members.gymClients.length > 0 && (
                                            <optgroup label="🏢 Gym Clients">
                                                {members.gymClients.map((member) => (
                                                    <option key={member._id} value={member._id}>{member.name}</option>
                                                ))}
                                            </optgroup>
                                        )}
                                        {members.personalClients.length > 0 && (
                                            <optgroup label="👤 Personal Clients">
                                                {members.personalClients.map((member) => (
                                                    <option key={member._id} value={member._id}>{member.name}</option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={dietForm.title}
                                        onChange={handleDietChange}
                                        className="w-full p-3 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">Description</label>
                                    <textarea
                                        name="description"
                                        value={dietForm.description}
                                        onChange={handleDietChange}
                                        className="w-full p-3 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                                        rows="3"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-[var(--text-primary)] font-bold">Meals</h3>
                                        <button
                                            type="button"
                                            onClick={addMeal}
                                            className="text-green-500 text-sm hover:text-green-400 font-medium"
                                        >
                                            + Add Meal
                                        </button>
                                    </div>
                                    {dietForm.meals.map((meal, index) => (
                                        <div key={index} className="bg-[var(--bg-secondary)]/50 p-4 rounded-xl border border-[var(--border-color)] relative group">
                                            {dietForm.meals.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeMeal(index)}
                                                    className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            )}
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    name={`meal.name.${index}`}
                                                    value={meal.name}
                                                    onChange={(e) => handleDietChange(e, index)}
                                                    placeholder="Meal Name"
                                                    className="w-full p-2 bg-[var(--bg-primary)]/50 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-green-500"
                                                    required
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                        type="number"
                                                        name={`meal.calories.${index}`}
                                                        value={meal.calories}
                                                        onChange={(e) => handleDietChange(e, index)}
                                                        placeholder="Calories"
                                                        className="w-full p-2 bg-[var(--bg-primary)]/50 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-green-500"
                                                        required
                                                    />
                                                    <input
                                                        type="text"
                                                        name={`meal.time.${index}`}
                                                        value={meal.time}
                                                        onChange={(e) => handleDietChange(e, index)}
                                                        placeholder="Time"
                                                        className="w-full p-2 bg-[var(--bg-primary)]/50 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-green-500"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <input
                                                        type="number"
                                                        name={`meal.protein.${index}`}
                                                        value={meal.protein}
                                                        onChange={(e) => handleDietChange(e, index)}
                                                        placeholder="Protein (g)"
                                                        className="w-full p-2 bg-[var(--bg-primary)]/50 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-green-500"
                                                        required
                                                    />
                                                    <input
                                                        type="number"
                                                        name={`meal.carbs.${index}`}
                                                        value={meal.carbs}
                                                        onChange={(e) => handleDietChange(e, index)}
                                                        placeholder="Carbs (g)"
                                                        className="w-full p-2 bg-[var(--bg-primary)]/50 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-green-500"
                                                        required
                                                    />
                                                    <input
                                                        type="number"
                                                        name={`meal.fats.${index}`}
                                                        value={meal.fats}
                                                        onChange={(e) => handleDietChange(e, index)}
                                                        placeholder="Fats (g)"
                                                        className="w-full p-2 bg-[var(--bg-primary)]/50 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-green-500"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <motion.button
                                    type="submit"
                                    whileHover="hover"
                                    variants={buttonHover}
                                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-xl font-bold shadow-lg shadow-green-600/20 hover:shadow-green-600/40 transition-all duration-300 mt-4"
                                >
                                    {editDietId ? 'Update Plan' : 'Create Plan'}
                                </motion.button>
                                {editDietId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditDietId(null);
                                            setDietForm({ memberId: '', clientType: 'gym', title: '', description: '', meals: [{ name: '', calories: '', protein: '', carbs: '', fats: '', time: '' }] });
                                        }}
                                        className="w-full bg-gray-700 text-white p-3 rounded-xl font-medium hover:bg-gray-600 transition-all duration-300 mt-2"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </form>
                        )}
                    </motion.div>

                    {/* Plans List */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="lg:col-span-2 bg-[var(--bg-card)]/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-[var(--border-color)]"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] flex items-center">
                            <span className={`w-1.5 h-8 rounded-full mr-3 ${activeTab === 'workout' ? 'bg-blue-600' : 'bg-green-600'}`}></span>
                            Existing {activeTab === 'workout' ? 'Workout' : 'Diet'} Plans
                        </h2>

                        <div className="space-y-4">
                            {(activeTab === 'workout' ? plans : dietPlans).length > 0 ? (
                                (activeTab === 'workout' ? plans : dietPlans).map((plan) => (
                                    <motion.div
                                        key={plan._id}
                                        className="bg-[var(--bg-secondary)]/50 p-5 rounded-xl border border-[var(--border-color)] hover:border-opacity-50 transition-all duration-300"
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: true }}
                                        variants={zoomIn}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-[var(--text-primary)] font-bold text-lg">{plan.title}</h3>
                                                <p className="text-[var(--text-secondary)] text-sm">For: {plan.member.name}</p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <motion.button
                                                    onClick={() => activeTab === 'workout' ? handleWorkoutEdit(plan) : handleDietEdit(plan)}
                                                    whileHover={{ scale: 1.1 }}
                                                    className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg hover:bg-yellow-500/20 transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                    </svg>
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => activeTab === 'workout' ? handleWorkoutDelete(plan._id) : handleDietDelete(plan._id)}
                                                    whileHover={{ scale: 1.1 }}
                                                    className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </motion.button>
                                            </div>
                                        </div>

                                        <p className="text-[var(--text-secondary)] text-sm mb-4">{plan.description}</p>

                                        {activeTab === 'workout' ? (
                                            <div className="space-y-2">
                                                {plan.exercises.map((exercise, idx) => (
                                                    <div key={idx} className="bg-[var(--bg-primary)]/50 p-3 rounded-lg flex justify-between items-center text-sm">
                                                        <span className="font-medium text-[var(--text-primary)]">{exercise.name}</span>
                                                        <span className="text-[var(--text-secondary)]">
                                                            {exercise.sets}x{exercise.reps} {exercise.rest && `(${exercise.rest})`}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {plan.meals.map((meal, idx) => (
                                                    <div key={idx} className="bg-[var(--bg-primary)]/50 p-3 rounded-lg text-sm">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="font-medium text-[var(--text-primary)]">{meal.name}</span>
                                                            <span className="text-[var(--text-secondary)]">{meal.time}</span>
                                                        </div>
                                                        <div className="flex gap-3 text-xs text-[var(--text-secondary)]">
                                                            <span>{meal.calories} kcal</span>
                                                            <span>P: {meal.protein}g</span>
                                                            <span>C: {meal.carbs}g</span>
                                                            <span>F: {meal.fats}g</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                ))
                            ) : (
                                <div className="bg-[var(--bg-secondary)]/50 p-12 rounded-xl text-center border border-[var(--border-color)] border-dashed">
                                    <p className="text-[var(--text-secondary)]">No {activeTab} plans found.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default WorkoutPlans;
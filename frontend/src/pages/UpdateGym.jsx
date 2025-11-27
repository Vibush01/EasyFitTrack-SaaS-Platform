import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const UpdateGym = () => {
    const { user } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        gymName: '',
        address: '',
        ownerName: '',
        ownerEmail: '',
        membershipPlans: [],
        photos: [],
        deletePhotos: [],
        primaryImage: '',
    });
    const [newMembershipPlan, setNewMembershipPlan] = useState({ duration: '', price: '' });
    const [previewImages, setPreviewImages] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchGym = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setFormData({
                    gymName: res.data.gymName || '',
                    address: res.data.address || '',
                    ownerName: res.data.ownerName || '',
                    ownerEmail: res.data.ownerEmail || '',
                    membershipPlans: res.data.membershipPlans || [],
                    photos: res.data.photos || [],
                    primaryImage: res.data.primaryImage || '',
                    deletePhotos: [],
                });
                setPreviewImages(res.data.photos || []);
            } catch (err) {
                console.error('Error fetching gym details:', err);
                setError(err.response?.data?.message || 'Failed to fetch gym details');
                toast.error(err.response?.data?.message || 'Failed to fetch gym details', { position: 'top-right' });
            }
        };

        if (user?.role === 'gym') {
            fetchGym();
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleMembershipChange = (e) => {
        setNewMembershipPlan({ ...newMembershipPlan, [e.target.name]: e.target.value });
    };

    const addMembershipPlan = () => {
        if (!newMembershipPlan.duration || !newMembershipPlan.price) {
            toast.error('Please fill in both duration and price for the membership plan', { position: 'top-right' });
            return;
        }

        const price = parseFloat(newMembershipPlan.price);
        if (isNaN(price) || price <= 0) {
            toast.error('Price must be a valid positive number', { position: 'top-right' });
            return;
        }

        const plan = {
            duration: newMembershipPlan.duration,
            price: price.toString(),
        };

        setFormData({
            ...formData,
            membershipPlans: [...formData.membershipPlans, plan],
        });
        setNewMembershipPlan({ duration: '', price: '' });
    };

    const removeMembershipPlan = (index) => {
        setFormData({
            ...formData,
            membershipPlans: formData.membershipPlans.filter((_, i) => i !== index),
        });
    };

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files);
        setFormData({ ...formData, photos: [...formData.photos, ...files] });
        setPreviewImages([...previewImages, ...files.map((file) => URL.createObjectURL(file))]);
    };

    const handleDeletePhoto = (photoUrl) => {
        setFormData({
            ...formData,
            deletePhotos: [...formData.deletePhotos, photoUrl],
            photos: formData.photos.filter((photo) => !(photo instanceof File) || URL.createObjectURL(photo) !== photoUrl),
            primaryImage: formData.primaryImage === photoUrl ? '' : formData.primaryImage,
        });
        setPreviewImages(previewImages.filter((url) => url !== photoUrl));
    };

    const handleSetPrimaryImage = (photoUrl) => {
        setFormData({ ...formData, primaryImage: photoUrl });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const data = new FormData();
            if (formData.gymName) data.append('gymName', formData.gymName);
            if (formData.address) data.append('address', formData.address);
            if (formData.ownerName) data.append('ownerName', formData.ownerName);
            if (formData.ownerEmail) data.append('ownerEmail', formData.ownerEmail);
            if (formData.primaryImage) data.append('primaryImage', formData.primaryImage);

            const membershipPlans = Array.isArray(formData.membershipPlans) ? formData.membershipPlans : [];
            data.append('membershipPlans', JSON.stringify(membershipPlans));

            if (formData.deletePhotos.length > 0) {
                data.append('deletePhotos', JSON.stringify(formData.deletePhotos));
            }

            formData.photos.forEach((photo) => {
                if (photo instanceof File) {
                    data.append('photos', photo);
                }
            });

            const res = await axios.put(`${API_URL}/gym/update`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            setFormData({
                ...formData,
                photos: [],
                deletePhotos: [],
            });
            setPreviewImages(res.data.gym.photos || []);
            setSuccess('Gym details updated successfully');
            toast.success('Gym details updated successfully', { position: 'top-right' });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update gym details');
            toast.error(err.response?.data?.message || 'Failed to update gym details', { position: 'top-right' });
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

    if (user?.role !== 'gym') {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 transition-colors duration-300">
                <motion.p
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="text-red-500 text-lg sm:text-xl font-semibold text-center"
                >
                    Access denied. This page is only for Gym Profiles.
                </motion.p>
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
                    Update Gym Details
                </motion.h1>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-8 text-center"
                    >
                        {error}
                    </motion.div>
                )}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-500/10 border border-green-500/50 text-green-500 p-4 rounded-xl mb-8 text-center"
                    >
                        {success}
                    </motion.div>
                )}

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeIn}
                    className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-color)]"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <motion.div variants={fadeIn}>
                                <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">
                                    Gym Name
                                </label>
                                <input
                                    type="text"
                                    name="gymName"
                                    value={formData.gymName}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                />
                            </motion.div>
                            <motion.div variants={fadeIn}>
                                <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                />
                            </motion.div>
                            <motion.div variants={fadeIn}>
                                <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">
                                    Owner Name
                                </label>
                                <input
                                    type="text"
                                    name="ownerName"
                                    value={formData.ownerName}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                />
                            </motion.div>
                            <motion.div variants={fadeIn}>
                                <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">
                                    Owner Email
                                </label>
                                <input
                                    type="email"
                                    name="ownerEmail"
                                    value={formData.ownerEmail}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                />
                            </motion.div>
                        </div>

                        <div className="pt-6 border-t border-[var(--border-color)]">
                            <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">Membership Plans</h3>
                            {formData.membershipPlans.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                    {formData.membershipPlans.map((plan, index) => (
                                        <motion.div
                                            key={index}
                                            className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)] flex items-center justify-between group"
                                            initial="hidden"
                                            whileInView="visible"
                                            viewport={{ once: true }}
                                            variants={zoomIn}
                                        >
                                            <div>
                                                <p className="text-[var(--text-primary)] font-medium">{plan.duration}</p>
                                                <p className="text-blue-400 font-bold">Rs {plan.price}</p>
                                            </div>
                                            <motion.button
                                                type="button"
                                                onClick={() => removeMembershipPlan(index)}
                                                whileHover={{ scale: 1.1 }}
                                                className="text-red-500 bg-red-500/10 p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </motion.button>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[var(--text-secondary)] italic mb-6">No membership plans added yet</p>
                            )}

                            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl border border-[var(--border-color)]">
                                <h4 className="text-[var(--text-primary)] font-medium mb-4">Add New Plan</h4>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            name="duration"
                                            value={newMembershipPlan.duration}
                                            onChange={handleMembershipChange}
                                            className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Duration (e.g., 1 month)"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="number"
                                            name="price"
                                            value={newMembershipPlan.price}
                                            onChange={handleMembershipChange}
                                            min="0"
                                            step="0.01"
                                            className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Price (Rs)"
                                        />
                                    </div>
                                    <motion.button
                                        type="button"
                                        onClick={addMembershipPlan}
                                        whileHover="hover"
                                        variants={buttonHover}
                                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all duration-300 whitespace-nowrap"
                                    >
                                        Add Plan
                                    </motion.button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-[var(--border-color)]">
                            <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">Gym Photos</h3>
                            {previewImages.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                    {previewImages.map((photo, index) => (
                                        <motion.div
                                            key={index}
                                            className="relative group aspect-square rounded-xl overflow-hidden"
                                            initial="hidden"
                                            whileInView="visible"
                                            viewport={{ once: true }}
                                            variants={zoomIn}
                                        >
                                            <img
                                                src={photo}
                                                alt={`Gym ${index}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                                                <motion.button
                                                    type="button"
                                                    onClick={() => handleSetPrimaryImage(photo)}
                                                    whileHover={{ scale: 1.1 }}
                                                    className={`p-2 rounded-full ${formData.primaryImage === photo ? 'bg-yellow-400 text-white' : 'bg-white/20 text-white hover:bg-yellow-400'}`}
                                                    title="Set as Primary Image"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                </motion.button>
                                                <motion.button
                                                    type="button"
                                                    onClick={() => handleDeletePhoto(photo)}
                                                    whileHover={{ scale: 1.1 }}
                                                    className="bg-red-600 text-white p-2 rounded-full"
                                                    title="Delete Photo"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </motion.button>
                                            </div>
                                            {formData.primaryImage === photo && (
                                                <div className="absolute top-2 right-2 bg-yellow-400 text-white p-1 rounded-full shadow-md">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                            <motion.div variants={fadeIn}>
                                <label className="block w-full cursor-pointer bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-xl p-8 text-center hover:border-blue-500 hover:bg-[var(--bg-secondary)]/80 transition-all duration-300">
                                    <input
                                        type="file"
                                        name="photos"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                        multiple
                                        accept="image/*"
                                    />
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[var(--text-secondary)] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-[var(--text-primary)] font-medium">Click to upload photos</p>
                                    <p className="text-[var(--text-secondary)] text-sm mt-1">SVG, PNG, JPG or GIF (max. 5MB)</p>
                                </label>
                            </motion.div>
                        </div>

                        <motion.button
                            type="submit"
                            whileHover="hover"
                            variants={buttonHover}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all duration-300 mt-8"
                        >
                            Update Gym Details
                        </motion.button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default UpdateGym;
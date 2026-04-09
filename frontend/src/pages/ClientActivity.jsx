import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const ClientActivity = () => {
    const { user } = useContext(AuthContext);
    const { memberId } = useParams();
    const [activeTab, setActiveTab] = useState('workouts');
    const [clientData, setClientData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null); // { type, id, parentId }
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        if (memberId && user?.role === 'trainer') {
            fetchClientActivity();
        }
    }, [memberId, user]);

    const fetchClientActivity = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/trainer/clients/${memberId}/activity`, { headers });
            setClientData(res.data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to load client activity', { position: 'top-right' });
        } finally {
            setLoading(false);
        }
    };

    const handlePostComment = async () => {
        if (!commentText.trim() || !replyingTo) return;

        try {
            setSubmittingComment(true);
            const payload = {
                memberId,
                comment: commentText,
                targetType: replyingTo.type,
                targetId: replyingTo.id,
                parentId: replyingTo.parentId || null
            };

            const res = await axios.post(`${API_URL}/trainer/comments`, payload, { headers });
            
            // Add new comment to state
            setClientData(prev => ({
                ...prev,
                comments: [...prev.comments, res.data]
            }));

            setCommentText('');
            setReplyingTo(null);
            toast.success('Comment posted', { position: 'bottom-right' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to post comment', { position: 'top-right' });
        } finally {
            setSubmittingComment(false);
        }
    };

    // Helper to get comments for a specific log
    const getCommentsForLog = (type, logId) => {
        if (!clientData?.comments) return [];
        return clientData.comments.filter(c => c.targetType === type && c.targetId === logId);
    };

    // Helper to structure threaded comments
    const buildCommentThread = (commentsList) => {
        const rootComments = commentsList.filter(c => !c.parentId);
        const mapChildren = (parent) => {
            const children = commentsList.filter(c => c.parentId === parent._id);
            return {
                ...parent,
                replies: children.map(mapChildren)
            };
        };
        return rootComments.map(mapChildren);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4 flex justify-center items-start pt-32">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!clientData || !clientData.member) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
                <p className="text-red-500 font-bold">Client not found or you don't have access.</p>
            </div>
        );
    }

    const { member, workoutLogs, macroLogs } = clientData;

    // Animation variants
    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    // Render a single comment thread item
    const CommentThread = ({ node, isReply = false }) => {
        return (
            <div className={`flex gap-3 ${isReply ? 'mt-3 pl-8 sm:pl-12 relative before:absolute before:left-4 sm:before:left-6 before:top-0 before:w-px before:-bottom-3 before:bg-[var(--border-color)]' : 'mt-4'}`}>
                <div className="flex-shrink-0 z-10 bg-[var(--bg-card)]">
                    {node.author?.profileImage ? (
                        <img src={node.author.profileImage} alt="" className="w-8 h-8 rounded-full object-cover border border-[var(--border-color)]" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold text-xs border border-blue-500/30">
                            {node.author?.name?.charAt(0)?.toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="flex-grow">
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl rounded-tl-sm p-3 shadow-sm">
                        <div className="flex justify-between items-start gap-2 mb-1">
                            <span className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                                {node.author?.name}
                                {node.authorModel === 'Trainer' && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider bg-purple-500/15 text-purple-400">Trainer</span>
                                )}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
                                {new Date(node.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{node.comment}</p>
                    </div>
                    
                    {!isReply && (
                        <button 
                            onClick={() => setReplyingTo({ type: node.targetType, id: node.targetId, parentId: node._id })}
                            className="text-xs text-[var(--text-secondary)] hover:text-blue-500 font-medium ml-2 mt-1.5 flex items-center gap-1 transition-colors"
                        >
                            <span>↳</span> Reply
                        </button>
                    )}

                    {node.replies && node.replies.length > 0 && (
                        <div className="mt-2">
                            {node.replies.map(reply => (
                                <CommentThread key={reply._id} node={reply} isReply={true} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Render Reply Input Box
    const ReplyBox = ({ targetType, targetId }) => {
        const isReplyingHere = replyingTo?.type === targetType && replyingTo?.id === targetId;
        if (!isReplyingHere) return null;

        return (
            <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                className="mt-4 flex gap-3 items-end"
            >
                <div className="flex-grow">
                    <textarea 
                        autoFocus
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={`Write your feedback...`}
                        className="w-full bg-[var(--bg-secondary)] border border-blue-500/40 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                        rows="2"
                    />
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                    <button 
                        onClick={handlePostComment}
                        disabled={submittingComment || !commentText.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20"
                    >
                        {submittingComment ? '...' : 'Post'}
                    </button>
                    <button 
                        onClick={() => { setReplyingTo(null); setCommentText(''); }}
                        className="px-4 py-1 flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-xl text-xs hover:bg-[var(--bg-primary)] transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            {/* Header */}
            <div className="container mx-auto max-w-4xl relative z-10 mb-8">
                <Link to="/client-roster" className="text-blue-500 hover:text-blue-400 flex items-center gap-1 font-medium mb-6 transition-colors w-fit">
                    <span>←</span> Back to Roster
                </Link>

                <div className="bg-[var(--bg-card)]/80 backdrop-blur-md border border-[var(--border-color)] rounded-3xl p-6 flex items-center gap-5 shadow-xl">
                    {member.profileImage ? (
                        <img src={member.profileImage} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-[var(--bg-primary)] shadow-md" />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl border-4 border-[var(--bg-primary)] shadow-md">
                            {member.name?.charAt(0)?.toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">{member.name}'s Activity</h1>
                        <p className="text-[var(--text-secondary)]">Review logs and provide feedback (Last 7 Days)</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto max-w-4xl relative z-10">
                {/* Tabs */}
                <div className="flex gap-2 p-1 bg-[var(--bg-secondary)] rounded-2xl mb-6 w-full lg:w-fit">
                    <button
                        onClick={() => setActiveTab('workouts')}
                        className={`flex-1 lg:w-48 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex justify-center items-center gap-2 ${
                            activeTab === 'workouts' ? 'bg-blue-600 text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                        }`}
                    >
                        🏃‍♂️ Workout Logs
                    </button>
                    <button
                        onClick={() => setActiveTab('macros')}
                        className={`flex-1 lg:w-48 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex justify-center items-center gap-2 ${
                            activeTab === 'macros' ? 'bg-orange-500 text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                        }`}
                    >
                        🥗 Macro Logs
                    </button>
                </div>

                {/* Content Area */}
                <div className="space-y-6">
                    {activeTab === 'workouts' && (
                        workoutLogs.length > 0 ? (
                            workoutLogs.map(log => {
                                const logComments = getCommentsForLog('workout_log', log._id);
                                const thread = buildCommentThread(logComments);
                                
                                return (
                                    <motion.div key={log._id} variants={fadeIn} initial="hidden" animate="visible" className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-lg">
                                        <div className="flex justify-between items-start mb-4 border-b border-[var(--border-color)] pb-4">
                                            <div>
                                                <span className="px-2.5 py-1 bg-blue-500/10 text-blue-500 font-bold text-xs rounded-lg uppercase tracking-wide border border-blue-500/20 mb-2 inline-block">Workout</span>
                                                <h3 className="font-bold text-lg text-[var(--text-primary)]">
                                                    {new Date(log.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                                </h3>
                                            </div>
                                            {/* Action Button */}
                                            <button 
                                                onClick={() => setReplyingTo({ type: 'workout_log', id: log._id, parentId: null })}
                                                className="text-sm font-medium px-4 py-2 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500/20 transition-colors flex items-center gap-2"
                                            >
                                                💬 Add Feedback
                                            </button>
                                        </div>
                                        
                                        <div className="bg-[var(--bg-secondary)]/50 p-4 rounded-2xl border border-[var(--border-color)] mb-4">
                                            <p className="text-[var(--text-primary)]"><span className="text-[var(--text-secondary)] font-medium">Notes:</span> {log.note || 'No notes provided.'}</p>
                                        </div>

                                        {/* Threads */}
                                        {thread.map(node => <CommentThread key={node._id} node={node} />)}
                                        <ReplyBox targetType="workout_log" targetId={log._id} />
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]">
                                <span className="text-4xl mb-4 block">🏃‍♂️</span>
                                <h3 className="text-lg font-bold text-[var(--text-primary)]">No recent workouts</h3>
                                <p className="text-[var(--text-secondary)]">This client hasn't logged any workouts in the last 7 days.</p>
                            </div>
                        )
                    )}

                    {activeTab === 'macros' && (
                        macroLogs.length > 0 ? (
                            macroLogs.map(log => {
                                const logComments = getCommentsForLog('macro_log', log._id);
                                const thread = buildCommentThread(logComments);
                                
                                return (
                                    <motion.div key={log._id} variants={fadeIn} initial="hidden" animate="visible" className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-lg">
                                        <div className="flex justify-between items-start mb-4 border-b border-[var(--border-color)] pb-4">
                                            <div>
                                                <span className="px-2.5 py-1 bg-orange-500/10 text-orange-500 font-bold text-xs rounded-lg uppercase tracking-wide border border-orange-500/20 mb-2 inline-block">Macro Log</span>
                                                <h3 className="font-bold text-lg text-[var(--text-primary)]">
                                                    {log.food}
                                                </h3>
                                                <p className="text-sm text-[var(--text-secondary)]">
                                                    {new Date(log.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => setReplyingTo({ type: 'macro_log', id: log._id, parentId: null })}
                                                className="text-sm font-medium px-4 py-2 bg-orange-500/10 text-orange-500 rounded-xl hover:bg-orange-500/20 transition-colors flex items-center gap-2"
                                            >
                                                💬 Add Feedback
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2 mb-4">
                                            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-3 text-center">
                                                <span className="block text-xs text-[var(--text-secondary)] mb-1">Cals</span>
                                                <span className="font-bold text-[var(--text-primary)]">{log.macros?.calories}</span>
                                            </div>
                                            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-3 text-center">
                                                <span className="block text-xs text-blue-400 mb-1">Protein</span>
                                                <span className="font-bold text-[var(--text-primary)]">{log.macros?.protein}g</span>
                                            </div>
                                            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-3 text-center">
                                                <span className="block text-xs text-orange-400 mb-1">Carbs</span>
                                                <span className="font-bold text-[var(--text-primary)]">{log.macros?.carbs}g</span>
                                            </div>
                                            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-3 text-center">
                                                <span className="block text-xs text-yellow-500 mb-1">Fats</span>
                                                <span className="font-bold text-[var(--text-primary)]">{log.macros?.fats}g</span>
                                            </div>
                                        </div>

                                        {/* Threads */}
                                        {thread.map(node => <CommentThread key={node._id} node={node} />)}
                                        <ReplyBox targetType="macro_log" targetId={log._id} />
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]">
                                <span className="text-4xl mb-4 block">🥗</span>
                                <h3 className="text-lg font-bold text-[var(--text-primary)]">No recent macro logs</h3>
                                <p className="text-[var(--text-secondary)]">This client hasn't logged any food in the last 7 days.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientActivity;

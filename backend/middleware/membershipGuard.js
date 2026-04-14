const Member = require('../models/Member');
const Gym = require('../models/Gym');
const MembershipRequest = require('../models/MembershipRequest');
const logger = require('../utils/logger');

/**
 * Middleware: membershipGuard
 * Checks if the requesting member has an active or grace-period membership.
 * - 'active' / 'grace': allowed through
 * - 'suspended' (5-10 days past expiry): blocked with 403
 * - 'terminated' (>10 days past expiry): auto-removes member from gym and blocks
 * - Non-member roles (gym, trainer, admin) are always allowed through.
 */
const membershipGuard = async (req, res, next) => {
    try {
        // Only enforce for members
        if (req.user.role !== 'member') return next();

        const member = await Member.findById(req.user.id);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        const status = member.membershipStatus; // virtual field

        if (status === 'active' || status === 'grace') {
            return next(); // allowed
        }

        if (status === 'terminated') {
            // Auto-remove member from gym
            if (member.gym) {
                const gym = await Gym.findById(member.gym);
                if (gym) {
                    gym.members = gym.members.filter(
                        (id) => id.toString() !== member._id.toString()
                    );
                    await gym.save();
                }

                // Remove any pending membership requests
                await MembershipRequest.deleteMany({
                    member: member._id,
                    gym: member.gym,
                    status: 'pending',
                });

                member.gym = undefined;
                member.membership = undefined;
                await member.save();

                logger.info(`Member ${member._id} auto-terminated due to >10 days inactivity`);
            }

            return res.status(403).json({
                message: 'Your membership has been terminated due to prolonged inactivity. Please send a new join request to rejoin a gym.',
                membershipStatus: 'terminated',
            });
        }

        // 'suspended' (5-10 days past) or 'none'
        return res.status(403).json({
            message: 'Your membership has expired. Please renew to access this feature.',
            membershipStatus: status,
        });
    } catch (error) {
        logger.error('membershipGuard error:', error);
        next(error);
    }
};

module.exports = membershipGuard;

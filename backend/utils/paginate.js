/**
 * Apply pagination to a Mongoose query based on request query params.
 * 
 * Usage:
 *   const query = Model.find({ status: 'active' }).sort({ createdAt: -1 });
 *   const result = await paginate(Model, { status: 'active' }, query, req);
 *   res.json(result);
 * 
 * Query params: ?page=1&limit=10
 * Defaults: page=1, limit=10, max limit=50
 * 
 * Returns: { data: [...], pagination: { page, limit, total, totalPages } }
 */
const paginate = async (Model, filter, query, req) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        query.skip(skip).limit(limit),
        Model.countDocuments(filter),
    ]);

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

module.exports = paginate;

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const configureCloudinary = require('./config/cloudinary');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const gymRoutes = require('./routes/gym');
const memberRoutes = require('./routes/member');
const chatRoutes = require('./routes/chat');
const trainerRoutes = require('./routes/trainer');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const { createServer } = require('http');
const { Server } = require('socket.io');
const initializeSocket = require('./socket');
const logger = require('./utils/logger');



dotenv.config();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:5173', 'https://easyfittrack.netlify.app'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
});


// Middleware: CORS must be first so all responses (including 429) include CORS headers
app.use(cors({
    origin: ['http://localhost:5173', 'https://easyfittrack.netlify.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Security: Helmet sets secure HTTP headers
app.use(helmet());

// Rate Limiting: Global limiter (100 requests per 15 minutes per IP)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later' },
});
app.use(globalLimiter);

// Rate Limiting: Strict limiter for login/register (30 requests per 15 minutes per IP)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many authentication attempts, please try again later' },
});

app.use(express.json());

// Connect to MongoDB and Cloudinary
connectDB();
configureCloudinary();

// Make io accessible to routes
app.set('socketio', io);

// Initialize Socket.IO event handlers
initializeSocket(io);

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/gym', gymRoutes);
app.use('/api/member', memberRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/analytics', require('./routes/analytics'));

// Test Route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is running' });
});

// Global Error Handler (must be after all routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
if (process.env.NODE_ENV !== 'test') {
    httpServer.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
}

module.exports = app;

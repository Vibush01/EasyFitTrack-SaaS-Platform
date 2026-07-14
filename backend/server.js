import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import connectDB from './config/db.js';
import configureCloudinary from './config/cloudinary.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import gymRoutes from './routes/gym.js';
import memberRoutes from './routes/member.js';
import chatRoutes from './routes/chat.js';
import trainerRoutes from './routes/trainer.js';
import adminRoutes from './routes/admin.js';
import contactRoutes from './routes/contact.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import initializeSocket from './socket/index.js';
import logger from './utils/logger.js';
import analyticsRoutes from './routes/analytics.js';

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
app.use(
    cors({
        origin: ['http://localhost:5173', 'https://easyfittrack.netlify.app'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }),
);

// Security: Helmet sets secure HTTP headers
app.use(helmet());

// Rate Limiting: Global limiter (2000 requests per 15 minutes per IP)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 2000,
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

// API Documentation (Swagger UI)
app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customSiteTitle: 'EasyFitTrack API Docs',
        customCss: '.swagger-ui .topbar { display: none }',
    }),
);

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/gym', gymRoutes);
app.use('/api/member', memberRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/analytics', analyticsRoutes);

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

export default app;

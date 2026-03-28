const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'EasyFitTrack API',
            version: '1.0.0',
            description:
                'Enterprise-grade REST API for EasyFitTrack — a comprehensive gym management and fitness tracking platform. Supports role-based access for Admins, Gym Owners, Trainers, and Members.',
            contact: {
                name: 'EasyFitTrack Support',
            },
            license: {
                name: 'MIT',
            },
        },
        servers: [
            {
                url: '/api',
                description: 'API base path',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token obtained from the login endpoint',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            description: 'Error message',
                        },
                    },
                },
                Pagination: {
                    type: 'object',
                    properties: {
                        total: { type: 'integer', description: 'Total number of records' },
                        page: { type: 'integer', description: 'Current page number' },
                        limit: { type: 'integer', description: 'Records per page' },
                        pages: { type: 'integer', description: 'Total number of pages' },
                    },
                },
                PaginatedResponse: {
                    type: 'object',
                    properties: {
                        data: {
                            type: 'array',
                            items: { type: 'object' },
                            description: 'Array of results for the current page',
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                    },
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        token: { type: 'string', description: 'JWT authentication token' },
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                email: { type: 'string' },
                                role: {
                                    type: 'string',
                                    enum: ['admin', 'gym', 'trainer', 'member'],
                                },
                            },
                        },
                    },
                },
                Gym: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        gymName: { type: 'string' },
                        email: { type: 'string' },
                        address: { type: 'string' },
                        phone: { type: 'string' },
                        description: { type: 'string' },
                        photos: { type: 'array', items: { type: 'string' } },
                        primaryImage: { type: 'string' },
                        membershipPlans: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    duration: { type: 'string' },
                                    price: { type: 'number' },
                                },
                            },
                        },
                        members: { type: 'array', items: { type: 'string' } },
                        trainers: { type: 'array', items: { type: 'string' } },
                        role: { type: 'string', enum: ['gym'] },
                    },
                },
                Member: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        gym: { type: 'string' },
                        membership: {
                            type: 'object',
                            properties: {
                                duration: { type: 'string' },
                                startDate: { type: 'string', format: 'date-time' },
                                endDate: { type: 'string', format: 'date-time' },
                            },
                        },
                        role: { type: 'string', enum: ['member'] },
                    },
                },
                Trainer: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        gym: { type: 'string' },
                        specialization: { type: 'string' },
                        experience: {
                            type: 'object',
                            properties: {
                                years: { type: 'integer' },
                                months: { type: 'integer' },
                            },
                        },
                        role: { type: 'string', enum: ['trainer'] },
                    },
                },
                WorkoutPlan: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        trainer: { type: 'string' },
                        member: { type: 'string' },
                        gym: { type: 'string' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        exercises: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    sets: { type: 'integer' },
                                    reps: { type: 'integer' },
                                    rest: { type: 'string' },
                                },
                            },
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                DietPlan: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        trainer: { type: 'string' },
                        member: { type: 'string' },
                        gym: { type: 'string' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        meals: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    calories: { type: 'number' },
                                    protein: { type: 'number' },
                                    carbs: { type: 'number' },
                                    fats: { type: 'number' },
                                    time: { type: 'string' },
                                },
                            },
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                MacroLog: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        member: { type: 'string' },
                        food: { type: 'string' },
                        macros: {
                            type: 'object',
                            properties: {
                                calories: { type: 'number' },
                                protein: { type: 'number' },
                                carbs: { type: 'number' },
                                fats: { type: 'number' },
                            },
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                ProgressLog: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        member: { type: 'string' },
                        weight: { type: 'number' },
                        muscleMass: { type: 'number' },
                        fatPercentage: { type: 'number' },
                        images: { type: 'array', items: { type: 'string' } },
                        date: { type: 'string', format: 'date-time' },
                    },
                },
                WorkoutLog: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        member: { type: 'string' },
                        date: { type: 'string', format: 'date' },
                        note: { type: 'string', maxLength: 200 },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                StreakResponse: {
                    type: 'object',
                    properties: {
                        currentStreak: {
                            type: 'integer',
                            description: 'Current consecutive workout days',
                        },
                        longestStreak: {
                            type: 'integer',
                            description: 'Longest consecutive run in history',
                        },
                        totalWorkouts: {
                            type: 'integer',
                            description: 'Total logged workouts all-time',
                        },
                        todayLogged: {
                            type: 'boolean',
                            description: 'Whether today is already logged',
                        },
                        last7Days: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    date: { type: 'string', format: 'date' },
                                    logged: { type: 'boolean' },
                                },
                            },
                            description: 'Last 7 days activity tracker',
                        },
                    },
                },
                Announcement: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        gym: { type: 'string' },
                        sender: { type: 'string' },
                        senderModel: { type: 'string' },
                        message: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' },
                    },
                },
                ChatMessage: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        sender: { type: 'string' },
                        senderModel: { type: 'string' },
                        receiver: { type: 'string' },
                        receiverModel: { type: 'string' },
                        gym: { type: 'string' },
                        message: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' },
                    },
                },
                ContactMessage: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        phone: { type: 'string' },
                        subject: { type: 'string' },
                        message: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                PlanRequest: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        member: { type: 'string' },
                        trainer: { type: 'string' },
                        gym: { type: 'string' },
                        requestType: { type: 'string', enum: ['workout', 'diet'] },
                        status: {
                            type: 'string',
                            enum: ['pending', 'approved', 'denied', 'fulfilled'],
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                MembershipRequest: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        member: { type: 'string' },
                        gym: { type: 'string' },
                        requestedDuration: { type: 'string' },
                        status: { type: 'string', enum: ['pending', 'approved', 'denied'] },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                TrainerSchedule: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        trainer: { type: 'string' },
                        gym: { type: 'string' },
                        startTime: { type: 'string', format: 'date-time' },
                        endTime: { type: 'string', format: 'date-time' },
                        status: { type: 'string', enum: ['available', 'booked'] },
                        bookedBy: { type: 'string' },
                    },
                },
                JoinRequest: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        user: { type: 'string' },
                        userModel: { type: 'string', enum: ['Member', 'Trainer'] },
                        gym: { type: 'string' },
                        status: { type: 'string', enum: ['pending', 'approved', 'denied'] },
                        membershipDuration: { type: 'string' },
                    },
                },
            },
        },
        tags: [
            { name: 'Auth', description: 'Authentication & profile management' },
            { name: 'Gym', description: 'Gym browsing, management & membership' },
            { name: 'Member', description: 'Member operations — macros, progress, membership' },
            { name: 'Trainer', description: 'Trainer operations — plans, schedules, sessions' },
            { name: 'Chat', description: 'Messaging & announcements' },
            { name: 'Admin', description: 'Admin dashboard & gym management' },
            { name: 'Contact', description: 'Public contact form & messages' },
            { name: 'Analytics', description: 'Event logging & analytics' },
        ],
    },
    apis: ['./docs/swagger/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

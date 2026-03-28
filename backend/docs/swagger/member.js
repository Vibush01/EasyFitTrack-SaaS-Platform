// =============================================
// Member Routes — JSDoc Swagger Annotations
// =============================================

/**
 * @swagger
 * /member/macros:
 *   post:
 *     summary: Log a macro entry (Member only)
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [food, macros]
 *             properties:
 *               food:
 *                 type: string
 *                 example: Chicken Breast
 *               macros:
 *                 type: object
 *                 required: [calories, protein, carbs, fats]
 *                 properties:
 *                   calories:
 *                     type: number
 *                     example: 250
 *                   protein:
 *                     type: number
 *                     example: 45
 *                   carbs:
 *                     type: number
 *                     example: 0
 *                   fats:
 *                     type: number
 *                     example: 5
 *     responses:
 *       201:
 *         description: Macro logged
 *       403:
 *         description: Access denied
 *   get:
 *     summary: Get all macro logs (Member only, paginated)
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated macro logs
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MacroLog'
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /member/macros/{id}:
 *   put:
 *     summary: Update a macro log entry (Member only)
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               food:
 *                 type: string
 *               macros:
 *                 type: object
 *                 properties:
 *                   calories:
 *                     type: number
 *                   protein:
 *                     type: number
 *                   carbs:
 *                     type: number
 *                   fats:
 *                     type: number
 *     responses:
 *       200:
 *         description: Macro log updated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Macro log not found
 *   delete:
 *     summary: Delete a macro log entry (Member only)
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Macro log deleted
 *       403:
 *         description: Access denied
 *       404:
 *         description: Macro log not found
 */

/**
 * @swagger
 * /member/progress:
 *   post:
 *     summary: Log a progress entry with images (Member only)
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [weight, muscleMass, fatPercentage]
 *             properties:
 *               weight:
 *                 type: number
 *                 example: 75.5
 *               muscleMass:
 *                 type: number
 *                 example: 35
 *               fatPercentage:
 *                 type: number
 *                 example: 18.5
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 3 progress images
 *     responses:
 *       201:
 *         description: Progress logged
 *       403:
 *         description: Access denied
 *   get:
 *     summary: Get all progress logs (Member only, paginated)
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated progress logs
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ProgressLog'
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /member/progress/{id}:
 *   put:
 *     summary: Update a progress log (Member only)
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               weight:
 *                 type: number
 *               muscleMass:
 *                 type: number
 *               fatPercentage:
 *                 type: number
 *               deleteImages:
 *                 type: string
 *                 description: JSON array of image URLs to delete
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Progress log updated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Progress log not found
 *   delete:
 *     summary: Delete a progress log (Member only)
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Progress log deleted
 *       403:
 *         description: Access denied
 *       404:
 *         description: Progress log not found
 */

/**
 * @swagger
 * /member/workout-log:
 *   post:
 *     summary: Log a workout for today or a specific date (Member only)
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Optional ISO 8601 date (defaults to today)
 *                 example: "2026-03-28"
 *               note:
 *                 type: string
 *                 maxLength: 200
 *                 description: Optional workout note
 *                 example: "Leg day 🦵"
 *     responses:
 *       201:
 *         description: Workout logged
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 workoutLog:
 *                   $ref: '#/components/schemas/WorkoutLog'
 *       403:
 *         description: Access denied
 *       409:
 *         description: Workout already logged for this date
 *   get:
 *     summary: Get workout logs (Member only, paginated)
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days of history to fetch (1–365)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated workout logs
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/WorkoutLog'
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /member/workout-log/{id}:
 *   delete:
 *     summary: Delete a workout log entry (Member only)
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workout log deleted
 *       403:
 *         description: Access denied or not authorized
 *       404:
 *         description: Workout log not found
 */

/**
 * @swagger
 * /member/streak:
 *   get:
 *     summary: Get workout streak statistics (Member only)
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Streak statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StreakResponse'
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /member/leave-gym:
 *   post:
 *     summary: Leave current gym (Member only)
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Left gym successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Member not found or not in a gym
 */

/**
 * @swagger
 * /member/membership-request:
 *   post:
 *     summary: Request a membership update (Member only)
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [requestedDuration]
 *             properties:
 *               requestedDuration:
 *                 type: string
 *                 example: 3 Months
 *     responses:
 *       201:
 *         description: Membership request sent
 *       403:
 *         description: Access denied
 *       404:
 *         description: Member not found or not in a gym
 */

/**
 * @swagger
 * /member/membership-requests:
 *   get:
 *     summary: Get own membership requests (Member only, paginated)
 *     tags: [Member]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated membership requests
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MembershipRequest'
 *       403:
 *         description: Access denied
 */

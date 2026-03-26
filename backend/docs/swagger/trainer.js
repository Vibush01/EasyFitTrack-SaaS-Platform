// =============================================
// Trainer Routes — JSDoc Swagger Annotations
// =============================================

// --- Workout Plans ---

/**
 * @swagger
 * /trainer/workout-plans:
 *   post:
 *     summary: Create a workout plan for a member (Trainer only)
 *     tags: [Trainer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [memberId, title, exercises]
 *             properties:
 *               memberId:
 *                 type: string
 *               title:
 *                 type: string
 *                 example: Upper Body Strength
 *               description:
 *                 type: string
 *               exercises:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [name, sets, reps]
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Bench Press
 *                     sets:
 *                       type: integer
 *                       example: 4
 *                     reps:
 *                       type: integer
 *                       example: 10
 *                     rest:
 *                       type: string
 *                       example: 90s
 *     responses:
 *       201:
 *         description: Workout plan created
 *       403:
 *         description: Access denied
 *   get:
 *     summary: Get all workout plans by trainer (paginated)
 *     tags: [Trainer]
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
 *         description: Paginated workout plans
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
 *                         $ref: '#/components/schemas/WorkoutPlan'
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /trainer/workout-plans/{id}:
 *   put:
 *     summary: Update a workout plan (Trainer only)
 *     tags: [Trainer]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               exercises:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     sets:
 *                       type: integer
 *                     reps:
 *                       type: integer
 *                     rest:
 *                       type: string
 *     responses:
 *       200:
 *         description: Workout plan updated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Workout plan not found
 *   delete:
 *     summary: Delete a workout plan (Trainer only)
 *     tags: [Trainer]
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
 *         description: Workout plan deleted
 *       403:
 *         description: Access denied
 *       404:
 *         description: Workout plan not found
 */

// --- Diet Plans ---

/**
 * @swagger
 * /trainer/diet-plans:
 *   post:
 *     summary: Create a diet plan for a member (Trainer only)
 *     tags: [Trainer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [memberId, title, meals]
 *             properties:
 *               memberId:
 *                 type: string
 *               title:
 *                 type: string
 *                 example: High Protein Diet
 *               description:
 *                 type: string
 *               meals:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [name, calories, protein, carbs, fats]
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Breakfast
 *                     calories:
 *                       type: number
 *                       example: 500
 *                     protein:
 *                       type: number
 *                       example: 40
 *                     carbs:
 *                       type: number
 *                       example: 50
 *                     fats:
 *                       type: number
 *                       example: 15
 *                     time:
 *                       type: string
 *                       example: 8:00 AM
 *     responses:
 *       201:
 *         description: Diet plan created
 *       403:
 *         description: Access denied
 *   get:
 *     summary: Get all diet plans by trainer (paginated)
 *     tags: [Trainer]
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
 *         description: Paginated diet plans
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
 *                         $ref: '#/components/schemas/DietPlan'
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /trainer/diet-plans/{id}:
 *   put:
 *     summary: Update a diet plan (Trainer only)
 *     tags: [Trainer]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               meals:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     calories:
 *                       type: number
 *                     protein:
 *                       type: number
 *                     carbs:
 *                       type: number
 *                     fats:
 *                       type: number
 *                     time:
 *                       type: string
 *     responses:
 *       200:
 *         description: Diet plan updated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Diet plan not found
 *   delete:
 *     summary: Delete a diet plan (Trainer only)
 *     tags: [Trainer]
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
 *         description: Diet plan deleted
 *       403:
 *         description: Access denied
 *       404:
 *         description: Diet plan not found
 */

// --- Schedules (Legacy) ---

/**
 * @swagger
 * /trainer/schedules:
 *   post:
 *     summary: Schedule a workout session (Trainer only, legacy)
 *     tags: [Trainer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [memberId, workoutPlanId, dateTime]
 *             properties:
 *               memberId:
 *                 type: string
 *               workoutPlanId:
 *                 type: string
 *               dateTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Session scheduled
 *       403:
 *         description: Access denied
 *   get:
 *     summary: Get all schedules (Trainer only, legacy)
 *     tags: [Trainer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of workout schedules
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /trainer/schedules/{id}:
 *   put:
 *     summary: Update a workout schedule (Trainer only, legacy)
 *     tags: [Trainer]
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
 *               dateTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Schedule updated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Schedule not found
 *   delete:
 *     summary: Delete a workout schedule (Trainer only, legacy)
 *     tags: [Trainer]
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
 *         description: Schedule deleted
 *       403:
 *         description: Access denied
 *       404:
 *         description: Schedule not found
 */

// --- Trainer Schedules (New) ---

/**
 * @swagger
 * /trainer/trainer-schedules:
 *   post:
 *     summary: Post a free schedule slot (Trainer only)
 *     tags: [Trainer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [startTime, endTime]
 *             properties:
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Schedule slot posted
 *       403:
 *         description: Access denied
 *   get:
 *     summary: Get all schedule slots (Trainer only)
 *     tags: [Trainer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of trainer schedule slots
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TrainerSchedule'
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /trainer/trainer-schedules/{id}:
 *   delete:
 *     summary: Delete a free schedule slot (Trainer only)
 *     tags: [Trainer]
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
 *         description: Schedule slot deleted
 *       400:
 *         description: Cannot delete a booked slot
 *       403:
 *         description: Access denied
 *       404:
 *         description: Schedule not found
 */

// --- Member-Facing Trainer Resources ---

/**
 * @swagger
 * /trainer/member/workout-plans:
 *   get:
 *     summary: Get workout plans assigned to a member (Member only)
 *     tags: [Trainer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of workout plans for the member
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WorkoutPlan'
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /trainer/member/diet-plans:
 *   get:
 *     summary: Get diet plans assigned to a member (Member only)
 *     tags: [Trainer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of diet plans for the member
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DietPlan'
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /trainer/member/available-schedules:
 *   get:
 *     summary: Get available schedule slots to book (Member only)
 *     tags: [Trainer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available schedule slots
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TrainerSchedule'
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /trainer/book-session/{scheduleId}:
 *   post:
 *     summary: Book a trainer session (Member only)
 *     tags: [Trainer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session booked successfully
 *       400:
 *         description: Slot already booked
 *       403:
 *         description: Access denied
 *       404:
 *         description: Schedule not found
 */

/**
 * @swagger
 * /trainer/member/booked-sessions:
 *   get:
 *     summary: Get booked sessions (Member only)
 *     tags: [Trainer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of booked sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TrainerSchedule'
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /trainer/member/schedules:
 *   get:
 *     summary: Get workout schedules for a member (Member only, legacy)
 *     tags: [Trainer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of workout schedules
 *       403:
 *         description: Access denied
 */

// --- Plan Requests ---

/**
 * @swagger
 * /trainer/plan-requests:
 *   post:
 *     summary: Request a workout or diet plan (Member only)
 *     tags: [Trainer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [trainerId, requestType]
 *             properties:
 *               trainerId:
 *                 type: string
 *               requestType:
 *                 type: string
 *                 enum: [workout, diet]
 *     responses:
 *       201:
 *         description: Plan request sent
 *       403:
 *         description: Access denied
 *   get:
 *     summary: Get plan requests for trainer (Trainer only, paginated)
 *     tags: [Trainer]
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
 *         description: Paginated plan requests
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
 *                         $ref: '#/components/schemas/PlanRequest'
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /trainer/member/plan-requests:
 *   get:
 *     summary: Get own plan requests (Member only, paginated)
 *     tags: [Trainer]
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
 *         description: Paginated plan requests
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
 *                         $ref: '#/components/schemas/PlanRequest'
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /trainer/plan-requests/{id}/action:
 *   post:
 *     summary: Approve or deny a plan request (Trainer only)
 *     tags: [Trainer]
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
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, deny]
 *     responses:
 *       200:
 *         description: Plan request processed
 *       403:
 *         description: Access denied
 *       404:
 *         description: Plan request not found
 */

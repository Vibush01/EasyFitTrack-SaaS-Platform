// =============================================
// Gym Routes — JSDoc Swagger Annotations
// =============================================

/**
 * @swagger
 * /gym:
 *   get:
 *     summary: Browse all gyms (paginated)
 *     tags: [Gym]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Paginated list of gyms
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
 *                         $ref: '#/components/schemas/Gym'
 */

/**
 * @swagger
 * /gym/{id}:
 *   get:
 *     summary: Get specific gym details
 *     tags: [Gym]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Gym ObjectId
 *     responses:
 *       200:
 *         description: Gym details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Gym'
 *       400:
 *         description: Invalid gym ID
 *       404:
 *         description: Gym not found
 */

/**
 * @swagger
 * /gym/join/{gymId}:
 *   post:
 *     summary: Send a join request to a gym
 *     tags: [Gym]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gymId
 *         required: true
 *         schema:
 *           type: string
 *         description: Target gym ObjectId
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               membershipDuration:
 *                 type: string
 *                 description: Required for members (e.g., '1 Month', '3 Months')
 *     responses:
 *       201:
 *         description: Join request sent
 *       400:
 *         description: Already a member/trainer or pending request exists
 *       403:
 *         description: Access denied (admin/gym roles)
 *       404:
 *         description: Gym not found
 */

/**
 * @swagger
 * /gym/update:
 *   put:
 *     summary: Update gym details (Gym only)
 *     tags: [Gym]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               gymName:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               description:
 *                 type: string
 *               membershipPlans:
 *                 type: string
 *                 description: JSON array of plan objects
 *               primaryImage:
 *                 type: string
 *               deletePhotos:
 *                 type: string
 *                 description: JSON array of photo URLs to delete
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: New photos to upload (max 5)
 *     responses:
 *       200:
 *         description: Gym updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Gym not found
 */

/**
 * @swagger
 * /gym/requests:
 *   get:
 *     summary: Get pending join requests (Gym/Trainer)
 *     tags: [Gym]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending join requests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/JoinRequest'
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /gym/requests/{requestId}/action:
 *   post:
 *     summary: Approve or deny a join request (Gym only)
 *     tags: [Gym]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
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
 *         description: Request processed
 *       403:
 *         description: Access denied
 *       404:
 *         description: Request not found
 */

/**
 * @swagger
 * /gym/members:
 *   get:
 *     summary: Get gym members list (Gym/Trainer)
 *     tags: [Gym]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of gym members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Member'
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /gym/members/{memberId}:
 *   delete:
 *     summary: Remove a member from the gym (Gym only)
 *     tags: [Gym]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed
 *       403:
 *         description: Access denied
 *       404:
 *         description: Member not found
 */

/**
 * @swagger
 * /gym/trainers:
 *   get:
 *     summary: Get gym trainers list (Gym only)
 *     tags: [Gym]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of gym trainers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Trainer'
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /gym/trainers/{trainerId}:
 *   delete:
 *     summary: Remove a trainer from the gym (Gym only)
 *     tags: [Gym]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trainerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trainer removed
 *       403:
 *         description: Access denied
 *       404:
 *         description: Trainer not found
 */

/**
 * @swagger
 * /gym/membership-requests:
 *   get:
 *     summary: Get membership update requests (Gym/Trainer)
 *     tags: [Gym]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of membership requests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MembershipRequest'
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /gym/membership-requests/{requestId}/action:
 *   post:
 *     summary: Approve or deny a membership request (Gym only)
 *     tags: [Gym]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
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
 *         description: Membership request processed
 *       403:
 *         description: Access denied
 *       404:
 *         description: Request not found
 */

// =============================================
// Chat Routes — JSDoc Swagger Annotations
// =============================================

/**
 * @swagger
 * /chat/messages/{gymId}/{receiverId}:
 *   get:
 *     summary: Get chat messages between two users in a gym
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gymId
 *         required: true
 *         schema:
 *           type: string
 *         description: Gym ObjectId
 *       - in: path
 *         name: receiverId
 *         required: true
 *         schema:
 *           type: string
 *         description: Receiver user ObjectId
 *     responses:
 *       200:
 *         description: List of chat messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChatMessage'
 *       403:
 *         description: Chat restriction violation
 *       404:
 *         description: Receiver not found
 */

/**
 * @swagger
 * /chat/announcements:
 *   post:
 *     summary: Post an announcement (Gym only)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 example: Gym will be closed on Sunday for maintenance
 *     responses:
 *       201:
 *         description: Announcement posted
 *       400:
 *         description: Message is required
 *       403:
 *         description: Access denied
 *   get:
 *     summary: Get announcements for member's gym (Member only, paginated)
 *     tags: [Chat]
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
 *         description: Paginated announcements
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
 *                         $ref: '#/components/schemas/Announcement'
 *       403:
 *         description: Access denied
 *       404:
 *         description: Member not found or not in a gym
 */

/**
 * @swagger
 * /chat/announcements/{id}:
 *   put:
 *     summary: Update an announcement (Gym only)
 *     tags: [Chat]
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
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Announcement updated
 *       400:
 *         description: Message is required
 *       403:
 *         description: Access denied or not authorized
 *       404:
 *         description: Announcement not found
 *   delete:
 *     summary: Delete an announcement (Gym only)
 *     tags: [Chat]
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
 *         description: Announcement deleted
 *       403:
 *         description: Access denied or not authorized
 *       404:
 *         description: Announcement not found
 */

/**
 * @swagger
 * /chat/announcements/gym:
 *   get:
 *     summary: Get announcements for gym profile (Gym only, paginated)
 *     tags: [Chat]
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
 *         description: Paginated gym announcements
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
 *                         $ref: '#/components/schemas/Announcement'
 *       403:
 *         description: Access denied
 */

// Admin Routes — JSDoc Swagger Annotations

/**
 * @swagger
 * /admin/gyms:
 *   get:
 *     summary: Get all gyms (Admin only, paginated)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated gyms list
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /admin/gyms/{id}:
 *   delete:
 *     summary: Delete a gym (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Gym deleted
 *       403:
 *         description: Access denied
 *       404:
 *         description: Gym not found
 */

/**
 * @swagger
 * /admin/analytics:
 *   get:
 *     summary: Get analytics data (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Page views, user distribution, and event logs
 *       403:
 *         description: Access denied
 */

// Analytics Routes — JSDoc Swagger Annotations

/**
 * @swagger
 * /analytics/log:
 *   post:
 *     summary: Log an analytics event (authenticated users)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 example: Page View
 *               page:
 *                 type: string
 *                 example: /dashboard
 *               details:
 *                 type: string
 *     responses:
 *       201:
 *         description: Event logged
 */

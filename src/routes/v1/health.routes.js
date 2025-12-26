/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Genel sağlık kontrolü
 *     description: API'nin çalışma durumunu ve temel sağlık metriklerini kontrol eder
 *     responses:
 *       200:
 *         description: API sağlıklı ve çalışıyor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 123456.789
 *                 environment:
 *                   type: string
 *                   example: production
 *       503:
 *         description: Servis kullanılamıyor
 */

/**
 * @swagger
 * /api/v1/health/live:
 *   get:
 *     tags:
 *       - Health
 *     summary: Liveness probe
 *     description: Uygulamanın canlı olup olmadığını kontrol eder (Kubernetes liveness probe için)
 *     responses:
 *       200:
 *         description: Uygulama canlı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: alive
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Uygulama yanıt vermiyor
 */

/**
 * @swagger
 * /api/v1/health/ready:
 *   get:
 *     tags:
 *       - Health
 *     summary: Readiness probe
 *     description: Uygulamanın trafiği kabul etmeye hazır olup olmadığını kontrol eder (Veritabanı bağlantısı vb.)
 *     responses:
 *       200:
 *         description: Uygulama hazır ve trafik kabul edebilir
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ready
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: connected
 *       503:
 *         description: Uygulama hazır değil (veritabanı bağlantısı yok vb.)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: not ready
 *                 error:
 *                   type: string
 */

const router = require('express').Router();
const { healthCheck, liveCheck, readyCheck } = require('../../controllers/health.controller');

router.get('/', healthCheck);
router.get('/live', liveCheck);
router.get('/ready', readyCheck);

module.exports = router;
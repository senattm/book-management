const router = require('express').Router();
const { healthCheck, liveCheck, readyCheck } = require('../../controllers/health.controller');

router.get('/', healthCheck);
router.get('/live', liveCheck);
router.get('/ready', readyCheck);

module.exports = router;
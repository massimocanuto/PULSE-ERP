import { Router } from 'express';

const router = Router();

/**
 * Health check endpoint per verificare connessione
 */
router.head('/health', (req, res) => {
    res.status(200).end();
});

router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

export default router;

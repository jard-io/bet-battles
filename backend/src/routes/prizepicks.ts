import { Router } from 'express';
import { getProjections } from '../controllers/prizepicksController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// For now, make projections work with optional auth
// Later we can require auth by adding authenticateToken middleware
router.get('/projections', authenticateToken, getProjections);

export default router;

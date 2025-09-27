import { Router } from 'express';
import { createPick, getUserPicks, resolveAllPicks, resolvePick } from '../controllers/picksController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Require authentication for all pick routes
router.use(authenticateToken);

router.post('/', createPick);
router.get('/', getUserPicks);
router.post('/:pickId/resolve', resolvePick);
router.post('/resolve-all', resolveAllPicks);

// Remove debug endpoint since we're using proper auth now

export default router;

import { Router } from 'express';
import { getLeaderboard, getUserRank } from '../controllers/leaderboardController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Require authentication for leaderboard routes
router.use(authenticateToken);

router.get('/', getLeaderboard);
router.get('/my-rank', getUserRank);

export default router;

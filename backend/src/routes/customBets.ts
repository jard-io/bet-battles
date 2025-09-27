import { Router } from 'express';
import {
    createCustomBet,
    declineCustomBet,
    ensureCreatorsAsParticipants,
    getCustomBetById,
    getUserCustomBets,
    joinCustomBet,
    resolveCustomBet
} from '../controllers/customBetsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public route for accessing shared bets
router.get('/:betId', getCustomBetById);

// Protected routes
router.use(authenticateToken);

router.post('/', createCustomBet);
router.get('/', getUserCustomBets);
router.post('/retrofit', ensureCreatorsAsParticipants); // Utility to fix existing bets
router.post('/:betId/join', joinCustomBet);
router.post('/:betId/accept', joinCustomBet); // Alias for join
router.post('/:betId/decline', declineCustomBet);
router.post('/:betId/resolve', resolveCustomBet);

export default router;

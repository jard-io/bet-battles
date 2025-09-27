import { Router } from 'express';
import { createGuestUser, getProfile, login, register } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/guest', createGuestUser);
router.get('/profile', authenticateToken, getProfile);

export default router;

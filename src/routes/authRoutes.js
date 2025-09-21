import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { loginLimiter, registerLimiter } from '../middlewares/rateLimiting.js';
import { 
  register, 
  login, 
  me, 
  updateProfile,
  debugLogin
} from '../controllers/authController.js';

const router = Router();

// Rotas públicas com rate limiting rigoroso
router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/debug-login', debugLogin);

// Rotas protegidas
router.get('/me', auth, me);
router.put('/profile', auth, updateProfile);

export default router;

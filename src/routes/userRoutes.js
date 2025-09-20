import { Router } from 'express';
import { auth, adminOnly } from '../middlewares/auth.js';
import {
  validateCreateUser,
  validateUpdateUser,
  validateRouteParams,
  validateQueryParams,
  validateMaliciousContent
} from '../middlewares/inputValidation.js';
import { 
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updatePassword,
  deactivateUser,
  activateUser
} from '../controllers/userController.js';

const router = Router();

// Middleware de validação de conteúdo malicioso para todas as rotas
router.use(validateMaliciousContent);

// Todas as rotas requerem autenticação
router.use(auth);

// Rotas que requerem permissão de admin
router.get('/', validateQueryParams(['page', 'limit', 'role', 'status', 'search']), adminOnly, getAllUsers);
router.post('/', validateCreateUser, adminOnly, createUser);
router.patch('/:id/deactivate', validateRouteParams({ id: { type: 'number', required: true } }), adminOnly, deactivateUser);
router.patch('/:id/activate', validateRouteParams({ id: { type: 'number', required: true } }), adminOnly, activateUser);

// Rotas que qualquer usuário autenticado pode acessar
router.get('/:id', validateRouteParams({ id: { type: 'number', required: true } }), getUserById);
router.put('/:id', validateRouteParams({ id: { type: 'number', required: true } }), validateUpdateUser, updateUser);
router.patch('/:id/password', validateRouteParams({ id: { type: 'number', required: true } }), updatePassword);

export default router;

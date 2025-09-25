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
  activateUser,
  deleteUser
} from '../controllers/userController.js';

const router = Router();

// Middleware de validação de conteúdo malicioso para todas as rotas
router.use(validateMaliciousContent);

// Todas as rotas requerem autenticação
router.use(auth);

// Rotas que requerem permissão de admin
router.get('/', validateQueryParams(['page', 'limit', 'role', 'status', 'search']), adminOnly, getAllUsers);
router.post('/', validateCreateUser, adminOnly, createUser);

// Rotas específicas que devem vir antes das rotas genéricas
router.patch('/:id/deactivate', validateRouteParams({ id: { type: 'number', required: true } }), adminOnly, deactivateUser);
router.patch('/:id/activate', validateRouteParams({ id: { type: 'number', required: true } }), adminOnly, activateUser);
router.patch('/:id/password', validateRouteParams({ id: { type: 'number', required: true } }), updatePassword);

// Rotas genéricas (devem vir por último para evitar conflitos)
router.get('/:id', validateRouteParams({ id: { type: 'number', required: true } }), getUserById);
router.put('/:id', validateRouteParams({ id: { type: 'number', required: true } }), validateUpdateUser, updateUser);
router.delete('/:id', validateRouteParams({ id: { type: 'number', required: true } }), adminOnly, deleteUser);

export default router;

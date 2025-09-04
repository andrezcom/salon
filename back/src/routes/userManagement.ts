import { Router } from 'express';
import { UserManagementController } from '../controllers/userManagement';
import { requireAuth, requireRole, requirePermission } from '../middleware/authorization';

const router = Router();

// ===== GESTIÓN DE USUARIOS =====

// Obtener todos los usuarios (solo admin y super_admin)
router.get('/users', 
  requireAuth,
  requireRole('super_admin', 'admin'),
  UserManagementController.getAllUsers
);

// Obtener usuario por ID
router.get('/users/:userId', 
  requireAuth,
  UserManagementController.getUserById
);

// Crear nuevo usuario (solo admin y super_admin)
router.post('/users', 
  requireAuth,
  requireRole('super_admin', 'admin'),
  UserManagementController.createUser
);

// Actualizar usuario
router.put('/users/:userId', 
  requireAuth,
  UserManagementController.updateUser
);

// Eliminar usuario (soft delete) (solo super_admin)
router.delete('/users/:userId', 
  requireAuth,
  requireRole('super_admin'),
  UserManagementController.deleteUser
);

// Restaurar usuario (solo super_admin)
router.patch('/users/:userId/restore', 
  requireAuth,
  requireRole('super_admin'),
  UserManagementController.restoreUser
);

// ===== GESTIÓN DE ROLES Y PERMISOS =====

// Obtener roles disponibles
router.get('/roles/available', 
  requireAuth,
  UserManagementController.getAvailableRoles
);

// Obtener permisos de un rol específico
router.get('/roles/:role/permissions', 
  requireAuth,
  UserManagementController.getRolePermissions
);

// ===== GESTIÓN DE NEGOCIOS =====

// Asignar usuario a negocio (solo admin y super_admin)
router.post('/users/:userId/businesses/:businessId', 
  requireAuth,
  requireRole('super_admin', 'admin'),
  UserManagementController.assignUserToBusiness
);

// Remover usuario de negocio (solo admin y super_admin)
router.delete('/users/:userId/businesses/:businessId', 
  requireAuth,
  requireRole('super_admin', 'admin'),
  UserManagementController.removeUserFromBusiness
);

export default router;

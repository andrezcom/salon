import { Router } from 'express';
import { PersonController, upload } from '../controllers/person';
import { requireAuth, requireRole, requirePermission } from '../middleware/authorization';

const router = Router();

// ===== CRUD BÁSICO DE PERSONAS =====

// Obtener todas las personas
router.get('/persons', 
  requireAuth,
  requirePermission('users', 'read'),
  PersonController.getAllPersons
);

// Obtener persona por ID
router.get('/persons/:personId', 
  requireAuth,
  PersonController.getPersonById
);

// Crear nueva persona
router.post('/persons', 
  requireAuth,
  requirePermission('users', 'create'),
  PersonController.createPerson
);

// Actualizar persona
router.put('/persons/:personId', 
  requireAuth,
  PersonController.updatePerson
);

// Eliminar persona (soft delete)
router.delete('/persons/:personId', 
  requireAuth,
  requireRole('super_admin'),
  PersonController.deletePerson
);

// Restaurar persona
router.patch('/persons/:personId/restore', 
  requireAuth,
  requireRole('super_admin'),
  PersonController.restorePerson
);

// ===== GESTIÓN DE IMÁGENES DE PERFIL =====

// Subir imagen de perfil
router.post('/persons/:personId/profile-image', 
  requireAuth,
  upload.single('profileImage'),
  PersonController.uploadProfileImage
);

// Eliminar imagen de perfil
router.delete('/persons/:personId/profile-image', 
  requireAuth,
  PersonController.removeProfileImage
);

// Obtener información de imagen de perfil
router.get('/persons/:personId/profile-image', 
  requireAuth,
  PersonController.getProfileImageInfo
);

// Servir archivos de imagen
router.get('/uploads/profile-images/:filename', 
  PersonController.serveImage
);

export default router;

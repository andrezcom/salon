import { Router } from 'express';
import { BusinessProfileController, upload } from '../controllers/businessProfile';

const router = Router();

// ===== GESTIÓN DE IMÁGENES DE PERFIL =====

// Subir imagen de perfil
router.post('/business/:businessId/profile-image', upload.single('profileImage'), BusinessProfileController.uploadProfileImage);

// Eliminar imagen de perfil
router.delete('/business/:businessId/profile-image', BusinessProfileController.removeProfileImage);

// Obtener información de la imagen de perfil
router.get('/business/:businessId/profile-image', BusinessProfileController.getProfileImageInfo);

// Servir archivos de imagen (para mostrar las imágenes en el frontend)
router.get('/uploads/business-profiles/:filename', BusinessProfileController.serveImage);

export default router;

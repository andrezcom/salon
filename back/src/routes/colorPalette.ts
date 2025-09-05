import { Router } from 'express';
import {
  getDefaultPalettes,
  getBusinessColorPalette,
  applyDefaultPalette,
  createCustomPalette,
  updateColorPalette,
  resetToDefaultPalette,
  getPaletteStatistics
} from '../controllers/colorPalette';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';

const router = Router();

/**
 * @route GET /color-palette/defaults
 * @desc Obtener paletas predeterminadas disponibles
 * @access Public (no requiere autenticación para ver las opciones)
 */
router.get('/defaults', getDefaultPalettes);

/**
 * @route GET /color-palette/statistics
 * @desc Obtener estadísticas de uso de paletas del usuario
 * @access Private (requiere autenticación)
 */
router.get('/statistics', 
  authenticateToken,
  getPaletteStatistics
);

/**
 * @route GET /color-palette/business/:businessId
 * @desc Obtener la paleta de colores de un negocio específico
 * @access Private (requiere autenticación y permisos del negocio)
 */
router.get('/business/:businessId',
  authenticateToken,
  getBusinessColorPalette
);

/**
 * @route POST /color-palette/business/:businessId/apply-default
 * @desc Aplicar una paleta predeterminada a un negocio
 * @access Private (requiere autenticación y permisos de administración)
 */
router.post('/business/:businessId/apply-default',
  authenticateToken,
  requirePermission('business', 'update'),
  applyDefaultPalette
);

/**
 * @route POST /color-palette/business/:businessId/custom
 * @desc Crear una paleta personalizada para un negocio
 * @access Private (requiere autenticación y permisos de administración)
 */
router.post('/business/:businessId/custom',
  authenticateToken,
  requirePermission('business', 'update'),
  createCustomPalette
);

/**
 * @route PUT /color-palette/business/:businessId
 * @desc Actualizar la paleta de colores de un negocio
 * @access Private (requiere autenticación y permisos de administración)
 */
router.put('/business/:businessId',
  authenticateToken,
  requirePermission('business', 'update'),
  updateColorPalette
);

/**
 * @route POST /color-palette/business/:businessId/reset
 * @desc Resetear paleta a valores predeterminados
 * @access Private (requiere autenticación y permisos de administración)
 */
router.post('/business/:businessId/reset',
  authenticateToken,
  requirePermission('business', 'update'),
  resetToDefaultPalette
);

export default router;

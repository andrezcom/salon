import { Request, Response } from 'express';
import Business from '../models/business';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';

// Interfaz para el request con usuario autenticado
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions: string[];
    userInfo?: {
      businesses: string[];
    };
  };
}

/**
 * Obtener paletas predeterminadas disponibles
 */
export const getDefaultPalettes = async (req: Request, res: Response): Promise<void> => {
  try {
    const palettes = Business.getDefaultPalettes();
    
    res.status(200).json({
      success: true,
      message: 'Paletas predeterminadas obtenidas exitosamente',
      data: {
        palettes,
        total: palettes.length
      }
    });
  } catch (error) {
    console.error('Error al obtener paletas predeterminadas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener la paleta de colores de un negocio específico
 */
export const getBusinessColorPalette = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { businessId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    // Verificar que el usuario tenga acceso al negocio
    const business = await Business.findOne({
      _id: businessId,
      $or: [
        { ownerId: userId },
        { 'userInfo.businesses': businessId }
      ]
    });

    if (!business) {
      res.status(404).json({
        success: false,
        message: 'Negocio no encontrado o sin permisos'
      });
      return;
    }

    const colorPalette = business.getColorPalette();

    res.status(200).json({
      success: true,
      message: 'Paleta de colores obtenida exitosamente',
      data: {
        businessId: business._id,
        businessName: business.name,
        colorPalette
      }
    });
  } catch (error) {
    console.error('Error al obtener paleta de colores:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Aplicar una paleta predeterminada a un negocio
 */
export const applyDefaultPalette = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { businessId } = req.params;
    const { paletteName } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    if (!paletteName) {
      res.status(400).json({
        success: false,
        message: 'Nombre de paleta es requerido'
      });
      return;
    }

    // Verificar que el usuario tenga permisos para modificar el negocio
    const business = await Business.findOne({
      _id: businessId,
      $or: [
        { ownerId: userId },
        { 'userInfo.businesses': businessId }
      ]
    });

    if (!business) {
      res.status(404).json({
        success: false,
        message: 'Negocio no encontrado o sin permisos'
      });
      return;
    }

    // Aplicar la paleta predeterminada
    const updatedBusiness = await Business.applyDefaultPalette(businessId, paletteName);

    if (!updatedBusiness) {
      res.status(404).json({
        success: false,
        message: 'Negocio no encontrado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Paleta '${paletteName}' aplicada exitosamente`,
      data: {
        businessId: updatedBusiness._id,
        businessName: updatedBusiness.name,
        colorPalette: updatedBusiness.getColorPalette()
      }
    });
  } catch (error) {
    console.error('Error al aplicar paleta predeterminada:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Crear una paleta personalizada para un negocio
 */
export const createCustomPalette = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { businessId } = req.params;
    const { primary, secondary, accent, neutral, paletteName } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    // Validar colores requeridos
    if (!primary || !secondary || !accent || !neutral) {
      res.status(400).json({
        success: false,
        message: 'Todos los colores (primary, secondary, accent, neutral) son requeridos'
      });
      return;
    }

    // Validar formato de colores hex
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const colors = { primary, secondary, accent, neutral };
    
    for (const [colorName, colorValue] of Object.entries(colors)) {
      if (!hexColorRegex.test(colorValue)) {
        res.status(400).json({
          success: false,
          message: `Color ${colorName} debe ser un valor hexadecimal válido (ej: #FF0000)`
        });
        return;
      }
    }

    // Verificar que el usuario tenga permisos para modificar el negocio
    const business = await Business.findOne({
      _id: businessId,
      $or: [
        { ownerId: userId },
        { 'userInfo.businesses': businessId }
      ]
    });

    if (!business) {
      res.status(404).json({
        success: false,
        message: 'Negocio no encontrado o sin permisos'
      });
      return;
    }

    // Crear paleta personalizada
    const customPalette = {
      primary,
      secondary,
      accent,
      neutral,
      paletteName: paletteName || 'Paleta Personalizada',
      isCustom: true
    };

    await business.setColorPalette(customPalette);

    res.status(200).json({
      success: true,
      message: 'Paleta personalizada creada exitosamente',
      data: {
        businessId: business._id,
        businessName: business.name,
        colorPalette: business.getColorPalette()
      }
    });
  } catch (error) {
    console.error('Error al crear paleta personalizada:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Actualizar una paleta existente
 */
export const updateColorPalette = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { businessId } = req.params;
    const { primary, secondary, accent, neutral, paletteName } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    // Verificar que el usuario tenga permisos para modificar el negocio
    const business = await Business.findOne({
      _id: businessId,
      $or: [
        { ownerId: userId },
        { 'userInfo.businesses': businessId }
      ]
    });

    if (!business) {
      res.status(404).json({
        success: false,
        message: 'Negocio no encontrado o sin permisos'
      });
      return;
    }

    // Validar formato de colores hex si se proporcionan
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const colors = { primary, secondary, accent, neutral };
    
    for (const [colorName, colorValue] of Object.entries(colors)) {
      if (colorValue && !hexColorRegex.test(colorValue)) {
        res.status(400).json({
          success: false,
          message: `Color ${colorName} debe ser un valor hexadecimal válido (ej: #FF0000)`
        });
        return;
      }
    }

    // Actualizar solo los campos proporcionados
    const updateData: any = {};
    if (primary) updateData.primary = primary;
    if (secondary) updateData.secondary = secondary;
    if (accent) updateData.accent = accent;
    if (neutral) updateData.neutral = neutral;
    if (paletteName) updateData.paletteName = paletteName;
    
    updateData.isCustom = true;
    updateData.createdAt = new Date();

    await business.setColorPalette(updateData);

    res.status(200).json({
      success: true,
      message: 'Paleta de colores actualizada exitosamente',
      data: {
        businessId: business._id,
        businessName: business.name,
        colorPalette: business.getColorPalette()
      }
    });
  } catch (error) {
    console.error('Error al actualizar paleta de colores:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Resetear paleta a valores predeterminados
 */
export const resetToDefaultPalette = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { businessId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    // Verificar que el usuario tenga permisos para modificar el negocio
    const business = await Business.findOne({
      _id: businessId,
      $or: [
        { ownerId: userId },
        { 'userInfo.businesses': businessId }
      ]
    });

    if (!business) {
      res.status(404).json({
        success: false,
        message: 'Negocio no encontrado o sin permisos'
      });
      return;
    }

    // Resetear a paleta predeterminada
    await business.resetToDefaultPalette();

    res.status(200).json({
      success: true,
      message: 'Paleta restablecida a valores predeterminados',
      data: {
        businessId: business._id,
        businessName: business.name,
        colorPalette: business.getColorPalette()
      }
    });
  } catch (error) {
    console.error('Error al resetear paleta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener estadísticas de uso de paletas
 */
export const getPaletteStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    // Obtener estadísticas de paletas de los negocios del usuario
    const businesses = await Business.find({
      $or: [
        { ownerId: userId },
        { 'userInfo.businesses': { $in: [userId] } }
      ]
    });

    const statistics = {
      totalBusinesses: businesses.length,
      customPalettes: businesses.filter(b => b.colorPalette.isCustom).length,
      defaultPalettes: businesses.filter(b => !b.colorPalette.isCustom).length,
      paletteUsage: {} as Record<string, number>
    };

    // Contar uso de paletas predeterminadas
    businesses.forEach(business => {
      const paletteName = business.colorPalette.paletteName || 'Unknown';
      statistics.paletteUsage[paletteName] = (statistics.paletteUsage[paletteName] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      message: 'Estadísticas de paletas obtenidas exitosamente',
      data: statistics
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de paletas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

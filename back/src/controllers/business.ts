import { Request, Response } from 'express';
import Business from '../models/business';
import User from '../models/user';
import databaseManager from '../services/databaseManager';
import { BusinessService } from '../services/businessService';

// Extender la interfaz Request para incluir user
interface BusinessRequest extends Request {
  user?: {
    _id: string;
  };
}

export const createBusiness = async (req: Request, res: Response) => {
  try {
    const { name, contact, settings, userId } = req.body;
    const actualUserId = (req as BusinessRequest).user?._id || userId;

    if (!actualUserId) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido'
      });
    }

    // Verificar que el usuario existe
    const user = await User.findById(actualUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Crear el negocio en la DB principal primero (sin databaseName)
    const business = new Business({
      name,
      ownerId: actualUserId,
      contact: {
        email: contact?.email || 'default@business.com',
        phone: contact?.phone || '0000000000',
        address: contact?.address || 'Dirección por defecto',
        city: contact?.city || 'Ciudad por defecto',
        country: contact?.country || 'México'
      },
      settings: {
        theme: settings?.theme || 'default',
        currency: settings?.currency || 'MXN',
        timezone: settings?.timezone || 'America/Mexico_City',
        businessType: settings?.businessType || 'salon'
      },
      status: 'active'
    });

    // Guardar el negocio para obtener su ID real
    await business.save();

    // Ahora crear la base de datos específica del negocio usando el ID real
    let dbName: string;
    try {
      dbName = await databaseManager.createBusinessDatabase(
        business._id.toString(),
        name
      );
      console.log(`✅ Base de datos del negocio creada: ${dbName}`);

      // Actualizar el negocio con el nombre de la DB
      business.databaseName = dbName;
      await business.save();

    } catch (dbError) {
      console.error('Error creando base de datos del negocio:', dbError);
      // Si falla la creación de la DB, eliminar el negocio
      await Business.findByIdAndDelete(business._id);
      return res.status(500).json({
        success: false,
        message: 'Error creando la base de datos del negocio',
        error: dbError instanceof Error ? dbError.message : 'Error desconocido'
      });
    }

    // Agregar el negocio al usuario
    await User.findByIdAndUpdate(actualUserId, {
      $push: { businesses: business._id },
      $set: { defaultBusiness: business._id } // Establecer como negocio por defecto si es el primero
    });

    return res.status(201).json({
      success: true,
      message: 'Negocio creado exitosamente',
      data: {
        business,
        databaseName: business.databaseName
      }
    });

  } catch (error) {
    console.error('Error creando negocio:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear el negocio',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const getUserBusinesses = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId || (req as BusinessRequest).user?._id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido'
      });
    }

    const businesses = await Business.find({ ownerId: userId })
      .select('-__v')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: businesses
    });

  } catch (error) {
    console.error('Error obteniendo negocios:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const getBusinessById = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.id;

    const business = await Business.findById(businessId)
      .populate('ownerId', 'nameUser email')
      .select('-__v');

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Negocio no encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      data: business
    });

  } catch (error) {
    console.error('Error obteniendo negocio:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const updateBusiness = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.id;
    const updateData = req.body;

    // No permitir cambiar el databaseName ni ownerId
    delete updateData.databaseName;
    delete updateData.ownerId;

    const business = await Business.findByIdAndUpdate(
      businessId,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Negocio no encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Negocio actualizado exitosamente',
      data: business
    });

  } catch (error) {
    console.error('Error actualizando negocio:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const deleteBusiness = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.id;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Negocio no encontrado'
      });
    }

    // Cerrar la conexión a la base de datos del negocio
    await databaseManager.closeBusinessConnection(businessId);

    // Eliminar el negocio
    await Business.findByIdAndUpdate(businessId);

    // Remover el negocio del usuario
    await User.findByIdAndUpdate(business.ownerId, {
      $pull: { businesses: businessId }
    });

    return res.status(200).json({
      success: true,
      message: 'Negocio eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando negocio:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const getBusinessStats = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.id;

    // Verificar que la conexión esté activa
    if (!databaseManager.isConnectionActive(businessId)) {
      return res.status(400).json({
        success: false,
        message: 'Base de datos del negocio no está activa'
      });
    }

    // Usar el BusinessService para obtener estadísticas
    const stats = await BusinessService.getBusinessStatistics(businessId);

    return res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

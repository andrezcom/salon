import { Request, Response } from 'express';
import { getExpertsSrv, postExpertSrv, putExpertSrv } from '../services/expertServ';
import Expert from '../models/expert';

export async function getExpertsCtrl(req: Request, res: Response) {
  try {
    const { businessId } = req.params;
    
    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'ID del negocio requerido'
      });
    }

    const experts = await Expert.find({ businessId, active: true })
      .select('nameExpert aliasExpert email phone role commissionSettings active hireDate')
      .sort({ nameExpert: 1 });

    res.status(200).json({ 
      success: true,
      data: experts 
    });
  } catch (err) {
    console.error('Error obteniendo expertos:', err);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: err instanceof Error ? err.message : 'Error desconocido'
    });
  }
}

export const expertById = async (req: Request, res: Response) => {
  try {
    const { businessId, expertId } = req.params;
    
    if (!businessId || !expertId) {
      return res.status(400).json({
        success: false,
        message: 'ID del negocio y del experto son requeridos'
      });
    }

    const expert = await Expert.findOne({ 
      businessId, 
      _id: expertId,
      active: true 
    }).select('nameExpert aliasExpert email phone role commissionSettings active hireDate notes');

    if (!expert) {
      return res.status(404).json({
        success: false,
        message: 'Experto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: expert
    });

  } catch (err) {
    console.error('Error obteniendo experto:', err);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: err instanceof Error ? err.message : 'Error desconocido'
    });
  }
};

export async function postExpertCtrl(req: Request, res: Response) {
  if (!req.body) {
    return res.status(400).json({
      success: false,
      message: 'Cuerpo de la solicitud requerido'
    });
  }

  try {
    const { businessId } = req.params;
    const expertData = req.body;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'ID del negocio requerido'
      });
    }

    // Validar campos requeridos
    if (!expertData.nameExpert || !expertData.aliasExpert || !expertData.email || !expertData.phone) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, alias, email y teléfono son requeridos'
      });
    }

    // Validar configuración de comisiones
    if (!expertData.commissionSettings) {
      return res.status(400).json({
        success: false,
        message: 'Configuración de comisiones es requerida'
      });
    }

    const { commissionSettings } = expertData;
    
    if (typeof commissionSettings.serviceCommission !== 'number' || 
        commissionSettings.serviceCommission < 0 || 
        commissionSettings.serviceCommission > 100) {
      return res.status(400).json({
        success: false,
        message: 'Comisión por servicios debe ser un número entre 0 y 100'
      });
    }

    if (typeof commissionSettings.retailCommission !== 'number' || 
        commissionSettings.retailCommission < 0 || 
        commissionSettings.retailCommission > 100) {
      return res.status(400).json({
        success: false,
        message: 'Comisión por retail debe ser un número entre 0 y 100'
      });
    }

    if (!['before_inputs', 'after_inputs'].includes(commissionSettings.serviceCalculationMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Método de cálculo debe ser "before_inputs" o "after_inputs"'
      });
    }

    if (typeof commissionSettings.minimumServiceCommission !== 'number' || 
        commissionSettings.minimumServiceCommission < 0) {
      return res.status(400).json({
        success: false,
        message: 'Comisión mínima debe ser un número mayor o igual a 0'
      });
    }

    if (commissionSettings.maximumServiceCommission !== undefined) {
      if (typeof commissionSettings.maximumServiceCommission !== 'number' || 
          commissionSettings.maximumServiceCommission < 0) {
        return res.status(400).json({
          success: false,
          message: 'Comisión máxima debe ser un número mayor o igual a 0'
        });
      }

      if (commissionSettings.maximumServiceCommission < commissionSettings.minimumServiceCommission) {
        return res.status(400).json({
          success: false,
          message: 'Comisión máxima no puede ser menor que la mínima'
        });
      }
    }

    // Agregar businessId y fecha de contratación
    const expertToCreate = {
      ...expertData,
      businessId,
      hireDate: new Date(),
      active: true
    };

    const newExpert = await postExpertSrv(expertToCreate);
    
    res.status(201).json({ 
      success: true,
      message: 'Experto creado exitosamente',
      data: newExpert 
    });
  } catch (err) {
    console.error('Error creando experto:', err);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: err instanceof Error ? err.message : 'Error desconocido'
    });
  }
};

export async function putExpertCtrl(req: Request, res: Response) {
  if (!req.body) {
    return res.status(400).json({
      success: false,
      message: 'Cuerpo de la solicitud requerido'
    });
  }

  try {
    const { businessId, expertId } = req.params;
    const expertData = req.body;

    if (!businessId || !expertId) {
      return res.status(400).json({
        success: false,
        message: 'ID del negocio y del experto son requeridos'
      });
    }

    // Verificar que el experto existe
    const existingExpert = await Expert.findOne({ 
      businessId, 
      _id: expertId 
    });

    if (!existingExpert) {
      return res.status(404).json({
        success: false,
        message: 'Experto no encontrado'
      });
    }

    // Validar configuración de comisiones si se está actualizando
    if (expertData.commissionSettings) {
      const { commissionSettings } = expertData;
      
      if (typeof commissionSettings.serviceCommission === 'number' && 
          (commissionSettings.serviceCommission < 0 || commissionSettings.serviceCommission > 100)) {
        return res.status(400).json({
          success: false,
          message: 'Comisión por servicios debe ser un número entre 0 y 100'
        });
      }

      if (typeof commissionSettings.retailCommission === 'number' && 
          (commissionSettings.retailCommission < 0 || commissionSettings.retailCommission > 100)) {
        return res.status(400).json({
          success: false,
          message: 'Comisión por retail debe ser un número entre 0 y 100'
        });
      }

      if (commissionSettings.serviceCalculationMethod && 
          !['before_inputs', 'after_inputs'].includes(commissionSettings.serviceCalculationMethod)) {
        return res.status(400).json({
          success: false,
          message: 'Método de cálculo debe ser "before_inputs" o "after_inputs"'
        });
      }

      if (typeof commissionSettings.minimumServiceCommission === 'number' && 
          commissionSettings.minimumServiceCommission < 0) {
        return res.status(400).json({
          success: false,
          message: 'Comisión mínima debe ser un número mayor o igual a 0'
        });
      }

      if (commissionSettings.maximumServiceCommission !== undefined) {
        if (typeof commissionSettings.maximumServiceCommission !== 'number' || 
            commissionSettings.maximumServiceCommission < 0) {
          return res.status(400).json({
            success: false,
            message: 'Comisión máxima debe ser un número mayor o igual a 0'
          });
        }

        const minCommission = commissionSettings.minimumServiceCommission || 
                            existingExpert.commissionSettings.minimumServiceCommission;

        if (commissionSettings.maximumServiceCommission < minCommission) {
          return res.status(400).json({
            success: false,
            message: 'Comisión máxima no puede ser menor que la mínima'
          });
        }
      }
    }

    // Agregar businessId si no está presente
    const expertToUpdate = {
      ...expertData,
      businessId,
      updatedAt: new Date()
    };

    const updatedExpert = await putExpertSrv(expertId, expertToUpdate);
    
    res.status(200).json({ 
      success: true,
      message: 'Experto actualizado exitosamente',
      data: updatedExpert 
    });
  } catch (err) {
    console.error('Error actualizando experto:', err);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: err instanceof Error ? err.message : 'Error desconocido'
    });
  }
}

// Obtener configuración de comisiones de un experto
export async function getExpertCommissionSettings(req: Request, res: Response) {
  try {
    const { businessId, expertId } = req.params;
    
    if (!businessId || !expertId) {
      return res.status(400).json({
        success: false,
        message: 'ID del negocio y del experto son requeridos'
      });
    }

    const expert = await Expert.findOne({ 
      businessId, 
      _id: expertId,
      active: true 
    }).select('nameExpert aliasExpert commissionSettings');

    if (!expert) {
      return res.status(404).json({
        success: false,
        message: 'Experto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: expert._id,
        nameExpert: expert.nameExpert,
        aliasExpert: expert.aliasExpert,
        commissionSettings: expert.commissionSettings
      }
    });

  } catch (err) {
    console.error('Error obteniendo configuración de comisiones:', err);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: err instanceof Error ? err.message : 'Error desconocido'
    });
  }
}

// Actualizar solo la configuración de comisiones
export async function updateExpertCommissionSettings(req: Request, res: Response) {
  try {
    const { businessId, expertId } = req.params;
    const { commissionSettings } = req.body;

    if (!businessId || !expertId) {
      return res.status(400).json({
        success: false,
        message: 'ID del negocio y del experto son requeridos'
      });
    }

    if (!commissionSettings) {
      return res.status(400).json({
        success: false,
        message: 'Configuración de comisiones es requerida'
      });
    }

    // Verificar que el experto existe
    const existingExpert = await Expert.findOne({ 
      businessId, 
      _id: expertId 
    });

    if (!existingExpert) {
      return res.status(404).json({
        success: false,
        message: 'Experto no encontrado'
      });
    }

    // Validar configuración de comisiones
    if (typeof commissionSettings.serviceCommission !== 'number' || 
        commissionSettings.serviceCommission < 0 || 
        commissionSettings.serviceCommission > 100) {
      return res.status(400).json({
        success: false,
        message: 'Comisión por servicios debe ser un número entre 0 y 100'
      });
    }

    if (typeof commissionSettings.retailCommission !== 'number' || 
        commissionSettings.retailCommission < 0 || 
        commissionSettings.retailCommission > 100) {
      return res.status(400).json({
        success: false,
        message: 'Comisión por retail debe ser un número entre 0 y 100'
      });
    }

    if (!['before_inputs', 'after_inputs'].includes(commissionSettings.serviceCalculationMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Método de cálculo debe ser "before_inputs" o "after_inputs"'
      });
    }

    if (typeof commissionSettings.minimumServiceCommission !== 'number' || 
        commissionSettings.minimumServiceCommission < 0) {
      return res.status(400).json({
        success: false,
        message: 'Comisión mínima debe ser un número mayor o igual a 0'
      });
    }

    if (commissionSettings.maximumServiceCommission !== undefined) {
      if (typeof commissionSettings.maximumServiceCommission !== 'number' || 
          commissionSettings.maximumServiceCommission < 0) {
        return res.status(400).json({
          success: false,
          message: 'Comisión máxima debe ser un número mayor o igual a 0'
        });
      }

      if (commissionSettings.maximumServiceCommission < commissionSettings.minimumServiceCommission) {
        return res.status(400).json({
          success: false,
          message: 'Comisión máxima no puede ser menor que la mínima'
        });
      }
    }

    // Actualizar solo la configuración de comisiones
    const updatedExpert = await Expert.findByIdAndUpdate(
      expertId,
      { 
        commissionSettings,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('nameExpert aliasExpert commissionSettings');

    res.status(200).json({ 
      success: true,
      message: 'Configuración de comisiones actualizada exitosamente',
      data: updatedExpert 
    });

  } catch (err) {
    console.error('Error actualizando configuración de comisiones:', err);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: err instanceof Error ? err.message : 'Error desconocido'
    });
  }
}

// Desactivar/activar experto
export async function toggleExpertStatus(req: Request, res: Response) {
  try {
    const { businessId, expertId } = req.params;
    const { active } = req.body;

    if (!businessId || !expertId) {
      return res.status(400).json({
        success: false,
        message: 'ID del negocio y del experto son requeridos'
      });
    }

    if (typeof active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Estado activo debe ser un booleano'
      });
    }

    // Verificar que el experto existe
    const existingExpert = await Expert.findOne({ 
      businessId, 
      _id: expertId 
    });

    if (!existingExpert) {
      return res.status(404).json({
        success: false,
        message: 'Experto no encontrado'
      });
    }

    // Actualizar estado
    const updatedExpert = await Expert.findByIdAndUpdate(
      expertId,
      { 
        active,
        updatedAt: new Date()
      },
      { new: true }
    ).select('nameExpert aliasExpert active');

    res.status(200).json({ 
      success: true,
      message: `Experto ${active ? 'activado' : 'desactivado'} exitosamente`,
      data: updatedExpert 
    });

  } catch (err) {
    console.error('Error cambiando estado del experto:', err);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: err instanceof Error ? err.message : 'Error desconocido'
    });
  }
}

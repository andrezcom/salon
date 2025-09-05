import { Request, Response } from 'express';
import { ClientRetentionService } from '../services/clientRetentionService';

export class ClientRetentionController {
  
  // Crear registro de retención para un cliente
  static async createClientRetention(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.body;
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      if (!customerId) {
        res.status(400).json({
          success: false,
          message: 'customerId es requerido'
        });
        return;
      }

      const clientRetention = await ClientRetentionService.createClientRetention(
        businessId,
        customerId
      );

      res.status(201).json({
        success: true,
        message: 'Registro de retención creado exitosamente',
        data: clientRetention
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Registrar visita de cliente
  static async recordClientVisit(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, services, products, totalAmount, expertId, notes } = req.body;
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      if (!customerId || !services || !products || totalAmount === undefined) {
        res.status(400).json({
          success: false,
          message: 'customerId, services, products y totalAmount son requeridos'
        });
        return;
      }

      const result = await ClientRetentionService.recordClientVisit(
        businessId,
        customerId,
        {
          services,
          products,
          totalAmount,
          expertId,
          notes
        }
      );

      res.status(200).json({
        success: true,
        message: 'Visita registrada exitosamente',
        data: result
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Analizar clientes inactivos
  static async analyzeInactiveClients(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const result = await ClientRetentionService.analyzeInactiveClients(businessId);

      res.status(200).json({
        success: true,
        message: 'Análisis de clientes inactivos completado',
        data: result
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener clientes en riesgo
  static async getAtRiskCustomers(req: Request, res: Response): Promise<void> {
    try {
      const { riskLevel, limit } = req.query;
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const customers = await ClientRetentionService.getAtRiskCustomers(
        businessId,
        riskLevel as string,
        limit ? parseInt(limit as string) : undefined
      );

      res.status(200).json({
        success: true,
        message: 'Clientes en riesgo obtenidos exitosamente',
        data: {
          customers,
          count: customers.length
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener clientes críticos
  static async getCriticalCustomers(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const customers = await ClientRetentionService.getCriticalCustomers(businessId);

      res.status(200).json({
        success: true,
        message: 'Clientes críticos obtenidos exitosamente',
        data: {
          customers,
          count: customers.length
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Crear campaña de recuperación
  static async createRecoveryCampaign(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, campaignName, campaignType } = req.body;
      const businessId = req.user?.businessId;
      const createdBy = req.user?.id;

      if (!businessId || !createdBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y createdBy son requeridos'
        });
        return;
      }

      if (!customerId || !campaignName || !campaignType) {
        res.status(400).json({
          success: false,
          message: 'customerId, campaignName y campaignType son requeridos'
        });
        return;
      }

      const result = await ClientRetentionService.createRecoveryCampaign(
        businessId,
        customerId,
        {
          campaignName,
          campaignType,
          createdBy
        }
      );

      res.status(201).json({
        success: true,
        message: 'Campaña de recuperación creada exitosamente',
        data: result
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Registrar respuesta a campaña
  static async recordCampaignResponse(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, campaignId, responseType, notes } = req.body;
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      if (!customerId || !campaignId || !responseType) {
        res.status(400).json({
          success: false,
          message: 'customerId, campaignId y responseType son requeridos'
        });
        return;
      }

      const result = await ClientRetentionService.recordCampaignResponse(
        businessId,
        customerId,
        campaignId,
        responseType,
        notes
      );

      res.status(200).json({
        success: true,
        message: 'Respuesta a campaña registrada exitosamente',
        data: result
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Marcar cliente como recuperado
  static async markClientAsRecovered(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, recoveryMethod, notes } = req.body;
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      if (!customerId || !recoveryMethod) {
        res.status(400).json({
          success: false,
          message: 'customerId y recoveryMethod son requeridos'
        });
        return;
      }

      const result = await ClientRetentionService.markClientAsRecovered(
        businessId,
        customerId,
        recoveryMethod,
        notes
      );

      res.status(200).json({
        success: true,
        message: 'Cliente marcado como recuperado exitosamente',
        data: result
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener estadísticas de retención
  static async getRetentionStatistics(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const statistics = await ClientRetentionService.getRetentionStatistics(businessId);

      res.status(200).json({
        success: true,
        message: 'Estadísticas de retención obtenidas exitosamente',
        data: statistics
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener clientes que necesitan seguimiento
  static async getClientsNeedingFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const clients = await ClientRetentionService.getClientsNeedingFollowUp(businessId);

      res.status(200).json({
        success: true,
        message: 'Clientes que necesitan seguimiento obtenidos exitosamente',
        data: {
          clients,
          count: clients.length
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Agregar nota a cliente
  static async addClientNote(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, type, content } = req.body;
      const businessId = req.user?.businessId;
      const createdBy = req.user?.id;

      if (!businessId || !createdBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y createdBy son requeridos'
        });
        return;
      }

      if (!customerId || !type || !content) {
        res.status(400).json({
          success: false,
          message: 'customerId, type y content son requeridos'
        });
        return;
      }

      const result = await ClientRetentionService.addClientNote(
        businessId,
        customerId,
        {
          type,
          content,
          createdBy
        }
      );

      res.status(201).json({
        success: true,
        message: 'Nota agregada exitosamente',
        data: result
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener historial de un cliente
  static async getClientHistory(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const history = await ClientRetentionService.getClientHistory(businessId, customerId);

      if (!history) {
        res.status(404).json({
          success: false,
          message: 'Cliente no encontrado en sistema de retención'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Historial del cliente obtenido exitosamente',
        data: history
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener dashboard de retención
  static async getRetentionDashboard(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      // Obtener estadísticas generales
      const statistics = await ClientRetentionService.getRetentionStatistics(businessId);
      
      // Obtener clientes en riesgo
      const atRiskCustomers = await ClientRetentionService.getAtRiskCustomers(businessId, undefined, 10);
      
      // Obtener clientes críticos
      const criticalCustomers = await ClientRetentionService.getCriticalCustomers(businessId);
      
      // Obtener clientes que necesitan seguimiento
      const clientsNeedingFollowUp = await ClientRetentionService.getClientsNeedingFollowUp(businessId);

      res.status(200).json({
        success: true,
        message: 'Dashboard de retención obtenido exitosamente',
        data: {
          statistics,
          atRiskCustomers: atRiskCustomers.slice(0, 5),
          criticalCustomers: criticalCustomers.slice(0, 5),
          clientsNeedingFollowUp: clientsNeedingFollowUp.slice(0, 5),
          alerts: {
            criticalClients: criticalCustomers.length,
            atRiskClients: atRiskCustomers.length,
            clientsNeedingFollowUp: clientsNeedingFollowUp.length
          }
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}

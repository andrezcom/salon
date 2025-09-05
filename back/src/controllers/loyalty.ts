import { Request, Response } from 'express';
import { LoyaltyService } from '../services/loyaltyService';

export class LoyaltyController {
  
  // Crear programa de fidelidad
  static async createLoyaltyProgram(req: Request, res: Response): Promise<void> {
    try {
      const programData = req.body;
      const businessId = req.user?.businessId;
      const createdBy = req.user?.id;

      if (!businessId || !createdBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y createdBy son requeridos'
        });
        return;
      }

      const program = await LoyaltyService.createLoyaltyProgram(
        businessId,
        programData,
        createdBy
      );

      res.status(201).json({
        success: true,
        message: 'Programa de fidelidad creado exitosamente',
        data: program
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener programa de fidelidad
  static async getLoyaltyProgram(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const LoyaltyProgram = require('../models/loyaltyProgram').default;
      const program = await LoyaltyProgram.findOne({
        businessId,
        isActive: true
      });

      if (!program) {
        res.status(404).json({
          success: false,
          message: 'No se encontró un programa de fidelidad activo'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Programa de fidelidad obtenido exitosamente',
        data: program
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Registrar cliente en programa de fidelidad
  static async enrollCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, loyaltyProgramId } = req.body;
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      if (!customerId || !loyaltyProgramId) {
        res.status(400).json({
          success: false,
          message: 'customerId y loyaltyProgramId son requeridos'
        });
        return;
      }

      const loyaltyCustomer = await LoyaltyService.enrollCustomer(
        businessId,
        customerId,
        loyaltyProgramId
      );

      res.status(201).json({
        success: true,
        message: 'Cliente registrado en programa de fidelidad exitosamente',
        data: loyaltyCustomer
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener información del cliente frecuente
  static async getCustomerInfo(req: Request, res: Response): Promise<void> {
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

      const customerInfo = await LoyaltyService.getCustomerInfo(businessId, customerId);

      if (!customerInfo) {
        res.status(404).json({
          success: false,
          message: 'Cliente no está registrado en programa de fidelidad'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Información del cliente frecuente obtenida exitosamente',
        data: customerInfo
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Procesar puntos de una venta
  static async processSalePoints(req: Request, res: Response): Promise<void> {
    try {
      const {
        saleId,
        customerId,
        totalAmount,
        servicesCount,
        productsCount,
        services,
        products
      } = req.body;

      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      if (!saleId || !customerId || totalAmount === undefined) {
        res.status(400).json({
          success: false,
          message: 'saleId, customerId y totalAmount son requeridos'
        });
        return;
      }

      const result = await LoyaltyService.processSalePoints(
        businessId,
        saleId,
        customerId,
        totalAmount,
        servicesCount || 0,
        productsCount || 0,
        services || [],
        products || []
      );

      res.status(200).json({
        success: true,
        message: 'Puntos procesados exitosamente',
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

  // Canjear puntos
  static async redeemPoints(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, pointsToRedeem, description, saleId } = req.body;
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      if (!customerId || !pointsToRedeem || !description) {
        res.status(400).json({
          success: false,
          message: 'customerId, pointsToRedeem y description son requeridos'
        });
        return;
      }

      const result = await LoyaltyService.redeemPoints(
        businessId,
        customerId,
        pointsToRedeem,
        description,
        saleId
      );

      res.status(200).json({
        success: true,
        message: 'Puntos canjeados exitosamente',
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

  // Obtener top clientes
  static async getTopCustomers(req: Request, res: Response): Promise<void> {
    try {
      const { limit } = req.query;
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const topCustomers = await LoyaltyService.getTopCustomers(
        businessId,
        parseInt(limit as string) || 10
      );

      res.status(200).json({
        success: true,
        message: 'Top clientes obtenidos exitosamente',
        data: {
          customers: topCustomers,
          count: topCustomers.length
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

  // Obtener clientes por nivel
  static async getCustomersByLevel(req: Request, res: Response): Promise<void> {
    try {
      const { level } = req.params;
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const customers = await LoyaltyService.getCustomersByLevel(businessId, level);

      res.status(200).json({
        success: true,
        message: `Clientes del nivel ${level} obtenidos exitosamente`,
        data: {
          level,
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

  // Obtener estadísticas del programa
  static async getProgramStatistics(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const statistics = await LoyaltyService.getProgramStatistics(businessId);

      if (!statistics) {
        res.status(404).json({
          success: false,
          message: 'No se encontró un programa de fidelidad activo'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Estadísticas del programa obtenidas exitosamente',
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

  // Ajustar puntos manualmente
  static async adjustPoints(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, points, reason } = req.body;
      const businessId = req.user?.businessId;
      const adjustedBy = req.user?.id;

      if (!businessId || !adjustedBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y adjustedBy son requeridos'
        });
        return;
      }

      if (!customerId || points === undefined || !reason) {
        res.status(400).json({
          success: false,
          message: 'customerId, points y reason son requeridos'
        });
        return;
      }

      const result = await LoyaltyService.adjustPoints(
        businessId,
        customerId,
        points,
        reason,
        adjustedBy
      );

      res.status(200).json({
        success: true,
        message: 'Puntos ajustados exitosamente',
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

  // Obtener historial de puntos de un cliente
  static async getCustomerPointsHistory(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      const businessId = req.user?.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const LoyaltyCustomer = require('../models/loyaltyCustomer').default;
      const customer = await LoyaltyCustomer.findOne({
        businessId,
        customerId,
        status: 'active'
      });

      if (!customer) {
        res.status(404).json({
          success: false,
          message: 'Cliente no está registrado en programa de fidelidad'
        });
        return;
      }

      const history = customer.pointsHistory
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string));

      res.status(200).json({
        success: true,
        message: 'Historial de puntos obtenido exitosamente',
        data: {
          customer: {
            name: customer.customerName,
            email: customer.customerEmail,
            currentPoints: customer.currentPoints,
            currentLevel: customer.currentLevel
          },
          history,
          total: customer.pointsHistory.length
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

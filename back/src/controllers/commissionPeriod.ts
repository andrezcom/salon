import { Request, Response } from 'express';
import { CommissionPeriodService } from '../services/commissionPeriodService';
import CommissionPeriod from '../models/commissionPeriod';
import CommissionPeriodConfig from '../models/commissionPeriodConfig';

export class CommissionPeriodController {

  /**
   * Crear configuración de períodos
   */
  static async createConfig(req: Request, res: Response): Promise<void> {
    try {
      const configData = req.body;
      const businessId = req.user?.businessId || req.body.businessId;
      const createdBy = req.user?.id;

      if (!businessId || !createdBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y createdBy son requeridos'
        });
        return;
      }

      const config = new CommissionPeriodConfig({
        ...configData,
        businessId,
        createdBy
      });

      await config.save();

      res.status(201).json({
        success: true,
        message: 'Configuración de períodos creada exitosamente',
        data: config
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Obtener configuración activa
   */
  static async getActiveConfig(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId || req.params.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const config = await CommissionPeriodConfig.getActiveConfig(businessId);

      if (!config) {
        res.status(404).json({
          success: false,
          message: 'No hay configuración activa de períodos'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Configuración obtenida exitosamente',
        data: config
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Generar períodos para un año
   */
  static async generateYearlyPeriods(req: Request, res: Response): Promise<void> {
    try {
      const { year } = req.body;
      const businessId = req.user?.businessId || req.body.businessId;
      const createdBy = req.user?.id;

      if (!businessId || !createdBy || !year) {
        res.status(400).json({
          success: false,
          message: 'BusinessId, createdBy y year son requeridos'
        });
        return;
      }

      const periods = await CommissionPeriodService.generateYearlyPeriods(
        businessId,
        year,
        createdBy
      );

      res.status(201).json({
        success: true,
        message: `Períodos generados exitosamente para el año ${year}`,
        data: {
          year,
          periodsCreated: periods.length,
          periods
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

  /**
   * Obtener períodos
   */
  static async getPeriods(req: Request, res: Response): Promise<void> {
    try {
      const { year, status, page = 1, limit = 10 } = req.query;
      const businessId = req.user?.businessId || req.params.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const query: any = { businessId };
      
      if (year) {
        query.year = parseInt(year as string);
      }
      
      if (status) {
        query.status = status;
      }

      const periods = await CommissionPeriod.find(query)
        .sort({ year: -1, periodNumber: -1 })
        .limit(limit as number * 1)
        .skip((page as number - 1) * (limit as number));

      const total = await CommissionPeriod.countDocuments(query);

      res.status(200).json({
        success: true,
        message: 'Períodos obtenidos exitosamente',
        data: {
          periods,
          pagination: {
            current: page,
            pages: Math.ceil(total / (limit as number)),
            total
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

  /**
   * Obtener período por ID
   */
  static async getPeriodById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const businessId = req.user?.businessId || req.params.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const period = await CommissionPeriod.findOne({ _id: id, businessId });

      if (!period) {
        res.status(404).json({
          success: false,
          message: 'Período no encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Período obtenido exitosamente',
        data: period
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Cerrar período
   */
  static async closePeriod(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const businessId = req.user?.businessId || req.params.businessId;
      const processedBy = req.user?.id;

      if (!businessId || !processedBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y processedBy son requeridos'
        });
        return;
      }

      const period = await CommissionPeriodService.closePeriod(
        businessId,
        id,
        processedBy,
        notes
      );

      res.status(200).json({
        success: true,
        message: 'Período cerrado exitosamente',
        data: period
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Aprobar período
   */
  static async approvePeriod(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const businessId = req.user?.businessId || req.params.businessId;
      const approvedBy = req.user?.id;

      if (!businessId || !approvedBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y approvedBy son requeridos'
        });
        return;
      }

      const period = await CommissionPeriodService.approvePeriod(
        businessId,
        id,
        approvedBy,
        notes
      );

      res.status(200).json({
        success: true,
        message: 'Período aprobado exitosamente',
        data: period
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Pagar período
   */
  static async payPeriod(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { paymentMethod, notes } = req.body;
      const businessId = req.user?.businessId || req.params.businessId;
      const paidBy = req.user?.id;

      if (!businessId || !paidBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y paidBy son requeridos'
        });
        return;
      }

      if (!paymentMethod) {
        res.status(400).json({
          success: false,
          message: 'Método de pago es requerido'
        });
        return;
      }

      const period = await CommissionPeriodService.payPeriod(
        businessId,
        id,
        paidBy,
        paymentMethod,
        notes
      );

      res.status(200).json({
        success: true,
        message: 'Período pagado exitosamente',
        data: period
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Cancelar período
   */
  static async cancelPeriod(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const businessId = req.user?.businessId || req.params.businessId;
      const cancelledBy = req.user?.id;

      if (!businessId || !cancelledBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y cancelledBy son requeridos'
        });
        return;
      }

      if (!reason) {
        res.status(400).json({
          success: false,
          message: 'Razón de cancelación es requerida'
        });
        return;
      }

      const period = await CommissionPeriod.findOne({ _id: id, businessId });

      if (!period) {
        res.status(404).json({
          success: false,
          message: 'Período no encontrado'
        });
        return;
      }

      await period.cancel(cancelledBy, reason);

      res.status(200).json({
        success: true,
        message: 'Período cancelado exitosamente',
        data: period
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Recalcular período
   */
  static async recalculatePeriod(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const businessId = req.user?.businessId || req.params.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const period = await CommissionPeriodService.recalculatePeriod(
        businessId,
        id
      );

      res.status(200).json({
        success: true,
        message: 'Período recalculado exitosamente',
        data: period
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Obtener resumen de períodos
   */
  static async getPeriodsSummary(req: Request, res: Response): Promise<void> {
    try {
      const { year } = req.query;
      const businessId = req.user?.businessId || req.params.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const summary = await CommissionPeriodService.getPeriodsSummary(
        businessId,
        year ? parseInt(year as string) : undefined
      );

      res.status(200).json({
        success: true,
        message: 'Resumen de períodos obtenido exitosamente',
        data: summary
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Obtener períodos pendientes de pago
   */
  static async getPendingPayments(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId || req.params.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const pendingPeriods = await CommissionPeriodService.getPendingPayments(businessId);

      res.status(200).json({
        success: true,
        message: 'Períodos pendientes de pago obtenidos exitosamente',
        data: pendingPeriods
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Obtener períodos vencidos
   */
  static async getOverduePeriods(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId || req.params.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const overduePeriods = await CommissionPeriodService.getOverduePeriods(businessId);

      res.status(200).json({
        success: true,
        message: 'Períodos vencidos obtenidos exitosamente',
        data: overduePeriods
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Obtener comisiones de un experto en un período
   */
  static async getExpertPeriodCommissions(req: Request, res: Response): Promise<void> {
    try {
      const { periodId, expertId } = req.params;
      const businessId = req.user?.businessId || req.params.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const expertCommissions = await CommissionPeriodService.getExpertPeriodCommissions(
        businessId,
        expertId,
        periodId
      );

      res.status(200).json({
        success: true,
        message: 'Comisiones del experto en período obtenidas exitosamente',
        data: expertCommissions
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Obtener período actual
   */
  static async getCurrentPeriod(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId || req.params.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const currentPeriod = await CommissionPeriod.getCurrentPeriod(businessId);

      if (!currentPeriod) {
        res.status(404).json({
          success: false,
          message: 'No hay período actual abierto'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Período actual obtenido exitosamente',
        data: currentPeriod
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

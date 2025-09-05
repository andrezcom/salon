import { Request, Response } from 'express';
import { AbsenceRequest, AbsenceBalance, AbsencePolicy } from '../models/absence';
import Person from '../models/person';

export class AbsenceController {

  /**
   * Crear solicitud de ausencia
   */
  static async createAbsenceRequest(req: Request, res: Response): Promise<void> {
    try {
      const {
        employeeId,
        type,
        reason,
        startDate,
        endDate,
        isHalfDay,
        halfDayType,
        documents,
        emergencyContact,
        coverage
      } = req.body;

      const businessId = req.user?.businessId || req.body.businessId;
      const requestedBy = req.user?.id;

      if (!businessId || !requestedBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y requestedBy son requeridos'
        });
        return;
      }

      // Validar fechas
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start >= end) {
        res.status(400).json({
          success: false,
          message: 'La fecha de inicio debe ser anterior a la fecha de fin'
        });
        return;
      }

      if (start < new Date()) {
        res.status(400).json({
          success: false,
          message: 'No se pueden solicitar ausencias para fechas pasadas'
        });
        return;
      }

      // Verificar balance disponible
      const balance = await AbsenceBalance.getEmployeeBalance(
        businessId,
        employeeId,
        start.getFullYear()
      );

      const absenceType = type === 'vacation' ? 'vacation' : 
                         type === 'sick_leave' ? 'sickLeave' :
                         type === 'personal_leave' ? 'personalLeave' :
                         type === 'maternity_leave' ? 'maternityLeave' :
                         type === 'paternity_leave' ? 'paternityLeave' : 'other';

      const requestedDays = isHalfDay ? 0.5 : 
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (balance.balances[absenceType as keyof typeof balance.balances].remaining < requestedDays) {
        res.status(400).json({
          success: false,
          message: `No tiene suficientes días disponibles. Disponibles: ${balance.balances[absenceType as keyof typeof balance.balances].remaining}`
        });
        return;
      }

      // Crear solicitud
      const absenceRequest = new AbsenceRequest({
        employeeId,
        businessId,
        type,
        reason,
        startDate: start,
        endDate: end,
        isHalfDay,
        halfDayType,
        documents,
        emergencyContact,
        coverage,
        requestedBy
      });

      absenceRequest.calculateTotalDays();
      await absenceRequest.save();

      res.status(201).json({
        success: true,
        message: 'Solicitud de ausencia creada exitosamente',
        data: absenceRequest
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
   * Obtener solicitudes de ausencia
   */
  static async getAbsenceRequests(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId, status, type, year } = req.query;
      const businessId = req.user?.businessId || req.params.businessId;
      const { page = 1, limit = 10 } = req.query;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const query: any = { businessId };

      if (employeeId) {
        query.employeeId = employeeId;
      }

      if (status) {
        query.status = status;
      }

      if (type) {
        query.type = type;
      }

      if (year) {
        query.startDate = {
          $gte: new Date(parseInt(year as string), 0, 1),
          $lt: new Date(parseInt(year as string) + 1, 0, 1)
        };
      }

      const requests = await AbsenceRequest.find(query)
        .populate('employeeId', 'firstName lastName userInfo.department userInfo.position')
        .populate('requestedBy', 'firstName lastName')
        .populate('approvedBy', 'firstName lastName')
        .populate('coverage.assignedTo', 'firstName lastName')
        .sort({ requestedAt: -1 })
        .limit(limit as number * 1)
        .skip((page as number - 1) * (limit as number));

      const total = await AbsenceRequest.countDocuments(query);

      res.status(200).json({
        success: true,
        message: 'Solicitudes de ausencia obtenidas exitosamente',
        data: {
          requests,
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
   * Obtener solicitudes pendientes de aprobación
   */
  static async getPendingRequests(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId || req.params.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const pendingRequests = await AbsenceRequest.getPendingRequests(businessId);

      res.status(200).json({
        success: true,
        message: 'Solicitudes pendientes obtenidas exitosamente',
        data: pendingRequests
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
   * Aprobar solicitud de ausencia
   */
  static async approveAbsenceRequest(req: Request, res: Response): Promise<void> {
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

      const request = await AbsenceRequest.findOne({ _id: id, businessId });

      if (!request) {
        res.status(404).json({
          success: false,
          message: 'Solicitud de ausencia no encontrada'
        });
        return;
      }

      if (request.status !== 'pending') {
        res.status(400).json({
          success: false,
          message: 'La solicitud ya fue procesada'
        });
        return;
      }

      // Aprobar solicitud
      request.approve(approvedBy, notes);
      await request.save();

      // Actualizar balance de ausencias
      const absenceType = request.type === 'vacation' ? 'vacation' : 
                         request.type === 'sick_leave' ? 'sickLeave' :
                         request.type === 'personal_leave' ? 'personalLeave' :
                         request.type === 'maternity_leave' ? 'maternityLeave' :
                         request.type === 'paternity_leave' ? 'paternityLeave' : 'other';

      await AbsenceBalance.updateBalance(
        businessId,
        request.employeeId,
        request.startDate.getFullYear(),
        absenceType,
        request.totalDays
      );

      res.status(200).json({
        success: true,
        message: 'Solicitud de ausencia aprobada exitosamente',
        data: request
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
   * Rechazar solicitud de ausencia
   */
  static async rejectAbsenceRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const businessId = req.user?.businessId || req.params.businessId;
      const rejectedBy = req.user?.id;

      if (!businessId || !rejectedBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y rejectedBy son requeridos'
        });
        return;
      }

      if (!reason) {
        res.status(400).json({
          success: false,
          message: 'La razón del rechazo es requerida'
        });
        return;
      }

      const request = await AbsenceRequest.findOne({ _id: id, businessId });

      if (!request) {
        res.status(404).json({
          success: false,
          message: 'Solicitud de ausencia no encontrada'
        });
        return;
      }

      if (request.status !== 'pending') {
        res.status(400).json({
          success: false,
          message: 'La solicitud ya fue procesada'
        });
        return;
      }

      // Rechazar solicitud
      request.reject(rejectedBy, reason);
      await request.save();

      res.status(200).json({
        success: true,
        message: 'Solicitud de ausencia rechazada exitosamente',
        data: request
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
   * Cancelar solicitud de ausencia
   */
  static async cancelAbsenceRequest(req: Request, res: Response): Promise<void> {
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

      const request = await AbsenceRequest.findOne({ _id: id, businessId });

      if (!request) {
        res.status(404).json({
          success: false,
          message: 'Solicitud de ausencia no encontrada'
        });
        return;
      }

      if (request.status === 'approved') {
        res.status(400).json({
          success: false,
          message: 'No se puede cancelar una solicitud ya aprobada'
        });
        return;
      }

      // Cancelar solicitud
      request.cancel();
      await request.save();

      res.status(200).json({
        success: true,
        message: 'Solicitud de ausencia cancelada exitosamente',
        data: request
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
   * Obtener balance de ausencias de un empleado
   */
  static async getEmployeeBalance(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const { year = new Date().getFullYear() } = req.query;
      const businessId = req.user?.businessId || req.params.businessId;

      if (!businessId || !employeeId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y employeeId son requeridos'
        });
        return;
      }

      const balance = await AbsenceBalance.getEmployeeBalance(
        businessId,
        employeeId,
        parseInt(year as string)
      );

      res.status(200).json({
        success: true,
        message: 'Balance de ausencias obtenido exitosamente',
        data: balance
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
   * Obtener solicitudes de ausencia de un empleado
   */
  static async getEmployeeRequests(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const { year } = req.query;
      const businessId = req.user?.businessId || req.params.businessId;

      if (!businessId || !employeeId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y employeeId son requeridos'
        });
        return;
      }

      const requests = await AbsenceRequest.getEmployeeRequests(
        businessId,
        employeeId,
        year ? parseInt(year as string) : undefined
      );

      res.status(200).json({
        success: true,
        message: 'Solicitudes de ausencia del empleado obtenidas exitosamente',
        data: requests
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
   * Crear política de ausencias
   */
  static async createAbsencePolicy(req: Request, res: Response): Promise<void> {
    try {
      const policyData = req.body;
      const businessId = req.user?.businessId || req.body.businessId;
      const createdBy = req.user?.id;

      if (!businessId || !createdBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y createdBy son requeridos'
        });
        return;
      }

      const policy = new AbsencePolicy({
        ...policyData,
        businessId,
        createdBy
      });

      await policy.save();

      res.status(201).json({
        success: true,
        message: 'Política de ausencias creada exitosamente',
        data: policy
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
   * Obtener políticas de ausencias
   */
  static async getAbsencePolicies(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId || req.params.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const policies = await AbsencePolicy.find({
        businessId,
        isActive: true
      }).sort({ effectiveDate: -1 });

      res.status(200).json({
        success: true,
        message: 'Políticas de ausencias obtenidas exitosamente',
        data: policies
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
   * Actualizar balance de ausencias manualmente
   */
  static async updateAbsenceBalance(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const { year, absenceType, days } = req.body;
      const businessId = req.user?.businessId || req.params.businessId;

      if (!businessId || !employeeId || !year || !absenceType || days === undefined) {
        res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos'
        });
        return;
      }

      const balance = await AbsenceBalance.getEmployeeBalance(
        businessId,
        employeeId,
        year
      );

      if (balance.balances[absenceType as keyof typeof balance.balances]) {
        const typeBalance = balance.balances[absenceType as keyof typeof balance.balances];
        typeBalance.total += days;
        typeBalance.remaining += days;
        balance.lastUpdated = new Date();
        await balance.save();
      }

      res.status(200).json({
        success: true,
        message: 'Balance de ausencias actualizado exitosamente',
        data: balance
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

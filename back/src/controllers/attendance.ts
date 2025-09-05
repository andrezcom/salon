import { Request, Response } from 'express';
import { AttendanceRecord, AttendanceSummary, AttendanceRule } from '../models/attendance';
import Person from '../models/person';

export class AttendanceController {

  /**
   * Registrar entrada
   */
  static async checkIn(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId, deviceInfo, location } = req.body;
      const businessId = req.user?.businessId || req.body.businessId;

      if (!businessId || !employeeId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y employeeId son requeridos'
        });
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Verificar si ya existe registro para hoy
      let attendanceRecord = await AttendanceRecord.findOne({
        businessId,
        employeeId,
        date: today
      });

      if (attendanceRecord && attendanceRecord.checkIn) {
        res.status(400).json({
          success: false,
          message: 'Ya se registró la entrada para hoy'
        });
        return;
      }

      if (!attendanceRecord) {
        attendanceRecord = new AttendanceRecord({
          businessId,
          employeeId,
          date: today,
          status: 'absent'
        });
      }

      // Registrar entrada
      attendanceRecord.checkIn = new Date();
      attendanceRecord.status = 'present';
      if (deviceInfo) attendanceRecord.deviceInfo = deviceInfo;
      if (location) attendanceRecord.location = location;

      // Verificar si llegó tarde
      const rules = await AttendanceRule.findOne({
        businessId,
        isActive: true,
        $or: [
          { 'applicableTo.allEmployees': true },
          { 'applicableTo.employeeIds': employeeId }
        ]
      });

      if (rules) {
        const startTime = rules.rules.workingHours.startTime;
        const [hours, minutes] = startTime.split(':').map(Number);
        const expectedStartTime = new Date(today);
        expectedStartTime.setHours(hours, minutes, 0, 0);
        
        const gracePeriod = rules.rules.latePolicy.gracePeriod;
        const lateThreshold = new Date(expectedStartTime.getTime() + gracePeriod * 60000);

        if (attendanceRecord.checkIn > lateThreshold) {
          attendanceRecord.status = 'late';
        }
      }

      await attendanceRecord.save();

      res.status(200).json({
        success: true,
        message: 'Entrada registrada exitosamente',
        data: attendanceRecord
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
   * Registrar salida
   */
  static async checkOut(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId, deviceInfo } = req.body;
      const businessId = req.user?.businessId || req.body.businessId;

      if (!businessId || !employeeId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y employeeId son requeridos'
        });
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const attendanceRecord = await AttendanceRecord.findOne({
        businessId,
        employeeId,
        date: today
      });

      if (!attendanceRecord || !attendanceRecord.checkIn) {
        res.status(400).json({
          success: false,
          message: 'No se encontró registro de entrada para hoy'
        });
        return;
      }

      if (attendanceRecord.checkOut) {
        res.status(400).json({
          success: false,
          message: 'Ya se registró la salida para hoy'
        });
        return;
      }

      // Registrar salida
      attendanceRecord.checkOut = new Date();
      if (deviceInfo) {
        attendanceRecord.deviceInfo = { ...attendanceRecord.deviceInfo, ...deviceInfo };
      }

      // Calcular horas trabajadas
      attendanceRecord.calculateHours();

      await attendanceRecord.save();

      res.status(200).json({
        success: true,
        message: 'Salida registrada exitosamente',
        data: attendanceRecord
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
   * Iniciar descanso
   */
  static async startBreak(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.body;
      const businessId = req.user?.businessId || req.body.businessId;

      if (!businessId || !employeeId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y employeeId son requeridos'
        });
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const attendanceRecord = await AttendanceRecord.findOne({
        businessId,
        employeeId,
        date: today
      });

      if (!attendanceRecord || !attendanceRecord.checkIn) {
        res.status(400).json({
          success: false,
          message: 'No se encontró registro de entrada para hoy'
        });
        return;
      }

      if (attendanceRecord.breakStart) {
        res.status(400).json({
          success: false,
          message: 'Ya se inició un descanso'
        });
        return;
      }

      attendanceRecord.startBreak();
      await attendanceRecord.save();

      res.status(200).json({
        success: true,
        message: 'Descanso iniciado exitosamente',
        data: attendanceRecord
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
   * Terminar descanso
   */
  static async endBreak(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.body;
      const businessId = req.user?.businessId || req.body.businessId;

      if (!businessId || !employeeId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y employeeId son requeridos'
        });
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const attendanceRecord = await AttendanceRecord.findOne({
        businessId,
        employeeId,
        date: today
      });

      if (!attendanceRecord || !attendanceRecord.breakStart) {
        res.status(400).json({
          success: false,
          message: 'No se encontró descanso iniciado para hoy'
        });
        return;
      }

      attendanceRecord.endBreak();
      await attendanceRecord.save();

      res.status(200).json({
        success: true,
        message: 'Descanso terminado exitosamente',
        data: attendanceRecord
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
   * Obtener registros de asistencia de un empleado
   */
  static async getEmployeeAttendance(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const { startDate, endDate } = req.query;
      const businessId = req.user?.businessId || req.params.businessId;

      if (!businessId || !employeeId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y employeeId son requeridos'
        });
        return;
      }

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const attendanceRecords = await AttendanceRecord.getEmployeeAttendance(
        businessId,
        employeeId,
        start,
        end
      );

      res.status(200).json({
        success: true,
        message: 'Registros de asistencia obtenidos exitosamente',
        data: attendanceRecords
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
   * Obtener resumen de asistencia
   */
  static async getAttendanceSummary(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const { startDate, endDate, periodType = 'monthly' } = req.query;
      const businessId = req.user?.businessId || req.params.businessId;

      if (!businessId || !employeeId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y employeeId son requeridos'
        });
        return;
      }

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const summary = await AttendanceRecord.generateSummary(
        businessId,
        employeeId,
        { startDate: start, endDate: end, periodType: periodType as string }
      );

      res.status(200).json({
        success: true,
        message: 'Resumen de asistencia obtenido exitosamente',
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
   * Obtener todos los registros de asistencia
   */
  static async getAllAttendance(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate, status, employeeId } = req.query;
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

      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }

      if (status) {
        query.status = status;
      }

      if (employeeId) {
        query.employeeId = employeeId;
      }

      const attendanceRecords = await AttendanceRecord.find(query)
        .populate('employeeId', 'firstName lastName userInfo.department userInfo.position')
        .sort({ date: -1 })
        .limit(limit as number * 1)
        .skip((page as number - 1) * (limit as number));

      const total = await AttendanceRecord.countDocuments(query);

      res.status(200).json({
        success: true,
        message: 'Registros de asistencia obtenidos exitosamente',
        data: {
          records: attendanceRecords,
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
   * Crear regla de asistencia
   */
  static async createAttendanceRule(req: Request, res: Response): Promise<void> {
    try {
      const ruleData = req.body;
      const businessId = req.user?.businessId || req.body.businessId;
      const createdBy = req.user?.id;

      if (!businessId || !createdBy) {
        res.status(400).json({
          success: false,
          message: 'BusinessId y createdBy son requeridos'
        });
        return;
      }

      const rule = new AttendanceRule({
        ...ruleData,
        businessId,
        createdBy
      });

      await rule.save();

      res.status(201).json({
        success: true,
        message: 'Regla de asistencia creada exitosamente',
        data: rule
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
   * Obtener reglas de asistencia
   */
  static async getAttendanceRules(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.user?.businessId || req.params.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const rules = await AttendanceRule.find({
        businessId,
        isActive: true
      }).sort({ effectiveDate: -1 });

      res.status(200).json({
        success: true,
        message: 'Reglas de asistencia obtenidas exitosamente',
        data: rules
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
   * Actualizar registro de asistencia manualmente
   */
  static async updateAttendanceRecord(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const businessId = req.user?.businessId || req.params.businessId;

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: 'BusinessId es requerido'
        });
        return;
      }

      const record = await AttendanceRecord.findOneAndUpdate(
        { _id: id, businessId },
        updateData,
        { new: true }
      );

      if (!record) {
        res.status(404).json({
          success: false,
          message: 'Registro de asistencia no encontrado'
        });
        return;
      }

      // Recalcular horas si se actualizaron los tiempos
      if (updateData.checkIn || updateData.checkOut || updateData.breakHours) {
        record.calculateHours();
        await record.save();
      }

      res.status(200).json({
        success: true,
        message: 'Registro de asistencia actualizado exitosamente',
        data: record
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
   * Aprobar registro de asistencia
   */
  static async approveAttendanceRecord(req: Request, res: Response): Promise<void> {
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

      const record = await AttendanceRecord.findOneAndUpdate(
        { _id: id, businessId },
        {
          approvedBy,
          approvedAt: new Date(),
          notes: notes || record?.notes
        },
        { new: true }
      );

      if (!record) {
        res.status(404).json({
          success: false,
          message: 'Registro de asistencia no encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Registro de asistencia aprobado exitosamente',
        data: record
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

import Commission from '../models/commission';
import CommissionPeriod from '../models/commissionPeriod';
import CommissionPeriodConfig from '../models/commissionPeriodConfig';
import Person from '../models/person';
import CashBalance from '../models/cashBalance';
import CashTransaction from '../models/cashTransaction';

export class CommissionPeriodService {

  /**
   * Crear período de comisiones
   */
  static async createPeriod(
    businessId: string,
    periodNumber: number,
    year: number,
    startDate: Date,
    endDate: Date,
    payDate: Date,
    createdBy: string
  ): Promise<any> {
    try {
      // Verificar que no existe un período con el mismo número y año
      const existingPeriod = await CommissionPeriod.findOne({
        businessId,
        year,
        periodNumber
      });

      if (existingPeriod) {
        throw new Error(`Ya existe un período ${periodNumber} para el año ${year}`);
      }

      // Crear el período
      const period = new CommissionPeriod({
        businessId,
        periodNumber,
        year,
        startDate,
        endDate,
        payDate,
        status: 'open',
        summary: {
          totalExperts: 0,
          totalCommissions: 0,
          totalCount: 0,
          pendingAmount: 0,
          approvedAmount: 0,
          paidAmount: 0,
          cancelledAmount: 0
        },
        expertCommissions: []
      });

      await period.save();
      return period;

    } catch (error) {
      console.error('Error creando período de comisiones:', error);
      throw error;
    }
  }

  /**
   * Cerrar período y procesar comisiones
   */
  static async closePeriod(
    businessId: string,
    periodId: string,
    processedBy: string,
    notes?: string
  ): Promise<any> {
    try {
      const period = await CommissionPeriod.findOne({
        _id: periodId,
        businessId
      });

      if (!period) {
        throw new Error('Período no encontrado');
      }

      if (period.status !== 'open') {
        throw new Error('Solo se pueden cerrar períodos abiertos');
      }

      // Obtener todas las comisiones del período
      const commissions = await Commission.find({
        businessId,
        createdAt: {
          $gte: period.startDate,
          $lte: period.endDate
        },
        status: { $in: ['pending', 'approved'] }
      }).populate('expertId', 'firstName lastName expertInfo.alias');

      if (commissions.length === 0) {
        throw new Error('No hay comisiones para procesar en este período');
      }

      // Agrupar comisiones por experto
      const expertCommissionsMap = new Map();

      commissions.forEach(commission => {
        const expertId = commission.expertId.toString();
        const expert = commission.expertId as any;

        if (!expertCommissionsMap.has(expertId)) {
          expertCommissionsMap.set(expertId, {
            expertId,
            expertName: `${expert.firstName} ${expert.lastName}`,
            expertAlias: expert.expertInfo?.alias || '',
            totalCommissions: 0,
            commissionCount: 0,
            serviceCommissions: 0,
            retailCommissions: 0,
            exceptionalCommissions: 0,
            status: 'pending',
            commissionIds: []
          });
        }

        const expertData = expertCommissionsMap.get(expertId);
        expertData.totalCommissions += commission.commissionAmount;
        expertData.commissionCount += 1;
        expertData.commissionIds.push(commission._id.toString());

        // Clasificar por tipo de comisión
        switch (commission.commissionType) {
          case 'service':
            expertData.serviceCommissions += commission.commissionAmount;
            break;
          case 'retail':
            expertData.retailCommissions += commission.commissionAmount;
            break;
          case 'exceptional':
            expertData.exceptionalCommissions += commission.commissionAmount;
            break;
        }
      });

      // Convertir mapa a array
      const expertCommissions = Array.from(expertCommissionsMap.values());

      // Actualizar el período
      period.expertCommissions = expertCommissions;
      period.summary.totalExperts = expertCommissions.length;
      period.summary.totalCommissions = expertCommissions.reduce((sum, expert) => sum + expert.totalCommissions, 0);
      period.summary.totalCount = expertCommissions.reduce((sum, expert) => sum + expert.commissionCount, 0);
      period.summary.pendingAmount = period.summary.totalCommissions;

      // Cerrar el período
      await period.close(processedBy, notes);

      return period;

    } catch (error) {
      console.error('Error cerrando período de comisiones:', error);
      throw error;
    }
  }

  /**
   * Aprobar período de comisiones
   */
  static async approvePeriod(
    businessId: string,
    periodId: string,
    approvedBy: string,
    notes?: string
  ): Promise<any> {
    try {
      const period = await CommissionPeriod.findOne({
        _id: periodId,
        businessId
      });

      if (!period) {
        throw new Error('Período no encontrado');
      }

      if (period.status !== 'closed') {
        throw new Error('Solo se pueden aprobar períodos cerrados');
      }

      // Aprobar el período
      await period.approve(approvedBy, notes);

      // Actualizar estado de las comisiones individuales
      const commissionIds = period.expertCommissions.flatMap(expert => expert.commissionIds);
      
      await Commission.updateMany(
        { _id: { $in: commissionIds } },
        { 
          status: 'approved',
          updatedBy: approvedBy
        }
      );

      return period;

    } catch (error) {
      console.error('Error aprobando período de comisiones:', error);
      throw error;
    }
  }

  /**
   * Pagar período de comisiones
   */
  static async payPeriod(
    businessId: string,
    periodId: string,
    paidBy: string,
    paymentMethod: string,
    notes?: string
  ): Promise<any> {
    try {
      const period = await CommissionPeriod.findOne({
        _id: periodId,
        businessId
      });

      if (!period) {
        throw new Error('Período no encontrado');
      }

      if (period.status !== 'approved') {
        throw new Error('Solo se pueden pagar períodos aprobados');
      }

      // Pagar el período
      await period.pay(paidBy, paymentMethod, notes);

      // Actualizar estado de las comisiones individuales
      const commissionIds = period.expertCommissions.flatMap(expert => expert.commissionIds);
      
      await Commission.updateMany(
        { _id: { $in: commissionIds } },
        { 
          status: 'paid',
          paymentDate: new Date(),
          paymentMethod,
          paymentNotes: notes,
          updatedBy: paidBy
        }
      );

      // Crear transacción de caja si es pago en efectivo
      if (paymentMethod === 'cash') {
        await CashTransaction.create({
          businessId,
          type: 'commission_payment',
          amount: -period.summary.totalCommissions,
          description: `Pago de comisiones - Período ${period.periodNumber}/${period.year}`,
          reference: period._id.toString(),
          processedBy: paidBy
        });

        // Actualizar balance de caja
        await CashBalance.updateBalance(businessId, -period.summary.totalCommissions, 'commission_payment');
      }

      return period;

    } catch (error) {
      console.error('Error pagando período de comisiones:', error);
      throw error;
    }
  }

  /**
   * Generar períodos automáticamente para un año
   */
  static async generateYearlyPeriods(
    businessId: string,
    year: number,
    createdBy: string
  ): Promise<any[]> {
    try {
      // Obtener configuración activa
      const config = await CommissionPeriodConfig.getActiveConfig(businessId);
      
      if (!config) {
        throw new Error('No hay configuración activa de períodos de comisiones');
      }

      // Generar períodos según la configuración
      const periods = await CommissionPeriodConfig.generatePeriods(businessId, year, config);
      
      const createdPeriods = [];
      
      for (const periodData of periods) {
        try {
          const period = await this.createPeriod(
            businessId,
            periodData.periodNumber,
            year,
            periodData.startDate,
            periodData.endDate,
            periodData.payDate,
            createdBy
          );
          createdPeriods.push(period);
        } catch (error) {
          console.warn(`Error creando período ${periodData.periodNumber}:`, error);
        }
      }

      return createdPeriods;

    } catch (error) {
      console.error('Error generando períodos anuales:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen de períodos
   */
  static async getPeriodsSummary(
    businessId: string,
    year?: number
  ): Promise<any> {
    try {
      const filters: any = { businessId };
      if (year) filters.year = year;

      const periods = await CommissionPeriod.find(filters).sort({ year: -1, periodNumber: -1 });

      const summary = {
        totalPeriods: periods.length,
        openPeriods: periods.filter(p => p.status === 'open').length,
        closedPeriods: periods.filter(p => p.status === 'closed').length,
        approvedPeriods: periods.filter(p => p.status === 'approved').length,
        paidPeriods: periods.filter(p => p.status === 'paid').length,
        cancelledPeriods: periods.filter(p => p.status === 'cancelled').length,
        totalCommissions: periods.reduce((sum, p) => sum + p.summary.totalCommissions, 0),
        totalPaid: periods.reduce((sum, p) => sum + p.summary.paidAmount, 0),
        totalPending: periods.reduce((sum, p) => sum + p.summary.pendingAmount, 0),
        totalApproved: periods.reduce((sum, p) => sum + p.summary.approvedAmount, 0),
        byYear: {}
      };

      // Agrupar por año
      periods.forEach(period => {
        if (!summary.byYear[period.year]) {
          summary.byYear[period.year] = {
            totalPeriods: 0,
            totalCommissions: 0,
            totalPaid: 0,
            totalPending: 0,
            totalApproved: 0
          };
        }
        
        const yearData = summary.byYear[period.year];
        yearData.totalPeriods += 1;
        yearData.totalCommissions += period.summary.totalCommissions;
        yearData.totalPaid += period.summary.paidAmount;
        yearData.totalPending += period.summary.pendingAmount;
        yearData.totalApproved += period.summary.approvedAmount;
      });

      return {
        summary,
        periods: periods.slice(0, 10) // Últimos 10 períodos
      };

    } catch (error) {
      console.error('Error obteniendo resumen de períodos:', error);
      throw error;
    }
  }

  /**
   * Obtener períodos pendientes de pago
   */
  static async getPendingPayments(businessId: string): Promise<any[]> {
    try {
      const now = new Date();
      
      const pendingPeriods = await CommissionPeriod.find({
        businessId,
        status: { $in: ['closed', 'approved'] },
        payDate: { $lte: now }
      }).sort({ payDate: 1 });

      return pendingPeriods;

    } catch (error) {
      console.error('Error obteniendo períodos pendientes de pago:', error);
      throw error;
    }
  }

  /**
   * Obtener períodos vencidos
   */
  static async getOverduePeriods(businessId: string): Promise<any[]> {
    try {
      const now = new Date();
      
      const overduePeriods = await CommissionPeriod.find({
        businessId,
        status: { $in: ['closed', 'approved'] },
        payDate: { $lt: now }
      }).sort({ payDate: 1 });

      return overduePeriods;

    } catch (error) {
      console.error('Error obteniendo períodos vencidos:', error);
      throw error;
    }
  }

  /**
   * Recalcular período
   */
  static async recalculatePeriod(
    businessId: string,
    periodId: string
  ): Promise<any> {
    try {
      const period = await CommissionPeriod.findOne({
        _id: periodId,
        businessId
      });

      if (!period) {
        throw new Error('Período no encontrado');
      }

      // Obtener comisiones actualizadas del período
      const commissions = await Commission.find({
        businessId,
        createdAt: {
          $gte: period.startDate,
          $lte: period.endDate
        }
      }).populate('expertId', 'firstName lastName expertInfo.alias');

      // Reagrupar comisiones por experto
      const expertCommissionsMap = new Map();

      commissions.forEach(commission => {
        const expertId = commission.expertId.toString();
        const expert = commission.expertId as any;

        if (!expertCommissionsMap.has(expertId)) {
          expertCommissionsMap.set(expertId, {
            expertId,
            expertName: `${expert.firstName} ${expert.lastName}`,
            expertAlias: expert.expertInfo?.alias || '',
            totalCommissions: 0,
            commissionCount: 0,
            serviceCommissions: 0,
            retailCommissions: 0,
            exceptionalCommissions: 0,
            status: 'pending',
            commissionIds: []
          });
        }

        const expertData = expertCommissionsMap.get(expertId);
        expertData.totalCommissions += commission.commissionAmount;
        expertData.commissionCount += 1;
        expertData.commissionIds.push(commission._id.toString());

        // Clasificar por tipo de comisión
        switch (commission.commissionType) {
          case 'service':
            expertData.serviceCommissions += commission.commissionAmount;
            break;
          case 'retail':
            expertData.retailCommissions += commission.commissionAmount;
            break;
          case 'exceptional':
            expertData.exceptionalCommissions += commission.commissionAmount;
            break;
        }
      });

      // Actualizar el período
      period.expertCommissions = Array.from(expertCommissionsMap.values());
      await period.recalculate();

      return period;

    } catch (error) {
      console.error('Error recalculando período:', error);
      throw error;
    }
  }

  /**
   * Obtener comisiones de un experto en un período
   */
  static async getExpertPeriodCommissions(
    businessId: string,
    expertId: string,
    periodId: string
  ): Promise<any> {
    try {
      const period = await CommissionPeriod.findOne({
        _id: periodId,
        businessId
      });

      if (!period) {
        throw new Error('Período no encontrado');
      }

      const expertCommission = period.expertCommissions.find(
        ec => ec.expertId === expertId
      );

      if (!expertCommission) {
        return {
          expertId,
          totalCommissions: 0,
          commissionCount: 0,
          commissions: []
        };
      }

      // Obtener detalles de las comisiones
      const commissions = await Commission.find({
        _id: { $in: expertCommission.commissionIds }
      }).populate('saleId', 'idSale nameClient date total');

      return {
        ...expertCommission,
        commissions
      };

    } catch (error) {
      console.error('Error obteniendo comisiones del experto en período:', error);
      throw error;
    }
  }
}

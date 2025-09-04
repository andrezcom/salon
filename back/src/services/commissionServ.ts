import Commission from '../models/commission';
import Person from '../models/person';
import Sale from '../models/sale';

export class CommissionService {
  
  // Crear comisiones automáticamente para una venta
  static async createCommissionsForSale(businessId: string, saleId: string, userId: string) {
    try {
      const sale = await Sale.findOne({ businessId, _id: saleId });
      
      if (!sale) {
        throw new Error('Venta no encontrada');
      }

      // Limpiar comisiones existentes
      await Commission.deleteMany({ businessId, saleId });

      const createdCommissions = [];

      // Crear comisiones por servicios
      for (const service of sale.services) {
        try {
          const expert = await Person.findOne({ 
            _id: service.expertId.toString(),
            personType: 'expert',
            active: true 
          });

          if (expert && expert.active) {
            // Calcular costos de insumos
            const inputCosts = service.input.reduce((total: number, input: any) => total + input.amount, 0);
            
            // Calcular comisión base
            const baseCommissionRate = expert.expertInfo?.commissionSettings?.serviceCommission || 0;
            const appliedCommissionRate = baseCommissionRate;
            
            // Calcular monto neto según método de cálculo
            let netAmount = service.amount;
            if (expert.expertInfo?.commissionSettings?.serviceCalculationMethod === 'after_inputs') {
              netAmount = service.amount - inputCosts;
            }
            
            // Calcular comisión
            let commissionAmount = 0;
            if (expert.expertInfo?.commissionSettings?.serviceCalculationMethod === 'before_inputs') {
              commissionAmount = (service.amount * baseCommissionRate) / 100;
            } else {
              commissionAmount = (netAmount * baseCommissionRate) / 100;
            }
            
            // Aplicar límites
            const minCommission = expert.expertInfo?.commissionSettings?.minimumServiceCommission || 0;
            const maxCommission = expert.expertInfo?.commissionSettings?.maximumServiceCommission || Infinity;
            commissionAmount = Math.max(minCommission, Math.min(commissionAmount, maxCommission));
            
            // Crear comisión
            const commission = new Commission({
              businessId,
              expertId: expert._id.toString(),
              saleId: sale._id.toString(),
              commissionType: 'service',
              serviceId: service.serviceId,
              baseAmount: service.amount,
              inputCosts,
              netAmount,
              baseCommissionRate,
              appliedCommissionRate,
              commissionAmount,
              status: 'pending',
              createdBy: userId,
              updatedBy: userId
            });

            await commission.save();
            createdCommissions.push(commission);
          }
        } catch (error) {
          console.error(`Error creando comisión para servicio ${service.serviceId}:`, error);
        }
      }

      // Crear comisiones por retail
      for (const retail of sale.retail) {
        try {
          const expert = await Person.findOne({ 
            _id: retail.expertId.toString(),
            personType: 'expert',
            active: true 
          });

          if (expert && expert.active) {
            // Calcular comisión por retail
            const baseCommissionRate = expert.expertInfo?.commissionSettings?.retailCommission || 0;
            const appliedCommissionRate = baseCommissionRate;
            const commissionAmount = (retail.amount * baseCommissionRate) / 100;
            
            // Crear comisión
            const commission = new Commission({
              businessId,
              expertId: expert._id.toString(),
              saleId: sale._id.toString(),
              commissionType: 'retail',
              retailId: retail.productId.toString(),
              baseAmount: retail.amount,
              netAmount: retail.amount,
              baseCommissionRate,
              appliedCommissionRate,
              commissionAmount,
              status: 'pending',
              createdBy: userId,
              updatedBy: userId
            });

            await commission.save();
            createdCommissions.push(commission);
          }
        } catch (error) {
          console.error(`Error creando comisión para retail ${retail.productId}:`, error);
        }
      }

      // Actualizar la venta con las comisiones creadas
      sale.commissions = createdCommissions.map(commission => ({
        expertId: commission.expertId,
        commissionType: commission.commissionType,
        serviceId: commission.serviceId,
        retailId: commission.retailId,
        baseAmount: commission.baseAmount,
        inputCosts: commission.inputCosts,
        netAmount: commission.netAmount,
        baseCommissionRate: commission.baseCommissionRate,
        appliedCommissionRate: commission.appliedCommissionRate,
        commissionAmount: commission.commissionAmount,
        status: commission.status
      }));

      await sale.save();

      return createdCommissions;

    } catch (error) {
      console.error('Error creando comisiones para la venta:', error);
      throw error;
    }
  }

  // Aplicar evento excepcional
  static async applyExceptionalEvent(
    businessId: string,
    commissionId: string,
    exceptionalData: {
      reason: string;
      adjustmentType: 'increase' | 'decrease';
      adjustmentAmount: number;
      adjustmentPercentage?: number;
      notes?: string;
    },
    userId: string
  ) {
    try {
      const commission = await Commission.findOne({ businessId, _id: commissionId });
      
      if (!commission) {
        throw new Error('Comisión no encontrada');
      }

      if (commission.status !== 'pending') {
        throw new Error('Solo se pueden aplicar eventos excepcionales a comisiones pendientes');
      }

      // Aplicar el evento excepcional
      await commission.applyExceptionalEvent(
        exceptionalData.reason,
        exceptionalData.adjustmentType,
        exceptionalData.adjustmentAmount,
        userId,
        exceptionalData.adjustmentPercentage,
        exceptionalData.notes
      );

      return commission;

    } catch (error) {
      console.error('Error aplicando evento excepcional:', error);
      throw error;
    }
  }

  // Aprobar comisión
  static async approveCommission(businessId: string, commissionId: string, userId: string, notes?: string) {
    try {
      const commission = await Commission.findOne({ businessId, _id: commissionId });
      
      if (!commission) {
        throw new Error('Comisión no encontrada');
      }

      if (commission.status !== 'pending') {
        throw new Error('Solo se pueden aprobar comisiones pendientes');
      }

      commission.status = 'approved';
      commission.updatedBy = userId;
      
      if (notes) {
        if (!commission.exceptionalEvent) {
          commission.exceptionalEvent = {} as any;
        }
        commission.exceptionalEvent.notes = notes;
      }

      await commission.save();
      return commission;

    } catch (error) {
      console.error('Error aprobando comisión:', error);
      throw error;
    }
  }

  // Marcar comisión como pagada
  static async markAsPaid(
    businessId: string, 
    commissionId: string, 
    userId: string, 
    paymentMethod: string, 
    notes?: string
  ) {
    try {
      const commission = await Commission.findOne({ businessId, _id: commissionId });
      
      if (!commission) {
        throw new Error('Comisión no encontrada');
      }

      if (commission.status !== 'approved') {
        throw new Error('Solo se pueden pagar comisiones aprobadas');
      }

      await commission.markAsPaid(paymentMethod, notes);
      return commission;

    } catch (error) {
      console.error('Error marcando comisión como pagada:', error);
      throw error;
    }
  }

  // Cancelar comisión
  static async cancelCommission(businessId: string, commissionId: string, userId: string, reason: string) {
    try {
      const commission = await Commission.findOne({ businessId, _id: commissionId });
      
      if (!commission) {
        throw new Error('Comisión no encontrada');
      }

      if (commission.status === 'paid') {
        throw new Error('No se puede cancelar una comisión ya pagada');
      }

      commission.status = 'cancelled';
      commission.updatedBy = userId;
      
      if (!commission.exceptionalEvent) {
        commission.exceptionalEvent = {} as any;
      }
      commission.exceptionalEvent.notes = `Cancelada: ${reason}`;

      await commission.save();
      return commission;

    } catch (error) {
      console.error('Error cancelando comisión:', error);
      throw error;
    }
  }

  // Obtener resumen de comisiones por experto
  static async getExpertCommissionSummary(businessId: string, expertId: string, startDate?: Date, endDate?: Date) {
    try {
      const filters: any = { businessId, expertId };
      
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.$gte = startDate;
        if (endDate) filters.createdAt.$lte = endDate;
      }

      const summary = await Commission.aggregate([
        { $match: filters },
        {
          $group: {
            _id: null,
            totalCommissions: { $sum: '$commissionAmount' },
            totalCount: { $sum: 1 },
            pendingAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, '$commissionAmount', 0]
              }
            },
            approvedAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'approved'] }, '$commissionAmount', 0]
              }
            },
            paidAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'paid'] }, '$commissionAmount', 0]
              }
            },
            cancelledAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'cancelled'] }, '$commissionAmount', 0]
              }
            },
            byType: {
              $push: {
                type: '$commissionType',
                amount: '$commissionAmount',
                status: '$status'
              }
            }
          }
        }
      ]);

      return summary[0] || {
        totalCommissions: 0,
        totalCount: 0,
        pendingAmount: 0,
        approvedAmount: 0,
        paidAmount: 0,
        cancelledAmount: 0,
        byType: []
      };

    } catch (error) {
      console.error('Error obteniendo resumen de comisiones del experto:', error);
      throw error;
    }
  }

  // Obtener comisiones pendientes de aprobación
  static async getPendingCommissions(businessId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const commissions = await Commission.find({ 
        businessId, 
        status: 'pending' 
      })
      .populate('expertId', 'nameExpert aliasExpert')
      .populate('saleId', 'idSale nameClient date total')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

      const total = await Commission.countDocuments({ 
        businessId, 
        status: 'pending' 
      });

      return {
        commissions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      console.error('Error obteniendo comisiones pendientes:', error);
      throw error;
    }
  }

  // Obtener comisiones aprobadas pendientes de pago
  static async getApprovedCommissions(businessId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const commissions = await Commission.find({ 
        businessId, 
        status: 'approved' 
      })
      .populate('expertId', 'nameExpert aliasExpert')
      .populate('saleId', 'idSale nameClient date total')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

      const total = await Commission.countDocuments({ 
        businessId, 
        status: 'approved' 
      });

      return {
        commissions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      console.error('Error obteniendo comisiones aprobadas:', error);
      throw error;
    }
  }

  // Recalcular comisiones de una venta
  static async recalculateSaleCommissions(businessId: string, saleId: string, userId: string) {
    try {
      const sale = await Sale.findOne({ businessId, _id: saleId });
      
      if (!sale) {
        throw new Error('Venta no encontrada');
      }

      // Recalcular comisiones
      await sale.calculateCommissions();

      // Obtener la venta actualizada
      const updatedSale = await Sale.findById(saleId)
        .populate('commissions.expertId', 'nameExpert aliasExpert');

      return updatedSale;

    } catch (error) {
      console.error('Error recalculando comisiones:', error);
      throw error;
    }
  }
}

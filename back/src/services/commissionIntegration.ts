import Commission from '../models/commission';
import CommissionPeriod from '../models/commissionPeriod';
import CommissionPeriodConfig from '../models/commissionPeriodConfig';
import Sale from '../models/sale';
import Person from '../models/person';

export class CommissionIntegrationService {

  /**
   * Integrar comisiones de ventas con el sistema de períodos
   */
  static async integrateSaleCommissions(
    businessId: string,
    saleId: string,
    createdBy: string
  ): Promise<void> {
    try {
      // Obtener la venta
      const sale = await Sale.findOne({ _id: saleId, businessId });
      
      if (!sale) {
        throw new Error('Venta no encontrada');
      }

      // Verificar si ya tiene comisiones integradas
      if (sale.commissions && sale.commissions.length > 0) {
        console.log(`Venta ${saleId} ya tiene comisiones integradas`);
        return;
      }

      // Obtener período actual
      const currentPeriod = await CommissionPeriod.getCurrentPeriod(businessId);
      
      if (!currentPeriod) {
        console.warn(`No hay período actual abierto para el negocio ${businessId}`);
        return;
      }

      // Calcular comisiones para servicios
      const serviceCommissions = [];
      
      if (sale.services && sale.services.length > 0) {
        for (const service of sale.services) {
          if (service.expertId) {
            // Obtener información del experto
            const expert = await Person.findOne({
              _id: service.expertId,
              personType: 'expert',
              active: true
            });

            if (expert && expert.expertInfo?.commissionSettings) {
              const commissionSettings = expert.expertInfo.commissionSettings;
              const baseAmount = service.amount;
              const inputCosts = service.input.reduce((sum, input) => sum + input.amount, 0);
              const netAmount = baseAmount - inputCosts;
              
              // Calcular comisión
              const commissionRate = commissionSettings.serviceCommissionRate || 0;
              const commissionAmount = (netAmount * commissionRate) / 100;

              if (commissionAmount > 0) {
                // Crear comisión individual
                const commission = new Commission({
                  businessId,
                  expertId: service.expertId,
                  saleId: sale._id.toString(),
                  commissionType: 'service',
                  serviceId: service.serviceId,
                  baseAmount,
                  inputCosts,
                  netAmount,
                  baseCommissionRate: commissionRate,
                  appliedCommissionRate: commissionRate,
                  commissionAmount,
                  status: 'pending',
                  createdBy,
                  updatedBy: createdBy
                });

                await commission.save();

                // Agregar a comisiones de la venta
                serviceCommissions.push({
                  expertId: service.expertId,
                  commissionType: 'service',
                  serviceId: service.serviceId,
                  baseAmount,
                  inputCosts,
                  netAmount,
                  baseCommissionRate: commissionRate,
                  appliedCommissionRate: commissionRate,
                  commissionAmount,
                  status: 'pending'
                });
              }
            }
          }
        }
      }

      // Calcular comisiones para retail
      const retailCommissions = [];
      
      if (sale.retail && sale.retail.length > 0) {
        for (const retail of sale.retail) {
          if (retail.expertId) {
            // Obtener información del experto
            const expert = await Person.findOne({
              _id: retail.expertId,
              personType: 'expert',
              active: true
            });

            if (expert && expert.expertInfo?.commissionSettings) {
              const commissionSettings = expert.expertInfo.commissionSettings;
              const baseAmount = retail.amount;
              
              // Calcular comisión
              const commissionRate = commissionSettings.retailCommissionRate || 0;
              const commissionAmount = (baseAmount * commissionRate) / 100;

              if (commissionAmount > 0) {
                // Crear comisión individual
                const commission = new Commission({
                  businessId,
                  expertId: retail.expertId,
                  saleId: sale._id.toString(),
                  commissionType: 'retail',
                  retailId: retail.productId.toString(),
                  baseAmount,
                  netAmount: baseAmount,
                  baseCommissionRate: commissionRate,
                  appliedCommissionRate: commissionRate,
                  commissionAmount,
                  status: 'pending',
                  createdBy,
                  updatedBy: createdBy
                });

                await commission.save();

                // Agregar a comisiones de la venta
                retailCommissions.push({
                  expertId: retail.expertId,
                  commissionType: 'retail',
                  retailId: retail.productId.toString(),
                  baseAmount,
                  netAmount: baseAmount,
                  baseCommissionRate: commissionRate,
                  appliedCommissionRate: commissionRate,
                  commissionAmount,
                  status: 'pending'
                });
              }
            }
          }
        }
      }

      // Actualizar la venta con las comisiones calculadas
      const allCommissions = [...serviceCommissions, ...retailCommissions];
      
      if (allCommissions.length > 0) {
        sale.commissions = allCommissions;
        await sale.save();
        
        console.log(`Comisiones integradas para venta ${saleId}: ${allCommissions.length} comisiones`);
      }

    } catch (error) {
      console.error('Error integrando comisiones de venta:', error);
      throw error;
    }
  }

  /**
   * Migrar comisiones existentes al sistema de períodos
   */
  static async migrateExistingCommissions(
    businessId: string,
    startDate: Date,
    endDate: Date,
    migratedBy: string
  ): Promise<{ migrated: number; errors: number }> {
    try {
      let migrated = 0;
      let errors = 0;

      // Obtener ventas con comisiones en el rango de fechas
      const sales = await Sale.find({
        businessId,
        createdAt: { $gte: startDate, $lte: endDate },
        commissions: { $exists: true, $ne: [] }
      });

      console.log(`Migrando comisiones de ${sales.length} ventas`);

      for (const sale of sales) {
        try {
          if (sale.commissions && sale.commissions.length > 0) {
            for (const saleCommission of sale.commissions) {
              // Verificar si ya existe la comisión individual
              const existingCommission = await Commission.findOne({
                businessId,
                saleId: sale._id.toString(),
                expertId: saleCommission.expertId,
                commissionType: saleCommission.commissionType
              });

              if (!existingCommission) {
                // Crear comisión individual
                const commission = new Commission({
                  businessId,
                  expertId: saleCommission.expertId,
                  saleId: sale._id.toString(),
                  commissionType: saleCommission.commissionType,
                  serviceId: saleCommission.serviceId,
                  retailId: saleCommission.retailId,
                  baseAmount: saleCommission.baseAmount,
                  inputCosts: saleCommission.inputCosts,
                  netAmount: saleCommission.netAmount,
                  baseCommissionRate: saleCommission.baseCommissionRate,
                  appliedCommissionRate: saleCommission.appliedCommissionRate,
                  commissionAmount: saleCommission.commissionAmount,
                  status: saleCommission.status,
                  createdBy: migratedBy,
                  updatedBy: migratedBy
                });

                await commission.save();
                migrated++;
              }
            }
          }
        } catch (error) {
          console.error(`Error migrando comisiones de venta ${sale._id}:`, error);
          errors++;
        }
      }

      console.log(`Migración completada: ${migrated} comisiones migradas, ${errors} errores`);
      
      return { migrated, errors };

    } catch (error) {
      console.error('Error en migración de comisiones:', error);
      throw error;
    }
  }

  /**
   * Sincronizar comisiones con períodos existentes
   */
  static async syncCommissionsWithPeriods(
    businessId: string,
    periodId: string
  ): Promise<void> {
    try {
      const period = await CommissionPeriod.findOne({ _id: periodId, businessId });
      
      if (!period) {
        throw new Error('Período no encontrado');
      }

      // Obtener comisiones del período
      const commissions = await Commission.find({
        businessId,
        createdAt: {
          $gte: period.startDate,
          $lte: period.endDate
        }
      });

      // Agrupar por experto
      const expertCommissionsMap = new Map();

      commissions.forEach(commission => {
        const expertId = commission.expertId.toString();

        if (!expertCommissionsMap.has(expertId)) {
          expertCommissionsMap.set(expertId, {
            expertId,
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

        // Clasificar por tipo
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

      // Obtener información de expertos
      const expertIds = Array.from(expertCommissionsMap.keys());
      const experts = await Person.find({
        _id: { $in: expertIds },
        personType: 'expert'
      });

      // Actualizar período con información de expertos
      const expertCommissions = Array.from(expertCommissionsMap.values()).map(expertData => {
        const expert = experts.find(e => e._id.toString() === expertData.expertId);
        
        return {
          ...expertData,
          expertName: expert ? `${expert.firstName} ${expert.lastName}` : 'Experto no encontrado',
          expertAlias: expert?.expertInfo?.alias || ''
        };
      });

      period.expertCommissions = expertCommissions;
      await period.recalculate();

      console.log(`Período ${periodId} sincronizado con ${commissions.length} comisiones`);

    } catch (error) {
      console.error('Error sincronizando comisiones con período:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de integración
   */
  static async getIntegrationStats(businessId: string): Promise<any> {
    try {
      // Contar comisiones individuales
      const totalCommissions = await Commission.countDocuments({ businessId });
      const pendingCommissions = await Commission.countDocuments({ 
        businessId, 
        status: 'pending' 
      });
      const approvedCommissions = await Commission.countDocuments({ 
        businessId, 
        status: 'approved' 
      });
      const paidCommissions = await Commission.countDocuments({ 
        businessId, 
        status: 'paid' 
      });

      // Contar períodos
      const totalPeriods = await CommissionPeriod.countDocuments({ businessId });
      const openPeriods = await CommissionPeriod.countDocuments({ 
        businessId, 
        status: 'open' 
      });
      const closedPeriods = await CommissionPeriod.countDocuments({ 
        businessId, 
        status: 'closed' 
      });
      const paidPeriods = await CommissionPeriod.countDocuments({ 
        businessId, 
        status: 'paid' 
      });

      // Calcular totales
      const totalCommissionAmount = await Commission.aggregate([
        { $match: { businessId } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
      ]);

      const totalPaidAmount = await Commission.aggregate([
        { $match: { businessId, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
      ]);

      return {
        commissions: {
          total: totalCommissions,
          pending: pendingCommissions,
          approved: approvedCommissions,
          paid: paidCommissions,
          totalAmount: totalCommissionAmount[0]?.total || 0,
          paidAmount: totalPaidAmount[0]?.total || 0
        },
        periods: {
          total: totalPeriods,
          open: openPeriods,
          closed: closedPeriods,
          paid: paidPeriods
        },
        integration: {
          isActive: totalCommissions > 0,
          lastSync: new Date(),
          status: totalCommissions > 0 ? 'active' : 'inactive'
        }
      };

    } catch (error) {
      console.error('Error obteniendo estadísticas de integración:', error);
      throw error;
    }
  }
}

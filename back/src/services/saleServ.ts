import Sale from '../models/sale';
import Person from '../models/person';
import Commission from '../models/commission';
import * as type from '../types.';

export async function getSalesSrv() {
  try {
    const saleList = await Sale.find()
      .populate('services.expertId', 'firstName lastName expertInfo.alias')
      .populate('retail.expertId', 'firstName lastName expertInfo.alias')
      .sort({ date: -1 });
    return saleList;
  } catch (error) {
    throw new Error('Error fetching sales');
  }
}

export async function postSaleSrv(sale: type.Sale) {
  try {
    // Validar que los expertos existen y son del tipo correcto
    const expertIds = [
      ...sale.services.map(s => s.expertId),
      ...sale.retail.map(r => r.expertId)
    ].filter((id, index, arr) => arr.indexOf(id) === index); // Eliminar duplicados

    const experts = await Person.find({
      _id: { $in: expertIds },
      personType: 'expert',
      active: true
    });

    if (experts.length !== expertIds.length) {
      throw new Error('Uno o más expertos no existen o no están activos');
    }

    // Crear la venta
    const newSale = new Sale(sale);
    
    // Calcular comisiones automáticamente
    await newSale.calculateCommissions();
    
    // Guardar la venta
    const saleCreated = await newSale.save();

    // Crear registros de comisiones
    for (const commission of newSale.commissions) {
      const commissionRecord = new Commission({
        saleId: newSale._id,
        expertId: commission.expertId,
        commissionType: commission.commissionType,
        serviceId: commission.serviceId,
        baseAmount: commission.baseAmount,
        inputCosts: commission.inputCosts,
        netAmount: commission.netAmount,
        baseCommissionRate: commission.baseCommissionRate,
        appliedCommissionRate: commission.appliedCommissionRate,
        commissionAmount: commission.commissionAmount,
        status: 'pending',
        businessId: sale.businessId,
        createdBy: sale.createdBy
      });

      await commissionRecord.save();
    }

    // Obtener la venta creada con información completa
    const createdSale = await Sale.findById(saleCreated._id)
      .populate('services.expertId', 'firstName lastName expertInfo.alias')
      .populate('retail.expertId', 'firstName lastName expertInfo.alias');

    return createdSale;
  } catch (error) {
    throw new Error(`Error creating sale: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function putSaleSrv(sale: type.Sale) {
  try {
    const existingSale = await Sale.findById(sale._id);
    if (!existingSale) {
      throw new Error('Sale not found');
    }

    // Si se actualizan servicios o retail, recalcular comisiones
    if (sale.services || sale.retail) {
      // Actualizar los datos
      Object.assign(existingSale, sale);
      
      // Recalcular comisiones
      await existingSale.calculateCommissions();
      
      // Actualizar comisiones existentes
      await Commission.deleteMany({ saleId: existingSale._id });
      
      // Crear nuevas comisiones
      for (const commission of existingSale.commissions) {
        const commissionRecord = new Commission({
          saleId: existingSale._id,
          expertId: commission.expertId,
          commissionType: commission.commissionType,
          serviceId: commission.serviceId,
          baseAmount: commission.baseAmount,
          inputCosts: commission.inputCosts,
          netAmount: commission.netAmount,
          baseCommissionRate: commission.baseCommissionRate,
          appliedCommissionRate: commission.appliedCommissionRate,
          commissionAmount: commission.commissionAmount,
          status: 'pending',
          businessId: existingSale.businessId,
          createdBy: sale.createdBy
        });

        await commissionRecord.save();
      }
    } else {
      // Actualización simple sin recalcular comisiones
      Object.assign(existingSale, sale);
    }

    existingSale.updatedAt = new Date();
    await existingSale.save();

    // Obtener la venta actualizada con información completa
    const updatedSale = await Sale.findById(existingSale._id)
      .populate('services.expertId', 'firstName lastName expertInfo.alias')
      .populate('retail.expertId', 'firstName lastName expertInfo.alias');

    return updatedSale;
  } catch (error) {
    throw new Error(`Error updating sale: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function deleteSaleSrv(saleId: string) {
  try {
    const sale = await Sale.findById(saleId);
    if (!sale) {
      throw new Error('Sale not found');
    }

    // Eliminar comisiones relacionadas
    await Commission.deleteMany({ saleId: saleId });

    // Eliminar la venta
    await Sale.findByIdAndDelete(saleId);

    return { success: true, message: 'Sale deleted successfully' };
  } catch (error) {
    throw new Error(`Error deleting sale: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getSalesByExpertSrv(expertId: string, filters: any = {}) {
  try {
    // Verificar que el experto existe
    const expert = await Person.findOne({
      _id: expertId,
      personType: 'expert',
      active: true
    });

    if (!expert) {
      throw new Error('Expert not found');
    }

    // Construir filtros
    const queryFilters: any = {
      $or: [
        { 'services.expertId': expertId },
        { 'retail.expertId': expertId }
      ]
    };

    if (filters.startDate || filters.endDate) {
      queryFilters.date = {};
      if (filters.startDate) queryFilters.date.$gte = new Date(filters.startDate);
      if (filters.endDate) queryFilters.date.$lte = new Date(filters.endDate);
    }

    const sales = await Sale.find(queryFilters)
      .populate('services.expertId', 'firstName lastName expertInfo.alias')
      .populate('retail.expertId', 'firstName lastName expertInfo.alias')
      .sort({ date: -1 });

    // Calcular totales
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalCommissions = await Commission.aggregate([
      { $match: { expertId, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
    ]);

    return {
      expert: {
        id: expert._id,
        name: expert.getFullName(),
        alias: expert.expertInfo?.alias,
        commissionSettings: expert.expertInfo?.commissionSettings
      },
      sales,
      totals: {
        totalSales,
        totalCommissions: totalCommissions[0]?.total || 0
      }
    };
  } catch (error) {
    throw new Error(`Error fetching expert sales: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

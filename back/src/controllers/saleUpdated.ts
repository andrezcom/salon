import { Request, Response } from 'express';
import Sale from '../models/sale';
import Person from '../models/person';
import Commission from '../models/commission';

export class SaleController {

  // Obtener todas las ventas
  static async getAllSales(req: Request, res: Response): Promise<void> {
    try {
      const { 
        page = 1, 
        limit = 10, 
        businessId, 
        expertId,
        status,
        startDate,
        endDate 
      } = req.query;

      // Construir filtros
      const filters: any = {};
      
      if (businessId) {
        filters.businessId = businessId;
      }
      
      if (expertId) {
        filters.$or = [
          { 'services.expertId': expertId },
          { 'retail.expertId': expertId }
        ];
      }
      
      if (status) {
        filters.status = status;
      }
      
      if (startDate || endDate) {
        filters.date = {};
        if (startDate) filters.date.$gte = new Date(startDate as string);
        if (endDate) filters.date.$lte = new Date(endDate as string);
      }

      // Paginación
      const skip = (Number(page) - 1) * Number(limit);

      const sales = await Sale.find(filters)
        .populate('services.expertId', 'firstName lastName expertInfo.alias')
        .populate('retail.expertId', 'firstName lastName expertInfo.alias')
        .skip(skip)
        .limit(Number(limit))
        .sort({ date: -1 });

      const total = await Sale.countDocuments(filters);

      res.json({
        success: true,
        message: 'Ventas obtenidas exitosamente',
        data: {
          sales,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });

    } catch (error) {
      console.error('Error obteniendo ventas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener venta por ID
  static async getSaleById(req: Request, res: Response): Promise<void> {
    try {
      const { saleId } = req.params;

      const sale = await Sale.findById(saleId)
        .populate('services.expertId', 'firstName lastName expertInfo.alias expertInfo.commissionSettings')
        .populate('retail.expertId', 'firstName lastName expertInfo.alias expertInfo.commissionSettings');

      if (!sale) {
        res.status(404).json({
          success: false,
          message: 'Venta no encontrada'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Venta obtenida exitosamente',
        data: { sale }
      });

    } catch (error) {
      console.error('Error obteniendo venta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Crear nueva venta
  static async createSale(req: Request, res: Response): Promise<void> {
    try {
      const {
        idClient,
        nameClient,
        email,
        services,
        retail,
        paymentMethod,
        tipAndChange,
        businessId
      } = req.body;

      const userId = req.user?.id;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
        return;
      }

      // Validar que los expertos existen y son del tipo correcto
      const expertIds = [
        ...services.map((s: any) => s.expertId),
        ...retail.map((r: any) => r.expertId)
      ].filter((id, index, arr) => arr.indexOf(id) === index); // Eliminar duplicados

      const experts = await Person.find({
        _id: { $in: expertIds },
        personType: 'expert',
        active: true
      });

      if (experts.length !== expertIds.length) {
        res.status(400).json({
          success: false,
          message: 'Uno o más expertos no existen o no están activos'
        });
        return;
      }

      // Calcular total
      const servicesTotal = services.reduce((total: number, service: any) => total + service.amount, 0);
      const retailTotal = retail.reduce((total: number, item: any) => total + item.amount, 0);
      const total = servicesTotal + retailTotal;

      // Crear la venta
      const newSale = new Sale({
        idClient,
        nameClient,
        email,
        date: new Date(),
        services,
        retail,
        total,
        paymentMethod,
        tipAndChange,
        businessId,
        status: 'completed',
        createdBy: userId
      });

      // Calcular comisiones automáticamente
      await newSale.calculateCommissions();
      
      // Guardar la venta
      await newSale.save();

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
          businessId,
          createdBy: userId
        });

        await commissionRecord.save();
      }

      // Obtener la venta creada con información completa
      const createdSale = await Sale.findById(newSale._id)
        .populate('services.expertId', 'firstName lastName expertInfo.alias')
        .populate('retail.expertId', 'firstName lastName expertInfo.alias');

      res.status(201).json({
        success: true,
        message: 'Venta creada exitosamente',
        data: { 
          sale: createdSale,
          commissions: newSale.commissions
        }
      });

    } catch (error) {
      console.error('Error creando venta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Actualizar venta
  static async updateSale(req: Request, res: Response): Promise<void> {
    try {
      const { saleId } = req.params;
      const updateData = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
        return;
      }

      const sale = await Sale.findById(saleId);
      if (!sale) {
        res.status(404).json({
          success: false,
          message: 'Venta no encontrada'
        });
        return;
      }

      // Si se actualizan servicios o retail, recalcular comisiones
      if (updateData.services || updateData.retail) {
        // Actualizar los datos
        Object.assign(sale, updateData);
        
        // Recalcular comisiones
        await sale.calculateCommissions();
        
        // Actualizar comisiones existentes
        await Commission.deleteMany({ saleId: sale._id });
        
        // Crear nuevas comisiones
        for (const commission of sale.commissions) {
          const commissionRecord = new Commission({
            saleId: sale._id,
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
            createdBy: userId
          });

          await commissionRecord.save();
        }
      } else {
        // Actualización simple sin recalcular comisiones
        Object.assign(sale, updateData);
      }

      sale.updatedAt = new Date();
      await sale.save();

      // Obtener la venta actualizada con información completa
      const updatedSale = await Sale.findById(sale._id)
        .populate('services.expertId', 'firstName lastName expertInfo.alias')
        .populate('retail.expertId', 'firstName lastName expertInfo.alias');

      res.json({
        success: true,
        message: 'Venta actualizada exitosamente',
        data: { sale: updatedSale }
      });

    } catch (error) {
      console.error('Error actualizando venta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Eliminar venta
  static async deleteSale(req: Request, res: Response): Promise<void> {
    try {
      const { saleId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
        return;
      }

      const sale = await Sale.findById(saleId);
      if (!sale) {
        res.status(404).json({
          success: false,
          message: 'Venta no encontrada'
        });
        return;
      }

      // Eliminar comisiones relacionadas
      await Commission.deleteMany({ saleId: sale._id });

      // Eliminar la venta
      await Sale.findByIdAndDelete(saleId);

      res.json({
        success: true,
        message: 'Venta eliminada exitosamente'
      });

    } catch (error) {
      console.error('Error eliminando venta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener ventas por experto
  static async getSalesByExpert(req: Request, res: Response): Promise<void> {
    try {
      const { expertId } = req.params;
      const { 
        page = 1, 
        limit = 10,
        startDate,
        endDate 
      } = req.query;

      // Verificar que el experto existe
      const expert = await Person.findOne({
        _id: expertId,
        personType: 'expert',
        active: true
      });

      if (!expert) {
        res.status(404).json({
          success: false,
          message: 'Experto no encontrado'
        });
        return;
      }

      // Construir filtros
      const filters: any = {
        $or: [
          { 'services.expertId': expertId },
          { 'retail.expertId': expertId }
        ]
      };

      if (startDate || endDate) {
        filters.date = {};
        if (startDate) filters.date.$gte = new Date(startDate as string);
        if (endDate) filters.date.$lte = new Date(endDate as string);
      }

      // Paginación
      const skip = (Number(page) - 1) * Number(limit);

      const sales = await Sale.find(filters)
        .populate('services.expertId', 'firstName lastName expertInfo.alias')
        .populate('retail.expertId', 'firstName lastName expertInfo.alias')
        .skip(skip)
        .limit(Number(limit))
        .sort({ date: -1 });

      const total = await Sale.countDocuments(filters);

      // Calcular totales
      const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
      const totalCommissions = await Commission.aggregate([
        { $match: { expertId, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
      ]);

      res.json({
        success: true,
        message: 'Ventas del experto obtenidas exitosamente',
        data: {
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
          },
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });

    } catch (error) {
      console.error('Error obteniendo ventas del experto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Recalcular comisiones de una venta
  static async recalculateCommissions(req: Request, res: Response): Promise<void> {
    try {
      const { saleId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario requerido'
        });
        return;
      }

      const sale = await Sale.findById(saleId);
      if (!sale) {
        res.status(404).json({
          success: false,
          message: 'Venta no encontrada'
        });
        return;
      }

      // Eliminar comisiones existentes
      await Commission.deleteMany({ saleId: sale._id });

      // Recalcular comisiones
      await sale.calculateCommissions();

      // Crear nuevas comisiones
      for (const commission of sale.commissions) {
        const commissionRecord = new Commission({
          saleId: sale._id,
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
          createdBy: userId
        });

        await commissionRecord.save();
      }

      res.json({
        success: true,
        message: 'Comisiones recalculadas exitosamente',
        data: { 
          sale: sale,
          commissions: sale.commissions
        }
      });

    } catch (error) {
      console.error('Error recalculando comisiones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Aplicar descuento a una venta
  static async applyDiscount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { 
        type, 
        value, 
        description, 
        reason 
      } = req.body;
      const appliedBy = req.user?.id;

      if (!type || value === undefined || !description) {
        res.status(400).json({
          success: false,
          message: 'Tipo, valor y descripción son requeridos'
        });
        return;
      }

      const sale = await Sale.findById(id);
      if (!sale) {
        res.status(404).json({
          success: false,
          message: 'Venta no encontrada'
        });
        return;
      }

      if (sale.status === 'cancelled') {
        res.status(400).json({
          success: false,
          message: 'No se puede aplicar descuentos a una venta cancelada'
        });
        return;
      }

      // Aplicar descuento
      const appliedAmount = sale.applyDiscount(
        type,
        value,
        description,
        appliedBy,
        reason
      );

      await sale.save();

      // Obtener venta actualizada
      const updatedSale = await Sale.findById(id)
        .populate('services.expertId', 'firstName lastName expertInfo.alias')
        .populate('retail.expertId', 'firstName lastName expertInfo.alias')
        .populate('discounts.appliedBy', 'firstName lastName');

      res.status(200).json({
        success: true,
        message: 'Descuento aplicado exitosamente',
        data: {
          sale: updatedSale,
          appliedAmount,
          discountSummary: sale.getDiscountSummary()
        }
      });

    } catch (error) {
      console.error('Error aplicando descuento:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Remover descuento de una venta
  static async removeDiscount(req: Request, res: Response): Promise<void> {
    try {
      const { id, discountIndex } = req.params;

      const sale = await Sale.findById(id);
      if (!sale) {
        res.status(404).json({
          success: false,
          message: 'Venta no encontrada'
        });
        return;
      }

      if (sale.status === 'cancelled') {
        res.status(400).json({
          success: false,
          message: 'No se puede modificar descuentos de una venta cancelada'
        });
        return;
      }

      const index = parseInt(discountIndex);
      const removed = sale.removeDiscount(index);

      if (!removed) {
        res.status(400).json({
          success: false,
          message: 'Índice de descuento inválido'
        });
        return;
      }

      await sale.save();

      // Obtener venta actualizada
      const updatedSale = await Sale.findById(id)
        .populate('services.expertId', 'firstName lastName expertInfo.alias')
        .populate('retail.expertId', 'firstName lastName expertInfo.alias')
        .populate('discounts.appliedBy', 'firstName lastName');

      res.status(200).json({
        success: true,
        message: 'Descuento removido exitosamente',
        data: {
          sale: updatedSale,
          discountSummary: sale.getDiscountSummary()
        }
      });

    } catch (error) {
      console.error('Error removiendo descuento:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener resumen de descuentos de una venta
  static async getDiscountSummary(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const sale = await Sale.findById(id);
      if (!sale) {
        res.status(404).json({
          success: false,
          message: 'Venta no encontrada'
        });
        return;
      }

      const summary = sale.getDiscountSummary();

      res.status(200).json({
        success: true,
        message: 'Resumen de descuentos obtenido exitosamente',
        data: summary
      });

    } catch (error) {
      console.error('Error obteniendo resumen de descuentos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Recalcular totales de una venta
  static async recalculateTotals(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const sale = await Sale.findById(id);
      if (!sale) {
        res.status(404).json({
          success: false,
          message: 'Venta no encontrada'
        });
        return;
      }

      if (sale.status === 'cancelled') {
        res.status(400).json({
          success: false,
          message: 'No se puede recalcular totales de una venta cancelada'
        });
        return;
      }

      // Recalcular totales
      sale.recalculateTotals();
      await sale.save();

      // Obtener venta actualizada
      const updatedSale = await Sale.findById(id)
        .populate('services.expertId', 'firstName lastName expertInfo.alias')
        .populate('retail.expertId', 'firstName lastName expertInfo.alias')
        .populate('discounts.appliedBy', 'firstName lastName');

      res.status(200).json({
        success: true,
        message: 'Totales recalculados exitosamente',
        data: {
          sale: updatedSale,
          totals: {
            subtotal: sale.subtotal,
            totalDiscounts: sale.totalDiscounts,
            finalTotal: sale.finalTotal
          }
        }
      });

    } catch (error) {
      console.error('Error recalculando totales:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}

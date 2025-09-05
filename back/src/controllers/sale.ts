import { Request, Response } from 'express';
import { getSalesSrv, postSaleSrv, putSaleSrv, deleteSaleSrv, getSalesByExpertSrv } from '../services/saleServ';
import { SalesInventoryService } from '../services/salesInventoryService';

export async function getSalesCtrl(req: Request, res: Response): Promise<void> {
  try {
    const sales = await getSalesSrv();
    res.status(200).json({ 
      success: true,
      message: 'Ventas obtenidas exitosamente',
      data: sales 
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: err instanceof Error ? err.message : 'Error desconocido'
    });
  }
}

export async function getSaleByIdCtrl(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const sales = await getSalesSrv();
    const sale = sales.find(s => s._id.toString() === id);
    
    if (!sale) {
      res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
      return;
    }

    res.status(200).json({ 
      success: true,
      message: 'Venta obtenida exitosamente',
      data: sale 
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: err instanceof Error ? err.message : 'Error desconocido'
    });
  }
}

export async function postSaleCtrl(req: Request, res: Response): Promise<void> {
  if (!req.body) {
    res.status(400).json({
      success: false,
      message: 'No se proporcionaron datos en la solicitud'
    });
    return;
  }

  try {
    const sale = req.body;
    const businessId = req.user?.businessId;

    if (!businessId) {
      res.status(400).json({
        success: false,
        message: 'BusinessId es requerido'
      });
      return;
    }

    // Calcular impacto en el inventario antes de crear la venta
    const impact = await SalesInventoryService.calculateSaleImpact(businessId, sale);
    
    if (!impact.canProcess) {
      res.status(400).json({
        success: false,
        message: 'No se puede procesar la venta debido a stock insuficiente',
        data: {
          warnings: impact.warnings,
          impact: impact.impact
        }
      });
      return;
    }

    // Crear la venta
    const newSale = await postSaleSrv(sale);
    
    // Actualizar inventario después de crear la venta
    const inventoryResult = await SalesInventoryService.updateInventoryFromSale(
      businessId,
      newSale._id.toString()
    );

    res.status(201).json({ 
      success: true,
      message: 'Venta creada e inventario actualizado exitosamente',
      data: {
        sale: newSale,
        inventoryUpdate: {
          updatedProducts: inventoryResult.updatedProducts,
          errors: inventoryResult.errors,
          warnings: impact.warnings
        }
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: err instanceof Error ? err.message : 'Error desconocido'
    });
  }
}

export async function putSaleCtrl(req: Request, res: Response): Promise<void> {
  if (!req.body) {
    res.status(400).json({
      success: false,
      message: 'No se proporcionaron datos en la solicitud'
    });
    return;
  }

  try {
    const sale = req.body;
    const updatedSale = await putSaleSrv(sale);
    res.status(200).json({ 
      success: true,
      message: 'Venta actualizada exitosamente',
      data: updatedSale 
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: err instanceof Error ? err.message : 'Error desconocido'
    });
  }
}

export async function deleteSaleCtrl(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const businessId = req.user?.businessId;

    if (!businessId) {
      res.status(400).json({
        success: false,
        message: 'BusinessId es requerido'
      });
      return;
    }

    // Revertir inventario antes de eliminar la venta
    const inventoryResult = await SalesInventoryService.revertInventoryFromSale(
      businessId,
      id
    );

    // Eliminar la venta
    const result = await deleteSaleSrv(id);
    
    res.status(200).json({ 
      success: true,
      message: 'Venta cancelada e inventario revertido exitosamente',
      data: {
        sale: result,
        inventoryRevert: {
          revertedProducts: inventoryResult.revertedProducts,
          errors: inventoryResult.errors
        }
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: err instanceof Error ? err.message : 'Error desconocido'
    });
  }
}

export async function getSalesByExpertCtrl(req: Request, res: Response): Promise<void> {
  try {
    const { expertId } = req.params;
    const { startDate, endDate } = req.query;
    
    const filters: any = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    const result = await getSalesByExpertSrv(expertId, filters);
    res.status(200).json({ 
      success: true,
      message: 'Ventas del experto obtenidas exitosamente',
      data: result 
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: err instanceof Error ? err.message : 'Error desconocido'
    });
  }
}

// Aplicar descuento a una venta
export async function applyDiscountCtrl(req: Request, res: Response): Promise<void> {
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

    const Sale = require('../models/sale').default;
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

    res.status(200).json({
      success: true,
      message: 'Descuento aplicado exitosamente',
      data: {
        sale: sale,
        appliedAmount,
        discountSummary: sale.getDiscountSummary()
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

// Obtener resumen de descuentos de una venta
export async function getDiscountSummaryCtrl(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const Sale = require('../models/sale').default;
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
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

// Calcular impacto de una venta en el inventario
export async function calculateSaleImpactCtrl(req: Request, res: Response): Promise<void> {
  try {
    const saleData = req.body;
    const businessId = req.user?.businessId;

    if (!businessId) {
      res.status(400).json({
        success: false,
        message: 'BusinessId es requerido'
      });
      return;
    }

    if (!saleData) {
      res.status(400).json({
        success: false,
        message: 'Datos de venta son requeridos'
      });
      return;
    }

    const impact = await SalesInventoryService.calculateSaleImpact(businessId, saleData);

    res.status(200).json({
      success: true,
      message: 'Impacto de venta calculado exitosamente',
      data: {
        canProcess: impact.canProcess,
        impact: impact.impact,
        warnings: impact.warnings
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

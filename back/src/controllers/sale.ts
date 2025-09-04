import { Request, Response } from 'express';
import { getSalesSrv, postSaleSrv, putSaleSrv, deleteSaleSrv, getSalesByExpertSrv } from '../services/saleServ';

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
    const newSale = await postSaleSrv(sale);
    res.status(201).json({ 
      success: true,
      message: 'Venta creada exitosamente',
      data: newSale 
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
    const result = await deleteSaleSrv(id);
    res.status(200).json({ 
      success: true,
      message: result.message
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

import { Request, Response } from 'express';
import { CashBalanceService } from '../services/cashBalanceService';

// Extender la interfaz Request para incluir user
interface CashBalanceRequest extends Request {
  user?: {
    _id: string;
  };
}

/**
 * Abre o obtiene el balance de caja del día
 */
export const openDailyBalance = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;
    const { date } = req.body;
    const actualUserId = (req as CashBalanceRequest).user?._id || req.body.userId;

    if (!actualUserId) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido'
      });
    }

    const balanceDate = date ? new Date(date) : new Date();
    const balance = await CashBalanceService.openDailyBalance(businessId, actualUserId, balanceDate);

    return res.status(200).json({
      success: true,
      message: 'Balance de caja abierto/obtenido exitosamente',
      data: balance
    });

  } catch (error) {
    console.error('Error abriendo balance de caja:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Cierra el balance de caja del día
 */
export const closeDailyBalance = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;
    const { notes } = req.body;
    const actualUserId = (req as CashBalanceRequest).user?._id || req.body.userId;

    if (!actualUserId) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido'
      });
    }

    const closedBalance = await CashBalanceService.closeDailyBalance(businessId, actualUserId, notes);

    return res.status(200).json({
      success: true,
      message: 'Balance de caja cerrado exitosamente',
      data: closedBalance
    });

  } catch (error) {
    console.error('Error cerrando balance de caja:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtiene el balance de caja del día actual
 */
export const getCurrentBalance = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;

    const balance = await CashBalanceService.getCurrentBalance(businessId);

    if (!balance) {
      return res.status(404).json({
        success: false,
        message: 'No hay balance de caja para el día actual'
      });
    }

    return res.status(200).json({
      success: true,
      data: balance
    });

  } catch (error) {
    console.error('Error obteniendo balance de caja:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtiene el historial de balances de caja
 */
export const getBalanceHistory = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;
    const { startDate, endDate, limit } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;
    const limitNum = limit ? parseInt(limit as string) : 30;

    const history = await CashBalanceService.getBalanceHistory(businessId, start, end, limitNum);

    return res.status(200).json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Error obteniendo historial de balances:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Registra un pago a cuenta por cobrar
 */
export const recordReceivablePayment = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;
    const { accountId, amount, method, notes } = req.body;
    const actualUserId = (req as CashBalanceRequest).user?._id || req.body.receivedBy;

    if (!actualUserId) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido'
      });
    }

    if (!accountId || !amount || !method) {
      return res.status(400).json({
        success: false,
        message: 'accountId, amount y method son requeridos'
      });
    }

    if (!['cash', 'transfer', 'card', 'credit'].includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Método de pago inválido. Debe ser: cash, transfer, card, o credit'
      });
    }

    const updatedAccount = await CashBalanceService.recordReceivablePayment(
      businessId,
      accountId,
      amount,
      method as 'cash' | 'transfer' | 'card' | 'credit',
      actualUserId,
      notes
    );

    return res.status(200).json({
      success: true,
      message: 'Pago registrado exitosamente',
      data: updatedAccount
    });

  } catch (error) {
    console.error('Error registrando pago:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtiene un resumen del balance de caja
 */
export const getBalanceSummary = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;

    const currentBalance = await CashBalanceService.getCurrentBalance(businessId);

    if (!currentBalance) {
      return res.status(404).json({
        success: false,
        message: 'No hay balance de caja para el día actual'
      });
    }

    // Calcular resumen
    const summary = {
      date: currentBalance.date,
      status: currentBalance.status,
      initialBalance: currentBalance.initialBalance,
      dailyTransactions: currentBalance.dailyTransactions,
      accountsReceivable: currentBalance.accountsReceivable,
      finalBalance: currentBalance.finalBalance,
      openedBy: currentBalance.openedBy,
      openedAt: currentBalance.openedAt,
      closedBy: currentBalance.closedBy,
      closedAt: currentBalance.closedAt
    };

    return res.status(200).json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error obteniendo resumen del balance:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

import DatabaseManager from './databaseManager';

export class CashBalanceService {
  /**
   * Abre o obtiene el balance de caja del día
   */
  static async openDailyBalance(businessId: string, userId: string, date: Date = new Date()) {
    return this.executeInBusinessContext(businessId, async (connection) => {
      const CashBalanceModel = connection.model('CashBalance');
      
      // Obtener o crear el balance del día
      const balance = await CashBalanceModel.getOrCreateDailyBalance(businessId, date, userId);
      
      // Actualizar el balance con las transacciones del día
      await this.updateDailyBalance(businessId, balance, connection);
      
      return balance;
    });
  }

  /**
   * Actualiza el balance con las transacciones del día
   */
  static async updateDailyBalance(businessId: string, balance: any, connection: any) {
    const Sale = connection.model('Sale');
    const AccountReceivableModel = connection.model('AccountReceivable');
    
    // Obtener transacciones cerradas del día
    const startOfDay = new Date(balance.date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(balance.date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const dailySales = await Sale.find({
      businessId,
      status: 'cerrada',
      closedAt: { $gte: startOfDay, $lte: endOfDay }
    });
    
    // Calcular totales por método de pago
    let totalCash = 0;
    let totalTransfer = 0;
    let totalCard = 0;
    let totalCredit = 0;
    
    dailySales.forEach((sale: any) => {
      sale.paymentMethod.forEach((payment: any) => {
        const method = payment.payment.toLowerCase();
        if (method.includes('efectivo') || method.includes('cash')) {
          totalCash += payment.amount;
        } else if (method.includes('transferencia') || method.includes('transfer')) {
          totalTransfer += payment.amount;
        } else if (method.includes('tarjeta') || method.includes('card')) {
          totalCard += payment.amount;
        } else if (method.includes('crédito') || method.includes('credit')) {
          totalCredit += payment.amount;
        }
      });
    });
    
    // Obtener cuentas por cobrar pagadas del día
    const dailyReceivables = await AccountReceivableModel.find({
      businessId,
      'payments.date': { $gte: startOfDay, $lte: endOfDay }
    });
    
    let cashPayments = 0;
    let transferPayments = 0;
    let cardPayments = 0;
    
    dailyReceivables.forEach((account: any) => {
      account.payments.forEach((payment: any) => {
        const paymentDate = new Date(payment.date);
        if (paymentDate >= startOfDay && paymentDate <= endOfDay) {
          switch (payment.method) {
            case 'cash':
              cashPayments += payment.amount;
              break;
            case 'transfer':
              transferPayments += payment.amount;
              break;
            case 'card':
              cardPayments += payment.amount;
              break;
          }
        }
      });
    });
    
    // Actualizar el balance
    balance.dailyTransactions = {
      totalSales: dailySales.reduce((total: number, sale: any) => total + sale.total, 0),
      totalCash,
      totalTransfer,
      totalCard,
      totalCredit,
      transactionCount: dailySales.length
    };
    
    balance.accountsReceivable = {
      total: await this.getTotalAccountsReceivable(businessId, connection),
      cashPayments,
      transferPayments,
      cardPayments,
      pendingAmount: await this.getPendingAccountsReceivable(businessId, connection),
      paymentCount: dailyReceivables.length
    };
    
    // El balance final se calcula automáticamente en el middleware
    return await balance.save();
  }

  /**
   * Cierra el balance del día
   */
  static async closeDailyBalance(businessId: string, userId: string, notes?: string) {
    return this.executeInBusinessContext(businessId, async (connection) => {
      const CashBalanceModel = connection.model('CashBalance');
      
      // Obtener el balance abierto del día
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      const balance = await CashBalanceModel.findOne({
        businessId,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: 'open'
      });
      
      if (!balance) {
        throw new Error('No hay un balance abierto para cerrar');
      }
      
      // Actualizar el balance antes de cerrarlo
      await this.updateDailyBalance(businessId, balance, connection);
      
      // Cerrar el balance
      return await balance.closeBalance(userId, notes);
    });
  }

  /**
   * Obtiene el balance del día actual
   */
  static async getCurrentBalance(businessId: string) {
    return this.executeInBusinessContext(businessId, async (connection) => {
      const CashBalanceModel = connection.model('CashBalance');
      
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      return await CashBalanceModel.findOne({
        businessId,
        date: { $gte: startOfDay, $lte: endOfDay }
      });
    });
  }

  /**
   * Obtiene el historial de balances
   */
  static async getBalanceHistory(businessId: string, startDate?: Date, endDate?: Date, limit: number = 30) {
    return this.executeInBusinessContext(businessId, async (connection) => {
      const CashBalanceModel = connection.model('CashBalance');
      
      const query: any = { businessId };
      
      if (startDate && endDate) {
        query.date = { $gte: startDate, $lte: endDate };
      }
      
      return await CashBalanceModel.find(query)
        .sort({ date: -1 })
        .limit(limit);
    });
  }

  /**
   * Registra un pago a cuenta por cobrar
   */
  static async recordReceivablePayment(
    businessId: string, 
    accountId: string, 
    amount: number, 
    method: 'cash' | 'transfer' | 'card' | 'credit',
    receivedBy: string,
    notes?: string
  ) {
    return this.executeInBusinessContext(businessId, async (connection) => {
      const AccountReceivableModel = connection.model('AccountReceivable');
      
      const account = await AccountReceivableModel.findById(accountId);
      
      if (!account) {
        throw new Error('Cuenta por cobrar no encontrada');
      }
      
      if (account.businessId !== businessId) {
        throw new Error('La cuenta no pertenece a este negocio');
      }
      
      // Registrar el pago
      await account.addPayment(amount, method, receivedBy, notes);
      
      // Actualizar el balance del día
      await this.updateCurrentBalance(businessId, connection);
      
      return account;
    });
  }

  /**
   * Obtiene el total de cuentas por cobrar
   */
  private static async getTotalAccountsReceivable(businessId: string, connection: any): Promise<number> {
    const AccountReceivableModel = connection.model('AccountReceivable');
    
    const result = await AccountReceivableModel.aggregate([
      { $match: { businessId, status: { $ne: 'paid' } } },
      { $group: { _id: null, total: { $sum: '$pendingAmount' } } }
    ]);
    
    return result.length > 0 ? result[0].total : 0;
  }

  /**
   * Obtiene el monto pendiente de cuentas por cobrar
   */
  private static async getPendingAccountsReceivable(businessId: string, connection: any): Promise<number> {
    const AccountReceivableModel = connection.model('AccountReceivable');
    
    const result = await AccountReceivableModel.aggregate([
      { $match: { businessId, status: { $ne: 'paid' } } },
      { $group: { _id: null, total: { $sum: '$pendingAmount' } } }
    ]);
    
    return result.length > 0 ? result[0].total : 0;
  }

  /**
   * Actualiza el balance actual
   */
  private static async updateCurrentBalance(businessId: string, connection: any) {
    const CashBalanceModel = connection.model('CashBalance');
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const balance = await CashBalanceModel.findOne({
      businessId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: 'open'
    });
    
    if (balance) {
      await this.updateDailyBalance(businessId, balance, connection);
    }
  }

  /**
   * Ejecuta una operación en el contexto del negocio
   */
  private static async executeInBusinessContext(businessId: string, operation: (connection: any) => Promise<any>) {
    try {
      const connection = await DatabaseManager.getBusinessConnection(businessId);
      if (!connection) {
        throw new Error(`Base de datos del negocio no encontrada: ${businessId}`);
      }
      
      return await operation(connection);
      
    } catch (error) {
      console.error(`Error ejecutando operación en el negocio ${businessId}:`, error);
      throw new Error(`Error ejecutando operación en el negocio ${businessId}: ${error}`);
    }
  }
}

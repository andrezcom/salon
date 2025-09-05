import mongoose from 'mongoose';
import LoyaltyProgram from '../models/loyaltyProgram';
import LoyaltyCustomer from '../models/loyaltyCustomer';
import Person from '../models/person';

export class LoyaltyService {
  
  // Crear programa de fidelidad
  static async createLoyaltyProgram(
    businessId: string,
    programData: any,
    createdBy: string
  ): Promise<any> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Verificar que no exista otro programa activo
      const existingProgram = await LoyaltyProgram.findOne({
        businessId,
        isActive: true
      }).session(session);
      
      if (existingProgram) {
        throw new Error('Ya existe un programa de fidelidad activo para este negocio');
      }
      
      const program = new LoyaltyProgram({
        ...programData,
        businessId,
        createdBy,
        isActive: true
      });
      
      await program.save({ session });
      
      await session.commitTransaction();
      return program;
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  // Registrar cliente en programa de fidelidad
  static async enrollCustomer(
    businessId: string,
    customerId: string,
    loyaltyProgramId: string
  ): Promise<any> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Verificar que el cliente existe
      const customer = await Person.findOne({
        _id: customerId,
        businessId,
        type: 'client'
      }).session(session);
      
      if (!customer) {
        throw new Error('Cliente no encontrado');
      }
      
      // Verificar que el programa existe
      const program = await LoyaltyProgram.findOne({
        _id: loyaltyProgramId,
        businessId,
        isActive: true
      }).session(session);
      
      if (!program) {
        throw new Error('Programa de fidelidad no encontrado');
      }
      
      // Verificar que el cliente no esté ya registrado
      const existingEnrollment = await LoyaltyCustomer.findOne({
        businessId,
        customerId,
        loyaltyProgramId
      }).session(session);
      
      if (existingEnrollment) {
        throw new Error('El cliente ya está registrado en este programa');
      }
      
      // Crear registro de cliente frecuente
      const loyaltyCustomer = new LoyaltyCustomer({
        businessId,
        customerId,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone1,
        loyaltyProgramId,
        loyaltyProgramName: program.name,
        currentPoints: 0,
        totalPointsEarned: 0,
        totalPointsRedeemed: 0,
        currentLevel: program.levels[0]?.name || 'Bronce',
        levelPoints: 0,
        pointsHistory: [],
        statistics: {
          totalPurchases: 0,
          totalSpent: 0,
          averagePurchase: 0,
          favoriteServices: [],
          favoriteProducts: [],
          visitsCount: 0
        },
        preferences: {
          receiveNotifications: true,
          notificationMethod: 'email',
          anniversary: new Date()
        },
        status: 'active',
        isVIP: false
      });
      
      await loyaltyCustomer.save({ session });
      
      await session.commitTransaction();
      return loyaltyCustomer;
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  // Procesar puntos de una venta
  static async processSalePoints(
    businessId: string,
    saleId: string,
    customerId: string,
    totalAmount: number,
    servicesCount: number,
    productsCount: number,
    services: string[],
    products: string[]
  ): Promise<any> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Buscar cliente frecuente
      const loyaltyCustomer = await LoyaltyCustomer.findOne({
        businessId,
        customerId,
        status: 'active'
      }).session(session);
      
      if (!loyaltyCustomer) {
        // Cliente no está en programa de fidelidad
        return { pointsEarned: 0, message: 'Cliente no está en programa de fidelidad' };
      }
      
      // Obtener programa de fidelidad
      const program = await LoyaltyProgram.findById(loyaltyCustomer.loyaltyProgramId).session(session);
      if (!program) {
        throw new Error('Programa de fidelidad no encontrado');
      }
      
      // Calcular puntos a ganar
      const pointsEarned = program.calculatePoints(totalAmount, servicesCount, productsCount);
      
      if (pointsEarned > 0) {
        // Agregar puntos
        await loyaltyCustomer.addPoints(
          pointsEarned,
          `Puntos ganados por compra de $${totalAmount.toLocaleString()}`,
          saleId
        );
        
        // Actualizar estadísticas
        await loyaltyCustomer.updateStatistics(totalAmount, services, products);
        
        // Verificar si subió de nivel
        const newLevel = program.getCurrentLevel(loyaltyCustomer.currentPoints);
        if (newLevel && newLevel.name !== loyaltyCustomer.currentLevel) {
          await loyaltyCustomer.updateLevel(newLevel.name);
        }
      }
      
      await session.commitTransaction();
      
      return {
        pointsEarned,
        currentPoints: loyaltyCustomer.currentPoints,
        currentLevel: loyaltyCustomer.currentLevel,
        message: `Ganaste ${pointsEarned} puntos`
      };
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  // Canjear puntos por descuento
  static async redeemPoints(
    businessId: string,
    customerId: string,
    pointsToRedeem: number,
    description: string,
    saleId?: string
  ): Promise<any> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Buscar cliente frecuente
      const loyaltyCustomer = await LoyaltyCustomer.findOne({
        businessId,
        customerId,
        status: 'active'
      }).session(session);
      
      if (!loyaltyCustomer) {
        throw new Error('Cliente no está en programa de fidelidad');
      }
      
      // Obtener programa de fidelidad
      const program = await LoyaltyProgram.findById(loyaltyCustomer.loyaltyProgramId).session(session);
      if (!program) {
        throw new Error('Programa de fidelidad no encontrado');
      }
      
      // Verificar puntos suficientes
      if (loyaltyCustomer.currentPoints < pointsToRedeem) {
        throw new Error('Puntos insuficientes para el canje');
      }
      
      // Verificar mínimo de canje
      if (pointsToRedeem < program.redemptionConfig.minimumRedemption) {
        throw new Error(`Mínimo de canje: ${program.redemptionConfig.minimumRedemption} puntos`);
      }
      
      // Verificar máximo de canje
      if (program.redemptionConfig.maximumRedemption && 
          pointsToRedeem > program.redemptionConfig.maximumRedemption) {
        throw new Error(`Máximo de canje: ${program.redemptionConfig.maximumRedemption} puntos`);
      }
      
      // Calcular descuento
      const discountAmount = program.calculateDiscountFromPoints(pointsToRedeem);
      
      // Canjear puntos
      await loyaltyCustomer.redeemPoints(
        pointsToRedeem,
        description,
        saleId
      );
      
      await session.commitTransaction();
      
      return {
        pointsRedeemed: pointsToRedeem,
        discountAmount,
        remainingPoints: loyaltyCustomer.currentPoints,
        message: `Canjeaste ${pointsToRedeem} puntos por $${discountAmount.toLocaleString()} de descuento`
      };
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  // Obtener información del cliente frecuente
  static async getCustomerInfo(businessId: string, customerId: string): Promise<any> {
    const loyaltyCustomer = await LoyaltyCustomer.findOne({
      businessId,
      customerId,
      status: 'active'
    }).populate('loyaltyProgramId');
    
    if (!loyaltyCustomer) {
      return null;
    }
    
    const program = await LoyaltyProgram.findById(loyaltyCustomer.loyaltyProgramId);
    if (!program) {
      return null;
    }
    
    // Obtener nivel actual
    const currentLevel = program.getCurrentLevel(loyaltyCustomer.currentPoints);
    const nextLevel = program.levels.find(level => level.minPoints > loyaltyCustomer.currentPoints);
    
    return {
      customer: loyaltyCustomer,
      program: program,
      currentLevel: currentLevel,
      nextLevel: nextLevel,
      pointsToNextLevel: nextLevel ? nextLevel.minPoints - loyaltyCustomer.currentPoints : 0
    };
  }
  
  // Obtener top clientes
  static async getTopCustomers(businessId: string, limit: number = 10): Promise<any[]> {
    return await LoyaltyCustomer.find({
      businessId,
      status: 'active'
    })
    .sort({ currentPoints: -1 })
    .limit(limit)
    .select('customerName customerEmail currentPoints currentLevel statistics.totalSpent statistics.visitsCount');
  }
  
  // Obtener clientes por nivel
  static async getCustomersByLevel(businessId: string, level: string): Promise<any[]> {
    return await LoyaltyCustomer.find({
      businessId,
      currentLevel: level,
      status: 'active'
    })
    .sort({ currentPoints: -1 })
    .select('customerName customerEmail currentPoints statistics.totalSpent statistics.visitsCount');
  }
  
  // Obtener estadísticas del programa
  static async getProgramStatistics(businessId: string): Promise<any> {
    const program = await LoyaltyProgram.findOne({
      businessId,
      isActive: true
    });
    
    if (!program) {
      return null;
    }
    
    const totalCustomers = await LoyaltyCustomer.countDocuments({
      businessId,
      status: 'active'
    });
    
    const totalPointsEarned = await LoyaltyCustomer.aggregate([
      { $match: { businessId, status: 'active' } },
      { $group: { _id: null, total: { $sum: '$totalPointsEarned' } } }
    ]);
    
    const totalPointsRedeemed = await LoyaltyCustomer.aggregate([
      { $match: { businessId, status: 'active' } },
      { $group: { _id: null, total: { $sum: '$totalPointsRedeemed' } } }
    ]);
    
    const customersByLevel = await LoyaltyCustomer.aggregate([
      { $match: { businessId, status: 'active' } },
      { $group: { _id: '$currentLevel', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const topCustomers = await this.getTopCustomers(businessId, 5);
    
    return {
      program: program,
      statistics: {
        totalCustomers,
        totalPointsEarned: totalPointsEarned[0]?.total || 0,
        totalPointsRedeemed: totalPointsRedeemed[0]?.total || 0,
        activePoints: (totalPointsEarned[0]?.total || 0) - (totalPointsRedeemed[0]?.total || 0),
        customersByLevel,
        topCustomers
      }
    };
  }
  
  // Ajustar puntos manualmente
  static async adjustPoints(
    businessId: string,
    customerId: string,
    points: number,
    reason: string,
    adjustedBy: string
  ): Promise<any> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const loyaltyCustomer = await LoyaltyCustomer.findOne({
        businessId,
        customerId,
        status: 'active'
      }).session(session);
      
      if (!loyaltyCustomer) {
        throw new Error('Cliente no está en programa de fidelidad');
      }
      
      const newPoints = loyaltyCustomer.currentPoints + points;
      if (newPoints < 0) {
        throw new Error('No se pueden tener puntos negativos');
      }
      
      loyaltyCustomer.currentPoints = newPoints;
      loyaltyCustomer.pointsHistory.push({
        date: new Date(),
        type: 'adjusted',
        amount: points,
        description: reason,
        createdBy: adjustedBy
      });
      
      await loyaltyCustomer.save({ session });
      
      await session.commitTransaction();
      
      return {
        newPoints: loyaltyCustomer.currentPoints,
        adjustment: points,
        reason: reason
      };
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

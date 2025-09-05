import mongoose from 'mongoose';
import ClientRetention from '../models/clientRetention';
import Person from '../models/person';

export class ClientRetentionService {
  
  // Crear registro de retención para un cliente
  static async createClientRetention(
    businessId: string,
    customerId: string
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
      
      // Verificar que no existe ya un registro de retención
      const existingRetention = await ClientRetention.findOne({
        businessId,
        customerId
      }).session(session);
      
      if (existingRetention) {
        return existingRetention;
      }
      
      // Crear registro de retención
      const clientRetention = new ClientRetention({
        businessId,
        customerId,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone1,
        status: 'active',
        riskLevel: 'low',
        daysSinceLastVisit: 0,
        daysSinceFirstVisit: 0,
        visitHistory: [],
        behaviorMetrics: {
          averageVisitFrequency: 0,
          averageSpending: 0,
          totalVisits: 0,
          totalSpent: 0,
          favoriteServices: [],
          favoriteProducts: [],
          preferredExpert: undefined,
          preferredTimeSlot: undefined,
          preferredDayOfWeek: undefined
        },
        recoveryCampaigns: [],
        recoveryTracking: {
          totalCampaignsSent: 0,
          totalResponses: 0,
          positiveResponses: 0,
          negativeResponses: 0,
          recoveryStatus: 'not_started'
        },
        alertSettings: {
          inactiveThreshold: 30,
          atRiskThreshold: 60,
          criticalThreshold: 90,
          alertFrequency: 'weekly',
          alertChannels: ['email', 'dashboard'],
          autoCampaignEnabled: false
        },
        notes: []
      });
      
      await clientRetention.save({ session });
      
      await session.commitTransaction();
      return clientRetention;
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  // Registrar visita de cliente
  static async recordClientVisit(
    businessId: string,
    customerId: string,
    visitData: {
      services: string[];
      products: string[];
      totalAmount: number;
      expertId?: string;
      notes?: string;
    }
  ): Promise<any> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Obtener o crear registro de retención
      let clientRetention = await ClientRetention.findOne({
        businessId,
        customerId
      }).session(session);
      
      if (!clientRetention) {
        clientRetention = await this.createClientRetention(businessId, customerId);
      }
      
      // Agregar visita
      await clientRetention.addVisit(visitData);
      
      await session.commitTransaction();
      
      return {
        message: 'Visita registrada exitosamente',
        clientRetention: clientRetention
      };
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  // Analizar clientes inactivos
  static async analyzeInactiveClients(businessId: string): Promise<any> {
    try {
      const clientRetentions = await ClientRetention.find({
        businessId,
        status: { $in: ['active', 'at_risk', 'inactive'] }
      });
      
      const today = new Date();
      const updatedClients = [];
      
      for (const client of clientRetentions) {
        if (client.lastVisitDate) {
          const daysSinceLastVisit = Math.floor(
            (today.getTime() - new Date(client.lastVisitDate).getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          
          client.daysSinceLastVisit = daysSinceLastVisit;
          
          // Determinar estado basado en días sin visitar
          if (daysSinceLastVisit <= client.alertSettings.inactiveThreshold) {
            client.status = 'active';
          } else if (daysSinceLastVisit <= client.alertSettings.atRiskThreshold) {
            client.status = 'at_risk';
          } else {
            client.status = 'inactive';
          }
          
          // Calcular nivel de riesgo
          await client.calculateRiskLevel();
          
          await client.save();
          updatedClients.push(client);
        }
      }
      
      return {
        message: 'Análisis de clientes inactivos completado',
        totalClientsAnalyzed: updatedClients.length,
        clientsUpdated: updatedClients
      };
      
    } catch (error) {
      throw error;
    }
  }
  
  // Obtener clientes en riesgo
  static async getAtRiskCustomers(
    businessId: string,
    riskLevel?: string,
    limit?: number
  ): Promise<any[]> {
    const query: any = { 
      businessId, 
      status: { $in: ['at_risk', 'inactive'] } 
    };
    
    if (riskLevel) {
      query.riskLevel = riskLevel;
    }
    
    let queryBuilder = ClientRetention.find(query)
      .sort({ daysSinceLastVisit: -1 });
    
    if (limit) {
      queryBuilder = queryBuilder.limit(limit);
    }
    
    return await queryBuilder.exec();
  }
  
  // Obtener clientes críticos
  static async getCriticalCustomers(businessId: string): Promise<any[]> {
    return await ClientRetention.getCriticalCustomers(businessId);
  }
  
  // Crear campaña de recuperación
  static async createRecoveryCampaign(
    businessId: string,
    customerId: string,
    campaignData: {
      campaignName: string;
      campaignType: 'email' | 'sms' | 'phone' | 'promotion' | 'personal_visit';
      createdBy: string;
    }
  ): Promise<any> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const clientRetention = await ClientRetention.findOne({
        businessId,
        customerId
      }).session(session);
      
      if (!clientRetention) {
        throw new Error('Cliente no encontrado en sistema de retención');
      }
      
      const campaignId = new mongoose.Types.ObjectId().toString();
      
      await clientRetention.addRecoveryCampaign({
        campaignId,
        ...campaignData
      });
      
      await session.commitTransaction();
      
      return {
        message: 'Campaña de recuperación creada exitosamente',
        campaignId,
        clientRetention: clientRetention
      };
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  // Registrar respuesta a campaña
  static async recordCampaignResponse(
    businessId: string,
    customerId: string,
    campaignId: string,
    responseType: 'positive' | 'negative' | 'neutral',
    notes?: string
  ): Promise<any> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const clientRetention = await ClientRetention.findOne({
        businessId,
        customerId
      }).session(session);
      
      if (!clientRetention) {
        throw new Error('Cliente no encontrado en sistema de retención');
      }
      
      await clientRetention.recordCampaignResponse(campaignId, responseType, notes);
      
      await session.commitTransaction();
      
      return {
        message: 'Respuesta a campaña registrada exitosamente',
        clientRetention: clientRetention
      };
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  // Marcar cliente como recuperado
  static async markClientAsRecovered(
    businessId: string,
    customerId: string,
    recoveryMethod: string,
    notes?: string
  ): Promise<any> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const clientRetention = await ClientRetention.findOne({
        businessId,
        customerId
      }).session(session);
      
      if (!clientRetention) {
        throw new Error('Cliente no encontrado en sistema de retención');
      }
      
      clientRetention.status = 'recovered';
      clientRetention.recoveryTracking.recoveryStatus = 'successful';
      clientRetention.recoveryTracking.recoveryDate = new Date();
      clientRetention.recoveryTracking.recoveryMethod = recoveryMethod;
      clientRetention.recoveryTracking.recoveryNotes = notes;
      
      await clientRetention.save({ session });
      
      await session.commitTransaction();
      
      return {
        message: 'Cliente marcado como recuperado exitosamente',
        clientRetention: clientRetention
      };
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  // Obtener estadísticas de retención
  static async getRetentionStatistics(businessId: string): Promise<any> {
    try {
      const totalClients = await ClientRetention.countDocuments({ businessId });
      
      const clientsByStatus = await ClientRetention.aggregate([
        { $match: { businessId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      
      const clientsByRiskLevel = await ClientRetention.aggregate([
        { $match: { businessId } },
        { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
      ]);
      
      const atRiskClients = await this.getAtRiskCustomers(businessId);
      const criticalClients = await this.getCriticalCustomers(businessId);
      
      const totalCampaignsSent = await ClientRetention.aggregate([
        { $match: { businessId } },
        { $group: { _id: null, total: { $sum: '$recoveryTracking.totalCampaignsSent' } } }
      ]);
      
      const totalResponses = await ClientRetention.aggregate([
        { $match: { businessId } },
        { $group: { _id: null, total: { $sum: '$recoveryTracking.totalResponses' } } }
      ]);
      
      const positiveResponses = await ClientRetention.aggregate([
        { $match: { businessId } },
        { $group: { _id: null, total: { $sum: '$recoveryTracking.positiveResponses' } } }
      ]);
      
      const recoveredClients = await ClientRetention.countDocuments({
        businessId,
        status: 'recovered'
      });
      
      return {
        totalClients,
        clientsByStatus: clientsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        clientsByRiskLevel: clientsByRiskLevel.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        atRiskClients: atRiskClients.length,
        criticalClients: criticalClients.length,
        totalCampaignsSent: totalCampaignsSent[0]?.total || 0,
        totalResponses: totalResponses[0]?.total || 0,
        positiveResponses: positiveResponses[0]?.total || 0,
        recoveredClients,
        recoveryRate: totalResponses[0]?.total > 0 ? 
          (positiveResponses[0]?.total || 0) / totalResponses[0].total * 100 : 0
      };
      
    } catch (error) {
      throw error;
    }
  }
  
  // Obtener clientes que necesitan seguimiento
  static async getClientsNeedingFollowUp(businessId: string): Promise<any[]> {
    try {
      const clients = await ClientRetention.find({
        businessId,
        status: { $in: ['at_risk', 'inactive'] },
        'recoveryTracking.recoveryStatus': { $in: ['not_started', 'in_progress'] }
      }).sort({ daysSinceLastVisit: -1 });
      
      return clients.map(client => ({
        customerId: client.customerId,
        customerName: client.customerName,
        customerEmail: client.customerEmail,
        customerPhone: client.customerPhone,
        status: client.status,
        riskLevel: client.riskLevel,
        daysSinceLastVisit: client.daysSinceLastVisit,
        lastVisitDate: client.lastVisitDate,
        totalVisits: client.behaviorMetrics.totalVisits,
        totalSpent: client.behaviorMetrics.totalSpent,
        favoriteServices: client.behaviorMetrics.favoriteServices,
        recoveryStatus: client.recoveryTracking.recoveryStatus,
        totalCampaignsSent: client.recoveryTracking.totalCampaignsSent,
        lastCampaignDate: client.recoveryTracking.lastCampaignDate
      }));
      
    } catch (error) {
      throw error;
    }
  }
  
  // Agregar nota a cliente
  static async addClientNote(
    businessId: string,
    customerId: string,
    noteData: {
      type: 'general' | 'behavior' | 'preference' | 'issue' | 'recovery';
      content: string;
      createdBy: string;
    }
  ): Promise<any> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const clientRetention = await ClientRetention.findOne({
        businessId,
        customerId
      }).session(session);
      
      if (!clientRetention) {
        throw new Error('Cliente no encontrado en sistema de retención');
      }
      
      clientRetention.notes.push({
        ...noteData,
        date: new Date()
      });
      
      await clientRetention.save({ session });
      
      await session.commitTransaction();
      
      return {
        message: 'Nota agregada exitosamente',
        clientRetention: clientRetention
      };
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  // Obtener historial de un cliente
  static async getClientHistory(
    businessId: string,
    customerId: string
  ): Promise<any> {
    try {
      const clientRetention = await ClientRetention.findOne({
        businessId,
        customerId
      });
      
      if (!clientRetention) {
        return null;
      }
      
      return {
        client: {
          customerId: clientRetention.customerId,
          customerName: clientRetention.customerName,
          customerEmail: clientRetention.customerEmail,
          customerPhone: clientRetention.customerPhone,
          status: clientRetention.status,
          riskLevel: clientRetention.riskLevel,
          daysSinceLastVisit: clientRetention.daysSinceLastVisit,
          lastVisitDate: clientRetention.lastVisitDate,
          firstVisitDate: clientRetention.firstVisitDate
        },
        behaviorMetrics: clientRetention.behaviorMetrics,
        visitHistory: clientRetention.visitHistory.sort((a: any, b: any) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
        recoveryCampaigns: clientRetention.recoveryCampaigns.sort((a: any, b: any) => 
          new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime()
        ),
        recoveryTracking: clientRetention.recoveryTracking,
        notes: clientRetention.notes.sort((a: any, b: any) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      };
      
    } catch (error) {
      throw error;
    }
  }
}

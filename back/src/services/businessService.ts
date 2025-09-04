import databaseManager from './databaseManager';
import Person from '../models/person';
import { Request } from 'express';

export interface BusinessRequest extends Request {
  businessId?: string;
  businessDb?: string;
}

export class BusinessService {
  /**
   * Obtiene el modelo de una colección específica del negocio
   */
  static async getBusinessModel(businessId: string, modelName: string) {
    try {
      const connection = await databaseManager.getBusinessConnection(businessId);
      return connection.model(modelName);
    } catch (error) {
      throw new Error(`No se pudo obtener el modelo ${modelName} para el negocio ${businessId}`);
    }
  }

  /**
   * Verifica que el usuario tenga acceso al negocio
   */
  static async verifyBusinessAccess(_userId: string, _businessId: string): Promise<boolean> {
    try {
      // Aquí implementarías la lógica de verificación
      // Por ahora, retornamos true para desarrollo
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene estadísticas del negocio
   */
  static async getBusinessStatistics(businessId: string) {
    try {
      const connection = await databaseManager.getBusinessConnection(businessId);
      
      const [clients, services, products, experts, providers, payments, sales] = await Promise.all([
        connection.model('Client').countDocuments(),
        connection.model('Service').countDocuments(),
        connection.model('Product').countDocuments(),
        connection.model('Expert').countDocuments(),
        connection.model('Provider').countDocuments(),
        connection.model('Payment').countDocuments(),
        connection.model('Sale').countDocuments()
      ]);

      return {
        clients,
        services,
        products,
        experts,
        providers,
        payments,
        sales,
        total: clients + services + products + experts + providers + payments + sales
      };
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas del negocio: ${error}`);
    }
  }

  /**
   * Ejecuta una operación en el contexto de un negocio específico
   */
  static async executeInBusinessContext<T>(
    businessId: string,
    operation: (connection: any) => Promise<T>
  ): Promise<T> {
    try {
      const connection = await databaseManager.getBusinessConnection(businessId);
      return await operation(connection);
    } catch (error) {
      throw new Error(`Error ejecutando operación en el negocio ${businessId}: ${error}`);
    }
  }

  /**
   * Crea un cliente en el negocio específico
   */
  static async createClient(businessId: string, clientData: any) {
    return this.executeInBusinessContext(businessId, async (connection) => {
      const Client = connection.model('Client');
      const client = new Client({
        ...clientData,
        businessId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return await client.save();
    });
  }

  /**
   * Crea un servicio en el negocio específico
   */
  static async createService(businessId: string, serviceData: any) {
    return this.executeInBusinessContext(businessId, async (connection) => {
      const Service = connection.model('Service');
      const service = new Service({
        ...serviceData,
        businessId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return await service.save();
    });
  }

  /**
   * Crea un producto en el negocio específico
   */
  static async createProduct(businessId: string, productData: any) {
    return this.executeInBusinessContext(businessId, async (connection) => {
      const Product = connection.model('Product');
      const product = new Product({
        ...productData,
        businessId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return await product.save();
    });
  }

  /**
   * Crea un experto en el negocio específico
   */
  static async createExpert(businessId: string, expertData: any) {
    return this.executeInBusinessContext(businessId, async (connection) => {
      const Expert = connection.model('Expert');
      const expert = new Expert({
        ...expertData,
        businessId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return await expert.save();
    });
  }

  /**
   * Crea un proveedor en el negocio específico
   */
  static async createProvider(businessId: string, providerData: any) {
    return this.executeInBusinessContext(businessId, async (connection) => {
      const Provider = connection.model('Provider');
      const provider = new Provider({
        ...providerData,
        businessId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return await provider.save();
    });
  }

  /**
   * Crea un método de pago en el negocio específico
   */
  static async createPayment(businessId: string, paymentData: any) {
    return this.executeInBusinessContext(businessId, async (connection) => {
      const Payment = connection.model('Payment');
      const payment = new Payment({
        ...paymentData,
        businessId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return await payment.save();
    });
  }

  /**
   * Crea una venta en el negocio específico
   */
  static async createSale(businessId: string, saleData: any) {
    return this.executeInBusinessContext(businessId, async (connection) => {
      const Sale = connection.model('Sale');
      const sale = new Sale({
        ...saleData,
        businessId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return await sale.save();
    });
  }

  /**
   * Obtiene todos los clientes de un negocio
   */
  static async getClients(businessId: string, filters: any = {}) {
    return this.executeInBusinessContext(businessId, async (connection) => {
      const Client = connection.model('Client');
      return await Person.find({ ...filters, personType: 'client', active: true }).sort({ createdAt: -1 });
    });
  }

  /**
   * Obtiene todos los servicios de un negocio
   */
  static async getServices(businessId: string, filters: any = {}) {
    return this.executeInBusinessContext(businessId, async (connection) => {
      const Service = connection.model('Service');
      return await Service.find({ ...filters, businessId }).sort({ createdAt: -1 });
    });
  }

  /**
   * Obtiene todos los expertos de un negocio
   */
  static async getExperts(businessId: string, filters: any = {}) {
    return this.executeInBusinessContext(businessId, async (connection) => {
      const Expert = connection.model('Expert');
      return await Person.find({ ...filters, personType: 'expert', active: true }).sort({ createdAt: -1 });
    });
  }

  /**
   * Obtiene todos los proveedores de un negocio
   */
  static async getProviders(businessId: string, filters: any = {}) {
    return this.executeInBusinessContext(businessId, async (connection) => {
      const Provider = connection.model('Provider');
      return await Provider.find({ ...filters, businessId }).sort({ createdAt: -1 });
    });
  }

  /**
   * Obtiene todos los métodos de pago de un negocio
   */
  static async getPayments(businessId: string, filters: any = {}) {
    return this.executeInBusinessContext(businessId, async (connection) => {
      const Payment = connection.model('Payment');
      return await Payment.find({ ...filters, businessId }).sort({ createdAt: -1 });
    });
  }

  /**
   * Obtiene todas las ventas de un negocio
   */
  static async getSales(businessId: string, filters: any = {}) {
    return this.executeInBusinessContext(businessId, async (connection) => {
      const Sale = connection.model('Sale');
      return await Sale.find({ ...filters, businessId }).sort({ date: -1 });
    });
  }

  /**
   * Obtiene todos los productos de un negocio
   */
  static async getProducts(businessId: string, filters: any = {}) {
    return this.executeInBusinessContext(businessId, async (connection) => {
      const Product = connection.model('Product');
      return await Product.find({ ...filters, businessId }).sort({ createdAt: -1 });
    });
  }

  /**
   * Cambia el estado de una venta
   */
  static async changeSaleStatus(businessId: string, saleId: string, newStatus: string, userId?: string, notes?: string) {
    return this.executeInBusinessContext(businessId, async (connection) => {
      const Sale = connection.model('Sale');
      const sale = await Sale.findById(saleId);
      
      if (!sale) {
        throw new Error('Venta no encontrada');
      }

      if (sale.businessId !== businessId) {
        throw new Error('La venta no pertenece a este negocio');
      }

      // Validar transiciones de estado
      if (sale.status === 'cerrada') {
        throw new Error('No se puede cambiar el estado de una transacción cerrada');
      }

      if (sale.status === 'abierta' && newStatus === 'cerrada') {
        throw new Error('No se puede cerrar una transacción abierta directamente. Debe estar en proceso primero.');
      }

      // Cambiar estado
      sale.status = newStatus;
      if (notes) sale.notes = notes;

      // Si se está cerrando, asignar número de factura
      if (newStatus === 'cerrada') {
        sale.invoiceNumber = await this.getNextInvoiceNumber(businessId, connection);
        sale.closedAt = new Date();
        sale.closedBy = userId;
      }

      return await sale.save();
    });
  }

  /**
   * Cierra una transacción de venta
   */
  static async closeSaleTransaction(businessId: string, saleId: string, userId: string, notes?: string) {
    return this.executeInBusinessContext(businessId, async (connection) => {
      const Sale = connection.model('Sale');
      const sale = await Sale.findById(saleId);
      
      if (!sale) {
        throw new Error('Venta no encontrada');
      }

      if (sale.businessId !== businessId) {
        throw new Error('La venta no pertenece a este negocio');
      }

      if (sale.status === 'cerrada') {
        throw new Error('La transacción ya está cerrada');
      }

      if (sale.status === 'abierta') {
        throw new Error('No se puede cerrar una transacción abierta directamente. Debe estar en proceso primero.');
      }

      // Asignar número de factura
      sale.invoiceNumber = await this.getNextInvoiceNumber(businessId, connection);
      sale.status = 'cerrada';
      sale.closedAt = new Date();
      sale.closedBy = userId;
      if (notes) sale.notes = notes;

      return await sale.save();
    });
  }

  /**
   * Obtiene ventas por estado
   */
  static async getSalesByStatus(businessId: string, status?: string) {
    return this.executeInBusinessContext(businessId, async (connection) => {
      const Sale = connection.model('Sale');
      const filters: any = { businessId };
      
      if (status) {
        filters.status = status;
      }

      return await Sale.find(filters).sort({ date: -1 });
    });
  }

  /**
   * Obtiene el próximo número de factura para un negocio
   */
  static async getNextInvoiceNumber(businessId: string, connection?: any) {
    if (connection) {
      // Si se pasa una conexión específica, usarla
      const Sale = connection.model('Sale');
      const lastInvoice = await Sale.findOne(
        { 
          businessId, 
          invoiceNumber: { $exists: true, $ne: null } 
        },
        { invoiceNumber: 1 }
      ).sort({ invoiceNumber: -1 });
      
      return lastInvoice ? lastInvoice.invoiceNumber + 1 : 1;
    } else {
      // Usar el DatabaseManager para obtener la conexión
      return this.executeInBusinessContext(businessId, async (conn) => {
        const Sale = conn.model('Sale');
        const lastInvoice = await Sale.findOne(
          { 
            businessId, 
            invoiceNumber: { $exists: true, $ne: null } 
          },
          { invoiceNumber: 1 }
        ).sort({ invoiceNumber: -1 });
        
        return lastInvoice ? lastInvoice.invoiceNumber + 1 : 1;
      });
    }
  }
}

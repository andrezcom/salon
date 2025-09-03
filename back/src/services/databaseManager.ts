import mongoose from 'mongoose';

class DatabaseManager {
  private connections: Map<string, mongoose.Connection> = new Map();
  constructor() {
    // La conexión principal (master) ya está establecida en connect.ts
  }

  /**
   * Crea una nueva base de datos para un negocio específico
   */
  async createBusinessDatabase(businessId: string, businessName: string): Promise<string> {
    try {
      // Generar nombre único para la base de datos (máximo 63 caracteres para MongoDB)
      const timestamp = Date.now().toString().slice(-8); // Solo últimos 8 dígitos
      const sanitizedName = businessName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().slice(0, 20); // Máximo 20 caracteres
      const shortId = businessId.slice(-8); // Solo últimos 8 caracteres del ID
      const dbName = `salon_${sanitizedName}_${shortId}_${timestamp}`;
      
      // Verificar que no exceda 63 caracteres
      if (dbName.length > 63) {
        // Si aún es muy largo, usar una versión más corta
        const maxNameLength = 63 - 20; // 20 caracteres para el resto
        const shortDbName = `salon_${shortId}_${timestamp}`;
        if (shortDbName.length > maxNameLength) {
          throw new Error('No se pudo generar un nombre de base de datos válido');
        }
        return shortDbName;
      }
      
      // Crear nueva conexión para el negocio
      const connectionString = process.env.URLBD?.replace('/salon', `/${dbName}`) || 
                              `mongodb://localhost:27017/${dbName}`;
      
      const businessConnection = mongoose.createConnection(connectionString);

      // Esperar a que la conexión esté lista
      await new Promise((resolve, reject) => {
        businessConnection.once('connected', resolve);
        businessConnection.once('error', reject);
      });

      // Guardar la conexión
      this.connections.set(businessId, businessConnection);

      // Crear colecciones básicas en la nueva DB
      await this.initializeBusinessCollections(businessConnection, businessId);

      console.log(`✅ Base de datos del negocio creada: ${dbName}`);
      return dbName;

    } catch (error) {
      console.error(`❌ Error creando base de datos del negocio: ${error}`);
      throw new Error(`No se pudo crear la base de datos del negocio: ${error}`);
    }
  }

  /**
   * Obtiene la conexión a la base de datos de un negocio específico
   */
  async getBusinessConnection(businessId: string): Promise<mongoose.Connection> {
    if (!this.connections.has(businessId)) {
      throw new Error(`Base de datos del negocio no encontrada: ${businessId}`);
    }
    return this.connections.get(businessId)!;
  }

  /**
   * Inicializa las colecciones básicas en la nueva base de datos del negocio
   */
  private async initializeBusinessCollections(connection: mongoose.Connection, businessId: string) {
    try {
      // Esquema de clientes (adaptado a tu estructura actual)
      const clientSchema = new mongoose.Schema({
        nameClient: { type: String, required: true },
        email: { type: String, required: true },
        phone1: { type: String, required: true },
        phone2: { type: String, required: false },
        numberId: { type: String, required: false },
        businessId: { type: String, default: businessId },
        active: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      });

      // Esquema de servicios (adaptado a tu estructura actual)
      const serviceSchema = new mongoose.Schema({
        nameService: { type: String, required: true },
        price: { type: Number, required: true },
        businessId: { type: String, default: businessId },
        active: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      });

      // Esquema de productos (adaptado a tu estructura actual)
      const productSchema = new mongoose.Schema({
        nameProduct: { type: String, required: true },
        marca: { type: String, required: true },
        cost: { type: Number, required: true },
        qtyPack: { type: Number, required: true },
        qtyUnit: { type: Number, required: true },
        clientPrice: { type: Number, required: true },
        inputPrice: { type: Number, required: true },
        expertPrice: { type: Number, required: true },
        uses: {
          input: Boolean,
          retail: Boolean
        },
        businessId: { type: String, default: businessId },
        active: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      });

      // Esquema de expertos (adaptado a tu estructura actual)
      const expertSchema = new mongoose.Schema({
        id: { type: Number, required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        document: { type: Number, required: true },
        movil: { type: String, required: true },
        businessId: { type: String, default: businessId },
        active: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      });

      // Esquema de proveedores (adaptado a tu estructura actual)
      const providerSchema = new mongoose.Schema({
        nameProvider: { type: String, required: true },
        email: { type: String, required: true },
        phone1: { type: String, required: true },
        phone2: { type: String, required: false },
        numberId: { type: String, required: false },
        businessId: { type: String, default: businessId },
        active: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      });

      // Esquema de métodos de pago (adaptado a tu estructura actual)
      const paymentSchema = new mongoose.Schema({
        namePayment: { type: String, required: true },
        businessId: { type: String, default: businessId },
        active: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      });

      // Esquema de ventas (adaptado a tu estructura actual)
      const saleSchema = new mongoose.Schema({
        idClient: { type: String, required: true },
        nameClient: { type: String, required: true },
        email: { type: String, required: true },
        date: { type: Date, required: true },
        services: [{
          serviceId: Number,
          expertId: Number,
          input: [{
            inputId: Number,
            nameProduct: String,
            inputPrice: Number,
            qty: Number,
            amount: Number,
          }],
          amount: Number,
        }],
        retail: [{
          productId: Number,
          clientPrice: Number,
          qty: Number,
          amount: Number,
          expertId: Number,
        }],
        total: { type: Number, required: true },
        paymentMethod: [{
          payment: String,
          amount: Number,
        }],
        // Nuevos campos para el sistema de facturación
        status: {
          type: String,
          enum: ['abierta', 'en_proceso', 'cerrada'],
          default: 'abierta',
          required: true
        },
        invoiceNumber: {
          type: Number,
          required: false,
          unique: true,
          sparse: true
        },
        businessId: { type: String, default: businessId },
        notes: { type: String, required: false },
        closedAt: { type: Date, required: false },
        closedBy: { type: String, required: false },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      });

      // Índices para mejorar el rendimiento
      saleSchema.index({ businessId: 1, status: 1 });
      saleSchema.index({ businessId: 1, invoiceNumber: 1 });
      saleSchema.index({ status: 1 });
      saleSchema.index({ date: -1 });

      // Crear modelos en la nueva base de datos
      connection.model('Client', clientSchema);
      connection.model('Service', serviceSchema);
      connection.model('Product', productSchema);
      connection.model('Expert', expertSchema);
      connection.model('Provider', providerSchema);
      connection.model('Payment', paymentSchema);
      connection.model('Sale', saleSchema);
      
      // Nuevos modelos para el sistema de balance de caja
      const cashBalanceSchema = new mongoose.Schema({
        businessId: { type: String, required: true },
        date: { type: Date, required: true },
        initialBalance: { type: Number, required: true, default: 0 },
        dailyTransactions: {
          totalSales: { type: Number, default: 0 },
          totalCash: { type: Number, default: 0 },
          totalTransfer: { type: Number, default: 0 },
          totalCard: { type: Number, default: 0 },
          totalCredit: { type: Number, default: 0 },
          transactionCount: { type: Number, default: 0 }
        },
        accountsReceivable: {
          total: { type: Number, default: 0 },
          cashPayments: { type: Number, default: 0 },
          transferPayments: { type: Number, default: 0 },
          cardPayments: { type: Number, default: 0 },
          pendingAmount: { type: Number, default: 0 },
          paymentCount: { type: Number, default: 0 }
        },
        finalBalance: { type: Number, required: true, default: 0 },
        openedBy: { type: String, required: true },
        closedBy: { type: String, required: false },
        openedAt: { type: Date, default: Date.now },
        closedAt: { type: Date, required: false },
        notes: { type: String, required: false },
        status: { type: String, enum: ['open', 'closed'], default: 'open', required: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      });

      // Middleware para calcular el balance final antes de guardar
      cashBalanceSchema.pre('save', function(next) {
        if (this.isModified('dailyTransactions') || this.isModified('accountsReceivable')) {
          // Calcular balance final
          this.finalBalance = (this.initialBalance || 0) + 
                             (this.dailyTransactions?.totalCash || 0) + 
                             (this.dailyTransactions?.totalTransfer || 0) + 
                             (this.dailyTransactions?.totalCard || 0) +
                             (this.accountsReceivable?.cashPayments || 0) +
                             (this.accountsReceivable?.transferPayments || 0) +
                             (this.accountsReceivable?.cardPayments || 0);
        }
        next();
      });

      // Método estático para obtener o crear el balance del día
      cashBalanceSchema.statics.getOrCreateDailyBalance = async function(businessId: string, date: Date, userId: string) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        let balance = await this.findOne({
          businessId,
          date: { $gte: startOfDay, $lte: endOfDay },
          status: 'open'
        });
        
        if (!balance) {
          // Obtener el balance del día anterior para calcular el saldo inicial
          const previousDay = new Date(startOfDay);
          previousDay.setDate(previousDay.getDate() - 1);
          
          const previousBalance = await this.findOne({
            businessId,
            date: { $gte: previousDay, $lt: startOfDay },
            status: 'closed'
          }).sort({ date: -1 });
          
          const initialBalance = previousBalance ? previousBalance.finalBalance : 0;
          
          balance = new this({
            businessId,
            date: startOfDay,
            initialBalance,
            openedBy: userId,
            status: 'open'
          });
          
          await balance.save();
        }
        
        return balance;
      };

      // Método para cerrar el balance del día
      cashBalanceSchema.methods.closeBalance = async function(userId: string, notes?: string) {
        if (this.status === 'closed') {
          throw new Error('El balance ya está cerrado');
        }
        
        this.status = 'closed';
        this.closedBy = userId;
        this.closedAt = new Date();
        if (notes) this.notes = notes;
        
        return await this.save();
      };
      
      const accountReceivableSchema = new mongoose.Schema({
        businessId: { type: String, required: true },
        clientId: { type: String, required: true },
        clientName: { type: String, required: true },
        clientEmail: { type: String, required: true },
        saleId: { type: String, required: true },
        invoiceNumber: { type: Number, required: true },
        saleDate: { type: Date, required: true },
        totalAmount: { type: Number, required: true },
        status: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending', required: true },
        pendingAmount: { type: Number, required: true },
        paidAmount: { type: Number, default: 0 },
        payments: [{
          amount: { type: Number, required: true },
          method: { type: String, enum: ['cash', 'transfer', 'card', 'credit'], required: true },
          date: { type: Date, default: Date.now },
          receivedBy: { type: String, required: true },
          notes: { type: String, required: false }
        }],
        dueDate: { type: Date, required: true },
        lastPaymentDate: { type: Date, required: false },
        createdBy: { type: String, required: true },
        updatedBy: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      });

      // Middleware para actualizar el estado y montos antes de guardar
      accountReceivableSchema.pre('save', function(next) {
        if (this.isModified('payments') || this.isModified('paidAmount')) {
          // Calcular monto pagado total
          this.paidAmount = this.payments.reduce((total: number, payment: any) => total + payment.amount, 0);
          
          // Calcular monto pendiente
          this.pendingAmount = this.totalAmount - this.paidAmount;
          
          // Actualizar estado
          if (this.pendingAmount <= 0) {
            this.status = 'paid';
          } else if (this.paidAmount > 0) {
            this.status = 'partial';
          } else {
            this.status = 'pending';
          }
          
          // Actualizar fecha del último pago
          if (this.payments.length > 0) {
            this.lastPaymentDate = this.payments[this.payments.length - 1].date;
          }
        }
        next();
      });

      // Método para registrar un pago
      accountReceivableSchema.methods.addPayment = async function(
        amount: number, 
        method: 'cash' | 'transfer' | 'card' | 'credit', 
        receivedBy: string, 
        notes?: string
      ) {
        if (this.status === 'paid') {
          throw new Error('La cuenta ya está completamente pagada');
        }
        
        if (amount > this.pendingAmount) {
          throw new Error('El monto del pago excede el monto pendiente');
        }
        
        this.payments.push({
          amount,
          method,
          date: new Date(),
          receivedBy,
          notes
        });
        
        return await this.save();
      };

      // Método estático para crear cuenta por cobrar desde una venta
      accountReceivableSchema.statics.createFromSale = async function(
        businessId: string,
        saleData: any,
        createdBy: string,
        dueDate?: Date
      ) {
        const defaultDueDate = dueDate || new Date();
        defaultDueDate.setDate(defaultDueDate.getDate() + 30); // 30 días por defecto
        
        const account = new this({
          businessId,
          clientId: saleData.idClient,
          clientName: saleData.nameClient,
          clientEmail: saleData.email,
          saleId: saleData._id,
          invoiceNumber: saleData.invoiceNumber,
          saleDate: saleData.date,
          totalAmount: saleData.total,
          pendingAmount: saleData.total,
          dueDate: defaultDueDate,
          createdBy,
          updatedBy: createdBy
        });
        
        return await account.save();
      };
      
      // Crear los nuevos modelos
      connection.model('CashBalance', cashBalanceSchema);
      connection.model('AccountReceivable', accountReceivableSchema);

      console.log(`✅ Colecciones inicializadas para el negocio: ${businessId}`);

    } catch (error) {
      console.error(`❌ Error inicializando colecciones: ${error}`);
      throw error;
    }
  }

  /**
   * Cierra la conexión a una base de datos de negocio específica
   */
  async closeBusinessConnection(businessId: string): Promise<void> {
    if (this.connections.has(businessId)) {
      const connection = this.connections.get(businessId)!;
      await connection.close();
      this.connections.delete(businessId);
      console.log(`🔌 Conexión cerrada para el negocio: ${businessId}`);
    }
  }

  /**
   * Lista todas las conexiones activas
   */
  getActiveConnections(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Verifica si una conexión está activa
   */
  isConnectionActive(businessId: string): boolean {
    return this.connections.has(businessId);
  }
}

export default new DatabaseManager();

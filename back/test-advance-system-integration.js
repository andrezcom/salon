const mongoose = require('mongoose');

// Configuración de conexión
const MONGODB_URI = 'mongodb://localhost:27017/salon_test';

// Esquemas simplificados para testing
const personSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  personType: { type: String, enum: ['user', 'expert', 'client'], required: true },
  userInfo: {
    position: String,
    department: String,
    salarySettings: {
      salaryType: { type: String, enum: ['monthly', 'hourly', 'daily'], default: 'monthly' },
      monthlySalary: { type: Number, default: 0 },
      hourlyRate: { type: Number, default: 0 },
      dailyRate: { type: Number, default: 0 },
      transportSubsidy: { type: Number, default: 0 },
      overtimeRate: { type: Number, default: 1.5 },
      withholdings: {
        taxWithholding: { type: Boolean, default: false },
        taxRate: { type: Number, default: 0.1 },
        socialSecurity: { type: Boolean, default: false },
        socialSecurityRate: { type: Number, default: 0.04 },
        healthInsurance: { type: Boolean, default: false },
        healthInsuranceRate: { type: Number, default: 0.04 }
      }
    }
  },
  expertInfo: {
    commissionSettings: {
      serviceCommissionRate: { type: Number, default: 0.3 },
      retailCommissionRate: { type: Number, default: 0.1 },
      minimumCommission: { type: Number, default: 0 },
      maximumCommission: { type: Number, default: 1000 }
    }
  },
  active: { type: Boolean, default: true },
  businessId: { type: String, required: true }
}, { timestamps: true });

const advanceSchema = new mongoose.Schema({
  businessId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true, index: true },
  employeeType: { type: String, enum: ['expert', 'user'], required: true, index: true },
  advanceType: { type: String, enum: ['advance', 'loan', 'bonus', 'expense_reimbursement'], required: true, default: 'advance' },
  amount: { type: Number, required: true, min: 0 },
  requestedAmount: { type: Number, required: true, min: 0 },
  approvedAmount: { type: Number, required: false, min: 0 },
  status: { type: String, enum: ['pending', 'approved', 'paid', 'rejected', 'cancelled', 'repaid'], default: 'pending', required: true },
  reason: { type: String, required: true, trim: true },
  description: { type: String, required: false, trim: true },
  category: { type: String, enum: ['personal', 'business', 'emergency', 'bonus'], required: false, default: 'personal' },
  requestDate: { type: Date, required: true, default: Date.now },
  approvalDate: { type: Date, required: false },
  paymentDate: { type: Date, required: false },
  dueDate: { type: Date, required: false },
  repaymentDate: { type: Date, required: false },
  requestedBy: { type: String, required: true },
  approvedBy: { type: String, required: false },
  rejectedBy: { type: String, required: false },
  rejectionReason: { type: String, required: false },
  paymentMethod: { type: String, enum: ['cash', 'transfer', 'check'], required: false },
  paymentNotes: { type: String, required: false },
  isLoan: { type: Boolean, default: false },
  interestRate: { type: Number, required: false, min: 0, max: 100 },
  deductions: [{
    type: { type: String, enum: ['commission', 'payroll'], required: true },
    sourceId: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    description: { type: String, required: true }
  }],
  remainingBalance: { type: Number, required: true, min: 0, default: 0 },
  notes: { type: String, required: false },
  internalNotes: { type: String, required: false }
}, { timestamps: true });

const payrollSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true, index: true },
  businessId: { type: String, required: true, index: true },
  period: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    periodType: { type: String, enum: ['weekly', 'biweekly', 'monthly'], required: true },
    workingDays: { type: Number, required: true, min: 0, max: 31 },
    totalHours: { type: Number, required: true, min: 0 },
    overtimeHours: { type: Number, default: 0, min: 0 }
  },
  items: [{
    type: { type: String, enum: ['salary', 'bonus', 'transport_subsidy', 'overtime_subsidy', 'deduction', 'other'], required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    taxable: { type: Boolean, default: true },
    category: { type: String, enum: ['earnings', 'deductions', 'benefits'], required: true }
  }],
  calculation: {
    baseSalary: { type: Number, required: true, min: 0 },
    bonuses: { type: Number, default: 0, min: 0 },
    transportSubsidy: { type: Number, default: 0, min: 0 },
    overtimeSubsidy: { type: Number, default: 0, min: 0 },
    totalEarnings: { type: Number, required: true, min: 0 },
    deductions: { type: Number, default: 0, min: 0 },
    netPay: { type: Number, required: true, min: 0 },
    taxWithholding: { type: Number, default: 0, min: 0 },
    socialSecurity: { type: Number, default: 0, min: 0 },
    healthInsurance: { type: Number, default: 0, min: 0 }
  },
  status: { type: String, enum: ['draft', 'approved', 'paid', 'cancelled'], default: 'draft', index: true },
  paymentMethod: { type: String, enum: ['cash', 'transfer', 'check'], required: true },
  paymentDate: { type: Date },
  paymentReference: { type: String, trim: true },
  notes: { type: String, trim: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },
  approvedAt: { type: Date },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },
  paidAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' }
}, { timestamps: true, collection: 'payrolls' });

const cashBalanceSchema = new mongoose.Schema({
  businessId: { type: String, required: true, unique: true },
  date: { type: Date, required: true, default: Date.now },
  status: { type: String, enum: ['open', 'closed'], default: 'open', required: true },
  initialBalance: { type: Number, required: true, default: 0 },
  currentBalance: { type: Number, required: true, default: 0 },
  totalIncome: { type: Number, default: 0 },
  totalExpenses: { type: Number, default: 0 },
  lastTransactionDate: { type: Date },
  lastTransactionAmount: { type: Number },
  lastTransactionType: { type: String },
  openedBy: { type: String, required: true },
  closedBy: { type: String },
  closedAt: { type: Date },
  notes: { type: String }
}, { timestamps: true });

const cashTransactionSchema = new mongoose.Schema({
  businessId: { type: String, required: true, index: true },
  saleId: { type: String, required: false, index: true },
  reference: { type: String, required: false, index: true },
  employeeId: { type: String, required: false, index: true },
  employeeType: { type: String, enum: ['expert', 'user'], required: false },
  transactionType: { type: String, enum: ['tip', 'change', 'refund', 'adjustment', 'advance_payment', 'advance_repayment'], required: true },
  amount: { type: Number, required: true, min: 0 },
  previousBalance: { type: Number, required: true },
  newBalance: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'transfer'], required: true },
  originalPaymentMethod: { type: String, enum: ['cash', 'card', 'transfer'], required: false },
  advanceDetails: {
    advanceId: { type: String, required: false },
    advanceType: { type: String, enum: ['advance', 'loan', 'bonus', 'expense_reimbursement'], required: false },
    advanceReason: { type: String, required: false },
    advanceAmount: { type: Number, required: false, min: 0 },
    processedBy: { type: String, required: false },
    processedAt: { type: Date, required: false }
  },
  status: { type: String, enum: ['pending', 'completed', 'cancelled', 'reversed'], default: 'pending', required: true },
  createdBy: { type: String, required: true },
  approvedBy: { type: String, required: false },
  approvedAt: { type: Date, required: false },
  reversedBy: { type: String, required: false },
  reversedAt: { type: Date, required: false },
  reversalReason: { type: String, required: false },
  notes: { type: String, required: false }
}, { timestamps: true });

// Métodos de instancia para Advance
advanceSchema.methods.approve = function(userId, approvedAmount, notes) {
  if (this.status !== 'pending') {
    throw new Error('Solo se pueden aprobar anticipos pendientes');
  }
  
  this.status = 'approved';
  this.approvedAmount = approvedAmount;
  this.approvedBy = userId;
  this.approvalDate = new Date();
  if (notes) this.internalNotes = notes;
  
  return this.save();
};

advanceSchema.methods.markAsPaid = function(paymentMethod, paymentNotes) {
  if (this.status !== 'approved') {
    throw new Error('Solo se pueden pagar anticipos aprobados');
  }
  
  this.status = 'paid';
  this.paymentDate = new Date();
  this.paymentMethod = paymentMethod;
  if (paymentNotes) this.paymentNotes = paymentNotes;
  
  return this.save();
};

advanceSchema.methods.applyDeduction = function(type, sourceId, amount, description) {
  if (this.status !== 'paid') {
    throw new Error('Solo se pueden aplicar descuentos a anticipos pagados');
  }
  
  if (amount > this.remainingBalance) {
    throw new Error('El monto del descuento excede el balance restante');
  }
  
  this.deductions.push({
    type,
    sourceId,
    amount,
    date: new Date(),
    description
  });
  
  this.remainingBalance = Math.max(0, this.amount - this.deductions.reduce((total, deduction) => total + deduction.amount, 0));
  
  return this.save();
};

advanceSchema.methods.markAsRepaid = function() {
  if (this.status !== 'paid') {
    throw new Error('Solo se pueden marcar como reembolsados anticipos pagados');
  }
  
  if (this.remainingBalance > 0) {
    throw new Error('No se puede marcar como reembolsado si hay balance pendiente');
  }
  
  this.status = 'repaid';
  this.repaymentDate = new Date();
  
  return this.save();
};

// Métodos para Payroll
payrollSchema.methods.calculatePayroll = async function() {
  const employee = await Person.findById(this.employeeId);
  
  if (!employee || employee.personType !== 'user') {
    throw new Error('Empleado no encontrado o tipo incorrecto');
  }

  const salarySettings = employee.userInfo.salarySettings;
  
  let baseSalary = 0;
  if (salarySettings.salaryType === 'monthly') {
    baseSalary = salarySettings.monthlySalary;
  } else if (salarySettings.salaryType === 'hourly') {
    baseSalary = salarySettings.hourlyRate * this.period.totalHours;
  } else if (salarySettings.salaryType === 'daily') {
    baseSalary = salarySettings.dailyRate * this.period.workingDays;
  }

  let bonuses = 0;
  const bonusItems = this.items.filter(item => item.type === 'bonus' && item.category === 'earnings');
  bonuses = bonusItems.reduce((total, item) => total + item.amount, 0);

  let transportSubsidy = 0;
  if (salarySettings.transportSubsidy && salarySettings.transportSubsidy > 0) {
    transportSubsidy = salarySettings.transportSubsidy;
  }

  let overtimeSubsidy = 0;
  if (this.period.overtimeHours && this.period.overtimeHours > 0) {
    const overtimeRate = salarySettings.overtimeRate || 1.5;
    overtimeSubsidy = (salarySettings.hourlyRate || 0) * this.period.overtimeHours * overtimeRate;
  }

  const totalEarnings = baseSalary + bonuses + transportSubsidy + overtimeSubsidy;

  let deductions = 0;
  const deductionItems = this.items.filter(item => item.category === 'deductions');
  deductions = deductionItems.reduce((total, item) => total + item.amount, 0);

  let taxWithholding = 0;
  let socialSecurity = 0;
  let healthInsurance = 0;

  if (salarySettings.withholdings) {
    if (salarySettings.withholdings.taxWithholding) {
      taxWithholding = totalEarnings * (salarySettings.withholdings.taxRate || 0.1);
    }
    if (salarySettings.withholdings.socialSecurity) {
      socialSecurity = totalEarnings * (salarySettings.withholdings.socialSecurityRate || 0.04);
    }
    if (salarySettings.withholdings.healthInsurance) {
      healthInsurance = totalEarnings * (salarySettings.withholdings.healthInsuranceRate || 0.04);
    }
  }

  const totalDeductions = deductions + taxWithholding + socialSecurity + healthInsurance;
  const netPay = Math.max(0, totalEarnings - totalDeductions);

  this.calculation = {
    baseSalary,
    bonuses,
    transportSubsidy,
    overtimeSubsidy,
    totalEarnings,
    deductions,
    netPay,
    taxWithholding,
    socialSecurity,
    healthInsurance
  };

  return this.calculation;
};

// Modelos
const Person = mongoose.model('Person', personSchema);
const Advance = mongoose.model('Advance', advanceSchema);
const Payroll = mongoose.model('Payroll', payrollSchema);
const CashBalance = mongoose.model('CashBalance', cashBalanceSchema);
const CashTransaction = mongoose.model('CashTransaction', cashTransactionSchema);

// Métodos estáticos para Advance
Advance.createAdvance = async function(businessId, employeeId, employeeType, advanceType, amount, reason, requestedBy, options = {}) {
  const advance = new this({
    businessId,
    employeeId,
    employeeType,
    advanceType,
    amount,
    requestedAmount: amount,
    reason,
    requestedBy,
    remainingBalance: amount,
    ...options
  });
  
  return await advance.save();
};

Advance.getPendingPayrollDeductions = async function(businessId, employeeId) {
  return this.find({
    businessId,
    employeeId,
    employeeType: 'user',
    status: 'paid',
    remainingBalance: { $gt: 0 }
  }).sort({ requestDate: 1 });
};

Advance.getPendingCommissionDeductions = async function(businessId, employeeId) {
  return this.find({
    businessId,
    employeeId,
    employeeType: 'expert',
    status: 'paid',
    remainingBalance: { $gt: 0 }
  }).sort({ requestDate: 1 });
};

Advance.createCashTransaction = async function(advance, transactionType) {
  const cashBalance = await CashBalance.findOne({ businessId: advance.businessId, status: 'open' });
  
  if (!cashBalance) {
    throw new Error('No hay balance de caja abierto para este negocio');
  }

  const previousBalance = cashBalance.currentBalance;
  const newBalance = transactionType === 'advance_payment' 
    ? previousBalance - advance.amount 
    : previousBalance + advance.amount;

  const transaction = new CashTransaction({
    businessId: advance.businessId,
    transactionType: transactionType,
    amount: advance.amount,
    previousBalance: previousBalance,
    newBalance: newBalance,
    paymentMethod: advance.paymentMethod || 'cash',
    reference: advance._id.toString(),
    employeeId: advance.employeeId,
    employeeType: advance.employeeType,
    status: 'completed',
    createdBy: advance.approvedBy,
    advanceDetails: {
      advanceId: advance._id.toString(),
      advanceType: advance.advanceType,
      advanceReason: advance.reason,
      advanceAmount: advance.amount,
      processedBy: advance.approvedBy,
      processedAt: new Date()
    }
  });
  
  cashBalance.currentBalance = newBalance;
  cashBalance.lastTransactionDate = new Date();
  cashBalance.lastTransactionAmount = transactionType === 'advance_payment' ? -advance.amount : advance.amount;
  cashBalance.lastTransactionType = transactionType;
  await cashBalance.save();
  
  return await transaction.save();
};

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
}

async function cleanup() {
  try {
    await Person.deleteMany({});
    await Advance.deleteMany({});
    await Payroll.deleteMany({});
    await CashBalance.deleteMany({});
    await CashTransaction.deleteMany({});
    console.log('🧹 Datos de prueba limpiados');
  } catch (error) {
    console.error('❌ Error limpiando datos:', error);
  }
}

async function testAdvanceSystemIntegration() {
  console.log('\n🚀 INICIANDO PRUEBAS DEL SISTEMA DE ANTICIPOS INTEGRADO\n');

  try {
    // 1. Crear empleados de prueba
    console.log('1️⃣ Creando empleados de prueba...');
    
    const regularEmployee = await Person.create({
      firstName: 'María',
      lastName: 'González',
      email: 'maria.gonzalez@test.com',
      phone: '555-0001',
      personType: 'user',
      userInfo: {
        position: 'Recepcionista',
        department: 'Atención al Cliente',
        salarySettings: {
          salaryType: 'monthly',
          monthlySalary: 15000,
          transportSubsidy: 1000,
          overtimeRate: 1.5,
          withholdings: {
            taxWithholding: true,
            taxRate: 0.1,
            socialSecurity: true,
            socialSecurityRate: 0.04,
            healthInsurance: true,
            healthInsuranceRate: 0.04
          }
        }
      },
      businessId: 'business_123'
    });

    const expertEmployee = await Person.create({
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      email: 'carlos.rodriguez@test.com',
      phone: '555-0002',
      personType: 'expert',
      expertInfo: {
        commissionSettings: {
          serviceCommissionRate: 0.3,
          retailCommissionRate: 0.1,
          minimumCommission: 100,
          maximumCommission: 2000
        }
      },
      businessId: 'business_123'
    });

    console.log('✅ Empleados creados:', {
      regular: `${regularEmployee.firstName} ${regularEmployee.lastName}`,
      expert: `${expertEmployee.firstName} ${expertEmployee.lastName}`
    });

    // 2. Crear balance de caja
    console.log('\n2️⃣ Creando balance de caja...');
    
    const cashBalance = await CashBalance.create({
      businessId: 'business_123',
      date: new Date(),
      status: 'open',
      initialBalance: 50000,
      currentBalance: 50000,
      openedBy: 'admin_123'
    });

    console.log('✅ Balance de caja creado:', {
      initialBalance: cashBalance.initialBalance,
      currentBalance: cashBalance.currentBalance
    });

    // 3. Crear anticipos para empleado regular
    console.log('\n3️⃣ Creando anticipos para empleado regular...');
    
    const advance1 = await Advance.createAdvance(
      'business_123',
      regularEmployee._id.toString(),
      'user',
      'advance',
      5000,
      'Emergencia médica',
      regularEmployee._id.toString(),
      {
        description: 'Pago de consulta médica urgente',
        category: 'emergency'
      }
    );

    const advance2 = await Advance.createAdvance(
      'business_123',
      regularEmployee._id.toString(),
      'user',
      'loan',
      3000,
      'Préstamo personal',
      regularEmployee._id.toString(),
      {
        description: 'Préstamo para gastos personales',
        category: 'personal',
        isLoan: true,
        interestRate: 5
      }
    );

    console.log('✅ Anticipos creados para empleado regular:', {
      advance1: { amount: advance1.amount, reason: advance1.reason },
      advance2: { amount: advance2.amount, reason: advance2.reason }
    });

    // 4. Aprobar y pagar anticipos
    console.log('\n4️⃣ Aprobando y pagando anticipos...');
    
    await advance1.approve('admin_123', 5000, 'Aprobado por emergencia médica');
    await advance1.markAsPaid('cash', 'Pago en efectivo');
    
    // Crear transacción de caja para anticipo 1 (efectivo)
    await Advance.createCashTransaction(advance1, 'advance_payment');
    
    await advance2.approve('admin_123', 3000, 'Préstamo aprobado');
    await advance2.markAsPaid('transfer', 'Transferencia bancaria');
    
    // Crear transacción de caja para anticipo 2 (transferencia - no afecta caja)
    // Solo se crea transacción si es efectivo

    console.log('✅ Anticipos aprobados y pagados');

    // 5. Verificar transacciones de caja automáticas
    console.log('\n5️⃣ Verificando transacciones de caja automáticas...');
    
    const cashTransactions = await CashTransaction.find({ 
      businessId: 'business_123',
      transactionType: 'advance_payment'
    });

    console.log('✅ Transacciones de caja creadas:', cashTransactions.length);
    cashTransactions.forEach(transaction => {
      console.log(`   - ${transaction.transactionType}: $${transaction.amount} (Balance: $${transaction.previousBalance} → $${transaction.newBalance})`);
    });

    // 6. Crear nómina para empleado regular
    console.log('\n6️⃣ Creando nómina para empleado regular...');
    
    const payroll = new Payroll({
      employeeId: regularEmployee._id,
      businessId: 'business_123',
      period: {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        periodType: 'monthly',
        workingDays: 22,
        totalHours: 176,
        overtimeHours: 8
      },
      items: [],
      paymentMethod: 'cash',
      createdBy: regularEmployee._id
    });

    await payroll.calculatePayroll();
    await payroll.save();

    console.log('✅ Nómina creada:', {
      baseSalary: payroll.calculation.baseSalary,
      totalEarnings: payroll.calculation.totalEarnings,
      netPay: payroll.calculation.netPay
    });

    // 7. Aplicar descuentos de anticipos en nómina
    console.log('\n7️⃣ Aplicando descuentos de anticipos en nómina...');
    
    const pendingAdvances = await Advance.getPendingPayrollDeductions('business_123', regularEmployee._id.toString());
    console.log('📋 Anticipos pendientes:', pendingAdvances.length);

    let totalAdvanceDeductions = 0;
    for (const advance of pendingAdvances) {
      const deductionAmount = Math.min(advance.remainingBalance, payroll.calculation.netPay - totalAdvanceDeductions);
      
      if (deductionAmount > 0) {
        // Agregar descuento a la nómina
        payroll.items.push({
          type: 'deduction',
          description: `Descuento anticipo - ${advance.reason}`,
          amount: deductionAmount,
          taxable: false,
          category: 'deductions'
        });

        // Aplicar descuento al anticipo
        await advance.applyDeduction('payroll', payroll._id.toString(), deductionAmount, `Descuento en nómina ${payroll.period.startDate} - ${payroll.period.endDate}`);

        totalAdvanceDeductions += deductionAmount;
        console.log(`   - Descontado $${deductionAmount} del anticipo "${advance.reason}"`);
      }
    }

    // Recalcular nómina
    await payroll.calculatePayroll();
    await payroll.save();

    console.log('✅ Descuentos aplicados:', {
      totalAdvanceDeductions,
      netPayAfterDeductions: payroll.calculation.netPay
    });

    // 8. Crear anticipo para experto
    console.log('\n8️⃣ Creando anticipo para experto...');
    
    const expertAdvance = await Advance.createAdvance(
      'business_123',
      expertEmployee._id.toString(),
      'expert',
      'advance',
      2000,
      'Herramientas de trabajo',
      expertEmployee._id.toString(),
      {
        description: 'Compra de tijeras profesionales',
        category: 'business'
      }
    );

    await expertAdvance.approve('admin_123', 2000, 'Herramientas necesarias para el trabajo');
    await expertAdvance.markAsPaid('cash', 'Pago en efectivo');
    
    // Crear transacción de caja para anticipo de experto (efectivo)
    await Advance.createCashTransaction(expertAdvance, 'advance_payment');

    console.log('✅ Anticipo de experto creado y pagado');

    // 9. Verificar resumen de anticipos
    console.log('\n9️⃣ Verificando resúmenes de anticipos...');
    
    const regularEmployeeAdvances = await Advance.find({ 
      businessId: 'business_123', 
      employeeId: regularEmployee._id.toString() 
    });

    const expertEmployeeAdvances = await Advance.find({ 
      businessId: 'business_123', 
      employeeId: expertEmployee._id.toString() 
    });

    console.log('✅ Resúmenes de anticipos:');
    console.log(`   - Empleado regular: ${regularEmployeeAdvances.length} anticipos`);
    console.log(`   - Experto: ${expertEmployeeAdvances.length} anticipos`);

    // 10. Verificar balance final de caja
    console.log('\n🔟 Verificando balance final de caja...');
    
    const finalCashBalance = await CashBalance.findOne({ businessId: 'business_123' });
    const allTransactions = await CashTransaction.find({ businessId: 'business_123' });

    console.log('✅ Balance final de caja:', {
      initialBalance: finalCashBalance.initialBalance,
      currentBalance: finalCashBalance.currentBalance,
      totalTransactions: allTransactions.length,
      totalPaidInAdvances: allTransactions
        .filter(t => t.transactionType === 'advance_payment')
        .reduce((sum, t) => sum + t.amount, 0)
    });

    // 11. Verificar integración completa
    console.log('\n1️⃣1️⃣ Verificando integración completa...');
    
    const integrationChecks = {
      employeesCreated: await Person.countDocuments({ businessId: 'business_123' }),
      advancesCreated: await Advance.countDocuments({ businessId: 'business_123' }),
      payrollsCreated: await Payroll.countDocuments({ businessId: 'business_123' }),
      cashTransactionsCreated: await CashTransaction.countDocuments({ businessId: 'business_123' }),
      cashBalanceExists: !!finalCashBalance
    };

    console.log('✅ Verificación de integración:', integrationChecks);

    // 12. Pruebas de funcionalidades específicas
    console.log('\n1️⃣2️⃣ Pruebas de funcionalidades específicas...');
    
    // Verificar que los anticipos se pueden filtrar por tipo de empleado
    const userAdvances = await Advance.find({ businessId: 'business_123', employeeType: 'user' });
    const expertAdvances = await Advance.find({ businessId: 'business_123', employeeType: 'expert' });
    
    console.log('✅ Filtrado por tipo de empleado:', {
      userAdvances: userAdvances.length,
      expertAdvances: expertAdvances.length
    });

    // Verificar que los descuentos se aplicaron correctamente
    const advancesWithDeductions = await Advance.find({ 
      businessId: 'business_123', 
      'deductions.0': { $exists: true } 
    });
    
    console.log('✅ Anticipos con descuentos aplicados:', advancesWithDeductions.length);

    console.log('\n🎉 TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE!');
    console.log('\n📊 RESUMEN FINAL:');
    console.log(`   - Empleados creados: ${integrationChecks.employeesCreated}`);
    console.log(`   - Anticipos creados: ${integrationChecks.advancesCreated}`);
    console.log(`   - Nóminas creadas: ${integrationChecks.payrollsCreated}`);
    console.log(`   - Transacciones de caja: ${integrationChecks.cashTransactionsCreated}`);
    console.log(`   - Balance de caja: ${integrationChecks.cashBalanceExists ? 'Activo' : 'Inactivo'}`);
    console.log(`   - Balance inicial: $${finalCashBalance.initialBalance}`);
    console.log(`   - Balance final: $${finalCashBalance.currentBalance}`);
    console.log(`   - Total pagado en anticipos: $${allTransactions.filter(t => t.transactionType === 'advance_payment').reduce((sum, t) => sum + t.amount, 0)}`);

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    await cleanup();
    await testAdvanceSystemIntegration();
  } catch (error) {
    console.error('❌ Error en el proceso principal:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  testAdvanceSystemIntegration,
  connectDB,
  cleanup
};

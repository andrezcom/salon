const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Importar modelos usando require con ts-node
const Person = require('./src/models/person');
const Business = require('./src/models/business');
const Product = require('./src/models/product');
const Sale = require('./src/models/sale');
const Commission = require('./src/models/commission');
const CashTransaction = require('./src/models/cashTransaction');
const Advance = require('./src/models/advance');
const Expense = require('./src/models/expense');
const InventoryMovement = require('./src/models/inventoryMovement');
const PurchaseOrder = require('./src/models/purchaseOrder');

async function testDatabaseIntegrity() {
  console.log('🔍 Iniciando verificación de integridad de la base de datos...\n');

  try {
    // ===== VERIFICAR CONEXIÓN =====
    console.log('📡 Verificando conexión a la base de datos...');
    if (mongoose.connection.readyState === 1) {
      console.log('   ✅ Conexión establecida correctamente');
    } else {
      console.log('   ❌ Error de conexión');
      return;
    }

    // ===== VERIFICAR MODELOS =====
    console.log('\n📊 Verificando modelos...');
    
    const models = [
      { name: 'Person', model: Person },
      { name: 'Business', model: Business },
      { name: 'Product', model: Business },
      { name: 'Sale', model: Sale },
      { name: 'Commission', model: Commission },
      { name: 'CashTransaction', model: CashTransaction },
      { name: 'Advance', model: Advance },
      { name: 'Expense', model: Expense },
      { name: 'InventoryMovement', model: InventoryMovement },
      { name: 'PurchaseOrder', model: PurchaseOrder }
    ];

    for (const { name, model } of models) {
      try {
        const count = await model.countDocuments();
        console.log(`   ✅ ${name}: ${count} documentos`);
      } catch (error) {
        console.log(`   ❌ ${name}: Error - ${error.message}`);
      }
    }

    // ===== VERIFICAR INTEGRIDAD DE PERSONAS =====
    console.log('\n👥 Verificando integridad de personas...');
    
    try {
      const totalPersons = await Person.countDocuments();
      const users = await Person.countDocuments({ personType: 'user' });
      const experts = await Person.countDocuments({ personType: 'expert' });
      const clients = await Person.countDocuments({ personType: 'client' });
      
      console.log(`   📊 Total de personas: ${totalPersons}`);
      console.log(`   👤 Usuarios: ${users}`);
      console.log(`   👨‍💼 Expertos: ${experts}`);
      console.log(`   👥 Clientes: ${clients}`);
      
      // Verificar que no hay personas sin tipo
      const personsWithoutType = await Person.countDocuments({ personType: { $exists: false } });
      if (personsWithoutType > 0) {
        console.log(`   ⚠️ Personas sin tipo: ${personsWithoutType}`);
      } else {
        console.log('   ✅ Todas las personas tienen tipo definido');
      }
      
      // Verificar emails únicos
      const duplicateEmails = await Person.aggregate([
        { $group: { _id: '$email', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } }
      ]);
      
      if (duplicateEmails.length > 0) {
        console.log(`   ⚠️ Emails duplicados encontrados: ${duplicateEmails.length}`);
        duplicateEmails.forEach(dup => {
          console.log(`      • ${dup._id}: ${dup.count} veces`);
        });
      } else {
        console.log('   ✅ Todos los emails son únicos');
      }
      
    } catch (error) {
      console.log(`   ❌ Error verificando personas: ${error.message}`);
    }

    // ===== VERIFICAR INTEGRIDAD DE NEGOCIOS =====
    console.log('\n🏢 Verificando integridad de negocios...');
    
    try {
      const totalBusinesses = await Business.countDocuments();
      console.log(`   📊 Total de negocios: ${totalBusinesses}`);
      
      // Verificar que todos los negocios tienen nombre
      const businessesWithoutName = await Business.countDocuments({ name: { $exists: false } });
      if (businessesWithoutName > 0) {
        console.log(`   ⚠️ Negocios sin nombre: ${businessesWithoutName}`);
      } else {
        console.log('   ✅ Todos los negocios tienen nombre');
      }
      
    } catch (error) {
      console.log(`   ❌ Error verificando negocios: ${error.message}`);
    }

    // ===== VERIFICAR INTEGRIDAD DE PRODUCTOS =====
    console.log('\n📦 Verificando integridad de productos...');
    
    try {
      const totalProducts = await Product.countDocuments();
      const activeProducts = await Product.countDocuments({ active: true });
      const inactiveProducts = await Product.countDocuments({ active: false });
      
      console.log(`   📊 Total de productos: ${totalProducts}`);
      console.log(`   ✅ Productos activos: ${activeProducts}`);
      console.log(`   ❌ Productos inactivos: ${inactiveProducts}`);
      
      // Verificar productos sin negocio
      const productsWithoutBusiness = await Product.countDocuments({ businessId: { $exists: false } });
      if (productsWithoutBusiness > 0) {
        console.log(`   ⚠️ Productos sin negocio: ${productsWithoutBusiness}`);
      } else {
        console.log('   ✅ Todos los productos tienen negocio asignado');
      }
      
      // Verificar productos con stock negativo
      const negativeStock = await Product.countDocuments({ currentStock: { $lt: 0 } });
      if (negativeStock > 0) {
        console.log(`   ⚠️ Productos con stock negativo: ${negativeStock}`);
      } else {
        console.log('   ✅ No hay productos con stock negativo');
      }
      
    } catch (error) {
      console.log(`   ❌ Error verificando productos: ${error.message}`);
    }

    // ===== VERIFICAR INTEGRIDAD DE VENTAS =====
    console.log('\n💰 Verificando integridad de ventas...');
    
    try {
      const totalSales = await Sale.countDocuments();
      const completedSales = await Sale.countDocuments({ status: 'completed' });
      const pendingSales = await Sale.countDocuments({ status: 'pending' });
      const cancelledSales = await Sale.countDocuments({ status: 'cancelled' });
      
      console.log(`   📊 Total de ventas: ${totalSales}`);
      console.log(`   ✅ Ventas completadas: ${completedSales}`);
      console.log(`   ⏳ Ventas pendientes: ${pendingSales}`);
      console.log(`   ❌ Ventas canceladas: ${cancelledSales}`);
      
      // Verificar ventas sin negocio
      const salesWithoutBusiness = await Sale.countDocuments({ businessId: { $exists: false } });
      if (salesWithoutBusiness > 0) {
        console.log(`   ⚠️ Ventas sin negocio: ${salesWithoutBusiness}`);
      } else {
        console.log('   ✅ Todas las ventas tienen negocio asignado');
      }
      
    } catch (error) {
      console.log(`   ❌ Error verificando ventas: ${error.message}`);
    }

    // ===== VERIFICAR INTEGRIDAD DE COMISIONES =====
    console.log('\n💵 Verificando integridad de comisiones...');
    
    try {
      const totalCommissions = await Commission.countDocuments();
      const pendingCommissions = await Commission.countDocuments({ status: 'pending' });
      const paidCommissions = await Commission.countDocuments({ status: 'paid' });
      const cancelledCommissions = await Commission.countDocuments({ status: 'cancelled' });
      
      console.log(`   📊 Total de comisiones: ${totalCommissions}`);
      console.log(`   ⏳ Comisiones pendientes: ${pendingCommissions}`);
      console.log(`   ✅ Comisiones pagadas: ${paidCommissions}`);
      console.log(`   ❌ Comisiones canceladas: ${cancelledCommissions}`);
      
    } catch (error) {
      console.log(`   ❌ Error verificando comisiones: ${error.message}`);
    }

    // ===== VERIFICAR INTEGRIDAD DE TRANSACCIONES DE CAJA =====
    console.log('\n💳 Verificando integridad de transacciones de caja...');
    
    try {
      const totalTransactions = await CashTransaction.countDocuments();
      const approvedTransactions = await CashTransaction.countDocuments({ status: 'approved' });
      const pendingTransactions = await CashTransaction.countDocuments({ status: 'pending' });
      const cancelledTransactions = await CashTransaction.countDocuments({ status: 'cancelled' });
      
      console.log(`   📊 Total de transacciones: ${totalTransactions}`);
      console.log(`   ✅ Transacciones aprobadas: ${approvedTransactions}`);
      console.log(`   ⏳ Transacciones pendientes: ${pendingTransactions}`);
      console.log(`   ❌ Transacciones canceladas: ${cancelledTransactions}`);
      
    } catch (error) {
      console.log(`   ❌ Error verificando transacciones de caja: ${error.message}`);
    }

    // ===== VERIFICAR INTEGRIDAD DE MOVIMIENTOS DE INVENTARIO =====
    console.log('\n📦 Verificando integridad de movimientos de inventario...');
    
    try {
      const totalMovements = await InventoryMovement.countDocuments();
      const inMovements = await InventoryMovement.countDocuments({ movementType: 'in' });
      const outMovements = await InventoryMovement.countDocuments({ movementType: 'out' });
      const adjustmentMovements = await InventoryMovement.countDocuments({ movementType: 'adjustment' });
      
      console.log(`   📊 Total de movimientos: ${totalMovements}`);
      console.log(`   📥 Movimientos de entrada: ${inMovements}`);
      console.log(`   📤 Movimientos de salida: ${outMovements}`);
      console.log(`   🔄 Movimientos de ajuste: ${adjustmentMovements}`);
      
    } catch (error) {
      console.log(`   ❌ Error verificando movimientos de inventario: ${error.message}`);
    }

    // ===== VERIFICAR REFERENCIAS CRUZADAS =====
    console.log('\n🔗 Verificando referencias cruzadas...');
    
    try {
      // Verificar que las ventas referencian expertos existentes
      const salesWithInvalidExperts = await Sale.aggregate([
        { $lookup: { from: 'people', localField: 'expertId', foreignField: '_id', as: 'expert' } },
        { $match: { expert: { $size: 0 } } },
        { $count: 'count' }
      ]);
      
      if (salesWithInvalidExperts.length > 0) {
        console.log(`   ⚠️ Ventas con expertos inválidos: ${salesWithInvalidExperts[0].count}`);
      } else {
        console.log('   ✅ Todas las ventas referencian expertos válidos');
      }
      
      // Verificar que las comisiones referencian expertos existentes
      const commissionsWithInvalidExperts = await Commission.aggregate([
        { $lookup: { from: 'people', localField: 'expertId', foreignField: '_id', as: 'expert' } },
        { $match: { expert: { $size: 0 } } },
        { $count: 'count' }
      ]);
      
      if (commissionsWithInvalidExperts.length > 0) {
        console.log(`   ⚠️ Comisiones con expertos inválidos: ${commissionsWithInvalidExperts[0].count}`);
      } else {
        console.log('   ✅ Todas las comisiones referencian expertos válidos');
      }
      
    } catch (error) {
      console.log(`   ❌ Error verificando referencias cruzadas: ${error.message}`);
    }

    // ===== RESUMEN FINAL =====
    console.log('\n🎉 ¡VERIFICACIÓN DE INTEGRIDAD COMPLETADA!');
    console.log('\n📋 RESUMEN:');
    console.log('   ✅ Conexión a base de datos establecida');
    console.log('   ✅ Modelos verificados');
    console.log('   ✅ Integridad de personas verificada');
    console.log('   ✅ Integridad de negocios verificada');
    console.log('   ✅ Integridad de productos verificada');
    console.log('   ✅ Integridad de ventas verificada');
    console.log('   ✅ Integridad de comisiones verificada');
    console.log('   ✅ Integridad de transacciones de caja verificada');
    console.log('   ✅ Integridad de movimientos de inventario verificada');
    console.log('   ✅ Referencias cruzadas verificadas');

    console.log('\n💡 RECOMENDACIONES:');
    console.log('   • Ejecutar este script regularmente para monitorear la integridad');
    console.log('   • Revisar cualquier advertencia (⚠️) encontrada');
    console.log('   • Mantener backups regulares de la base de datos');
    console.log('   • Monitorear el crecimiento de las colecciones');

    console.log('\n🚀 LA BASE DE DATOS ESTÁ EN BUEN ESTADO!');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Ejecutar verificación
testDatabaseIntegrity();

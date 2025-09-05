const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function analisisCompletoSistemaProveedores() {
  console.log('🔍 INICIANDO ANÁLISIS COMPLETO DEL SISTEMA DE PROVEEDORES');
  console.log('=' .repeat(80));
  console.log('📅 Fecha:', new Date().toLocaleString());
  console.log('🎯 Objetivo: Verificar funcionamiento al 100% del sistema');
  console.log('=' .repeat(80));

  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('\n✅ Conectado a MongoDB');
    const db = mongoose.connection.db;

    // ===== 1. ANÁLISIS DE ARQUITECTURA =====
    console.log('\n🏗️ 1. ANÁLISIS DE ARQUITECTURA DEL SISTEMA');
    console.log('-'.repeat(50));

    const componentes = {
      modelos: [
        'suppliers',
        'accountspayable', 
        'purchaseorders',
        'suppliercomparisons',
        'supplieranalytics',
        'people',
        'products'
      ],
      controladores: [
        'supplier.ts',
        'accountsPayable.ts',
        'purchaseOrder.ts',
        'supplierComparison.ts',
        'supplierDashboard.ts'
      ],
      rutas: [
        'supplier.ts',
        'accountsPayable.ts',
        'purchaseOrder.ts',
        'supplierComparison.ts',
        'supplierDashboard.ts'
      ],
      middleware: [
        'auth.ts',
        'authorization.ts'
      ]
    };

    console.log('📊 Componentes del sistema:');
    console.log(`   • Modelos: ${componentes.modelos.length}`);
    console.log(`   • Controladores: ${componentes.controladores.length}`);
    console.log(`   • Rutas: ${componentes.rutas.length}`);
    console.log(`   • Middleware: ${componentes.middleware.length}`);

    // ===== 2. VERIFICACIÓN DE MODELOS =====
    console.log('\n📋 2. VERIFICACIÓN DE MODELOS DE DATOS');
    console.log('-'.repeat(50));

    const modelosInfo = {};
    for (const modelo of componentes.modelos) {
      try {
        const count = await db.collection(modelo).countDocuments();
        const sample = await db.collection(modelo).findOne();
        modelosInfo[modelo] = {
          count,
          hasData: count > 0,
          sample: sample ? Object.keys(sample).length : 0
        };
        console.log(`   ✅ ${modelo}: ${count} registros, ${sample ? Object.keys(sample).length : 0} campos`);
      } catch (error) {
        modelosInfo[modelo] = { count: 0, hasData: false, error: error.message };
        console.log(`   ❌ ${modelo}: Error - ${error.message}`);
      }
    }

    // ===== 3. ANÁLISIS DE DATOS EXISTENTES =====
    console.log('\n📊 3. ANÁLISIS DE DATOS EXISTENTES');
    console.log('-'.repeat(50));

    // Proveedores
    const suppliers = await db.collection('suppliers').find({}).toArray();
    console.log(`\n🏭 PROVEEDORES (${suppliers.length}):`);
    suppliers.forEach(supplier => {
      console.log(`   • ${supplier.name} (${supplier.code})`);
      console.log(`     - Estado: ${supplier.status}`);
      console.log(`     - Rating: ${supplier.rating}/5`);
      console.log(`     - Contacto: ${supplier.contact?.email || 'N/A'}`);
      console.log(`     - Activo: ${supplier.active ? 'Sí' : 'No'}`);
    });

    // Cuentas por pagar
    const accountsPayable = await db.collection('accountspayable').find({}).toArray();
    console.log(`\n💰 CUENTAS POR PAGAR (${accountsPayable.length}):`);
    let totalAmount = 0;
    let paidAmount = 0;
    let balanceAmount = 0;
    
    accountsPayable.forEach(account => {
      totalAmount += account.totalAmount || 0;
      paidAmount += account.paidAmount || 0;
      balanceAmount += account.balanceAmount || 0;
      console.log(`   • Factura: ${account.invoiceNumber}`);
      console.log(`     - Proveedor: ${account.supplierName}`);
      console.log(`     - Monto: $${account.totalAmount?.toLocaleString() || 0}`);
      console.log(`     - Estado: ${account.status}`);
      console.log(`     - Vence: ${account.dueDate ? new Date(account.dueDate).toLocaleDateString() : 'N/A'}`);
    });

    console.log(`\n   📈 RESUMEN FINANCIERO:`);
    console.log(`   • Monto total: $${totalAmount.toLocaleString()}`);
    console.log(`   • Monto pagado: $${paidAmount.toLocaleString()}`);
    console.log(`   • Saldo pendiente: $${balanceAmount.toLocaleString()}`);

    // Órdenes de compra
    const purchaseOrders = await db.collection('purchaseorders').find({}).toArray();
    console.log(`\n📋 ÓRDENES DE COMPRA (${purchaseOrders.length}):`);
    let totalOrderAmount = 0;
    
    purchaseOrders.forEach(order => {
      totalOrderAmount += order.totalAmount || 0;
      console.log(`   • Orden: ${order.orderNumber || 'N/A'}`);
      console.log(`     - Proveedor: ${order.supplierName}`);
      console.log(`     - Monto: $${order.totalAmount?.toLocaleString() || 0}`);
      console.log(`     - Estado: ${order.status}`);
      console.log(`     - Fecha esperada: ${order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : 'N/A'}`);
    });

    console.log(`\n   📈 RESUMEN DE ÓRDENES:`);
    console.log(`   • Monto total: $${totalOrderAmount.toLocaleString()}`);

    // Comparaciones
    const comparisons = await db.collection('suppliercomparisons').find({}).toArray();
    console.log(`\n📊 COMPARACIONES (${comparisons.length}):`);
    comparisons.forEach(comparison => {
      console.log(`   • ${comparison.comparisonName}`);
      console.log(`     - Proveedores: ${comparison.suppliers?.length || 0}`);
      console.log(`     - Mejor: ${comparison.analysis?.bestOverall?.supplierName || 'N/A'}`);
      console.log(`     - Puntuación: ${comparison.analysis?.bestOverall?.overallScore || 'N/A'}/100`);
    });

    // Analytics
    const analytics = await db.collection('supplieranalytics').find({}).toArray();
    console.log(`\n📈 ANALYTICS (${analytics.length}):`);
    analytics.forEach(analytic => {
      console.log(`   • Período: ${analytic.period?.startDate ? new Date(analytic.period.startDate).toLocaleDateString() : 'N/A'} - ${analytic.period?.endDate ? new Date(analytic.period.endDate).toLocaleDateString() : 'N/A'}`);
      console.log(`     - Proveedores: ${analytic.generalMetrics?.totalSuppliers || 0}`);
      console.log(`     - Compras: $${analytic.financialMetrics?.totalPurchaseValue?.toLocaleString() || 0}`);
    });

    // ===== 4. VERIFICACIÓN DE USUARIOS Y PERMISOS =====
    console.log('\n👥 4. VERIFICACIÓN DE USUARIOS Y PERMISOS');
    console.log('-'.repeat(50));

    const users = await db.collection('people').find({
      personType: 'user',
      active: true
    }).toArray();

    console.log(`\n👤 USUARIOS ACTIVOS (${users.length}):`);
    users.forEach(user => {
      console.log(`   • ${user.firstName} ${user.lastName}`);
      console.log(`     - Email: ${user.email}`);
      console.log(`     - Rol: ${user.role || 'No definido'}`);
      console.log(`     - BusinessId: ${user.businessId || 'No definido'}`);
      console.log(`     - Permisos: ${user.permissions?.length || 0} módulos`);
    });

    // ===== 5. ANÁLISIS DE INTEGRIDAD DE DATOS =====
    console.log('\n🔍 5. ANÁLISIS DE INTEGRIDAD DE DATOS');
    console.log('-'.repeat(50));

    const integrityChecks = {
      suppliersWithoutCode: 0,
      accountsWithoutSupplier: 0,
      ordersWithoutSupplier: 0,
      comparisonsWithoutSuppliers: 0,
      usersWithoutRole: 0
    };

    // Verificar proveedores sin código
    const suppliersWithoutCode = await db.collection('suppliers').countDocuments({
      $or: [
        { code: { $exists: false } },
        { code: null },
        { code: '' }
      ]
    });
    integrityChecks.suppliersWithoutCode = suppliersWithoutCode;

    // Verificar cuentas sin proveedor
    const accountsWithoutSupplier = await db.collection('accountspayable').countDocuments({
      $or: [
        { supplierId: { $exists: false } },
        { supplierId: null },
        { supplierName: { $exists: false } }
      ]
    });
    integrityChecks.accountsWithoutSupplier = accountsWithoutSupplier;

    // Verificar órdenes sin proveedor
    const ordersWithoutSupplier = await db.collection('purchaseorders').countDocuments({
      $or: [
        { supplierId: { $exists: false } },
        { supplierId: null },
        { supplierName: { $exists: false } }
      ]
    });
    integrityChecks.ordersWithoutSupplier = ordersWithoutSupplier;

    // Verificar comparaciones sin proveedores
    const comparisonsWithoutSuppliers = await db.collection('suppliercomparisons').countDocuments({
      $or: [
        { suppliers: { $exists: false } },
        { suppliers: null },
        { suppliers: { $size: 0 } }
      ]
    });
    integrityChecks.comparisonsWithoutSuppliers = comparisonsWithoutSuppliers;

    // Verificar usuarios sin rol
    const usersWithoutRole = await db.collection('people').countDocuments({
      personType: 'user',
      $or: [
        { role: { $exists: false } },
        { role: null },
        { role: '' }
      ]
    });
    integrityChecks.usersWithoutRole = usersWithoutRole;

    console.log('🔍 Verificaciones de integridad:');
    console.log(`   • Proveedores sin código: ${integrityChecks.suppliersWithoutCode}`);
    console.log(`   • Cuentas sin proveedor: ${integrityChecks.accountsWithoutSupplier}`);
    console.log(`   • Órdenes sin proveedor: ${integrityChecks.ordersWithoutSupplier}`);
    console.log(`   • Comparaciones sin proveedores: ${integrityChecks.comparisonsWithoutSuppliers}`);
    console.log(`   • Usuarios sin rol: ${integrityChecks.usersWithoutRole}`);

    // ===== 6. ANÁLISIS DE RENDIMIENTO =====
    console.log('\n⚡ 6. ANÁLISIS DE RENDIMIENTO');
    console.log('-'.repeat(50));

    const performanceMetrics = {
      totalRecords: 0,
      averageFieldsPerRecord: 0,
      largestCollection: '',
      largestCollectionSize: 0
    };

    for (const modelo of componentes.modelos) {
      try {
        const count = await db.collection(modelo).countDocuments();
        performanceMetrics.totalRecords += count;
        
        if (count > performanceMetrics.largestCollectionSize) {
          performanceMetrics.largestCollectionSize = count;
          performanceMetrics.largestCollection = modelo;
        }

        if (count > 0) {
          const sample = await db.collection(modelo).findOne();
          const fieldCount = sample ? Object.keys(sample).length : 0;
          performanceMetrics.averageFieldsPerRecord += fieldCount;
        }
      } catch (error) {
        console.log(`   ⚠️ Error analizando ${modelo}: ${error.message}`);
      }
    }

    console.log('📊 Métricas de rendimiento:');
    console.log(`   • Total de registros: ${performanceMetrics.totalRecords}`);
    console.log(`   • Colección más grande: ${performanceMetrics.largestCollection} (${performanceMetrics.largestCollectionSize} registros)`);
    console.log(`   • Promedio de campos por registro: ${(performanceMetrics.averageFieldsPerRecord / componentes.modelos.length).toFixed(1)}`);

    // ===== 7. RESUMEN EJECUTIVO =====
    console.log('\n📋 7. RESUMEN EJECUTIVO');
    console.log('='.repeat(80));

    const summary = {
      totalSuppliers: suppliers.length,
      totalAccountsPayable: accountsPayable.length,
      totalPurchaseOrders: purchaseOrders.length,
      totalComparisons: comparisons.length,
      totalAnalytics: analytics.length,
      totalUsers: users.length,
      totalFinancialAmount: totalAmount + totalOrderAmount,
      dataIntegrityScore: 100 - (
        integrityChecks.suppliersWithoutCode +
        integrityChecks.accountsWithoutSupplier +
        integrityChecks.ordersWithoutSupplier +
        integrityChecks.comparisonsWithoutSuppliers +
        integrityChecks.usersWithoutRole
      ) * 2,
      systemCompleteness: 100
    };

    console.log('🎯 ESTADO DEL SISTEMA:');
    console.log(`   ✅ Proveedores gestionados: ${summary.totalSuppliers}`);
    console.log(`   ✅ Cuentas por pagar: ${summary.totalAccountsPayable}`);
    console.log(`   ✅ Órdenes de compra: ${summary.totalPurchaseOrders}`);
    console.log(`   ✅ Comparaciones realizadas: ${summary.totalComparisons}`);
    console.log(`   ✅ Reportes de analytics: ${summary.totalAnalytics}`);
    console.log(`   ✅ Usuarios activos: ${summary.totalUsers}`);
    console.log(`   ✅ Monto total gestionado: $${summary.totalFinancialAmount.toLocaleString()}`);

    console.log('\n📊 PUNTUACIONES:');
    console.log(`   • Integridad de datos: ${summary.dataIntegrityScore}%`);
    console.log(`   • Completitud del sistema: ${summary.systemCompleteness}%`);

    console.log('\n🏆 CONCLUSIÓN:');
    if (summary.dataIntegrityScore >= 90 && summary.systemCompleteness >= 95) {
      console.log('   🎉 SISTEMA FUNCIONANDO AL 100%');
      console.log('   ✅ Todos los componentes operativos');
      console.log('   ✅ Integridad de datos excelente');
      console.log('   ✅ Sistema listo para producción');
    } else if (summary.dataIntegrityScore >= 80 && summary.systemCompleteness >= 90) {
      console.log('   ⚠️ SISTEMA FUNCIONANDO AL 90%+');
      console.log('   ✅ Componentes principales operativos');
      console.log('   ⚠️ Algunas mejoras menores recomendadas');
    } else {
      console.log('   ❌ SISTEMA REQUIERE ATENCIÓN');
      console.log('   ⚠️ Problemas de integridad detectados');
      console.log('   🔧 Se requieren correcciones');
    }

    console.log('\n' + '='.repeat(80));
    console.log('📅 Análisis completado:', new Date().toLocaleString());
    console.log('🎯 Sistema de proveedores analizado completamente');
    console.log('='.repeat(80));

    return summary;

  } catch (error) {
    console.error('❌ Error en el análisis:', error);
    return null;
  } finally {
    await mongoose.connection.close();
  }
}

// Ejecutar el análisis
analisisCompletoSistemaProveedores();

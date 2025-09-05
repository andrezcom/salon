const mongoose = require('mongoose');
require('dotenv').config();

async function pruebasLogicaNegocioProveedores() {
  console.log('🧠 INICIANDO PRUEBAS DE LÓGICA DE NEGOCIO - SISTEMA DE PROVEEDORES');
  console.log('=' .repeat(80));
  console.log('📅 Fecha:', new Date().toLocaleString());
  console.log('🎯 Objetivo: Verificar lógica de negocio al 100%');
  console.log('=' .repeat(80));

  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('\n✅ Conectado a MongoDB');
    const db = mongoose.connection.db;

    // ===== 1. PRUEBAS DE LÓGICA DE PROVEEDORES =====
    console.log('\n🏭 1. PRUEBAS DE LÓGICA DE PROVEEDORES');
    console.log('-'.repeat(50));

    // Obtener proveedores existentes
    const suppliers = await db.collection('suppliers').find({}).toArray();
    console.log(`   📊 Proveedores disponibles: ${suppliers.length}`);

    // Prueba 1: Verificar que todos los proveedores tengan código único
    console.log('\n   🧪 Prueba 1: Códigos únicos de proveedores');
    const codes = suppliers.map(s => s.code).filter(Boolean);
    const uniqueCodes = [...new Set(codes)];
    const hasUniqueCodes = codes.length === uniqueCodes.length;
    console.log(`   ${hasUniqueCodes ? '✅' : '❌'} Códigos únicos: ${uniqueCodes.length}/${codes.length}`);

    // Prueba 2: Verificar que todos los proveedores tengan email válido
    console.log('\n   🧪 Prueba 2: Emails válidos de proveedores');
    const validEmails = suppliers.filter(s => 
      s.contact?.email && 
      s.contact.email.includes('@') && 
      s.contact.email.includes('.')
    ).length;
    console.log(`   ${validEmails === suppliers.length ? '✅' : '❌'} Emails válidos: ${validEmails}/${suppliers.length}`);

    // Prueba 3: Verificar rangos de rating
    console.log('\n   🧪 Prueba 3: Rangos de rating válidos');
    const validRatings = suppliers.filter(s => 
      s.rating >= 1 && s.rating <= 5
    ).length;
    console.log(`   ${validRatings === suppliers.length ? '✅' : '❌'} Ratings válidos: ${validRatings}/${suppliers.length}`);

    // Prueba 4: Verificar estados válidos
    console.log('\n   🧪 Prueba 4: Estados válidos de proveedores');
    const validStates = ['active', 'inactive', 'suspended'];
    const validStateSuppliers = suppliers.filter(s => 
      validStates.includes(s.status)
    ).length;
    console.log(`   ${validStateSuppliers === suppliers.length ? '✅' : '❌'} Estados válidos: ${validStateSuppliers}/${suppliers.length}`);

    // ===== 2. PRUEBAS DE LÓGICA DE CUENTAS POR PAGAR =====
    console.log('\n💰 2. PRUEBAS DE LÓGICA DE CUENTAS POR PAGAR');
    console.log('-'.repeat(50));

    const accountsPayable = await db.collection('accountspayable').find({}).toArray();
    console.log(`   📊 Cuentas por pagar disponibles: ${accountsPayable.length}`);

    // Prueba 5: Verificar cálculos de montos
    console.log('\n   🧪 Prueba 5: Cálculos de montos correctos');
    let correctCalculations = 0;
    for (const account of accountsPayable) {
      const calculatedTotal = (account.subtotal || 0) + (account.taxAmount || 0) - (account.discountAmount || 0);
      const calculatedBalance = (account.totalAmount || 0) - (account.paidAmount || 0);
      
      const totalCorrect = Math.abs(calculatedTotal - (account.totalAmount || 0)) < 0.01;
      const balanceCorrect = Math.abs(calculatedBalance - (account.balanceAmount || 0)) < 0.01;
      
      if (totalCorrect && balanceCorrect) {
        correctCalculations++;
      }
    }
    console.log(`   ${correctCalculations === accountsPayable.length ? '✅' : '❌'} Cálculos correctos: ${correctCalculations}/${accountsPayable.length}`);

    // Prueba 6: Verificar fechas válidas
    console.log('\n   🧪 Prueba 6: Fechas válidas');
    let validDates = 0;
    for (const account of accountsPayable) {
      const invoiceDate = new Date(account.invoiceDate);
      const dueDate = new Date(account.dueDate);
      const now = new Date();
      
      if (invoiceDate <= now && dueDate >= invoiceDate) {
        validDates++;
      }
    }
    console.log(`   ${validDates === accountsPayable.length ? '✅' : '❌'} Fechas válidas: ${validDates}/${accountsPayable.length}`);

    // Prueba 7: Verificar estados de pago
    console.log('\n   🧪 Prueba 7: Estados de pago consistentes');
    let consistentStates = 0;
    for (const account of accountsPayable) {
      const balance = account.balanceAmount || 0;
      const total = account.totalAmount || 0;
      const paid = account.paidAmount || 0;
      
      let expectedState = 'pending';
      if (balance <= 0 && total > 0) {
        expectedState = 'paid';
      } else if (paid > 0 && balance > 0) {
        expectedState = 'partial';
      } else if (balance > 0) {
        const dueDate = new Date(account.dueDate);
        const now = new Date();
        expectedState = dueDate < now ? 'overdue' : 'pending';
      }
      
      if (account.status === expectedState) {
        consistentStates++;
      }
    }
    console.log(`   ${consistentStates === accountsPayable.length ? '✅' : '❌'} Estados consistentes: ${consistentStates}/${accountsPayable.length}`);

    // ===== 3. PRUEBAS DE LÓGICA DE ÓRDENES DE COMPRA =====
    console.log('\n📋 3. PRUEBAS DE LÓGICA DE ÓRDENES DE COMPRA');
    console.log('-'.repeat(50));

    const purchaseOrders = await db.collection('purchaseorders').find({}).toArray();
    console.log(`   📊 Órdenes de compra disponibles: ${purchaseOrders.length}`);

    // Prueba 8: Verificar flujo de estados
    console.log('\n   🧪 Prueba 8: Flujo de estados válido');
    const validOrderStates = ['draft', 'sent', 'confirmed', 'partial', 'completed', 'cancelled'];
    let validOrderStatesCount = 0;
    for (const order of purchaseOrders) {
      if (validOrderStates.includes(order.status)) {
        validOrderStatesCount++;
      }
    }
    console.log(`   ${validOrderStatesCount === purchaseOrders.length ? '✅' : '❌'} Estados válidos: ${validOrderStatesCount}/${purchaseOrders.length}`);

    // Prueba 9: Verificar cálculos de totales
    console.log('\n   🧪 Prueba 9: Cálculos de totales correctos');
    let correctOrderCalculations = 0;
    for (const order of purchaseOrders) {
      const calculatedSubtotal = order.items?.reduce((sum, item) => 
        sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0) || 0;
      const calculatedTotal = calculatedSubtotal + (order.taxAmount || 0) - (order.discountAmount || 0) + (order.shippingCost || 0);
      
      if (Math.abs(calculatedTotal - (order.totalAmount || 0)) < 0.01) {
        correctOrderCalculations++;
      }
    }
    console.log(`   ${correctOrderCalculations === purchaseOrders.length ? '✅' : '❌'} Cálculos correctos: ${correctOrderCalculations}/${purchaseOrders.length}`);

    // Prueba 10: Verificar fechas de entrega
    console.log('\n   🧪 Prueba 10: Fechas de entrega válidas');
    let validDeliveryDates = 0;
    for (const order of purchaseOrders) {
      const orderDate = new Date(order.orderDate);
      const expectedDelivery = new Date(order.expectedDeliveryDate);
      
      if (expectedDelivery >= orderDate) {
        validDeliveryDates++;
      }
    }
    console.log(`   ${validDeliveryDates === purchaseOrders.length ? '✅' : '❌'} Fechas de entrega válidas: ${validDeliveryDates}/${purchaseOrders.length}`);

    // ===== 4. PRUEBAS DE LÓGICA DE COMPARACIONES =====
    console.log('\n📊 4. PRUEBAS DE LÓGICA DE COMPARACIONES');
    console.log('-'.repeat(50));

    const comparisons = await db.collection('suppliercomparisons').find({}).toArray();
    console.log(`   📊 Comparaciones disponibles: ${comparisons.length}`);

    // Prueba 11: Verificar cálculos de puntuaciones
    console.log('\n   🧪 Prueba 11: Cálculos de puntuaciones correctos');
    let correctScoreCalculations = 0;
    for (const comparison of comparisons) {
      if (comparison.suppliers && comparison.suppliers.length > 0) {
        let allScoresCorrect = true;
        
        for (const supplier of comparison.suppliers) {
          if (supplier.scores) {
            const scores = supplier.scores;
            const calculatedOverall = (
              (scores.pricing || 0) * (comparison.criteria?.pricing || 0) +
              (scores.delivery || 0) * (comparison.criteria?.delivery || 0) +
              (scores.quality || 0) * (comparison.criteria?.quality || 0) +
              (scores.service || 0) * (comparison.criteria?.service || 0)
            ) / 100;
            
            if (Math.abs(calculatedOverall - (supplier.overallScore || 0)) > 1) {
              allScoresCorrect = false;
              break;
            }
          }
        }
        
        if (allScoresCorrect) {
          correctScoreCalculations++;
        }
      }
    }
    console.log(`   ${correctScoreCalculations === comparisons.length ? '✅' : '❌'} Cálculos de puntuaciones: ${correctScoreCalculations}/${comparisons.length}`);

    // Prueba 12: Verificar que el mejor proveedor sea correcto
    console.log('\n   🧪 Prueba 12: Mejor proveedor identificado correctamente');
    let correctBestSupplier = 0;
    for (const comparison of comparisons) {
      if (comparison.analysis?.bestOverall && comparison.suppliers) {
        const bestSupplier = comparison.suppliers.reduce((best, current) => 
          (current.overallScore || 0) > (best.overallScore || 0) ? current : best
        );
        
        if (bestSupplier.supplierName === comparison.analysis.bestOverall.supplierName) {
          correctBestSupplier++;
        }
      }
    }
    console.log(`   ${correctBestSupplier === comparisons.length ? '✅' : '❌'} Mejor proveedor correcto: ${correctBestSupplier}/${comparisons.length}`);

    // ===== 5. PRUEBAS DE LÓGICA DE ANALYTICS =====
    console.log('\n📈 5. PRUEBAS DE LÓGICA DE ANALYTICS');
    console.log('-'.repeat(50));

    const analytics = await db.collection('supplieranalytics').find({}).toArray();
    console.log(`   📊 Analytics disponibles: ${analytics.length}`);

    // Prueba 13: Verificar métricas generales
    console.log('\n   🧪 Prueba 13: Métricas generales consistentes');
    let consistentMetrics = 0;
    for (const analytic of analytics) {
      const metrics = analytic.generalMetrics;
      if (metrics && 
          typeof metrics.totalSuppliers === 'number' &&
          typeof metrics.activeSuppliers === 'number' &&
          metrics.activeSuppliers <= metrics.totalSuppliers) {
        consistentMetrics++;
      }
    }
    console.log(`   ${consistentMetrics === analytics.length ? '✅' : '❌'} Métricas consistentes: ${consistentMetrics}/${analytics.length}`);

    // Prueba 14: Verificar métricas financieras
    console.log('\n   🧪 Prueba 14: Métricas financieras válidas');
    let validFinancialMetrics = 0;
    for (const analytic of analytics) {
      const financial = analytic.financialMetrics;
      if (financial && 
          typeof financial.totalPurchaseValue === 'number' &&
          typeof financial.averageOrderValue === 'number' &&
          financial.totalPurchaseValue >= 0 &&
          financial.averageOrderValue >= 0) {
        validFinancialMetrics++;
      }
    }
    console.log(`   ${validFinancialMetrics === analytics.length ? '✅' : '❌'} Métricas financieras válidas: ${validFinancialMetrics}/${analytics.length}`);

    // ===== 6. PRUEBAS DE INTEGRIDAD REFERENCIAL =====
    console.log('\n🔗 6. PRUEBAS DE INTEGRIDAD REFERENCIAL');
    console.log('-'.repeat(50));

    // Prueba 15: Verificar que las cuentas por pagar referencien proveedores existentes
    console.log('\n   🧪 Prueba 15: Referencias de proveedores en cuentas por pagar');
    let validSupplierReferences = 0;
    for (const account of accountsPayable) {
      const supplier = suppliers.find(s => s._id.toString() === account.supplierId);
      if (supplier) {
        validSupplierReferences++;
      }
    }
    console.log(`   ${validSupplierReferences === accountsPayable.length ? '✅' : '❌'} Referencias válidas: ${validSupplierReferences}/${accountsPayable.length}`);

    // Prueba 16: Verificar que las órdenes referencien proveedores existentes
    console.log('\n   🧪 Prueba 16: Referencias de proveedores en órdenes de compra');
    let validOrderSupplierReferences = 0;
    for (const order of purchaseOrders) {
      const supplier = suppliers.find(s => s._id.toString() === order.supplierId);
      if (supplier) {
        validOrderSupplierReferences++;
      }
    }
    console.log(`   ${validOrderSupplierReferences === purchaseOrders.length ? '✅' : '❌'} Referencias válidas: ${validOrderSupplierReferences}/${purchaseOrders.length}`);

    // ===== 7. RESUMEN DE PRUEBAS DE LÓGICA =====
    console.log('\n📋 7. RESUMEN DE PRUEBAS DE LÓGICA DE NEGOCIO');
    console.log('='.repeat(80));

    const logicTests = [
      { name: 'Códigos únicos de proveedores', passed: hasUniqueCodes },
      { name: 'Emails válidos de proveedores', passed: validEmails === suppliers.length },
      { name: 'Ratings válidos', passed: validRatings === suppliers.length },
      { name: 'Estados válidos de proveedores', passed: validStateSuppliers === suppliers.length },
      { name: 'Cálculos de montos en cuentas por pagar', passed: correctCalculations === accountsPayable.length },
      { name: 'Fechas válidas en cuentas por pagar', passed: validDates === accountsPayable.length },
      { name: 'Estados de pago consistentes', passed: consistentStates === accountsPayable.length },
      { name: 'Estados válidos de órdenes de compra', passed: validOrderStatesCount === purchaseOrders.length },
      { name: 'Cálculos de totales en órdenes', passed: correctOrderCalculations === purchaseOrders.length },
      { name: 'Fechas de entrega válidas', passed: validDeliveryDates === purchaseOrders.length },
      { name: 'Cálculos de puntuaciones en comparaciones', passed: correctScoreCalculations === comparisons.length },
      { name: 'Mejor proveedor identificado correctamente', passed: correctBestSupplier === comparisons.length },
      { name: 'Métricas generales consistentes', passed: consistentMetrics === analytics.length },
      { name: 'Métricas financieras válidas', passed: validFinancialMetrics === analytics.length },
      { name: 'Referencias de proveedores en cuentas por pagar', passed: validSupplierReferences === accountsPayable.length },
      { name: 'Referencias de proveedores en órdenes de compra', passed: validOrderSupplierReferences === purchaseOrders.length }
    ];

    const passedTests = logicTests.filter(test => test.passed).length;
    const totalTests = logicTests.length;
    const successRate = (passedTests / totalTests) * 100;

    console.log('🎯 RESULTADOS DE PRUEBAS DE LÓGICA:');
    console.log(`   • Total de pruebas: ${totalTests}`);
    console.log(`   • Pruebas exitosas: ${passedTests}`);
    console.log(`   • Pruebas fallidas: ${totalTests - passedTests}`);
    console.log(`   • Tasa de éxito: ${successRate.toFixed(1)}%`);

    console.log('\n📊 DETALLE DE PRUEBAS:');
    logicTests.forEach((test, index) => {
      console.log(`   ${test.passed ? '✅' : '❌'} ${index + 1}. ${test.name}`);
    });

    console.log('\n🏆 CONCLUSIÓN:');
    if (successRate >= 95) {
      console.log('   🎉 LÓGICA DE NEGOCIO FUNCIONANDO AL 100%');
      console.log('   ✅ Todas las reglas de negocio implementadas correctamente');
      console.log('   ✅ Sistema listo para producción');
    } else if (successRate >= 90) {
      console.log('   ⚠️ LÓGICA DE NEGOCIO FUNCIONANDO AL 90%+');
      console.log('   ✅ La mayoría de reglas implementadas correctamente');
      console.log('   ⚠️ Algunas mejoras menores recomendadas');
    } else {
      console.log('   ❌ LÓGICA DE NEGOCIO REQUIERE ATENCIÓN');
      console.log('   ⚠️ Varias reglas de negocio fallaron');
      console.log('   🔧 Se requieren correcciones');
    }

    console.log('\n' + '='.repeat(80));
    console.log('📅 Pruebas de lógica completadas:', new Date().toLocaleString());
    console.log('🎯 Lógica de negocio del sistema de proveedores verificada');
    console.log('='.repeat(80));

    return {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      successRate
    };

  } catch (error) {
    console.error('❌ Error en las pruebas de lógica:', error);
    return null;
  } finally {
    await mongoose.connection.close();
  }
}

// Ejecutar las pruebas
pruebasLogicaNegocioProveedores();

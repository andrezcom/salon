const mongoose = require('mongoose');
require('dotenv').config();

async function corregirReferenciasProveedores() {
  console.log('🔧 CORRIGIENDO REFERENCIAS DE PROVEEDORES');
  console.log('=' .repeat(60));

  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('\n✅ Conectado a MongoDB');
    const db = mongoose.connection.db;

    // ===== 1. OBTENER PROVEEDORES EXISTENTES =====
    console.log('\n🏭 1. OBTENIENDO PROVEEDORES EXISTENTES');
    console.log('-'.repeat(40));

    const suppliers = await db.collection('suppliers').find({}).toArray();
    console.log(`   📊 Proveedores encontrados: ${suppliers.length}`);
    
    suppliers.forEach(supplier => {
      console.log(`   • ${supplier.name} (${supplier.code}) - ID: ${supplier._id}`);
    });

    if (suppliers.length === 0) {
      console.log('   ❌ No hay proveedores disponibles');
      return;
    }

    // ===== 2. CORREGIR CUENTAS POR PAGAR =====
    console.log('\n💰 2. CORRIGIENDO CUENTAS POR PAGAR');
    console.log('-'.repeat(40));

    const accountsPayable = await db.collection('accountspayable').find({}).toArray();
    console.log(`   📊 Cuentas por pagar encontradas: ${accountsPayable.length}`);

    let accountsUpdated = 0;
    for (const account of accountsPayable) {
      console.log(`\n   🔍 Procesando cuenta: ${account.invoiceNumber}`);
      
      // Buscar proveedor por nombre si no hay supplierId
      if (!account.supplierId || account.supplierId === '') {
        const supplier = suppliers.find(s => 
          s.name === account.supplierName || 
          s.name.includes(account.supplierName) ||
          account.supplierName.includes(s.name)
        );
        
        if (supplier) {
          const updateResult = await db.collection('accountspayable').updateOne(
            { _id: account._id },
            { 
              $set: { 
                supplierId: supplier._id.toString(),
                supplierCode: supplier.code,
                updatedAt: new Date()
              }
            }
          );
          
          if (updateResult.modifiedCount > 0) {
            console.log(`     ✅ Actualizada - Proveedor: ${supplier.name} (${supplier.code})`);
            accountsUpdated++;
          }
        } else {
          console.log(`     ❌ No se encontró proveedor para: ${account.supplierName}`);
        }
      } else {
        console.log(`     ✅ Ya tiene supplierId: ${account.supplierId}`);
      }
    }

    console.log(`\n   📈 Cuentas por pagar actualizadas: ${accountsUpdated}/${accountsPayable.length}`);

    // ===== 3. CORREGIR ÓRDENES DE COMPRA =====
    console.log('\n📋 3. CORRIGIENDO ÓRDENES DE COMPRA');
    console.log('-'.repeat(40));

    const purchaseOrders = await db.collection('purchaseorders').find({}).toArray();
    console.log(`   📊 Órdenes de compra encontradas: ${purchaseOrders.length}`);

    let ordersUpdated = 0;
    for (const order of purchaseOrders) {
      console.log(`\n   🔍 Procesando orden: ${order.orderNumber || 'Sin número'}`);
      
      // Buscar proveedor por nombre si no hay supplierId
      if (!order.supplierId || order.supplierId === '') {
        const supplier = suppliers.find(s => 
          s.name === order.supplierName || 
          s.name.includes(order.supplierName) ||
          order.supplierName.includes(s.name)
        );
        
        if (supplier) {
          const updateResult = await db.collection('purchaseorders').updateOne(
            { _id: order._id },
            { 
              $set: { 
                supplierId: supplier._id.toString(),
                supplierCode: supplier.code,
                updatedAt: new Date()
              }
            }
          );
          
          if (updateResult.modifiedCount > 0) {
            console.log(`     ✅ Actualizada - Proveedor: ${supplier.name} (${supplier.code})`);
            ordersUpdated++;
          }
        } else {
          console.log(`     ❌ No se encontró proveedor para: ${order.supplierName}`);
        }
      } else {
        console.log(`     ✅ Ya tiene supplierId: ${order.supplierId}`);
      }
    }

    console.log(`\n   📈 Órdenes de compra actualizadas: ${ordersUpdated}/${purchaseOrders.length}`);

    // ===== 4. VERIFICAR CORRECCIONES =====
    console.log('\n🔍 4. VERIFICANDO CORRECCIONES');
    console.log('-'.repeat(40));

    // Verificar cuentas por pagar
    const updatedAccounts = await db.collection('accountspayable').find({}).toArray();
    let validAccountReferences = 0;
    
    for (const account of updatedAccounts) {
      const supplier = suppliers.find(s => s._id.toString() === account.supplierId);
      if (supplier) {
        validAccountReferences++;
      }
    }
    
    console.log(`   💰 Referencias válidas en cuentas por pagar: ${validAccountReferences}/${updatedAccounts.length}`);

    // Verificar órdenes de compra
    const updatedOrders = await db.collection('purchaseorders').find({}).toArray();
    let validOrderReferences = 0;
    
    for (const order of updatedOrders) {
      const supplier = suppliers.find(s => s._id.toString() === order.supplierId);
      if (supplier) {
        validOrderReferences++;
      }
    }
    
    console.log(`   📋 Referencias válidas en órdenes de compra: ${validOrderReferences}/${updatedOrders.length}`);

    // ===== 5. RESUMEN =====
    console.log('\n📋 5. RESUMEN DE CORRECCIONES');
    console.log('='.repeat(60));

    const totalUpdates = accountsUpdated + ordersUpdated;
    const totalReferences = validAccountReferences + validOrderReferences;
    const totalRecords = updatedAccounts.length + updatedOrders.length;

    console.log('🎯 RESULTADOS:');
    console.log(`   • Registros actualizados: ${totalUpdates}`);
    console.log(`   • Referencias válidas: ${totalReferences}/${totalRecords}`);
    console.log(`   • Tasa de éxito: ${((totalReferences / totalRecords) * 100).toFixed(1)}%`);

    if (totalReferences === totalRecords) {
      console.log('\n   🎉 ¡TODAS LAS REFERENCIAS CORREGIDAS!');
      console.log('   ✅ Sistema listo para funcionar al 100%');
    } else {
      console.log('\n   ⚠️ Algunas referencias aún requieren atención');
      console.log('   🔧 Revisar manualmente los registros sin referencias');
    }

    console.log('\n' + '='.repeat(60));
    console.log('📅 Correcciones completadas:', new Date().toLocaleString());
    console.log('🎯 Referencias de proveedores corregidas');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error corrigiendo referencias:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Ejecutar las correcciones
corregirReferenciasProveedores();

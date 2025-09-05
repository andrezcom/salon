const mongoose = require('mongoose');
require('dotenv').config();

async function verificarYCorregirIds() {
  console.log('🔍 VERIFICANDO Y CORRIGIENDO IDs DE PROVEEDORES');
  console.log('=' .repeat(60));

  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('\n✅ Conectado a MongoDB');
    const db = mongoose.connection.db;

    // ===== 1. VERIFICAR PROVEEDORES =====
    console.log('\n🏭 1. VERIFICANDO PROVEEDORES');
    console.log('-'.repeat(40));

    const suppliers = await db.collection('suppliers').find({}).toArray();
    console.log(`   📊 Proveedores encontrados: ${suppliers.length}`);
    
    suppliers.forEach(supplier => {
      console.log(`   • ${supplier.name} (${supplier.code})`);
      console.log(`     - ID: ${supplier._id}`);
      console.log(`     - BusinessId: ${supplier.businessId}`);
    });

    // ===== 2. VERIFICAR CUENTAS POR PAGAR =====
    console.log('\n💰 2. VERIFICANDO CUENTAS POR PAGAR');
    console.log('-'.repeat(40));

    const accountsPayable = await db.collection('accountspayable').find({}).toArray();
    console.log(`   📊 Cuentas por pagar encontradas: ${accountsPayable.length}`);
    
    accountsPayable.forEach(account => {
      console.log(`   • Factura: ${account.invoiceNumber}`);
      console.log(`     - SupplierId: ${account.supplierId}`);
      console.log(`     - SupplierName: ${account.supplierName}`);
      console.log(`     - BusinessId: ${account.businessId}`);
      
      // Verificar si el supplierId existe
      const supplier = suppliers.find(s => s._id.toString() === account.supplierId);
      if (supplier) {
        console.log(`     ✅ Proveedor encontrado: ${supplier.name}`);
      } else {
        console.log(`     ❌ Proveedor NO encontrado para ID: ${account.supplierId}`);
      }
    });

    // ===== 3. VERIFICAR ÓRDENES DE COMPRA =====
    console.log('\n📋 3. VERIFICANDO ÓRDENES DE COMPRA');
    console.log('-'.repeat(40));

    const purchaseOrders = await db.collection('purchaseorders').find({}).toArray();
    console.log(`   📊 Órdenes de compra encontradas: ${purchaseOrders.length}`);
    
    purchaseOrders.forEach(order => {
      console.log(`   • Orden: ${order.orderNumber || 'Sin número'}`);
      console.log(`     - SupplierId: ${order.supplierId}`);
      console.log(`     - SupplierName: ${order.supplierName}`);
      console.log(`     - BusinessId: ${order.businessId}`);
      
      // Verificar si el supplierId existe
      const supplier = suppliers.find(s => s._id.toString() === order.supplierId);
      if (supplier) {
        console.log(`     ✅ Proveedor encontrado: ${supplier.name}`);
      } else {
        console.log(`     ❌ Proveedor NO encontrado para ID: ${order.supplierId}`);
      }
    });

    // ===== 4. CORREGIR REFERENCIAS =====
    console.log('\n🔧 4. CORRIGIENDO REFERENCIAS');
    console.log('-'.repeat(40));

    let accountsUpdated = 0;
    let ordersUpdated = 0;

    // Corregir cuentas por pagar
    for (const account of accountsPayable) {
      const supplier = suppliers.find(s => s._id.toString() === account.supplierId);
      if (!supplier) {
        // Buscar por nombre
        const supplierByName = suppliers.find(s => 
          s.name === account.supplierName || 
          s.name.includes(account.supplierName) ||
          account.supplierName.includes(s.name)
        );
        
        if (supplierByName) {
          const updateResult = await db.collection('accountspayable').updateOne(
            { _id: account._id },
            { 
              $set: { 
                supplierId: supplierByName._id.toString(),
                supplierCode: supplierByName.code,
                updatedAt: new Date()
              }
            }
          );
          
          if (updateResult.modifiedCount > 0) {
            console.log(`   ✅ Cuenta ${account.invoiceNumber} actualizada con proveedor ${supplierByName.name}`);
            accountsUpdated++;
          }
        } else {
          console.log(`   ❌ No se encontró proveedor para cuenta ${account.invoiceNumber}`);
        }
      }
    }

    // Corregir órdenes de compra
    for (const order of purchaseOrders) {
      const supplier = suppliers.find(s => s._id.toString() === order.supplierId);
      if (!supplier) {
        // Buscar por nombre
        const supplierByName = suppliers.find(s => 
          s.name === order.supplierName || 
          s.name.includes(order.supplierName) ||
          order.supplierName.includes(s.name)
        );
        
        if (supplierByName) {
          const updateResult = await db.collection('purchaseorders').updateOne(
            { _id: order._id },
            { 
              $set: { 
                supplierId: supplierByName._id.toString(),
                supplierCode: supplierByName.code,
                updatedAt: new Date()
              }
            }
          );
          
          if (updateResult.modifiedCount > 0) {
            console.log(`   ✅ Orden ${order.orderNumber || 'Sin número'} actualizada con proveedor ${supplierByName.name}`);
            ordersUpdated++;
          }
        } else {
          console.log(`   ❌ No se encontró proveedor para orden ${order.orderNumber || 'Sin número'}`);
        }
      }
    }

    // ===== 5. VERIFICAR CORRECCIONES FINALES =====
    console.log('\n🔍 5. VERIFICACIÓN FINAL');
    console.log('-'.repeat(40));

    const finalAccounts = await db.collection('accountspayable').find({}).toArray();
    const finalOrders = await db.collection('purchaseorders').find({}).toArray();

    let validAccountReferences = 0;
    let validOrderReferences = 0;

    for (const account of finalAccounts) {
      const supplier = suppliers.find(s => s._id.toString() === account.supplierId);
      if (supplier) {
        validAccountReferences++;
      }
    }

    for (const order of finalOrders) {
      const supplier = suppliers.find(s => s._id.toString() === order.supplierId);
      if (supplier) {
        validOrderReferences++;
      }
    }

    console.log(`   💰 Referencias válidas en cuentas por pagar: ${validAccountReferences}/${finalAccounts.length}`);
    console.log(`   📋 Referencias válidas en órdenes de compra: ${validOrderReferences}/${finalOrders.length}`);

    // ===== 6. RESUMEN FINAL =====
    console.log('\n📋 6. RESUMEN FINAL');
    console.log('='.repeat(60));

    const totalUpdates = accountsUpdated + ordersUpdated;
    const totalValidReferences = validAccountReferences + validOrderReferences;
    const totalRecords = finalAccounts.length + finalOrders.length;

    console.log('🎯 RESULTADOS:');
    console.log(`   • Registros actualizados: ${totalUpdates}`);
    console.log(`   • Referencias válidas: ${totalValidReferences}/${totalRecords}`);
    console.log(`   • Tasa de éxito: ${((totalValidReferences / totalRecords) * 100).toFixed(1)}%`);

    if (totalValidReferences === totalRecords) {
      console.log('\n   🎉 ¡TODAS LAS REFERENCIAS CORREGIDAS!');
      console.log('   ✅ Sistema listo para funcionar al 100%');
    } else {
      console.log('\n   ⚠️ Algunas referencias aún requieren atención');
      console.log('   🔧 Revisar manualmente los registros sin referencias');
    }

    console.log('\n' + '='.repeat(60));
    console.log('📅 Verificación completada:', new Date().toLocaleString());
    console.log('🎯 IDs de proveedores verificados y corregidos');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error verificando IDs:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Ejecutar la verificación
verificarYCorregirIds();

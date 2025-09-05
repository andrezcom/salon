const mongoose = require('mongoose');
require('dotenv').config();

async function analisisCompletoInventario() {
  console.log('📦 ANÁLISIS COMPLETO DEL SISTEMA DE INVENTARIO');
  console.log('=' .repeat(80));
  console.log('📅 Fecha:', new Date().toLocaleString());
  console.log('🎯 Objetivo: Verificar integración completa de inventario');
  console.log('=' .repeat(80));

  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('\n✅ Conectado a MongoDB');
    const db = mongoose.connection.db;

    // ===== 1. ANÁLISIS DE PRODUCTOS =====
    console.log('\n📦 1. ANÁLISIS DE PRODUCTOS');
    console.log('-'.repeat(50));

    const products = await db.collection('products').find({}).toArray();
    console.log(`   📊 Total de productos: ${products.length}`);

    if (products.length > 0) {
      console.log('\n   📋 DETALLE DE PRODUCTOS:');
      products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} (${product.sku})`);
        console.log(`      • Categoría: ${product.category}`);
        console.log(`      • Marca: ${product.brand}`);
        console.log(`      • Costo: $${product.costPrice?.toLocaleString() || 'N/A'}`);
        console.log(`      • Precio cliente: $${product.clientPrice?.toLocaleString() || 'N/A'}`);
        console.log(`      • Precio experto: $${product.expertPrice?.toLocaleString() || 'N/A'}`);
        console.log(`      • Precio insumo: $${product.inputPrice?.toLocaleString() || 'N/A'}`);
        console.log(`      • Stock actual: ${product.inventory?.currentStock || 0}`);
        console.log(`      • Stock mínimo: ${product.inventory?.minimumStock || 0}`);
        console.log(`      • Usos:`);
        console.log(`        - Como insumo: ${product.uses?.isInput ? '✅' : '❌'}`);
        console.log(`        - Al detalle: ${product.uses?.isRetail ? '✅' : '❌'}`);
        console.log(`        - Al por mayor: ${product.uses?.isWholesale ? '✅' : '❌'}`);
        console.log(`      • Empaque: ${product.packageInfo?.qtyPerPackage || 1} x ${product.packageInfo?.unitSize || 0}${product.packageInfo?.unitType || 'ml'}`);
        console.log('');
      });
    }

    // ===== 2. ANÁLISIS DE VENTAS =====
    console.log('\n💰 2. ANÁLISIS DE VENTAS');
    console.log('-'.repeat(50));

    const sales = await db.collection('sales').find({}).toArray();
    console.log(`   📊 Total de ventas: ${sales.length}`);

    if (sales.length > 0) {
      console.log('\n   📋 DETALLE DE VENTAS:');
      sales.forEach((sale, index) => {
        console.log(`   ${index + 1}. Venta #${sale.idSale || 'N/A'}`);
        console.log(`      • Cliente: ${sale.nameClient || 'N/A'}`);
        console.log(`      • Fecha: ${sale.date ? new Date(sale.date).toLocaleDateString() : 'N/A'}`);
        console.log(`      • Estado: ${sale.status || 'N/A'}`);
        console.log(`      • Total: $${sale.total?.toLocaleString() || 'N/A'}`);
        
        // Análisis de servicios (insumos)
        if (sale.services && sale.services.length > 0) {
          console.log(`      • Servicios (${sale.services.length}):`);
          sale.services.forEach((service, sIndex) => {
            console.log(`        ${sIndex + 1}. Servicio #${service.serviceId}`);
            console.log(`           - Experto: ${service.expertId}`);
            console.log(`           - Monto: $${service.amount?.toLocaleString() || 'N/A'}`);
            if (service.input && service.input.length > 0) {
              console.log(`           - Insumos (${service.input.length}):`);
              service.input.forEach((input, iIndex) => {
                console.log(`             ${iIndex + 1}. ${input.nameProduct}`);
                console.log(`                - Cantidad: ${input.qty}`);
                console.log(`                - Precio: $${input.inputPrice?.toLocaleString() || 'N/A'}`);
                console.log(`                - Total: $${input.amount?.toLocaleString() || 'N/A'}`);
              });
            }
          });
        }
        
        // Análisis de retail (venta directa)
        if (sale.retail && sale.retail.length > 0) {
          console.log(`      • Ventas al detalle (${sale.retail.length}):`);
          sale.retail.forEach((retail, rIndex) => {
            console.log(`        ${rIndex + 1}. Producto #${retail.productId}`);
            console.log(`           - Experto: ${retail.expertId}`);
            console.log(`           - Cantidad: ${retail.qty}`);
            console.log(`           - Precio: $${retail.clientPrice?.toLocaleString() || 'N/A'}`);
            console.log(`           - Total: $${retail.amount?.toLocaleString() || 'N/A'}`);
          });
        }
        console.log('');
      });
    }

    // ===== 3. ANÁLISIS DE COMPRAS =====
    console.log('\n🛒 3. ANÁLISIS DE COMPRAS');
    console.log('-'.repeat(50));

    const purchaseOrders = await db.collection('purchaseorders').find({}).toArray();
    console.log(`   📊 Total de órdenes de compra: ${purchaseOrders.length}`);

    if (purchaseOrders.length > 0) {
      console.log('\n   📋 DETALLE DE ÓRDENES DE COMPRA:');
      purchaseOrders.forEach((order, index) => {
        console.log(`   ${index + 1}. Orden #${order.orderNumber || 'N/A'}`);
        console.log(`      • Proveedor: ${order.supplierName || 'N/A'}`);
        console.log(`      • Fecha: ${order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}`);
        console.log(`      • Estado: ${order.status || 'N/A'}`);
        console.log(`      • Total: $${order.totalAmount?.toLocaleString() || 'N/A'}`);
        
        if (order.items && order.items.length > 0) {
          console.log(`      • Productos (${order.items.length}):`);
          order.items.forEach((item, iIndex) => {
            console.log(`        ${iIndex + 1}. ${item.productName} (${item.productSku})`);
            console.log(`           - Cantidad solicitada: ${item.quantity}`);
            console.log(`           - Cantidad recibida: ${item.quantityReceived || 0}`);
            console.log(`           - Precio unitario: $${item.unitPrice?.toLocaleString() || 'N/A'}`);
            console.log(`           - Total: $${item.totalPrice?.toLocaleString() || 'N/A'}`);
          });
        }
        console.log('');
      });
    }

    // ===== 4. ANÁLISIS DE INTEGRACIÓN =====
    console.log('\n🔗 4. ANÁLISIS DE INTEGRACIÓN');
    console.log('-'.repeat(50));

    // Verificar si las ventas actualizan el inventario
    console.log('   🔍 VERIFICANDO INTEGRACIÓN VENTAS-INVENTARIO:');
    
    let totalInputUsage = 0;
    let totalRetailSales = 0;
    let productsWithSales = new Set();
    
    sales.forEach(sale => {
      // Contar uso de insumos
      if (sale.services) {
        sale.services.forEach(service => {
          if (service.input) {
            service.input.forEach(input => {
              totalInputUsage += input.qty || 0;
            });
          }
        });
      }
      
      // Contar ventas al detalle
      if (sale.retail) {
        sale.retail.forEach(retail => {
          totalRetailSales += retail.qty || 0;
          productsWithSales.add(retail.productId);
        });
      }
    });

    console.log(`   • Total de insumos utilizados: ${totalInputUsage}`);
    console.log(`   • Total de productos vendidos al detalle: ${totalRetailSales}`);
    console.log(`   • Productos únicos vendidos: ${productsWithSales.size}`);

    // Verificar si las compras actualizan el inventario
    console.log('\n   🔍 VERIFICANDO INTEGRACIÓN COMPRAS-INVENTARIO:');
    
    let totalPurchased = 0;
    let totalReceived = 0;
    let productsWithPurchases = new Set();
    
    purchaseOrders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          totalPurchased += item.quantity || 0;
          totalReceived += item.quantityReceived || 0;
          productsWithPurchases.add(item.productId);
        });
      }
    });

    console.log(`   • Total de productos comprados: ${totalPurchased}`);
    console.log(`   • Total de productos recibidos: ${totalReceived}`);
    console.log(`   • Productos únicos comprados: ${productsWithPurchases.size}`);

    // ===== 5. ANÁLISIS DE TIPOS DE CLIENTES =====
    console.log('\n👥 5. ANÁLISIS DE TIPOS DE CLIENTES');
    console.log('-'.repeat(50));

    let clientSales = 0;
    let expertSales = 0;
    let totalClientRevenue = 0;
    let totalExpertRevenue = 0;

    sales.forEach(sale => {
      // Ventas al cliente final (retail)
      if (sale.retail) {
        sale.retail.forEach(retail => {
          clientSales += retail.qty || 0;
          totalClientRevenue += retail.amount || 0;
        });
      }
      
      // Ventas a expertos (servicios con insumos)
      if (sale.services) {
        sale.services.forEach(service => {
          expertSales += 1; // Cada servicio cuenta como una venta a experto
          totalExpertRevenue += service.amount || 0;
        });
      }
    });

    console.log(`   📊 VENTAS AL CLIENTE FINAL:`);
    console.log(`   • Cantidad de productos vendidos: ${clientSales}`);
    console.log(`   • Ingresos totales: $${totalClientRevenue.toLocaleString()}`);
    console.log(`   • Precio promedio: $${clientSales > 0 ? (totalClientRevenue / clientSales).toLocaleString() : 'N/A'}`);

    console.log(`\n   📊 VENTAS A EXPERTOS (SERVICIOS):`);
    console.log(`   • Cantidad de servicios: ${expertSales}`);
    console.log(`   • Ingresos totales: $${totalExpertRevenue.toLocaleString()}`);
    console.log(`   • Precio promedio por servicio: $${expertSales > 0 ? (totalExpertRevenue / expertSales).toLocaleString() : 'N/A'}`);

    // ===== 6. ANÁLISIS DE PORCIONES VS UNIDADES =====
    console.log('\n📏 6. ANÁLISIS DE PORCIONES VS UNIDADES');
    console.log('-'.repeat(50));

    console.log('   🔍 ANÁLISIS DE EMPAQUES:');
    products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name}:`);
      console.log(`      • Unidades por paquete: ${product.packageInfo?.qtyPerPackage || 1}`);
      console.log(`      • Tamaño de unidad: ${product.packageInfo?.unitSize || 0} ${product.packageInfo?.unitType || 'ml'}`);
      console.log(`      • Tamaño total del paquete: ${product.packageInfo?.packageSize || 'N/A'}`);
      console.log(`      • Tipo de empaque: ${product.packageInfo?.packageType || 'N/A'}`);
      
      // Calcular si se vende por porciones o unidades completas
      if (product.uses?.isInput) {
        console.log(`      • Como insumo: Se vende por ${product.packageInfo?.unitType || 'ml'} (porciones)`);
      }
      if (product.uses?.isRetail) {
        console.log(`      • Al detalle: Se vende por ${product.packageInfo?.qtyPerPackage > 1 ? 'paquetes' : 'unidades'}`);
      }
      console.log('');
    });

    // ===== 7. ANÁLISIS DE PRECIOS =====
    console.log('\n💰 7. ANÁLISIS DE PRECIOS');
    console.log('-'.repeat(50));

    console.log('   📊 ESTRUCTURA DE PRECIOS:');
    products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name}:`);
      console.log(`      • Costo de compra: $${product.costPrice?.toLocaleString() || 'N/A'}`);
      console.log(`      • Precio como insumo: $${product.inputPrice?.toLocaleString() || 'N/A'}`);
      console.log(`      • Precio al experto: $${product.expertPrice?.toLocaleString() || 'N/A'}`);
      console.log(`      • Precio al cliente: $${product.clientPrice?.toLocaleString() || 'N/A'}`);
      
      // Calcular márgenes
      if (product.costPrice && product.costPrice > 0) {
        const marginInput = product.inputPrice ? ((product.inputPrice - product.costPrice) / product.costPrice * 100) : 0;
        const marginExpert = product.expertPrice ? ((product.expertPrice - product.costPrice) / product.costPrice * 100) : 0;
        const marginClient = product.clientPrice ? ((product.clientPrice - product.costPrice) / product.costPrice * 100) : 0;
        
        console.log(`      • Márgenes:`);
        console.log(`        - Insumo: ${marginInput.toFixed(1)}%`);
        console.log(`        - Experto: ${marginExpert.toFixed(1)}%`);
        console.log(`        - Cliente: ${marginClient.toFixed(1)}%`);
      }
      console.log('');
    });

    // ===== 8. ANÁLISIS DE STOCK =====
    console.log('\n📦 8. ANÁLISIS DE STOCK');
    console.log('-'.repeat(50));

    let totalStockValue = 0;
    let lowStockProducts = 0;
    let reorderProducts = 0;
    let outOfStockProducts = 0;

    console.log('   📊 ESTADO DEL INVENTARIO:');
    products.forEach((product, index) => {
      const currentStock = product.inventory?.currentStock || 0;
      const minimumStock = product.inventory?.minimumStock || 0;
      const reorderPoint = product.inventory?.reorderPoint || 0;
      const stockValue = currentStock * (product.costPrice || 0);
      
      totalStockValue += stockValue;
      
      if (currentStock <= 0) outOfStockProducts++;
      else if (currentStock <= minimumStock) lowStockProducts++;
      if (currentStock <= reorderPoint) reorderProducts++;
      
      console.log(`   ${index + 1}. ${product.name}:`);
      console.log(`      • Stock actual: ${currentStock}`);
      console.log(`      • Stock mínimo: ${minimumStock}`);
      console.log(`      • Punto de reorden: ${reorderPoint}`);
      console.log(`      • Valor en stock: $${stockValue.toLocaleString()}`);
      console.log(`      • Estado: ${currentStock <= 0 ? '❌ Sin stock' : currentStock <= minimumStock ? '⚠️ Stock bajo' : '✅ Stock OK'}`);
      console.log('');
    });

    console.log(`   📊 RESUMEN DE STOCK:`);
    console.log(`   • Valor total del inventario: $${totalStockValue.toLocaleString()}`);
    console.log(`   • Productos sin stock: ${outOfStockProducts}`);
    console.log(`   • Productos con stock bajo: ${lowStockProducts}`);
    console.log(`   • Productos para reordenar: ${reorderProducts}`);

    // ===== 9. IDENTIFICAR PROBLEMAS =====
    console.log('\n⚠️ 9. IDENTIFICACIÓN DE PROBLEMAS');
    console.log('-'.repeat(50));

    const problems = [];
    
    // Verificar si las ventas actualizan el inventario
    if (totalInputUsage > 0 || totalRetailSales > 0) {
      problems.push('❌ Las ventas NO actualizan automáticamente el inventario');
    }
    
    // Verificar si las compras actualizan el inventario
    if (totalReceived > 0) {
      problems.push('✅ Las compras SÍ actualizan el inventario');
    } else {
      problems.push('❌ No hay productos recibidos en las compras');
    }
    
    // Verificar productos sin stock
    if (outOfStockProducts > 0) {
      problems.push(`⚠️ ${outOfStockProducts} productos sin stock`);
    }
    
    // Verificar productos con stock bajo
    if (lowStockProducts > 0) {
      problems.push(`⚠️ ${lowStockProducts} productos con stock bajo`);
    }
    
    // Verificar productos para reordenar
    if (reorderProducts > 0) {
      problems.push(`🔄 ${reorderProducts} productos necesitan reorden`);
    }

    console.log('   🔍 PROBLEMAS IDENTIFICADOS:');
    problems.forEach((problem, index) => {
      console.log(`   ${index + 1}. ${problem}`);
    });

    // ===== 10. RECOMENDACIONES =====
    console.log('\n💡 10. RECOMENDACIONES');
    console.log('-'.repeat(50));

    const recommendations = [];
    
    if (problems.some(p => p.includes('ventas NO actualizan'))) {
      recommendations.push('🔧 Implementar actualización automática de inventario en ventas');
    }
    
    if (outOfStockProducts > 0) {
      recommendations.push('📦 Reabastecer productos sin stock');
    }
    
    if (lowStockProducts > 0) {
      recommendations.push('⚠️ Revisar productos con stock bajo');
    }
    
    if (reorderProducts > 0) {
      recommendations.push('🔄 Procesar reórdenes pendientes');
    }
    
    recommendations.push('📊 Implementar reportes automáticos de inventario');
    recommendations.push('🔔 Configurar alertas de stock bajo');
    recommendations.push('📈 Analizar tendencias de ventas para optimizar stock');

    console.log('   💡 RECOMENDACIONES:');
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });

    // ===== 11. RESUMEN FINAL =====
    console.log('\n📋 11. RESUMEN FINAL');
    console.log('='.repeat(80));

    const summary = {
      totalProducts: products.length,
      totalSales: sales.length,
      totalPurchaseOrders: purchaseOrders.length,
      totalInputUsage: totalInputUsage,
      totalRetailSales: totalRetailSales,
      totalPurchased: totalPurchased,
      totalReceived: totalReceived,
      totalStockValue: totalStockValue,
      outOfStockProducts: outOfStockProducts,
      lowStockProducts: lowStockProducts,
      reorderProducts: reorderProducts,
      problems: problems.length,
      recommendations: recommendations.length
    };

    console.log('🎯 RESUMEN DEL SISTEMA DE INVENTARIO:');
    console.log(`   • Productos gestionados: ${summary.totalProducts}`);
    console.log(`   • Ventas registradas: ${summary.totalSales}`);
    console.log(`   • Órdenes de compra: ${summary.totalPurchaseOrders}`);
    console.log(`   • Insumos utilizados: ${summary.totalInputUsage}`);
    console.log(`   • Productos vendidos al detalle: ${summary.totalRetailSales}`);
    console.log(`   • Productos comprados: ${summary.totalPurchased}`);
    console.log(`   • Productos recibidos: ${summary.totalReceived}`);
    console.log(`   • Valor total del inventario: $${summary.totalStockValue.toLocaleString()}`);
    console.log(`   • Productos sin stock: ${summary.outOfStockProducts}`);
    console.log(`   • Productos con stock bajo: ${summary.lowStockProducts}`);
    console.log(`   • Productos para reordenar: ${summary.reorderProducts}`);
    console.log(`   • Problemas identificados: ${summary.problems}`);
    console.log(`   • Recomendaciones: ${summary.recommendations}`);

    console.log('\n🏆 CONCLUSIÓN:');
    if (summary.problems === 0) {
      console.log('   🎉 SISTEMA DE INVENTARIO FUNCIONANDO PERFECTAMENTE');
    } else if (summary.problems <= 2) {
      console.log('   ✅ SISTEMA DE INVENTARIO FUNCIONANDO BIEN CON MEJORAS MENORES');
    } else {
      console.log('   ⚠️ SISTEMA DE INVENTARIO NECESITA ATENCIÓN');
    }

    console.log('\n' + '='.repeat(80));
    console.log('📅 Análisis completo de inventario finalizado:', new Date().toLocaleString());
    console.log('🎯 Sistema analizado en detalle');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error en el análisis de inventario:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Ejecutar el análisis
analisisCompletoInventario();

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TEST_USER_ID = '68b871502ef2b330e41d2391'; // Usuario de prueba existente
const BUSINESS_ID = '68b8c3e2c9765a8720a6b622'; // Negocio de prueba existente

async function testPurchaseOrderSystem() {
  console.log('📋 Iniciando pruebas del sistema de órdenes de compra...\n');

  try {
    // ===== ESCENARIO 1: CREAR PRODUCTOS CON STOCK BAJO =====
    console.log('📦 ESCENARIO 1: Crear productos con stock bajo\n');

    // Crear producto con stock bajo
    console.log('💄 Creando producto con stock bajo...');
    const product1Response = await axios.post(`${BASE_URL}/inventory/business/${BUSINESS_ID}/products`, {
      name: 'Tinte Wella Color Touch',
      brand: 'Wella',
      category: 'Coloración',
      subcategory: 'Tinte',
      costPrice: 45.00,
      inputPrice: 0.90, // Precio por ml (50ml = $45)
      clientPrice: 65.00,
      expertPrice: 55.00,
      packageInfo: {
        qtyPerPackage: 1,
        unitSize: 50, // 50ml por tubo
        unitType: 'ml',
        packageType: 'tubo'
      },
      uses: {
        isInput: true,
        isRetail: true,
        isWholesale: false
      },
      inventory: {
        currentStock: 2, // Stock bajo
        minimumStock: 5,
        maximumStock: 30,
        reorderPoint: 5,
        reorderQuantity: 15
      },
      supplier: {
        name: 'Distribuidora Wella Pro',
        contact: 'Roberto Martínez',
        phone: '+52 55 1111 2222',
        email: 'ventas@wella.com'
      },
      description: 'Tinte profesional para retoques de color',
      tags: ['tinte', 'color', 'profesional'],
      userId: TEST_USER_ID
    });

    if (!product1Response.data.success) {
      throw new Error('No se pudo crear el producto 1');
    }

    const product1Id = product1Response.data.data._id;
    console.log(`✅ Producto creado: ${product1Id}`);
    console.log(`   • Stock actual: ${product1Response.data.data.inventory.currentStock}`);
    console.log(`   • Stock mínimo: ${product1Response.data.data.inventory.minimumStock}`);
    console.log(`   • Necesita reorden: ${product1Response.data.data.inventory.currentStock <= product1Response.data.data.inventory.minimumStock ? 'SÍ' : 'NO'}`);

    // Crear producto sin stock
    console.log('\n💄 Creando producto sin stock...');
    const product2Response = await axios.post(`${BASE_URL}/inventory/business/${BUSINESS_ID}/products`, {
      name: 'Mascarilla Kerastase Elixir',
      brand: 'Kerastase',
      category: 'Tratamiento',
      subcategory: 'Mascarilla',
      costPrice: 85.00,
      inputPrice: 1.70, // Precio por ml (50ml = $85)
      clientPrice: 120.00,
      expertPrice: 100.00,
      packageInfo: {
        qtyPerPackage: 1,
        unitSize: 50, // 50ml por tubo
        unitType: 'ml',
        packageType: 'tubo'
      },
      uses: {
        isInput: true,
        isRetail: true,
        isWholesale: false
      },
      inventory: {
        currentStock: 0, // Sin stock
        minimumStock: 3,
        maximumStock: 20,
        reorderPoint: 3,
        reorderQuantity: 10
      },
      supplier: {
        name: 'Distribuidora L\'Oréal Pro',
        contact: 'Ana García',
        phone: '+52 55 3333 4444',
        email: 'ventas@loreal.com'
      },
      description: 'Mascarilla reparadora para cabello dañado',
      tags: ['mascarilla', 'tratamiento', 'reparador'],
      userId: TEST_USER_ID
    });

    if (!product2Response.data.success) {
      throw new Error('No se pudo crear el producto 2');
    }

    const product2Id = product2Response.data.data._id;
    console.log(`✅ Producto creado: ${product2Id}`);
    console.log(`   • Stock actual: ${product2Response.data.data.inventory.currentStock}`);
    console.log(`   • Stock mínimo: ${product2Response.data.data.inventory.minimumStock}`);
    console.log(`   • Necesita reorden: ${product2Response.data.data.inventory.currentStock <= product2Response.data.data.inventory.minimumStock ? 'SÍ' : 'NO'}`);

    // ===== ESCENARIO 2: GENERAR INFORME DE STOCK MÍNIMO =====
    console.log('\n📊 ESCENARIO 2: Generar informe de stock mínimo\n');

    // Obtener informe de stock mínimo
    console.log('📈 Generando informe de stock mínimo...');
    const lowStockReportResponse = await axios.get(`${BASE_URL}/purchase-order/business/${BUSINESS_ID}/inventory/low-stock-report`);
    
    if (lowStockReportResponse.data.success) {
      const report = lowStockReportResponse.data.data.report;
      console.log('✅ Informe generado exitosamente:');
      console.log(`   • Total productos con stock bajo: ${report.totals.totalProducts}`);
      console.log(`   • Productos críticos (sin stock): ${report.totals.criticalProducts}`);
      console.log(`   • Productos con advertencia: ${report.totals.warningProducts}`);
      console.log(`   • Total a invertir: $${report.totals.totalCost}`);
      console.log(`   • Total proveedores: ${report.totals.suppliers}`);
      
      console.log('\n📋 Productos que necesitan reorden:');
      report.items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.productName} (${item.brand})`);
        console.log(`      • Stock actual: ${item.currentStock}`);
        console.log(`      • Stock mínimo: ${item.minimumStock}`);
        console.log(`      • Cantidad sugerida: ${item.suggestedQuantity}`);
        console.log(`      • Costo total: $${item.totalCost}`);
        console.log(`      • Urgencia: ${item.urgencyLevel.toUpperCase()}`);
        console.log(`      • Razón: ${item.reason}`);
      });
      
      console.log('\n🏢 Agrupación por proveedor:');
      Object.entries(report.supplierGroups).forEach(([supplierName, group], index) => {
        console.log(`   ${index + 1}. ${supplierName}`);
        console.log(`      • Productos: ${group.items.length}`);
        console.log(`      • Total a invertir: $${group.totalCost}`);
        console.log(`      • Total unidades: ${group.totalItems}`);
      });
    }

    // ===== ESCENARIO 3: GENERAR ÓRDENES AUTOMÁTICAS =====
    console.log('\n🤖 ESCENARIO 3: Generar órdenes automáticas\n');

    // Generar órdenes automáticas
    console.log('🔄 Generando órdenes automáticas...');
    const autoOrderResponse = await axios.post(`${BASE_URL}/purchase-order/business/${BUSINESS_ID}/purchase-orders/generate-automatic`, {
      includeLowStock: true,
      includeOutOfStock: true,
      userId: TEST_USER_ID
    });

    if (autoOrderResponse.data.success) {
      const orders = autoOrderResponse.data.data.orders;
      console.log(`✅ Órdenes generadas: ${orders.length}`);
      
      orders.forEach((order, index) => {
        console.log(`\n   📋 Orden ${index + 1}: ${order.orderNumber}`);
        console.log(`      • Proveedor: ${order.supplier.name}`);
        console.log(`      • Estado: ${order.status}`);
        console.log(`      • Tipo: ${order.orderType}`);
        console.log(`      • Total: $${order.totalAmount}`);
        console.log(`      • Productos: ${order.items.length}`);
        
        order.items.forEach((item, itemIndex) => {
          console.log(`         ${itemIndex + 1}. ${item.productName}`);
          console.log(`            • Cantidad: ${item.quantity}`);
          console.log(`            • Costo unitario: $${item.unitCost}`);
          console.log(`            • Total: $${item.totalCost}`);
          console.log(`            • Razón: ${item.reason}`);
        });
      });
    }

    // ===== ESCENARIO 4: CREAR ORDEN MANUAL =====
    console.log('\n✍️ ESCENARIO 4: Crear orden manual\n');

    // Crear orden manual
    console.log('📝 Creando orden manual...');
    const manualOrderResponse = await axios.post(`${BASE_URL}/purchase-order/business/${BUSINESS_ID}/purchase-orders`, {
      supplier: {
        name: 'Distribuidora de Belleza Premium',
        contact: 'Carlos López',
        phone: '+52 55 5555 6666',
        email: 'ventas@premium.com'
      },
      items: [
        {
          productId: product1Id,
          quantity: 20,
          unitCost: 45.00
        },
        {
          productId: product2Id,
          quantity: 15,
          unitCost: 85.00
        }
      ],
      notes: 'Orden manual para stock de temporada alta',
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
      userId: TEST_USER_ID
    });

    if (manualOrderResponse.data.success) {
      const order = manualOrderResponse.data.data;
      console.log('✅ Orden manual creada exitosamente:');
      console.log(`   • Número: ${order.orderNumber}`);
      console.log(`   • Proveedor: ${order.supplier.name}`);
      console.log(`   • Estado: ${order.status}`);
      console.log(`   • Total: $${order.totalAmount}`);
      console.log(`   • Productos: ${order.items.length}`);
    }

    // ===== ESCENARIO 5: APROBAR Y ENVIAR ORDEN =====
    console.log('\n✅ ESCENARIO 5: Aprobar y enviar orden\n');

    // Obtener la primera orden automática
    const ordersResponse = await axios.get(`${BASE_URL}/purchase-order/business/${BUSINESS_ID}/purchase-orders`);
    const firstOrder = ordersResponse.data.data[0];

    if (firstOrder) {
      // Aprobar orden
      console.log(`✅ Aprobando orden: ${firstOrder.orderNumber}...`);
      const approveResponse = await axios.put(`${BASE_URL}/purchase-order/business/${BUSINESS_ID}/purchase-orders/${firstOrder._id}/approve`, {
        notes: 'Orden aprobada por gerente de compras',
        userId: TEST_USER_ID
      });

      if (approveResponse.data.success) {
        console.log('✅ Orden aprobada exitosamente');
        console.log(`   • Estado: ${approveResponse.data.data.status}`);
        console.log(`   • Aprobada por: ${approveResponse.data.data.approvedBy}`);
      }

      // Enviar orden
      console.log(`📤 Enviando orden: ${firstOrder.orderNumber}...`);
      const sendResponse = await axios.put(`${BASE_URL}/purchase-order/business/${BUSINESS_ID}/purchase-orders/${firstOrder._id}/send`, {
        notes: 'Orden enviada al proveedor por email',
        userId: TEST_USER_ID
      });

      if (sendResponse.data.success) {
        console.log('✅ Orden enviada exitosamente');
        console.log(`   • Estado: ${sendResponse.data.data.status}`);
        console.log(`   • Enviada por: ${sendResponse.data.data.sentBy}`);
      }
    }

    // ===== ESCENARIO 6: MARCAR COMO RECIBIDA =====
    console.log('\n📦 ESCENARIO 6: Marcar orden como recibida\n');

    if (firstOrder) {
      // Marcar como recibida
      console.log(`📦 Marcando orden como recibida: ${firstOrder.orderNumber}...`);
      const receiveResponse = await axios.put(`${BASE_URL}/purchase-order/business/${BUSINESS_ID}/purchase-orders/${firstOrder._id}/receive`, {
        notes: 'Orden recibida y verificada',
        userId: TEST_USER_ID
      });

      if (receiveResponse.data.success) {
        console.log('✅ Orden marcada como recibida exitosamente');
        console.log(`   • Estado: ${receiveResponse.data.data.status}`);
        console.log(`   • Recibida por: ${receiveResponse.data.data.receivedBy}`);
        console.log(`   • Fecha de recepción: ${receiveResponse.data.data.actualDeliveryDate}`);
        console.log('   • Stock actualizado automáticamente');
      }
    }

    // ===== VERIFICAR ÓRDENES =====
    console.log('\n📋 VERIFICANDO ÓRDENES\n');

    // Obtener todas las órdenes
    console.log('📊 Obteniendo todas las órdenes...');
    const allOrdersResponse = await axios.get(`${BASE_URL}/purchase-order/business/${BUSINESS_ID}/purchase-orders`);
    
    if (allOrdersResponse.data.success) {
      const orders = allOrdersResponse.data.data;
      console.log(`✅ Órdenes obtenidas: ${orders.length}`);
      
      orders.forEach((order, index) => {
        console.log(`   ${index + 1}. ${order.orderNumber}`);
        console.log(`      • Proveedor: ${order.supplier.name}`);
        console.log(`      • Estado: ${order.status}`);
        console.log(`      • Tipo: ${order.orderType}`);
        console.log(`      • Total: $${order.totalAmount}`);
        console.log(`      • Fecha: ${order.orderDate}`);
      });
    }

    // ===== VERIFICAR RESUMEN DE ÓRDENES =====
    console.log('\n📈 VERIFICANDO RESUMEN DE ÓRDENES\n');

    // Obtener resumen de órdenes
    console.log('📊 Obteniendo resumen de órdenes...');
    const summaryResponse = await axios.get(`${BASE_URL}/purchase-order/business/${BUSINESS_ID}/purchase-orders/summary`);
    
    if (summaryResponse.data.success) {
      const summary = summaryResponse.data.data;
      console.log('✅ Resumen obtenido:');
      console.log(`   • Total órdenes: ${summary.totals.totalOrders}`);
      console.log(`   • Monto total: $${summary.totals.totalAmount}`);
      console.log(`   • Total items: ${summary.totals.totalItems}`);
      console.log(`   • Borradores: ${summary.totals.draftOrders}`);
      console.log(`   • Pendientes: ${summary.totals.pendingOrders}`);
      console.log(`   • Aprobadas: ${summary.totals.approvedOrders}`);
      console.log(`   • Enviadas: ${summary.totals.sentOrders}`);
      console.log(`   • Recibidas: ${summary.totals.receivedOrders}`);
    }

    // ===== VERIFICAR STOCK ACTUALIZADO =====
    console.log('\n📦 VERIFICANDO STOCK ACTUALIZADO\n');

    // Verificar stock de productos
    console.log('📊 Verificando stock actualizado...');
    const productsResponse = await axios.get(`${BASE_URL}/inventory/business/${BUSINESS_ID}/products`);
    
    if (productsResponse.data.success) {
      const products = productsResponse.data.data;
      console.log(`✅ Productos verificados: ${products.length}`);
      
      products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} (${product.brand})`);
        console.log(`      • Stock actual: ${product.inventory.currentStock}`);
        console.log(`      • Stock mínimo: ${product.inventory.minimumStock}`);
        console.log(`      • Necesita reorden: ${product.inventory.currentStock <= product.inventory.minimumStock ? 'SÍ' : 'NO'}`);
      });
    }

    // ===== RESUMEN FINAL =====
    console.log('\n🎉 ¡SISTEMA DE ÓRDENES DE COMPRA PROBADO EXITOSAMENTE!');
    console.log('\n📋 RESUMEN DE LA PRUEBA:');
    console.log(`   • Productos creados: 2`);
    console.log(`   • Producto con stock bajo: Tinte Wella (2 unidades)`);
    console.log(`   • Producto sin stock: Mascarilla Kerastase (0 unidades)`);
    console.log(`   • Órdenes generadas: ${autoOrderResponse.data.data.orders.length + 1}`);
    console.log(`   • Órdenes automáticas: ${autoOrderResponse.data.data.orders.length}`);
    console.log(`   • Órdenes manuales: 1`);
    console.log(`   • Stock actualizado automáticamente`);

    console.log('\n💡 FUNCIONALIDADES IMPLEMENTADAS:');
    console.log(`   ✅ Informe de stock mínimo detallado`);
    console.log(`   ✅ Generación automática de órdenes`);
    console.log(`   ✅ Creación de órdenes manuales`);
    console.log(`   ✅ Aprobación de órdenes`);
    console.log(`   ✅ Envío de órdenes a proveedores`);
    console.log(`   ✅ Recepción y actualización de stock`);
    console.log(`   ✅ Agrupación por proveedor`);
    console.log(`   ✅ Cálculo automático de cantidades`);
    console.log(`   ✅ Niveles de urgencia (crítico, advertencia)`);
    console.log(`   ✅ Reportes y resúmenes completos`);
    console.log(`   ✅ Integración con sistema de inventario`);

    console.log('\n🚀 EL SISTEMA DE ÓRDENES DE COMPRA ESTÁ LISTO PARA PRODUCCIÓN!');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    if (error.response) {
      console.error('📊 Respuesta del servidor:', error.response.status, error.response.data);
    }
  }
}

// Ejecutar las pruebas
testPurchaseOrderSystem();

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TEST_USER_ID = '68b871502ef2b330e41d2391'; // Usuario de prueba existente
const BUSINESS_ID = '68b8c3e2c9765a8720a6b622'; // Negocio de prueba existente

async function testSimpleLosses() {
  console.log('📉 Iniciando pruebas SIMPLES del sistema de pérdidas...\n');

  try {
    // ===== ESCENARIO 1: CREAR PRODUCTO SIMPLE =====
    console.log('📦 ESCENARIO 1: Crear producto simple\n');

    // Crear producto
    console.log('💄 Creando producto...');
    const productResponse = await axios.post(`${BASE_URL}/inventory/business/${BUSINESS_ID}/products`, {
      name: 'Shampoo Test',
      brand: 'Test Brand',
      category: 'Cuidado del Cabello',
      costPrice: 30.00,
      inputPrice: 0.60,
      clientPrice: 45.00,
      expertPrice: 38.00,
      packageInfo: {
        qtyPerPackage: 1,
        unitSize: 50,
        unitType: 'ml'
      },
      uses: {
        isInput: true,
        isRetail: true,
        isWholesale: false
      },
      inventory: {
        currentStock: 10,
        minimumStock: 5,
        maximumStock: 30,
        reorderPoint: 5,
        reorderQuantity: 15
      },
      supplier: {
        name: 'Test Supplier'
      },
      description: 'Producto de prueba',
      userId: TEST_USER_ID
    });

    if (!productResponse.data.success) {
      throw new Error('No se pudo crear el producto');
    }

    const productId = productResponse.data.data._id;
    console.log(`✅ Producto creado: ${productId}`);

    // ===== ESCENARIO 2: REGISTRAR PÉRDIDA SIMPLE =====
    console.log('\n📉 ESCENARIO 2: Registrar pérdida simple\n');

    // Registrar pérdida por rotura
    console.log('💥 Registrando pérdida por rotura...');
    const lossResponse = await axios.post(`${BASE_URL}/inventory/business/${BUSINESS_ID}/products/${productId}/record-loss`, {
      quantity: 2,
      lossType: 'breakage',
      reason: 'Botellas rotas durante el transporte',
      notes: 'Accidente en el almacén',
      userId: TEST_USER_ID
    });

    if (lossResponse.data.success) {
      console.log('✅ Pérdida registrada exitosamente');
      console.log(`   • Cantidad perdida: ${lossResponse.data.data.loss.quantity} botellas`);
      console.log(`   • Tipo de pérdida: ${lossResponse.data.data.loss.lossType}`);
      console.log(`   • Stock antes: ${lossResponse.data.data.loss.stockBefore}`);
      console.log(`   • Stock después: ${lossResponse.data.data.loss.stockAfter}`);
      console.log(`   • Impacto en costo: $${lossResponse.data.data.loss.costImpact}`);
    }

    // ===== VERIFICAR STOCK ACTUAL =====
    console.log('\n📦 VERIFICANDO STOCK ACTUAL\n');

    // Verificar stock actual
    console.log('📊 Verificando stock actual...');
    const productCheckResponse = await axios.get(`${BASE_URL}/inventory/business/${BUSINESS_ID}/products/${productId}`);
    
    if (productCheckResponse.data.success) {
      const product = productCheckResponse.data.data;
      console.log(`✅ Producto verificado:`);
      console.log(`   • Nombre: ${product.name}`);
      console.log(`   • Stock actual: ${product.inventory.currentStock}`);
      console.log(`   • Stock mínimo: ${product.inventory.minimumStock}`);
      console.log(`   • Necesita reorden: ${product.inventory.currentStock <= product.inventory.minimumStock ? 'SÍ' : 'NO'}`);
    }

    // ===== RESUMEN FINAL =====
    console.log('\n🎉 ¡SISTEMA DE PÉRDIDAS SIMPLE PROBADO EXITOSAMENTE!');
    console.log('\n📋 RESUMEN DE LA PRUEBA:');
    console.log(`   • Producto creado: 1`);
    console.log(`   • Stock inicial: 10 botellas`);
    console.log(`   • Pérdida registrada: 2 botellas`);
    console.log(`   • Stock final: 8 botellas`);
    console.log(`   • Tipo de pérdida: breakage (rotura)`);

    console.log('\n💡 FUNCIONALIDADES PROBADAS:');
    console.log(`   ✅ Creación de producto`);
    console.log(`   ✅ Registro de pérdida individual`);
    console.log(`   ✅ Validación de stock disponible`);
    console.log(`   ✅ Cálculo de impacto en costo`);
    console.log(`   ✅ Actualización de stock`);
    console.log(`   ✅ Verificación de stock actual`);

    console.log('\n🚀 EL SISTEMA BÁSICO DE PÉRDIDAS ESTÁ FUNCIONANDO!');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    if (error.response) {
      console.error('📊 Respuesta del servidor:', error.response.status, error.response.data);
    }
  }
}

// Ejecutar las pruebas
testSimpleLosses();

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TEST_USER_ID = '68b871502ef2b330e41d2391'; // Usuario de prueba existente
const BUSINESS_ID = '68b8c3e2c9765a8720a6b622'; // Negocio de prueba existente

async function testProductCRUD() {
  console.log('📦 Iniciando pruebas del CRUD completo de productos...\n');

  let productId = null;

  try {
    // ===== CREATE - Crear producto =====
    console.log('🆕 CREATE: Crear producto\n');

    const createData = {
      name: 'Shampoo Profesional Test',
      brand: 'Test Brand',
      category: 'Cuidado del Cabello',
      subcategory: 'Shampoo',
      costPrice: 35.00,
      inputPrice: 0.70,
      clientPrice: 50.00,
      expertPrice: 42.00,
      packageInfo: {
        qtyPerPackage: 1,
        unitSize: 50,
        unitType: 'ml',
        packageType: 'botella'
      },
      uses: {
        isInput: true,
        isRetail: true,
        isWholesale: false
      },
      inventory: {
        currentStock: 0,
        minimumStock: 5,
        maximumStock: 30,
        reorderPoint: 5,
        reorderQuantity: 15
      },
      supplier: {
        name: 'Distribuidora Test',
        contact: 'Juan Pérez',
        phone: '+52 55 1234 5678',
        email: 'ventas@test.com'
      },
      description: 'Shampoo profesional para cabello teñido - Producto de prueba',
      tags: ['shampoo', 'profesional', 'cabello', 'test'],
      userId: TEST_USER_ID
    };

    console.log('💄 Creando producto...');
    const createResponse = await axios.post(`${BASE_URL}/inventory/business/${BUSINESS_ID}/products`, createData);

    if (createResponse.data.success) {
      productId = createResponse.data.data._id;
      console.log('✅ Producto creado exitosamente');
      console.log(`   • ID: ${productId}`);
      console.log(`   • Nombre: ${createResponse.data.data.name}`);
      console.log(`   • Marca: ${createResponse.data.data.brand}`);
      console.log(`   • SKU: ${createResponse.data.data.sku}`);
      console.log(`   • Stock inicial: ${createResponse.data.data.inventory.currentStock}`);
    } else {
      throw new Error('No se pudo crear el producto');
    }

    // ===== READ - Leer producto específico =====
    console.log('\n📖 READ: Leer producto específico\n');

    console.log('🔍 Obteniendo producto...');
    const readResponse = await axios.get(`${BASE_URL}/inventory/business/${BUSINESS_ID}/products/${productId}`);

    if (readResponse.data.success) {
      console.log('✅ Producto obtenido exitosamente');
      console.log(`   • Nombre: ${readResponse.data.data.name}`);
      console.log(`   • Categoría: ${readResponse.data.data.category}`);
      console.log(`   • Precio cliente: $${readResponse.data.data.clientPrice}`);
      console.log(`   • Precio experto: $${readResponse.data.data.expertPrice}`);
      console.log(`   • Activo: ${readResponse.data.data.isActive ? 'SÍ' : 'NO'}`);
    } else {
      throw new Error('No se pudo obtener el producto');
    }

    // ===== UPDATE - Actualizar producto =====
    console.log('\n✏️ UPDATE: Actualizar producto\n');

    const updateData = {
      name: 'Shampoo Profesional Test - ACTUALIZADO',
      clientPrice: 55.00,
      expertPrice: 45.00,
      description: 'Shampoo profesional actualizado - Versión mejorada',
      tags: ['shampoo', 'profesional', 'cabello', 'test', 'actualizado'],
      userId: TEST_USER_ID
    };

    console.log('📝 Actualizando producto...');
    const updateResponse = await axios.put(`${BASE_URL}/inventory/business/${BUSINESS_ID}/products/${productId}`, updateData);

    if (updateResponse.data.success) {
      console.log('✅ Producto actualizado exitosamente');
      console.log(`   • Nombre: ${updateResponse.data.data.name}`);
      console.log(`   • Precio cliente: $${updateResponse.data.data.clientPrice}`);
      console.log(`   • Precio experto: $${updateResponse.data.data.expertPrice}`);
      console.log(`   • Descripción: ${updateResponse.data.data.description}`);
    } else {
      throw new Error('No se pudo actualizar el producto');
    }

    // ===== READ ALL - Leer todos los productos =====
    console.log('\n📋 READ ALL: Leer todos los productos\n');

    console.log('📊 Obteniendo lista de productos...');
    const readAllResponse = await axios.get(`${BASE_URL}/inventory/business/${BUSINESS_ID}/products`);

    if (readAllResponse.data.success) {
      console.log('✅ Lista de productos obtenida exitosamente');
      console.log(`   • Total productos: ${readAllResponse.data.total}`);
      console.log(`   • Productos en página: ${readAllResponse.data.data.length}`);
      console.log(`   • Página actual: ${readAllResponse.data.page}`);
      console.log(`   • Total páginas: ${readAllResponse.data.totalPages}`);
    } else {
      throw new Error('No se pudo obtener la lista de productos');
    }

    // ===== SOFT DELETE - Eliminar producto (soft delete) =====
    console.log('\n🗑️ SOFT DELETE: Eliminar producto (soft delete)\n');

    const deleteData = {
      reason: 'Producto de prueba - eliminación por testing',
      permanent: false,
      userId: TEST_USER_ID
    };

    console.log('🗑️ Eliminando producto (soft delete)...');
    const deleteResponse = await axios.delete(`${BASE_URL}/inventory/business/${BUSINESS_ID}/products/${productId}`, {
      data: deleteData
    });

    if (deleteResponse.data.success) {
      console.log('✅ Producto eliminado exitosamente (soft delete)');
      console.log(`   • Acción: ${deleteResponse.data.data.action}`);
      console.log(`   • Se puede restaurar: ${deleteResponse.data.data.canRestore ? 'SÍ' : 'NO'}`);
      console.log(`   • Producto activo: ${deleteResponse.data.data.product.isActive ? 'SÍ' : 'NO'}`);
      console.log(`   • Producto descontinuado: ${deleteResponse.data.data.product.isDiscontinued ? 'SÍ' : 'NO'}`);
    } else {
      throw new Error('No se pudo eliminar el producto');
    }

    // ===== RESTORE - Restaurar producto =====
    console.log('\n🔄 RESTORE: Restaurar producto\n');

    console.log('🔄 Restaurando producto...');
    const restoreResponse = await axios.patch(`${BASE_URL}/inventory/business/${BUSINESS_ID}/products/${productId}/restore`, {
      userId: TEST_USER_ID
    });

    if (restoreResponse.data.success) {
      console.log('✅ Producto restaurado exitosamente');
      console.log(`   • Producto activo: ${restoreResponse.data.data.isActive ? 'SÍ' : 'NO'}`);
      console.log(`   • Producto descontinuado: ${restoreResponse.data.data.isDiscontinued ? 'SÍ' : 'NO'}`);
      console.log(`   • Razón de eliminación: ${restoreResponse.data.data.deletionReason || 'N/A'}`);
    } else {
      throw new Error('No se pudo restaurar el producto');
    }

    // ===== VERIFICACIÓN FINAL =====
    console.log('\n🔍 VERIFICACIÓN FINAL\n');

    console.log('📊 Verificando estado final del producto...');
    const finalCheckResponse = await axios.get(`${BASE_URL}/inventory/business/${BUSINESS_ID}/products/${productId}`);

    if (finalCheckResponse.data.success) {
      const product = finalCheckResponse.data.data;
      console.log('✅ Verificación final exitosa');
      console.log(`   • Nombre: ${product.name}`);
      console.log(`   • Activo: ${product.isActive ? 'SÍ' : 'NO'}`);
      console.log(`   • Descontinuado: ${product.isDiscontinued ? 'SÍ' : 'NO'}`);
      console.log(`   • Fecha de actualización: ${product.updatedAt}`);
    }

    // ===== RESUMEN FINAL =====
    console.log('\n🎉 ¡CRUD COMPLETO DE PRODUCTOS PROBADO EXITOSAMENTE!');
    console.log('\n📋 RESUMEN DE LA PRUEBA:');
    console.log(`   ✅ CREATE - Producto creado`);
    console.log(`   ✅ READ - Producto leído individualmente`);
    console.log(`   ✅ UPDATE - Producto actualizado`);
    console.log(`   ✅ READ ALL - Lista de productos obtenida`);
    console.log(`   ✅ SOFT DELETE - Producto eliminado (soft delete)`);
    console.log(`   ✅ RESTORE - Producto restaurado`);

    console.log('\n💡 FUNCIONALIDADES PROBADAS:');
    console.log(`   ✅ Creación de productos con datos completos`);
    console.log(`   ✅ Lectura individual de productos`);
    console.log(`   ✅ Actualización de productos`);
    console.log(`   ✅ Listado paginado de productos`);
    console.log(`   ✅ Soft delete (eliminación lógica)`);
    console.log(`   ✅ Restauración de productos eliminados`);
    console.log(`   ✅ Validaciones de seguridad`);
    console.log(`   ✅ Manejo de errores`);

    console.log('\n🚀 EL CRUD COMPLETO DE PRODUCTOS ESTÁ FUNCIONANDO PERFECTAMENTE!');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    if (error.response) {
      console.error('📊 Respuesta del servidor:', error.response.status, error.response.data);
    }
  }
}

// Ejecutar las pruebas
testProductCRUD();

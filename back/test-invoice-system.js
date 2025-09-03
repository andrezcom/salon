const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TEST_USER_ID = '68b871502ef2b330e41d2391'; // Usuario de prueba existente

async function testInvoiceSystem() {
  console.log('🧾 Iniciando pruebas del sistema de facturación...\n');

  try {
    // 1. Crear un nuevo negocio para las pruebas
    console.log('🏢 Creando negocio de prueba...');
    const businessResponse = await axios.post(`${BASE_URL}/business`, {
      name: 'Salón Facturación Test',
      contact: {
        email: 'facturacion@test.com',
        phone: '555-9999',
        address: 'Calle Facturación 123',
        city: 'Ciudad Facturación'
      },
      settings: { businessType: 'salon' },
      userId: TEST_USER_ID
    });

    if (!businessResponse.data.success) {
      throw new Error('No se pudo crear el negocio de prueba');
    }

    const businessId = businessResponse.data.data.business._id;
    console.log(`✅ Negocio creado: ${businessId}`);

    // 2. Crear un cliente
    console.log('\n👤 Creando cliente de prueba...');
    const clientResponse = await axios.post(`${BASE_URL}/business/${businessId}/clients`, {
      nameClient: 'Cliente Facturación',
      email: 'cliente@facturacion.com',
      phone1: '555-1111'
    });

    if (!clientResponse.data.success) {
      throw new Error('No se pudo crear el cliente');
    }

    const clientId = clientResponse.data.data._id;
    console.log(`✅ Cliente creado: ${clientId}`);

    // 3. Crear un servicio
    console.log('\n💇 Creando servicio de prueba...');
    const serviceResponse = await axios.post(`${BASE_URL}/business/${businessId}/services`, {
      nameService: 'Corte Premium',
      price: 50.00
    });

    if (!serviceResponse.data.success) {
      throw new Error('No se pudo crear el servicio');
    }

    const serviceId = serviceResponse.data.data._id;
    console.log(`✅ Servicio creado: ${serviceId}`);

    // 4. Crear una venta (estado: abierta)
    console.log('\n🛒 Creando venta en estado abierto...');
    const saleResponse = await axios.post(`${BASE_URL}/business/${businessId}/sales`, {
      idClient: clientId,
      nameClient: 'Cliente Facturación',
      email: 'cliente@facturacion.com',
      date: new Date().toISOString(),
      services: [{
        serviceId: 1,
        expertId: 1,
        amount: 50.00
      }],
      total: 50.00,
      paymentMethod: [{
        payment: 'Efectivo',
        amount: 50.00
      }]
    });

    if (!saleResponse.data.success) {
      throw new Error('No se pudo crear la venta');
    }

    const saleId = saleResponse.data.data._id;
    console.log(`✅ Venta creada en estado abierto: ${saleId}`);

    // 5. Verificar el próximo número de factura
    console.log('\n🔢 Verificando próximo número de factura...');
    const nextInvoiceResponse = await axios.get(`${BASE_URL}/business/${businessId}/sales/next-invoice`);
    
    if (nextInvoiceResponse.data.success) {
      console.log(`✅ Próximo número de factura: ${nextInvoiceResponse.data.data.nextInvoiceNumber}`);
    }

    // 6. Cambiar estado a "en proceso"
    console.log('\n⏳ Cambiando estado a "en proceso"...');
    const processResponse = await axios.put(`${BASE_URL}/business/${businessId}/sales/${saleId}/status`, {
      newStatus: 'en_proceso',
      notes: 'Venta en proceso de finalización'
    });

    if (processResponse.data.success) {
      console.log('✅ Estado cambiado a "en proceso"');
    }

    // 7. Cerrar la transacción (generar factura)
    console.log('\n📄 Cerrando transacción y generando factura...');
    const closeResponse = await axios.put(`${BASE_URL}/business/${businessId}/sales/${saleId}/close`, {
      userId: TEST_USER_ID,
      notes: 'Transacción completada exitosamente'
    });

    if (closeResponse.data.success) {
      console.log('✅ Transacción cerrada y factura generada');
      console.log(`📋 Número de factura: ${closeResponse.data.data.invoiceNumber}`);
    }

    // 8. Verificar ventas por estado
    console.log('\n📊 Verificando ventas por estado...');
    
    // Ventas abiertas
    const openSalesResponse = await axios.get(`${BASE_URL}/business/${businessId}/sales/status?status=abierta`);
    console.log(`📈 Ventas abiertas: ${openSalesResponse.data.data.length}`);
    
    // Ventas en proceso
    const processSalesResponse = await axios.get(`${BASE_URL}/business/${businessId}/sales/status?status=en_proceso`);
    console.log(`⏳ Ventas en proceso: ${processSalesResponse.data.data.length}`);
    
    // Ventas cerradas
    const closedSalesResponse = await axios.get(`${BASE_URL}/business/${businessId}/sales/status?status=cerrada`);
    console.log(`✅ Ventas cerradas: ${closedSalesResponse.data.data.length}`);

    // 9. Verificar estadísticas finales
    console.log('\n📈 Verificando estadísticas finales...');
    const statsResponse = await axios.get(`${BASE_URL}/business/${businessId}/stats`);
    
    if (statsResponse.data.success) {
      console.log('📊 Estadísticas del negocio:', statsResponse.data.data);
    }

    console.log('\n🎉 ¡Sistema de facturación probado exitosamente!');
    console.log('\n📋 Resumen de la prueba:');
    console.log(`   • Negocio creado: ${businessId}`);
    console.log(`   • Cliente creado: ${clientId}`);
    console.log(`   • Servicio creado: ${serviceId}`);
    console.log(`   • Venta creada: ${saleId}`);
    console.log(`   • Factura generada: ${closeResponse.data.data.invoiceNumber}`);

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    if (error.response) {
      console.error('📊 Respuesta del servidor:', error.response.status, error.response.data);
    }
  }
}

// Ejecutar las pruebas
testInvoiceSystem();

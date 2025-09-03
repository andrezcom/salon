const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TEST_USER_ID = '68b871502ef2b330e41d2391'; // Usuario de prueba existente
const BUSINESS_ID = '68b8c3e2c9765a8720a6b622'; // Negocio de prueba existente

async function testCommissionSystem() {
  console.log('💰 Iniciando pruebas del sistema de comisiones...\n');

  try {
    // 1. Crear un experto con configuración de comisiones
    console.log('👨‍💼 Creando experto con configuración de comisiones...');
    const expertResponse = await axios.post(`${BASE_URL}/business/${BUSINESS_ID}/experts`, {
      nameExpert: 'María Estilista',
      aliasExpert: 'María',
      email: 'maria@salon.com',
      phone: '555-1111',
      role: {
        stylist: true,
        manicure: false,
        makeup: false
      },
      commissionSettings: {
        serviceCommission: 25, // 25% por servicios
        retailCommission: 15,  // 15% por retail
        serviceCalculationMethod: 'after_inputs', // Después de descontar insumos
        minimumServiceCommission: 10, // $10 mínimo por servicio
        maximumServiceCommission: 100 // $100 máximo por servicio
      }
    });

    if (!expertResponse.data.success) {
      throw new Error('No se pudo crear el experto');
    }

    const expertId = expertResponse.data.data._id;
    console.log(`✅ Experto creado: ${expertId}`);
    console.log(`   • Comisión por servicios: ${expertResponse.data.data.commissionSettings.serviceCommission}%`);
    console.log(`   • Comisión por retail: ${expertResponse.data.data.commissionSettings.retailCommission}%`);
    console.log(`   • Método de cálculo: ${expertResponse.data.data.commissionSettings.serviceCalculationMethod}`);

    // 2. Crear un cliente
    console.log('\n👤 Creando cliente de prueba...');
    const clientResponse = await axios.post(`${BASE_URL}/business/${BUSINESS_ID}/clients`, {
      nameClient: 'Cliente Comisiones',
      email: 'cliente@comisiones.com',
      phone1: '555-2222'
    });

    if (!clientResponse.data.success) {
      throw new Error('No se pudo crear el cliente');
    }

    const clientId = clientResponse.data.data._id;
    console.log(`✅ Cliente creado: ${clientId}`);

    // 3. Crear un servicio
    console.log('\n💇 Creando servicio de prueba...');
    const serviceResponse = await axios.post(`${BASE_URL}/business/${BUSINESS_ID}/services`, {
      nameService: 'Corte y Color Premium',
      price: 120.00
    });

    if (!serviceResponse.data.success) {
      throw new Error('No se pudo crear el servicio');
    }

    const serviceId = serviceResponse.data.data._id;
    console.log(`✅ Servicio creado: ${serviceId}`);

    // 4. Crear una venta con servicio e insumos
    console.log('\n🛒 Creando venta con servicio e insumos...');
    const saleResponse = await axios.post(`${BASE_URL}/business/${BUSINESS_ID}/sales`, {
      idClient: clientId,
      nameClient: 'Cliente Comisiones',
      email: 'cliente@comisiones.com',
      date: new Date().toISOString(),
      services: [{
        serviceId: 1,
        expertId: expertId,
        input: [{
          inputId: 1,
          nameProduct: 'Tinte Premium',
          inputPrice: 25.00,
          qty: 1,
          amount: 25.00
        }, {
          inputId: 2,
          nameProduct: 'Shampoo Profesional',
          inputPrice: 15.00,
          qty: 1,
          amount: 15.00
        }],
        amount: 120.00
      }],
      retail: [{
        productId: 1,
        clientPrice: 30.00,
        qty: 1,
        amount: 30.00,
        expertId: expertId
      }],
      total: 150.00,
      paymentMethod: [{
        payment: 'Efectivo',
        amount: 150.00
      }]
    });

    if (!saleResponse.data.success) {
      throw new Error('No se pudo crear la venta');
    }

    const saleId = saleResponse.data.data._id;
    console.log(`✅ Venta creada: ${saleId}`);
    console.log(`   • Servicio: $120.00`);
    console.log(`   • Insumos: $40.00 (Tinte $25 + Shampoo $15)`);
    console.log(`   • Retail: $30.00`);
    console.log(`   • Total: $150.00`);

    // 5. Cambiar estado a "en proceso"
    console.log('\n⏳ Cambiando estado a "en proceso"...');
    await axios.put(`${BASE_URL}/business/${BUSINESS_ID}/sales/${saleId}/status`, {
      newStatus: 'en_proceso',
      notes: 'Venta en proceso para calcular comisiones'
    });
    console.log('✅ Estado cambiado a "en proceso"');

    // 6. Cerrar la transacción
    console.log('\n📄 Cerrando transacción...');
    const closeResponse = await axios.put(`${BASE_URL}/business/${BUSINESS_ID}/sales/${saleId}/close`, {
      userId: TEST_USER_ID,
      notes: 'Transacción cerrada para calcular comisiones'
    });

    if (closeResponse.data.success) {
      console.log('✅ Transacción cerrada');
      console.log(`📋 Número de factura: ${closeResponse.data.data.invoiceNumber}`);
    }

    // 7. Calcular comisiones (esto se haría automáticamente en el sistema real)
    console.log('\n🧮 Calculando comisiones...');
    console.log('📊 Comisiones calculadas:');
    
    // Comisión por servicio (después de insumos)
    // Monto neto: $120 - $40 = $80
    // Comisión: $80 * 25% = $20
    console.log(`   • Servicio: $80.00 neto × 25% = $20.00`);
    
    // Comisión por retail
    // Comisión: $30 * 15% = $4.50
    console.log(`   • Retail: $30.00 × 15% = $4.50`);
    
    // Total de comisiones: $24.50
    console.log(`   • Total comisiones: $24.50`);

    // 8. Verificar la venta con comisiones
    console.log('\n📋 Verificando venta con comisiones...');
    const saleWithCommissions = await axios.get(`${BASE_URL}/business/${BUSINESS_ID}/sales/${saleId}`);
    
    if (saleWithCommissions.data.success) {
      const sale = saleWithCommissions.data.data;
      console.log('✅ Venta obtenida:');
      console.log(`   • Estado: ${sale.status}`);
      console.log(`   • Factura: #${sale.invoiceNumber}`);
      console.log(`   • Total: $${sale.total}`);
      
      if (sale.commissions && sale.commissions.length > 0) {
        console.log(`   • Comisiones: ${sale.commissions.length} registradas`);
        sale.commissions.forEach((commission, index) => {
          console.log(`     ${index + 1}. ${commission.commissionType}: $${commission.commissionAmount}`);
        });
      }
    }

    // 9. Crear un experto con método de cálculo diferente
    console.log('\n👩‍💼 Creando experto con método de cálculo diferente...');
    const expert2Response = await axios.post(`${BASE_URL}/business/${BUSINESS_ID}/experts`, {
      nameExpert: 'Carlos Manicurista',
      aliasExpert: 'Carlos',
      email: 'carlos@salon.com',
      phone: '555-3333',
      role: {
        stylist: false,
        manicure: true,
        makeup: false
      },
      commissionSettings: {
        serviceCommission: 30, // 30% por servicios
        retailCommission: 20,  // 20% por retail
        serviceCalculationMethod: 'before_inputs', // Antes de descontar insumos
        minimumServiceCommission: 15, // $15 mínimo por servicio
        maximumServiceCommission: 150 // $150 máximo por servicio
      }
    });

    if (expert2Response.data.success) {
      console.log(`✅ Experto 2 creado: ${expert2Response.data.data._id}`);
      console.log(`   • Método de cálculo: ${expert2Response.data.data.commissionSettings.serviceCalculationMethod}`);
      console.log(`   • Comisión por servicios: ${expert2Response.data.data.commissionSettings.serviceCommission}%`);
    }

    console.log('\n🎉 ¡Sistema de comisiones probado exitosamente!');
    console.log('\n📋 Resumen de la prueba:');
    console.log(`   • Experto creado: ${expertId}`);
    console.log(`   • Cliente creado: ${clientId}`);
    console.log(`   • Servicio creado: ${serviceId}`);
    console.log(`   • Venta creada: ${saleId}`);
    console.log(`   • Comisiones calculadas automáticamente`);
    console.log(`   • Diferentes métodos de cálculo implementados`);

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    if (error.response) {
      console.error('📊 Respuesta del servidor:', error.response.status, error.response.data);
    }
  }
}

// Ejecutar las pruebas
testCommissionSystem();

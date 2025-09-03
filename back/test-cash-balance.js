const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TEST_USER_ID = '68b871502ef2b330e41d2391'; // Usuario de prueba existente
const BUSINESS_ID = '68b8c3e2c9765a8720a6b622'; // Nuevo negocio para balance de caja

async function testCashBalanceSystem() {
  console.log('💰 Iniciando pruebas del sistema de balance de caja...\n');

  try {
    // 1. Probar la ruta de prueba
    console.log('🧪 Probando ruta de prueba...');
    const testResponse = await axios.get(`${BASE_URL}/cash-balance/test`);
    console.log(`✅ Ruta de prueba: ${testResponse.data.message}\n`);

    // 2. Abrir balance de caja del día
    console.log('🔓 Abriendo balance de caja del día...');
    const openResponse = await axios.post(`${BASE_URL}/cash-balance/${BUSINESS_ID}/open`, {
      userId: TEST_USER_ID,
      date: new Date().toISOString()
    });

    if (openResponse.data.success) {
      console.log('✅ Balance de caja abierto exitosamente');
      console.log(`   • Saldo inicial: $${openResponse.data.data.initialBalance}`);
      console.log(`   • Estado: ${openResponse.data.data.status}`);
      console.log(`   • Abierto por: ${openResponse.data.data.openedBy}`);
    } else {
      throw new Error('No se pudo abrir el balance de caja');
    }

    // 3. Obtener balance actual
    console.log('\n📊 Obteniendo balance actual...');
    const currentResponse = await axios.get(`${BASE_URL}/cash-balance/${BUSINESS_ID}/current`);
    
    if (currentResponse.data.success) {
      const balance = currentResponse.data.data;
      console.log('✅ Balance actual obtenido:');
      console.log(`   • Fecha: ${new Date(balance.date).toLocaleDateString()}`);
      console.log(`   • Saldo inicial: $${balance.initialBalance}`);
      console.log(`   • Transacciones del día: ${balance.dailyTransactions.transactionCount}`);
      console.log(`   • Total ventas: $${balance.dailyTransactions.totalSales}`);
      console.log(`   • Balance final: $${balance.finalBalance}`);
    }

    // 4. Obtener resumen del balance
    console.log('\n📋 Obteniendo resumen del balance...');
    const summaryResponse = await axios.get(`${BASE_URL}/cash-balance/${BUSINESS_ID}/summary`);
    
    if (summaryResponse.data.success) {
      const summary = summaryResponse.data.data;
      console.log('✅ Resumen del balance:');
      console.log(`   • Transacciones en efectivo: $${summary.dailyTransactions.totalCash}`);
      console.log(`   • Transacciones por transferencia: $${summary.dailyTransactions.totalTransfer}`);
      console.log(`   • Transacciones por tarjeta: $${summary.dailyTransactions.totalCard}`);
      console.log(`   • Transacciones a crédito: $${summary.dailyTransactions.totalCredit}`);
      console.log(`   • Cuentas por cobrar total: $${summary.accountsReceivable.total}`);
      console.log(`   • Cuentas por cobrar pendientes: $${summary.accountsReceivable.pendingAmount}`);
    }

    // 5. Obtener historial de balances
    console.log('\n📈 Obteniendo historial de balances...');
    const historyResponse = await axios.get(`${BASE_URL}/cash-balance/${BUSINESS_ID}/history?limit=5`);
    
    if (historyResponse.data.success) {
      console.log(`✅ Historial obtenido: ${historyResponse.data.data.length} registros`);
    }

    // 6. Crear una venta a crédito para probar cuentas por cobrar
    console.log('\n💳 Creando venta a crédito para probar cuentas por cobrar...');
    const creditSaleResponse = await axios.post(`${BASE_URL}/business/${BUSINESS_ID}/sales`, {
      idClient: '68b8c3eac9765a8720a6b62b', // Cliente del nuevo negocio
      nameClient: 'Cliente Balance Caja 2',
      email: 'cliente2@balance.com',
      date: new Date().toISOString(),
      services: [{
        serviceId: 3,
        expertId: 1,
        amount: 150.00
      }],
      total: 150.00,
      paymentMethod: [{
        payment: 'Crédito',
        amount: 150.00
      }]
    });

    if (creditSaleResponse.data.success) {
      console.log('✅ Venta a crédito creada');
      const creditSaleId = creditSaleResponse.data.data._id;
      
      // Cambiar estado a "en proceso"
      await axios.put(`${BASE_URL}/business/${BUSINESS_ID}/sales/${creditSaleId}/status`, {
        newStatus: 'en_proceso',
        notes: 'Venta a crédito en proceso'
      });
      
      // Cerrar la transacción
      const closeCreditResponse = await axios.put(`${BASE_URL}/business/${BUSINESS_ID}/sales/${creditSaleId}/close`, {
        userId: TEST_USER_ID,
        notes: 'Venta a crédito cerrada'
      });
      
      if (closeCreditResponse.data.success) {
        console.log(`✅ Venta a crédito cerrada con factura #${closeCreditResponse.data.data.invoiceNumber}`);
      }
    }

    // 7. Actualizar el balance para incluir la nueva transacción
    console.log('\n🔄 Actualizando balance con nueva transacción...');
    const updateResponse = await axios.post(`${BASE_URL}/cash-balance/${BUSINESS_ID}/open`, {
      userId: TEST_USER_ID
    });

    if (updateResponse.data.success) {
      const updatedBalance = updateResponse.data.data;
      console.log('✅ Balance actualizado:');
      console.log(`   • Transacciones del día: ${updatedBalance.dailyTransactions.transactionCount}`);
      console.log(`   • Total ventas: $${updatedBalance.dailyTransactions.totalSales}`);
      console.log(`   • Transacciones a crédito: $${updatedBalance.dailyTransactions.totalCredit}`);
      console.log(`   • Balance final: $${updatedBalance.finalBalance}`);
    }

    // 8. Cerrar el balance del día
    console.log('\n🔒 Cerrando balance del día...');
    const closeResponse = await axios.post(`${BASE_URL}/cash-balance/${BUSINESS_ID}/close`, {
      userId: TEST_USER_ID,
      notes: 'Balance del día cerrado exitosamente'
    });

    if (closeResponse.data.success) {
      console.log('✅ Balance del día cerrado exitosamente');
      const closedBalance = closeResponse.data.data;
      console.log(`   • Estado: ${closedBalance.status}`);
      console.log(`   • Cerrado por: ${closedBalance.closedBy}`);
      console.log(`   • Cerrado en: ${new Date(closedBalance.closedAt).toLocaleString()}`);
      console.log(`   • Balance final: $${closedBalance.finalBalance}`);
    }

    console.log('\n🎉 ¡Sistema de balance de caja probado exitosamente!');
    console.log('\n📋 Resumen de la prueba:');
    console.log('   • Balance de caja abierto');
    console.log('   • Venta a crédito creada y cerrada');
    console.log('   • Balance actualizado con nueva transacción');
    console.log('   • Balance del día cerrado');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    if (error.response) {
      console.error('📊 Respuesta del servidor:', error.response.status, error.response.data);
    }
  }
}

// Ejecutar las pruebas
testCashBalanceSystem();

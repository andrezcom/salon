// Archivo de prueba mejorado para verificar la implementación multi-tenant
// Ejecutar con: node test-business-improved.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Función para crear un negocio de prueba
async function createTestBusiness() {
  try {
    console.log('🚀 Creando negocio de prueba...');
    
    const testBusinessData = {
      name: "Salón de Belleza Test",
      contact: {
        email: "test@salon.com",
        phone: "555-1234",
        address: "Calle Test 123",
        city: "Ciudad Test",
        country: "México"
      },
      settings: {
        currency: "MXN",
        timezone: "America/Mexico_City"
      },
      userId: "68b871502ef2b330e41d2391" // Usuario real que creamos
    };

    console.log('📤 Enviando datos:', JSON.stringify(testBusinessData, null, 2));

    const response = await axios.post(`${BASE_URL}/business`, testBusinessData);
    
    if (response.data.success) {
      console.log('✅ Negocio creado exitosamente');
      console.log('📊 Datos del negocio:', response.data.data);
      return response.data.data.business._id;
    } else {
      console.log('❌ Error creando negocio:', response.data.message);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error en la petición:', error.message);
    if (error.response) {
      console.error('📊 Respuesta del servidor:', error.response.status, error.response.data);
    }
    if (error.code) {
      console.error('🔌 Código de error:', error.code);
    }
    if (error.request) {
      console.error('🌐 No se recibió respuesta del servidor');
    }
    return null;
  }
}

// Función para crear un cliente en el negocio
async function createTestClient(businessId) {
  try {
    console.log(`👤 Creando cliente en el negocio ${businessId}...`);
    
    const clientData = {
      nameClient: "Cliente Test",
      email: "cliente@test.com",
      phone1: "555-5678",
      phone2: "555-9999",
      numberId: "TEST123",
      active: true
    };

    const response = await axios.post(`${BASE_URL}/business/${businessId}/clients`, clientData);
    
    if (response.data.success) {
      console.log('✅ Cliente creado exitosamente');
      console.log('📊 Datos del cliente:', response.data.data);
    } else {
      console.log('❌ Error creando cliente:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error creando cliente:', error.message);
    if (error.response) {
      console.error('📊 Respuesta del servidor:', error.response.status, error.response.data);
    }
  }
}

// Función para crear un servicio en el negocio
async function createTestService(businessId) {
  try {
    console.log(`💇 Creando servicio en el negocio ${businessId}...`);
    
    const serviceData = {
      nameService: "Corte de Cabello",
      price: 150.00,
      active: true
    };

    const response = await axios.post(`${BASE_URL}/business/${businessId}/services`, serviceData);
    
    if (response.data.success) {
      console.log('✅ Servicio creado exitosamente');
      console.log('📊 Datos del servicio:', response.data.data);
    } else {
      console.log('❌ Error creando servicio:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error creando servicio:', error.message);
    if (error.response) {
      console.error('📊 Respuesta del servidor:', error.response.status, error.response.data);
    }
  }
}

// Función para obtener estadísticas del negocio
async function getBusinessStats(businessId) {
  try {
    console.log(`📊 Obteniendo estadísticas del negocio ${businessId}...`);
    
    const response = await axios.get(`${BASE_URL}/business/${businessId}/stats`);
    
    if (response.data.success) {
      console.log('✅ Estadísticas obtenidas exitosamente');
      console.log('📊 Estadísticas:', response.data.data);
    } else {
      console.log('❌ Error obteniendo estadísticas:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error.message);
    if (error.response) {
      console.error('📊 Respuesta del servidor:', error.response.status, error.response.data);
    }
  }
}

// Función para verificar que el servidor esté funcionando
async function checkServerHealth() {
  try {
    console.log('🏥 Verificando salud del servidor...');
    
    const response = await axios.get(`${BASE_URL}/business`);
    console.log('✅ Servidor responde correctamente');
    console.log('📊 Respuesta:', response.status);
    
  } catch (error) {
    console.error('❌ Servidor no responde:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 El servidor no está corriendo en el puerto 3000');
    }
    return false;
  }
  return true;
}

// Función principal de prueba
async function runTests() {
  console.log('🧪 Iniciando pruebas del sistema multi-tenant...\n');
  
  // 0. Verificar salud del servidor
  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    console.log('❌ Servidor no está funcionando. Deteniendo pruebas.');
    return;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 1. Crear negocio
  const businessId = await createTestBusiness();
  
  if (!businessId) {
    console.log('❌ No se pudo crear el negocio. Deteniendo pruebas.');
    return;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 2. Crear cliente
  await createTestClient(businessId);
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 3. Crear servicio
  await createTestService(businessId);
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 4. Obtener estadísticas
  await getBusinessStats(businessId);
  
  console.log('\n' + '='.repeat(50) + '\n');
  console.log('🎉 Pruebas completadas!');
}

// Ejecutar pruebas si el archivo se ejecuta directamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  createTestBusiness,
  createTestClient,
  createTestService,
  getBusinessStats,
  checkServerHealth,
  runTests
};

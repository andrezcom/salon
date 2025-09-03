// Archivo de prueba simple para verificar rutas básicas
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testBasicRoutes() {
  console.log('🧪 Probando rutas básicas...\n');
  
  try {
    // Probar ruta de usuarios
    console.log('👤 Probando ruta de usuarios...');
    const userResponse = await axios.get(`${BASE_URL}/user`);
    console.log('✅ Usuarios:', userResponse.status);
  } catch (error) {
    console.log('❌ Error en usuarios:', error.response?.status || error.message);
  }
  
  try {
    // Probar ruta de clientes
    console.log('\n👥 Probando ruta de clientes...');
    const clientResponse = await axios.get(`${BASE_URL}/client`);
    console.log('✅ Clientes:', clientResponse.status);
  } catch (error) {
    console.log('❌ Error en clientes:', error.response?.status || error.message);
  }
  
  try {
    // Probar ruta de productos
    console.log('\n📦 Probando ruta de productos...');
    const productResponse = await axios.get(`${BASE_URL}/product`);
    console.log('✅ Productos:', productResponse.status);
  } catch (error) {
    console.log('❌ Error en productos:', error.response?.status || error.message);
  }
  
  try {
    // Probar ruta de servicios
    console.log('\n💇 Probando ruta de servicios...');
    const serviceResponse = await axios.get(`${BASE_URL}/service`);
    console.log('✅ Servicios:', serviceResponse.status);
  } catch (error) {
    console.log('❌ Error en servicios:', error.response?.status || error.message);
  }
  
  try {
    // Probar ruta de negocios
    console.log('\n🏢 Probando ruta de negocios...');
    const businessResponse = await axios.get(`${BASE_URL}/business`);
    console.log('✅ Negocios:', businessResponse.status);
  } catch (error) {
    console.log('❌ Error en negocios:', error.response?.status || error.message);
  }
  
  console.log('\n🎉 Pruebas de rutas básicas completadas!');
}

testBasicRoutes().catch(console.error);

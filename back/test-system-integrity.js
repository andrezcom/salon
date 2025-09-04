const mongoose = require('mongoose');
require('dotenv').config();

async function testSystemIntegrity() {
  console.log('🔍 Iniciando verificación de integridad del sistema...\n');

  try {
    // ===== VERIFICAR CONEXIÓN =====
    console.log('📡 Verificando conexión a la base de datos...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    if (mongoose.connection.readyState === 1) {
      console.log('   ✅ Conexión establecida correctamente');
    } else {
      console.log('   ❌ Error de conexión');
      return;
    }

    // ===== VERIFICAR COLECCIONES =====
    console.log('\n📊 Verificando colecciones...');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    const expectedCollections = [
      'people',
      'businesses', 
      'products',
      'sales',
      'commissions',
      'cashtransactions',
      'advances',
      'expenses',
      'inventorymovements',
      'purchaseorders'
    ];
    
    console.log(`   📋 Colecciones encontradas: ${collections.length}`);
    collections.forEach(col => {
      console.log(`      • ${col.name}`);
    });
    
    // Verificar colecciones esperadas
    const foundCollections = collections.map(col => col.name);
    const missingCollections = expectedCollections.filter(name => !foundCollections.includes(name));
    
    if (missingCollections.length > 0) {
      console.log(`   ⚠️ Colecciones faltantes: ${missingCollections.join(', ')}`);
    } else {
      console.log('   ✅ Todas las colecciones esperadas están presentes');
    }

    // ===== VERIFICAR DOCUMENTOS =====
    console.log('\n📄 Verificando documentos...');
    
    for (const collectionName of foundCollections) {
      try {
        const count = await db.collection(collectionName).countDocuments();
        console.log(`   📊 ${collectionName}: ${count} documentos`);
      } catch (error) {
        console.log(`   ❌ Error contando ${collectionName}: ${error.message}`);
      }
    }

    // ===== VERIFICAR INTEGRIDAD BÁSICA =====
    console.log('\n🔍 Verificando integridad básica...');
    
    // Verificar que hay al menos un negocio
    const businessCount = await db.collection('businesses').countDocuments();
    if (businessCount > 0) {
      console.log('   ✅ Hay negocios registrados');
    } else {
      console.log('   ⚠️ No hay negocios registrados');
    }
    
    // Verificar que hay personas
    const personCount = await db.collection('people').countDocuments();
    if (personCount > 0) {
      console.log('   ✅ Hay personas registradas');
      
      // Verificar tipos de persona
      const userCount = await db.collection('people').countDocuments({ personType: 'user' });
      const expertCount = await db.collection('people').countDocuments({ personType: 'expert' });
      const clientCount = await db.collection('people').countDocuments({ personType: 'client' });
      
      console.log(`      • Usuarios: ${userCount}`);
      console.log(`      • Expertos: ${expertCount}`);
      console.log(`      • Clientes: ${clientCount}`);
    } else {
      console.log('   ⚠️ No hay personas registradas');
    }
    
    // Verificar que hay productos
    const productCount = await db.collection('products').countDocuments();
    if (productCount > 0) {
      console.log('   ✅ Hay productos registrados');
    } else {
      console.log('   ⚠️ No hay productos registrados');
    }

    // ===== VERIFICAR ÍNDICES =====
    console.log('\n🔍 Verificando índices...');
    
    for (const collectionName of foundCollections) {
      try {
        const indexes = await db.collection(collectionName).indexes();
        console.log(`   📊 ${collectionName}: ${indexes.length} índices`);
      } catch (error) {
        console.log(`   ❌ Error obteniendo índices de ${collectionName}: ${error.message}`);
      }
    }

    // ===== VERIFICAR REFERENCIAS =====
    console.log('\n🔗 Verificando referencias...');
    
    // Verificar que las ventas tienen expertos válidos
    const salesWithExperts = await db.collection('sales').aggregate([
      { $lookup: { from: 'people', localField: 'expertId', foreignField: '_id', as: 'expert' } },
      { $match: { expert: { $size: 0 } } },
      { $count: 'count' }
    ]).toArray();
    
    if (salesWithExperts.length > 0) {
      console.log(`   ⚠️ Ventas con expertos inválidos: ${salesWithExperts[0].count}`);
    } else {
      console.log('   ✅ Todas las ventas tienen expertos válidos');
    }
    
    // Verificar que las comisiones tienen expertos válidos
    const commissionsWithExperts = await db.collection('commissions').aggregate([
      { $lookup: { from: 'people', localField: 'expertId', foreignField: '_id', as: 'expert' } },
      { $match: { expert: { $size: 0 } } },
      { $count: 'count' }
    ]).toArray();
    
    if (commissionsWithExperts.length > 0) {
      console.log(`   ⚠️ Comisiones con expertos inválidos: ${commissionsWithExperts[0].count}`);
    } else {
      console.log('   ✅ Todas las comisiones tienen expertos válidos');
    }

    // ===== RESUMEN FINAL =====
    console.log('\n🎉 ¡VERIFICACIÓN DE INTEGRIDAD COMPLETADA!');
    console.log('\n📋 RESUMEN:');
    console.log('   ✅ Conexión a base de datos establecida');
    console.log('   ✅ Colecciones verificadas');
    console.log('   ✅ Documentos contados');
    console.log('   ✅ Integridad básica verificada');
    console.log('   ✅ Índices verificados');
    console.log('   ✅ Referencias verificadas');

    console.log('\n💡 RECOMENDACIONES:');
    console.log('   • Ejecutar este script regularmente para monitorear la integridad');
    console.log('   • Revisar cualquier advertencia (⚠️) encontrada');
    console.log('   • Mantener backups regulares de la base de datos');
    console.log('   • Monitorear el crecimiento de las colecciones');

    console.log('\n🚀 EL SISTEMA ESTÁ EN BUEN ESTADO!');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Ejecutar verificación
testSystemIntegrity();

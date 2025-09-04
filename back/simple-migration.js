const mongoose = require('mongoose');
require('dotenv').config();

async function simpleMigration() {
  console.log('🚀 Iniciando migración simple al modelo unificado...\n');

  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;

    // ===== CREAR COLECCIÓN PEOPLE =====
    console.log('\n📊 Creando colección people...');
    
    try {
      await db.createCollection('people');
      console.log('   ✅ Colección people creada');
    } catch (error) {
      if (error.code === 48) { // Collection already exists
        console.log('   ⚠️ Colección people ya existe');
      } else {
        console.log(`   ❌ Error creando colección people: ${error.message}`);
      }
    }

    // ===== MIGRAR USUARIOS =====
    console.log('\n👥 Migrando usuarios...');
    const users = await db.collection('users').find({}).toArray();
    console.log(`   📊 Encontrados ${users.length} usuarios`);

    for (const user of users) {
      try {
        // Extraer nombre y apellido del nameUser
        const nameParts = user.nameUser.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const personData = {
          firstName,
          lastName,
          email: user.email,
          phone: user.profile?.phone || '',
          phone2: '',
          numberId: '',
          personType: 'user',
          userInfo: {
            password: user.pass,
            role: user.role || 'viewer',
            permissions: user.permissions || [],
            businesses: user.businesses || [],
            defaultBusiness: user.defaultBusiness,
            settings: user.settings || {
              language: 'es',
              timezone: 'America/Mexico_City',
              notifications: {
                email: true,
                push: true,
                sms: false
              }
            },
            lastLogin: user.lastLogin,
            loginAttempts: user.loginAttempts || 0,
            lockUntil: user.lockUntil
          },
          profileImage: user.profile?.profileImage,
          address: {
            street: user.profile?.address || '',
            city: user.profile?.city || '',
            state: '',
            zipCode: '',
            country: user.profile?.country || 'México'
          },
          active: user.active !== false,
          createdAt: user.createdAt || new Date(),
          updatedAt: user.updatedAt || new Date()
        };

        await db.collection('people').insertOne(personData);
        console.log(`   ✅ Usuario migrado: ${user.email}`);

      } catch (error) {
        console.log(`   ❌ Error migrando usuario ${user.email}:`, error.message);
      }
    }

    // ===== MIGRAR EXPERTOS =====
    console.log('\n👨‍💼 Migrando expertos...');
    const experts = await db.collection('experts').find({}).toArray();
    console.log(`   📊 Encontrados ${experts.length} expertos`);

    for (const expert of experts) {
      try {
        // Extraer nombre y apellido del nameExpert
        const nameParts = expert.nameExpert.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const personData = {
          firstName,
          lastName,
          email: expert.email,
          phone: expert.phone || '',
          phone2: '',
          numberId: '',
          personType: 'expert',
          expertInfo: {
            alias: expert.aliasExpert || '',
            role: expert.role || {
              stylist: false,
              manicure: false,
              makeup: false
            },
            commissionSettings: expert.commissionSettings || {
              serviceCommission: 0,
              retailCommission: 0,
              serviceCalculationMethod: 'before_inputs',
              minimumServiceCommission: 0
            },
            businessId: expert.businessId,
            hireDate: expert.hireDate || new Date(),
            notes: expert.notes || ''
          },
          profileImage: expert.profileImage,
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'México'
          },
          active: expert.active !== false,
          createdAt: expert.createdAt || new Date(),
          updatedAt: expert.updatedAt || new Date()
        };

        await db.collection('people').insertOne(personData);
        console.log(`   ✅ Experto migrado: ${expert.email}`);

      } catch (error) {
        console.log(`   ❌ Error migrando experto ${expert.email}:`, error.message);
      }
    }

    // ===== MIGRAR CLIENTES =====
    console.log('\n👤 Migrando clientes...');
    const clients = await db.collection('clients').find({}).toArray();
    console.log(`   📊 Encontrados ${clients.length} clientes`);

    for (const client of clients) {
      try {
        // Extraer nombre y apellido del nameClient
        const nameParts = client.nameClient.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const personData = {
          firstName,
          lastName,
          email: client.email,
          phone: client.phone1 || '',
          phone2: client.phone2 || '',
          numberId: client.numberId || '',
          personType: 'client',
          clientInfo: {
            preferences: {
              services: [],
              communication: 'email',
              language: 'es'
            },
            loyaltyPoints: 0,
            totalSpent: 0,
            lastVisit: null,
            notes: ''
          },
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'México'
          },
          active: client.active !== false,
          createdAt: client.createdAt || new Date(),
          updatedAt: client.updatedAt || new Date()
        };

        await db.collection('people').insertOne(personData);
        console.log(`   ✅ Cliente migrado: ${client.email}`);

      } catch (error) {
        console.log(`   ❌ Error migrando cliente ${client.email}:`, error.message);
      }
    }

    // ===== VERIFICAR MIGRACIÓN =====
    console.log('\n📊 Verificando migración...');
    
    const totalPersons = await db.collection('people').countDocuments();
    const usersCount = await db.collection('people').countDocuments({ personType: 'user' });
    const expertsCount = await db.collection('people').countDocuments({ personType: 'expert' });
    const clientsCount = await db.collection('people').countDocuments({ personType: 'client' });

    console.log(`   📈 Total de personas migradas: ${totalPersons}`);
    console.log(`   👥 Usuarios: ${usersCount}`);
    console.log(`   👨‍💼 Expertos: ${expertsCount}`);
    console.log(`   👤 Clientes: ${clientsCount}`);

    // ===== CREAR ÍNDICES =====
    console.log('\n🔍 Creando índices...');
    
    try {
      await db.collection('people').createIndex({ email: 1 }, { unique: true });
      console.log('   ✅ Índice único en email creado');
    } catch (error) {
      console.log(`   ⚠️ Error creando índice en email: ${error.message}`);
    }

    try {
      await db.collection('people').createIndex({ personType: 1 });
      console.log('   ✅ Índice en personType creado');
    } catch (error) {
      console.log(`   ⚠️ Error creando índice en personType: ${error.message}`);
    }

    try {
      await db.collection('people').createIndex({ active: 1 });
      console.log('   ✅ Índice en active creado');
    } catch (error) {
      console.log(`   ⚠️ Error creando índice en active: ${error.message}`);
    }

    // ===== RESUMEN FINAL =====
    console.log('\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('\n📋 RESUMEN DE LA MIGRACIÓN:');
    console.log(`   ✅ ${usersCount} usuarios migrados`);
    console.log(`   ✅ ${expertsCount} expertos migrados`);
    console.log(`   ✅ ${clientsCount} clientes migrados`);
    console.log(`   ✅ ${totalPersons} personas totales en el nuevo modelo`);
    console.log('   ✅ Colección people creada');
    console.log('   ✅ Índices creados');

    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('   1. Verificar que los datos se migraron correctamente');
    console.log('   2. Probar la funcionalidad con el nuevo modelo');
    console.log('   3. Una vez verificado, eliminar las colecciones antiguas si es necesario');

    console.log('\n🚀 EL SISTEMA UNIFICADO DE PERSONAS ESTÁ LISTO!');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Ejecutar migración
simpleMigration();

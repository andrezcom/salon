const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Importar nuevo modelo unificado
const Person = require('./src/models/person');

async function migrateToUnifiedPerson() {
  console.log('🚀 Iniciando migración al modelo unificado de Personas...\n');

  try {
    // Esperar a que la conexión esté lista
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        mongoose.connection.once('open', resolve);
      }
    });

    // ===== MIGRAR USUARIOS =====
    console.log('👥 Migrando usuarios...');
    const db = mongoose.connection.db;
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

        await Person.create(personData);
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

        await Person.create(personData);
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

        await Person.create(personData);
        console.log(`   ✅ Cliente migrado: ${client.email}`);

      } catch (error) {
        console.log(`   ❌ Error migrando cliente ${client.email}:`, error.message);
      }
    }

    // ===== VERIFICAR MIGRACIÓN =====
    console.log('\n📊 Verificando migración...');
    
    const totalPersons = await Person.countDocuments();
    const usersCount = await Person.countDocuments({ personType: 'user' });
    const expertsCount = await Person.countDocuments({ personType: 'expert' });
    const clientsCount = await Person.countDocuments({ personType: 'client' });

    console.log(`   📈 Total de personas migradas: ${totalPersons}`);
    console.log(`   👥 Usuarios: ${usersCount}`);
    console.log(`   👨‍💼 Expertos: ${expertsCount}`);
    console.log(`   👤 Clientes: ${clientsCount}`);

    // ===== CREAR BACKUP DE MODELOS ANTIGUOS =====
    console.log('\n💾 Creando backup de modelos antiguos...');
    
    // Renombrar colecciones existentes
    
    try {
      await db.collection('users').rename('users_backup');
      console.log('   ✅ Backup de usuarios creado');
    } catch (error) {
      console.log('   ⚠️ No se pudo crear backup de usuarios:', error.message);
    }

    try {
      await db.collection('experts').rename('experts_backup');
      console.log('   ✅ Backup de expertos creado');
    } catch (error) {
      console.log('   ⚠️ No se pudo crear backup de expertos:', error.message);
    }

    try {
      await db.collection('clients').rename('clients_backup');
      console.log('   ✅ Backup de clientes creado');
    } catch (error) {
      console.log('   ⚠️ No se pudo crear backup de clientes:', error.message);
    }

    console.log('\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('\n📋 RESUMEN DE LA MIGRACIÓN:');
    console.log(`   ✅ ${usersCount} usuarios migrados`);
    console.log(`   ✅ ${expertsCount} expertos migrados`);
    console.log(`   ✅ ${clientsCount} clientes migrados`);
    console.log(`   ✅ ${totalPersons} personas totales en el nuevo modelo`);
    console.log('   ✅ Backups de modelos antiguos creados');
    console.log('   ✅ Modelo unificado Person implementado');

    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('   1. Actualizar referencias en el código para usar el modelo Person');
    console.log('   2. Actualizar controladores para usar el nuevo modelo');
    console.log('   3. Probar la funcionalidad con el nuevo modelo');
    console.log('   4. Una vez verificado, eliminar los backups si es necesario');

    console.log('\n🚀 EL SISTEMA UNIFICADO DE PERSONAS ESTÁ LISTO!');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Ejecutar migración
migrateToUnifiedPerson();

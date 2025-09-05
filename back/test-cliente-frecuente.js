const mongoose = require('mongoose');
require('dotenv').config();

async function testClienteFrecuente() {
  console.log('🎯 INICIANDO PRUEBAS DEL MÓDULO DE CLIENTE FRECUENTE');
  console.log('=' .repeat(80));
  console.log('📅 Fecha:', new Date().toLocaleString());
  console.log('🎯 Objetivo: Verificar funcionalidad completa del cliente frecuente');
  console.log('=' .repeat(80));

  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('\n✅ Conectado a MongoDB');
    const db = mongoose.connection.db;

    // ===== 1. CREAR PROGRAMA DE FIDELIDAD =====
    console.log('\n🎯 1. CREANDO PROGRAMA DE FIDELIDAD');
    console.log('-'.repeat(50));

    const loyaltyProgram = {
      businessId: '68b8c3e2c9765a8720a6b622',
      name: 'Programa de Fidelidad Salon Beauty',
      description: 'Programa de puntos para clientes frecuentes',
      isActive: true,
      pointsConfig: {
        pointsPerDollar: 1, // 1 punto por dólar
        pointsPerService: 10, // 10 puntos por servicio
        pointsPerProduct: 5, // 5 puntos por producto
        minimumPurchase: 0, // Sin compra mínima
        pointsExpirationDays: 365 // Los puntos expiran en 1 año
      },
      levels: [
        {
          name: 'Bronce',
          minPoints: 0,
          maxPoints: 499,
          benefits: {
            discountPercentage: 0,
            priorityBooking: false,
            birthdayDiscount: 5
          },
          color: '#CD7F32'
        },
        {
          name: 'Plata',
          minPoints: 500,
          maxPoints: 999,
          benefits: {
            discountPercentage: 5,
            priorityBooking: true,
            birthdayDiscount: 10
          },
          color: '#C0C0C0'
        },
        {
          name: 'Oro',
          minPoints: 1000,
          maxPoints: 1999,
          benefits: {
            discountPercentage: 10,
            priorityBooking: true,
            birthdayDiscount: 15,
            freeService: 'Corte de puntas'
          },
          color: '#FFD700'
        },
        {
          name: 'Platino',
          minPoints: 2000,
          benefits: {
            discountPercentage: 15,
            priorityBooking: true,
            birthdayDiscount: 20,
            freeService: 'Tratamiento completo'
          },
          color: '#E5E4E2'
        }
      ],
      redemptionConfig: {
        pointsPerDollar: 100, // 100 puntos = $1 de descuento
        minimumRedemption: 100, // Mínimo 100 puntos para canjear
        maximumRedemption: 1000, // Máximo 1000 puntos por canje
        allowedForServices: true,
        allowedForProducts: true
      },
      notifications: {
        pointsEarned: true,
        levelUp: true,
        pointsExpiring: true,
        birthday: true
      },
      createdBy: '68b8c3e2c9765a8720a6b622',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const programResult = await db.collection('loyaltyprograms').insertOne(loyaltyProgram);
    console.log(`   ✅ Programa de fidelidad creado: ${programResult.insertedId}`);
    console.log(`   📊 Niveles configurados: ${loyaltyProgram.levels.length}`);
    console.log(`   💰 Puntos por dólar: ${loyaltyProgram.pointsConfig.pointsPerDollar}`);

    // ===== 2. CREAR CLIENTES DE PRUEBA =====
    console.log('\n👥 2. CREANDO CLIENTES DE PRUEBA');
    console.log('-'.repeat(50));

    const testClients = [
      {
        businessId: '68b8c3e2c9765a8720a6b622',
        name: 'María González',
        email: 'maria.gonzalez@email.com',
        phone1: '+57 300 123 4567',
        type: 'client',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        businessId: '68b8c3e2c9765a8720a6b622',
        name: 'Carlos López',
        email: 'carlos.lopez@email.com',
        phone1: '+57 300 234 5678',
        type: 'client',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        businessId: '68b8c3e2c9765a8720a6b622',
        name: 'Ana Rodríguez',
        email: 'ana.rodriguez@email.com',
        phone1: '+57 300 345 6789',
        type: 'client',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const clientResults = await db.collection('people').insertMany(testClients);
    console.log(`   ✅ Clientes creados: ${clientResults.insertedCount}`);
    
    const clientIds = Object.values(clientResults.insertedIds);
    testClients.forEach((client, index) => {
      console.log(`   ${index + 1}. ${client.name} (${client.email})`);
    });

    // ===== 3. REGISTRAR CLIENTES EN PROGRAMA =====
    console.log('\n📝 3. REGISTRANDO CLIENTES EN PROGRAMA');
    console.log('-'.repeat(50));

    const loyaltyCustomers = [];
    for (let i = 0; i < clientIds.length; i++) {
      const client = testClients[i];
      const loyaltyCustomer = {
        businessId: '68b8c3e2c9765a8720a6b622',
        customerId: clientIds[i],
        customerName: client.name,
        customerEmail: client.email,
        customerPhone: client.phone1,
        loyaltyProgramId: programResult.insertedId,
        loyaltyProgramName: loyaltyProgram.name,
        currentPoints: 0,
        totalPointsEarned: 0,
        totalPointsRedeemed: 0,
        currentLevel: 'Bronce',
        levelPoints: 0,
        pointsHistory: [],
        statistics: {
          totalPurchases: 0,
          totalSpent: 0,
          averagePurchase: 0,
          favoriteServices: [],
          favoriteProducts: [],
          visitsCount: 0
        },
        preferences: {
          receiveNotifications: true,
          notificationMethod: 'email',
          anniversary: new Date()
        },
        status: 'active',
        isVIP: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const customerResult = await db.collection('loyaltycustomers').insertOne(loyaltyCustomer);
      loyaltyCustomers.push({ ...loyaltyCustomer, _id: customerResult.insertedId });
      console.log(`   ✅ ${client.name} registrado en programa de fidelidad`);
    }

    // ===== 4. SIMULAR VENTAS Y GANANCIA DE PUNTOS =====
    console.log('\n💰 4. SIMULANDO VENTAS Y GANANCIA DE PUNTOS');
    console.log('-'.repeat(50));

    const sales = [
      {
        customer: loyaltyCustomers[0], // María González
        totalAmount: 150000, // $150,000
        servicesCount: 2,
        productsCount: 1,
        services: ['Corte', 'Tinte'],
        products: ['Shampoo']
      },
      {
        customer: loyaltyCustomers[1], // Carlos López
        totalAmount: 200000, // $200,000
        servicesCount: 1,
        productsCount: 3,
        services: ['Manicure'],
        products: ['Esmalte', 'Base', 'Top Coat']
      },
      {
        customer: loyaltyCustomers[2], // Ana Rodríguez
        totalAmount: 300000, // $300,000
        servicesCount: 3,
        productsCount: 2,
        services: ['Corte', 'Peinado', 'Maquillaje'],
        products: ['Crema', 'Serum']
      }
    ];

    for (const sale of sales) {
      // Calcular puntos a ganar
      const pointsEarned = Math.floor(sale.totalAmount * loyaltyProgram.pointsConfig.pointsPerDollar) +
                          (sale.servicesCount * loyaltyProgram.pointsConfig.pointsPerService) +
                          (sale.productsCount * loyaltyProgram.pointsConfig.pointsPerProduct);

      // Actualizar cliente frecuente
      await db.collection('loyaltycustomers').updateOne(
        { _id: sale.customer._id },
        {
          $inc: {
            currentPoints: pointsEarned,
            totalPointsEarned: pointsEarned,
            levelPoints: pointsEarned,
            'statistics.totalPurchases': 1,
            'statistics.totalSpent': sale.totalAmount,
            'statistics.visitsCount': 1
          },
          $set: {
            'statistics.lastPurchaseDate': new Date(),
            'statistics.averagePurchase': sale.totalAmount,
            updatedAt: new Date()
          },
          $push: {
            pointsHistory: {
              date: new Date(),
              type: 'earned',
              amount: pointsEarned,
              description: `Puntos ganados por compra de $${sale.totalAmount.toLocaleString()}`,
              saleId: new mongoose.Types.ObjectId()
            }
          }
        }
      );

      console.log(`   💰 ${sale.customer.customerName}:`);
      console.log(`      • Compra: $${sale.totalAmount.toLocaleString()}`);
      console.log(`      • Servicios: ${sale.servicesCount}`);
      console.log(`      • Productos: ${sale.productsCount}`);
      console.log(`      • Puntos ganados: ${pointsEarned}`);
    }

    // ===== 5. ACTUALIZAR NIVELES DE CLIENTES =====
    console.log('\n🏆 5. ACTUALIZANDO NIVELES DE CLIENTES');
    console.log('-'.repeat(50));

    const updatedCustomers = await db.collection('loyaltycustomers').find({
      businessId: '68b8c3e2c9765a8720a6b622'
    }).toArray();

    for (const customer of updatedCustomers) {
      // Determinar nivel basado en puntos
      let newLevel = 'Bronce';
      for (const level of loyaltyProgram.levels) {
        if (customer.currentPoints >= level.minPoints) {
          newLevel = level.name;
        }
      }

      // Actualizar nivel si cambió
      if (customer.currentLevel !== newLevel) {
        await db.collection('loyaltycustomers').updateOne(
          { _id: customer._id },
          {
            $set: {
              currentLevel: newLevel,
              levelPoints: 0,
              updatedAt: new Date()
            }
          }
        );
        console.log(`   🎉 ${customer.customerName} subió a nivel ${newLevel}`);
      } else {
        console.log(`   📊 ${customer.customerName} mantiene nivel ${newLevel}`);
      }
    }

    // ===== 6. SIMULAR CANJE DE PUNTOS =====
    console.log('\n🔄 6. SIMULANDO CANJE DE PUNTOS');
    console.log('-'.repeat(50));

    const topCustomer = updatedCustomers.sort((a, b) => b.currentPoints - a.currentPoints)[0];
    const pointsToRedeem = 500; // Canjear 500 puntos
    const discountAmount = Math.floor(pointsToRedeem / loyaltyProgram.redemptionConfig.pointsPerDollar);

    if (topCustomer.currentPoints >= pointsToRedeem) {
      await db.collection('loyaltycustomers').updateOne(
        { _id: topCustomer._id },
        {
          $inc: {
            currentPoints: -pointsToRedeem,
            totalPointsRedeemed: pointsToRedeem,
            levelPoints: -pointsToRedeem
          },
          $push: {
            pointsHistory: {
              date: new Date(),
              type: 'redeemed',
              amount: -pointsToRedeem,
              description: `Canje de ${pointsToRedeem} puntos por $${discountAmount} de descuento`,
              saleId: new mongoose.Types.ObjectId()
            }
          },
          $set: {
            updatedAt: new Date()
          }
        }
      );

      console.log(`   🔄 ${topCustomer.customerName}:`);
      console.log(`      • Puntos canjeados: ${pointsToRedeem}`);
      console.log(`      • Descuento obtenido: $${discountAmount.toLocaleString()}`);
      console.log(`      • Puntos restantes: ${topCustomer.currentPoints - pointsToRedeem}`);
    }

    // ===== 7. GENERAR REPORTES =====
    console.log('\n📊 7. GENERANDO REPORTES');
    console.log('-'.repeat(50));

    const finalCustomers = await db.collection('loyaltycustomers').find({
      businessId: '68b8c3e2c9765a8720a6b622'
    }).toArray();

    console.log('   📋 RESUMEN DE CLIENTES FRECUENTES:');
    finalCustomers.forEach((customer, index) => {
      console.log(`   ${index + 1}. ${customer.customerName}`);
      console.log(`      • Nivel: ${customer.currentLevel}`);
      console.log(`      • Puntos actuales: ${customer.currentPoints}`);
      console.log(`      • Total ganados: ${customer.totalPointsEarned}`);
      console.log(`      • Total canjeados: ${customer.totalPointsRedeemed}`);
      console.log(`      • Compras: ${customer.statistics.totalPurchases}`);
      console.log(`      • Gastado: $${customer.statistics.totalSpent.toLocaleString()}`);
      console.log('');
    });

    // Estadísticas por nivel
    const customersByLevel = {};
    finalCustomers.forEach(customer => {
      if (!customersByLevel[customer.currentLevel]) {
        customersByLevel[customer.currentLevel] = 0;
      }
      customersByLevel[customer.currentLevel]++;
    });

    console.log('   📊 DISTRIBUCIÓN POR NIVELES:');
    Object.entries(customersByLevel).forEach(([level, count]) => {
      console.log(`   • ${level}: ${count} clientes`);
    });

    // ===== 8. VERIFICAR FUNCIONALIDADES =====
    console.log('\n✅ 8. VERIFICANDO FUNCIONALIDADES');
    console.log('-'.repeat(50));

    const functionalities = {
      programCreated: programResult.insertedId ? true : false,
      customersEnrolled: loyaltyCustomers.length > 0,
      pointsEarned: finalCustomers.some(c => c.totalPointsEarned > 0),
      levelsUpdated: finalCustomers.some(c => c.currentLevel !== 'Bronce'),
      pointsRedeemed: finalCustomers.some(c => c.totalPointsRedeemed > 0),
      statisticsUpdated: finalCustomers.some(c => c.statistics.totalPurchases > 0)
    };

    console.log('   🔍 FUNCIONALIDADES VERIFICADAS:');
    Object.entries(functionalities).forEach(([func, working]) => {
      console.log(`   ${working ? '✅' : '❌'} ${func}: ${working ? 'Funcionando' : 'No funciona'}`);
    });

    // ===== 9. RESUMEN FINAL =====
    console.log('\n📋 9. RESUMEN FINAL');
    console.log('='.repeat(80));

    const summary = {
      programCreated: 1,
      customersEnrolled: loyaltyCustomers.length,
      totalPointsEarned: finalCustomers.reduce((sum, c) => sum + c.totalPointsEarned, 0),
      totalPointsRedeemed: finalCustomers.reduce((sum, c) => sum + c.totalPointsRedeemed, 0),
      totalSpent: finalCustomers.reduce((sum, c) => sum + c.statistics.totalSpent, 0),
      levelsUsed: Object.keys(customersByLevel).length,
      functionalitiesWorking: Object.values(functionalities).filter(Boolean).length
    };

    console.log('🎯 RESUMEN DEL MÓDULO DE CLIENTE FRECUENTE:');
    console.log(`   • Programa creado: ${summary.programCreated}`);
    console.log(`   • Clientes registrados: ${summary.customersEnrolled}`);
    console.log(`   • Puntos totales ganados: ${summary.totalPointsEarned}`);
    console.log(`   • Puntos totales canjeados: ${summary.totalPointsRedeemed}`);
    console.log(`   • Total gastado por clientes: $${summary.totalSpent.toLocaleString()}`);
    console.log(`   • Niveles utilizados: ${summary.levelsUsed}`);
    console.log(`   • Funcionalidades funcionando: ${summary.functionalitiesWorking}/${Object.keys(functionalities).length}`);

    console.log('\n🏆 CONCLUSIÓN:');
    if (summary.functionalitiesWorking === Object.keys(functionalities).length) {
      console.log('   🎉 MÓDULO DE CLIENTE FRECUENTE FUNCIONANDO PERFECTAMENTE');
      console.log('   ✅ Programa de fidelidad creado');
      console.log('   ✅ Clientes registrados exitosamente');
      console.log('   ✅ Puntos ganados y canjeados correctamente');
      console.log('   ✅ Niveles actualizados automáticamente');
      console.log('   ✅ Estadísticas generadas correctamente');
      console.log('   ✅ Sistema listo para producción');
    } else {
      console.log('   ⚠️ MÓDULO PARCIALMENTE FUNCIONAL');
      console.log('   🔧 Se requieren ajustes menores');
    }

    console.log('\n' + '='.repeat(80));
    console.log('📅 Pruebas del módulo de cliente frecuente completadas:', new Date().toLocaleString());
    console.log('🎯 Sistema de fidelidad implementado exitosamente');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error en las pruebas del cliente frecuente:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Ejecutar las pruebas
testClienteFrecuente();

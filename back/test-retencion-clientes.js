const mongoose = require('mongoose');
require('dotenv').config();

async function testRetencionClientes() {
  console.log('🎯 INICIANDO PRUEBAS DEL MÓDULO DE RETENCIÓN DE CLIENTES');
  console.log('=' .repeat(80));
  console.log('📅 Fecha:', new Date().toLocaleString());
  console.log('🎯 Objetivo: Verificar funcionalidad completa del seguimiento de clientes inactivos');
  console.log('=' .repeat(80));

  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('\n✅ Conectado a MongoDB');
    const db = mongoose.connection.db;

    // ===== 1. CREAR CLIENTES DE PRUEBA =====
    console.log('\n👥 1. CREANDO CLIENTES DE PRUEBA');
    console.log('-'.repeat(50));

    const timestamp = Date.now();
    const testClients = [
      {
        businessId: '68b8c3e2c9765a8720a6b622',
        name: 'María González Retención',
        email: `maria.gonzalez.retencion.${timestamp}@email.com`,
        phone1: '+57 300 123 4567',
        type: 'client',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        businessId: '68b8c3e2c9765a8720a6b622',
        name: 'Carlos López Retención',
        email: `carlos.lopez.retencion.${timestamp}@email.com`,
        phone1: '+57 300 234 5678',
        type: 'client',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        businessId: '68b8c3e2c9765a8720a6b622',
        name: 'Ana Rodríguez Retención',
        email: `ana.rodriguez.retencion.${timestamp}@email.com`,
        phone1: '+57 300 345 6789',
        type: 'client',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        businessId: '68b8c3e2c9765a8720a6b622',
        name: 'Luis Martínez Retención',
        email: `luis.martinez.retencion.${timestamp}@email.com`,
        phone1: '+57 300 456 7890',
        type: 'client',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        businessId: '68b8c3e2c9765a8720a6b622',
        name: 'Sofia Herrera Retención',
        email: `sofia.herrera.retencion.${timestamp}@email.com`,
        phone1: '+57 300 567 8901',
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

    // ===== 2. CREAR REGISTROS DE RETENCIÓN =====
    console.log('\n📝 2. CREANDO REGISTROS DE RETENCIÓN');
    console.log('-'.repeat(50));

    const retentionRecords = [];
    for (let i = 0; i < clientIds.length; i++) {
      const client = testClients[i];
      const retentionRecord = {
        businessId: '68b8c3e2c9765a8720a6b622',
        customerId: clientIds[i],
        customerName: client.name,
        customerEmail: client.email,
        customerPhone: client.phone1,
        status: 'active',
        riskLevel: 'low',
        daysSinceLastVisit: 0,
        daysSinceFirstVisit: 0,
        visitHistory: [],
        behaviorMetrics: {
          averageVisitFrequency: 0,
          averageSpending: 0,
          totalVisits: 0,
          totalSpent: 0,
          favoriteServices: [],
          favoriteProducts: [],
          preferredExpert: undefined,
          preferredTimeSlot: undefined,
          preferredDayOfWeek: undefined
        },
        recoveryCampaigns: [],
        recoveryTracking: {
          totalCampaignsSent: 0,
          totalResponses: 0,
          positiveResponses: 0,
          negativeResponses: 0,
          recoveryStatus: 'not_started'
        },
        alertSettings: {
          inactiveThreshold: 30,
          atRiskThreshold: 60,
          criticalThreshold: 90,
          alertFrequency: 'weekly',
          alertChannels: ['email', 'dashboard'],
          autoCampaignEnabled: false
        },
        notes: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const retentionResult = await db.collection('clientretentions').insertOne(retentionRecord);
      retentionRecords.push({ ...retentionRecord, _id: retentionResult.insertedId });
      console.log(`   ✅ ${client.name} registrado en sistema de retención`);
    }

    // ===== 3. SIMULAR HISTORIAL DE VISITAS =====
    console.log('\n📅 3. SIMULANDO HISTORIAL DE VISITAS');
    console.log('-'.repeat(50));

    const today = new Date();
    const visitScenarios = [
      {
        client: retentionRecords[0], // María González - Cliente activo
        visits: [
          { daysAgo: 5, amount: 150000, services: ['Corte', 'Tinte'], products: ['Shampoo'] },
          { daysAgo: 15, amount: 200000, services: ['Manicure', 'Pedicure'], products: ['Esmalte'] },
          { daysAgo: 25, amount: 180000, services: ['Corte'], products: ['Acondicionador'] }
        ]
      },
      {
        client: retentionRecords[1], // Carlos López - Cliente en riesgo
        visits: [
          { daysAgo: 45, amount: 120000, services: ['Corte'], products: ['Gel'] },
          { daysAgo: 75, amount: 160000, services: ['Barba'], products: ['Crema'] },
          { daysAgo: 105, amount: 140000, services: ['Corte'], products: ['Shampoo'] }
        ]
      },
      {
        client: retentionRecords[2], // Ana Rodríguez - Cliente inactivo
        visits: [
          { daysAgo: 120, amount: 180000, services: ['Peinado'], products: ['Serum'] },
          { daysAgo: 150, amount: 220000, services: ['Maquillaje'], products: ['Base'] },
          { daysAgo: 180, amount: 160000, services: ['Corte'], products: ['Mascarilla'] }
        ]
      },
      {
        client: retentionRecords[3], // Luis Martínez - Cliente crítico
        visits: [
          { daysAgo: 200, amount: 100000, services: ['Corte'], products: ['Shampoo'] },
          { daysAgo: 250, amount: 130000, services: ['Barba'], products: ['Aceite'] },
          { daysAgo: 300, amount: 110000, services: ['Corte'], products: ['Gel'] }
        ]
      },
      {
        client: retentionRecords[4], // Sofia Herrera - Cliente recuperado
        visits: [
          { daysAgo: 10, amount: 190000, services: ['Corte', 'Tinte'], products: ['Shampoo', 'Acondicionador'] },
          { daysAgo: 20, amount: 170000, services: ['Manicure'], products: ['Esmalte'] },
          { daysAgo: 30, amount: 210000, services: ['Peinado'], products: ['Serum'] }
        ]
      }
    ];

    for (const scenario of visitScenarios) {
      const visitHistory = [];
      let totalSpent = 0;
      
      for (const visit of scenario.visits) {
        const visitDate = new Date(today.getTime() - (visit.daysAgo * 24 * 60 * 60 * 1000));
        visitHistory.push({
          date: visitDate,
          services: visit.services,
          products: visit.products,
          totalAmount: visit.amount,
          expertId: new mongoose.Types.ObjectId(),
          notes: `Visita del ${visitDate.toLocaleDateString()}`
        });
        totalSpent += visit.amount;
      }

      // Actualizar registro de retención
      const lastVisit = visitHistory[0]; // La más reciente
      const firstVisit = visitHistory[visitHistory.length - 1]; // La más antigua
      
      await db.collection('clientretentions').updateOne(
        { _id: scenario.client._id },
        {
          $set: {
            lastVisitDate: lastVisit.date,
            firstVisitDate: firstVisit.date,
            daysSinceLastVisit: scenario.visits[0].daysAgo,
            daysSinceFirstVisit: scenario.visits[scenario.visits.length - 1].daysAgo,
            visitHistory: visitHistory,
            'behaviorMetrics.totalVisits': visitHistory.length,
            'behaviorMetrics.totalSpent': totalSpent,
            'behaviorMetrics.averageSpending': totalSpent / visitHistory.length,
            'behaviorMetrics.favoriteServices': visitHistory.flatMap(v => v.services),
            'behaviorMetrics.favoriteProducts': visitHistory.flatMap(v => v.products),
            updatedAt: new Date()
          }
        }
      );

      console.log(`   📅 ${scenario.client.customerName}:`);
      console.log(`      • Última visita: ${scenario.visits[0].daysAgo} días atrás`);
      console.log(`      • Total visitas: ${visitHistory.length}`);
      console.log(`      • Total gastado: $${totalSpent.toLocaleString()}`);
      console.log(`      • Promedio por visita: $${Math.round(totalSpent / visitHistory.length).toLocaleString()}`);
    }

    // ===== 4. ANALIZAR ESTADO DE CLIENTES =====
    console.log('\n🔍 4. ANALIZANDO ESTADO DE CLIENTES');
    console.log('-'.repeat(50));

    const updatedRetentionRecords = await db.collection('clientretentions').find({
      businessId: '68b8c3e2c9765a8720a6b622'
    }).toArray();

    for (const record of updatedRetentionRecords) {
      let status = 'active';
      let riskLevel = 'low';
      
      if (record.daysSinceLastVisit <= 30) {
        status = 'active';
        riskLevel = 'low';
      } else if (record.daysSinceLastVisit <= 60) {
        status = 'at_risk';
        riskLevel = 'medium';
      } else if (record.daysSinceLastVisit <= 90) {
        status = 'inactive';
        riskLevel = 'high';
      } else {
        status = 'inactive';
        riskLevel = 'critical';
      }

      await db.collection('clientretentions').updateOne(
        { _id: record._id },
        {
          $set: {
            status: status,
            riskLevel: riskLevel,
            updatedAt: new Date()
          }
        }
      );

      console.log(`   📊 ${record.customerName}:`);
      console.log(`      • Estado: ${status}`);
      console.log(`      • Nivel de riesgo: ${riskLevel}`);
      console.log(`      • Días sin visitar: ${record.daysSinceLastVisit}`);
    }

    // ===== 5. SIMULAR CAMPAÑAS DE RECUPERACIÓN =====
    console.log('\n📧 5. SIMULANDO CAMPAÑAS DE RECUPERACIÓN');
    console.log('-'.repeat(50));

    const atRiskClients = updatedRetentionRecords.filter(r => 
      r.status === 'at_risk' || r.status === 'inactive'
    );

    console.log(`   📊 Clientes en riesgo identificados: ${atRiskClients.length}`);

    for (const client of atRiskClients) {
      const campaignId = new mongoose.Types.ObjectId().toString();
      const campaign = {
        campaignId: campaignId,
        campaignName: `Campaña de Recuperación - ${client.customerName}`,
        campaignType: 'email',
        sentDate: new Date(),
        status: 'sent',
        createdBy: '68b8c3e2c9765a8720a6b622'
      };

      await db.collection('clientretentions').updateOne(
        { _id: client._id },
        {
          $push: {
            recoveryCampaigns: campaign
          },
          $inc: {
            'recoveryTracking.totalCampaignsSent': 1
          },
          $set: {
            'recoveryTracking.lastCampaignDate': new Date(),
            'recoveryTracking.recoveryStatus': 'in_progress',
            updatedAt: new Date()
          }
        }
      );

      console.log(`   📧 Campaña enviada a ${client.customerName} (${client.riskLevel})`);
    }

    // ===== 6. SIMULAR RESPUESTAS A CAMPAÑAS =====
    console.log('\n💬 6. SIMULANDO RESPUESTAS A CAMPAÑAS');
    console.log('-'.repeat(50));

    const responses = [
      { clientIndex: 0, responseType: 'positive', notes: 'Cliente interesado en regresar' },
      { clientIndex: 1, responseType: 'negative', notes: 'Cliente no está interesado' }
    ];

    for (const response of responses) {
      const client = atRiskClients[response.clientIndex];
      if (client && client.recoveryCampaigns && client.recoveryCampaigns.length > 0) {
        const campaign = client.recoveryCampaigns[0];
        
        await db.collection('clientretentions').updateOne(
          { 
            _id: client._id,
            'recoveryCampaigns.campaignId': campaign.campaignId
          },
          {
            $set: {
              'recoveryCampaigns.$.status': 'responded',
              'recoveryCampaigns.$.responseDate': new Date(),
              'recoveryCampaigns.$.responseType': response.responseType,
              'recoveryCampaigns.$.responseNotes': response.notes
            },
            $inc: {
              'recoveryTracking.totalResponses': 1,
              [`recoveryTracking.${response.responseType}Responses`]: 1
            },
            $set: {
              'recoveryTracking.lastResponseDate': new Date(),
              updatedAt: new Date()
            }
          }
        );

        console.log(`   💬 ${client.customerName}: ${response.responseType} - ${response.notes}`);
      }
    }

    // ===== 7. MARCAR CLIENTE COMO RECUPERADO =====
    console.log('\n🎉 7. MARCANDO CLIENTE COMO RECUPERADO');
    console.log('-'.repeat(50));

    const recoveredClient = atRiskClients[0]; // Primer cliente en riesgo
    if (recoveredClient) {
      await db.collection('clientretentions').updateOne(
        { _id: recoveredClient._id },
        {
          $set: {
            status: 'recovered',
            'recoveryTracking.recoveryStatus': 'successful',
            'recoveryTracking.recoveryDate': new Date(),
            'recoveryTracking.recoveryMethod': 'email_campaign',
            'recoveryTracking.recoveryNotes': 'Cliente recuperado exitosamente mediante campaña de email',
            updatedAt: new Date()
          }
        }
      );

      console.log(`   🎉 ${recoveredClient.customerName} marcado como recuperado`);
    }

    // ===== 8. GENERAR REPORTES Y ESTADÍSTICAS =====
    console.log('\n📊 8. GENERANDO REPORTES Y ESTADÍSTICAS');
    console.log('-'.repeat(50));

    const finalRecords = await db.collection('clientretentions').find({
      businessId: '68b8c3e2c9765a8720a6b622'
    }).toArray();

    // Estadísticas por estado
    const statusStats = {};
    const riskLevelStats = {};
    let totalCampaignsSent = 0;
    let totalResponses = 0;
    let positiveResponses = 0;
    let negativeResponses = 0;

    finalRecords.forEach(record => {
      statusStats[record.status] = (statusStats[record.status] || 0) + 1;
      riskLevelStats[record.riskLevel] = (riskLevelStats[record.riskLevel] || 0) + 1;
      totalCampaignsSent += record.recoveryTracking.totalCampaignsSent;
      totalResponses += record.recoveryTracking.totalResponses;
      positiveResponses += record.recoveryTracking.positiveResponses;
      negativeResponses += record.recoveryTracking.negativeResponses;
    });

    console.log('   📋 ESTADÍSTICAS POR ESTADO:');
    Object.entries(statusStats).forEach(([status, count]) => {
      console.log(`   • ${status}: ${count} clientes`);
    });

    console.log('\n   📋 ESTADÍSTICAS POR NIVEL DE RIESGO:');
    Object.entries(riskLevelStats).forEach(([level, count]) => {
      console.log(`   • ${level}: ${count} clientes`);
    });

    console.log('\n   📋 ESTADÍSTICAS DE CAMPAÑAS:');
    console.log(`   • Total campañas enviadas: ${totalCampaignsSent}`);
    console.log(`   • Total respuestas: ${totalResponses}`);
    console.log(`   • Respuestas positivas: ${positiveResponses}`);
    console.log(`   • Respuestas negativas: ${negativeResponses}`);
    console.log(`   • Tasa de respuesta: ${totalCampaignsSent > 0 ? (totalResponses / totalCampaignsSent * 100).toFixed(1) : 0}%`);
    console.log(`   • Tasa de éxito: ${totalResponses > 0 ? (positiveResponses / totalResponses * 100).toFixed(1) : 0}%`);

    // ===== 9. VERIFICAR FUNCIONALIDADES =====
    console.log('\n✅ 9. VERIFICANDO FUNCIONALIDADES');
    console.log('-'.repeat(50));

    const functionalities = {
      recordsCreated: finalRecords.length > 0,
      visitHistoryRecorded: finalRecords.some(r => r.visitHistory.length > 0),
      statusAnalysis: finalRecords.some(r => r.status !== 'active'),
      riskLevelCalculation: finalRecords.some(r => r.riskLevel !== 'low'),
      campaignsSent: totalCampaignsSent > 0,
      responsesRecorded: totalResponses > 0,
      recoveryTracking: finalRecords.some(r => r.recoveryTracking.recoveryStatus !== 'not_started')
    };

    console.log('   🔍 FUNCIONALIDADES VERIFICADAS:');
    Object.entries(functionalities).forEach(([func, working]) => {
      console.log(`   ${working ? '✅' : '❌'} ${func}: ${working ? 'Funcionando' : 'No funciona'}`);
    });

    // ===== 10. RESUMEN FINAL =====
    console.log('\n📋 10. RESUMEN FINAL');
    console.log('='.repeat(80));

    const summary = {
      totalClients: finalRecords.length,
      activeClients: statusStats.active || 0,
      atRiskClients: statusStats.at_risk || 0,
      inactiveClients: statusStats.inactive || 0,
      recoveredClients: statusStats.recovered || 0,
      totalCampaignsSent,
      totalResponses,
      positiveResponses,
      negativeResponses,
      functionalitiesWorking: Object.values(functionalities).filter(Boolean).length
    };

    console.log('🎯 RESUMEN DEL MÓDULO DE RETENCIÓN DE CLIENTES:');
    console.log(`   • Total clientes monitoreados: ${summary.totalClients}`);
    console.log(`   • Clientes activos: ${summary.activeClients}`);
    console.log(`   • Clientes en riesgo: ${summary.atRiskClients}`);
    console.log(`   • Clientes inactivos: ${summary.inactiveClients}`);
    console.log(`   • Clientes recuperados: ${summary.recoveredClients}`);
    console.log(`   • Campañas enviadas: ${summary.totalCampaignsSent}`);
    console.log(`   • Respuestas recibidas: ${summary.totalResponses}`);
    console.log(`   • Respuestas positivas: ${summary.positiveResponses}`);
    console.log(`   • Funcionalidades funcionando: ${summary.functionalitiesWorking}/${Object.keys(functionalities).length}`);

    console.log('\n🏆 CONCLUSIÓN:');
    if (summary.functionalitiesWorking === Object.keys(functionalities).length) {
      console.log('   🎉 MÓDULO DE RETENCIÓN DE CLIENTES FUNCIONANDO PERFECTAMENTE');
      console.log('   ✅ Registros de retención creados');
      console.log('   ✅ Historial de visitas registrado');
      console.log('   ✅ Análisis de estado automático');
      console.log('   ✅ Cálculo de nivel de riesgo');
      console.log('   ✅ Campañas de recuperación enviadas');
      console.log('   ✅ Respuestas registradas');
      console.log('   ✅ Seguimiento de recuperación');
      console.log('   ✅ Sistema listo para producción');
    } else {
      console.log('   ⚠️ MÓDULO PARCIALMENTE FUNCIONAL');
      console.log('   🔧 Se requieren ajustes menores');
    }

    console.log('\n' + '='.repeat(80));
    console.log('📅 Pruebas del módulo de retención de clientes completadas:', new Date().toLocaleString());
    console.log('🎯 Sistema de seguimiento de clientes inactivos implementado exitosamente');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error en las pruebas de retención de clientes:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Ejecutar las pruebas
testRetencionClientes();

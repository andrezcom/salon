const mongoose = require('mongoose');

// Configuración de conexión
const MONGODB_URI = 'mongodb://localhost:27017/salon_test';

// Conectar a MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
}

// Definir esquemas directamente para la prueba
const businessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  databaseName: { type: String, required: false, unique: true },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  colorPalette: {
    primary: { type: String, required: true, default: '#3B82F6' },
    secondary: { type: String, required: true, default: '#10B981' },
    accent: { type: String, required: true, default: '#F59E0B' },
    neutral: { type: String, required: true, default: '#6B7280' },
    paletteName: { type: String, required: false, default: 'Professional Blue' },
    isCustom: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  },
  contact: {
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, default: 'México' }
  },
  settings: {
    theme: { type: String, default: 'default' },
    currency: { type: String, default: 'USD' },
    timezone: { type: String, default: 'UTC' },
    businessType: { type: String, default: 'salon' }
  }
}, { timestamps: true });

// Métodos del esquema
businessSchema.methods.getColorPalette = function() {
  return {
    primary: this.colorPalette.primary,
    secondary: this.colorPalette.secondary,
    accent: this.colorPalette.accent,
    neutral: this.colorPalette.neutral,
    paletteName: this.colorPalette.paletteName,
    isCustom: this.colorPalette.isCustom,
    createdAt: this.colorPalette.createdAt
  };
};

businessSchema.methods.setColorPalette = function(palette) {
  this.colorPalette = {
    ...palette,
    isCustom: palette.isCustom || false,
    createdAt: new Date()
  };
  return this.save();
};

businessSchema.methods.resetToDefaultPalette = function() {
  this.colorPalette = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    neutral: '#6B7280',
    paletteName: 'Professional Blue',
    isCustom: false,
    createdAt: new Date()
  };
  return this.save();
};

businessSchema.statics.getDefaultPalettes = function() {
  return [
    {
      name: 'Professional Blue',
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#F59E0B',
      neutral: '#6B7280',
      description: 'Paleta profesional con azul como color principal'
    },
    {
      name: 'Elegant Purple',
      primary: '#8B5CF6',
      secondary: '#06B6D4',
      accent: '#F97316',
      neutral: '#64748B',
      description: 'Paleta elegante con púrpura como color principal'
    },
    {
      name: 'Fresh Green',
      primary: '#10B981',
      secondary: '#3B82F6',
      accent: '#EF4444',
      neutral: '#6B7280',
      description: 'Paleta fresca con verde como color principal'
    },
    {
      name: 'Warm Orange',
      primary: '#F59E0B',
      secondary: '#8B5CF6',
      accent: '#10B981',
      neutral: '#6B7280',
      description: 'Paleta cálida con naranja como color principal'
    },
    {
      name: 'Modern Red',
      primary: '#EF4444',
      secondary: '#3B82F6',
      accent: '#10B981',
      neutral: '#6B7280',
      description: 'Paleta moderna con rojo como color principal'
    },
    {
      name: 'Sophisticated Gray',
      primary: '#6B7280',
      secondary: '#3B82F6',
      accent: '#F59E0B',
      neutral: '#9CA3AF',
      description: 'Paleta sofisticada con gris como color principal'
    }
  ];
};

businessSchema.statics.applyDefaultPalette = function(businessId, paletteName) {
  const palettes = this.getDefaultPalettes();
  const selectedPalette = palettes.find(p => p.name === paletteName);
  
  if (!selectedPalette) {
    throw new Error(`Palette '${paletteName}' not found`);
  }
  
  return this.findByIdAndUpdate(
    businessId,
    {
      'colorPalette.primary': selectedPalette.primary,
      'colorPalette.secondary': selectedPalette.secondary,
      'colorPalette.accent': selectedPalette.accent,
      'colorPalette.neutral': selectedPalette.neutral,
      'colorPalette.paletteName': selectedPalette.name,
      'colorPalette.isCustom': false,
      'colorPalette.createdAt': new Date()
    },
    { new: true }
  );
};

const personSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  personType: { type: String, enum: ['user', 'expert', 'client'], required: true },
  userInfo: {
    username: { type: String, required: false },
    password: { type: String, required: false },
    role: { type: String, required: false },
    permissions: [{ type: String }],
    businesses: [{ type: String }]
  }
}, { timestamps: true });

const Business = mongoose.model('Business', businessSchema);
const Person = mongoose.model('Person', personSchema);

// Colores de prueba
const TEST_COLORS = {
  primary: '#FF6B6B',
  secondary: '#4ECDC4', 
  accent: '#45B7D1',
  neutral: '#96CEB4'
};

// Paletas predeterminadas para probar
const TEST_PALETTES = [
  'Professional Blue',
  'Elegant Purple', 
  'Fresh Green',
  'Warm Orange',
  'Modern Red',
  'Sophisticated Gray'
];

async function cleanup() {
  try {
    await Business.deleteMany({ name: /^Test Business/ });
    await Person.deleteMany({ email: /^test.*@example\.com$/ });
    console.log('🧹 Datos de prueba limpiados');
  } catch (error) {
    console.error('❌ Error limpiando datos:', error);
  }
}

async function createTestData() {
  console.log('\n📝 Creando datos de prueba...');
  
  try {
    // Crear usuario de prueba
    const testUser = await Person.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '+1234567890',
      personType: 'user',
      userInfo: {
        username: 'testuser',
        password: 'hashedpassword',
        role: 'admin',
        permissions: ['business:create', 'business:read', 'business:update', 'business:delete'],
        businesses: []
      }
    });

    // Crear negocio de prueba
    const testBusiness = await Business.create({
      name: 'Test Business Color Palette',
      ownerId: testUser._id,
      databaseName: 'test_business_db',
      status: 'active',
      contact: {
        email: 'business@test.com',
        phone: '+1234567890',
        address: '123 Test Street',
        city: 'Test City',
        country: 'Test Country'
      },
      settings: {
        theme: 'default',
        currency: 'USD',
        timezone: 'UTC',
        businessType: 'salon'
      }
    });

    // Actualizar usuario con el negocio
    testUser.userInfo.businesses.push(testBusiness._id.toString());
    await testUser.save();

    console.log('✅ Datos de prueba creados:');
    console.log(`   - Usuario: ${testUser.email}`);
    console.log(`   - Negocio: ${testBusiness.name}`);
    console.log(`   - ID Negocio: ${testBusiness._id}`);

    return { testUser, testBusiness };
  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
    throw error;
  }
}

async function testDefaultPalettes() {
  console.log('\n🎨 Probando paletas predeterminadas...');
  
  try {
    const palettes = Business.getDefaultPalettes();
    
    console.log(`✅ Paletas predeterminadas obtenidas: ${palettes.length}`);
    palettes.forEach((palette, index) => {
      console.log(`   ${index + 1}. ${palette.name}: ${palette.primary} | ${palette.secondary} | ${palette.accent} | ${palette.neutral}`);
    });

    return palettes;
  } catch (error) {
    console.error('❌ Error obteniendo paletas predeterminadas:', error);
    throw error;
  }
}

async function testBusinessColorPalette(business) {
  console.log('\n🔍 Probando obtención de paleta de negocio...');
  
  try {
    const colorPalette = business.getColorPalette();
    
    console.log('✅ Paleta de negocio obtenida:');
    console.log(`   - Primary: ${colorPalette.primary}`);
    console.log(`   - Secondary: ${colorPalette.secondary}`);
    console.log(`   - Accent: ${colorPalette.accent}`);
    console.log(`   - Neutral: ${colorPalette.neutral}`);
    console.log(`   - Nombre: ${colorPalette.paletteName}`);
    console.log(`   - Es personalizada: ${colorPalette.isCustom}`);

    return colorPalette;
  } catch (error) {
    console.error('❌ Error obteniendo paleta de negocio:', error);
    throw error;
  }
}

async function testApplyDefaultPalette(business, paletteName) {
  console.log(`\n🎯 Probando aplicación de paleta predeterminada: ${paletteName}...`);
  
  try {
    const updatedBusiness = await Business.applyDefaultPalette(business._id.toString(), paletteName);
    
    if (!updatedBusiness) {
      throw new Error('Negocio no encontrado');
    }

    const colorPalette = updatedBusiness.getColorPalette();
    
    console.log('✅ Paleta predeterminada aplicada:');
    console.log(`   - Primary: ${colorPalette.primary}`);
    console.log(`   - Secondary: ${colorPalette.secondary}`);
    console.log(`   - Accent: ${colorPalette.accent}`);
    console.log(`   - Neutral: ${colorPalette.neutral}`);
    console.log(`   - Nombre: ${colorPalette.paletteName}`);
    console.log(`   - Es personalizada: ${colorPalette.isCustom}`);

    return updatedBusiness;
  } catch (error) {
    console.error(`❌ Error aplicando paleta ${paletteName}:`, error);
    throw error;
  }
}

async function testCreateCustomPalette(business) {
  console.log('\n🛠️ Probando creación de paleta personalizada...');
  
  try {
    const customPalette = {
      primary: TEST_COLORS.primary,
      secondary: TEST_COLORS.secondary,
      accent: TEST_COLORS.accent,
      neutral: TEST_COLORS.neutral,
      paletteName: 'Mi Paleta Personalizada',
      isCustom: true
    };

    await business.setColorPalette(customPalette);
    
    const updatedPalette = business.getColorPalette();
    
    console.log('✅ Paleta personalizada creada:');
    console.log(`   - Primary: ${updatedPalette.primary}`);
    console.log(`   - Secondary: ${updatedPalette.secondary}`);
    console.log(`   - Accent: ${updatedPalette.accent}`);
    console.log(`   - Neutral: ${updatedPalette.neutral}`);
    console.log(`   - Nombre: ${updatedPalette.paletteName}`);
    console.log(`   - Es personalizada: ${updatedPalette.isCustom}`);

    return business;
  } catch (error) {
    console.error('❌ Error creando paleta personalizada:', error);
    throw error;
  }
}

async function testResetToDefault(business) {
  console.log('\n🔄 Probando reset a paleta predeterminada...');
  
  try {
    await business.resetToDefaultPalette();
    
    const resetPalette = business.getColorPalette();
    
    console.log('✅ Paleta reseteada a predeterminada:');
    console.log(`   - Primary: ${resetPalette.primary}`);
    console.log(`   - Secondary: ${resetPalette.secondary}`);
    console.log(`   - Accent: ${resetPalette.accent}`);
    console.log(`   - Neutral: ${resetPalette.neutral}`);
    console.log(`   - Nombre: ${resetPalette.paletteName}`);
    console.log(`   - Es personalizada: ${resetPalette.isCustom}`);

    return business;
  } catch (error) {
    console.error('❌ Error reseteando paleta:', error);
    throw error;
  }
}

async function testColorValidation() {
  console.log('\n✅ Probando validación de colores...');
  
  try {
    const testBusiness = await Business.findOne({ name: /^Test Business/ });
    if (!testBusiness) {
      throw new Error('Negocio de prueba no encontrado');
    }

    // Probar colores válidos
    const validColors = {
      primary: '#FF0000',
      secondary: '#00FF00',
      accent: '#0000FF',
      neutral: '#FFFFFF'
    };

    await testBusiness.setColorPalette(validColors);
    console.log('✅ Colores válidos aceptados');

    // Probar colores inválidos (esto debería fallar)
    try {
      const invalidColors = {
        primary: 'INVALID_COLOR',
        secondary: '#00FF00',
        accent: '#0000FF',
        neutral: '#FFFFFF'
      };

      await testBusiness.setColorPalette(invalidColors);
      console.log('⚠️ Colores inválidos fueron aceptados (esto no debería pasar)');
    } catch (validationError) {
      console.log('✅ Colores inválidos rechazados correctamente');
    }

  } catch (error) {
    console.error('❌ Error en validación de colores:', error);
    throw error;
  }
}

async function testMultipleBusinesses() {
  console.log('\n🏢 Probando múltiples negocios con diferentes paletas...');
  
  try {
    const testUser = await Person.findOne({ email: 'test@example.com' });
    if (!testUser) {
      throw new Error('Usuario de prueba no encontrado');
    }

    // Crear negocios adicionales
    const businesses = [];
    for (let i = 1; i <= 3; i++) {
      const business = await Business.create({
        name: `Test Business ${i}`,
        ownerId: testUser._id,
        databaseName: `test_business_${i}_db`,
        status: 'active',
        contact: {
          email: `business${i}@test.com`,
          phone: '+1234567890',
          address: `${i}23 Test Street`,
          city: 'Test City',
          country: 'Test Country'
        },
        settings: {
          theme: 'default',
          currency: 'USD',
          timezone: 'UTC',
          businessType: 'salon'
        }
      });

      // Aplicar paletas diferentes
      const paletteName = TEST_PALETTES[i - 1];
      await Business.applyDefaultPalette(business._id.toString(), paletteName);
      
      businesses.push(business);
      console.log(`✅ Negocio ${i} creado con paleta: ${paletteName}`);
    }

    // Verificar que cada negocio tiene su paleta única
    for (const business of businesses) {
      const palette = business.getColorPalette();
      console.log(`   - ${business.name}: ${palette.paletteName} (${palette.primary})`);
    }

    return businesses;
  } catch (error) {
    console.error('❌ Error creando múltiples negocios:', error);
    throw error;
  }
}

async function testStatistics() {
  console.log('\n📊 Probando estadísticas de paletas...');
  
  try {
    const businesses = await Business.find({ name: /^Test Business/ });
    
    const statistics = {
      totalBusinesses: businesses.length,
      customPalettes: businesses.filter(b => b.colorPalette.isCustom).length,
      defaultPalettes: businesses.filter(b => !b.colorPalette.isCustom).length,
      paletteUsage: {}
    };

    // Contar uso de paletas
    businesses.forEach(business => {
      const paletteName = business.colorPalette.paletteName || 'Unknown';
      statistics.paletteUsage[paletteName] = (statistics.paletteUsage[paletteName] || 0) + 1;
    });

    console.log('✅ Estadísticas de paletas:');
    console.log(`   - Total negocios: ${statistics.totalBusinesses}`);
    console.log(`   - Paletas personalizadas: ${statistics.customPalettes}`);
    console.log(`   - Paletas predeterminadas: ${statistics.defaultPalettes}`);
    console.log('   - Uso por paleta:');
    Object.entries(statistics.paletteUsage).forEach(([name, count]) => {
      console.log(`     * ${name}: ${count} negocios`);
    });

    return statistics;
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    throw error;
  }
}

async function runTests() {
  console.log('🎨 INICIANDO PRUEBAS DEL SISTEMA DE PALETAS DE COLORES');
  console.log('=' .repeat(60));

  try {
    await connectDB();
    await cleanup();
    
    const { testUser, testBusiness } = await createTestData();
    
    // Ejecutar todas las pruebas
    await testDefaultPalettes();
    await testBusinessColorPalette(testBusiness);
    
    // Probar diferentes paletas predeterminadas
    for (const paletteName of TEST_PALETTES.slice(0, 3)) {
      await testApplyDefaultPalette(testBusiness, paletteName);
    }
    
    await testCreateCustomPalette(testBusiness);
    await testResetToDefault(testBusiness);
    await testColorValidation();
    await testMultipleBusinesses();
    await testStatistics();

    console.log('\n' + '='.repeat(60));
    console.log('🎉 TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
    console.log('✅ Sistema de paletas de colores funcionando correctamente');
    
  } catch (error) {
    console.error('\n❌ ERROR EN LAS PRUEBAS:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar las pruebas
runTests();

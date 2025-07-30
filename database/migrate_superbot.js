// Script de migración para Super-Bot Venezia
// Ejecuta las migraciones de base de datos necesarias para el SuperBot

const fs = require('fs');
const path = require('path');
const { runAsync, getAsync } = require('./db');

async function runMigration() {
  console.log('🚀 Iniciando migración de Super-Bot Venezia...');
  
  try {
    // Leer el archivo SQL de esquemas
    const schemaPath = path.join(__dirname, 'schemas', 'superbot_tables.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Dividir el SQL en statements individuales
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    console.log(`📋 Ejecutando ${statements.length} statements SQL...`);
    
    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        await runAsync(statement);
        console.log(`✅ [${i + 1}/${statements.length}] Statement ejecutado correctamente`);
      } catch (error) {
        // Algunos statements pueden fallar si ya existen (IF NOT EXISTS)
        if (error.message.includes('already exists')) {
          console.log(`⚠️  [${i + 1}/${statements.length}] Statement ya existe, continuando...`);
        } else {
          console.error(`❌ [${i + 1}/${statements.length}] Error ejecutando statement:`, error.message);
          console.log('Statement que falló:', statement.substring(0, 100) + '...');
        }
      }
    }
    
    // Verificar que las tablas se crearon correctamente
    await verifyTables();
    
    // Ejecutar configuraciones iniciales
    await setupInitialConfiguration();
    
    console.log('✅ Migración de Super-Bot Venezia completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
}

async function verifyTables() {
  console.log('🔍 Verificando tablas creadas...');
  
  const expectedTables = [
    'bot_actions_log',
    'bot_configuration',
    'price_history',
    'inventory_movements',
    'production_orders',
    'voice_commands_log',
    'bot_feedback'
  ];
  
  for (const tableName of expectedTables) {
    try {
      const result = await getAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        [tableName]
      );
      
      if (result) {
        console.log(`✅ Tabla ${tableName} verificada`);
      } else {
        console.error(`❌ Tabla ${tableName} no encontrada`);
      }
    } catch (error) {
      console.error(`❌ Error verificando tabla ${tableName}:`, error.message);
    }
  }
  
  // Verificar vistas
  const expectedViews = ['bot_statistics', 'top_bot_commands'];
  
  for (const viewName of expectedViews) {
    try {
      const result = await getAsync(
        "SELECT name FROM sqlite_master WHERE type='view' AND name=?",
        [viewName]
      );
      
      if (result) {
        console.log(`✅ Vista ${viewName} verificada`);
      } else {
        console.error(`❌ Vista ${viewName} no encontrada`);
      }
    } catch (error) {
      console.error(`❌ Error verificando vista ${viewName}:`, error.message);
    }
  }
}

async function setupInitialConfiguration() {
  console.log('⚙️ Configurando ajustes iniciales del SuperBot...');
  
  try {
    // Verificar si ya existe configuración
    const existingConfig = await getAsync(
      'SELECT COUNT(*) as count FROM bot_configuration WHERE is_global = 1'
    );
    
    if (existingConfig.count > 0) {
      console.log('⚠️  Configuración inicial ya existe, omitiendo...');
      return;
    }
    
    // Configuraciones iniciales
    const initialConfigs = [
      {
        setting_name: 'superbot_enabled',
        setting_value: 'true',
        setting_type: 'boolean',
        description: 'Habilitar Super-Bot Venezia globalmente'
      },
      {
        setting_name: 'auto_execute',
        setting_value: 'false',
        setting_type: 'boolean',
        description: 'Ejecutar comandos automáticamente sin confirmación'
      },
      {
        setting_name: 'confirmation_required',
        setting_value: 'true',
        setting_type: 'boolean',
        description: 'Requerir confirmación para acciones críticas'
      },
      {
        setting_name: 'voice_enabled',
        setting_value: 'true',
        setting_type: 'boolean',
        description: 'Habilitar comandos de voz'
      },
      {
        setting_name: 'language',
        setting_value: 'es',
        setting_type: 'string',
        description: 'Idioma por defecto del bot'
      },
      {
        setting_name: 'max_retries',
        setting_value: '3',
        setting_type: 'number',
        description: 'Número máximo de reintentos'
      },
      {
        setting_name: 'response_timeout',
        setting_value: '15000',
        setting_type: 'number',
        description: 'Timeout de respuesta en milisegundos'
      },
      {
        setting_name: 'nlp_confidence_threshold',
        setting_value: '0.7',
        setting_type: 'number',
        description: 'Umbral mínimo de confianza para NLP'
      },
      {
        setting_name: 'enable_learning',
        setting_value: 'true',
        setting_type: 'boolean',
        description: 'Habilitar aprendizaje automático del bot'
      },
      {
        setting_name: 'log_all_interactions',
        setting_value: 'true',
        setting_type: 'boolean',
        description: 'Registrar todas las interacciones para auditoría'
      },
      {
        setting_name: 'enable_analytics',
        setting_value: 'true',
        setting_type: 'boolean',
        description: 'Habilitar analytics y métricas del bot'
      }
    ];
    
    for (const config of initialConfigs) {
      await runAsync(
        `INSERT INTO bot_configuration 
         (user_id, setting_name, setting_value, setting_type, is_global, description) 
         VALUES (NULL, ?, ?, ?, 1, ?)`,
        [config.setting_name, config.setting_value, config.setting_type, config.description]
      );
      
      console.log(`✅ Configuración ${config.setting_name} establecida`);
    }
    
    console.log('✅ Configuración inicial completada');
    
  } catch (error) {
    console.error('❌ Error configurando ajustes iniciales:', error);
    throw error;
  }
}

// Función para revertir migración (rollback)
async function rollbackMigration() {
  console.log('🔄 Iniciando rollback de Super-Bot Venezia...');
  
  const tablesToDrop = [
    'bot_feedback',
    'voice_commands_log',
    'production_orders',
    'inventory_movements',
    'price_history',
    'bot_configuration',
    'bot_actions_log'
  ];
  
  const viewsToDrop = [
    'bot_statistics',
    'top_bot_commands'
  ];
  
  try {
    // Eliminar vistas
    for (const viewName of viewsToDrop) {
      try {
        await runAsync(`DROP VIEW IF EXISTS ${viewName}`);
        console.log(`✅ Vista ${viewName} eliminada`);
      } catch (error) {
        console.error(`❌ Error eliminando vista ${viewName}:`, error.message);
      }
    }
    
    // Eliminar tablas
    for (const tableName of tablesToDrop) {
      try {
        await runAsync(`DROP TABLE IF EXISTS ${tableName}`);
        console.log(`✅ Tabla ${tableName} eliminada`);
      } catch (error) {
        console.error(`❌ Error eliminando tabla ${tableName}:`, error.message);
      }
    }
    
    console.log('✅ Rollback completado');
    
  } catch (error) {
    console.error('❌ Error durante rollback:', error);
    throw error;
  }
}

// Función para verificar estado de migración
async function checkMigrationStatus() {
  console.log('🔍 Verificando estado de migración...');
  
  try {
    const tables = await getAsync(`
      SELECT COUNT(*) as count 
      FROM sqlite_master 
      WHERE type='table' AND name IN (
        'bot_actions_log', 'bot_configuration', 'price_history', 
        'inventory_movements', 'production_orders', 'voice_commands_log', 'bot_feedback'
      )
    `);
    
    const views = await getAsync(`
      SELECT COUNT(*) as count 
      FROM sqlite_master 
      WHERE type='view' AND name IN ('bot_statistics', 'top_bot_commands')
    `);
    
    const configs = await getAsync(`
      SELECT COUNT(*) as count 
      FROM bot_configuration 
      WHERE is_global = 1
    `).catch(() => ({ count: 0 }));
    
    console.log(`📊 Estado de migración:`);
    console.log(`   - Tablas: ${tables.count}/7`);
    console.log(`   - Vistas: ${views.count}/2`);
    console.log(`   - Configuraciones: ${configs.count}`);
    
    const isComplete = tables.count === 7 && views.count === 2 && configs.count > 0;
    console.log(`   - Estado: ${isComplete ? '✅ Completada' : '⚠️  Incompleta'}`);
    
    return isComplete;
    
  } catch (error) {
    console.error('❌ Error verificando estado:', error);
    return false;
  }
}

// Ejecutar migración si es llamado directamente
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'up':
      runMigration().catch(console.error);
      break;
    case 'down':
      rollbackMigration().catch(console.error);
      break;
    case 'status':
      checkMigrationStatus().catch(console.error);
      break;
    default:
      console.log('📖 Uso: node migrate_superbot.js [up|down|status]');
      console.log('   up     - Ejecutar migración');
      console.log('   down   - Revertir migración');
      console.log('   status - Verificar estado');
  }
}

module.exports = {
  runMigration,
  rollbackMigration,
  checkMigrationStatus
};
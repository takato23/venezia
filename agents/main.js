#!/usr/bin/env node

const { OrchestratorAgent } = require('./index');

/**
 * Entry point para el sistema autónomo
 * Uso: node agents/main.js <comando> [...args]
 * 
 * Comandos disponibles:
 * - /sc:analyze - Analizar el repositorio
 * - /sc:improve "<objetivo>" - Mejorar código con objetivo específico
 * - /sc:test - Ejecutar tests
 * - /sc:document - Actualizar documentación
 * - /sc:git "<comando git>" - Ejecutar comandos git seguros
 * - /sc:troubleshoot "<pista>" - Diagnosticar problemas
 */

async function main() {
  const orchestrator = new OrchestratorAgent();
  
  try {
    // Inicializar sistema
    await orchestrator.initialize();
    
    // Obtener comando y argumentos
    const args = process.argv.slice(2);
    if (args.length === 0) {
      showHelp();
      process.exit(0);
    }

    const command = args[0];
    const commandArgs = args.slice(1);

    // Verificar si es un comando válido
    if (!command.startsWith('/sc:')) {
      console.error('❌ Los comandos deben empezar con /sc:');
      showHelp();
      process.exit(1);
    }

    // Ejecutar comando
    console.log(`\n🤖 Ejecutando comando: ${command} ${commandArgs.join(' ')}\n`);
    
    const result = await orchestrator.execute(command, commandArgs);
    
    // Mostrar resumen de resultados
    console.log('\n📊 Resumen de resultados:');
    console.log(JSON.stringify(result, null, 2));
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🤖 Sistema Autónomo para Claude Code

Uso: node agents/main.js <comando> [...args]

Comandos disponibles:

  /sc:analyze
    Analiza el repositorio completo y genera reporte

  /sc:improve "<objetivo>"
    Mejora el código según el objetivo especificado
    Ejemplo: /sc:improve "manejo de errores en api.js"

  /sc:test
    Ejecuta la suite de tests con monitoreo de cobertura

  /sc:document
    Actualiza CHANGELOG.md y documentación

  /sc:git "<comando>"
    Ejecuta comandos git con restricciones de seguridad
    Comandos permitidos: status, add, commit, push (solo feat/*)

  /sc:troubleshoot "<pista>"
    Diagnostica problemas y genera recomendaciones
    Ejemplo: /sc:troubleshoot "tests fallando"

Workflow completo:
  1. /sc:analyze
  2. /sc:improve "objetivo específico"
  3. /sc:test
  4. /sc:document
  5. /sc:git "commit -m 'feat: descripción'"
  6. /sc:git "push --set-upstream origin feat/rama"

Configuración:
  - Presupuesto: 3 iteraciones, 20 minutos, 15 archivos, 200KB diff
  - Gates de seguridad activos para operaciones peligrosas
  - Reportes guardados en directorio 'report/'
  - Estado persistente en STATE.md
`);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    console.error('Error no capturado:', error);
    process.exit(1);
  });
}

module.exports = { main };
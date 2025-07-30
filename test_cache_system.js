// Test para verificar el sistema de caché
// Ejecutar en la consola del navegador

// 1. Verificar que cacheManager esté disponible
console.log('CacheManager disponible:', typeof window.cacheManager !== 'undefined');

// 2. Probar invalidación manual
if (window.cacheManager) {
  console.log('Invalidando caché de proveedores...');
  window.cacheManager.invalidateProviders();
  
  setTimeout(() => {
    console.log('Invalidando todo el caché...');
    window.cacheManager.invalidateAll();
  }, 2000);
}

// 3. Simular una acción del AI
console.log('Simulando acción del AI...');
const event = new CustomEvent('ai:action:completed', {
  detail: { action: 'provider_created', response: '✅ Agregué al proveedor Test' }
});
window.dispatchEvent(event);

// 4. Verificar eventos del bus
console.log('Para monitorear eventos del bus, ejecuta:');
console.log('window.eventBus = eventBus (desde el código)');

console.log('\n✅ Test completado. Revisa los indicadores visuales en la interfaz.');
/**
 * DEMON HUNTER - Admin Script
 * Script para dar koku/honor a un usuario (solo para testing/admin)
 *
 * Uso: node admin-give-resources.js <userId> <guildId> <koku> <honor>
 * Ejemplo: node admin-give-resources.js 123456789 987654321 10000 5000
 */

const fs = require('fs');
const path = require('path');

// Cargar dataManager
const dataManager = require('./utils/dataManager');

// Obtener argumentos
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║        🎴 DEMON HUNTER - Admin Resource Script 🎴        ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  Uso:                                                     ║
║    node admin-give-resources.js <userId> <guildId> \\     ║
║         [koku] [honor]                                    ║
║                                                           ║
║  Ejemplos:                                                ║
║    node admin-give-resources.js 123456 987654 10000 5000  ║
║    node admin-give-resources.js 123456 987654 10000       ║
║    node admin-give-resources.js 123456 987654             ║
║                                                           ║
║  Argumentos:                                              ║
║    userId  - ID del usuario de Discord                    ║
║    guildId - ID del servidor de Discord                   ║
║    koku    - Cantidad de koku a dar (opcional)            ║
║    honor   - Cantidad de honor a dar (opcional)           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
  process.exit(1);
}

const userId = args[0];
const guildId = args[1];
const kokuToGive = args[2] ? parseInt(args[2]) : 0;
const honorToGive = args[3] ? parseInt(args[3]) : 0;

// Validar
if (isNaN(kokuToGive) || isNaN(honorToGive)) {
  console.error('❌ Error: Los valores de koku y honor deben ser números.');
  process.exit(1);
}

if (kokuToGive === 0 && honorToGive === 0) {
  console.error('❌ Error: Debes especificar al menos koku o honor.');
  process.exit(1);
}

// Inicializar dataManager
console.log('📂 Cargando datos...');

try {
  // Obtener o crear usuario
  const userData = dataManager.getUser(userId, guildId);

  console.log('\n📊 Estado actual del usuario:');
  console.log(`   Usuario ID: ${userId}`);
  console.log(`   Servidor ID: ${guildId}`);
  console.log(`   💰 Koku: ${userData.koku || 0}`);
  console.log(`   ⭐ Honor: ${userData.honor || 0}`);
  console.log(`   🎖️ Rango: ${userData.rank || 'Ronin'}`);

  // Dar recursos
  if (kokuToGive > 0) {
    userData.koku = (userData.koku || 0) + kokuToGive;
    console.log(`\n💰 Agregando ${kokuToGive} koku...`);
  }

  if (honorToGive > 0) {
    dataManager.addHonor(userId, guildId, honorToGive);
    console.log(`⭐ Agregando ${honorToGive} honor...`);
  }

  // Actualizar usuario
  if (kokuToGive > 0) {
    dataManager.updateUser(userId, guildId, { koku: userData.koku });
  }

  // Guardar cambios
  dataManager.saveAll();

  // Obtener datos actualizados
  const updatedUserData = dataManager.getUser(userId, guildId);

  console.log('\n✅ Recursos agregados exitosamente!');
  console.log('\n📊 Nuevo estado del usuario:');
  console.log(`   💰 Koku: ${updatedUserData.koku || 0} (+${kokuToGive})`);
  console.log(`   ⭐ Honor: ${updatedUserData.honor || 0} (+${honorToGive})`);
  console.log(`   🎖️ Rango: ${updatedUserData.rank || 'Ronin'}`);

  console.log('\n🎉 Cambios guardados en data/users.json');

} catch (error) {
  console.error('\n❌ Error al dar recursos:', error.message);
  console.error(error.stack);
  process.exit(1);
}

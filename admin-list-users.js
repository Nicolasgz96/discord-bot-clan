/**
 * DEMON HUNTER - Admin Script
 * Lista todos los usuarios registrados con sus IDs
 *
 * Uso: node admin-list-users.js
 */

const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, 'data', 'users.json');

if (!fs.existsSync(usersFile)) {
  console.error('❌ No se encontró el archivo data/users.json');
  console.error('   El bot aún no tiene usuarios registrados.');
  process.exit(1);
}

try {
  const usersData = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║        🎴 DEMON HUNTER - Lista de Usuarios 🎴            ║
╚═══════════════════════════════════════════════════════════╝
  `);

  const guilds = Object.keys(usersData);

  if (guilds.length === 0) {
    console.log('📭 No hay usuarios registrados todavía.\n');
    process.exit(0);
  }

  guilds.forEach(guildId => {
    console.log(`\n🏯 Servidor ID: ${guildId}`);
    console.log('─'.repeat(60));

    const users = Object.keys(usersData[guildId]);

    users.forEach((userId, index) => {
      const user = usersData[guildId][userId];
      console.log(`\n  ${index + 1}. Usuario ID: ${userId}`);
      console.log(`     💰 Koku: ${user.koku || 0}`);
      console.log(`     ⭐ Honor: ${user.honor || 0}`);
      console.log(`     🎖️ Rango: ${user.rank || 'Ronin'}`);

      if (user.stats?.arenaWins) {
        console.log(`     🏆 Victorias en Arena: ${user.stats.arenaWins}`);
      }

      if (user.clanId) {
        console.log(`     ⛩️ Clan ID: ${user.clanId}`);
      }
    });

    console.log('\n' + '─'.repeat(60));
  });

  console.log(`
\n💡 Para dar recursos a un usuario, usa:
   node admin-give-resources.js <userId> <guildId> <koku> <honor>

   Ejemplo:
   node admin-give-resources.js ${guilds[0] && Object.keys(usersData[guilds[0]])[0] || '123456'} ${guilds[0] || '987654'} 10000 5000
  `);

} catch (error) {
  console.error('❌ Error al leer el archivo:', error.message);
  process.exit(1);
}

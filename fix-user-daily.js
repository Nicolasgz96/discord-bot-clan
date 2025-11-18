/**
 * Script temporal para arreglar el problema del EXTRA_DAILY_CLAIM
 * Este script resetea el lastDailyClaim y devuelve el item consumido
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Solicitar el ID del usuario afectado
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Ingresa el USER ID del usuario afectado: ', (userId) => {
  readline.question('Ingresa el GUILD ID del servidor: ', (guildId) => {
    // Leer el archivo de usuarios
    const usersPath = path.join(__dirname, 'data', 'users.json');

    if (!fs.existsSync(usersPath)) {
      console.log('❌ Error: No se encontró el archivo data/users.json');
      readline.close();
      return;
    }

    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const userKey = `${guildId}_${userId}`;

    if (!usersData[userKey]) {
      console.log(`❌ Error: No se encontró el usuario con key ${userKey}`);
      readline.close();
      return;
    }

    const user = usersData[userKey];

    console.log('\n📊 Estado actual del usuario:');
    console.log(`   - lastDailyClaim: ${user.lastDailyClaim}`);
    console.log(`   - Inventory items: ${user.inventory?.length || 0}`);

    // Resetear el lastDailyClaim
    user.lastDailyClaim = null;

    // Devolver el item EXTRA_DAILY_CLAIM
    if (!user.inventory) {
      user.inventory = [];
    }

    // Verificar si ya tiene el item
    const hasExtraDaily = user.inventory.some(inv => inv.itemId === 'extra_daily_claim');

    if (!hasExtraDaily) {
      user.inventory.push({
        itemId: 'extra_daily_claim',
        purchasedAt: Date.now(),
        quantity: 1
      });
      console.log('\n✅ Item EXTRA_DAILY_CLAIM restaurado al inventario');
    } else {
      // Incrementar la cantidad
      const item = user.inventory.find(inv => inv.itemId === 'extra_daily_claim');
      item.quantity = (item.quantity || 1) + 1;
      console.log(`\n✅ Incrementada cantidad de EXTRA_DAILY_CLAIM a ${item.quantity}`);
    }

    // Limpiar extraDailyUsed para hoy
    if (user.extraDailyUsed) {
      const today = new Date().toDateString();
      delete user.extraDailyUsed[today];
      console.log('✅ Limpiado extraDailyUsed para hoy');
    }

    // Guardar el archivo
    fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2));

    console.log('\n✅ Cambios guardados exitosamente!');
    console.log('\n📋 Estado final del usuario:');
    console.log(`   - lastDailyClaim: ${user.lastDailyClaim}`);
    console.log(`   - Inventory items: ${user.inventory.length}`);
    console.log('\n💡 Ahora el usuario puede:');
    console.log('   1. Usar /daily para reclamar su recompensa');
    console.log('   2. Usar el EXTRA_DAILY_CLAIM del inventario si lo necesita');

    readline.close();
  });
});

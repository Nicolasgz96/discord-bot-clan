/**
 * DEMON HUNTER BOT - Otorgar logro "Creador" a usuarios específicos
 * Ejecuta este script UNA VEZ para otorgar el logro 創造者 a los creadores del bot
 */

const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

// IDs de los creadores
const CREATOR_USER_IDS = ['331621993860300800', '750509799942127616'];
const GUILD_ID = process.env.GUILD_ID || '1110368621043986492'; // Coloca aquí el ID de tu servidor

console.log('🚀 Iniciando script para otorgar logro "創造者"...\n');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', async () => {
  console.log(`✅ Bot conectado como ${client.user.tag}\n`);

  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    console.log(`🏯 Servidor: ${guild.name}\n`);

    const achievementManager = require('./utils/achievementManager');
    const dataManager = require('./utils/dataManager');

    // Inicializar dataManager
    dataManager.init();
    console.log('📂 DataManager inicializado\n');

    for (const userId of CREATOR_USER_IDS) {
      try {
        // Verificar si el usuario existe en el servidor
        const member = await guild.members.fetch(userId);
        console.log(`👤 Usuario encontrado: ${member.user.tag} (${userId})`);

        // Verificar si ya tiene el logro
        if (achievementManager.hasAchievement(userId, GUILD_ID, 'creator')) {
          console.log(`   ⚠️  Ya tiene el logro "創造者"\n`);
          continue;
        }

        // Otorgar el logro
        const achievement = achievementManager.awardAchievement(userId, GUILD_ID, 'creator');

        if (achievement) {
          console.log(`   ✅ Logro "創造者" otorgado correctamente`);
          console.log(`   💰 Recompensa: +${achievement.reward.koku} koku`);
          console.log(`   👑 Título: "${achievement.reward.title}"`);

          // Asignar rol/etiqueta del servidor
          if (achievementManager.shouldCreateRoleTag(achievement)) {
            await achievementManager.assignAchievementRole(guild, userId, achievement);
            console.log(`   🏷️  Rol de logro asignado (aparecerá en perfil del servidor)`);
          }
        } else {
          console.log(`   ❌ Error: No se pudo otorgar el logro`);
        }

        console.log(''); // Línea en blanco
      } catch (error) {
        if (error.code === 10007) {
          console.log(`   ❌ Usuario ${userId} no encontrado en el servidor\n`);
        } else {
          console.error(`   ❌ Error procesando usuario ${userId}:`, error.message, '\n');
        }
      }
    }

    // Guardar cambios
    dataManager.saveAllData();
    console.log('💾 Datos guardados correctamente\n');

    console.log('✅ Script completado. Puedes cerrar el bot con Ctrl+C');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);

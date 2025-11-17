require('dotenv').config();
const { REST, Routes } = require('discord.js');
const commands = require('../commands/definitions');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID; // Opcional: ID del servidor para registro inmediato

if (!token || !clientId) {
  console.error('❌ Error: DISCORD_TOKEN o CLIENT_ID no están configurados en .env');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`🔄 Registrando ${commands.length} comandos slash...`);

    let data;
    
    if (guildId) {
      // Registrar comandos en un servidor específico (aparecen inmediatamente)
      console.log(`📌 Registrando comandos en servidor específico: ${guildId}`);
      data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands.map(cmd => cmd.toJSON()) }
      );
      console.log(`✅ ${data.length} comandos slash registrados exitosamente en el servidor!`);
      console.log('💡 Los comandos aparecerán INMEDIATAMENTE en este servidor.');
    } else {
      // Registrar comandos globalmente (disponibles en todos los servidores)
      console.log('🌍 Registrando comandos globalmente...');
      data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands.map(cmd => cmd.toJSON()) }
      );
      console.log(`✅ ${data.length} comandos slash registrados exitosamente!`);
      console.log('💡 Los comandos pueden tardar hasta 1 hora en aparecer globalmente.');
    }
    
    console.log('\n📝 Comandos registrados:');
    data.forEach(cmd => console.log(`   /${cmd.name} - ${cmd.description}`));
    console.log('\n💡 Reinicia Discord si no los ves inmediatamente.');
    
    if (!guildId) {
      console.log('\n💡 TIP: Para registro inmediato, agrega GUILD_ID en tu .env y usa este script.');
    }
  } catch (error) {
    console.error('❌ Error registrando comandos:', error);
    if (error.code === 50001) {
      console.error('💡 El bot no tiene acceso al servidor. Verifica el GUILD_ID.');
    } else if (error.code === 50035) {
      console.error('💡 Error en el formato de los comandos. Verifica commands.js');
    }
    process.exit(1);
  }
})();


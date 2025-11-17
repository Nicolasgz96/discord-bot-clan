require('dotenv').config();
const { REST, Routes } = require('discord.js');
const commands = require('./commands/definitions');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
  console.error('❌ Error: DISCORD_TOKEN o CLIENT_ID no están configurados en .env');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`🔄 Registrando ${commands.length} comandos slash...`);

    // Registrar comandos globalmente (disponibles en todos los servidores)
    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands.map(cmd => cmd.toJSON()) }
    );

    console.log(`✅ ${data.length} comandos slash registrados exitosamente!`);
    console.log('📝 Comandos registrados:');
    data.forEach(cmd => console.log(`   /${cmd.name} - ${cmd.description}`));
    console.log('\n💡 Los comandos pueden tardar hasta 1 hora en aparecer globalmente.');
    console.log('💡 Reinicia Discord si no los ves inmediatamente.');
  } catch (error) {
    console.error('❌ Error registrando comandos:', error);
    process.exit(1);
  }
})();

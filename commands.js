const { SlashCommandBuilder } = require('discord.js');

// DEMON HUNTER - Definición de todos los comandos slash con tema samurai
const commands = [
  new SlashCommandBuilder()
    .setName('testwelcome')
    .setDescription('⚔️ Genera una vista previa de tu tarjeta de bienvenida samurai'),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('⛩️ Muestra el manual del guerrero (lista de comandos del dojo)'),

  new SlashCommandBuilder()
    .setName('borrarmsg')
    .setDescription('🗡️ Elimina todos los mensajes de un guerrero en este canal')
    .addUserOption(option =>
      option
        .setName('usuario')
        .setDescription('El guerrero cuyos mensajes quieres eliminar')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('id_usuario')
        .setDescription('ID del guerrero (funciona incluso si ya no está en el dojo)')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('deshacerborrado')
    .setDescription('📜 Restaura los últimos mensajes eliminados en este canal'),

  new SlashCommandBuilder()
    .setName('hablar')
    .setDescription('🎤 El bot se une a tu canal de voz y habla el texto en español')
    .addStringOption(option =>
      option
        .setName('texto')
        .setDescription('El mensaje que el bot debe transmitir')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('join')
    .setDescription('🔗 El bot se une a tu canal de voz y lee mensajes automáticamente'),

  new SlashCommandBuilder()
    .setName('salir')
    .setDescription('👋 Desconecta el bot del canal de voz'),

  // FASE 3: Sistema de Honor y Rangos
  new SlashCommandBuilder()
    .setName('honor')
    .setDescription('⭐ Muestra tu honor actual y progreso hacia el siguiente rango'),

  new SlashCommandBuilder()
    .setName('rango')
    .setDescription('⚔️ Muestra tu rango samurai y beneficios'),

  new SlashCommandBuilder()
    .setName('top')
    .setDescription('🏆 Muestra el ranking de honor del dojo (top 10 guerreros)'),

  // FASE 4: Sistema de Economía y Recompensas Diarias
  new SlashCommandBuilder()
    .setName('daily')
    .setDescription('📅 Reclama tu recompensa diaria de koku (una vez cada 24 horas)'),

  new SlashCommandBuilder()
    .setName('balance')
    .setDescription('💰 Muestra tu balance de koku y honor'),

  new SlashCommandBuilder()
    .setName('bal')
    .setDescription('💰 Alias de /balance - muestra tu balance de koku y honor'),

  new SlashCommandBuilder()
    .setName('pay')
    .setDescription('💸 Transfiere koku a otro guerrero del dojo')
    .addUserOption(option =>
      option
        .setName('usuario')
        .setDescription('El guerrero que recibirá el koku')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('cantidad')
        .setDescription('Cantidad de koku a transferir (mínimo 10, máximo 10,000)')
        .setRequired(true)
        .setMinValue(10)
        .setMaxValue(10000)
    ),

  new SlashCommandBuilder()
    .setName('pagar')
    .setDescription('💸 Alias de /pay - transfiere koku a otro guerrero')
    .addUserOption(option =>
      option
        .setName('usuario')
        .setDescription('El guerrero que recibirá el koku')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('cantidad')
        .setDescription('Cantidad de koku a transferir (mínimo 10, máximo 10,000)')
        .setRequired(true)
        .setMinValue(10)
        .setMaxValue(10000)
    ),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('📊 Muestra los rankings del dojo (honor, koku y rachas)'),

  new SlashCommandBuilder()
    .setName('lb')
    .setDescription('📊 Alias de /leaderboard - muestra los rankings del dojo'),

  // FASE 6: Características Interactivas
  new SlashCommandBuilder()
    .setName('duelo')
    .setDescription('⚔️ Desafía a otro guerrero a un duelo de honor')
    .addUserOption(option =>
      option
        .setName('oponente')
        .setDescription('El guerrero que deseas desafiar (opcional, muestra dropdown si no se especifica)')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option
        .setName('apuesta')
        .setDescription('Cantidad de honor a apostar (10-500)')
        .setRequired(false)
        .setMinValue(10)
        .setMaxValue(500)
    ),

  new SlashCommandBuilder()
    .setName('sabiduria')
    .setDescription('📜 Recibe una cita de sabiduría samurai de los grandes maestros'),

  new SlashCommandBuilder()
    .setName('fortuna')
    .setDescription('🎴 Consulta tu Omikuji (fortuna del día) - 1 vez cada 24 horas'),

  new SlashCommandBuilder()
    .setName('perfil')
    .setDescription('👤 Muestra el perfil completo de un guerrero')
    .addUserOption(option =>
      option
        .setName('usuario')
        .setDescription('Usuario a consultar (deja vacío para ver tu perfil)')
        .setRequired(false)
    ),

  // FASE 7: Sistema de Traducción
  new SlashCommandBuilder()
    .setName('traducir')
    .setDescription('🌐 Traduce texto entre español, japonés e inglés')
    .addStringOption(option =>
      option
        .setName('idioma')
        .setDescription('Idioma de destino')
        .setRequired(true)
        .addChoices(
          { name: '🇪🇸 Español', value: 'español' },
          { name: '🇯🇵 Japonés', value: 'japonés' },
          { name: '🇬🇧 Inglés', value: 'inglés' }
        )
    )
    .addStringOption(option =>
      option
        .setName('texto')
        .setDescription('Texto a traducir (máximo 500 caracteres)')
        .setRequired(true)
    ),

  // FASE 5: Sistema de Clanes
  new SlashCommandBuilder()
    .setName('clan')
    .setDescription('🏯 Sistema de clanes - gestiona tu clan o crea uno nuevo')
    .addSubcommand(subcommand =>
      subcommand
        .setName('crear')
        .setDescription('⚔️ Crea un nuevo clan (requiere rango Daimyo y 5,000 koku)')
        .addStringOption(option =>
          option
            .setName('nombre')
            .setDescription('Nombre del clan (3-30 caracteres)')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('tag')
            .setDescription('Tag del clan (2-5 caracteres, ej: WAR, SHADOW, NINJA)')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('📜 Muestra información detallada de un clan')
        .addStringOption(option =>
          option
            .setName('nombre')
            .setDescription('Nombre o tag del clan (deja vacío para ver tu clan)')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('unirse')
        .setDescription('🚪 Únete a un clan existente')
        .addStringOption(option =>
          option
            .setName('nombre')
            .setDescription('Nombre o tag del clan')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('salir')
        .setDescription('🚶 Abandona tu clan actual')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('miembros')
        .setDescription('👥 Lista detallada de todos los miembros de tu clan')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('top')
        .setDescription('🏆 Ranking de los mejores clanes del servidor')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('invitar')
        .setDescription('✉️ Invita a un usuario a tu clan (solo líder)')
        .addUserOption(option =>
          option
            .setName('usuario')
            .setDescription('Usuario a invitar')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('expulsar')
        .setDescription('⚔️ Expulsa a un miembro de tu clan (solo líder)')
        .addUserOption(option =>
          option
            .setName('usuario')
            .setDescription('Usuario a expulsar (opcional, muestra dropdown si no se especifica)')
            .setRequired(false)
        )
    ),

  // FASE 8: Sistema de Tienda
  new SlashCommandBuilder()
    .setName('tienda')
    .setDescription('🏪 Tienda del dojo - Compra items con koku')
    .addSubcommand(subcommand =>
      subcommand
        .setName('ver')
        .setDescription('Ver todos los items disponibles en la tienda')
        .addStringOption(option =>
          option
            .setName('categoria')
            .setDescription('Filtrar por categoría')
            .setRequired(false)
            .addChoices(
              { name: '⚡ Boosts Temporales', value: 'boosts' },
              { name: '🎨 Cosméticos', value: 'cosmetics' },
              { name: '⭐ Permanentes', value: 'permanent' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('comprar')
        .setDescription('Comprar un item de la tienda')
        .addStringOption(option =>
          option
            .setName('item')
            .setDescription('ID del item a comprar (opcional, muestra dropdown si no se especifica)')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('inventario')
        .setDescription('Ver tu inventario de items comprados')
    ),

  new SlashCommandBuilder()
    .setName('purge')
    .setDescription('🧹 Ejecuta la purga manualmente (solo propietario)')
];

module.exports = commands;

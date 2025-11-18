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
        .setDescription('El guerrero que deseas desafiar')
        .setRequired(true)
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
            .setDescription('Usuario a expulsar')
            .setRequired(true)
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
            .setDescription('ID del item a comprar')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('inventario')
        .setDescription('Ver tu inventario de items comprados')
    ),

  new SlashCommandBuilder()
    .setName('purge')
    .setDescription('🧹 Ejecuta la purga manualmente (solo propietario)'),

  // FASE 8: Sistema de Cosméticos
  new SlashCommandBuilder()
    .setName('cosmetics')
    .setDescription('🎨 Usa y personaliza tus cosméticos')
    .addSubcommand(subcommand =>
      subcommand
        .setName('usar')
        .setDescription('Activa un cosmético de tu inventario')
        .addStringOption(option =>
          option
            .setName('tipo')
            .setDescription('Tipo de cosmético')
            .setRequired(true)
            .addChoices(
              { name: '👑 Títulos', value: 'title' },
              { name: '🏅 Badges', value: 'badge' },
              { name: '🎨 Colores de Rol', value: 'color' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('deseleccionar')
        .setDescription('Desactiva un tipo de cosmético')
        .addStringOption(option =>
          option
            .setName('tipo')
            .setDescription('Tipo de cosmético a desactivar')
            .setRequired(true)
            .addChoices(
              { name: '👑 Títulos', value: 'title' },
              { name: '🏅 Badges', value: 'badge' },
              { name: '🎨 Colores de Rol', value: 'color' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('ver')
        .setDescription('Ver todos tus cosméticos y cuál está activo')
    ),

  // ==================== SISTEMA DE MÚSICA (DOJO DEL SONIDO) ====================

  new SlashCommandBuilder()
    .setName('tocar')
    .setDescription('🎵 Reproduce música en el canal de voz')
    .addStringOption(option =>
      option
        .setName('cancion')
        .setDescription('Nombre de la canción o URL de YouTube')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('play')
    .setDescription('🎵 Alias de /tocar - reproduce música')
    .addStringOption(option =>
      option
        .setName('cancion')
        .setDescription('Nombre de la canción o URL de YouTube')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('pausar')
    .setDescription('⏸️ Pausa la reproducción actual'),

  new SlashCommandBuilder()
    .setName('pause')
    .setDescription('⏸️ Alias de /pausar'),

  new SlashCommandBuilder()
    .setName('reanudar')
    .setDescription('▶️ Reanuda la reproducción'),

  new SlashCommandBuilder()
    .setName('resume')
    .setDescription('▶️ Alias de /reanudar'),

  new SlashCommandBuilder()
    .setName('siguiente')
    .setDescription('⏭️ Salta a la siguiente canción'),

  new SlashCommandBuilder()
    .setName('skip')
    .setDescription('⏭️ Alias de /siguiente'),

  new SlashCommandBuilder()
    .setName('detener')
    .setDescription('⏹️ Detiene la música y limpia la cola'),

  new SlashCommandBuilder()
    .setName('stop')
    .setDescription('⏹️ Alias de /detener'),

  new SlashCommandBuilder()
    .setName('cola')
    .setDescription('📋 Muestra la cola de canciones actual'),

  new SlashCommandBuilder()
    .setName('queue')
    .setDescription('📋 Alias de /cola'),

  new SlashCommandBuilder()
    .setName('ahora')
    .setDescription('🎼 Muestra la canción que está sonando'),

  new SlashCommandBuilder()
    .setName('sonando')
    .setDescription('🎼 Alias de /ahora'),

  new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('🎼 Alias de /ahora'),

  new SlashCommandBuilder()
    .setName('np')
    .setDescription('🎼 Alias corto de /ahora'),

  new SlashCommandBuilder()
    .setName('volumen')
    .setDescription('🔊 Ajusta el volumen de la música')
    .addIntegerOption(option =>
      option
        .setName('nivel')
        .setDescription('Nivel de volumen (0-100)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(100)
    ),

  new SlashCommandBuilder()
    .setName('volume')
    .setDescription('🔊 Alias de /volumen')
    .addIntegerOption(option =>
      option
        .setName('nivel')
        .setDescription('Nivel de volumen (0-100)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(100)
    ),

  new SlashCommandBuilder()
    .setName('buscar')
    .setDescription('🔍 Busca canciones en YouTube')
    .addStringOption(option =>
      option
        .setName('termino')
        .setDescription('Término de búsqueda')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('search')
    .setDescription('🔍 Alias de /buscar')
    .addStringOption(option =>
      option
        .setName('termino')
        .setDescription('Término de búsqueda')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('mezclar')
    .setDescription('🔀 Mezcla aleatoriamente la cola'),

  new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('🔀 Alias de /mezclar'),

  new SlashCommandBuilder()
    .setName('repetir')
    .setDescription('🔁 Cambia el modo de repetición')
    .addStringOption(option =>
      option
        .setName('modo')
        .setDescription('Modo de repetición')
        .setRequired(true)
        .addChoices(
          { name: '🔂 Canción actual', value: 'song' },
          { name: '🔁 Cola completa', value: 'queue' },
          { name: '❌ Desactivar', value: 'off' }
        )
    ),

  new SlashCommandBuilder()
    .setName('loop')
    .setDescription('🔁 Alias de /repetir')
    .addStringOption(option =>
      option
        .setName('modo')
        .setDescription('Modo de repetición')
        .setRequired(true)
        .addChoices(
          { name: '🔂 Canción actual', value: 'song' },
          { name: '🔁 Cola completa', value: 'queue' },
          { name: '❌ Desactivar', value: 'off' }
        )
    ),

  new SlashCommandBuilder()
    .setName('limpiar')
    .setDescription('🗑️ Limpia toda la cola de canciones'),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('🗑️ Alias de /limpiar'),

  new SlashCommandBuilder()
    .setName('saltar')
    .setDescription('⏭️ Salta a una posición específica en la cola')
    .addIntegerOption(option =>
      option
        .setName('posicion')
        .setDescription('Posición a la que saltar (1 = primera canción)')
        .setRequired(true)
        .setMinValue(1)
    ),

  new SlashCommandBuilder()
    .setName('jump')
    .setDescription('⏭️ Alias de /saltar')
    .addIntegerOption(option =>
      option
        .setName('posicion')
        .setDescription('Posición a la que saltar (1 = primera canción)')
        .setRequired(true)
        .setMinValue(1)
    ),

  new SlashCommandBuilder()
    .setName('remover')
    .setDescription('❌ Remueve una canción de la cola')
    .addIntegerOption(option =>
      option
        .setName('posicion')
        .setDescription('Posición de la canción a remover')
        .setRequired(true)
        .setMinValue(1)
    ),

  new SlashCommandBuilder()
    .setName('remove')
    .setDescription('❌ Alias de /remover')
    .addIntegerOption(option =>
      option
        .setName('posicion')
        .setDescription('Posición de la canción a remover')
        .setRequired(true)
        .setMinValue(1)
    ),

  // ==================== PLAYLISTS ====================
  new SlashCommandBuilder()
    .setName('playlist')
    .setDescription('📚 Gestiona tus playlists personalizadas del dojo')
    .addSubcommand(subcommand =>
      subcommand
        .setName('crear')
        .setDescription('Crea una nueva playlist vacía')
        .addStringOption(option =>
          option
            .setName('nombre')
            .setDescription('Nombre de la playlist')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('guardar')
        .setDescription('Guarda la cola actual como una playlist')
        .addStringOption(option =>
          option
            .setName('nombre')
            .setDescription('Nombre de la playlist')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('cargar')
        .setDescription('Carga una playlist a la cola de reproducción')
        .addStringOption(option =>
          option
            .setName('nombre')
            .setDescription('Nombre de la playlist a cargar')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('listar')
        .setDescription('Muestra todas tus playlists')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('ver')
        .setDescription('Muestra las canciones de una playlist')
        .addStringOption(option =>
          option
            .setName('nombre')
            .setDescription('Nombre de la playlist')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('eliminar')
        .setDescription('Elimina una playlist permanentemente')
        .addStringOption(option =>
          option
            .setName('nombre')
            .setDescription('Nombre de la playlist a eliminar')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('renombrar')
        .setDescription('Cambia el nombre de una playlist')
        .addStringOption(option =>
          option
            .setName('nombre_actual')
            .setDescription('Nombre actual de la playlist')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('nombre_nuevo')
            .setDescription('Nuevo nombre para la playlist')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('agregar')
        .setDescription('Agrega una canción a una playlist existente')
        .addStringOption(option =>
          option
            .setName('playlist')
            .setDescription('Nombre de la playlist')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('cancion')
            .setDescription('URL o búsqueda de la canción')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('quitar')
        .setDescription('Quita una canción de una playlist')
        .addStringOption(option =>
          option
            .setName('playlist')
            .setDescription('Nombre de la playlist')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('posicion')
            .setDescription('Posición de la canción a quitar (1 = primera)')
            .setRequired(true)
            .setMinValue(1)
        )
    ),

  // ==================== AYUDA DE MÚSICA ====================
  new SlashCommandBuilder()
    .setName('ayudamusica')
    .setDescription('🎵 Muestra todos los comandos de música disponibles en el dojo'),

  new SlashCommandBuilder()
    .setName('helpmusic')
    .setDescription('🎵 Alias de /ayudamusica - Muestra comandos de música'),

  // ==================== SISTEMA DE LOGROS ====================
  new SlashCommandBuilder()
    .setName('logros')
    .setDescription('🏆 Muestra tus logros y medallas de honor'),

  new SlashCommandBuilder()
    .setName('achievements')
    .setDescription('🏆 Alias de /logros - Muestra tus logros'),

  new SlashCommandBuilder()
    .setName('medallas')
    .setDescription('🏅 Ver tus medallas y progreso de logros'),
];

module.exports = commands;

/**
 * DEMON HUNTER - Samurai Themed Messages
 * All user-facing messages in Spanish with samurai context
 */

const EMOJIS_SRC = require('../src/config/emojis');
const EMOJIS_CONFIG = require('./emojis');
// Combinar emojis de ambas fuentes
const EMOJIS = { ...EMOJIS_SRC, ...EMOJIS_CONFIG };

const MESSAGES = {
  // Error Messages (Samurai Context)
  ERRORS: {
    NO_PERMISSION: `${EMOJIS.KATANA} Tu nivel de honor no es suficiente para esta acción, guerrero.`,
    COOLDOWN: (seconds) => `${EMOJIS.FIRE} Tu katana debe descansar. Vuelve en **${seconds} segundos**, samurái.`,
    COOLDOWN_MINUTES: (minutes) => `${EMOJIS.FIRE} Tu katana debe descansar. Vuelve en **${minutes} minutos**, samurái.`,
    COMMAND_ERROR: `${EMOJIS.ERROR} Un error inesperado ha ocurrido. El maestro del dojo ha sido notificado.`,
    INVALID_USER: `${EMOJIS.WARNING} No he podido encontrar a ese guerrero en el dojo.`,
    INVALID_ARGS: `${EMOJIS.WARNING} Los argumentos del comando no son correctos, guerrero.`,
    BOT_MISSING_PERMS: `${EMOJIS.ERROR} No tengo los permisos necesarios para ejecutar esta acción.`,
    DATABASE_ERROR: `${EMOJIS.ERROR} Los pergaminos del dojo están temporalmente inaccesibles.`,
    RATE_LIMIT: `${EMOJIS.WARNING} Estás actuando demasiado rápido, guerrero. La paciencia es una virtud samurai.`,
  },

  // Success Messages
  SUCCESS: {
    COMMAND_EXECUTED: `${EMOJIS.SUCCESS} Hecho con honor.`,
    DATA_SAVED: `${EMOJIS.SUCCESS} Los pergaminos han sido actualizados.`,
    ROLE_ASSIGNED: `${EMOJIS.CROWN} Un nuevo rango te ha sido otorgado, guerrero.`,
    HONOR_GAINED: (amount) => `${EMOJIS.HONOR} Has ganado **${amount} puntos de honor**.`,
    KOKU_GAINED: (amount) => `${EMOJIS.COIN} Has ganado **${amount} koku**.`,
  },

  // Welcome Messages
  WELCOME: {
    NEW_MEMBER: (member) => `${EMOJIS.CASTLE} Un nuevo cazador de demonios entra al dojo. ¡Bienvenido, ${member}!`,
    ROLE_ASSIGNED: `${EMOJIS.KATANA} Se te ha otorgado el rango de **Ronin**. Gana honor para ascender.`,
    WELCOME_CARD_TITLE: 'Bienvenido al Dojo',
    WELCOME_CARD_SUBTITLE: (serverName) => `${serverName}`,
  },

  // Honor System
  HONOR: {
    RANK_UP: (newRank) => `${EMOJIS.LEVEL_UP} ¡Felicidades! Has ascendido al rango de **${newRank}**!`,
    RANK_DOWN: (newRank) => `${EMOJIS.WARNING} Has descendido al rango de **${newRank}**.`,
    HONOR_GAINED_MESSAGE: `${EMOJIS.HONOR} ¡Honor ganado por tu actividad!`,
    HONOR_LOST_WARNING: `${EMOJIS.WARNING} Has perdido honor por tu conducta deshonrosa.`,
    INSUFFICIENT_HONOR: (required) => `${EMOJIS.WARNING} Necesitas al menos **${required} puntos de honor** para esto.`,
  },

  // Clan Messages
  CLAN: {
    CREATED: (clanName, tag) => `${EMOJIS.CASTLE} ¡Clan **${clanName}** [${tag}] creado con éxito!`,
    JOINED: (clanName, tag) => `${EMOJIS.SUCCESS} Te has unido al clan **${clanName}** [${tag}].`,
    LEFT: (clanName) => `${EMOJIS.INFO} Has abandonado el clan **${clanName}**.`,
    DISBANDED: (clanName) => `${EMOJIS.WARNING} El clan **${clanName}** ha sido disuelto.`,
    INVITATION_SENT: (userName) => `${EMOJIS.CLAN_INVITE} Invitación enviada a **${userName}**.`,
    INVITATION_RECEIVED: (clanName, inviterName) => `${EMOJIS.CLAN_INVITE} **${inviterName}** te ha invitado al clan **${clanName}**.`,
    ALREADY_IN_CLAN: `${EMOJIS.WARNING} Ya perteneces a un clan. Debes salir primero.`,
    NOT_IN_CLAN: `${EMOJIS.WARNING} No perteneces a ningún clan.`,
    INSUFFICIENT_KOKU: (required) => `${EMOJIS.COIN} Necesitas **${required} koku** para crear un clan.`,
    INSUFFICIENT_RANK: `${EMOJIS.WARNING} Necesitas el rango de **Daimyo** (2,000+ honor) para crear un clan.`,
    CLAN_FULL: (maxMembers) => `${EMOJIS.WARNING} El clan está lleno (máximo ${maxMembers} miembros).`,
    CLAN_NOT_FOUND: `${EMOJIS.ERROR} No se encontró ese clan en este servidor.`,
    CLAN_NAME_EXISTS: `${EMOJIS.WARNING} Ya existe un clan con ese nombre o tag en este servidor.`,
    CLAN_CREATED_DETAILS: (name, tag, cost) =>
      `${EMOJIS.CASTLE} ¡Clan **${name}** [${tag}] fundado exitosamente!\n${EMOJIS.KOKU} Costo: -${cost} koku\n${EMOJIS.LEADER} Eres el líder del clan.`,
    MEMBER_JOINED: (userName) => `${EMOJIS.SUCCESS} **${userName}** se ha unido al clan.`,
    MEMBER_LEFT: (userName) => `${EMOJIS.INFO} **${userName}** ha abandonado el clan.`,
    MEMBER_KICKED: (userName) => `${EMOJIS.CLAN_KICK} **${userName}** ha sido expulsado del clan.`,
    YOU_WERE_KICKED: (clanName) => `${EMOJIS.WARNING} Has sido expulsado del clan **${clanName}**.`,
    LEADERSHIP_TRANSFERRED: (newLeaderName) => `${EMOJIS.LEADER} El liderazgo ha sido transferido a **${newLeaderName}**.`,
    CANNOT_KICK_SELF: `${EMOJIS.WARNING} No puedes expulsarte a ti mismo. Usa \`/clan salir\` en su lugar.`,
    ONLY_LEADER: `${EMOJIS.WARNING} Solo el líder del clan puede hacer esto.`,
    INVALID_CLAN_NAME: `${EMOJIS.WARNING} El nombre del clan debe tener entre 3 y 30 caracteres.`,
    INVALID_CLAN_TAG: `${EMOJIS.WARNING} El tag del clan debe tener entre 2 y 5 caracteres (solo letras y números).`,
    CONFIRM_LEAVE_LEADER: `${EMOJIS.WARNING} Eres el líder del clan. Si sales, el liderazgo se transferirá al miembro con más honor.`,
    CONFIRM_DISBAND: `${EMOJIS.WARNING} Eres el único miembro. Si sales, el clan será disuelto.`,
    LEVEL_UP: (newLevel, levelName) => `${EMOJIS.LEVEL_UP} ¡El clan ha subido a nivel **${newLevel}** (${levelName})!`,
    INVITATION_EXPIRED: `${EMOJIS.WARNING} La invitación ha expirado.`,
    INVITATION_ACCEPTED: (userName, clanName) => `${EMOJIS.SUCCESS} **${userName}** ha aceptado la invitación al clan **${clanName}**.`,
    INVITATION_DECLINED: (userName) => `${EMOJIS.INFO} **${userName}** ha rechazado la invitación.`,
  },

  // Economy
  ECONOMY: {
    DAILY_CLAIMED: (koku, streak) =>
      `${EMOJIS.DAILY} ¡Recompensa diaria reclamada!\n${EMOJIS.KOKU} +${koku} koku\n${EMOJIS.STREAK} Racha: ${streak} días`,
    DAILY_ALREADY_CLAIMED: (timeLeft) =>
      `${EMOJIS.WARNING} Ya has reclamado tu recompensa diaria. Vuelve en **${timeLeft}**.`,
    DAILY_STREAK_LOST: `${EMOJIS.WARNING} ¡Perdiste tu racha! Reclama todos los días para mantenerla.`,
    DAILY_NEW_STREAK: (streak) => `${EMOJIS.FIRE} ¡Nueva racha de **${streak}** días!`,
    PURCHASE_SUCCESS: (itemName) => `${EMOJIS.SUCCESS} Has comprado **${itemName}**.`,
    PURCHASE_FAILED: `${EMOJIS.ERROR} No tienes suficiente koku para esta compra.`,
    BALANCE: (koku, honor) => `${EMOJIS.KOKU} Koku: **${koku}** | ${EMOJIS.HONOR} Honor: **${honor}**`,
    INSUFFICIENT_KOKU: (required, current) =>
      `${EMOJIS.ERROR} No tienes suficiente koku. Necesitas **${required}** pero solo tienes **${current}**.`,
    PAYMENT_SUCCESS: (amount, recipient) =>
      `${EMOJIS.PAYMENT} Has transferido **${amount} koku** a **${recipient}**.`,
    PAYMENT_RECEIVED: (amount, sender) =>
      `${EMOJIS.KOKU} Has recibido **${amount} koku** de **${sender}**.`,
    CANNOT_PAY_SELF: `${EMOJIS.WARNING} No puedes transferir koku a ti mismo, guerrero.`,
    INVALID_AMOUNT: `${EMOJIS.ERROR} La cantidad debe ser un número válido entre 10 y 10,000 koku.`,
    LEADERBOARD_HONOR: `${EMOJIS.TROPHY} Ranking de Honor del Dojo`,
    LEADERBOARD_KOKU: `${EMOJIS.WEALTH} Ranking de Riqueza del Dojo`,
    LEADERBOARD_STREAK: `${EMOJIS.FIRE} Ranking de Rachas Diarias`,
  },

  // Duel Messages (FASE 6)
  DUEL: {
    CHALLENGE_SENT: (opponent, bet) => `${EMOJIS.DUEL} Has desafiado a **${opponent}** a un duelo de honor.\n${EMOJIS.HONOR} Apuesta: **${bet} puntos de honor**`,
    CHALLENGE_RECEIVED: (challenger, bet) =>
      `${EMOJIS.DUEL} **${challenger}** te ha desafiado a un duelo samurai.\n${EMOJIS.HONOR} Apuesta: **${bet} honor**\n\n${EMOJIS.KATANA} ¿Aceptas el desafío?`,
    DUEL_ACCEPTED: `${EMOJIS.KATANA} ¡El duelo ha comenzado! Elige tu arma, guerrero.`,
    DUEL_DECLINED: `${EMOJIS.INFO} El desafío ha sido rechazado.`,
    DUEL_EXPIRED: (opponentName, seconds) => `${EMOJIS.WARNING} El desafío ha expirado porque **${opponentName}** no respondió a tiempo (${seconds} segundos). El duelo fue cancelado automáticamente.`,
    DUEL_WEAPON_TIMEOUT: (missingPlayer, seconds) => `${EMOJIS.WARNING} El duelo fue cancelado porque **${missingPlayer}** no eligió su arma a tiempo (${seconds} segundos). Ambos jugadores deben elegir su arma dentro del tiempo límite.`,
    DUEL_WEAPON_ALREADY_CHOSEN: `${EMOJIS.INFO} Ya elegiste tu arma. Espera a que tu oponente elija la suya.`,
    DUEL_WEAPON_EXPIRED: `${EMOJIS.WARNING} El tiempo para elegir arma ha expirado. Este duelo ya fue procesado o cancelado. Por favor, inicia un nuevo duelo si deseas combatir.`,
    DUEL_WON: (winner, loser, bet, winnerWeapon, loserWeapon) =>
      `${EMOJIS.TROPHY} **${winner}** ha vencido a **${loser}**!\n\n${winnerWeapon} vence a ${loserWeapon}\n\n${EMOJIS.HONOR} **${winner}** gana +${bet} honor\n${EMOJIS.WARNING} **${loser}** pierde -${bet} honor`,
    DUEL_DRAW: (challenger, opponent, weapon) =>
      `${EMOJIS.INFO} ¡Empate! Ambos eligieron ${weapon}.\n\nNo hay ganador ni perdedor. El honor permanece intacto.`,
    WEAPON_CHOICE: `${EMOJIS.KATANA} Elige tu arma para el duelo:`,
    CANNOT_DUEL_SELF: `${EMOJIS.WARNING} No puedes desafiarte a ti mismo, guerrero.`,
    CANNOT_DUEL_BOT: `${EMOJIS.WARNING} No puedes desafiar al maestro del dojo.`,
    INSUFFICIENT_HONOR: (required) => `${EMOJIS.WARNING} No tienes suficiente honor para apostar. Necesitas al menos **${required}** puntos.`,
    OPPONENT_INSUFFICIENT_HONOR: (opponent) => `${EMOJIS.WARNING} **${opponent}** no tiene suficiente honor para aceptar esta apuesta.`,
    INVALID_BET: (min, max) => `${EMOJIS.ERROR} La apuesta debe estar entre **${min}** y **${max}** puntos de honor.`,
    DUEL_STATS_UPDATED: (won, lost, total) => `\n\n📊 Estadísticas de duelos: **${won}** victorias, **${lost}** derrotas (${total} totales)`,
  },

  // Moderation (Samurai Context)
  MODERATION: {
    MESSAGES_DELETED: (count, user) =>
      `${EMOJIS.KATANA} **${count} mensajes** de **${user}** han sido eliminados del dojo.`,
    MESSAGES_RESTORED: (count) =>
      `${EMOJIS.SUCCESS} **${count} mensajes** han sido restaurados.`,
    USER_WARNED: (user, reason) =>
      `${EMOJIS.WARNING} **${user}** ha recibido una advertencia.\nRazón: ${reason}`,
    USER_EXILED: (user, reason) =>
      `${EMOJIS.ERROR} **${user}** ha sido exiliado del dojo.\nRazón: ${reason}`,
    CONFIRM_DELETE: (user, count) =>
      `${EMOJIS.WARNING} ¿Estás seguro de eliminar **${count} mensajes** de **${user}**?`,
    UNDO_AVAILABLE: `${EMOJIS.INFO} Usa \`/deshacerborrado\` en los próximos 5 minutos para restaurar.`,
  },

  // Help Messages
  HELP: {
    FOOTER: '🎌 Código Bushido • Demon Hunter',
    TITLE: `${EMOJIS.TORII} Comandos del Dojo`,
    DESCRIPTION: 'Bienvenido al manual del guerrero. Aquí encontrarás todos los comandos disponibles.',
  },

  // Fortune Messages (FASE 6)
  FORTUNE: {
    GREAT: `🌸 **DAI-KICHI** (Gran Bendición)\n\nLos vientos del destino soplan a tu favor, guerrero. Los dioses te sonríen.\n\n✨ **Bonus:** +20% honor por 24 horas`,
    GOOD: `⭐ **KICHI** (Bendición)\n\nUn día propicio te aguarda. La fortuna camina a tu lado.\n\n✨ **Bonus:** +10% honor por 24 horas`,
    MEDIUM: `🌑 **CHUKICHI** (Bendición Media)\n\nNi bueno ni malo. El destino es neutral. Depende de ti cambiar tu suerte.\n\n📊 Sin bonus ni penalización`,
    BAD: `⚠️ **KYO** (Mala Suerte)\n\nCuidado, guerrero. Las sombras del infortunio te acechan hoy.\n\n⚡ **Penalización:** -10% honor por 24 horas`,
    ALREADY_CLAIMED: (timeLeft) => `${EMOJIS.WARNING} Ya has consultado tu fortuna hoy. Vuelve en **${timeLeft}**.`,
    TITLE: '🎴 Omikuji - Fortuna del Día',
    FOOTER: 'La fortuna cambia con las estaciones',
  },

  // Wisdom Messages (FASE 6)
  WISDOM: {
    TITLE: '📜 Sabiduría Samurai',
    FOOTER: 'Palabras de los grandes maestros',
  },

  // Profile Messages (FASE 6)
  PROFILE: {
    TITLE: (username) => `${EMOJIS.SCROLL} Perfil de ${username}`,
    STATS_TITLE: '📊 Estadísticas',
    CLAN_TITLE: '🏯 Clan',
    FORTUNE_TITLE: '🎴 Fortuna Actual',
    NO_CLAN: 'Sin clan',
    NO_FORTUNE: 'No consultada hoy',
  },

  // Translation Messages (FASE 7)
  TRANSLATION: {
    TITLE: (fromLang, toLang) => `${EMOJIS.GLOBE} Traducción: ${fromLang} → ${toLang}`,
    ORIGINAL: 'Original',
    TRANSLATED: 'Traducido',
    ROMANIZATION: 'Romanización',
    ERROR: `${EMOJIS.ERROR} Error al traducir el texto. Por favor intenta de nuevo.`,
    TOO_LONG: (max) => `${EMOJIS.WARNING} El texto es demasiado largo. Máximo **${max}** caracteres.`,
    INVALID_LANGUAGE: `${EMOJIS.ERROR} Idioma no válido. Usa: español, japonés o inglés.`,
  },

  // Generic
  GENERIC: {
    LOADING: `${EMOJIS.LOADING} Consultando los pergaminos...`,
    CANCELLED: `${EMOJIS.INFO} Operación cancelada.`,
    TIMEOUT: `${EMOJIS.WARNING} El tiempo ha expirado.`,
    TIMEOUT_PAYMENT: (seconds) => `${EMOJIS.WARNING} Se agotó el tiempo para confirmar la transferencia (${seconds} segundos). La operación fue cancelada automáticamente.`,
    TIMEOUT_DELETE: (seconds) => `${EMOJIS.WARNING} Se agotó el tiempo para confirmar el borrado (${seconds} segundos). La operación fue cancelada automáticamente.`,
    TIMEOUT_CLAN: (seconds) => `${EMOJIS.WARNING} Se agotó el tiempo para confirmar la acción (${seconds} segundos). La operación fue cancelada automáticamente.`,
    NOT_FOUND: `${EMOJIS.ERROR} No encontrado en los pergaminos del dojo.`,
    COMING_SOON: `${EMOJIS.INFO} Esta característica estará disponible pronto, guerrero.`,
    INTERACTION_EXPIRED: `${EMOJIS.WARNING} Esta interacción ha expirado. Por favor, ejecuta el comando nuevamente.`,
    BUTTON_DISABLED: `${EMOJIS.WARNING} Este botón ya no está disponible. La interacción expiró o fue cancelada.`,
  },

  // Música (Dojo del Sonido) - Mensajes con temática samurai
  MUSIC: {
    // Reproducción
    NOW_PLAYING: (title, duration) => `${EMOJIS.SHAKUHACHI} **El shakuhachi resuena en el dojo...**\n\n🎵 ${title}\n⏱️ Duración: ${duration}`,
    SONG_ADDED: (title, position) => `${EMOJIS.SUCCESS} **Canción agregada a la cola**\n\n🎵 ${title}\n📋 Posición: **#${position}**`,
    PLAYLIST_ADDED: (count) => `${EMOJIS.PLAYLIST} **${count} canciones** han sido agregadas a la cola del dojo.`,
    PLAYING_STARTED: `${EMOJIS.PLAY} El guerrero ha comenzado a tocar su instrumento...`,
    PAUSED: `${EMOJIS.PAUSE} La música del dojo se detiene momentáneamente...`,
    RESUMED: `${EMOJIS.PLAY} Las cuerdas del koto continúan resonando...`,
    STOPPED: `${EMOJIS.STOP} El silencio regresa al dojo.`,
    SKIPPED: (title) => `${EMOJIS.SKIP} **Canción omitida**\n⏭️ ${title}`,

    // Queue
    QUEUE_EMPTY: `${EMOJIS.WARNING} La cola está vacía, guerrero. Usa \`/tocar\` para agregar canciones.`,
    QUEUE_CLEARED: `${EMOJIS.SUCCESS} La cola ha sido limpiada por completo.`,
    QUEUE_SHUFFLED: `${EMOJIS.SHUFFLE} Las canciones han sido mezcladas como las hojas en el viento.`,

    // Loop
    LOOP_DISABLED: `${EMOJIS.INFO} Repetición desactivada.`,
    LOOP_SONG: `${EMOJIS.LOOP_ONE} La canción actual se repetirá eternamente...`,
    LOOP_QUEUE: `${EMOJIS.LOOP} La cola completa se repetirá en ciclo infinito.`,

    // Volume
    VOLUME_CHANGED: (volume) => `${EMOJIS.VOLUME_HIGH} Volumen ajustado a **${volume}%**`,
    VOLUME_TOO_LOW: `${EMOJIS.WARNING} El volumen debe ser al menos **1%**.`,
    VOLUME_TOO_HIGH: `${EMOJIS.WARNING} El volumen no puede exceder **100%**.`,

    // Búsqueda
    SEARCHING: `${EMOJIS.SEARCH} Buscando en los pergaminos musicales...`,
    SEARCH_RESULTS: `${EMOJIS.SCROLL} **Resultados de búsqueda**\n\nSelecciona una canción usando los botones:`,
    SEARCH_TIMEOUT: `${EMOJIS.WARNING} Tiempo de selección agotado. La búsqueda ha sido cancelada.`,
    SEARCH_CANCELLED: `${EMOJIS.INFO} Búsqueda cancelada.`,
    NO_RESULTS: `${EMOJIS.ERROR} No se encontraron resultados para tu búsqueda.`,

    // Errores
    NOT_IN_VOICE: `${EMOJIS.WARNING} Debes estar en un canal de voz para invocar la música del dojo.`,
    WRONG_CHANNEL: (channelId) => `${EMOJIS.WARNING} Los comandos de música solo pueden usarse en <#${channelId}>. Usa \`/ayudamusica\` para ver todos los comandos disponibles.`,
    BOT_NOT_IN_VOICE: `${EMOJIS.WARNING} El maestro no está en ningún canal de voz.`,
    DIFFERENT_VOICE_CHANNEL: `${EMOJIS.WARNING} Debes estar en el mismo canal de voz que el maestro del dojo.`,
    NO_SONG_PLAYING: `${EMOJIS.WARNING} No hay ninguna canción reproduciéndose actualmente.`,
    INVALID_URL: `${EMOJIS.ERROR} La URL proporcionada no es válida.`,
    SONG_TOO_LONG: (maxDuration) => `${EMOJIS.WARNING} La canción es demasiado larga. Duración máxima: **${maxDuration} minutos**.`,
    QUEUE_FULL: (maxSize) => `${EMOJIS.WARNING} La cola está llena (máximo ${maxSize} canciones).`,
    CANNOT_CONNECT: `${EMOJIS.ERROR} No tengo permisos para unirme a tu canal de voz.`,
    CANNOT_SPEAK: `${EMOJIS.ERROR} No tengo permisos para reproducir audio en ese canal.`,
    PLAYBACK_ERROR: `${EMOJIS.ERROR} Ocurrió un error al reproducir la canción. Saltando a la siguiente...`,
    SEARCH_ERROR: `${EMOJIS.ERROR} Error al buscar canciones. Por favor intenta de nuevo.`,

    // Desconexión
    DISCONNECTED: `${EMOJIS.INFO} El maestro ha abandonado el dojo musical.`,
    DISCONNECTED_EMPTY: `${EMOJIS.INFO} El canal de voz quedó vacío. El maestro se retira del dojo.`,
    DISCONNECTED_INACTIVITY: `${EMOJIS.INFO} Sin actividad musical. El maestro se retira para meditar.`,

    // Jump
    JUMPED_TO_SONG: (position, title) => `${EMOJIS.SKIP} **Saltando a posición #${position}**\n🎵 ${title}`,
    INVALID_POSITION: (maxPosition) => `${EMOJIS.WARNING} Posición inválida. La cola tiene ${maxPosition} canciones.`,

    // Remove
    SONG_REMOVED: (position, title) => `${EMOJIS.SUCCESS} **Canción removida** (posición #${position})\n🎵 ${title}`,

    // Lyrics
    LYRICS_TITLE: (title) => `${EMOJIS.LYRICS} **Letra de:** ${title}`,
    LYRICS_NOT_FOUND: `${EMOJIS.WARNING} No se encontraron letras para esta canción.`,

    // 24/7 Mode
    MODE_247_ENABLED: `${EMOJIS.SUCCESS} **Modo 24/7 activado**\nEl maestro permanecerá en el canal permanentemente.`,
    MODE_247_DISABLED: `${EMOJIS.INFO} **Modo 24/7 desactivado**\nEl maestro saldrá del canal cuando termine la música.`,

    // Footer
    FOOTER: '🎋 Dojo del Sonido • Demon Hunter',
  },

  // Playlists - Biblioteca Musical del Samurai
  PLAYLISTS: {
    // Crear
    CREATED: (name) => `${EMOJIS.SUCCESS} **Playlist creada exitosamente**\n📚 ${name}`,
    CREATED_FROM_QUEUE: (name, count) => `${EMOJIS.SUCCESS} **Playlist guardada desde la cola**\n📚 ${name}\n🎵 ${count} canciones guardadas`,
    NAME_TOO_SHORT: `${EMOJIS.WARNING} El nombre de la playlist debe tener al menos 2 caracteres.`,
    NAME_TOO_LONG: `${EMOJIS.WARNING} El nombre de la playlist no puede exceder 50 caracteres.`,
    ALREADY_EXISTS: (name) => `${EMOJIS.WARNING} Ya tienes una playlist llamada **${name}**.`,
    MAX_PLAYLISTS_REACHED: (max) => `${EMOJIS.WARNING} Has alcanzado el límite de ${max} playlists. Elimina alguna para crear una nueva.`,

    // Cargar
    LOADED: (name, count) => `${EMOJIS.PLAYLIST} **Playlist cargada**\n📚 ${name}\n🎵 ${count} canciones agregadas a la cola`,
    NOT_FOUND: (name) => `${EMOJIS.WARNING} No se encontró ninguna playlist llamada **${name}**.`,
    EMPTY_PLAYLIST: (name) => `${EMOJIS.WARNING} La playlist **${name}** está vacía.`,

    // Agregar canciones
    SONG_ADDED: (songTitle, playlistName) => `${EMOJIS.SUCCESS} **Canción agregada a playlist**\n🎵 ${songTitle}\n📚 ${playlistName}`,
    MAX_SONGS_REACHED: (max) => `${EMOJIS.WARNING} La playlist ha alcanzado el máximo de ${max} canciones.`,

    // Remover canciones
    SONG_REMOVED: (songTitle, playlistName) => `${EMOJIS.SUCCESS} **Canción removida**\n🎵 ${songTitle}\n📚 ${playlistName}`,
    INVALID_SONG_INDEX: `${EMOJIS.WARNING} Posición de canción inválida.`,

    // Listar
    NO_PLAYLISTS: `${EMOJIS.INFO} No tienes playlists guardadas. Crea una con \`/playlist crear\`.`,
    LIST_TITLE: `${EMOJIS.PLAYLIST} **Tus Playlists del Dojo**`,
    LIST_ITEM: (name, count, plays) => `📚 **${name}** - ${count} canciones (${plays} reproducciones)`,

    // Eliminar
    DELETED: (name) => `${EMOJIS.SUCCESS} Playlist **${name}** eliminada del pergamino musical.`,
    CONFIRM_DELETE: (name) => `${EMOJIS.WARNING} ¿Estás seguro de eliminar la playlist **${name}**? Esta acción no se puede deshacer.`,

    // Renombrar
    RENAMED: (oldName, newName) => `${EMOJIS.SUCCESS} Playlist renombrada:\n**${oldName}** → **${newName}**`,

    // Ver detalles
    DETAILS_TITLE: (name) => `${EMOJIS.SCROLL} **Playlist:** ${name}`,
    DETAILS_OWNER: 'Creador',
    DETAILS_SONGS: 'Canciones',
    DETAILS_CREATED: 'Creada',
    DETAILS_PLAYS: 'Reproducciones',
    DETAILS_VISIBILITY: 'Visibilidad',
    VISIBILITY_PUBLIC: 'Pública',
    VISIBILITY_PRIVATE: 'Privada',

    // Vacía
    NO_QUEUE_TO_SAVE: `${EMOJIS.WARNING} No hay canciones en la cola para guardar. Agrega canciones primero con \`/tocar\`.`,

    // Permisos
    NOT_OWNER: (name) => `${EMOJIS.WARNING} Solo el creador de la playlist **${name}** puede modificarla.`,

    // Public/Private
    NOW_PUBLIC: (name) => `${EMOJIS.INFO} La playlist **${name}** ahora es pública. Otros samurais pueden verla.`,
    NOW_PRIVATE: (name) => `${EMOJIS.INFO} La playlist **${name}** ahora es privada. Solo tú puedes verla.`,

    // Footer
    FOOTER: '📚 Biblioteca Musical • Demon Hunter',
  },

  // Footer
  FOOTER: {
    DEFAULT: '🎌 Código Bushido • Demon Hunter',
    WITH_TIMESTAMP: () => `🎌 Código Bushido • Demon Hunter | ${new Date().toLocaleDateString('es-ES')}`,
  },
};

module.exports = MESSAGES;

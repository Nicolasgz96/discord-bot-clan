require('dotenv').config();

// --- FFmpeg fallback (debe estar antes de cualquier voice require) ---
// prism-media busca FFmpeg en el PATH del sistema, no en FFMPEG_PATH
try {
  const ffmpeg = require('@ffmpeg-installer/ffmpeg');
  const path = require('path');
  const ffmpegDir = path.dirname(ffmpeg.path);
  
  // Agregar el directorio de FFmpeg al PATH del proceso (Windows usa ; como separador)
  const pathSeparator = process.platform === 'win32' ? ';' : ':';
  if (!process.env.PATH.includes(ffmpegDir)) {
    process.env.PATH = `${ffmpegDir}${pathSeparator}${process.env.PATH}`;
  }
  
  // También configurar FFMPEG_PATH por si acaso
  process.env.FFMPEG_PATH = ffmpeg.path;
  
  console.log(`[FFmpeg] Ruta configurada: ${ffmpeg.path}`);
  console.log(`[FFmpeg] Directorio agregado al PATH: ${ffmpegDir}`);
} catch (error) {
  console.warn('[FFmpeg] No se pudo cargar @ffmpeg-installer/ffmpeg. Usaré el del sistema si existe.');
  console.warn(`[FFmpeg] Error: ${error.message}`);
}

const { Client, GatewayIntentBits, Events, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const config = require('./config.json');
const { createWelcomeCard } = require('./utils/welcomeCard');
const { validateConfig } = require('./utils/configValidator');
const { connectToVoiceChannel, disconnectFromVoiceChannel, speakText, isConnected, isUserInBotVoiceChannel, getVoiceChannelInfo, setVoiceChannelTextChannel } = require('./utils/voiceManager');

// DEMON HUNTER - Samurai Theme Config
const COLORS = require('./src/config/colors');
const EMOJIS = require('./src/config/emojis');
const MESSAGES = require('./src/config/messages');
const CONSTANTS = require('./src/config/constants');
const dataManager = require('./utils/dataManager');
const musicHandlers = require('./commands/handlers/musicHandlers');
const { safeDeferUpdate } = require('./utils/discordUtils');

// Validar configuración al iniciar
try {
  validateConfig(config);
  console.log('✓ Configuración validada exitosamente');
} catch (error) {
  console.error('❌ Validación de configuración falló:', error.message);
  console.error('Por favor corrige tu config.json e intenta de nuevo.');
  process.exit(1);
}

// Rate limiting (now using dataManager for persistence)
const COOLDOWN_SECONDS = CONSTANTS.COOLDOWNS.COMMAND_DEFAULT;

// Almacenamiento temporal de mensajes borrados (para deshacer)
const deletedMessagesCache = new Map();
const UNDO_TIMEOUT_MINUTES = CONSTANTS.MODERATION.DELETE.UNDO_TIMEOUT_MINUTES;

// Channel locks para prevenir operaciones concurrentes de borrado en el mismo canal
const channelLocks = new Set();

// Rastreo de últimos usuarios que hablaron en voz (para no repetir nombres)
// { guildId: { lastUserId: string, lastTimestamp: number } }
const lastVoiceSpeakers = new Map();
const VOICE_NAME_REPEAT_SECONDS = CONSTANTS.VOICE.VOICE_NAME_REPEAT_SECONDS; // Segundos antes de repetir el nombre del mismo usuario

// Sistema de rastreo de tiempo en voz para honor
// { userId_guildId: { joinedAt: timestamp, lastHonorGrant: timestamp } }
const voiceTimeTracking = new Map();

// ✅ FIX BUG #2: Limpieza automática de tracking huérfanos (cada 1 hora)
setInterval(() => {
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  let cleaned = 0;

  for (const [key, data] of voiceTimeTracking.entries()) {
    // Si el tracking es de hace más de 1 hora, eliminarlo (probablemente huérfano)
    if (data.joinedAt < oneHourAgo) {
      voiceTimeTracking.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 [Cleanup] Eliminados ${cleaned} tracking huérfanos de voz`);
  }
  console.log(`📊 [Cleanup] voiceTimeTracking entries actuales: ${voiceTimeTracking.size}`);
}, 60 * 60 * 1000); // Cada 1 hora
// Create Discord client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Expose client globally so utils/dataManager can detect bot ID
global.client = client;


// Import helper functions (wrapper functions to maintain backward compatibility)
const helpersModule = require('./utils/helpers');
const sendWithRetry = helpersModule.sendWithRetry;
const getRankEmoji = helpersModule.getRankEmoji;
// Create wrappers that automatically pass client for backward compatibility
const fetchUsername = (userId) => helpersModule.fetchUsername(client, userId);
const fetchUsernamesBatch = (userIds) => helpersModule.fetchUsernamesBatch(client, userIds);
const fetchDisplayName = (guild, userId) => helpersModule.fetchDisplayName(client, guild, userId);
const fetchDisplayNamesBatch = (guild, userIds) => helpersModule.fetchDisplayNamesBatch(client, guild, userIds);

// ==================== MODULAR EVENT AND HANDLER LOADING ====================
// Load modular event handlers from events/ directory
const { loadEvents, loadHandlers } = require('./utils/eventLoader');

// Load modular events (ready, guildMemberAdd, voiceStateUpdate)
loadEvents(client, {
  config,
  dataManager,
  voiceTimeTracking,
  lastVoiceSpeakers
});

// Load modular handlers (buttons, modals)
loadHandlers(client, {
  client,
  dataManager,
  musicHandlers
});

client.on(Events.MessageCreate, async (message) => {
  // Ignorar mensajes de bots para prevenir bucles infinitos
  if (message.author.bot) return;

  // ========== SISTEMA DE HONOR PASIVO: MENSAJES ==========
  // Ganar honor por enviar mensajes (con cooldown de 1 minuto)
  if (message.guild && message.author && !message.content.startsWith('!') && !message.content.startsWith('/')) {
    try {
      const userId = message.author.id;
      const guildId = message.guild.id;

      // Verificar cooldown de honor por mensajes (1 minuto)
      if (!dataManager.hasCooldown(userId, 'honor_message')) {
        // Ganar honor (koku only for real users, not the bot)
        const userData = dataManager.addHonor(userId, guildId, CONSTANTS.HONOR.PER_MESSAGE);
        if (userData.userId !== client.user.id && !userData.isBot) {
          userData.koku = (userData.koku || 0) + CONSTANTS.ECONOMY.PER_MESSAGE;

          // Track koku gain for active Koku Rush events
          try {
            const { getEventManager } = require('./utils/eventManager');
            const eventManager = getEventManager();
            const activeEvents = eventManager.getActiveEvents(guildId);

            for (const event of activeEvents) {
              if (event.type === 'koku_rush' && event.participants.includes(userId)) {
                eventManager.trackKokuGain(event.id, userId, userData.koku);
              }
            }
          } catch (e) {
            // Ignore event tracking errors
          }
        }

        // Notificaciones: si hubo cambio de rango, notificar al usuario
        try {
          const meta = userData.__lastHonorChange;
          if (meta && meta.rankChanged) {
            // Intentar enviar DM primero. No enviar notificación pública (privado sólo).
            try {
              const usr = await client.users.fetch(userId).catch(() => null);
              if (usr) await usr.send(`${MESSAGES.HONOR.RANK_UP(meta.newRank)}\n${MESSAGES.SUCCESS.HONOR_GAINED(meta.amount)}`).catch(() => {});
            } catch (e) {
              // ignore DM failures silently - notifications are DM-only by design
            }
          }
        } catch (e) {
          // ignore notification errors
        }

        // Incrementar contador de mensajes
        if (userData.stats) {
          userData.stats.messagesCount = (userData.stats.messagesCount || 0) + 1;
        }

        // Actualizar honor total del clan si el usuario pertenece a uno
        if (userData.clanId) {
          dataManager.updateClanStats(userData.clanId);
        }

        // Track night messages (2-6 AM) for Night Owl achievement
        const hour = new Date().getHours();
        if (hour >= 2 && hour < 6) {
          if (!userData.stats) userData.stats = {};
          userData.stats.nightMessages = (userData.stats.nightMessages || 0) + 1;
        }

        // Track midnight messages (exactly 12 AM) for hidden achievement
        if (hour === 0) {
          if (!userData.stats) userData.stats = {};
          userData.stats.midnightMessages = (userData.stats.midnightMessages || 0) + 1;
        }

        // Marcar datos como modificados
        dataManager.dataModified.users = true;

        // Check for new achievements
        const achievementManager = require('./utils/achievementManager');
        const newAchievements = achievementManager.checkAchievements(userId, guildId, userData);

        // Notify user of new achievements
        if (newAchievements.length > 0) {
          for (const achievement of newAchievements) {
            const tierInfo = achievementManager.TIER_INFO[achievement.tier];

            // Send DM notification
            if (CONSTANTS.ACHIEVEMENTS.NOTIFY_DM) {
              try {
                const user = await client.users.fetch(userId);
                await user.send(
                  `🏆 **¡Nuevo Logro Desbloqueado!**\n\n` +
                  `${achievement.emoji} **${achievement.name}** ${tierInfo.emoji} *(${tierInfo.name})*\n` +
                  `*${achievement.description}*\n\n` +
                  `**Recompensa:** ${achievement.reward?.koku || 0} ${EMOJIS.KOKU}` +
                  (achievement.reward?.title ? ` + Título: **"${achievement.reward.title}"**` : '') +
                  `\n\nUsa \`/logros\` para ver todos tus logros.`
                );
              } catch (e) {
                // Ignore DM failures
              }
            }

            // Send channel notification
            if (CONSTANTS.ACHIEVEMENTS.NOTIFY_CHANNEL && config.achievementsChannel?.enabled) {
              try {
                const achievementsChannel = client.channels.cache.get(config.achievementsChannel.channelId);
                if (achievementsChannel) {
                  // Only announce legendary/hidden achievements publicly, or all if configured
                  const shouldAnnounce = CONSTANTS.ACHIEVEMENTS.ANNOUNCE_LEGENDARY
                    ? (achievement.tier === 'legendary' || achievement.tier === 'platinum' || achievement.category === 'hidden')
                    : true;

                  if (shouldAnnounce) {
                    const embed = new EmbedBuilder()
                      .setColor(tierInfo.color)
                      .setTitle(`${achievement.emoji} ¡Logro Desbloqueado! ${tierInfo.emoji}`)
                      .setDescription(
                        `<@${userId}> ha desbloqueado:\n\n` +
                        `**${achievement.name}**\n` +
                        `*${achievement.description}*`
                      )
                      .addFields({
                        name: 'Recompensa',
                        value: `${achievement.reward?.koku || 0} ${EMOJIS.KOKU}` +
                               (achievement.reward?.title ? ` + Título: **"${achievement.reward.title}"**` : ''),
                        inline: true
                      })
                      .setFooter({ text: `Tier: ${tierInfo.name}` })
                      .setTimestamp();

                    await achievementsChannel.send({ embeds: [embed] });
                  }
                }
              } catch (e) {
                console.error('Error enviando notificación de logro al canal:', e.message);
              }
            }
          }
        }

        // Establecer cooldown de 1 minuto
        dataManager.setCooldown(userId, 'honor_message', CONSTANTS.COOLDOWNS.HONOR_MESSAGE);

        // Log silencioso (no spam en consola)
        // console.log(`[Honor] ${message.author.tag} ganó 5 honor + 2 koku por mensaje (Total: ${userData.honor} honor, ${userData.koku} koku)`);
      }
    } catch (error) {
      // Fallos silenciosos para no interrumpir el flujo de mensajes
      console.error('Error otorgando honor por mensaje:', error.message);
    }
  }
  // ========== FIN SISTEMA DE HONOR PASIVO ==========

  // ========== DETECCIÓN AUTOMÁTICA DE URLS DE MÚSICA ==========
  // Si el mensaje contiene una URL de música en el canal de música, reproducirla automáticamente
  if (message.guild && !message.author.bot && config.musicChannel?.enabled && config.musicChannel.channelId) {
    if (message.channel.id === config.musicChannel.channelId) {
      // Regex para detectar URLs de música (YouTube, Spotify, SoundCloud)
      const musicUrlRegex = /(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|spotify\.com|soundcloud\.com|open\.spotify\.com)\/[^\s]+/gi;
      const urls = message.content.match(musicUrlRegex);

      if (urls && urls.length > 0) {
        // Verificar que el usuario esté en un canal de voz
        if (!message.member.voice.channel) {
          return message.reply({
            content: MESSAGES.MUSIC.NOT_IN_VOICE
          }).catch(() => {});
        }

        try {
          const musicManager = require('./utils/musicManager');
          const ServerQueue = require('./utils/musicQueue');
          const guildId = message.guild.id;

          let queue = musicManager.getQueue(guildId);

          // Crear cola si no existe
          if (!queue) {
            queue = new ServerQueue(
              message.guild,
              message.member.voice.channel,
              message.channel
            );
            musicManager.setQueue(guildId, queue);
          }

          // Agregar cada URL encontrada
          for (const url of urls) {
            try {
              // Buscar información de la canción
              const songs = await musicManager.searchSongs(url.trim());

              if (songs && songs.length > 0) {
                const song = songs[0];

                // Agregar a la cola
                queue.addSong(song);

                // Reaccionar con emoji de música
                await message.react('🎵').catch(() => {});

                // Si no hay nada reproduciéndose, empezar
                if (!queue.nowPlaying) {
                  await musicManager.playSong(queue);
                } else {
                  // Notificar que se agregó a la cola
                  const position = queue.songs.length;
                  await message.reply({
                    content: MESSAGES.MUSIC.SONG_ADDED(song.title, position)
                  }).catch(() => {});
                }
              }
            } catch (error) {
              console.error('Error procesando URL de música:', url, error.message);
              // Silencioso para no interrumpir
            }
          }
        } catch (error) {
          console.error('Error en detección automática de música:', error);
          // Fallar silenciosamente para no interrumpir el chat
        }
      } else {
        // Si el mensaje está en el canal de música pero NO contiene URLs de música
        // y NO es un comando, eliminarlo y enviar advertencia efímera
        if (!message.content.startsWith('!') && !message.content.startsWith('/')) {
          try {
            // Eliminar el mensaje del usuario
            await message.delete().catch(() => {});

            // Enviar mensaje de advertencia temporal (se auto-elimina en 8 segundos)
            await message.channel.send({
              content: `${EMOJIS.WARNING} <@${message.author.id}>, el **Dojo del Sonido** está reservado para música.\n\n` +
                       `${EMOJIS.SHAKUHACHI} **Puedes:**\n` +
                       `▶️ Pegar enlaces de YouTube, Spotify o SoundCloud para reproducir música\n` +
                       `▶️ Usar comandos de música (${EMOJIS.SEARCH} \`/play\`, \`/queue\`, \`/playlist\`, etc.)\n\n` +
                       `${EMOJIS.MESSAGE} Para conversar, usa otros canales del servidor.`
            }).then(msg => {
              // Auto-eliminar el mensaje de advertencia después de 8 segundos
              setTimeout(() => msg.delete().catch(() => {}), 8000);
            }).catch(() => {});
          } catch (error) {
            console.error('Error eliminando mensaje en canal de música:', error.message);
          }
        }
      }
    }
  }
  // ========== FIN DETECCIÓN AUTOMÁTICA DE URLS DE MÚSICA ==========

  // ========== LECTURA AUTOMÁTICA DE MENSAJES EN VOZ ==========
  // Si el bot está conectado a voz y el usuario está en el mismo canal,
  // leer automáticamente el mensaje (excepto comandos)
  if (message.guild && !message.content.startsWith('!') && !message.content.startsWith('/')) {
    try {
      const guildId = message.guild.id;

      // Verificar si el bot está conectado a voz en este servidor
      if (isConnected(guildId)) {
        // Obtener información del canal de voz del bot
        const voiceInfo = getVoiceChannelInfo(guildId);
        if (!voiceInfo) return;

        // Verificar que el mensaje viene del canal de texto asociado al canal de voz
        if (voiceInfo.textChannelId && message.channel.id !== voiceInfo.textChannelId) {
          return; // Ignorar mensajes de otros canales
        }

        // Verificar si el autor del mensaje está en el canal de voz del bot
        const member = message.guild.members.cache.get(message.author.id);

        if (member && isUserInBotVoiceChannel(member)) {
          const userId = message.author.id;
          const userName = member.displayName || message.author.username;
          const now = Date.now();
          
          // Obtener información del último hablante en este servidor
          const lastSpeaker = lastVoiceSpeakers.get(guildId);
          
          // Filtrar TODOS los enlaces/URLs - NO leer mensajes con enlaces
          const messageContent = message.content;
          
          // Detectar cualquier tipo de URL o enlace (patrones más completos)
          const urlPatterns = [
            /https?:\/\/[^\s]+/gi,                    // http:// o https://
            /www\.[^\s]+/gi,                          // www.ejemplo.com
            /discord\.gg\/[^\s]+/gi,                  // discord.gg/invite
            /discord\.com\/[^\s]+/gi,                 // discord.com/gifts, discord.com/invite
            /discordapp\.com\/[^\s]+/gi,              // discordapp.com
            /[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}\/[^\s]*/gi, // dominio.com/ruta
            /[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}[^\s]*/gi,   // dominio.com (sin /)
          ];
          
          // Verificar si el mensaje contiene algún enlace
          let hasLink = false;
          for (const pattern of urlPatterns) {
            // Resetear el lastIndex del regex para evitar problemas
            pattern.lastIndex = 0;
            if (pattern.test(messageContent)) {
              hasLink = true;
              break;
            }
          }
          
          // Si el mensaje contiene cualquier enlace, ignorarlo completamente
          if (hasLink) {
            console.log(`🔇 Mensaje ignorado (contiene enlace): ${messageContent.substring(0, 50)}...`);
            return; // No leer mensajes con enlaces
          }
          
          // Usar el contenido original (ya verificado que no tiene enlaces)
          const filteredContent = messageContent;
          
          // Decidir si decir el nombre o no
          let shouldSayName = false;
          let messageToSpeak = filteredContent;
          
          if (!lastSpeaker) {
            // Primera vez que alguien habla en este servidor
            shouldSayName = true;
          } else if (lastSpeaker.lastUserId !== userId) {
            // Cambió el usuario, decir el nombre
            shouldSayName = true;
          } else if (now - lastSpeaker.lastTimestamp > VOICE_NAME_REPEAT_SECONDS * 1000) {
            // Mismo usuario pero pasaron más de 20 segundos, decir el nombre de nuevo
            shouldSayName = true;
          }
          // Si no se cumple ninguna condición, no decir el nombre (mismo usuario, menos de 20 segundos)
          
          if (shouldSayName) {
            messageToSpeak = `${userName} dice: ${filteredContent}`;
          }
          
          // Actualizar registro del último hablante
          lastVoiceSpeakers.set(guildId, {
            lastUserId: userId,
            lastTimestamp: now
          });

          // Verificar que la conexión esté lista antes de intentar hablar
          // (isConnected ya verifica si existe, pero speakText también lo verifica internamente)

          // Leer el mensaje en voz
          await speakText(guildId, messageToSpeak, 'es');
          console.log(`🔊 Lectura automática: ${userName} en ${message.guild.name}${shouldSayName ? ' (con nombre)' : ' (sin nombre)'}`);
        }
      }
    } catch (error) {
      // No interrumpir el procesamiento de comandos si falla la lectura
      console.error('Error en lectura automática de voz:', error);
      // Si el error es de conexión, intentar limpiar
      if (error.message && (error.message.includes('No hay conexión') || error.message.includes('conexión'))) {
        const guildId = message.guild?.id;
        if (guildId) {
          console.log(`🔄 Limpiando conexión de voz para ${guildId} debido a error`);
          disconnectFromVoiceChannel(guildId);
          lastVoiceSpeakers.delete(guildId);
        }
      }
    }
  }
  // ========== FIN LECTURA AUTOMÁTICA ==========

  // Comando de prueba de tarjeta de bienvenida
  if (message.content.toLowerCase() === '!testwelcome' || message.content.toLowerCase() === '!bienvenida') {
    const userId = message.author.id;

    // Verificar cooldown (ahora persistente)
    if (dataManager.hasCooldown(userId, 'testwelcome')) {
      const timeLeft = dataManager.getCooldownTime(userId, 'testwelcome');
      return message.reply(MESSAGES.ERRORS.COOLDOWN(timeLeft));
    }

    // Establecer cooldown (se guarda en JSON)
    dataManager.setCooldown(userId, 'testwelcome', COOLDOWN_SECONDS);

    try {
      // Obtener el miembro del servidor
      const member = message.guild.members.cache.get(message.author.id);

      if (!member) {
        await message.reply(MESSAGES.ERRORS.INVALID_USER);
        return;
      }

      // Crear la tarjeta de bienvenida
      const attachment = await createWelcomeCard(member);

      // Enviar la tarjeta de bienvenida de prueba con lógica de reintento
      await sendWithRetry(message.channel, {
        content: `${EMOJIS.SAKURA} ${message.author}, aquí está la vista previa de tu tarjeta de bienvenida samurai:`,
        files: [attachment],
      });

      console.log(`${EMOJIS.SUCCESS} Tarjeta de bienvenida de prueba enviada para ${message.author.tag}`);
    } catch (error) {
      console.error(`${EMOJIS.ERROR} Error creando tarjeta de bienvenida de prueba:`, error);
      await message.reply(`${EMOJIS.ERROR} Lo siento, encontré un error creando tu tarjeta de bienvenida. Por favor intenta de nuevo más tarde o contacta al maestro del dojo.`);
    }
  }

  // Comando de ayuda
  if (message.content.toLowerCase() === '!help' || message.content.toLowerCase() === '!ayuda' || message.content.toLowerCase() === '!dojo') {
    try {
      // Obtener nombres de canales si están configurados
      const commandsChannel = config.commandsChannel && config.commandsChannel.enabled && config.commandsChannel.channelId
        ? message.guild.channels.cache.get(config.commandsChannel.channelId)
        : null;
      const shopChannel = config.shopChannel && config.shopChannel.enabled && config.shopChannel.channelId
        ? message.guild.channels.cache.get(config.shopChannel.channelId)
        : null;
      const combatChannel = config.combatChannel && config.combatChannel.enabled && config.combatChannel.channelId
        ? message.guild.channels.cache.get(config.combatChannel.channelId)
        : null;

      const commandsChannelName = commandsChannel ? `**${commandsChannel.name}**` : 'Cualquier canal';
      const shopChannelName = shopChannel ? `**${shopChannel.name}**` : 'Cualquier canal';
      const combatChannelName = combatChannel ? `**${combatChannel.name}**` : 'Cualquier canal';

      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(`${EMOJIS.TORII} Comandos del Dojo - Demon Hunter`)
        .setDescription(`Bienvenido al manual del guerrero, ${message.member?.displayName || message.author.username}. Aquí encontrarás todos los comandos disponibles.\n\n${EMOJIS.KATANA} **Tip:** Escribe \`/\` en Discord para ver todos los comandos con autocompletar!`)
        .addFields(
          // ========== BIENVENIDA Y AYUDA ==========
          {
            name: `${EMOJIS.TORII} __BIENVENIDA Y AYUDA__`,
            value: '🎨 `!testwelcome` / `!bienvenida` - Vista previa de tarjeta de bienvenida\n❓ `!help` / `!ayuda` / `!dojo` - Muestra este mensaje\n📍 *Cualquier canal*',
            inline: false
          },
          // ========== MODERACIÓN ==========
          {
            name: `${EMOJIS.KATANA} __MODERACIÓN__`,
            value: '🗑️ `!borrarmsg` - Elimina mensajes de un usuario\n🔄 `!deshacerborrado` - Restaura mensajes eliminados\n*Req: Administrar Mensajes*\n📍 *Cualquier canal*',
            inline: false
          },
          // ========== VOZ / TTS ==========
          {
            name: `${EMOJIS.VOICE} __VOZ / TTS__`,
            value: '🔗 `!join` - Bot se une a voz y lee mensajes\n🔊 `!hablar <texto>` - Text-to-speech en español\n👋 `!salir` - Desconecta el bot de voz\n📍 *Cualquier canal*',
            inline: false
          },
          // ========== HONOR Y RANGOS ==========
          {
            name: `${EMOJIS.HONOR} __HONOR Y RANGOS__`,
            value: `⭐ \`!honor [@usuario]\` - Ver honor y progreso de rango\n⚔️ \`!rango\` - Info del sistema de rangos\n🏆 \`!top\` - Ranking de honor (top 10)\n📍 *${commandsChannelName}*`,
            inline: false
          },
          // ========== ECONOMÍA ==========
          {
            name: `${EMOJIS.KOKU} __ECONOMÍA__`,
            value: `📅 \`!daily\` - Recompensa diaria de koku\n💰 \`!balance\` / \`!bal\` - Ver tu koku, honor y racha\n💸 \`!pay\` / \`!pagar\` - Transferir koku a otro usuario\n📊 \`!leaderboard\` / \`!lb\` - Rankings interactivos del dojo\n📍 *${commandsChannelName}*`,
            inline: false
          },
          // ========== CLANES ==========
          {
            name: `${EMOJIS.CLAN} __CLANES__`,
            value: `🏯 Usa \`/clan\` para gestionar clanes:\n\`crear\`, \`info\`, \`unirse\`, \`salir\`, \`miembros\`, \`top\`, \`invitar\`, \`expulsar\`\n📍 *${commandsChannelName}*`,
            inline: false
          },
          // ========== TIENDA ==========
          {
            name: `${EMOJIS.SHOP} __TIENDA__`,
            value: `🏪 \`/tienda ver\` - Ver productos disponibles\n🛒 \`/tienda comprar\` - Comprar un item\n📦 \`/tienda inventario\` - Ver tu inventario\n📍 *${shopChannelName}*`,
            inline: false
          },
          // ========== COMBATE Y JUEGOS ==========
          {
            name: `${EMOJIS.DUEL} __COMBATE Y JUEGOS__`,
            value: `⚔️ \`!duelo @usuario [apuesta]\` - Desafía a un duelo de honor\n📜 \`!sabiduria\` - Citas de maestros samurai\n🎴 \`!fortuna\` - Omikuji (fortuna diaria)\n👤 \`!perfil [@usuario]\` - Ver perfil completo de guerrero\n📍 *${combatChannelName}*`,
            inline: false
          },
          // ========== UTILIDADES ==========
          {
            name: `${EMOJIS.TRANSLATION} __UTILIDADES__`,
            value: '🌐 `!traducir <idioma> <texto>` - Traduce entre ES/JP/EN\n*Máx: 500 caracteres*\n📍 *Cualquier canal*',
            inline: false
          }
        )
        .setFooter({ text: `Demon Hunter Bot v1.5 • ${EMOJIS.FIRE} Total: 23+ comandos` })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      console.log(`${EMOJIS.SUCCESS} Comando de ayuda mostrado para ${message.author.tag}`);
    } catch (error) {
      console.error(`${EMOJIS.ERROR} Error mostrando comando de ayuda:`, error);
      await message.reply(`${MESSAGES.ERRORS.COMMAND_ERROR}`);
    }
  }

  // Comando para borrar mensajes de un usuario específico
  if (message.content.toLowerCase().startsWith('!borrarmsg')) {
    try {
      // Verificar que el mensaje es de un servidor (no DM)
      if (!message.guild || !message.member) {
        return message.reply('❌ Este comando solo funciona en servidores.');
      }

      // Verificar permisos PRIMERO (antes del cooldown)
      // Esto evita que usuarios sin permisos activen el cooldown
      if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return message.reply('❌ No tienes permisos para borrar mensajes. Necesitas el permiso "Administrar Mensajes".');
      }

      // Verificar permisos del bot
      if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return message.reply('❌ No tengo permisos para borrar mensajes. Por favor otorga el permiso "Administrar Mensajes" al bot.');
      }

      // Verificar permiso para leer historial de mensajes
      if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ReadMessageHistory)) {
        return message.reply('❌ No tengo permisos para leer el historial de mensajes. Por favor otorga el permiso "Leer Historial de Mensajes" al bot.');
      }

      const userId = message.author.id;

      // Verificar cooldown (usando dataManager persistente)
      if (dataManager.hasCooldown(userId, 'borrarmsg')) {
        const timeLeft = dataManager.getCooldownTime(userId, 'borrarmsg');
        return message.reply(MESSAGES.ERRORS.COOLDOWN(timeLeft));
      }

      // Establecer cooldown INMEDIATAMENTE (antes de operaciones async)
      // Esto previene race conditions si el usuario ejecuta el comando dos veces rápido
      dataManager.setCooldown(userId, 'borrarmsg', COOLDOWN_SECONDS);

      // Parsear el argumento del comando
      const args = message.content.split(/\s+/);
      if (args.length < 2) {
        return message.reply('❌ Uso incorrecto. Usa: `!borrarmsg <@usuario>` o `!borrarmsg nombre#1234`');
      }

      const targetArg = args.slice(1).join(' ').trim();
      let targetUserId = null;
      let targetUserTag = null;
      let isDeletedUser = false;

      // Método 1: Intentar obtener el usuario mencionado (más confiable)
      if (message.mentions.users.size > 0) {
        const user = message.mentions.users.first();
        targetUserId = user.id;
        targetUserTag = user.tag;
        console.log(`[borrarmsg] Usuario encontrado por mención: ${targetUserTag} (${targetUserId})`);
      } 
      // Método 2: Buscar por ID de usuario (si se proporciona un ID numérico)
      // Esto funciona incluso si el usuario ya no está en el servidor
      else if (/^\d{17,19}$/.test(targetArg)) {
        targetUserId = targetArg;
        try {
          // Intentar obtener información del usuario (puede funcionar aunque no esté en el servidor)
          const user = await message.client.users.fetch(targetArg).catch(() => null);
          if (user) {
            targetUserTag = user.tag;
            console.log(`[borrarmsg] Usuario encontrado por ID: ${targetUserTag} (${targetUserId})`);
          } else {
            // Usuario no encontrado en el cache de Discord, pero podemos usar el ID
            targetUserTag = `Usuario eliminado (${targetUserId})`;
            isDeletedUser = true;
            console.log(`[borrarmsg] Usuario eliminado del servidor, usando ID: ${targetUserId}`);
          }
        } catch (error) {
          // Si no podemos obtener el usuario, usar el ID directamente
          targetUserId = targetArg;
          targetUserTag = `Usuario eliminado (${targetUserId})`;
          isDeletedUser = true;
          console.log(`[borrarmsg] Usando ID directamente: ${targetUserId}`);
        }
      }
      // Método 3: Buscar por nombre de usuario (solo si está en el servidor)
      else {
        // Primero buscar en el cache
        let targetMember = message.guild.members.cache.find(m =>
          m.user.tag.toLowerCase() === targetArg.toLowerCase() ||
          m.user.username.toLowerCase() === targetArg.toLowerCase() ||
          m.displayName.toLowerCase() === targetArg.toLowerCase() ||
          m.user.tag.toLowerCase().includes(targetArg.toLowerCase()) ||
          m.user.username.toLowerCase().includes(targetArg.toLowerCase()) ||
          m.displayName.toLowerCase().includes(targetArg.toLowerCase())
        );

        // Si no está en cache, intentar fetch (solo si el servidor no es muy grande)
        if (!targetMember && message.guild.memberCount < 1000) {
          try {
            const members = await message.guild.members.fetch({ query: targetArg, limit: 10 });
            targetMember = members.find(m =>
              m.user.tag.toLowerCase() === targetArg.toLowerCase() ||
              m.user.username.toLowerCase() === targetArg.toLowerCase() ||
              m.displayName.toLowerCase() === targetArg.toLowerCase() ||
              m.user.tag.toLowerCase().includes(targetArg.toLowerCase()) ||
              m.user.username.toLowerCase().includes(targetArg.toLowerCase()) ||
              m.displayName.toLowerCase().includes(targetArg.toLowerCase())
            );
          } catch (error) {
            console.log(`[borrarmsg] Error en fetch de miembros: ${error.message}`);
          }
        }

        if (targetMember) {
          targetUserId = targetMember.user.id;
          targetUserTag = targetMember.user.tag;
          console.log(`[borrarmsg] Usuario encontrado por nombre: ${targetUserTag} (${targetUserId})`);
        }
      }

      if (!targetUserId) {
        return message.reply(`❌ No se pudo encontrar al usuario "${targetArg}".\n💡 **Sugerencias:**\n• Usa una mención: \`!borrarmsg @usuario\`\n• Usa el nombre completo: \`!borrarmsg usuario#1234\`\n• Usa el ID del usuario: \`!borrarmsg 123456789012345678\` (funciona incluso si el usuario ya no está en el servidor)`);
      }

      // Primero contar cuántos mensajes hay
      const countMsg = await message.reply(`🔍 Buscando mensajes de ${targetUserTag}...`);

      let messageCount = 0;
      let fetchMore = true;
      let lastMessageId = null;

      while (fetchMore) {
        const fetchOptions = { limit: 100 };
        if (lastMessageId) {
          fetchOptions.before = lastMessageId;
        }

        const fetchedMessages = await message.channel.messages.fetch(fetchOptions);

        if (fetchedMessages.size === 0) {
          fetchMore = false;
          break;
        }

        const targetMessages = fetchedMessages.filter(msg => msg.author.id === targetUserId);
        messageCount += targetMessages.size;

        lastMessageId = fetchedMessages.last()?.id;

        if (fetchedMessages.size < 100) {
          fetchMore = false;
        }

        // Limitar a 500 mensajes
        if (messageCount >= 500) {
          fetchMore = false;
          break;
        }
      }

      if (messageCount === 0) {
        return countMsg.edit(`❌ No se encontraron mensajes de ${targetUserTag} en este canal.`);
      }

      // Verificar si ya hay una operación de borrado en proceso en este canal
      if (channelLocks.has(message.channel.id)) {
        return countMsg.edit('❌ Ya hay una operación de borrado en proceso en este canal. Por favor espera a que termine.');
      }

      // Establecer lock para este canal
      channelLocks.add(message.channel.id);

      // Crear botones de confirmación
      const confirmButton = new ButtonBuilder()
        .setCustomId('confirm_delete')
        .setLabel('✅ Confirmar')
        .setStyle(ButtonStyle.Danger);

      const cancelButton = new ButtonBuilder()
        .setCustomId('cancel_delete')
        .setLabel('❌ Cancelar')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder()
        .addComponents(confirmButton, cancelButton);

      const userDisplayName = isDeletedUser ? `Usuario eliminado (ID: ${targetUserId})` : targetUserTag;
      await countMsg.edit({
        content: `⚠️ Se encontraron **${messageCount}** mensaje(s) de ${userDisplayName}.\n¿Estás seguro que deseas borrarlos? Tendrás ${UNDO_TIMEOUT_MINUTES} minutos para deshacerlo.`,
        components: [row]
      });

      // Esperar respuesta del botón
      const filter = i => {
        return (i.customId === 'confirm_delete' || i.customId === 'cancel_delete') && i.user.id === message.author.id;
      };

      try {
        const interaction = await countMsg.awaitMessageComponent({ filter, time: 30000 });

        if (interaction.customId === 'cancel_delete') {
          await interaction.update({
            content: '❌ Operación cancelada.',
            components: []
          });
          // Liberar lock del canal
          channelLocks.delete(message.channel.id);
          return;
        }
      } catch (error) {
        if (error.message && (error.message.includes('time') || error.message.includes('expired'))) {
          await countMsg.edit({
            content: MESSAGES.GENERIC.TIMEOUT_DELETE(30),
            components: []
          });
        } else {
          await countMsg.edit({
            content: `❌ Ocurrió un error: ${error.message || 'Error desconocido'}. Por favor, intenta de nuevo.`,
            components: []
          });
        }
        channelLocks.delete(message.channel.id);
        return;
      }

        // Usuario confirmó, proceder a borrar
        await interaction.update({
          content: `🗑️ Borrando mensajes de ${userDisplayName}...`,
          components: []
        });

        // Guardar mensajes antes de borrar (para poder deshacerlo)
        const savedMessages = [];
        let totalDeleted = 0;
        fetchMore = true;
        lastMessageId = null;

        while (fetchMore) {
          const fetchOptions = { limit: 100 };
          if (lastMessageId) {
            fetchOptions.before = lastMessageId;
          }

          const fetchedMessages = await message.channel.messages.fetch(fetchOptions);

          if (fetchedMessages.size === 0) {
            fetchMore = false;
            break;
          }

          const targetMessages = fetchedMessages.filter(msg => msg.author.id === targetUserId);

          if (targetMessages.size > 0) {
            // Guardar información de los mensajes
            for (const [, msg] of targetMessages) {
              // Obtener el tag del autor (puede ser null si el usuario fue eliminado)
              const authorId = msg.author ? msg.author.id : targetUserId;
              const authorTag = msg.author ? msg.author.tag : `Usuario eliminado (${authorId})`;
              const authorAvatarURL = msg.author ? msg.author.displayAvatarURL() : null;
              
              savedMessages.push({
                content: msg.content,
                authorId: authorId,
                authorTag: authorTag,
                authorAvatarURL: authorAvatarURL,
                timestamp: msg.createdTimestamp,
                attachments: msg.attachments.map(att => ({
                  url: att.url,
                  name: att.name
                })),
                embeds: msg.embeds
              });
            }

            // Discord solo permite borrar mensajes de menos de 14 días en bulkDelete
            const recentMessages = targetMessages.filter(msg =>
              Date.now() - msg.createdTimestamp < 14 * 24 * 60 * 60 * 1000
            );

            if (recentMessages.size > 0) {
              if (recentMessages.size === 1) {
                await recentMessages.first().delete();
                totalDeleted += 1;
              } else {
                const deleted = await message.channel.bulkDelete(recentMessages, true);
                totalDeleted += deleted.size;
              }
            }

            // Mensajes antiguos (más de 14 días)
            const oldMessages = targetMessages.filter(msg =>
              Date.now() - msg.createdTimestamp >= 14 * 24 * 60 * 60 * 1000
            );

            for (const [, oldMsg] of oldMessages) {
              try {
                await oldMsg.delete();
                totalDeleted += 1;
                await new Promise(resolve => setTimeout(resolve, 1000));
              } catch (error) {
                console.error(`Error borrando mensaje antiguo ${oldMsg.id}:`, error.message);
              }
            }
          }

          lastMessageId = fetchedMessages.last()?.id;

          if (fetchedMessages.size < 100) {
            fetchMore = false;
          }

          if (totalDeleted >= 500) {
            fetchMore = false;
          }
        }

        // Guardar en cache para deshacer (usar channelId como key única)
        // Si ya existe una entrada para este canal, cancelar su timeout primero
        const existingEntry = deletedMessagesCache.get(message.channel.id);
        if (existingEntry && existingEntry.timeoutId) {
          clearTimeout(existingEntry.timeoutId);
        }

        // Crear nuevo timeout y guardarlo junto con los datos
        const timeoutId = setTimeout(() => {
          deletedMessagesCache.delete(message.channel.id);
        }, UNDO_TIMEOUT_MINUTES * 60 * 1000);

        deletedMessagesCache.set(message.channel.id, {
          messages: savedMessages,
          deletedBy: message.author.id,
          targetUser: userDisplayName,
          timestamp: Date.now(),
          timeoutId: timeoutId
        });

        await interaction.editReply({
          content: `✅ Se borraron **${totalDeleted}** mensaje(s) de ${userDisplayName}\n💡 Usa \`!deshacerborrado\` en los próximos ${UNDO_TIMEOUT_MINUTES} minutos para restaurarlos.`,
          components: []
        });

        console.log(`✓ ${message.author.tag} borró ${totalDeleted} mensajes de ${userDisplayName} en #${message.channel.name}`);

        // Liberar lock del canal (operación completada exitosamente)
        channelLocks.delete(message.channel.id);

    } catch (error) {
      console.error('Error ejecutando comando borrarmsg:', error);
      await message.reply('❌ Ocurrió un error al intentar borrar los mensajes. Por favor intenta de nuevo más tarde.');
      // Liberar lock del canal (error)
      channelLocks.delete(message.channel.id);
    }
  }

  // Comando para deshacer borrado de mensajes
  if (message.content.toLowerCase() === '!deshacerborrado') {
    try {
      // Verificar permisos del usuario
      if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return message.reply('❌ No tienes permisos para usar este comando. Necesitas el permiso "Administrar Mensajes".');
      }

      // Verificar permisos del bot para crear webhooks
      if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageWebhooks)) {
        return message.reply('❌ No tengo permisos para restaurar mensajes. Por favor otorga el permiso "Administrar Webhooks" al bot.');
      }

      // Buscar operación de borrado reciente en este canal (ahora el key ES el channelId)
      const entry = deletedMessagesCache.get(message.channel.id);

      if (!entry) {
        return message.reply(`❌ No hay mensajes borrados para restaurar en este canal (o ya pasaron ${UNDO_TIMEOUT_MINUTES} minutos).`);
      }

      const statusMsg = await message.reply(`🔄 Restaurando ${entry.messages.length} mensajes de ${entry.targetUser}...`);

      // Obtener o crear webhook para el canal
      const webhooks = await message.channel.fetchWebhooks();
      let webhook = webhooks.find(wh => wh.owner.id === client.user.id);

      if (!webhook) {
        webhook = await message.channel.createWebhook({
          name: 'Restaurador de Mensajes',
          reason: 'Webhook para restaurar mensajes borrados'
        });
      }

      // Restaurar mensajes en orden (del más antiguo al más reciente)
      const sortedMessages = entry.messages.sort((a, b) => a.timestamp - b.timestamp);
      let restored = 0;

      for (const msgData of sortedMessages) {
        try {
          const webhookOptions = {
            content: msgData.content || null,
            username: msgData.authorTag,
            avatarURL: msgData.authorAvatarURL,
            embeds: msgData.embeds
          };

          // Agregar archivos si los hay
          if (msgData.attachments && msgData.attachments.length > 0) {
            webhookOptions.files = msgData.attachments.map(att => att.url);
          }

          await webhook.send(webhookOptions);
          restored++;

          // Pequeño delay para evitar rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('Error restaurando mensaje:', error.message);
        }
      }

      // Cancelar timeout y eliminar del cache
      if (entry.timeoutId) {
        clearTimeout(entry.timeoutId);
      }
      deletedMessagesCache.delete(message.channel.id);

      await statusMsg.edit(`✅ Se restauraron **${restored}** de **${entry.messages.length}** mensajes.`);
      console.log(`✓ ${message.author.tag} restauró ${restored} mensajes en #${message.channel.name}`);

    } catch (error) {
      console.error('Error ejecutando comando deshacerborrado:', error);
      await message.reply('❌ Ocurrió un error al intentar restaurar los mensajes. Por favor intenta de nuevo más tarde.');
    }
  }

  // Comando para unirse al canal de voz sin hablar (lectura automática)
  if (message.content.toLowerCase() === '!join') {
    try {
      // Verificar que el usuario está en un canal de voz
      const userVoiceChannel = message.member.voice.channel;

      if (!userVoiceChannel) {
        return message.reply('❌ Debes estar en un canal de voz para usar este comando.');
      }

      // Verificar si ya está conectado
      const guildId = message.guild.id;

      if (isConnected(guildId)) {
        return message.reply('✅ Ya estoy conectado a un canal de voz. Usa `!salir` para desconectarme primero.');
      }

      // Verificar permisos del bot
      const permissions = userVoiceChannel.permissionsFor(message.guild.members.me);

      if (!permissions.has(PermissionFlagsBits.Connect)) {
        return message.reply('❌ No tengo permisos para conectarme a tu canal de voz. Por favor otorga el permiso "Conectar".');
      }

      if (!permissions.has(PermissionFlagsBits.Speak)) {
        return message.reply('❌ No tengo permisos para hablar en tu canal de voz. Por favor otorga el permiso "Hablar".');
      }

      // Conectar al canal de voz
      await connectToVoiceChannel(userVoiceChannel);
      // Guardar el canal de texto donde se ejecutó el comando (chat de voz)
      setVoiceChannelTextChannel(guildId, userVoiceChannel, message.channel.id);
      await message.reply(`✅ Conectado a **${userVoiceChannel.name}**\n💬 Ahora leeré automáticamente los mensajes que escriban los usuarios en este canal de texto (chat de voz).`);
      console.log(`✓ ${message.author.tag} conectó el bot a ${userVoiceChannel.name} (modo lectura automática, canal de texto: ${message.channel.name})`);

    } catch (error) {
      console.error('Error ejecutando comando join:', error);
      await message.reply('❌ Ocurrió un error al intentar conectarme al canal de voz.');
    }
  }

  // Comando para hacer que el bot hable en el canal de voz
  if (message.content.toLowerCase().startsWith('!hablar')) {
    try {
      // Parsear el texto a hablar
      const args = message.content.split(/\s+/).slice(1);

      if (args.length === 0) {
        return message.reply('❌ Uso incorrecto. Usa: `!hablar <texto>` - Ejemplo: `!hablar Hola a todos`');
      }

      const textToSpeak = args.join(' ');

      // Verificar que el usuario está en un canal de voz
      const userVoiceChannel = message.member.voice.channel;

      if (!userVoiceChannel) {
        return message.reply('❌ Debes estar en un canal de voz para usar este comando.');
      }

      // Verificar permisos del bot
      const permissions = userVoiceChannel.permissionsFor(message.guild.members.me);

      if (!permissions.has(PermissionFlagsBits.Connect)) {
        return message.reply('❌ No tengo permisos para conectarme a tu canal de voz. Por favor otorga el permiso "Conectar".');
      }

      if (!permissions.has(PermissionFlagsBits.Speak)) {
        return message.reply('❌ No tengo permisos para hablar en tu canal de voz. Por favor otorga el permiso "Hablar".');
      }

      // Conectar al canal de voz (si no está conectado)
      const guildId = message.guild.id;

      if (!isConnected(guildId)) {
        await connectToVoiceChannel(userVoiceChannel);
        // Guardar el canal de texto donde se ejecutó el comando
        setVoiceChannelTextChannel(guildId, userVoiceChannel, message.channel.id);
        await message.reply(`✅ Conectado a **${userVoiceChannel.name}**`);
      }

      // Agregar nombre del usuario al inicio del mensaje
      const userName = message.member.displayName || message.author.username;
      const fullMessage = `${userName} dice: ${textToSpeak}`;

      // Hablar el texto con el nombre del usuario
      await speakText(guildId, fullMessage, 'es');

      await message.react('🔊');
      console.log(`✓ ${message.author.tag} usó TTS: "${fullMessage}"`);

    } catch (error) {
      console.error('Error ejecutando comando hablar:', error);
      await message.reply('❌ Ocurrió un error al intentar hablar. Asegúrate de que estoy conectado a un canal de voz.');
    }
  }

  // Comando para desconectar el bot del canal de voz
  if (message.content.toLowerCase() === '!salir') {
    try {
      const guildId = message.guild.id;

      if (!isConnected(guildId)) {
        return message.reply('❌ No estoy conectado a ningún canal de voz.');
      }

      disconnectFromVoiceChannel(guildId);
      lastVoiceSpeakers.delete(guildId); // Limpiar registro de últimos hablantes
      await message.reply('👋 Me he desconectado del canal de voz.');
      console.log(`✓ ${message.author.tag} desconectó el bot del canal de voz`);

    } catch (error) {
      console.error('Error ejecutando comando salir:', error);
      await message.reply('❌ Ocurrió un error al intentar desconectarme.');
    }
  }

  // ==================== COMANDOS DE TEXTO: SISTEMA DE HONOR ====================

  // !honor - Mostrar honor del usuario
  if (message.content.toLowerCase() === '!honor') {
    try {
      const userId = message.author.id;
      const guildId = message.guild.id;

      const userData = dataManager.getUser(userId, guildId);
      const currentHonor = userData.honor;
      const currentRank = userData.rank;

      // Calcular progreso hacia siguiente rango
      let nextRank = null;
      let honorNeeded = 0;
      let progressPercent = 0;
      let rankThresholds = {
        'Ronin': { next: 'Samurai', threshold: CONSTANTS.HONOR.RANK_THRESHOLDS.SAMURAI },
        'Samurai': { next: 'Daimyo', threshold: CONSTANTS.HONOR.RANK_THRESHOLDS.DAIMYO },
        'Daimyo': { next: 'Shogun', threshold: CONSTANTS.HONOR.RANK_THRESHOLDS.SHOGUN },
        'Shogun': { next: null, threshold: null }
      };

      if (currentRank !== 'Shogun') {
        nextRank = rankThresholds[currentRank].next;
        const threshold = rankThresholds[currentRank].threshold;
        honorNeeded = threshold - currentHonor;

        if (currentRank === 'Ronin') {
          progressPercent = Math.min(100, (currentHonor / CONSTANTS.HONOR.RANK_THRESHOLDS.SAMURAI) * 100);
        } else if (currentRank === 'Samurai') {
          const start = CONSTANTS.HONOR.RANK_THRESHOLDS.SAMURAI;
          const end = CONSTANTS.HONOR.RANK_THRESHOLDS.DAIMYO;
          progressPercent = Math.min(100, ((currentHonor - start) / (end - start)) * 100);
        } else if (currentRank === 'Daimyo') {
          const start = CONSTANTS.HONOR.RANK_THRESHOLDS.DAIMYO;
          const end = CONSTANTS.HONOR.RANK_THRESHOLDS.SHOGUN;
          progressPercent = Math.min(100, ((currentHonor - start) / (end - start)) * 100);
        }
      } else {
        progressPercent = 100;
      }

      const barLength = CONSTANTS.LEADERBOARDS.PROGRESS_BAR_LENGTH;
      const filledBars = Math.floor((progressPercent / 100) * barLength);
      const emptyBars = barLength - filledBars;
      const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

      const embed = new EmbedBuilder()
        .setColor(COLORS.HONOR)
        .setTitle(`${EMOJIS.HONOR} Honor de ${message.member.displayName || message.author.username}`)
        .setDescription(`Tu camino samurai en **${message.guild.name}**`)
        .addFields(
          {
            name: `${EMOJIS.STAR} Honor Actual`,
            value: `**${currentHonor}** puntos`,
            inline: true
          },
          {
            name: `${getRankEmoji(currentRank)} Rango`,
            value: `**${currentRank}**`,
            inline: true
          },
          {
            name: '\u200B',
            value: '\u200B',
            inline: true
          }
        )
        .setThumbnail(message.author.displayAvatarURL())
        .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
        .setTimestamp();

      if (currentRank !== 'Shogun') {
        embed.addFields({
          name: `${EMOJIS.LOADING} Progreso hacia ${nextRank}`,
          value: `${progressBar} ${progressPercent.toFixed(1)}%\n${EMOJIS.KATANA} Faltan **${honorNeeded}** puntos de honor`,
          inline: false
        });
      } else {
        embed.addFields({
          name: `${EMOJIS.CROWN} Rango Máximo Alcanzado`,
          value: `${EMOJIS.TROPHY} Has alcanzado el rango más alto del dojo. ¡Tu leyenda es eterna!`,
          inline: false
        });
      }

      embed.addFields({
        name: `${EMOJIS.SCROLL} Estadísticas`,
        value: `${EMOJIS.MESSAGE} Mensajes: **${userData.stats?.messagesCount || 0}**\n${EMOJIS.VOICE} Minutos en voz: **${userData.stats?.voiceMinutes || 0}**\n${EMOJIS.DUEL} Duelos ganados: **${userData.stats?.duelsWon || 0}**`,
        inline: false
      });

      await message.reply({ embeds: [embed] });
      console.log(`${EMOJIS.SUCCESS} ${message.author.tag} consultó su honor (${currentHonor} honor, ${currentRank})`);
    } catch (error) {
      console.error('Error ejecutando comando !honor:', error);
      await message.reply('❌ Ocurrió un error al consultar tu honor.');
    }
  }

  // !rango - Mostrar rango del usuario
  if (message.content.toLowerCase() === '!rango') {
    try {
      const userId = message.author.id;
      const guildId = message.guild.id;

      const userData = dataManager.getUser(userId, guildId);
      const currentRank = userData.rank;
      const currentHonor = userData.honor;

      const rankInfo = {
        'Ronin': {
          description: 'Un guerrero sin maestro que busca su camino en el dojo.',
          benefits: [
            '• Acceso a comandos básicos del dojo',
            '• Ganancia de honor por actividad',
            '• Participación en el ranking'
          ],
          honorRange: '0 - 499',
          nextRank: 'Samurai (500 honor)',
          color: COLORS.RONIN,
          emoji: EMOJIS.RONIN
        },
        'Samurai': {
          description: 'Un guerrero disciplinado que ha demostrado su valía en el dojo.',
          benefits: [
            '• Todos los beneficios de Ronin',
            '• Mayor ganancia de honor diaria',
            '• Acceso a comandos de clan',
            '• Emblema especial en el ranking'
          ],
          honorRange: '500 - 1,999',
          nextRank: 'Daimyo (2,000 honor)',
          color: COLORS.SAMURAI,
          emoji: EMOJIS.SAMURAI
        },
        'Daimyo': {
          description: 'Un señor feudal respetado, líder entre los guerreros del dojo.',
          benefits: [
            '• Todos los beneficios de Samurai',
            '• Recompensas diarias mejoradas',
            '• Capacidad de crear clanes',
            '• Prioridad en eventos del dojo',
            '• Emblema dorado en el ranking'
          ],
          honorRange: '2,000 - 4,999',
          nextRank: 'Shogun (5,000 honor)',
          color: COLORS.DAIMYO,
          emoji: EMOJIS.DAIMYO
        },
        'Shogun': {
          description: 'El comandante supremo, maestro absoluto del arte samurai.',
          benefits: [
            '• Todos los beneficios de Daimyo',
            '• Máximas recompensas diarias',
            '• Acceso a comandos exclusivos',
            '• Emblema legendario en el ranking',
            '• Reconocimiento eterno en el dojo',
            '• Rol especial (si configurado)'
          ],
          honorRange: '5,000+',
          nextRank: 'Rango Máximo',
          color: COLORS.SHOGUN,
          emoji: EMOJIS.SHOGUN
        }
      };

      const info = rankInfo[currentRank];

      const embed = new EmbedBuilder()
        .setColor(info.color)
        .setTitle(`${info.emoji} ${currentRank}`)
        .setDescription(info.description)
        .addFields(
          {
            name: `${EMOJIS.SCROLL} Rango de Honor`,
            value: info.honorRange,
            inline: true
          },
          {
            name: `${EMOJIS.HONOR} Tu Honor`,
            value: `${currentHonor} puntos`,
            inline: true
          },
          {
            name: '\u200B',
            value: '\u200B',
            inline: true
          },
          {
            name: `${EMOJIS.GIFT} Beneficios del Rango`,
            value: info.benefits.join('\n'),
            inline: false
          },
          {
            name: `${EMOJIS.KATANA} Próximo Rango`,
            value: info.nextRank,
            inline: false
          }
        )
        .setThumbnail(message.author.displayAvatarURL())
        .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      console.log(`${EMOJIS.SUCCESS} ${message.author.tag} consultó su rango (${currentRank})`);
    } catch (error) {
      console.error('Error ejecutando comando !rango:', error);
      await message.reply('❌ Ocurrió un error al consultar tu rango.');
    }
  }

  // !top - Leaderboard de honor
  if (message.content.toLowerCase() === '!top') {
    try {
      const guildId = message.guild.id;

      const statusMsg = await message.reply(`${EMOJIS.LOADING} Consultando el ranking de honor...`);

      const guildUsers = dataManager.getGuildUsers(guildId).filter(u => u.userId !== client.user.id);

      if (guildUsers.length === 0) {
        return statusMsg.edit(`${EMOJIS.INFO} Aún no hay guerreros registrados en el dojo. ¡Usa comandos para ganar honor!`);
      }

      const sortedUsers = guildUsers.sort((a, b) => b.honor - a.honor);
      const top10 = sortedUsers.slice(0, CONSTANTS.LEADERBOARDS.TOP_DISPLAY_COUNT);

      const userIndex = sortedUsers.findIndex(u => u.userId === message.author.id);
      const userPosition = userIndex >= 0 ? userIndex + 1 : null;
      const userHonor = userIndex >= 0 ? sortedUsers[userIndex].honor : 0;

      // Obtener displayNames del servidor (nombres modificados en el canal)
      const userIds = top10.map(u => u.userId);
      const displayNameMap = await fetchDisplayNamesBatch(message.guild, userIds);

      let description = '';

      for (let i = 0; i < top10.length; i++) {
        const user = top10[i];
        const position = i + 1;

        let positionEmoji = '';
        if (position === 1) positionEmoji = EMOJIS.FIRST;
        else if (position === 2) positionEmoji = EMOJIS.SECOND;
        else if (position === 3) positionEmoji = EMOJIS.THIRD;
        else positionEmoji = `\`${position}.\``;

        const rankEmoji = getRankEmoji(user.rank);
        const userName = displayNameMap.get(user.userId) || 'Usuario Desconocido';

        const isCurrentUser = user.userId === message.author.id;
        const highlight = isCurrentUser ? '**➤ ' : '';
        const highlightEnd = isCurrentUser ? '**' : '';

        description += `${positionEmoji} ${highlight}${rankEmoji} ${userName} - ${user.honor} honor${highlightEnd}\n`;
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.GOLD)
        .setTitle(`${EMOJIS.TROPHY} Ranking de Honor - ${message.guild.name}`)
        .setDescription(description)
        .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
        .setTimestamp();

      if (userPosition !== null && userPosition > 10) {
        embed.addFields({
          name: `${EMOJIS.INFO} Tu Posición`,
          value: `**#${userPosition}** - ${userHonor} honor`,
          inline: false
        });
      } else if (userPosition === null) {
        embed.addFields({
          name: `${EMOJIS.INFO} Tu Posición`,
          value: 'No registrado - ¡Usa comandos para ganar honor!',
          inline: false
        });
      }

      await statusMsg.edit({ content: null, embeds: [embed] });
      console.log(`${EMOJIS.SUCCESS} ${message.author.tag} consultó el ranking de honor`);
    } catch (error) {
      console.error('Error ejecutando comando !top:', error);
      await message.reply('❌ Ocurrió un error al consultar el ranking.');
    }
  }
});
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // Comandos de música que requieren estar en el canal de música
  const musicCommands = ['tocar', 'play', 'pausar', 'pause', 'reanudar', 'resume', 'siguiente', 'skip', 'detener', 'stop', 'cola', 'queue', 'ahora', 'sonando', 'nowplaying', 'np', 'limpiar', 'clear', 'saltar', 'jump', 'remover', 'remove', 'volumen', 'volume', 'buscar', 'search', 'mezclar', 'shuffle', 'repetir', 'loop', 'playlist', 'ayudamusica', 'helpmusic'];
  
  // Verificar si el comando de música debe ejecutarse en el canal de música
  if (musicCommands.includes(commandName)) {
    if (config.musicChannel && config.musicChannel.enabled && config.musicChannel.channelId) {
      if (interaction.channel.id !== config.musicChannel.channelId) {
        const musicChannel = interaction.guild.channels.cache.get(config.musicChannel.channelId);
        const channelName = musicChannel ? musicChannel.name : 'el canal de música';
        const channelMention = musicChannel ? `<#${config.musicChannel.channelId}>` : 'el canal de música';
        
        return interaction.reply({
          content: `❌ Los comandos de música solo pueden usarse en ${channelMention} (**${channelName}**).`,
          flags: MessageFlags.Ephemeral
        });
      }
    }
    // Si es un comando de música y pasó la verificación, salir aquí para evitar la verificación del canal de comandos
    // (continuará con el switch más abajo)
  }
  
  // Comandos que NO requieren estar en el canal de comandos
  const excludedCommands = ['traducir', 'hablar', 'join', 'salir', 'help', 'testwelcome', 'borrarmsg', 'deshacerborrado', 'tienda', 'duelo', 'sabiduria', 'fortuna', 'perfil', 'ayudamusica', 'helpmusic'];
  
  // Verificar si el comando debe ejecutarse en un canal específico
  // (excluir comandos de música ya que tienen su propia verificación)
  if (config.commandsChannel && config.commandsChannel.enabled && config.commandsChannel.channelId) {
    if (!excludedCommands.includes(commandName) && !musicCommands.includes(commandName)) {
      if (interaction.channel.id !== config.commandsChannel.channelId) {
        const commandsChannel = interaction.guild.channels.cache.get(config.commandsChannel.channelId);
        const channelName = commandsChannel ? commandsChannel.name : 'el canal de comandos';
        const channelMention = commandsChannel ? `<#${config.commandsChannel.channelId}>` : 'el canal de comandos';
        
        return interaction.reply({
          content: `❌ Este comando solo puede usarse en ${channelMention} (**${channelName}**).`,
          flags: MessageFlags.Ephemeral
        });
      }
    }
  }

  try {
    // /testwelcome
    if (commandName === 'testwelcome') {
      const userId = interaction.user.id;

      // Verificar cooldown (usando dataManager persistente)
      if (dataManager.hasCooldown(userId, 'testwelcome')) {
        const timeLeft = dataManager.getCooldownTime(userId, 'testwelcome');
        return interaction.reply({
          content: MESSAGES.ERRORS.COOLDOWN(timeLeft),
          flags: MessageFlags.Ephemeral
        });
      }

      // Establecer cooldown (se guarda en JSON)
      dataManager.setCooldown(userId, 'testwelcome', COOLDOWN_SECONDS);

      await interaction.deferReply();

      const member = interaction.guild.members.cache.get(interaction.user.id);
      if (!member) {
        return interaction.editReply('❌ No se pudo encontrar información del miembro.');
      }

      const attachment = await createWelcomeCard(member);
      await interaction.editReply({
        content: `${interaction.user}, aquí está la vista previa de tu tarjeta de bienvenida:`,
        files: [attachment]
      });

      console.log(`✓ Tarjeta de bienvenida de prueba enviada para ${interaction.user.tag} (slash)`);
    }

    // /help
    else if (commandName === 'help') {
      // Obtener nombres de canales si están configurados
      const commandsChannel = config.commandsChannel && config.commandsChannel.enabled && config.commandsChannel.channelId
        ? interaction.guild.channels.cache.get(config.commandsChannel.channelId)
        : null;
      const shopChannel = config.shopChannel && config.shopChannel.enabled && config.shopChannel.channelId
        ? interaction.guild.channels.cache.get(config.shopChannel.channelId)
        : null;
      const combatChannel = config.combatChannel && config.combatChannel.enabled && config.combatChannel.channelId
        ? interaction.guild.channels.cache.get(config.combatChannel.channelId)
        : null;

      const commandsChannelName = commandsChannel ? `**${commandsChannel.name}**` : 'Cualquier canal';
      const shopChannelName = shopChannel ? `**${shopChannel.name}**` : 'Cualquier canal';
      const combatChannelName = combatChannel ? `**${combatChannel.name}**` : 'Cualquier canal';

      // Dividir en múltiples embeds para evitar el límite de 25 campos
      const embed1 = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(`${EMOJIS.TORII} Comandos del Dojo - Demon Hunter`)
        .setDescription(`Bienvenido al manual del guerrero, ${interaction.member?.displayName || interaction.user.username}. Aquí encontrarás todos los comandos disponibles.\n\n${EMOJIS.KATANA} **Tip:** Escribe \`/\` en Discord para ver todos los comandos con autocompletar!`)
        .addFields(
          // ========== BIENVENIDA Y AYUDA ==========
          {
            name: `${EMOJIS.TORII} __BIENVENIDA Y AYUDA__`,
            value: '🎨 `/testwelcome` - Vista previa de tarjeta de bienvenida\n❓ `/help` - Muestra este mensaje\n📍 *Cualquier canal*',
            inline: false
          },
          // ========== MODERACIÓN ==========
          {
            name: `${EMOJIS.KATANA} __MODERACIÓN__`,
            value: '🗑️ `/borrarmsg` - Elimina mensajes de un usuario\n🔄 `/deshacerborrado` - Restaura mensajes eliminados\n*Req: Administrar Mensajes*\n📍 *Cualquier canal*',
            inline: false
          },
          // ========== VOZ / TTS ==========
          {
            name: `${EMOJIS.VOICE} __VOZ / TTS__`,
            value: '🔗 `/join` - Bot se une a voz y lee mensajes\n🔊 `/hablar <texto>` - Text-to-speech en español\n👋 `/salir` - Desconecta el bot de voz\n📍 *Cualquier canal*',
            inline: false
          },
          // ========== HONOR Y RANGOS ==========
          {
            name: `${EMOJIS.HONOR} __HONOR Y RANGOS__`,
            value: `⭐ \`/honor [@usuario]\` - Ver honor y progreso de rango\n⚔️ \`/rango\` - Info del sistema de rangos\n🏆 \`/top\` - Ranking de honor (top 10)\n📍 *${commandsChannelName}*`,
            inline: false
          },
          // ========== ECONOMÍA ==========
          {
            name: `${EMOJIS.KOKU} __ECONOMÍA__`,
            value: `📅 \`/daily\` - Recompensa diaria de koku\n💰 \`/balance\` - Ver tu koku, honor y racha\n💸 \`/pay\` - Transferir koku a otro usuario\n📊 \`/leaderboard\` - Rankings interactivos del dojo\n📍 *${commandsChannelName}*`,
            inline: false
          },
          // ========== CLANES ==========
          {
            name: `${EMOJIS.CLAN} __CLANES__`,
            value: `🏯 \`/clan crear\` - Crear tu propio clan\n🏯 \`/clan info\` - Ver información de un clan\n🏯 \`/clan unirse\` - Unirse a un clan\n🏯 \`/clan salir\` - Abandonar tu clan actual\n📍 *${commandsChannelName}*`,
            inline: false
          },
          {
            name: `${EMOJIS.CLAN} __CLANES (CONT.)__`,
            value: `🏯 \`/clan miembros\` - Lista de miembros del clan\n🏯 \`/clan top\` - Ranking de clanes\n🏯 \`/clan invitar\` - Invitar usuario al clan\n🏯 \`/clan expulsar\` - Expulsar miembro del clan\n📍 *${commandsChannelName}*`,
            inline: false
          },
          // ========== TIENDA ==========
          {
            name: `${EMOJIS.SHOP} __TIENDA__`,
            value: `🏪 \`/tienda ver\` - Ver productos disponibles\n🛒 \`/tienda comprar\` - Comprar un item\n📦 \`/tienda inventario\` - Ver tu inventario\n📍 *${shopChannelName}*`,
            inline: false
          },
          // ========== COMBATE Y JUEGOS ==========
          {
            name: `${EMOJIS.DUEL} __COMBATE Y JUEGOS__`,
            value: `⚔️ \`/duelo @usuario\` - Desafía a un duelo de honor\n📜 \`/sabiduria\` - Citas de maestros samurai\n🎴 \`/fortuna\` - Omikuji (fortuna diaria)\n👤 \`/perfil [@usuario]\` - Ver perfil completo de guerrero\n📍 *${combatChannelName}*`,
            inline: false
          },
          // ========== UTILIDADES ==========
          {
            name: `${EMOJIS.TRANSLATION} __UTILIDADES__`,
            value: '🌐 `/traducir` - Traduce entre ES/JP/EN\n*Máx: 500 caracteres*\n📍 *Cualquier canal*',
            inline: false
          }
        )
        .setFooter({ text: `Demon Hunter Bot v1.5 • ${EMOJIS.FIRE} Total: 23 comandos slash` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed1] });
      console.log(`${EMOJIS.SUCCESS} Comando de ayuda mostrado para ${interaction.user.tag} (slash)`);
    }

    // /purge now (admin-only, restricted to owner's ID)
    else if (commandName === 'purge') {
      const OWNER_ID = '331621993860300800';
      if (interaction.user.id !== OWNER_ID) {
        return interaction.reply({ content: '❌ No autorizado. Solo el propietario puede usar este comando.', flags: MessageFlags.Ephemeral });
      }

      // Ensure the purge runner is available
      if (!client.runPurgeTask) {
        return interaction.reply({ content: '❌ La tarea de purge no está disponible en este momento.', flags: MessageFlags.Ephemeral });
      }

      // Prevent concurrent runs
      if (client.isPurgeRunningFlag && client.isPurgeRunningFlag()) {
        return interaction.reply({ content: '⚠️ Ya hay una purga en curso. Intenta de nuevo más tarde.', flags: MessageFlags.Ephemeral });
      }

      await interaction.deferReply({ ephemeral: true });
      try {
        client.setPurgeRunning(true);
        await client.runPurgeTask();
        await interaction.editReply({ content: '✅ Purge ejecutada correctamente. Revisa los logs para detalles.' });
      } catch (err) {
        console.error('Error ejecutando purge desde comando:', err);
        await interaction.editReply({ content: '❌ Ocurrió un error al ejecutar la purge. Revisa la consola.' });
      } finally {
        client.setPurgeRunning(false);
      }
    }

    // /borrarmsg
    else if (commandName === 'borrarmsg') {
      // Verificar permisos
      if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({ content: '❌ No tienes permisos para borrar mensajes. Necesitas el permiso "Administrar Mensajes".', flags: MessageFlags.Ephemeral });
      }

      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({ content: '❌ No tengo permisos para borrar mensajes. Por favor otorga el permiso "Administrar Mensajes" al bot.', flags: MessageFlags.Ephemeral });
      }

      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ReadMessageHistory)) {
        return interaction.reply({ content: '❌ No tengo permisos para leer el historial de mensajes. Por favor otorga el permiso "Leer Historial de Mensajes" al bot.', flags: MessageFlags.Ephemeral });
      }

      const userId = interaction.user.id;

      // Verificar cooldown (usando dataManager persistente)
      if (dataManager.hasCooldown(userId, 'borrarmsg')) {
        const timeLeft = dataManager.getCooldownTime(userId, 'borrarmsg');
        return interaction.reply({
          content: MESSAGES.ERRORS.COOLDOWN(timeLeft),
          flags: MessageFlags.Ephemeral
        });
      }

      // Establecer cooldown (se guarda en JSON)
      dataManager.setCooldown(userId, 'borrarmsg', COOLDOWN_SECONDS);

      // Obtener usuario de la opción de usuario o del ID
      const targetUserOption = interaction.options.getUser('usuario');
      const targetIdOption = interaction.options.getString('id_usuario');

      let targetUserId = null;
      let targetUserTag = null;
      let isDeletedUser = false;

      // Si se proporcionó un usuario mediante la opción de usuario
      if (targetUserOption) {
        targetUserId = targetUserOption.id;
        targetUserTag = targetUserOption.tag;
      }
      // Si se proporcionó un ID
      else if (targetIdOption) {
        const idArg = targetIdOption.trim();
        if (/^\d{17,19}$/.test(idArg)) {
          targetUserId = idArg;
          try {
            const user = await interaction.client.users.fetch(targetUserId);
            targetUserTag = user.tag;
          } catch {
            targetUserTag = `Usuario eliminado (${targetUserId})`;
            isDeletedUser = true;
          }
        } else {
          return interaction.reply({ content: '❌ Formato inválido. El ID del usuario debe tener 17-19 dígitos.', flags: MessageFlags.Ephemeral });
        }
      }
      // Si no se proporcionó ninguna opción
      else {
        return interaction.reply({ content: '❌ Debes proporcionar un usuario o un ID de usuario. Usa `/borrarmsg usuario:@Usuario` o `/borrarmsg id_usuario:123456789012345678`', flags: MessageFlags.Ephemeral });
      }

      if (!targetUserId) {
        return interaction.reply({ content: '❌ No se pudo identificar al usuario.', flags: MessageFlags.Ephemeral });
      }

      await interaction.deferReply();

      // Contar mensajes
      let messageCount = 0;
      let fetchMore = true;
      let lastMessageId = null;

      while (fetchMore) {
        const fetchOptions = { limit: 100 };
        if (lastMessageId) fetchOptions.before = lastMessageId;

        const fetchedMessages = await interaction.channel.messages.fetch(fetchOptions);
        if (fetchedMessages.size === 0) {
          fetchMore = false;
          break;
        }

        const targetMessages = fetchedMessages.filter(msg => msg.author.id === targetUserId);
        messageCount += targetMessages.size;
        lastMessageId = fetchedMessages.last()?.id;

        if (fetchedMessages.size < 100 || messageCount >= 500) {
          fetchMore = false;
        }
      }

      const userDisplayName = isDeletedUser ? `Usuario eliminado (ID: ${targetUserId})` : targetUserTag;
      if (messageCount === 0) {
        return interaction.editReply(`❌ No se encontraron mensajes de ${userDisplayName} en este canal.`);
      }

      if (channelLocks.has(interaction.channel.id)) {
        return interaction.editReply('❌ Ya hay una operación de borrado en proceso en este canal. Por favor espera a que termine.');
      }

      channelLocks.add(interaction.channel.id);

      // Crear botones
      const confirmButton = new ButtonBuilder()
        .setCustomId('confirm_delete')
        .setLabel('✅ Confirmar')
        .setStyle(ButtonStyle.Danger);

      const cancelButton = new ButtonBuilder()
        .setCustomId('cancel_delete')
        .setLabel('❌ Cancelar')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

      await interaction.editReply({
        content: `⚠️ Se encontraron **${messageCount}** mensaje(s) de ${userDisplayName}.\n¿Estás seguro que deseas borrarlos? Tendrás ${UNDO_TIMEOUT_MINUTES} minutos para deshacerlo.`,
        components: [row]
      });

      const filter = i => (i.customId === 'confirm_delete' || i.customId === 'cancel_delete') && i.user.id === interaction.user.id;

      try {
        // Obtener el mensaje de respuesta después de editReply
        const replyMessage = await interaction.fetchReply();
        try {
          const buttonInteraction = await replyMessage.awaitMessageComponent({ filter, time: 30000 });

          if (buttonInteraction.customId === 'cancel_delete') {
            await buttonInteraction.update({ content: '❌ Operación cancelada.', components: [] });
            channelLocks.delete(interaction.channel.id);
            return;
          }
        } catch (error) {
          if (error.message && (error.message.includes('time') || error.message.includes('expired'))) {
            await interaction.editReply({
              content: MESSAGES.GENERIC.TIMEOUT_DELETE(30),
              components: []
            });
          } else {
            await interaction.editReply({
              content: `❌ Ocurrió un error: ${error.message || 'Error desconocido'}. Por favor, intenta de nuevo.`,
              components: []
            });
          }
          channelLocks.delete(interaction.channel.id);
          return;
        }

        await buttonInteraction.update({ content: `🗑️ Borrando mensajes de ${userDisplayName}...`, components: [] });

        // Borrar mensajes (lógica similar al comando !)
        const savedMessages = [];
        let totalDeleted = 0;
        fetchMore = true;
        lastMessageId = null;

        while (fetchMore) {
          const fetchOptions = { limit: 100 };
          if (lastMessageId) fetchOptions.before = lastMessageId;

          const fetchedMessages = await interaction.channel.messages.fetch(fetchOptions);
          if (fetchedMessages.size === 0) {
            fetchMore = false;
            break;
          }

          const targetMessages = fetchedMessages.filter(msg => msg.author.id === targetUserId);

          if (targetMessages.size > 0) {
            for (const [, msg] of targetMessages) {
              // Obtener el tag del autor (puede ser null si el usuario fue eliminado)
              const authorId = msg.author ? msg.author.id : targetUserId;
              const authorTag = msg.author ? msg.author.tag : `Usuario eliminado (${authorId})`;
              const authorAvatarURL = msg.author ? msg.author.displayAvatarURL() : null;
              
              savedMessages.push({
                content: msg.content,
                authorId: authorId,
                authorTag: authorTag,
                authorAvatarURL: authorAvatarURL,
                timestamp: msg.createdTimestamp,
                attachments: msg.attachments.map(att => ({ url: att.url, name: att.name })),
                embeds: msg.embeds
              });
            }

            const recentMessages = targetMessages.filter(msg => Date.now() - msg.createdTimestamp < 14 * 24 * 60 * 60 * 1000);
            if (recentMessages.size > 0) {
              if (recentMessages.size === 1) {
                await recentMessages.first().delete();
                totalDeleted += 1;
              } else {
                const deleted = await interaction.channel.bulkDelete(recentMessages, true);
                totalDeleted += deleted.size;
              }
            }

            const oldMessages = targetMessages.filter(msg => Date.now() - msg.createdTimestamp >= 14 * 24 * 60 * 60 * 1000);
            for (const [, oldMsg] of oldMessages) {
              try {
                await oldMsg.delete();
                totalDeleted += 1;
                await new Promise(resolve => setTimeout(resolve, 1000));
              } catch (error) {
                console.error(`Error borrando mensaje antiguo ${oldMsg.id}:`, error.message);
              }
            }
          }

          lastMessageId = fetchedMessages.last()?.id;
          if (fetchedMessages.size < 100 || totalDeleted >= 500) {
            fetchMore = false;
          }
        }

        // Guardar en cache
        const existingEntry = deletedMessagesCache.get(interaction.channel.id);
        if (existingEntry && existingEntry.timeoutId) {
          clearTimeout(existingEntry.timeoutId);
        }

        const timeoutId = setTimeout(() => {
          deletedMessagesCache.delete(interaction.channel.id);
        }, UNDO_TIMEOUT_MINUTES * 60 * 1000);

        deletedMessagesCache.set(interaction.channel.id, {
          messages: savedMessages,
          deletedBy: interaction.user.id,
          targetUser: userDisplayName,
          timestamp: Date.now(),
          timeoutId: timeoutId
        });

        await buttonInteraction.editReply({
          content: `✅ Se borraron **${totalDeleted}** mensaje(s) de ${userDisplayName}\n💡 Usa \`/deshacerborrado\` en los próximos ${UNDO_TIMEOUT_MINUTES} minutos para restaurarlos.`,
          components: []
        });

        console.log(`✓ ${interaction.user.tag} borró ${totalDeleted} mensajes de ${userDisplayName} en #${interaction.channel.name} (slash)`);
        channelLocks.delete(interaction.channel.id);

      } catch (error) {
        if (error.message && error.message.includes('time')) {
          await interaction.editReply({ content: '⏱️ Se agotó el tiempo de espera. Operación cancelada.', components: [] });
          channelLocks.delete(interaction.channel.id);
        } else {
          throw error;
        }
      }
    }

    // /deshacerborrado
    else if (commandName === 'deshacerborrado') {
      if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({ content: '❌ No tienes permisos para usar este comando. Necesitas el permiso "Administrar Mensajes".', flags: MessageFlags.Ephemeral });
      }

      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageWebhooks)) {
        return interaction.reply({ content: '❌ No tengo permisos para restaurar mensajes. Por favor otorga el permiso "Administrar Webhooks" al bot.', flags: MessageFlags.Ephemeral });
      }

      const entry = deletedMessagesCache.get(interaction.channel.id);
      if (!entry) {
        return interaction.reply({ content: `❌ No hay mensajes borrados para restaurar en este canal (o ya pasaron ${UNDO_TIMEOUT_MINUTES} minutos).`, flags: MessageFlags.Ephemeral });
      }

      await interaction.deferReply();
      await interaction.editReply(`🔄 Restaurando ${entry.messages.length} mensajes de ${entry.targetUser}...`);

      const webhooks = await interaction.channel.fetchWebhooks();
      let webhook = webhooks.find(wh => wh.owner.id === client.user.id);

      if (!webhook) {
        webhook = await interaction.channel.createWebhook({
          name: 'Restaurador de Mensajes',
          reason: 'Webhook para restaurar mensajes borrados'
        });
      }

      const sortedMessages = entry.messages.sort((a, b) => a.timestamp - b.timestamp);
      let restored = 0;

      for (const msgData of sortedMessages) {
        try {
          const webhookOptions = {
            content: msgData.content || null,
            username: msgData.authorTag,
            avatarURL: msgData.authorAvatarURL,
            embeds: msgData.embeds
          };

          if (msgData.attachments && msgData.attachments.length > 0) {
            webhookOptions.files = msgData.attachments.map(att => att.url);
          }

          await webhook.send(webhookOptions);
          restored++;
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('Error restaurando mensaje:', error.message);
        }
      }

      if (entry.timeoutId) {
        clearTimeout(entry.timeoutId);
      }
      deletedMessagesCache.delete(interaction.channel.id);

      await interaction.editReply(`✅ Se restauraron **${restored}** de **${entry.messages.length}** mensajes.`);
      console.log(`✓ ${interaction.user.tag} restauró ${restored} mensajes en #${interaction.channel.name} (slash)`);
    }

    // /hablar
    else if (commandName === 'hablar') {
      const textToSpeak = interaction.options.getString('texto');
      const userVoiceChannel = interaction.member.voice.channel;

      if (!userVoiceChannel) {
        return interaction.reply({ content: '❌ Debes estar en un canal de voz para usar este comando.', flags: MessageFlags.Ephemeral });
      }

      const permissions = userVoiceChannel.permissionsFor(interaction.guild.members.me);
      if (!permissions.has(PermissionFlagsBits.Connect)) {
        return interaction.reply({ content: '❌ No tengo permisos para conectarme a tu canal de voz. Por favor otorga el permiso "Conectar".', flags: MessageFlags.Ephemeral });
      }

      if (!permissions.has(PermissionFlagsBits.Speak)) {
        return interaction.reply({ content: '❌ No tengo permisos para hablar en tu canal de voz. Por favor otorga el permiso "Hablar".', flags: MessageFlags.Ephemeral });
      }

      const guildId = interaction.guild.id;
      await interaction.deferReply();

      if (!isConnected(guildId)) {
        await connectToVoiceChannel(userVoiceChannel);
        // Guardar el canal de texto donde se ejecutó el comando
        setVoiceChannelTextChannel(guildId, userVoiceChannel, interaction.channel.id);
        await interaction.editReply(`✅ Conectado a **${userVoiceChannel.name}**`);
      }

      const userName = interaction.member.displayName || interaction.user.username;
      const fullMessage = `${userName} dice: ${textToSpeak}`;

      await speakText(guildId, fullMessage, 'es');
      await interaction.editReply(`🔊 Reproduciendo: "${textToSpeak}"`);
      console.log(`✓ ${interaction.user.tag} usó TTS: "${fullMessage}" (slash)`);
    }

    // /join
    else if (commandName === 'join') {
      const userVoiceChannel = interaction.member.voice.channel;

      if (!userVoiceChannel) {
        return interaction.reply({ content: '❌ Debes estar en un canal de voz para usar este comando.', flags: MessageFlags.Ephemeral });
      }

      const guildId = interaction.guild.id;

      if (isConnected(guildId)) {
        return interaction.reply({ content: '✅ Ya estoy conectado a un canal de voz. Usa `/salir` para desconectarme primero.', flags: MessageFlags.Ephemeral });
      }

      const permissions = userVoiceChannel.permissionsFor(interaction.guild.members.me);
      if (!permissions.has(PermissionFlagsBits.Connect)) {
        return interaction.reply({ content: '❌ No tengo permisos para conectarme a tu canal de voz. Por favor otorga el permiso "Conectar".', flags: MessageFlags.Ephemeral });
      }

      if (!permissions.has(PermissionFlagsBits.Speak)) {
        return interaction.reply({ content: '❌ No tengo permisos para hablar en tu canal de voz. Por favor otorga el permiso "Hablar".', flags: MessageFlags.Ephemeral });
      }

      await interaction.deferReply();
      await connectToVoiceChannel(userVoiceChannel);
      // Guardar el canal de texto donde se ejecutó el comando (chat de voz)
      setVoiceChannelTextChannel(guildId, userVoiceChannel, interaction.channel.id);
      await interaction.editReply(`✅ Conectado a **${userVoiceChannel.name}**\n💬 Ahora leeré automáticamente los mensajes que escriban los usuarios en este canal de texto (chat de voz).`);
      console.log(`✓ ${interaction.user.tag} conectó el bot a ${userVoiceChannel.name} (modo lectura automática, slash, canal de texto: ${interaction.channel.name})`);
    }

    // /salir
    else if (commandName === 'salir') {
      const guildId = interaction.guild.id;

      if (!isConnected(guildId)) {
        return interaction.reply({ content: '❌ No estoy conectado a ningún canal de voz.', flags: MessageFlags.Ephemeral });
      }

      disconnectFromVoiceChannel(guildId);
      lastVoiceSpeakers.delete(guildId); // Limpiar registro de últimos hablantes
      await interaction.reply('👋 Me he desconectado del canal de voz.');
      console.log(`✓ ${interaction.user.tag} desconectó el bot del canal de voz (slash)`);
    }

    // ==================== FASE 3: SISTEMA DE HONOR Y RANGOS ====================

    // /honor - Mostrar honor actual y progreso
    else if (commandName === 'honor') {
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;

      // Obtener datos del usuario
      const userData = dataManager.getUser(userId, guildId);
      const currentHonor = userData.honor;
      const currentRank = userData.rank;

      // Calcular el siguiente rango y honor necesario
      let nextRank = null;
      let honorNeeded = 0;
      let progressPercent = 0;
      let rankThresholds = {
        'Ronin': { next: 'Samurai', threshold: CONSTANTS.HONOR.RANK_THRESHOLDS.SAMURAI },
        'Samurai': { next: 'Daimyo', threshold: CONSTANTS.HONOR.RANK_THRESHOLDS.DAIMYO },
        'Daimyo': { next: 'Shogun', threshold: CONSTANTS.HONOR.RANK_THRESHOLDS.SHOGUN },
        'Shogun': { next: null, threshold: null }
      };

      if (currentRank !== 'Shogun') {
        nextRank = rankThresholds[currentRank].next;
        const threshold = rankThresholds[currentRank].threshold;
        honorNeeded = threshold - currentHonor;

        // Calcular porcentaje de progreso
        if (currentRank === 'Ronin') {
          progressPercent = Math.min(100, (currentHonor / CONSTANTS.HONOR.RANK_THRESHOLDS.SAMURAI) * 100);
        } else if (currentRank === 'Samurai') {
          const start = CONSTANTS.HONOR.RANK_THRESHOLDS.SAMURAI;
          const end = CONSTANTS.HONOR.RANK_THRESHOLDS.DAIMYO;
          progressPercent = Math.min(100, ((currentHonor - start) / (end - start)) * 100);
        } else if (currentRank === 'Daimyo') {
          const start = CONSTANTS.HONOR.RANK_THRESHOLDS.DAIMYO;
          const end = CONSTANTS.HONOR.RANK_THRESHOLDS.SHOGUN;
          progressPercent = Math.min(100, ((currentHonor - start) / (end - start)) * 100);
        }
      } else {
        // Ya es Shogun (rango máximo)
        progressPercent = 100;
      }

      // Crear barra de progreso visual
      const barLength = CONSTANTS.LEADERBOARDS.PROGRESS_BAR_LENGTH;
      const filledBars = Math.floor((progressPercent / 100) * barLength);
      const emptyBars = barLength - filledBars;
      const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

      // Crear embed de honor
      const embed = new EmbedBuilder()
        .setColor(COLORS.HONOR)
        .setTitle(`${EMOJIS.HONOR} Honor de ${interaction.member.displayName || interaction.user.username}`)
        .setDescription(`Tu camino samurai en **${interaction.guild.name}**`)
        .addFields(
          {
            name: `${EMOJIS.STAR} Honor Actual`,
            value: `**${currentHonor}** puntos`,
            inline: true
          },
          {
            name: `${getRankEmoji(currentRank)} Rango`,
            value: `**${currentRank}**`,
            inline: true
          },
          {
            name: '\u200B',
            value: '\u200B',
            inline: true
          }
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
        .setTimestamp();

      // Añadir campo de progreso si no es Shogun
      if (currentRank !== 'Shogun') {
        embed.addFields({
          name: `${EMOJIS.LOADING} Progreso hacia ${nextRank}`,
          value: `${progressBar} ${progressPercent.toFixed(1)}%\n${EMOJIS.KATANA} Faltan **${honorNeeded}** puntos de honor`,
          inline: false
        });
      } else {
        embed.addFields({
          name: `${EMOJIS.CROWN} Rango Máximo Alcanzado`,
          value: `${EMOJIS.TROPHY} Has alcanzado el rango más alto del dojo. ¡Tu leyenda es eterna!`,
          inline: false
        });
      }

      // Añadir información del clan si pertenece a uno
      if (userData.clanId) {
        const userClan = dataManager.getClan(userData.clanId);
        if (userClan) {
          const clanLevel = dataManager.getClanLevel(userClan.totalHonor);
          const isLeader = userClan.leaderId === userId;
          const leaderBadge = isLeader ? `${EMOJIS.LEADER} ` : '';
          embed.addFields({
            name: `${EMOJIS.CLAN} Clan`,
            value: `${leaderBadge}**[${userClan.tag}] ${userClan.name}**\n${EMOJIS.CLAN_LEVEL} Nivel ${clanLevel.level} | ${EMOJIS.MEMBERS} ${userClan.members.length}/${clanLevel.maxMembers} miembros`,
            inline: false
          });
        }
      }

      // Añadir estadísticas
      embed.addFields({
        name: `${EMOJIS.SCROLL} Estadísticas`,
        value: `${EMOJIS.MESSAGE} Mensajes: **${userData.stats?.messagesCount || 0}**\n${EMOJIS.VOICE} Minutos en voz: **${userData.stats?.voiceMinutes || 0}**\n${EMOJIS.DUEL} Duelos ganados: **${userData.stats?.duelsWon || 0}**`,
        inline: false
      });

      await interaction.reply({ embeds: [embed] });
      console.log(`${EMOJIS.SUCCESS} ${interaction.user.tag} consultó su honor (${currentHonor} honor, ${currentRank})`);
    }

    // /rango - Mostrar rango actual y beneficios
    else if (commandName === 'rango') {
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;

      const userData = dataManager.getUser(userId, guildId);
      const currentRank = userData.rank;
      const currentHonor = userData.honor;

      // Definir información de rangos
      const rankInfo = {
        'Ronin': {
          description: 'Un guerrero sin maestro que busca su camino en el dojo.',
          benefits: [
            '• Acceso a comandos básicos del dojo',
            '• Ganancia de honor por actividad',
            '• Participación en el ranking'
          ],
          honorRange: '0 - 499',
          nextRank: 'Samurai (500 honor)',
          color: COLORS.RONIN,
          emoji: EMOJIS.RONIN
        },
        'Samurai': {
          description: 'Un guerrero disciplinado que ha demostrado su valía en el dojo.',
          benefits: [
            '• Todos los beneficios de Ronin',
            '• Mayor ganancia de honor diaria',
            '• Acceso a comandos de clan',
            '• Emblema especial en el ranking'
          ],
          honorRange: '500 - 1,999',
          nextRank: 'Daimyo (2,000 honor)',
          color: COLORS.SAMURAI,
          emoji: EMOJIS.SAMURAI
        },
        'Daimyo': {
          description: 'Un señor feudal respetado, líder entre los guerreros del dojo.',
          benefits: [
            '• Todos los beneficios de Samurai',
            '• Recompensas diarias mejoradas',
            '• Capacidad de crear clanes',
            '• Prioridad en eventos del dojo',
            '• Emblema dorado en el ranking'
          ],
          honorRange: '2,000 - 4,999',
          nextRank: 'Shogun (5,000 honor)',
          color: COLORS.DAIMYO,
          emoji: EMOJIS.DAIMYO
        },
        'Shogun': {
          description: 'El comandante supremo, maestro absoluto del arte samurai.',
          benefits: [
            '• Todos los beneficios de Daimyo',
            '• Máximas recompensas diarias',
            '• Acceso a comandos exclusivos',
            '• Emblema legendario en el ranking',
            '• Reconocimiento eterno en el dojo',
            '• Rol especial (si configurado)'
          ],
          honorRange: '5,000+',
          nextRank: 'Rango Máximo',
          color: COLORS.SHOGUN,
          emoji: EMOJIS.SHOGUN
        }
      };

      const info = rankInfo[currentRank];

      const embed = new EmbedBuilder()
        .setColor(info.color)
        .setTitle(`${info.emoji} ${currentRank}`)
        .setDescription(info.description)
        .addFields(
          {
            name: `${EMOJIS.SCROLL} Rango de Honor`,
            value: info.honorRange,
            inline: true
          },
          {
            name: `${EMOJIS.HONOR} Tu Honor`,
            value: `${currentHonor} puntos`,
            inline: true
          },
          {
            name: '\u200B',
            value: '\u200B',
            inline: true
          },
          {
            name: `${EMOJIS.GIFT} Beneficios del Rango`,
            value: info.benefits.join('\n'),
            inline: false
          },
          {
            name: `${EMOJIS.KATANA} Próximo Rango`,
            value: info.nextRank,
            inline: false
          }
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      console.log(`${EMOJIS.SUCCESS} ${interaction.user.tag} consultó su rango (${currentRank})`);
    }

    // /top - Leaderboard de honor
    else if (commandName === 'top') {
      const guildId = interaction.guild.id;

      await interaction.deferReply();

      // Obtener todos los usuarios del servidor
      const guildUsers = dataManager.getGuildUsers(guildId).filter(u => u.userId !== client.user.id);

      if (guildUsers.length === 0) {
        return interaction.editReply(`${EMOJIS.INFO} Aún no hay guerreros registrados en el dojo. ¡Usa comandos para ganar honor!`);
      }

      // Ordenar por honor (de mayor a menor)
      const sortedUsers = guildUsers.sort((a, b) => b.honor - a.honor);

      // Tomar top 10
      const top10 = sortedUsers.slice(0, CONSTANTS.LEADERBOARDS.TOP_DISPLAY_COUNT);

      // Encontrar posición del usuario que ejecutó el comando
      const userIndex = sortedUsers.findIndex(u => u.userId === interaction.user.id);
      const userPosition = userIndex >= 0 ? userIndex + 1 : null;
      const userHonor = userIndex >= 0 ? sortedUsers[userIndex].honor : 0;

      // Obtener displayNames del servidor (nombres modificados en el canal)
      const userIds = top10.map(u => u.userId);
      const displayNameMap = await fetchDisplayNamesBatch(interaction.guild, userIds);

      // Crear descripción del leaderboard
      let description = '';

      for (let i = 0; i < top10.length; i++) {
        const user = top10[i];
        const position = i + 1;

        // Emojis de medalla para top 3
        let positionEmoji = '';
        if (position === 1) positionEmoji = EMOJIS.FIRST;
        else if (position === 2) positionEmoji = EMOJIS.SECOND;
        else if (position === 3) positionEmoji = EMOJIS.THIRD;
        else positionEmoji = `\`${position}.\``;

        // Emoji de rango
        const rankEmoji = getRankEmoji(user.rank);

        // Obtener displayName del servidor (nombre modificado en el canal)
        const userName = displayNameMap.get(user.userId) || 'Usuario Desconocido';

        // Resaltar si es el usuario que ejecutó el comando
        const isCurrentUser = user.userId === interaction.user.id;
        const highlight = isCurrentUser ? '**➤ ' : '';
        const highlightEnd = isCurrentUser ? '**' : '';

        description += `${positionEmoji} ${highlight}${rankEmoji} ${userName} - ${user.honor} honor${highlightEnd}\n`;
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.GOLD)
        .setTitle(`${EMOJIS.TROPHY} Ranking de Honor - ${interaction.guild.name}`)
        .setDescription(description)
        .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
        .setTimestamp();

      // Añadir posición del usuario si no está en el top 10
      if (userPosition !== null && userPosition > 10) {
        embed.addFields({
          name: `${EMOJIS.INFO} Tu Posición`,
          value: `**#${userPosition}** - ${userHonor} honor`,
          inline: false
        });
      } else if (userPosition === null) {
        embed.addFields({
          name: `${EMOJIS.INFO} Tu Posición`,
          value: 'No registrado - ¡Usa comandos para ganar honor!',
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });
      console.log(`${EMOJIS.SUCCESS} ${interaction.user.tag} consultó el ranking de honor`);
    }

    // ==================== FASE 4: SISTEMA DE ECONOMÍA Y RECOMPENSAS DIARIAS ====================

    // /daily - Reclamar recompensa diaria
    else if (commandName === 'daily') {
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;

      const userData = dataManager.getUser(userId, guildId);
      const now = Date.now();

      // Verificar si ya reclamó hoy (24 horas)
      if (userData.lastDailyClaim) {
        const timeSinceLastClaim = now - userData.lastDailyClaim;
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (timeSinceLastClaim < twentyFourHours) {
          // Aún no han pasado 24 horas
          const timeLeft = twentyFourHours - timeSinceLastClaim;
          const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
          const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

          let timeLeftString = '';
          if (hoursLeft > 0) {
            timeLeftString = `${hoursLeft} hora${hoursLeft > 1 ? 's' : ''}`;
            if (minutesLeft > 0) {
              timeLeftString += ` y ${minutesLeft} minuto${minutesLeft > 1 ? 's' : ''}`;
            }
          } else {
            timeLeftString = `${minutesLeft} minuto${minutesLeft > 1 ? 's' : ''}`;
          }

          return interaction.reply({
            content: MESSAGES.ECONOMY.DAILY_ALREADY_CLAIMED(timeLeftString),
            flags: MessageFlags.Ephemeral
          });
        }
      }

      // Calcular streak
      let newStreak = 1;
      if (userData.lastDailyClaim) {
        const timeSinceLastClaim = now - userData.lastDailyClaim;
        const fortyEightHours = 48 * 60 * 60 * 1000;

        // Si reclamó dentro de las últimas 48 horas, continuar streak
        if (timeSinceLastClaim < fortyEightHours) {
          newStreak = (userData.dailyStreak || 0) + 1;
        }
        // Si pasaron más de 48 horas, perdió el streak
      }

      // Calcular recompensa usando CONSTANTS
      const baseReward = CONSTANTS.ECONOMY.DAILY.BASE_REWARD;
      const rankMultiplier = CONSTANTS.getRankMultiplier(userData.rank);
      const streakBonus = CONSTANTS.getStreakBonus(newStreak);

      const totalKoku = Math.floor(baseReward * rankMultiplier * (1 + streakBonus));

      // Actualizar datos del usuario
      userData.koku = (userData.koku || 0) + totalKoku;
      userData.lastDailyClaim = now;
      userData.dailyStreak = newStreak;
      dataManager.dataModified.users = true;

      // Track koku gain for active Koku Rush events
      try {
        const { getEventManager } = require('./utils/eventManager');
        const eventManager = getEventManager();
        const activeEvents = eventManager.getActiveEvents(guildId);

        for (const event of activeEvents) {
          if (event.type === 'koku_rush' && event.participants.includes(userId)) {
            eventManager.trackKokuGain(event.id, userId, userData.koku);
          }
        }
      } catch (e) {
        // Ignore event tracking errors
      }

      // Crear embed de recompensa
      const embed = new EmbedBuilder()
        .setColor(COLORS.KOKU)
        .setTitle(`${EMOJIS.DAILY} Recompensa Diaria Reclamada`)
        .setDescription(`¡Has reclamado tu recompensa diaria, ${interaction.member?.displayName || interaction.user.username}!`)
        .addFields(
          {
            name: `${EMOJIS.KOKU} Koku Ganado`,
            value: `**+${totalKoku}** koku`,
            inline: true
          },
          {
            name: `${EMOJIS.FIRE} Racha`,
            value: `**${newStreak}** día${newStreak > 1 ? 's' : ''}`,
            inline: true
          },
          {
            name: `${EMOJIS.BANK} Balance Total`,
            value: `**${userData.koku}** koku`,
            inline: true
          }
        )
        .addFields({
          name: `${EMOJIS.INFO} Detalles`,
          value: `${EMOJIS.COIN} Base: ${baseReward} koku\n${getRankEmoji(userData.rank)} Multiplicador de rango (${userData.rank}): x${rankMultiplier}\n${EMOJIS.STREAK} Bonus de racha: +${(streakBonus * 100).toFixed(0)}%`,
          inline: false
        })
        .setFooter({ text: '💡 Reclama todos los días para mantener tu racha activa' })
        .setTimestamp();

      // Si es un nuevo milestone de streak, agregar mensaje especial
      if (newStreak === 7 || newStreak === 14 || newStreak === 30 || newStreak === 90) {
        embed.addFields({
          name: `${EMOJIS.TROPHY} ¡Milestone Alcanzado!`,
          value: `${EMOJIS.FIRE} Has alcanzado una racha de **${newStreak} días**. ¡Sigue así, guerrero!`,
          inline: false
        });
      }

      await interaction.reply({ embeds: [embed] });
      console.log(`${EMOJIS.DAILY} ${interaction.user.tag} reclamó recompensa diaria: +${totalKoku} koku (streak: ${newStreak})`);
    }

    // /balance o /bal - Mostrar balance
    else if (commandName === 'balance' || commandName === 'bal') {
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;

      const userData = dataManager.getUser(userId, guildId);

      // Calcular tiempo hasta próxima recompensa diaria
      let nextDailyInfo = 'Disponible ahora';
      if (userData.lastDailyClaim) {
        const timeSinceLastClaim = Date.now() - userData.lastDailyClaim;
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (timeSinceLastClaim < twentyFourHours) {
          const timeLeft = twentyFourHours - timeSinceLastClaim;
          const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
          const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

          if (hoursLeft > 0) {
            nextDailyInfo = `En ${hoursLeft}h ${minutesLeft}m`;
          } else {
            nextDailyInfo = `En ${minutesLeft}m`;
          }
        }
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.KOKU)
        .setTitle(`${EMOJIS.BANK} Balance de ${interaction.member?.displayName || interaction.user.username}`)
        .setDescription(`Tu riqueza en **${interaction.guild.name}**`)
        .addFields(
          {
            name: `${EMOJIS.KOKU} Koku`,
            value: `**${userData.koku || 0}** koku`,
            inline: true
          },
          {
            name: `${EMOJIS.HONOR} Honor`,
            value: `**${userData.honor}** puntos`,
            inline: true
          },
          {
            name: `${getRankEmoji(userData.rank)} Rango`,
            value: `**${userData.rank}**`,
            inline: true
          },
          {
            name: `${EMOJIS.FIRE} Racha Diaria`,
            value: `**${userData.dailyStreak || 0}** día${userData.dailyStreak > 1 ? 's' : ''}`,
            inline: true
          },
          {
            name: `${EMOJIS.CALENDAR} Próximo Daily`,
            value: nextDailyInfo,
            inline: true
          },
          {
            name: '\u200B',
            value: '\u200B',
            inline: true
          }
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      console.log(`${EMOJIS.BANK} ${interaction.user.tag} consultó su balance (${userData.koku} koku, ${userData.honor} honor)`);
    }

    // /pay o /pagar - Transferir koku
    else if (commandName === 'pay' || commandName === 'pagar') {
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;
      const targetUser = interaction.options.getUser('usuario');
      const amount = interaction.options.getInteger('cantidad');

      // Validaciones
      if (targetUser.id === userId) {
        return interaction.reply({
          content: MESSAGES.ECONOMY.CANNOT_PAY_SELF,
          flags: MessageFlags.Ephemeral
        });
      }

      if (targetUser.bot) {
        return interaction.reply({
          content: `${EMOJIS.ERROR} No puedes transferir koku a un bot, guerrero.`,
          flags: MessageFlags.Ephemeral
        });
      }

      if (amount < 10 || amount > 10000) {
        return interaction.reply({
          content: MESSAGES.ECONOMY.INVALID_AMOUNT,
          flags: MessageFlags.Ephemeral
        });
      }

      // Obtener datos de ambos usuarios
      const senderData = dataManager.getUser(userId, guildId);
      const recipientData = dataManager.getUser(targetUser.id, guildId);

      // Verificar saldo suficiente
      if ((senderData.koku || 0) < amount) {
        return interaction.reply({
          content: MESSAGES.ECONOMY.INSUFFICIENT_KOKU(amount, senderData.koku || 0),
          flags: MessageFlags.Ephemeral
        });
      }

      // Crear botones de confirmación
      const confirmButton = new ButtonBuilder()
        .setCustomId('confirm_payment')
        .setLabel('✅ Confirmar')
        .setStyle(ButtonStyle.Success);

      const cancelButton = new ButtonBuilder()
        .setCustomId('cancel_payment')
        .setLabel('❌ Cancelar')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

      // Obtener displayNames
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      const targetDisplayName = targetMember?.displayName || targetUser.username;
      const senderDisplayName = interaction.member?.displayName || interaction.user.username;

      await interaction.reply({
        content: `${EMOJIS.WARNING} ¿Estás seguro de transferir **${amount} koku** a **${targetDisplayName}**?`,
        components: [row],
        flags: MessageFlags.Ephemeral
      });

      // Esperar respuesta del botón
      const filter = i => (i.customId === 'confirm_payment' || i.customId === 'cancel_payment') && i.user.id === userId;

      try {
        const replyMessage = await interaction.fetchReply();
        const buttonInteraction = await replyMessage.awaitMessageComponent({ filter, time: 30000 });

        if (buttonInteraction.customId === 'cancel_payment') {
          await buttonInteraction.update({
            content: MESSAGES.GENERIC.CANCELLED,
            components: []
          });
          return;
        }

        // Confirmar transferencia
        senderData.koku = (senderData.koku || 0) - amount;
        recipientData.koku = (recipientData.koku || 0) + amount;
        dataManager.dataModified.users = true;

        await buttonInteraction.update({
          content: MESSAGES.ECONOMY.PAYMENT_SUCCESS(amount, targetDisplayName),
          components: []
        });

        // Enviar notificación al receptor (intentar DM, sino en el canal)
        try {
          await targetUser.send(`${MESSAGES.ECONOMY.PAYMENT_RECEIVED(amount, senderDisplayName)}\n${EMOJIS.INFO} En el servidor: **${interaction.guild.name}**`);
        } catch (error) {
          // Si no se puede enviar DM, enviar en el canal
          await interaction.followUp({
            content: `${targetUser}, ${MESSAGES.ECONOMY.PAYMENT_RECEIVED(amount, senderDisplayName)}`,
          });
        }

        console.log(`${EMOJIS.PAYMENT} ${interaction.user.tag} transfirió ${amount} koku a ${targetUser.tag}`);

      } catch (error) {
        if (error.message && (error.message.includes('time') || error.message.includes('expired'))) {
          await interaction.editReply({
            content: MESSAGES.GENERIC.TIMEOUT_PAYMENT(30),
            components: []
          });
        } else {
          await interaction.editReply({
            content: `❌ Ocurrió un error al procesar la transferencia: ${error.message || 'Error desconocido'}. Por favor, intenta de nuevo.`,
            components: []
          });
        }
      }
    }

    // /leaderboard o /lb - Ranking con pestañas
    else if (commandName === 'leaderboard' || commandName === 'lb') {
      const guildId = interaction.guild.id;

      await interaction.deferReply();

      // Obtener todos los usuarios del servidor (excluyendo el bot)
      const guildUsers = dataManager.getGuildUsers(guildId).filter(u => u.userId !== client.user.id);

      if (guildUsers.length === 0) {
        return interaction.editReply(`${EMOJIS.INFO} Aún no hay guerreros registrados en el dojo. ¡Usa comandos para ganar honor!`);
      }

      // Crear botones para cambiar entre rankings
      const honorButton = new ButtonBuilder()
        .setCustomId('lb_honor')
        .setLabel('Honor')
        .setEmoji(EMOJIS.TROPHY)
        .setStyle(ButtonStyle.Primary);

      const kokuButton = new ButtonBuilder()
        .setCustomId('lb_koku')
        .setLabel('Koku')
        .setEmoji(EMOJIS.KOKU)
        .setStyle(ButtonStyle.Success);

      const streakButton = new ButtonBuilder()
        .setCustomId('lb_streak')
        .setLabel('Rachas')
        .setEmoji(EMOJIS.FIRE)
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(honorButton, kokuButton, streakButton);

      // Función para generar embed de ranking
      const generateLeaderboardEmbed = async (type) => {
        let sortedUsers, title, emoji, valueKey;

        if (type === 'honor') {
          sortedUsers = guildUsers.sort((a, b) => b.honor - a.honor);
          title = MESSAGES.ECONOMY.LEADERBOARD_HONOR;
          emoji = EMOJIS.HONOR;
          valueKey = 'honor';
        } else if (type === 'koku') {
          sortedUsers = guildUsers.sort((a, b) => (b.koku || 0) - (a.koku || 0));
          title = MESSAGES.ECONOMY.LEADERBOARD_KOKU;
          emoji = EMOJIS.KOKU;
          valueKey = 'koku';
        } else if (type === 'streak') {
          sortedUsers = guildUsers.sort((a, b) => (b.dailyStreak || 0) - (a.dailyStreak || 0));
          title = MESSAGES.ECONOMY.LEADERBOARD_STREAK;
          emoji = EMOJIS.FIRE;
          valueKey = 'dailyStreak';
        }

        const top10 = sortedUsers.slice(0, CONSTANTS.LEADERBOARDS.TOP_DISPLAY_COUNT);
        const userIndex = sortedUsers.findIndex(u => u.userId === interaction.user.id);
        const userPosition = userIndex >= 0 ? userIndex + 1 : null;
        const userValue = userIndex >= 0 ? (sortedUsers[userIndex][valueKey] || 0) : 0;

        // Obtener displayNames del servidor (nombres modificados en el canal)
        const userIds = top10.map(u => u.userId);
        const displayNameMap = await fetchDisplayNamesBatch(interaction.guild, userIds);

        let description = '';

        for (let i = 0; i < top10.length; i++) {
          const user = top10[i];
          const position = i + 1;

          let positionEmoji = '';
          if (position === 1) positionEmoji = EMOJIS.FIRST;
          else if (position === 2) positionEmoji = EMOJIS.SECOND;
          else if (position === 3) positionEmoji = EMOJIS.THIRD;
          else positionEmoji = `\`${position}.\``;

          const rankEmoji = getRankEmoji(user.rank);

          // Obtener displayName del servidor (nombre modificado en el canal)
          const userName = displayNameMap.get(user.userId) || 'Usuario Desconocido';

          const isCurrentUser = user.userId === interaction.user.id;
          const highlight = isCurrentUser ? '**➤ ' : '';
          const highlightEnd = isCurrentUser ? '**' : '';

          const value = user[valueKey] || 0;
          const valueLabel = type === 'honor' ? 'honor' : type === 'koku' ? 'koku' : 'días';

          description += `${positionEmoji} ${highlight}${rankEmoji} ${userName} - ${value} ${valueLabel}${highlightEnd}\n`;
        }

        const embed = new EmbedBuilder()
          .setColor(type === 'honor' ? COLORS.GOLD : type === 'koku' ? COLORS.KOKU : COLORS.ERROR)
          .setTitle(`${title} - ${interaction.guild.name}`)
          .setDescription(description)
          .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
          .setTimestamp();

        if (userPosition !== null && userPosition > 10) {
          embed.addFields({
            name: `${EMOJIS.INFO} Tu Posición`,
            value: `**#${userPosition}** - ${userValue} ${type === 'honor' ? 'honor' : type === 'koku' ? 'koku' : 'días'}`,
            inline: false
          });
        } else if (userPosition === null) {
          embed.addFields({
            name: `${EMOJIS.INFO} Tu Posición`,
            value: 'No registrado - ¡Usa comandos para ganar!',
            inline: false
          });
        }

        return embed;
      };

      // Mostrar ranking de honor por defecto
      const initialEmbed = await generateLeaderboardEmbed('honor');
      const response = await interaction.editReply({
        embeds: [initialEmbed],
        components: [row]
      });

      // Collector para los botones
      const collector = response.createMessageComponentCollector({ time: 120000 }); // 2 minutos

      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          const ownerDisplayName = interaction.member?.displayName || interaction.user.username;
          return i.reply({ content: `${EMOJIS.WARNING} Solo ${ownerDisplayName} puede usar estos botones.`, flags: MessageFlags.Ephemeral });
        }

        let type = 'honor';
        if (i.customId === 'lb_koku') type = 'koku';
        else if (i.customId === 'lb_streak') type = 'streak';

        const newEmbed = await generateLeaderboardEmbed(type);
        await i.update({ embeds: [newEmbed], components: [row] });

        console.log(`${EMOJIS.CHART} ${i.user.tag} cambió el leaderboard a: ${type}`);
      });

      collector.on('end', async () => {
        try {
          // Deshabilitar botones cuando expire el collector
          const disabledRow = new ActionRowBuilder().addComponents(
            honorButton.setDisabled(true),
            kokuButton.setDisabled(true),
            streakButton.setDisabled(true)
          );
          await interaction.editReply({ components: [disabledRow] });
        } catch (error) {
          // Ignorar errores si el mensaje fue eliminado
        }
      });

      console.log(`${EMOJIS.CHART} ${interaction.user.tag} consultó el leaderboard`);
    }

    // FASE 5: SISTEMA DE CLANES
    // /clan crear - Crear un nuevo clan
    else if (commandName === 'clan') {
      const subcommand = interaction.options.getSubcommand();
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;

      // /clan crear
      if (subcommand === 'crear') {
        const clanName = interaction.options.getString('nombre').trim();
        const clanTag = interaction.options.getString('tag').trim().toUpperCase();

        // Validar nombre
        if (clanName.length < 3 || clanName.length > 30) {
          return interaction.reply({ content: MESSAGES.CLAN.INVALID_CLAN_NAME, flags: MessageFlags.Ephemeral });
        }

        // Validar tag (solo letras y números, 2-5 caracteres)
        if (!/^[A-Z0-9]{2,5}$/.test(clanTag)) {
          return interaction.reply({ content: MESSAGES.CLAN.INVALID_CLAN_TAG, flags: MessageFlags.Ephemeral });
        }

        // Verificar si el usuario puede crear un clan
        const canCreate = dataManager.canCreateClan(userId, guildId);
        if (!canCreate.canCreate) {
          return interaction.reply({ content: canCreate.reason, flags: MessageFlags.Ephemeral });
        }

        // Verificar si el nombre o tag ya existen
        if (dataManager.clanNameOrTagExists(guildId, clanName, clanTag)) {
          return interaction.reply({ content: MESSAGES.CLAN.CLAN_NAME_EXISTS, flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        // Crear el clan
        const clan = dataManager.createClan(clanName, clanTag, userId, guildId);

        // Deducir el costo de 5000 koku
        const user = dataManager.getUser(userId, guildId);
        user.koku -= 5000;
        user.clanId = clan.clanId;

        // Actualizar stats del clan
        dataManager.updateClanStats(clan.clanId);

        // Guardar datos
        await dataManager.saveUsers();
        await dataManager.saveClans();

        // Crear embed de confirmación
        const clanLevel = dataManager.getClanLevel(clan.totalHonor);
        const embed = new EmbedBuilder()
          .setColor(clanLevel.color)
          .setTitle(`${EMOJIS.CASTLE} Clan Fundado`)
          .setDescription(MESSAGES.CLAN.CLAN_CREATED_DETAILS(clanName, clanTag, 5000))
          .addFields(
            { name: `${EMOJIS.CLAN_TAG} Tag`, value: `[${clanTag}]`, inline: true },
            { name: `${EMOJIS.CLAN_LEVEL} Nivel`, value: `${clanLevel.level} - ${clanLevel.name}`, inline: true },
            { name: `${EMOJIS.MEMBERS} Miembros`, value: `1/${clanLevel.maxMembers}`, inline: true },
            { name: `${EMOJIS.HONOR} Honor Total`, value: `${clan.totalHonor.toLocaleString()} puntos`, inline: true },
            { name: `${EMOJIS.KOKU} Tu Balance`, value: `${user.koku.toLocaleString()} koku`, inline: true }
          )
          .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        console.log(`${EMOJIS.CLAN} ${interaction.user.tag} creó el clan "${clanName}" [${clanTag}]`);
      }

      // /clan info
      else if (subcommand === 'info') {
        const clanNameInput = interaction.options.getString('nombre');
        let clan;

        if (clanNameInput) {
          // Buscar clan por nombre o tag
          clan = dataManager.findClanByNameOrTag(guildId, clanNameInput);
          if (!clan) {
            return interaction.reply({ content: MESSAGES.CLAN.CLAN_NOT_FOUND, flags: MessageFlags.Ephemeral });
          }
        } else {
          // Mostrar clan del usuario
          const user = dataManager.getUser(userId, guildId);
          if (!user.clanId) {
            return interaction.reply({ content: MESSAGES.CLAN.NOT_IN_CLAN, flags: MessageFlags.Ephemeral });
          }
          clan = dataManager.getClan(user.clanId);
        }

        await interaction.deferReply();

        // Obtener info del clan
        const clanLevel = dataManager.getClanLevel(clan.totalHonor);
        const leaderMember = await interaction.guild.members.fetch(clan.leaderId).catch(() => null);
        const leaderName = leaderMember ? (leaderMember.displayName || leaderMember.user.username) : 'Usuario desconocido';
        const leaderUser = dataManager.getUser(clan.leaderId, guildId);
        const leaderRankEmoji = EMOJIS[leaderUser.rank.toUpperCase()] || EMOJIS.RONIN;

        // Crear lista de miembros con rangos
        let membersList = '';
        const memberPromises = clan.members.slice(0, 10).map(async (memberId) => {
          const member = await interaction.guild.members.fetch(memberId).catch(() => null);
          const memberUser = dataManager.getUser(memberId, guildId);
          const rankEmoji = EMOJIS[memberUser.rank.toUpperCase()] || EMOJIS.RONIN;
          const isLeader = memberId === clan.leaderId;
          const leaderBadge = isLeader ? `${EMOJIS.LEADER} ` : '';
          const memberDisplayName = member ? (member.displayName || member.user.username) : 'Usuario desconocido';
          return `${leaderBadge}${rankEmoji} ${memberDisplayName} - ${memberUser.honor.toLocaleString()} honor`;
        });

        const membersData = await Promise.all(memberPromises);
        membersList = membersData.join('\n');

        if (clan.members.length > 10) {
          membersList += `\n... y ${clan.members.length - 10} miembros más`;
        }

        // Crear embed
        const createdDate = new Date(clan.createdAt).toLocaleDateString('es-ES');
        const progressToNext = clanLevel.nextLevelHonor
          ? `${clan.totalHonor.toLocaleString()}/${clanLevel.nextLevelHonor.toLocaleString()} (${Math.floor(clan.totalHonor / clanLevel.nextLevelHonor * 100)}%)`
          : 'Nivel Máximo';

        const embed = new EmbedBuilder()
          .setColor(clanLevel.color)
          .setTitle(`${EMOJIS.CLAN} ${clan.name} [${clan.tag}]`)
          .setDescription(`${EMOJIS.CLAN_LEVEL} **Nivel ${clanLevel.level}** - ${clanLevel.name}`)
          .addFields(
            { name: `${EMOJIS.LEADER} Líder`, value: `${leaderRankEmoji} ${leaderName}`, inline: true },
            { name: `${EMOJIS.MEMBERS} Miembros`, value: `${clan.members.length}/${clanLevel.maxMembers}`, inline: true },
            { name: `${EMOJIS.HONOR} Honor Total`, value: `${clan.totalHonor.toLocaleString()} puntos`, inline: true },
            { name: `${EMOJIS.CALENDAR} Fundado`, value: createdDate, inline: true },
            { name: `${EMOJIS.CHART} Progreso`, value: progressToNext, inline: true },
            { name: `\u200b`, value: `\u200b`, inline: true },
            { name: `${EMOJIS.MEMBERS} Miembros del Clan`, value: membersList || 'Sin miembros', inline: false }
          )
          .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        console.log(`${EMOJIS.CLAN_INFO} ${interaction.user.tag} consultó info del clan "${clan.name}"`);
      }

      // /clan unirse
      else if (subcommand === 'unirse') {
        const clanNameInput = interaction.options.getString('nombre');
        const user = dataManager.getUser(userId, guildId);

        // Verificar si ya está en un clan
        if (user.clanId) {
          return interaction.reply({ content: MESSAGES.CLAN.ALREADY_IN_CLAN, flags: MessageFlags.Ephemeral });
        }

        // Buscar el clan
        const clan = dataManager.findClanByNameOrTag(guildId, clanNameInput);
        if (!clan) {
          return interaction.reply({ content: MESSAGES.CLAN.CLAN_NOT_FOUND, flags: MessageFlags.Ephemeral });
        }

        // Verificar si el clan está lleno
        const clanLevel = dataManager.getClanLevel(clan.totalHonor);
        if (clan.members.length >= clanLevel.maxMembers) {
          return interaction.reply({ content: MESSAGES.CLAN.CLAN_FULL(clanLevel.maxMembers), flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        // Añadir al usuario al clan
        user.clanId = clan.clanId;
        dataManager.addClanMember(clan.clanId, userId);
        dataManager.updateClanStats(clan.clanId);

        // Guardar datos
        await dataManager.saveUsers();
        await dataManager.saveClans();

        await interaction.editReply({ content: MESSAGES.CLAN.JOINED(clan.name, clan.tag) });
        console.log(`${EMOJIS.CLAN_JOIN} ${interaction.user.tag} se unió al clan "${clan.name}"`);

        // Notificar al líder
        try {
          const leader = await interaction.guild.members.fetch(clan.leaderId);
          const memberDisplayName = interaction.member?.displayName || interaction.user.username;
          await leader.send(`${MESSAGES.CLAN.MEMBER_JOINED(memberDisplayName)}\n${EMOJIS.CLAN} Clan: **${clan.name}**`);
        } catch (error) {
          // Ignorar si no se puede enviar DM
        }
      }

      // /clan salir
      else if (subcommand === 'salir') {
        const user = dataManager.getUser(userId, guildId);

        // Verificar si está en un clan
        if (!user.clanId) {
          return interaction.reply({ content: MESSAGES.CLAN.NOT_IN_CLAN, flags: MessageFlags.Ephemeral });
        }

        const clan = dataManager.getClan(user.clanId);
        const isLeader = clan.leaderId === userId;
        const isOnlyMember = clan.members.length === 1;

        // Si es líder y hay otros miembros, pedir confirmación
        if (isLeader && !isOnlyMember) {
          const confirmButton = new ButtonBuilder()
            .setCustomId('confirm_leave_clan')
            .setLabel('Confirmar Salida')
            .setStyle(ButtonStyle.Danger);

          const cancelButton = new ButtonBuilder()
            .setCustomId('cancel_leave_clan')
            .setLabel('Cancelar')
            .setStyle(ButtonStyle.Secondary);

          const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

          await interaction.reply({
            content: MESSAGES.CLAN.CONFIRM_LEAVE_LEADER,
            components: [row],
            flags: MessageFlags.Ephemeral
          });

          // Collector para botones
          const collector = interaction.channel.createMessageComponentCollector({
            filter: (i) => i.user.id === userId,
            time: 30000
          });

          collector.on('collect', async (i) => {
            if (i.customId === 'confirm_leave_clan') {
              // Transferir liderazgo al miembro con más honor
              let newLeader = null;
              let maxHonor = -1;

              for (const memberId of clan.members) {
                if (memberId === userId) continue;
                const memberUser = dataManager.getUser(memberId, guildId);
                if (memberUser.honor > maxHonor) {
                  maxHonor = memberUser.honor;
                  newLeader = memberId;
                }
              }

              if (newLeader) {
                dataManager.transferClanLeadership(clan.clanId, newLeader);
                const newLeaderMember = await interaction.guild.members.fetch(newLeader).catch(() => null);

                // Notificar al nuevo líder
                try {
                  const memberDisplayName = interaction.member?.displayName || interaction.user.username;
                  await newLeaderMember.send(MESSAGES.CLAN.LEADERSHIP_TRANSFERRED(memberDisplayName));
                } catch (error) {
                  // Ignorar
                }
              }

              // Remover del clan
              user.clanId = null;
              dataManager.removeClanMember(clan.clanId, userId);
              dataManager.updateClanStats(clan.clanId);
              await dataManager.saveUsers();
              await dataManager.saveClans();

              await i.update({ content: MESSAGES.CLAN.LEFT(clan.name), components: [] });
              console.log(`${EMOJIS.CLAN_LEAVE} ${interaction.user.tag} salió del clan "${clan.name}" (liderazgo transferido)`);
            } else if (i.customId === 'cancel_leave_clan') {
              await i.update({ content: MESSAGES.GENERIC.CANCELLED, components: [] });
            }
          });

          collector.on('end', async (collected) => {
            if (collected.size === 0) {
              await interaction.editReply({ content: MESSAGES.GENERIC.TIMEOUT, components: [] });
            }
          });
        } else if (isOnlyMember) {
          // Disolver el clan
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });

          dataManager.disbandClan(clan.clanId);
          await dataManager.saveUsers();
          await dataManager.saveClans();

          await interaction.editReply({ content: MESSAGES.CLAN.DISBANDED(clan.name) });
          console.log(`${EMOJIS.WARNING} ${interaction.user.tag} disolvió el clan "${clan.name}"`);
        } else {
          // Miembro normal sale del clan
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });

          user.clanId = null;
          dataManager.removeClanMember(clan.clanId, userId);
          dataManager.updateClanStats(clan.clanId);
          await dataManager.saveUsers();
          await dataManager.saveClans();

          await interaction.editReply({ content: MESSAGES.CLAN.LEFT(clan.name) });
          console.log(`${EMOJIS.CLAN_LEAVE} ${interaction.user.tag} salió del clan "${clan.name}"`);

          // Notificar al líder
          try {
            const leader = await interaction.guild.members.fetch(clan.leaderId);
            const memberDisplayName = interaction.member?.displayName || interaction.user.username;
            await leader.send(`${MESSAGES.CLAN.MEMBER_LEFT(memberDisplayName)}\n${EMOJIS.CLAN} Clan: **${clan.name}**`);
          } catch (error) {
            // Ignorar
          }
        }
      }

      // /clan miembros
      else if (subcommand === 'miembros') {
        const user = dataManager.getUser(userId, guildId);

        if (!user.clanId) {
          return interaction.reply({ content: MESSAGES.CLAN.NOT_IN_CLAN, flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        const clan = dataManager.getClan(user.clanId);
        const clanLevel = dataManager.getClanLevel(clan.totalHonor);

        // Obtener todos los miembros con sus datos
        const membersData = [];
        for (const memberId of clan.members) {
          const member = await interaction.guild.members.fetch(memberId).catch(() => null);
          const memberUser = dataManager.getUser(memberId, guildId);
          const rankEmoji = EMOJIS[memberUser.rank.toUpperCase()] || EMOJIS.RONIN;
          const isLeader = memberId === clan.leaderId;

          membersData.push({
            id: memberId,
            name: member ? (member.displayName || member.user.username) : 'Usuario desconocido',
            honor: memberUser.honor,
            koku: memberUser.koku,
            rank: memberUser.rank,
            rankEmoji,
            isLeader,
            joinDate: memberUser.createdAt
          });
        }

        // Ordenar por honor (mayor a menor)
        membersData.sort((a, b) => b.honor - a.honor);

        // Crear lista de miembros
        let membersList = '';
        membersData.forEach((member, index) => {
          const leaderBadge = member.isLeader ? `${EMOJIS.LEADER} ` : '';
          const position = index + 1;
          membersList += `**${position}.** ${leaderBadge}${member.rankEmoji} ${member.name}\n`;
          membersList += `   ${EMOJIS.HONOR} ${member.honor.toLocaleString()} honor | ${EMOJIS.KOKU} ${member.koku.toLocaleString()} koku\n\n`;
        });

        const embed = new EmbedBuilder()
          .setColor(clanLevel.color)
          .setTitle(`${EMOJIS.MEMBERS} Miembros de ${clan.name} [${clan.tag}]`)
          .setDescription(`Total: **${clan.members.length}/${clanLevel.maxMembers}** miembros\n\n${membersList}`)
          .setFooter({ text: `${MESSAGES.FOOTER.DEFAULT} | Ordenado por honor` })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        console.log(`${EMOJIS.MEMBERS} ${interaction.user.tag} consultó miembros del clan "${clan.name}"`);
      }

      // /clan top
      else if (subcommand === 'top') {
        await interaction.deferReply();

        const allClans = dataManager.getGuildClans(guildId);

        if (allClans.length === 0) {
          return interaction.editReply({ content: `${EMOJIS.INFO} No hay clanes en este servidor todavía.` });
        }

        // Ordenar por honor total (mayor a menor)
        allClans.sort((a, b) => b.totalHonor - a.totalHonor);

        // Top 10 clanes
        const topClans = allClans.slice(0, CONSTANTS.LEADERBOARDS.TOP_DISPLAY_COUNT);
        let rankingText = '';

        for (let i = 0; i < topClans.length; i++) {
          const clan = topClans[i];
          const clanLevel = dataManager.getClanLevel(clan.totalHonor);
          const medal = i === 0 ? EMOJIS.FIRST : i === 1 ? EMOJIS.SECOND : i === 2 ? EMOJIS.THIRD : `**${i + 1}.**`;
          const leaderMember = await interaction.guild.members.fetch(clan.leaderId).catch(() => null);
          const leaderName = leaderMember ? (leaderMember.displayName || leaderMember.user.username) : 'Desconocido';

          rankingText += `${medal} **[${clan.tag}] ${clan.name}**\n`;
          rankingText += `   ${EMOJIS.CLAN_LEVEL} Nivel ${clanLevel.level} | ${EMOJIS.HONOR} ${clan.totalHonor.toLocaleString()} honor\n`;
          rankingText += `   ${EMOJIS.LEADER} ${leaderName} | ${EMOJIS.MEMBERS} ${clan.members.length}/${clanLevel.maxMembers} miembros\n\n`;
        }

        // Crear botones para cambiar tipo de ranking
        const honorButton = new ButtonBuilder()
          .setCustomId('clan_top_honor')
          .setLabel('Honor')
          .setStyle(ButtonStyle.Primary)
          .setEmoji(EMOJIS.HONOR);

        const membersButton = new ButtonBuilder()
          .setCustomId('clan_top_members')
          .setLabel('Miembros')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(EMOJIS.MEMBERS);

        const levelButton = new ButtonBuilder()
          .setCustomId('clan_top_level')
          .setLabel('Nivel')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(EMOJIS.CLAN_LEVEL);

        const row = new ActionRowBuilder().addComponents(honorButton, membersButton, levelButton);

        const embed = new EmbedBuilder()
          .setColor(COLORS.PRIMARY)
          .setTitle(`${EMOJIS.TROPHY} Top Clanes del Servidor`)
          .setDescription(`**Ordenado por:** ${EMOJIS.HONOR} Honor Total\n\n${rankingText}`)
          .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
          .setTimestamp();

        const response = await interaction.editReply({ embeds: [embed], components: [row] });

        // Collector para botones
        const collector = response.createMessageComponentCollector({ time: 120000 });

        collector.on('collect', async (i) => {
          if (i.user.id !== interaction.user.id) {
            const ownerDisplayName = interaction.member?.displayName || interaction.user.username;
          return i.reply({ content: `${EMOJIS.WARNING} Solo ${ownerDisplayName} puede usar estos botones.`, flags: MessageFlags.Ephemeral });
          }

          let sortedClans = [...allClans];
          let sortType = 'Honor Total';
          let sortEmoji = EMOJIS.HONOR;

          if (i.customId === 'clan_top_members') {
            sortedClans.sort((a, b) => b.members.length - a.members.length);
            sortType = 'Número de Miembros';
            sortEmoji = EMOJIS.MEMBERS;
          } else if (i.customId === 'clan_top_level') {
            sortedClans.sort((a, b) => b.level - a.level);
            sortType = 'Nivel';
            sortEmoji = EMOJIS.CLAN_LEVEL;
          } else {
            sortedClans.sort((a, b) => b.totalHonor - a.totalHonor);
          }

          const newTopClans = sortedClans.slice(0, CONSTANTS.LEADERBOARDS.TOP_DISPLAY_COUNT);
          let newRankingText = '';

          for (let idx = 0; idx < newTopClans.length; idx++) {
            const clan = newTopClans[idx];
            const clanLevel = dataManager.getClanLevel(clan.totalHonor);
            const medal = idx === 0 ? EMOJIS.FIRST : idx === 1 ? EMOJIS.SECOND : idx === 2 ? EMOJIS.THIRD : `**${idx + 1}.**`;
            const leaderMember = await interaction.guild.members.fetch(clan.leaderId).catch(() => null);
            const leaderName = leaderMember ? (leaderMember.displayName || leaderMember.user.username) : 'Desconocido';

            newRankingText += `${medal} **[${clan.tag}] ${clan.name}**\n`;
            newRankingText += `   ${EMOJIS.CLAN_LEVEL} Nivel ${clanLevel.level} | ${EMOJIS.HONOR} ${clan.totalHonor.toLocaleString()} honor\n`;
            newRankingText += `   ${EMOJIS.LEADER} ${leaderName} | ${EMOJIS.MEMBERS} ${clan.members.length}/${clanLevel.maxMembers} miembros\n\n`;
          }

          const newEmbed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle(`${EMOJIS.TROPHY} Top Clanes del Servidor`)
            .setDescription(`**Ordenado por:** ${sortEmoji} ${sortType}\n\n${newRankingText}`)
            .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
            .setTimestamp();

          await i.update({ embeds: [newEmbed], components: [row] });
        });

        collector.on('end', async () => {
          try {
            const disabledRow = new ActionRowBuilder().addComponents(
              honorButton.setDisabled(true),
              membersButton.setDisabled(true),
              levelButton.setDisabled(true)
            );
            await interaction.editReply({ components: [disabledRow] });
          } catch (error) {
            // Ignorar
          }
        });

        console.log(`${EMOJIS.TROPHY} ${interaction.user.tag} consultó el top de clanes`);
      }

      // /clan invitar
      else if (subcommand === 'invitar') {
        const targetUser = interaction.options.getUser('usuario');
        const user = dataManager.getUser(userId, guildId);

        // Verificar que el usuario esté en un clan
        if (!user.clanId) {
          return interaction.reply({ content: MESSAGES.CLAN.NOT_IN_CLAN, flags: MessageFlags.Ephemeral });
        }

        const clan = dataManager.getClan(user.clanId);

        // Verificar que sea el líder
        if (clan.leaderId !== userId) {
          return interaction.reply({ content: MESSAGES.CLAN.ONLY_LEADER, flags: MessageFlags.Ephemeral });
        }

        // Verificar que no sea un bot
        if (targetUser.bot) {
          return interaction.reply({ content: MESSAGES.ERRORS.INVALID_USER, flags: MessageFlags.Ephemeral });
        }

        // Verificar que el usuario invitado no esté en otro clan
        const targetUserData = dataManager.getUser(targetUser.id, guildId);
        if (targetUserData.clanId) {
          return interaction.reply({ content: `${EMOJIS.WARNING} ${targetUser.tag} ya pertenece a otro clan.`, flags: MessageFlags.Ephemeral });
        }

        // Verificar que el clan no esté lleno
        const clanLevel = dataManager.getClanLevel(clan.totalHonor);
        if (clan.members.length >= clanLevel.maxMembers) {
          return interaction.reply({ content: MESSAGES.CLAN.CLAN_FULL(clanLevel.maxMembers), flags: MessageFlags.Ephemeral });
        }

        // Crear botones de invitación
        const acceptButton = new ButtonBuilder()
          .setCustomId('accept_clan_invite')
          .setLabel('Aceptar')
          .setStyle(ButtonStyle.Success)
          .setEmoji(EMOJIS.SUCCESS);

        const declineButton = new ButtonBuilder()
          .setCustomId('decline_clan_invite')
          .setLabel('Rechazar')
          .setStyle(ButtonStyle.Danger)
          .setEmoji(EMOJIS.CROSS);

        const row = new ActionRowBuilder().addComponents(acceptButton, declineButton);

        const inviteEmbed = new EmbedBuilder()
          .setColor(clanLevel.color)
          .setTitle(`${EMOJIS.CLAN_INVITE} Invitación al Clan`)
          .setDescription(MESSAGES.CLAN.INVITATION_RECEIVED(clan.name, interaction.member?.displayName || interaction.user.username))
          .addFields(
            { name: `${EMOJIS.CLAN_TAG} Tag`, value: `[${clan.tag}]`, inline: true },
            { name: `${EMOJIS.CLAN_LEVEL} Nivel`, value: `${clanLevel.level} - ${clanLevel.name}`, inline: true },
            { name: `${EMOJIS.MEMBERS} Miembros`, value: `${clan.members.length}/${clanLevel.maxMembers}`, inline: true },
            { name: `${EMOJIS.HONOR} Honor Total`, value: `${clan.totalHonor.toLocaleString()} puntos`, inline: true }
          )
          .setFooter({ text: 'Tienes 2 minutos para responder' })
          .setTimestamp();

        await interaction.reply({ content: MESSAGES.CLAN.INVITATION_SENT(targetUser.tag), flags: MessageFlags.Ephemeral });

        // Enviar invitación al usuario
        try {
          const inviteMessage = await targetUser.send({ embeds: [inviteEmbed], components: [row] });

          // Collector para la invitación
          const collector = inviteMessage.createMessageComponentCollector({ time: 120000 });

          collector.on('collect', async (i) => {
            if (i.user.id !== targetUser.id) return;

            if (i.customId === 'accept_clan_invite') {
              // Verificar nuevamente que el clan no esté lleno
              const updatedClanLevel = dataManager.getClanLevel(clan.totalHonor);
              if (clan.members.length >= updatedClanLevel.maxMembers) {
                await i.update({ content: MESSAGES.CLAN.CLAN_FULL(updatedClanLevel.maxMembers), embeds: [], components: [] });
                return;
              }

              // Añadir al usuario al clan
              targetUserData.clanId = clan.clanId;
              dataManager.addClanMember(clan.clanId, targetUser.id);
              dataManager.updateClanStats(clan.clanId);
              await dataManager.saveUsers();
              await dataManager.saveClans();

              await i.update({
                content: MESSAGES.CLAN.JOINED(clan.name, clan.tag),
                embeds: [],
                components: []
              });

              // Notificar al líder
              try {
                const leader = await interaction.guild.members.fetch(clan.leaderId);
                await leader.send(MESSAGES.CLAN.INVITATION_ACCEPTED(targetUser.tag, clan.name));
              } catch (error) {
                // Ignorar
              }

              console.log(`${EMOJIS.CLAN_JOIN} ${targetUser.tag} aceptó invitación al clan "${clan.name}"`);
            } else if (i.customId === 'decline_clan_invite') {
              await i.update({
                content: MESSAGES.CLAN.INVITATION_DECLINED(clan.name),
                embeds: [],
                components: []
              });

              // Notificar al líder
              try {
                const leader = await interaction.guild.members.fetch(clan.leaderId);
                await leader.send(MESSAGES.CLAN.INVITATION_DECLINED(targetUser.tag));
              } catch (error) {
                // Ignorar
              }

              console.log(`${EMOJIS.INFO} ${targetUser.tag} rechazó invitación al clan "${clan.name}"`);
            }
          });

          collector.on('end', async (collected) => {
            if (collected.size === 0) {
              try {
                await inviteMessage.edit({
                  content: MESSAGES.CLAN.INVITATION_EXPIRED,
                  embeds: [],
                  components: []
                });
              } catch (error) {
                // Ignorar
              }
            }
          });
        } catch (error) {
          await interaction.editReply({ content: `${EMOJIS.ERROR} No pude enviar la invitación a ${targetUser.tag}. Asegúrate de que tenga los DM activados.`, flags: MessageFlags.Ephemeral });
        }
      }

      // /clan expulsar
      else if (subcommand === 'expulsar') {
        const targetUser = interaction.options.getUser('usuario');
        const user = dataManager.getUser(userId, guildId);

        // Verificar que el usuario esté en un clan
        if (!user.clanId) {
          return interaction.reply({ content: MESSAGES.CLAN.NOT_IN_CLAN, flags: MessageFlags.Ephemeral });
        }

        const clan = dataManager.getClan(user.clanId);

        // Verificar que sea el líder
        if (clan.leaderId !== userId) {
          return interaction.reply({ content: MESSAGES.CLAN.ONLY_LEADER, flags: MessageFlags.Ephemeral });
        }

        // Verificar que no se esté expulsando a sí mismo
        if (targetUser.id === userId) {
          return interaction.reply({ content: MESSAGES.CLAN.CANNOT_KICK_SELF, flags: MessageFlags.Ephemeral });
        }

        // Verificar que el usuario a expulsar esté en el clan
        if (!clan.members.includes(targetUser.id)) {
          return interaction.reply({ content: `${EMOJIS.WARNING} ${targetUser.tag} no pertenece a tu clan.`, flags: MessageFlags.Ephemeral });
        }

        // Confirmación
        const confirmButton = new ButtonBuilder()
          .setCustomId('confirm_kick')
          .setLabel('Confirmar Expulsión')
          .setStyle(ButtonStyle.Danger);

        const cancelButton = new ButtonBuilder()
          .setCustomId('cancel_kick')
          .setLabel('Cancelar')
          .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

        await interaction.reply({
          content: `${EMOJIS.WARNING} ¿Estás seguro de expulsar a **${targetUser.tag}** del clan?`,
          components: [row],
          flags: MessageFlags.Ephemeral
        });

        // Collector para confirmación
        const collector = interaction.channel.createMessageComponentCollector({
          filter: (i) => i.user.id === userId,
          time: 30000
        });

        collector.on('collect', async (i) => {
          if (i.customId === 'confirm_kick') {
            // Expulsar al usuario
            const targetUserData = dataManager.getUser(targetUser.id, guildId);
            targetUserData.clanId = null;
            dataManager.removeClanMember(clan.clanId, targetUser.id);
            dataManager.updateClanStats(clan.clanId);
            await dataManager.saveUsers();
            await dataManager.saveClans();

            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            const targetDisplayName = targetMember?.displayName || targetUser.username;
            await i.update({ content: MESSAGES.CLAN.MEMBER_KICKED(targetDisplayName), components: [] });

            // Notificar al usuario expulsado
            try {
              await targetUser.send(MESSAGES.CLAN.YOU_WERE_KICKED(clan.name));
            } catch (error) {
              // Ignorar
            }

            console.log(`${EMOJIS.CLAN_KICK} ${interaction.user.tag} expulsó a ${targetUser.tag} del clan "${clan.name}"`);
          } else if (i.customId === 'cancel_kick') {
            await i.update({ content: MESSAGES.GENERIC.CANCELLED, components: [] });
          }
        });

        collector.on('end', async (collected) => {
          if (collected.size === 0) {
            await interaction.editReply({ content: MESSAGES.GENERIC.TIMEOUT, components: [] });
          }
        });
      }
    }

    // ==================== FASE 6: CARACTERÍSTICAS INTERACTIVAS ====================

    // /duelo - Desafiar a otro usuario a un duelo
    else if (commandName === 'duelo') {
      // Verificar si el comando debe ejecutarse en un canal específico de combate
      if (config.combatChannel && config.combatChannel.enabled && config.combatChannel.channelId) {
        if (interaction.channel.id !== config.combatChannel.channelId) {
          const combatChannel = interaction.guild.channels.cache.get(config.combatChannel.channelId);
          const channelName = combatChannel ? combatChannel.name : 'el canal de combate';
          const channelMention = combatChannel ? `<#${config.combatChannel.channelId}>` : 'el canal de combate';
          
          return interaction.reply({
            content: `❌ Los comandos de combate solo pueden usarse en ${channelMention} (**${channelName}**).`,
            flags: MessageFlags.Ephemeral
          });
        }
      }
      
      const opponent = interaction.options.getUser('oponente');
      const bet = interaction.options.getInteger('apuesta') || CONSTANTS.DUELS.MIN_BET;
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;

      // Validaciones básicas
      if (opponent.id === userId) {
        return interaction.reply({ content: MESSAGES.DUEL.CANNOT_DUEL_SELF, flags: MessageFlags.Ephemeral });
      }

      if (opponent.bot) {
        return interaction.reply({ content: MESSAGES.DUEL.CANNOT_DUEL_BOT, flags: MessageFlags.Ephemeral });
      }

      // Validar apuesta
      if (bet < CONSTANTS.DUELS.MIN_BET || bet > CONSTANTS.DUELS.MAX_BET) {
        return interaction.reply({
          content: MESSAGES.DUEL.INVALID_BET(CONSTANTS.DUELS.MIN_BET, CONSTANTS.DUELS.MAX_BET),
          flags: MessageFlags.Ephemeral
        });
      }

      // Verificar cooldown
      if (dataManager.hasCooldown(userId, 'duelo')) {
        const timeLeft = dataManager.getCooldownTime(userId, 'duelo');
        return interaction.reply({ content: MESSAGES.ERRORS.COOLDOWN(timeLeft), flags: MessageFlags.Ephemeral });
      }

      // Verificar honor suficiente del retador
      const userData = dataManager.getUser(userId, guildId);
      if (userData.honor < bet) {
        return interaction.reply({ content: MESSAGES.DUEL.INSUFFICIENT_HONOR(bet), flags: MessageFlags.Ephemeral });
      }

      // Verificar honor suficiente del oponente
      const opponentData = dataManager.getUser(opponent.id, guildId);
      if (opponentData.honor < bet) {
        const opponentMember = await interaction.guild.members.fetch(opponent.id).catch(() => null);
        const opponentDisplayName = opponentMember?.displayName || opponent.username;
        return interaction.reply({ content: MESSAGES.DUEL.OPPONENT_INSUFFICIENT_HONOR(opponentDisplayName), flags: MessageFlags.Ephemeral });
      }

      // Establecer cooldown
      dataManager.setCooldown(userId, 'duelo', CONSTANTS.DUELS.COOLDOWN);

      // Crear botones de aceptar/rechazar para el oponente (mensaje público)
      // Obtener displayNames
      const challengerDisplayName = await fetchDisplayName(interaction.guild, userId);
      const opponentDisplayName = await fetchDisplayName(interaction.guild, opponent.id);

      // Mensaje público (sin botones, solo informativo)
      await interaction.reply({
        content: `${opponent}, ${MESSAGES.DUEL.CHALLENGE_RECEIVED(challengerDisplayName, bet)}`
      });

      // Botones para el oponente (aceptar/rechazar)
      const acceptButton = new ButtonBuilder()
        .setCustomId('accept_duel')
        .setLabel('⚔️ Aceptar')
        .setStyle(ButtonStyle.Success);

      const declineButton = new ButtonBuilder()
        .setCustomId('decline_duel')
        .setLabel('❌ Rechazar')
        .setStyle(ButtonStyle.Danger);

      const opponentRow = new ActionRowBuilder().addComponents(acceptButton, declineButton);

      // Botón para el que invita (cancelar)
      const cancelButton = new ButtonBuilder()
        .setCustomId('cancel_duel')
        .setLabel('🚫 Cancelar')
        .setStyle(ButtonStyle.Secondary);

      const challengerRow = new ActionRowBuilder().addComponents(cancelButton);

      // Mensaje privado para el oponente (con botones de aceptar/rechazar)
      let opponentPrivateMessage = null;
      try {
        opponentPrivateMessage = await opponent.send({
          content: `${EMOJIS.DUEL} **${challengerDisplayName}** te ha desafiado a un duelo de honor.\n${EMOJIS.HONOR} Apuesta: **${bet} puntos de honor**\n\n${EMOJIS.KATANA} ¿Aceptas el desafío?`,
          components: [opponentRow]
        });
      } catch (error) {
        // Si no se puede enviar DM, informar en el canal público
        await interaction.followUp({
          content: `❌ No se pudo enviar un mensaje privado a ${opponent}. Por favor, habilita los mensajes directos para recibir la invitación al duelo.`,
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      // Mensaje privado para el usuario que invita (con botón de cancelar)
      let challengerPrivateMessage = null;
      try {
        challengerPrivateMessage = await interaction.user.send({
          content: `${EMOJIS.DUEL} Has desafiado a **${opponentDisplayName}** a un duelo de honor.\n${EMOJIS.HONOR} Apuesta: **${bet} puntos de honor**\n\nEsperando respuesta del oponente...`,
          components: [challengerRow]
        });
      } catch (error) {
        // Si no se puede enviar DM, continuar de todas formas
        console.warn(`No se pudo enviar DM a ${interaction.user.tag} para el duelo`);
      }

      // Collectors para ambos mensajes privados
      let opponentCollector = null;
      let challengerCollector = null;

      // Collector para el oponente (aceptar/rechazar)
      if (opponentPrivateMessage) {
        opponentCollector = opponentPrivateMessage.createMessageComponentCollector({
          filter: (i) => i.user.id === opponent.id && (i.customId === 'accept_duel' || i.customId === 'decline_duel'),
          time: CONSTANTS.DUELS.INVITE_TIMEOUT * 1000
        });
      }

      // Collector para el que invita (cancelar)
      if (challengerPrivateMessage) {
        challengerCollector = challengerPrivateMessage.createMessageComponentCollector({
          filter: (i) => i.user.id === userId && i.customId === 'cancel_duel',
          time: CONSTANTS.DUELS.INVITE_TIMEOUT * 1000
        });
      }

      // Función para limpiar collectors
      const stopAllCollectors = (reason) => {
        if (opponentCollector) opponentCollector.stop(reason);
        if (challengerCollector) challengerCollector.stop(reason);
      };

      // Manejar cancelación del que invita
      if (challengerCollector) {
        challengerCollector.on('collect', async (i) => {
          try {
            // Obtener displayName actualizado
            const challengerDisplayNameUpdated = await fetchDisplayName(interaction.guild, userId);
            
            await i.update({
              content: `${EMOJIS.INFO} Has cancelado el duelo.`,
              components: []
            });
            
            // Actualizar mensaje público
            await interaction.editReply({
              content: `${EMOJIS.INFO} El duelo fue cancelado por ${challengerDisplayNameUpdated}.`
            });
            
            // Actualizar mensaje privado del oponente si existe
            if (opponentPrivateMessage) {
              try {
                await opponentPrivateMessage.edit({
                  content: `${EMOJIS.INFO} El duelo fue cancelado por ${challengerDisplayNameUpdated}.`,
                  components: []
                });
              } catch (error) {
                // Ignorar si no se puede editar
              }
            }
            
            stopAllCollectors('cancelled');
          } catch (error) {
            if (error.code === 10062 || error.message?.includes('expired') || error.message?.includes('time')) {
              await i.reply({ 
                content: MESSAGES.DUEL.DUEL_EXPIRED(await fetchDisplayName(interaction.guild, opponent.id), 30), 
                flags: MessageFlags.Ephemeral 
              });
            } else {
              await i.reply({ 
                content: `❌ Error al procesar la cancelación: ${error.message || 'Error desconocido'}. El duelo puede haber expirado.`, 
                flags: MessageFlags.Ephemeral 
              });
            }
          }
        });
      }

      // Manejar respuesta del oponente
      if (opponentCollector) {
        opponentCollector.on('collect', async (i) => {
          try {
            if (i.customId === 'decline_duel') {
              // Obtener displayName del oponente que rechazó
              const opponentDisplayNameDeclined = await fetchDisplayName(interaction.guild, opponent.id);
              
              await i.update({ content: MESSAGES.DUEL.DUEL_DECLINED, components: [] });
              
              // Actualizar mensaje público
              await interaction.editReply({
                content: `${EMOJIS.INFO} **${opponentDisplayNameDeclined}** ha rechazado el duelo.`
              });
              
              // Actualizar mensaje privado del que invita si existe
              if (challengerPrivateMessage) {
                try {
                  await challengerPrivateMessage.edit({
                    content: `${EMOJIS.INFO} **${opponentDisplayNameDeclined}** ha rechazado el duelo.`,
                    components: []
                  });
                } catch (error) {
                  // Ignorar si no se puede editar
                }
              }
              
              stopAllCollectors('declined');
            } else if (i.customId === 'accept_duel') {
            // Obtener displayName del oponente que aceptó
            const opponentDisplayNameAccepted = await fetchDisplayName(interaction.guild, opponent.id);
            
            // Actualizar mensaje privado del que invita si existe
            if (challengerPrivateMessage) {
              try {
                await challengerPrivateMessage.edit({
                  content: `${EMOJIS.SUCCESS} **${opponentDisplayNameAccepted}** ha aceptado el duelo. ¡El combate ha comenzado!`,
                  components: []
                });
              } catch (error) {
                // Ignorar si no se puede editar
              }
            }
            
            // Actualizar mensaje público
            await interaction.editReply({
              content: `${EMOJIS.SUCCESS} **${opponentDisplayNameAccepted}** ha aceptado el duelo. ¡El combate ha comenzado!`
            });
            
            // Duelo aceptado - crear botones de selección de arma
            const katanaBtn = new ButtonBuilder()
              .setCustomId('weapon_katana')
              .setLabel(`${CONSTANTS.DUELS.WEAPONS.KATANA.emoji} Katana`)
              .setStyle(ButtonStyle.Primary);

            const wakizashiBtn = new ButtonBuilder()
              .setCustomId('weapon_wakizashi')
              .setLabel(`${CONSTANTS.DUELS.WEAPONS.WAKIZASHI.emoji} Wakizashi`)
              .setStyle(ButtonStyle.Primary);

            const tantoBtn = new ButtonBuilder()
              .setCustomId('weapon_tanto')
              .setLabel(`${CONSTANTS.DUELS.WEAPONS.TANTO.emoji} Tanto`)
              .setStyle(ButtonStyle.Primary);

            const weaponRow = new ActionRowBuilder().addComponents(katanaBtn, wakizashiBtn, tantoBtn);

            await i.update({
              content: `${MESSAGES.DUEL.DUEL_ACCEPTED}\n\n${MESSAGES.DUEL.WEAPON_CHOICE}`,
              components: [weaponRow]
            });

            // Almacenar las elecciones de arma
            const choices = {};

            // Esperar elección de armas (en el mensaje privado del oponente)
            const weaponFilter = (wi) =>
              (wi.user.id === userId || wi.user.id === opponent.id) &&
              wi.customId.startsWith('weapon_');

            const weaponCollector = opponentPrivateMessage.createMessageComponentCollector({
              filter: weaponFilter,
              time: 30000,
              max: 2
            });
            
            // También crear collector en el mensaje privado del que invita si existe
            let challengerWeaponCollector = null;
            if (challengerPrivateMessage) {
              // Enviar botones de arma también al que invita
              try {
                const challengerWeaponRow = new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setCustomId('weapon_katana')
                    .setLabel(`${CONSTANTS.DUELS.WEAPONS.KATANA.emoji} Katana`)
                    .setStyle(ButtonStyle.Primary),
                  new ButtonBuilder()
                    .setCustomId('weapon_wakizashi')
                    .setLabel(`${CONSTANTS.DUELS.WEAPONS.WAKIZASHI.emoji} Wakizashi`)
                    .setStyle(ButtonStyle.Primary),
                  new ButtonBuilder()
                    .setCustomId('weapon_tanto')
                    .setLabel(`${CONSTANTS.DUELS.WEAPONS.TANTO.emoji} Tanto`)
                    .setStyle(ButtonStyle.Primary)
                );
                
                await challengerPrivateMessage.edit({
                  content: `${MESSAGES.DUEL.DUEL_ACCEPTED}\n\n${MESSAGES.DUEL.WEAPON_CHOICE}`,
                  components: [challengerWeaponRow]
                });
                
                challengerWeaponCollector = challengerPrivateMessage.createMessageComponentCollector({
                  filter: weaponFilter,
                  time: 30000,
                  max: 2
                });
              } catch (error) {
                // Ignorar si no se puede editar
              }
            }

            // Manejar elecciones de ambos collectors
            const handleWeaponChoice = async (wi) => {
              // Verificar si ya eligió arma
              if (choices[wi.user.id] !== undefined) {
                return wi.reply({ 
                  content: MESSAGES.DUEL.DUEL_WEAPON_ALREADY_CHOSEN, 
                  flags: MessageFlags.Ephemeral 
                });
              }
              
              const weaponId = wi.customId.replace('weapon_', '').toUpperCase();
              choices[wi.user.id] = weaponId;
              
              // Obtener datos del arma elegida
              const weaponData = CONSTANTS.DUELS.WEAPONS[weaponId];
              
              if (!weaponData) {
                console.error(`Arma no encontrada: ${weaponId}`);
                await wi.reply({ 
                  content: '❌ Error al procesar la elección de arma. Por favor, intenta elegir nuevamente o inicia un nuevo duelo.', 
                  flags: MessageFlags.Ephemeral 
                });
                return;
              }
              
              // Deshabilitar todos los botones en el mensaje donde se hizo clic
              try {
                const disabledWeaponRow = new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setCustomId('weapon_katana')
                    .setLabel(`${CONSTANTS.DUELS.WEAPONS.KATANA.emoji} Katana`)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
                  new ButtonBuilder()
                    .setCustomId('weapon_wakizashi')
                    .setLabel(`${CONSTANTS.DUELS.WEAPONS.WAKIZASHI.emoji} Wakizashi`)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
                  new ButtonBuilder()
                    .setCustomId('weapon_tanto')
                    .setLabel(`${CONSTANTS.DUELS.WEAPONS.TANTO.emoji} Tanto`)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true)
                );
                
                await wi.update({
                  content: `✅ Has elegido ${weaponData.emoji} ${weaponData.name}\n\nEsperando la elección del oponente...`,
                  components: [disabledWeaponRow]
                });
              } catch (error) {
                // Si el error es porque la interacción expiró
                if (error.code === 10062 || error.message?.includes('expired') || error.message?.includes('time')) {
                  return wi.reply({ 
                    content: MESSAGES.DUEL.DUEL_WEAPON_EXPIRED, 
                    flags: MessageFlags.Ephemeral 
                  });
                }
                // Si no se puede actualizar por otro motivo, solo responder
                await wi.reply({ content: `✅ Has elegido ${weaponData.emoji} ${weaponData.name}`, flags: MessageFlags.Ephemeral });
              }
            };

            weaponCollector.on('collect', handleWeaponChoice);
            if (challengerWeaponCollector) {
              challengerWeaponCollector.on('collect', handleWeaponChoice);
            }

            weaponCollector.on('end', async (collected, reason) => {
              if (challengerWeaponCollector) challengerWeaponCollector.stop();
              if (Object.keys(choices).length < 2) {
                // Determinar quién no eligió arma
                const challengerChose = choices[userId] !== undefined;
                const opponentChose = choices[opponent.id] !== undefined;
                let missingPlayer = '';
                
                if (!challengerChose && !opponentChose) {
                  const challengerDisplayName = await fetchDisplayName(interaction.guild, userId);
                  const opponentDisplayName = await fetchDisplayName(interaction.guild, opponent.id);
                  missingPlayer = `${challengerDisplayName} y ${opponentDisplayName}`;
                } else if (!challengerChose) {
                  missingPlayer = await fetchDisplayName(interaction.guild, userId);
                } else {
                  missingPlayer = await fetchDisplayName(interaction.guild, opponent.id);
                }
                
                await interaction.editReply({
                  content: MESSAGES.DUEL.DUEL_WEAPON_TIMEOUT(missingPlayer, 30)
                });
                return;
              }
              processDuelResult();
            });

            if (challengerWeaponCollector) {
              challengerWeaponCollector.on('end', async (collected, reason) => {
                if (Object.keys(choices).length < 2) {
                  // Determinar quién no eligió arma
                  const challengerChose = choices[userId] !== undefined;
                  const opponentChose = choices[opponent.id] !== undefined;
                  let missingPlayer = '';
                  
                  if (!challengerChose && !opponentChose) {
                    const challengerDisplayName = await fetchDisplayName(interaction.guild, userId);
                    const opponentDisplayName = await fetchDisplayName(interaction.guild, opponent.id);
                    missingPlayer = `${challengerDisplayName} y ${opponentDisplayName}`;
                  } else if (!challengerChose) {
                    missingPlayer = await fetchDisplayName(interaction.guild, userId);
                  } else {
                    missingPlayer = await fetchDisplayName(interaction.guild, opponent.id);
                  }
                  
                  await interaction.editReply({
                    content: MESSAGES.DUEL.DUEL_WEAPON_TIMEOUT(missingPlayer, 30)
                  });
                  return;
                }
                processDuelResult();
              });
            }

            const processDuelResult = async () => {
              if (Object.keys(choices).length < 2) return;

            // Determinar ganador
            const challengerWeapon = choices[userId];
            const opponentWeapon = choices[opponent.id];

              const challengerWeaponData = CONSTANTS.DUELS.WEAPONS[challengerWeapon];
              const opponentWeaponData = CONSTANTS.DUELS.WEAPONS[opponentWeapon];

              // Verificar empate
              if (challengerWeapon === opponentWeapon) {
                // Obtener displayNames para el mensaje de empate
                const challengerDisplayNameForDraw = await fetchDisplayName(interaction.guild, userId);
                const opponentDisplayNameForDraw = await fetchDisplayName(interaction.guild, opponent.id);
                
                await interaction.editReply({
                  content: MESSAGES.DUEL.DUEL_DRAW(
                    challengerDisplayNameForDraw,
                    opponentDisplayNameForDraw,
                    `${challengerWeaponData.emoji} ${challengerWeaponData.name}`
                  )
                });
                
                // Mostrar resultado en mensajes privados y eliminarlos
                try {
                  if (opponentPrivateMessage) {
                    await opponentPrivateMessage.edit({
                      content: `${EMOJIS.INFO} **¡Empate!** Ambos eligieron ${challengerWeaponData.emoji} ${challengerWeaponData.name}.\n\nNo hay ganador ni perdedor. El honor permanece intacto.`,
                      components: []
                    });
                    setTimeout(() => opponentPrivateMessage.delete().catch(() => {}), 5000);
                  }
                  if (challengerPrivateMessage) {
                    await challengerPrivateMessage.edit({
                      content: `${EMOJIS.INFO} **¡Empate!** Ambos eligieron ${challengerWeaponData.emoji} ${challengerWeaponData.name}.\n\nNo hay ganador ni perdedor. El honor permanece intacto.`,
                      components: []
                    });
                    setTimeout(() => challengerPrivateMessage.delete().catch(() => {}), 5000);
                  }
                } catch (error) {
                  // Ignorar errores al editar/eliminar
                }
                
                return;
              }

              // Determinar ganador basado en la mecánica
              let winner, loser, winnerWeapon, loserWeapon;

              if (challengerWeaponData.beats === opponentWeapon) {
                winner = interaction.user;
                loser = opponent;
                winnerWeapon = `${challengerWeaponData.emoji} ${challengerWeaponData.name}`;
                loserWeapon = `${opponentWeaponData.emoji} ${opponentWeaponData.name}`;
              } else {
                winner = opponent;
                loser = interaction.user;
                winnerWeapon = `${opponentWeaponData.emoji} ${opponentWeaponData.name}`;
                loserWeapon = `${challengerWeaponData.emoji} ${challengerWeaponData.name}`;
              }

              // Actualizar honor y estadísticas
              const winnerData = dataManager.getUser(winner.id, guildId);
              const loserData = dataManager.getUser(loser.id, guildId);

              const winnerResult = dataManager.addHonor(winner.id, guildId, bet);
              const loserResult = dataManager.addHonor(loser.id, guildId, -bet);

              // Notify winner/loser of rank change if any
              try {
                const wmeta = winnerResult.__lastHonorChange;
                if (wmeta && wmeta.rankChanged) {
                  const wusr = await client.users.fetch(winner.id).catch(() => null);
                  if (wusr) await wusr.send(`${MESSAGES.HONOR.RANK_UP(wmeta.newRank)}\n${MESSAGES.SUCCESS.HONOR_GAINED(wmeta.amount)}`).catch(() => {});
                }
              } catch (e) {}
              try {
                const lmeta = loserResult.__lastHonorChange;
                if (lmeta && lmeta.rankChanged) {
                  const lusr = await client.users.fetch(loser.id).catch(() => null);
                  if (lusr) await lusr.send(`${MESSAGES.HONOR.RANK_DOWN(lmeta.newRank)}`).catch(() => {});
                }
              } catch (e) {}

              // Actualizar estadísticas de duelos
              winnerData.stats.duelsWon = (winnerData.stats.duelsWon || 0) + 1;
              winnerData.stats.duelsTotal = (winnerData.stats.duelsTotal || 0) + 1;
              loserData.stats.duelsLost = (loserData.stats.duelsLost || 0) + 1;
              loserData.stats.duelsTotal = (loserData.stats.duelsTotal || 0) + 1;

              // Actualizar clanes si pertenecen a uno
              if (winnerData.clanId) dataManager.updateClanStats(winnerData.clanId);
              if (loserData.clanId) dataManager.updateClanStats(loserData.clanId);

              dataManager.dataModified.users = true;
              await dataManager.saveUsers();

              // Obtener displayNames para el mensaje de resultado
              const winnerDisplayName = await fetchDisplayName(interaction.guild, winner.id);
              const loserDisplayName = await fetchDisplayName(interaction.guild, loser.id);

              // Mensaje de resultado en el canal público
              await interaction.editReply({
                content: MESSAGES.DUEL.DUEL_WON(winnerDisplayName, loserDisplayName, bet, winnerWeapon, loserWeapon)
              });

              // Mostrar resultado en mensajes privados y eliminarlos después
              try {
                // Mensaje para el ganador
                const winnerPrivateMessage = winner.id === userId ? challengerPrivateMessage : opponentPrivateMessage;
                if (winnerPrivateMessage) {
                  await winnerPrivateMessage.edit({
                    content: `${EMOJIS.TROPHY} **¡VICTORIA!**\n\nHas vencido a **${loserDisplayName}** en el duelo.\n\n${winnerWeapon} vence a ${loserWeapon}\n\n${EMOJIS.HONOR} Has ganado **+${bet}** puntos de honor.`,
                    components: []
                  });
                  setTimeout(() => winnerPrivateMessage.delete().catch(() => {}), 10000);
                }
                
                // Mensaje para el perdedor
                const loserPrivateMessage = loser.id === userId ? challengerPrivateMessage : opponentPrivateMessage;
                if (loserPrivateMessage) {
                  await loserPrivateMessage.edit({
                    content: `${EMOJIS.WARNING} **DERROTA**\n\nHas sido vencido por **${winnerDisplayName}** en el duelo.\n\n${loserWeapon} es vencido por ${winnerWeapon}\n\n${EMOJIS.HONOR} Has perdido **-${bet}** puntos de honor.`,
                    components: []
                  });
                  setTimeout(() => loserPrivateMessage.delete().catch(() => {}), 10000);
                }
              } catch (error) {
                // Ignorar errores al editar/eliminar
                console.warn('Error al actualizar/eliminar mensajes privados del duelo:', error);
              }

              console.log(`${EMOJIS.DUEL} Duelo: ${winner.username} venció a ${loser.username} (${bet} honor)`);
            };
            
            stopAllCollectors('accepted');
          }
          } catch (error) {
            if (error.code === 10062 || error.message?.includes('expired') || error.message?.includes('time')) {
              await i.reply({ 
                content: MESSAGES.DUEL.DUEL_EXPIRED(await fetchDisplayName(interaction.guild, userId), 30), 
                flags: MessageFlags.Ephemeral 
              });
            } else {
              await i.reply({ 
                content: `❌ Error al procesar la respuesta: ${error.message || 'Error desconocido'}. El duelo puede haber expirado.`, 
                flags: MessageFlags.Ephemeral 
              });
            }
          }
        });
      }

      // Manejar expiración de tiempo
      if (opponentCollector) {
        opponentCollector.on('end', async (collected, reason) => {
          if (reason === 'time') {
            const opponentDisplayName = await fetchDisplayName(interaction.guild, opponent.id);
            await interaction.editReply({ content: MESSAGES.DUEL.DUEL_EXPIRED(opponentDisplayName, 30) });
            // Actualizar mensaje privado del que invita si existe
            if (challengerPrivateMessage) {
              try {
                await challengerPrivateMessage.edit({
                  content: MESSAGES.DUEL.DUEL_EXPIRED(opponentDisplayName, 30),
                  components: []
                });
              } catch (error) {
                // Ignorar si no se puede editar
              }
            }
            stopAllCollectors('time');
          }
        });
      }

      if (challengerCollector) {
        challengerCollector.on('end', async (collected, reason) => {
          if (reason === 'time') {
            stopAllCollectors('time');
          }
        });
      }
    }

    // /sabiduria - Mostrar cita de sabiduría samurai
    else if (commandName === 'sabiduria') {
      // Verificar si el comando debe ejecutarse en un canal específico de combate
      if (config.combatChannel && config.combatChannel.enabled && config.combatChannel.channelId) {
        if (interaction.channel.id !== config.combatChannel.channelId) {
          const combatChannel = interaction.guild.channels.cache.get(config.combatChannel.channelId);
          const channelName = combatChannel ? combatChannel.name : 'el canal de combate';
          const channelMention = combatChannel ? `<#${config.combatChannel.channelId}>` : 'el canal de combate';
          
          return interaction.reply({
            content: `❌ Los comandos de combate solo pueden usarse en ${channelMention} (**${channelName}**).`,
            flags: MessageFlags.Ephemeral
          });
        }
      }
      
      const randomQuote = CONSTANTS.WISDOM_QUOTES[Math.floor(Math.random() * CONSTANTS.WISDOM_QUOTES.length)];

      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(MESSAGES.WISDOM.TITLE)
        .setDescription(`*"${randomQuote.quote}"*\n\n— **${randomQuote.author}**`)
        .setFooter({ text: MESSAGES.WISDOM.FOOTER })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      console.log(`${EMOJIS.WISDOM} ${interaction.user.tag} consultó sabiduría: ${randomQuote.author}`);
    }

    // /fortuna - Consultar fortuna del día (Omikuji)
    else if (commandName === 'fortuna') {
      // Verificar si el comando debe ejecutarse en un canal específico de combate
      if (config.combatChannel && config.combatChannel.enabled && config.combatChannel.channelId) {
        if (interaction.channel.id !== config.combatChannel.channelId) {
          const combatChannel = interaction.guild.channels.cache.get(config.combatChannel.channelId);
          const channelName = combatChannel ? combatChannel.name : 'el canal de combate';
          const channelMention = combatChannel ? `<#${config.combatChannel.channelId}>` : 'el canal de combate';
          
          return interaction.reply({
            content: `❌ Los comandos de combate solo pueden usarse en ${channelMention} (**${channelName}**).`,
            flags: MessageFlags.Ephemeral
          });
        }
      }
      
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;

      // Verificar cooldown (24 horas)
      if (dataManager.hasCooldown(userId, 'fortuna')) {
        const timeLeft = dataManager.getCooldownTime(userId, 'fortuna');
        const hoursLeft = Math.floor(timeLeft / 3600);
        const minutesLeft = Math.floor((timeLeft % 3600) / 60);
        const timeString = hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`;
        return interaction.reply({
          content: MESSAGES.FORTUNE.ALREADY_CLAIMED(timeString),
          flags: MessageFlags.Ephemeral
        });
      }

      // Generar fortuna aleatoria basada en probabilidades
      const rand = Math.random();
      let fortuneType;
      let cumulativeChance = 0;

      for (const [key, data] of Object.entries(CONSTANTS.FORTUNE.TYPES)) {
        cumulativeChance += data.chance;
        if (rand <= cumulativeChance) {
          fortuneType = key;
          break;
        }
      }

      const fortune = CONSTANTS.FORTUNE.TYPES[fortuneType];
      const userData = dataManager.getUser(userId, guildId);

      // Guardar fortuna en userData
      userData.fortune = {
        type: fortuneType,
        date: Date.now(),
        bonus: fortune.bonus
      };

      dataManager.dataModified.users = true;
      await dataManager.saveUsers();

      // Establecer cooldown de 24 horas
      dataManager.setCooldown(userId, 'fortuna', CONSTANTS.FORTUNE.COOLDOWN);

      // Determinar mensaje según tipo de fortuna
      let fortuneMessage;
      switch (fortuneType) {
        case 'DAI_KICHI':
          fortuneMessage = MESSAGES.FORTUNE.GREAT;
          break;
        case 'KICHI':
          fortuneMessage = MESSAGES.FORTUNE.GOOD;
          break;
        case 'CHUKICHI':
          fortuneMessage = MESSAGES.FORTUNE.MEDIUM;
          break;
        case 'KYO':
          fortuneMessage = MESSAGES.FORTUNE.BAD;
          break;
      }

      const embed = new EmbedBuilder()
        .setColor(fortuneType === 'DAI_KICHI' ? '#FFB7C5' : fortuneType === 'KICHI' ? '#FFD700' : fortuneType === 'CHUKICHI' ? '#808080' : '#FF6B6B')
        .setTitle(MESSAGES.FORTUNE.TITLE)
        .setDescription(fortuneMessage)
        .setFooter({ text: MESSAGES.FORTUNE.FOOTER })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      console.log(`${EMOJIS.FORTUNE_GREAT} ${interaction.user.tag} consultó fortuna: ${fortuneType} (${fortune.bonus > 0 ? '+' : ''}${fortune.bonus * 100}%)`);
    }

    // /perfil - Mostrar perfil completo de usuario
    else if (commandName === 'perfil') {
      // Verificar si el comando debe ejecutarse en un canal específico de combate
      if (config.combatChannel && config.combatChannel.enabled && config.combatChannel.channelId) {
        if (interaction.channel.id !== config.combatChannel.channelId) {
          const combatChannel = interaction.guild.channels.cache.get(config.combatChannel.channelId);
          const channelName = combatChannel ? combatChannel.name : 'el canal de combate';
          const channelMention = combatChannel ? `<#${config.combatChannel.channelId}>` : 'el canal de combate';
          
          return interaction.reply({
            content: `❌ Los comandos de combate solo pueden usarse en ${channelMention} (**${channelName}**).`,
            flags: MessageFlags.Ephemeral
          });
        }
      }
      
      const targetUser = interaction.options.getUser('usuario') || interaction.user;
      const userId = targetUser.id;
      const guildId = interaction.guild.id;

      const userData = dataManager.getUser(userId, guildId);
      const clan = userData.clanId ? dataManager.getClan(userData.clanId) : null;

      // Load profile customization
      const profileCustomization = require('./utils/profileCustomization');
      const customization = userData.customization || {};

      // Información de fortuna
      let fortuneInfo = MESSAGES.PROFILE.NO_FORTUNE;
      if (userData.fortune && userData.fortune.type) {
        const timeSince = Date.now() - userData.fortune.date;
        const hoursAgo = Math.floor(timeSince / (1000 * 60 * 60));

        if (hoursAgo < 24) {
          const fortune = CONSTANTS.FORTUNE.TYPES[userData.fortune.type];
          fortuneInfo = `${fortune.emoji} ${fortune.name} (${userData.fortune.bonus > 0 ? '+' : ''}${userData.fortune.bonus * 100}% honor)`;
        } else {
          fortuneInfo = MESSAGES.PROFILE.NO_FORTUNE;
        }
      }

      // Obtener displayName del servidor
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      let displayName = targetMember?.displayName || targetUser.username;

      // Apply custom title if set
      if (customization.displayTitle) {
        displayName = profileCustomization.getDisplayNameWithTitle(displayName, userData);
      }

      // Obtener cosméticos activos
      const activeCosmetics = dataManager.getActiveCosmetics(userId, guildId);
      
      // Construir información de cosméticos
      let cosmeticsInfo = '';
      let profileTitle = displayName;

      if (activeCosmetics.titleId) {
        const titleItem = Object.values(CONSTANTS.SHOP.ITEMS).find(i => i.id === activeCosmetics.titleId);
        if (titleItem) {
          profileTitle = `${titleItem.effect.title} ${displayName}`;
          cosmeticsInfo += `${titleItem.name}\n`;
        }
      }

      if (activeCosmetics.badgeId) {
        const badgeItem = Object.values(CONSTANTS.SHOP.ITEMS).find(i => i.id === activeCosmetics.badgeId);
        if (badgeItem) {
          cosmeticsInfo += `${badgeItem.name}\n`;
        }
      }

      const embed = new EmbedBuilder()
        .setColor(customization.embedColor || COLORS.PRIMARY)
        .setTitle(MESSAGES.PROFILE.TITLE(profileTitle))
        .setThumbnail(targetUser.displayAvatarURL());

      // Add custom bio if set
      if (customization.bio) {
        embed.setDescription(`*"${customization.bio}"*\n`);
      }

      embed.addFields(
          {
            name: `${EMOJIS.HONOR} Honor`,
            value: `**${userData.honor}** puntos\n${getRankEmoji(userData.rank)} Rango: **${userData.rank}**`,
            inline: true
          },
          {
            name: `${EMOJIS.KOKU} Koku`,
            value: `**${userData.koku}** monedas`,
            inline: true
          },
          {
            name: `${EMOJIS.STREAK} Racha Daily`,
            value: `**${userData.dailyStreak}** días`,
            inline: true
          }
        );

      // Agregar cosméticos si hay activos
      if (cosmeticsInfo.trim()) {
        embed.addFields({
          name: '🎨 Cosméticos',
          value: cosmeticsInfo.trim(),
          inline: false
        });
      }

      embed.addFields(
          {
            name: MESSAGES.PROFILE.STATS_TITLE,
            value: `${EMOJIS.MESSAGE} Mensajes: **${userData.stats?.messagesCount || 0}**\n${EMOJIS.VOICE} Tiempo en voz: **${userData.stats?.voiceMinutes || 0}** min\n${EMOJIS.DUEL} Duelos: **${userData.stats?.duelsWon || 0}**W / **${userData.stats?.duelsLost || 0}**L (${userData.stats?.duelsTotal || 0} total)`,
            inline: false
          },
          {
            name: MESSAGES.PROFILE.CLAN_TITLE,
            value: clan ? `🏯 **${clan.name}** [${clan.tag}]` : MESSAGES.PROFILE.NO_CLAN,
            inline: true
          },
          {
            name: MESSAGES.PROFILE.FORTUNE_TITLE,
            value: fortuneInfo,
            inline: true
          }
        )
        .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
        .setTimestamp();

      // Add custom background image if set
      if (customization.backgroundUrl) {
        embed.setImage(customization.backgroundUrl);
      }

      await interaction.reply({ embeds: [embed] });
      console.log(`${EMOJIS.SCROLL} ${interaction.user.tag} consultó perfil de ${targetUser.tag}`);
    }

    // ==================== SISTEMA DE LOGROS ====================

    // /logros, /achievements, /medallas - Mostrar logros del usuario
    else if (commandName === 'logros' || commandName === 'achievements' || commandName === 'medallas') {
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;

      await interaction.deferReply();

      const achievementManager = require('./utils/achievementManager');
      const { unlocked, locked, stats } = achievementManager.getUserAchievements(userId, guildId);
      const userData = dataManager.getUser(userId, guildId);

      // Create main embed
      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setAuthor({
          name: `${interaction.user.username} - Sistema de Logros`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setDescription(
          `${EMOJIS.HONOR} **Progreso Total:** ${stats.total}/${stats.totalPossible} logros desbloqueados (${stats.completion}%)\n` +
          `${EMOJIS.KOKU} **Koku Ganado por Logros:** ${unlocked.reduce((sum, a) => sum + (a.reward?.koku || 0), 0)} koku\n\n`
        )
        .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
        .setTimestamp();

      // Add latest achievement
      if (stats.latestUnlock) {
        const unlockedDate = new Date(stats.latestUnlock.unlockedAt);
        const tierInfo = achievementManager.TIER_INFO[stats.latestUnlock.tier];
        embed.addFields({
          name: `🎉 Último Logro Desbloqueado`,
          value: `${stats.latestUnlock.emoji} **${stats.latestUnlock.name}** ${tierInfo.emoji}\n` +
                 `*${stats.latestUnlock.description}*\n` +
                 `📅 ${unlockedDate.toLocaleDateString('es-ES')}`,
          inline: false
        });
      }

      // Group unlocked achievements by category
      const categoriesShown = new Set();
      for (const [category, achievements] of Object.entries(stats.byCategory)) {
        if (achievements.length > 0) {
          const categoryEmoji = achievementManager.CATEGORY_EMOJIS[category];
          const categoryName = {
            social: 'Social',
            honor: 'Honor',
            economy: 'Economía',
            clan: 'Clan',
            music: 'Música',
            special: 'Especial',
            hidden: 'Secreto'
          }[category] || category;

          const achList = achievements
            .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0))
            .slice(0, 5) // Show max 5 per category
            .map(a => {
              const tierInfo = achievementManager.TIER_INFO[a.tier];
              return `${a.emoji} **${a.name}** ${tierInfo.emoji}`;
            })
            .join('\n');

          embed.addFields({
            name: `${categoryEmoji} ${categoryName} (${achievements.length})`,
            value: achList,
            inline: true
          });
          categoriesShown.add(category);
        }
      }

      // Show some locked achievements (next goals)
      const nextGoals = locked
        .filter(a => !a.hidden)
        .slice(0, 3)
        .map(a => {
          const tierInfo = achievementManager.TIER_INFO[a.tier];
          let progress = '';

          // Show progress for some achievement types
          if (a.requirement.type === 'messages') {
            const current = userData.stats?.messagesCount || 0;
            progress = ` (${current}/${a.requirement.count})`;
          } else if (a.requirement.type === 'voiceMinutes') {
            const current = userData.stats?.voiceMinutes || 0;
            progress = ` (${current}/${a.requirement.count} min)`;
          } else if (a.requirement.type === 'honor') {
            const current = userData.honor || 0;
            progress = ` (${current}/${a.requirement.count})`;
          } else if (a.requirement.type === 'koku') {
            const current = userData.koku || 0;
            progress = ` (${current}/${a.requirement.count})`;
          }

          return `${a.emoji} **${a.name}** ${tierInfo.emoji}${progress}\n*${a.description}*`;
        })
        .join('\n\n');

      if (nextGoals) {
        embed.addFields({
          name: '🎯 Próximos Objetivos',
          value: nextGoals,
          inline: false
        });
      }

      // Add titles if user has any
      if (userData.titles && userData.titles.length > 0) {
        embed.addFields({
          name: '👑 Títulos Desbloqueados',
          value: userData.titles.map(t => `• ${t}`).join('\n'),
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });
      console.log(`${EMOJIS.HONOR} ${interaction.user.tag} consultó sus logros (${stats.total}/${stats.totalPossible})`);
    }

    // ==================== PERSONALIZACIÓN DE PERFIL ====================

    // /personalizar - Sistema de personalización
    else if (commandName === 'personalizar') {
      const subcommand = interaction.options.getSubcommand();
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;
      const profileCustomization = require('./utils/profileCustomization');
      const userData = dataManager.getUser(userId, guildId);

      // ========== /perfil fondo ==========
      if (subcommand === 'fondo') {
        const imageUrl = interaction.options.getString('url');

        try {
          profileCustomization.setCustomBackground(userData, imageUrl);
          dataManager.dataModified.users = true;

          const embed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle(`${EMOJIS.SUCCESS} Fondo Actualizado`)
            .setDescription(
              `Tu fondo de perfil ha sido cambiado.\n\n` +
              `**Vista previa:**`
            )
            .setImage(imageUrl)
            .setFooter({ text: 'El fondo se mostrará en tu tarjeta de bienvenida y perfil' })
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
          console.log(`${EMOJIS.SUCCESS} ${interaction.user.tag} cambió su fondo de perfil`);
        } catch (error) {
          return interaction.reply({
            content: `${EMOJIS.ERROR} ${error.message}`,
            flags: MessageFlags.Ephemeral
          });
        }
      }

      // ========== /perfil color ==========
      else if (subcommand === 'color') {
        const colorInput = interaction.options.getString('codigo');

        try {
          let hexColor = colorInput;

          // Check if it's a preset name
          if (!colorInput.startsWith('#')) {
            const preset = profileCustomization.getColorPreset(colorInput);
            hexColor = preset.color;
          }

          profileCustomization.setCustomColor(userData, hexColor);
          dataManager.dataModified.users = true;

          const embed = new EmbedBuilder()
            .setColor(hexColor)
            .setTitle(`${EMOJIS.SUCCESS} Color Actualizado`)
            .setDescription(
              `Tu color de embeds ha sido cambiado.\n\n` +
              `**Nuevo color:** ${hexColor}\n` +
              `Este embed muestra tu nuevo color.`
            )
            .setFooter({ text: 'El color se aplicará a tus embeds de perfil' })
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
          console.log(`${EMOJIS.SUCCESS} ${interaction.user.tag} cambió su color a ${hexColor}`);
        } catch (error) {
          return interaction.reply({
            content: `${EMOJIS.ERROR} ${error.message}`,
            flags: MessageFlags.Ephemeral
          });
        }
      }

      // ========== /perfil titulo ==========
      else if (subcommand === 'titulo') {
        const title = interaction.options.getString('titulo');

        try {
          profileCustomization.setDisplayTitle(userData, title);
          dataManager.dataModified.users = true;

          const embed = new EmbedBuilder()
            .setColor(userData.customization?.embedColor || COLORS.SUCCESS)
            .setTitle(`${EMOJIS.SUCCESS} Título Actualizado`)
            .setAuthor({
              name: profileCustomization.getDisplayNameWithTitle(interaction.user.username, userData),
              iconURL: interaction.user.displayAvatarURL()
            })
            .setDescription(
              `Tu título visible ha sido actualizado.\n\n` +
              `**Nuevo título:** ${title}\n\n` +
              `Ahora se mostrará en tus perfiles y comandos.`
            )
            .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
          console.log(`${EMOJIS.SUCCESS} ${interaction.user.tag} estableció su título: ${title}`);
        } catch (error) {
          return interaction.reply({
            content: `${EMOJIS.ERROR} ${error.message}`,
            flags: MessageFlags.Ephemeral
          });
        }
      }

      // ========== /perfil bio ==========
      else if (subcommand === 'bio') {
        const bio = interaction.options.getString('texto');

        try {
          profileCustomization.setBio(userData, bio);
          dataManager.dataModified.users = true;

          const embed = new EmbedBuilder()
            .setColor(userData.customization?.embedColor || COLORS.SUCCESS)
            .setTitle(`${EMOJIS.SUCCESS} Biografía Actualizada`)
            .setDescription(
              `Tu biografía ha sido actualizada.\n\n` +
              `**Nueva biografía:**\n` +
              `*"${bio}"*`
            )
            .setFooter({ text: `${bio.length}/100 caracteres` })
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
          console.log(`${EMOJIS.SUCCESS} ${interaction.user.tag} actualizó su biografía`);
        } catch (error) {
          return interaction.reply({
            content: `${EMOJIS.ERROR} ${error.message}`,
            flags: MessageFlags.Ephemeral
          });
        }
      }

      // ========== /perfil ver ==========
      else if (subcommand === 'ver') {
        const summary = profileCustomization.getCustomizationSummary(userData);

        const embed = new EmbedBuilder()
          .setColor(userData.customization?.embedColor || COLORS.PRIMARY)
          .setTitle('🎨 Tu Personalización')
          .setAuthor({
            name: profileCustomization.getDisplayNameWithTitle(interaction.user.username, userData),
            iconURL: interaction.user.displayAvatarURL()
          })
          .addFields(
            {
              name: '🖼️ Fondo de Perfil',
              value: summary.hasCustomBackground
                ? `[Ver imagen](${summary.backgroundUrl})`
                : 'Por defecto',
              inline: true
            },
            {
              name: '🎨 Color de Embeds',
              value: summary.embedColor,
              inline: true
            },
            {
              name: '👑 Título Visible',
              value: summary.displayTitle,
              inline: true
            },
            {
              name: '📝 Biografía',
              value: summary.bio,
              inline: false
            }
          )
          .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
          .setTimestamp();

        // Add available titles
        if (summary.availableTitles.length > 0) {
          embed.addFields({
            name: '🏆 Títulos Disponibles',
            value: summary.availableTitles.map(t => `• ${t}`).join('\n'),
            inline: false
          });
        }

        // Show background if custom
        if (summary.hasCustomBackground) {
          embed.setImage(summary.backgroundUrl);
        }

        await interaction.reply({ embeds: [embed] });
        console.log(`${EMOJIS.INFO} ${interaction.user.tag} consultó su personalización`);
      }

      // ========== /perfil colores ==========
      else if (subcommand === 'colores') {
        const presets = profileCustomization.getAllColorPresets();

        const colorFields = Object.entries(presets).map(([key, preset]) => ({
          name: `${preset.name} (\`${key}\`)`,
          value: `Color: ${preset.color}`,
          inline: true
        }));

        const embed = new EmbedBuilder()
          .setColor(COLORS.PRIMARY)
          .setTitle('🎨 Paleta de Colores')
          .setDescription(
            'Usa `/personalizar color codigo:<nombre>` para aplicar un preset.\n' +
            'También puedes usar código hexadecimal: `/personalizar color codigo:#FF5733`'
          )
          .addFields(colorFields)
          .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }

      // ========== /perfil reiniciar ==========
      else if (subcommand === 'reiniciar') {
        const tipo = interaction.options.getString('tipo');

        try {
          profileCustomization.resetCustomization(userData, tipo);
          dataManager.dataModified.users = true;

          const tipoNames = {
            background: 'fondo',
            color: 'color',
            title: 'título',
            bio: 'biografía',
            all: 'toda la personalización'
          };

          const embed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle(`${EMOJIS.SUCCESS} Personalización Reiniciada`)
            .setDescription(`Se ha reiniciado: **${tipoNames[tipo]}**`)
            .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
          console.log(`${EMOJIS.INFO} ${interaction.user.tag} reinició: ${tipo}`);
        } catch (error) {
          return interaction.reply({
            content: `${EMOJIS.ERROR} ${error.message}`,
            flags: MessageFlags.Ephemeral
          });
        }
      }
    }

    // ==================== SISTEMA DE EVENTOS ====================

    // /evento - Sistema de eventos y competencias
    else if (commandName === 'evento') {
      const subcommand = interaction.options.getSubcommand();
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;
      const { getEventManager, EVENT_STATUS } = require('./utils/eventManager');
      const eventManager = getEventManager();

      // ========== /evento crear ==========
      if (subcommand === 'crear') {
        // Check admin permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({
            content: `${EMOJIS.ERROR} Solo los administradores pueden crear eventos.`,
            flags: MessageFlags.Ephemeral
          });
        }

        const tipo = interaction.options.getString('tipo');
        const nombre = interaction.options.getString('nombre');
        const descripcion = interaction.options.getString('descripcion');
        const duracion = interaction.options.getInteger('duracion');
        const maxParticipantes = interaction.options.getInteger('max_participantes');

        try {
          const options = {};
          if (duracion) {
            options.endTime = Date.now() + (duracion * 60 * 60 * 1000);
          }
          if (maxParticipantes) {
            options.maxParticipantes = maxParticipantes;
          }

          const event = eventManager.createEvent(guildId, tipo, nombre, descripcion, userId, options);

          const embed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle(`${event.emoji} Evento Creado`)
            .setDescription(
              `**${event.name}**\n` +
              `${event.description}\n\n` +
              `**ID:** \`${event.id}\`\n` +
              `**Tipo:** ${event.emoji} ${tipo.replace('_', ' ')}\n` +
              `**Estado:** ⏳ Pendiente\n` +
              `**Duración:** ${Math.floor((event.endTime - event.startTime) / (60 * 60 * 1000))} horas\n` +
              `**Participantes:** 0/${event.maxParticipants}\n\n` +
              `Usa \`/evento unirse evento:${event.name}\` para inscribirte.`
            )
            .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
          console.log(`${EMOJIS.SUCCESS} ${interaction.user.tag} creó evento: ${event.name}`);
        } catch (error) {
          console.error('Error creando evento:', error.message);
          return interaction.reply({
            content: `${EMOJIS.ERROR} Error al crear evento: ${error.message}`,
            flags: MessageFlags.Ephemeral
          });
        }
      }

      // ========== /evento unirse ==========
      else if (subcommand === 'unirse') {
        const eventoQuery = interaction.options.getString('evento');

        try {
          // Find event by name or ID
          let event = eventManager.getEvent(eventoQuery);
          if (!event) {
            const guildEvents = eventManager.getGuildEvents(guildId);
            event = guildEvents.find(e => e.name.toLowerCase() === eventoQuery.toLowerCase());
          }

          if (!event) {
            return interaction.reply({
              content: `${EMOJIS.ERROR} No se encontró el evento "${eventoQuery}".`,
              flags: MessageFlags.Ephemeral
            });
          }

          eventManager.joinEvent(event.id, userId);

          // Initialize koku tracking for koku rush events
          if (event.type === 'koku_rush') {
            const userData = dataManager.getUser(userId, guildId);
            event.metadata.startingKoku[userId] = userData.koku || 0;
            eventManager.saveEvents();
          }

          const embed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle(`${EMOJIS.SUCCESS} ¡Te has unido al evento!`)
            .setDescription(
              `**${event.name}**\n` +
              `${event.description}\n\n` +
              `**Participantes:** ${event.participants.length}/${event.maxParticipants}\n` +
              `**Estado:** ${event.status === EVENT_STATUS.PENDING ? '⏳ Pendiente' : '▶️ Activo'}`
            )
            .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
          console.log(`${EMOJIS.SUCCESS} ${interaction.user.tag} se unió al evento: ${event.name}`);
        } catch (error) {
          console.error('Error uniéndose a evento:', error.message);
          return interaction.reply({
            content: `${EMOJIS.ERROR} ${error.message}`,
            flags: MessageFlags.Ephemeral
          });
        }
      }

      // ========== /evento salir ==========
      else if (subcommand === 'salir') {
        const eventoQuery = interaction.options.getString('evento');

        try {
          let event = eventManager.getEvent(eventoQuery);
          if (!event) {
            const guildEvents = eventManager.getGuildEvents(guildId);
            event = guildEvents.find(e => e.name.toLowerCase() === eventoQuery.toLowerCase());
          }

          if (!event) {
            return interaction.reply({
              content: `${EMOJIS.ERROR} No se encontró el evento "${eventoQuery}".`,
              flags: MessageFlags.Ephemeral
            });
          }

          eventManager.leaveEvent(event.id, userId);

          await interaction.reply({
            content: `${EMOJIS.SUCCESS} Has salido del evento **${event.name}**.`,
            flags: MessageFlags.Ephemeral
          });

          console.log(`${EMOJIS.VOICE} ${interaction.user.tag} salió del evento: ${event.name}`);
        } catch (error) {
          console.error('Error saliendo de evento:', error.message);
          return interaction.reply({
            content: `${EMOJIS.ERROR} ${error.message}`,
            flags: MessageFlags.Ephemeral
          });
        }
      }

      // ========== /evento ver ==========
      else if (subcommand === 'ver') {
        const eventoQuery = interaction.options.getString('evento');

        try {
          if (!eventoQuery) {
            // Show all active events
            const activeEvents = eventManager.getActiveEvents(guildId);

            if (activeEvents.length === 0) {
              return interaction.reply({
                content: `${EMOJIS.INFO} No hay eventos activos en este servidor.`,
                flags: MessageFlags.Ephemeral
              });
            }

            const embed = new EmbedBuilder()
              .setColor(COLORS.PRIMARY)
              .setTitle('📋 Eventos Activos')
              .setDescription(
                activeEvents.map(e =>
                  `${e.emoji} **${e.name}**\n` +
                  `ID: \`${e.id}\`\n` +
                  `Participantes: ${e.participants.length}/${e.maxParticipants}\n` +
                  `Finaliza: <t:${Math.floor(e.endTime / 1000)}:R>`
                ).join('\n\n')
              )
              .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
              .setTimestamp();

            return interaction.reply({ embeds: [embed] });
          }

          // Show specific event
          let event = eventManager.getEvent(eventoQuery);
          if (!event) {
            const guildEvents = eventManager.getGuildEvents(guildId);
            event = guildEvents.find(e => e.name.toLowerCase() === eventoQuery.toLowerCase());
          }

          if (!event) {
            return interaction.reply({
              content: `${EMOJIS.ERROR} No se encontró el evento "${eventoQuery}".`,
              flags: MessageFlags.Ephemeral
            });
          }

          const statusEmoji = {
            pending: '⏳',
            active: '▶️',
            completed: '✅',
            cancelled: '🚫'
          }[event.status];

          const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle(`${event.emoji} ${event.name}`)
            .setDescription(event.description)
            .addFields(
              { name: '🆔 ID', value: `\`${event.id}\``, inline: true },
              { name: '📊 Estado', value: `${statusEmoji} ${event.status}`, inline: true },
              { name: '👥 Participantes', value: `${event.participants.length}/${event.maxParticipants}`, inline: true },
              { name: '⏰ Inicio', value: `<t:${Math.floor(event.startTime / 1000)}:F>`, inline: true },
              { name: '🏁 Finaliza', value: `<t:${Math.floor(event.endTime / 1000)}:R>`, inline: true },
              { name: '👤 Creador', value: `<@${event.creatorId}>`, inline: true }
            )
            .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
            .setTimestamp();

          // Add prizes if any
          if (event.prizes && Object.keys(event.prizes).length > 0) {
            const prizeText = Object.entries(event.prizes)
              .slice(0, 3)
              .map(([rank, prize]) => {
                const medal = rank === '1' ? '🥇' : rank === '2' ? '🥈' : '🥉';
                let text = `${medal} **Puesto ${rank}:** ${prize.koku || 0} ${EMOJIS.KOKU}`;
                if (prize.title) text += ` + Título: "${prize.title}"`;
                return text;
              })
              .join('\n');

            embed.addFields({ name: '🏆 Premios', value: prizeText, inline: false });
          }

          await interaction.reply({ embeds: [embed] });
        } catch (error) {
          console.error('Error viendo evento:', error.message);
          return interaction.reply({
            content: `${EMOJIS.ERROR} ${error.message}`,
            flags: MessageFlags.Ephemeral
          });
        }
      }

      // ========== /evento clasificacion ==========
      else if (subcommand === 'clasificacion') {
        const eventoQuery = interaction.options.getString('evento');

        try {
          let event = eventManager.getEvent(eventoQuery);
          if (!event) {
            const guildEvents = eventManager.getGuildEvents(guildId);
            event = guildEvents.find(e => e.name.toLowerCase() === eventoQuery.toLowerCase());
          }

          if (!event) {
            return interaction.reply({
              content: `${EMOJIS.ERROR} No se encontró el evento "${eventoQuery}".`,
              flags: MessageFlags.Ephemeral
            });
          }

          const leaderboard = eventManager.getLeaderboard(event.id, 10);

          if (leaderboard.length === 0) {
            return interaction.reply({
              content: `${EMOJIS.INFO} Aún no hay puntuaciones registradas para este evento.`,
              flags: MessageFlags.Ephemeral
            });
          }

          const leaderboardText = await Promise.all(leaderboard.map(async (entry, index) => {
            const user = await client.users.fetch(entry.userId).catch(() => null);
            const username = user ? user.username : 'Usuario desconocido';
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            return `${medal} **${username}** - ${entry.score} puntos`;
          }));

          const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle(`🏆 Clasificación: ${event.name}`)
            .setDescription(leaderboardText.join('\n'))
            .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
        } catch (error) {
          console.error('Error viendo clasificación:', error.message);
          return interaction.reply({
            content: `${EMOJIS.ERROR} ${error.message}`,
            flags: MessageFlags.Ephemeral
          });
        }
      }

      // ========== /evento iniciar ==========
      else if (subcommand === 'iniciar') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({
            content: `${EMOJIS.ERROR} Solo los administradores pueden iniciar eventos.`,
            flags: MessageFlags.Ephemeral
          });
        }

        const eventoQuery = interaction.options.getString('evento');

        try {
          let event = eventManager.getEvent(eventoQuery);
          if (!event) {
            const guildEvents = eventManager.getGuildEvents(guildId);
            event = guildEvents.find(e => e.name.toLowerCase() === eventoQuery.toLowerCase());
          }

          if (!event) {
            return interaction.reply({
              content: `${EMOJIS.ERROR} No se encontró el evento "${eventoQuery}".`,
              flags: MessageFlags.Ephemeral
            });
          }

          eventManager.startEvent(event.id);

          const embed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle(`${event.emoji} ¡Evento Iniciado!`)
            .setDescription(
              `**${event.name}** ha comenzado.\n\n` +
              `**Participantes:** ${event.participants.length}\n` +
              `**Finaliza:** <t:${Math.floor(event.endTime / 1000)}:R>`
            )
            .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
          console.log(`${EMOJIS.SUCCESS} ${interaction.user.tag} inició evento: ${event.name}`);
        } catch (error) {
          console.error('Error iniciando evento:', error.message);
          return interaction.reply({
            content: `${EMOJIS.ERROR} ${error.message}`,
            flags: MessageFlags.Ephemeral
          });
        }
      }

      // ========== /evento finalizar ==========
      else if (subcommand === 'finalizar') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({
            content: `${EMOJIS.ERROR} Solo los administradores pueden finalizar eventos.`,
            flags: MessageFlags.Ephemeral
          });
        }

        const eventoQuery = interaction.options.getString('evento');

        try {
          let event = eventManager.getEvent(eventoQuery);
          if (!event) {
            const guildEvents = eventManager.getGuildEvents(guildId);
            event = guildEvents.find(e => e.name.toLowerCase() === eventoQuery.toLowerCase());
          }

          if (!event) {
            return interaction.reply({
              content: `${EMOJIS.ERROR} No se encontró el evento "${eventoQuery}".`,
              flags: MessageFlags.Ephemeral
            });
          }

          await interaction.deferReply();

          eventManager.endEvent(event.id);
          const winners = eventManager.awardPrizes(event.id, dataManager);

          const winnersText = await Promise.all(winners.map(async w => {
            const user = await client.users.fetch(w.userId).catch(() => null);
            const username = user ? user.username : 'Usuario desconocido';
            const medal = w.rank === 1 ? '🥇' : w.rank === 2 ? '🥈' : '🥉';
            let text = `${medal} **${username}** - ${w.score} puntos\n`;
            text += `   Recompensa: ${w.prize.koku || 0} ${EMOJIS.KOKU}`;
            if (w.prize.title) text += ` + "${w.prize.title}"`;
            return text;
          }));

          const embed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle(`${event.emoji} ¡Evento Finalizado!`)
            .setDescription(`**${event.name}** ha concluido.\n\n**🏆 Ganadores:**\n\n${winnersText.join('\n\n')}`)
            .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });

          // Notify winners via DM
          for (const winner of winners) {
            try {
              const user = await client.users.fetch(winner.userId);
              await user.send(
                `${event.emoji} **¡Felicidades!**\n\n` +
                `Has quedado en el **puesto ${winner.rank}** en el evento **${event.name}**.\n\n` +
                `**Recompensa:**\n` +
                `• ${winner.prize.koku || 0} ${EMOJIS.KOKU}\n` +
                (winner.prize.title ? `• Título: "${winner.prize.title}"\n` : '') +
                `\n¡Bien hecho, guerrero!`
              );
            } catch (e) {
              // Ignore DM failures
            }
          }

          console.log(`${EMOJIS.SUCCESS} ${interaction.user.tag} finalizó evento: ${event.name}`);
        } catch (error) {
          console.error('Error finalizando evento:', error.message);
          return interaction.reply({
            content: `${EMOJIS.ERROR} ${error.message}`,
            flags: MessageFlags.Ephemeral
          });
        }
      }

      // ========== /evento cancelar ==========
      else if (subcommand === 'cancelar') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({
            content: `${EMOJIS.ERROR} Solo los administradores pueden cancelar eventos.`,
            flags: MessageFlags.Ephemeral
          });
        }

        const eventoQuery = interaction.options.getString('evento');

        try {
          let event = eventManager.getEvent(eventoQuery);
          if (!event) {
            const guildEvents = eventManager.getGuildEvents(guildId);
            event = guildEvents.find(e => e.name.toLowerCase() === eventoQuery.toLowerCase());
          }

          if (!event) {
            return interaction.reply({
              content: `${EMOJIS.ERROR} No se encontró el evento "${eventoQuery}".`,
              flags: MessageFlags.Ephemeral
            });
          }

          eventManager.cancelEvent(event.id);

          await interaction.reply({
            content: `${EMOJIS.SUCCESS} El evento **${event.name}** ha sido cancelado.`,
            flags: MessageFlags.Ephemeral
          });

          console.log(`${EMOJIS.ERROR} ${interaction.user.tag} canceló evento: ${event.name}`);
        } catch (error) {
          console.error('Error cancelando evento:', error.message);
          return interaction.reply({
            content: `${EMOJIS.ERROR} ${error.message}`,
            flags: MessageFlags.Ephemeral
          });
        }
      }

      // ========== /evento lista ==========
      else if (subcommand === 'lista') {
        const estadoFilter = interaction.options.getString('estado');

        try {
          const events = eventManager.getGuildEvents(guildId, estadoFilter);

          if (events.length === 0) {
            return interaction.reply({
              content: `${EMOJIS.INFO} No se encontraron eventos${estadoFilter ? ` con estado "${estadoFilter}"` : ''}.`,
              flags: MessageFlags.Ephemeral
            });
          }

          const statusEmojis = {
            pending: '⏳',
            active: '▶️',
            completed: '✅',
            cancelled: '🚫'
          };

          const eventsList = events.map(e =>
            `${e.emoji} **${e.name}**\n` +
            `ID: \`${e.id}\` | ${statusEmojis[e.status]} ${e.status}\n` +
            `Participantes: ${e.participants.length}/${e.maxParticipants}`
          ).join('\n\n');

          const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('📋 Lista de Eventos')
            .setDescription(eventsList)
            .setFooter({ text: `Total: ${events.length} eventos` })
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
        } catch (error) {
          console.error('Error listando eventos:', error.message);
          return interaction.reply({
            content: `${EMOJIS.ERROR} ${error.message}`,
            flags: MessageFlags.Ephemeral
          });
        }
      }

      // ========== /evento enviar ==========
      else if (subcommand === 'enviar') {
        const eventoId = interaction.options.getString('evento');
        const imagenUrl = interaction.options.getString('imagen_url');
        const descripcionBuild = interaction.options.getString('descripcion') || 'Sin descripción';

        try {
          const event = eventManager.getEvent(eventoId);

          if (!event) {
            return interaction.reply({
              content: `${EMOJIS.ERROR} No se encontró el evento con ID "${eventoId}".`,
              flags: MessageFlags.Ephemeral
            });
          }

          eventManager.submitBuildingEntry(eventoId, userId, imagenUrl, descripcionBuild);

          const embed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle(`${EMOJIS.SUCCESS} ¡Construcción Enviada!`)
            .setDescription(
              `Tu construcción ha sido registrada para **${event.name}**.\n\n` +
              `**Descripción:** ${descripcionBuild}`
            )
            .setImage(imagenUrl)
            .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
          console.log(`${EMOJIS.SUCCESS} ${interaction.user.tag} envió construcción al evento: ${event.name}`);
        } catch (error) {
          console.error('Error enviando construcción:', error.message);
          return interaction.reply({
            content: `${EMOJIS.ERROR} ${error.message}`,
            flags: MessageFlags.Ephemeral
          });
        }
      }

      // ========== /evento votar ==========
      else if (subcommand === 'votar') {
        const eventoId = interaction.options.getString('evento');
        const targetUser = interaction.options.getUser('usuario');

        try {
          const event = eventManager.getEvent(eventoId);

          if (!event) {
            return interaction.reply({
              content: `${EMOJIS.ERROR} No se encontró el evento con ID "${eventoId}".`,
              flags: MessageFlags.Ephemeral
            });
          }

          eventManager.voteBuildingEntry(eventoId, userId, targetUser.id);

          await interaction.reply({
            content: `${EMOJIS.SUCCESS} Has votado por la construcción de **${targetUser.username}**.`,
            flags: MessageFlags.Ephemeral
          });

          console.log(`${EMOJIS.SUCCESS} ${interaction.user.tag} votó por ${targetUser.tag} en: ${event.name}`);
        } catch (error) {
          console.error('Error votando:', error.message);
          return interaction.reply({
            content: `${EMOJIS.ERROR} ${error.message}`,
            flags: MessageFlags.Ephemeral
          });
        }
      }
    }

    // ==================== FASE 7: SISTEMA DE TRADUCCIÓN ====================

    // /traducir - Traducir texto entre idiomas
    else if (commandName === 'traducir') {
      const targetLang = interaction.options.getString('idioma');
      const text = interaction.options.getString('texto');
      const userId = interaction.user.id;

      // Verificar longitud del texto
      if (text.length > CONSTANTS.TRANSLATION.MAX_LENGTH) {
        return interaction.reply({
          content: MESSAGES.TRANSLATION.TOO_LONG(CONSTANTS.TRANSLATION.MAX_LENGTH),
          flags: MessageFlags.Ephemeral
        });
      }

      // Verificar cooldown
      if (dataManager.hasCooldown(userId, 'traducir')) {
        const timeLeft = dataManager.getCooldownTime(userId, 'traducir');
        return interaction.reply({ content: MESSAGES.ERRORS.COOLDOWN(timeLeft), flags: MessageFlags.Ephemeral });
      }

      // Establecer cooldown
      dataManager.setCooldown(userId, 'traducir', CONSTANTS.TRANSLATION.COOLDOWN);

      await interaction.deferReply();

      try {
        // Importar librería de traducción
        const translateModule = require('@vitalets/google-translate-api');
        // La librería puede exportar de diferentes formas según la versión
        const translate = translateModule.default || translateModule.translate || translateModule;

        // Mapear idioma a código
        let targetCode;
        let targetLangName;
        let targetFlag;

        if (targetLang === 'español') {
          targetCode = CONSTANTS.TRANSLATION.LANGUAGES.SPANISH.code;
          targetLangName = CONSTANTS.TRANSLATION.LANGUAGES.SPANISH.name;
          targetFlag = CONSTANTS.TRANSLATION.LANGUAGES.SPANISH.flag;
        } else if (targetLang === 'japonés') {
          targetCode = CONSTANTS.TRANSLATION.LANGUAGES.JAPANESE.code;
          targetLangName = CONSTANTS.TRANSLATION.LANGUAGES.JAPANESE.name;
          targetFlag = CONSTANTS.TRANSLATION.LANGUAGES.JAPANESE.flag;
        } else if (targetLang === 'inglés') {
          targetCode = CONSTANTS.TRANSLATION.LANGUAGES.ENGLISH.code;
          targetLangName = CONSTANTS.TRANSLATION.LANGUAGES.ENGLISH.name;
          targetFlag = CONSTANTS.TRANSLATION.LANGUAGES.ENGLISH.flag;
        } else {
          return interaction.editReply(MESSAGES.TRANSLATION.INVALID_LANGUAGE);
        }

        // Traducir texto
        const result = await translate(text, { to: targetCode });

        const embed = new EmbedBuilder()
          .setColor(COLORS.PRIMARY)
          .setTitle(`${targetFlag} ${MESSAGES.TRANSLATION.TITLE('Auto-detectado', targetLangName)}`)
          .addFields(
            {
              name: `${EMOJIS.SCROLL} ${MESSAGES.TRANSLATION.ORIGINAL}`,
              value: `\`\`\`${text}\`\`\``,
              inline: false
            },
            {
              name: `${targetFlag} ${MESSAGES.TRANSLATION.TRANSLATED}`,
              value: `\`\`\`${result.text}\`\`\``,
              inline: false
            }
          )
          .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        console.log(`${EMOJIS.GLOBE} ${interaction.user.tag} tradujo texto a ${targetLangName}`);
      } catch (error) {
        console.error('Error al traducir:', error);
        await interaction.editReply(MESSAGES.TRANSLATION.ERROR);
      }
    }

    // ==================== FASE 8: SISTEMA DE TIENDA ====================

    // /tienda - Sistema de tienda
    else if (commandName === 'tienda') {
      // Verificar si el comando debe ejecutarse en un canal específico de tienda
      if (config.shopChannel && config.shopChannel.enabled && config.shopChannel.channelId) {
        if (interaction.channel.id !== config.shopChannel.channelId) {
          const shopChannel = interaction.guild.channels.cache.get(config.shopChannel.channelId);
          const channelName = shopChannel ? shopChannel.name : 'el canal de la tienda';
          const channelMention = shopChannel ? `<#${config.shopChannel.channelId}>` : 'el canal de la tienda';
          
          return interaction.reply({
            content: `❌ Los comandos de la tienda solo pueden usarse en ${channelMention} (**${channelName}**).`,
            flags: MessageFlags.Ephemeral
          });
        }
      }
      
      const subcommand = interaction.options.getSubcommand();
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;
      const userData = dataManager.getUser(userId, guildId);

      // /tienda ver - Versión interactiva
      if (subcommand === 'ver') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Función helper para generar el embed de la tienda
        const generateShopEmbed = (selectedCategory = null, userDataForBalance = null) => {
          const allItems = Object.values(CONSTANTS.SHOP.ITEMS);
          const items = selectedCategory 
            ? allItems.filter(item => item.category === selectedCategory)
            : allItems;

          // Agrupar por categoría
          const itemsByCategory = {
            boosts: items.filter(i => i.category === 'boosts'),
            cosmetics: items.filter(i => i.category === 'cosmetics'),
            permanent: items.filter(i => i.category === 'permanent')
          };

          let description = '';
          const categoryNames = {
            boosts: '⚡ **BOOSTS TEMPORALES**',
            cosmetics: '🎨 **ITEMS COSMÉTICOS**',
            permanent: '⭐ **ITEMS PERMANENTES**'
          };

          for (const [cat, catItems] of Object.entries(itemsByCategory)) {
            if (catItems.length > 0) {
              description += `\n${categoryNames[cat]}\n`;
              for (const item of catItems) {
                const duration = item.duration 
                  ? ` (${item.duration / (60 * 60 * 1000)}h)` 
                  : '';
                description += `**${item.name}** - ${item.price.toLocaleString()} koku${duration}\n`;
                description += `   ${item.description}\n`;
              }
            }
          }

          const title = selectedCategory 
            ? `🏪 Tienda del Dojo - ${categoryNames[selectedCategory]?.replace(/\*\*/g, '') || 'Categoría'}`
            : '🏪 Tienda del Dojo';

          const balanceData = userDataForBalance || userData;
          const currentBalance = dataManager.getUser(userId, guildId).koku;

          return new EmbedBuilder()
            .setColor(COLORS.KOKU)
            .setTitle(title)
            .setDescription(description || 'No hay items disponibles.')
            .addFields({
              name: `${EMOJIS.KOKU} Tu Balance`,
              value: `**${currentBalance.toLocaleString()}** koku`,
              inline: true
            })
            .setFooter({ text: 'Selecciona un item del menú para comprarlo' })
            .setTimestamp();
        };

        // Función helper para generar el menú desplegable de items
        const generateItemSelectMenu = (selectedCategory = null) => {
          const allItems = Object.values(CONSTANTS.SHOP.ITEMS);
          const items = selectedCategory 
            ? allItems.filter(item => item.category === selectedCategory)
            : allItems;

          const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('shop_item_select')
            .setPlaceholder('Selecciona un item para comprar...')
            .setMinValues(1)
            .setMaxValues(1);

          // Agregar opciones (máximo 25 por Discord)
          const maxOptions = Math.min(items.length, 25);
          for (let i = 0; i < maxOptions; i++) {
            const item = items[i];
            const canAfford = userData.koku >= item.price;
            const duration = item.duration 
              ? ` (${item.duration / (60 * 60 * 1000)}h)` 
              : '';
            
            // Remover emojis del nombre para el label (más limpio)
            const cleanName = item.name.replace(/[⚡🔥💰⏱️🎁👑🌟🏅🥉🥈🥇🎒📅⭐]/g, '').trim();
            
            const option = new StringSelectMenuOptionBuilder()
              .setLabel(cleanName || item.name) // Si se removió todo, usar el nombre original
              .setDescription(`${item.price.toLocaleString()} koku${duration} - ${item.description.substring(0, 50)}`)
              .setValue(item.id)
              .setDefault(false);
            
            // No agregar emojis al menú desplegable para evitar errores de Discord
            // Los emojis ya están en el nombre del item en el embed
            
            selectMenu.addOptions(option);
          }

          return selectMenu;
        };

        // Crear botones de categoría
        const allButton = new ButtonBuilder()
          .setCustomId('shop_category_all')
          .setLabel('Todos')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🏪');

        const boostsButton = new ButtonBuilder()
          .setCustomId('shop_category_boosts')
          .setLabel('Boosts')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('⚡');

        const cosmeticsButton = new ButtonBuilder()
          .setCustomId('shop_category_cosmetics')
          .setLabel('Cosméticos')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🎨');

        const permanentButton = new ButtonBuilder()
          .setCustomId('shop_category_permanent')
          .setLabel('Permanentes')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('⭐');

        const inventoryButton = new ButtonBuilder()
          .setCustomId('shop_view_inventory')
          .setLabel('Mi Inventario')
          .setStyle(ButtonStyle.Success)
          .setEmoji('📦');

        const closeButton = new ButtonBuilder()
          .setCustomId('shop_close')
          .setLabel('Cerrar')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌');

        // Crear filas de componentes
        const categoryRow = new ActionRowBuilder()
          .addComponents(allButton, boostsButton, cosmeticsButton, permanentButton, inventoryButton);
        
        const closeRow = new ActionRowBuilder()
          .addComponents(closeButton);

        const selectMenuRow = new ActionRowBuilder()
          .addComponents(generateItemSelectMenu());

        // Enviar mensaje inicial (ephemeral - solo visible para el usuario)
        const initialCategory = interaction.options.getString('categoria');
        const message = await interaction.editReply({
          embeds: [generateShopEmbed(initialCategory)],
          components: [selectMenuRow, categoryRow, closeRow],
          flags: MessageFlags.Ephemeral
        });

        // Collector para botones y menús
        const collector = message.createMessageComponentCollector({
          filter: (i) => i.user.id === userId,
          time: 300000 // 5 minutos
        });

        let currentCategory = initialCategory;

        collector.on('collect', async (i) => {
          try {
            // Manejar selección de item
            if (i.isStringSelectMenu() && i.customId === 'shop_item_select') {
              const itemId = i.values[0];
              const item = Object.values(CONSTANTS.SHOP.ITEMS).find(it => it.id === itemId);

              if (!item) {
                return i.reply({ content: '❌ Item no encontrado.', flags: MessageFlags.Ephemeral });
              }

              // Obtener datos actualizados del usuario
              const currentUserData = dataManager.getUser(userId, guildId);

              // Verificar si puede comprar
              if (currentUserData.koku < item.price) {
                return i.reply({
                  content: `❌ No tienes suficiente koku. Necesitas **${item.price.toLocaleString()}** koku, pero solo tienes **${currentUserData.koku.toLocaleString()}** koku.`,
                  flags: MessageFlags.Ephemeral
                });
              }

              // Procesar compra
              currentUserData.koku -= item.price;

              if (!currentUserData.inventory) {
                currentUserData.inventory = [];
              }

              let purchaseMessage = '';

              if (item.type === 'boost') {
                if (!currentUserData.activeBoosts) {
                  currentUserData.activeBoosts = [];
                }
                const expiresAt = Date.now() + item.duration;
                currentUserData.activeBoosts.push({
                  itemId: item.id,
                  expiresAt: expiresAt,
                  effect: item.effect
                });
                purchaseMessage = `✅ ¡Compra exitosa! Has activado **${item.name}** por ${item.duration / (60 * 60 * 1000)} horas.\n💰 Koku restante: **${currentUserData.koku.toLocaleString()}**`;
              } else if (item.type === 'consumable') {
                const existingItem = currentUserData.inventory.find(inv => inv.itemId === item.id);
                if (existingItem) {
                  existingItem.quantity = (existingItem.quantity || 1) + 1;
                } else {
                  currentUserData.inventory.push({
                    itemId: item.id,
                    purchasedAt: Date.now(),
                    quantity: 1
                  });
                }
                purchaseMessage = `✅ ¡Compra exitosa! Has comprado **${item.name}**.\n💰 Koku restante: **${currentUserData.koku.toLocaleString()}**`;
              } else if (item.type === 'permanent') {
                const hasItem = currentUserData.inventory.some(inv => inv.itemId === item.id);
                if (hasItem) {
                  currentUserData.koku += item.price; // Reembolsar
                  await dataManager.saveUsers();
                  return i.reply({ content: '❌ Ya posees este item permanente.', flags: MessageFlags.Ephemeral });
                }
                currentUserData.inventory.push({
                  itemId: item.id,
                  purchasedAt: Date.now()
                });
                purchaseMessage = `✅ ¡Compra exitosa! Has adquirido **${item.name}** permanentemente.\n💰 Koku restante: **${currentUserData.koku.toLocaleString()}**`;
              }

              await dataManager.saveUsers();
              
              // Actualizar userData para el embed
              const updatedUserData = dataManager.getUser(userId, guildId);
              
              // Actualizar embed con nuevo balance
              await i.update({
                embeds: [generateShopEmbed(currentCategory, updatedUserData)],
                components: [new ActionRowBuilder().addComponents(generateItemSelectMenu(currentCategory)), categoryRow, closeRow]
              });

              // Enviar confirmación
              await i.followUp({ content: purchaseMessage, flags: MessageFlags.Ephemeral });
              console.log(`🏪 ${interaction.user.tag} compró ${item.name} por ${item.price} koku`);
            }

            // Manejar botones de categoría
            else if (i.isButton()) {
              // Botón de cerrar
              if (i.customId === 'shop_close') {
                // Deshabilitar todos los componentes
                const disabledCategoryRow = new ActionRowBuilder()
                  .addComponents(
                    allButton.setDisabled(true),
                    boostsButton.setDisabled(true),
                    cosmeticsButton.setDisabled(true),
                    permanentButton.setDisabled(true),
                    inventoryButton.setDisabled(true)
                  );

                const disabledSelectRow = new ActionRowBuilder()
                  .addComponents(generateItemSelectMenu(currentCategory).setDisabled(true));

                const disabledCloseRow = new ActionRowBuilder()
                  .addComponents(closeButton.setDisabled(true));

                await i.update({
                  embeds: [generateShopEmbed(currentCategory)],
                  components: [disabledSelectRow, disabledCategoryRow, disabledCloseRow]
                });
                
                collector.stop('closed');
                return;
              }
              
              if (i.customId === 'shop_view_inventory') {
                // Mostrar inventario
                if (!userData.inventory || userData.inventory.length === 0) {
                  return i.reply({ content: '📦 Tu inventario está vacío.', flags: MessageFlags.Ephemeral });
                }

                let description = '';
                const activeBoosts = userData.activeBoosts || [];
                
                if (activeBoosts.length > 0) {
                  description += '**⚡ BOOSTS ACTIVOS:**\n';
                  for (const boost of activeBoosts) {
                    const item = Object.values(CONSTANTS.SHOP.ITEMS).find(it => it.id === boost.itemId);
                    if (item) {
                      const timeLeft = Math.max(0, boost.expiresAt - Date.now());
                      const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
                      const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                      description += `${item.name} - ${hoursLeft}h ${minutesLeft}m restantes\n`;
                    }
                  }
                  description += '\n';
                }

                description += '**📦 ITEMS EN INVENTARIO:**\n';
                const groupedItems = {};
                for (const invItem of userData.inventory) {
                  const item = Object.values(CONSTANTS.SHOP.ITEMS).find(it => it.id === invItem.itemId);
                  if (item) {
                    if (!groupedItems[item.id]) {
                      groupedItems[item.id] = { item, quantity: 0 };
                    }
                    groupedItems[item.id].quantity += (invItem.quantity || 1);
                  }
                }

                for (const { item, quantity } of Object.values(groupedItems)) {
                  description += `${item.name}${quantity > 1 ? ` x${quantity}` : ''}\n`;
                }

                const inventoryEmbed = new EmbedBuilder()
                  .setColor(COLORS.PRIMARY)
                  .setTitle('📦 Tu Inventario')
                  .setDescription(description || 'No tienes items.')
                  .setFooter({ text: 'Click en los botones para activar cosméticos' })
                  .setTimestamp();

                // Crear botones para cosméticos
                const cosmeticItems = Object.values(groupedItems)
                  .map(({ item }) => item)
                  .filter(item => item.category === 'cosmetics');

                const rows = [];

                // Agregar botones para cada cosmético (máximo 5 por row)
                if (cosmeticItems.length > 0) {
                  let currentRow = new ActionRowBuilder();
                  let buttonCount = 0;

                  for (const cosmetic of cosmeticItems) {
                    const cleanName = cosmetic.name.replace(/[👑🌟🏅🥉🥈🥇🎨]/g, '').trim();
                    
                    // Determinar si está activo
                    const activeCosmetics = dataManager.getActiveCosmetics(userId, guildId);
                    let isActive = false;
                    if (cosmetic.id.includes('title')) {
                      isActive = activeCosmetics.titleId === cosmetic.id;
                    } else if (cosmetic.id.includes('badge')) {
                      isActive = activeCosmetics.badgeId === cosmetic.id;
                    } else if (cosmetic.id.includes('color')) {
                      isActive = activeCosmetics.colorId === cosmetic.id;
                    }

                    const button = new ButtonBuilder()
                      .setCustomId(`activate_cosmetic_${cosmetic.id}`)
                      .setLabel(`${isActive ? '✅' : ''} ${cleanName.substring(0, 18)}`.trim())
                      .setStyle(isActive ? ButtonStyle.Success : ButtonStyle.Primary);

                    currentRow.addComponents(button);
                    buttonCount++;

                    if (buttonCount === 5) {
                      rows.push(currentRow);
                      currentRow = new ActionRowBuilder();
                      buttonCount = 0;
                    }
                  }

                  if (buttonCount > 0) {
                    rows.push(currentRow);
                  }
                }

                const components = rows.length > 0 ? rows : [];

                // Agregar botón para volver
                const backButton = new ButtonBuilder()
                  .setCustomId('shop_back_from_inventory')
                  .setLabel('Cerrar inventario')
                  .setStyle(ButtonStyle.Secondary);

                const backRow = new ActionRowBuilder().addComponents(backButton);
                const finalComponents = components.length > 0 ? [...components, backRow] : [backRow];

                return i.update({ embeds: [inventoryEmbed], components: finalComponents });
              }

              // Manejar activación/desactivación de cosméticos desde inventario
              if (i.customId && i.customId.startsWith('activate_cosmetic_')) {
                const cosmeticId = i.customId.replace('activate_cosmetic_', '');
                const cosmeticItem = Object.values(CONSTANTS.SHOP.ITEMS).find(item => item.id === cosmeticId);
                const currentUserData = dataManager.getUser(userId, guildId);

                if (!cosmeticItem) {
                  await safeDeferUpdate(i);
                  return i.followUp({ content: '❌ Cosmético no encontrado.', flags: MessageFlags.Ephemeral });
                }

                // Determinar tipo de cosmético
                let cosmeticType;
                if (cosmeticId.includes('title')) {
                  cosmeticType = 'title';
                } else if (cosmeticId.includes('badge')) {
                  cosmeticType = 'badge';
                } else if (cosmeticId.includes('color')) {
                  cosmeticType = 'color';
                } else {
                  await safeDeferUpdate(i);
                  return i.followUp({ content: '❌ No se pudo determinar el tipo de cosmético.', flags: MessageFlags.Ephemeral });
                }

                // Obtener cosméticos activos
                const activeCosmetics = dataManager.getActiveCosmetics(userId, guildId);
                const typeMap = { 'title': 'titleId', 'badge': 'badgeId', 'color': 'colorId' };
                const isCurrentlyActive = activeCosmetics[typeMap[cosmeticType]] === cosmeticId;

                try {
                  await safeDeferUpdate(i);

                  if (isCurrentlyActive) {
                    // DESACTIVAR
                    if (cosmeticType === 'color') {
                      try {
                        const member = await interaction.guild.members.fetch(userId).catch(() => null);
                        if (member) {
                          const cosmeticRole = member.roles.cache.find(role => role.name.startsWith('🎨'));
                          if (cosmeticRole) {
                            await member.roles.remove(cosmeticRole).catch(() => {});
                            const rolesWithMember = cosmeticRole.members;
                            if (rolesWithMember.size === 0) {
                              await cosmeticRole.delete().catch(() => {});
                            }
                          }
                        }
                      } catch (roleError) {
                        console.error('Error eliminando rol:', roleError);
                      }
                    }

                    // Desactivar en DB
                    dataManager.setActiveCosmetic(userId, guildId, cosmeticType, null);
                    await dataManager.saveUsers();

                    await i.followUp({ content: `✅ ${cosmeticItem.name} **desactivado**.`, flags: MessageFlags.Ephemeral });
                    console.log(`🎨 ${interaction.user.tag} desactivó cosmético: ${cosmeticItem.name}`);
                  } else {
                    // ACTIVAR
                    dataManager.setActiveCosmetic(userId, guildId, cosmeticType, cosmeticId);

                    // Si el item NO es permanente (es consumible), eliminarlo del inventario
                    if (cosmeticItem.type !== 'permanent') {
                      const inventoryIndex = currentUserData.inventory.findIndex(inv => inv.itemId === cosmeticId);
                      if (inventoryIndex !== -1) {
                        if ((currentUserData.inventory[inventoryIndex].quantity || 1) > 1) {
                          currentUserData.inventory[inventoryIndex].quantity = (currentUserData.inventory[inventoryIndex].quantity || 1) - 1;
                        } else {
                          currentUserData.inventory.splice(inventoryIndex, 1);
                        }
                      }
                    }

                    await dataManager.saveUsers();

                    // Si es un cosmético de color, crear/modificar el rol
                    if (cosmeticType === 'color') {
                      const colorValue = cosmeticItem.effect.roleColor;
                      const roleName = `🎨 ${cosmeticItem.name.replace(/🥉🥈🥇/g, '').trim()}`;

                      try {
                        const member = await interaction.guild.members.fetch(userId).catch(() => null);
                        if (!member) {
                          return i.followUp({ content: '❌ No se pudo encontrar tu usuario en el servidor.', flags: MessageFlags.Ephemeral });
                        }

                        let cosmeticRole = member.roles.cache.find(role => role.name.startsWith('🎨'));
                        if (cosmeticRole) {
                          await member.roles.remove(cosmeticRole).catch(() => {});
                          const rolesWithMember = cosmeticRole.members;
                          if (rolesWithMember.size === 0) {
                            await cosmeticRole.delete().catch(() => {});
                          }
                        }

                        cosmeticRole = await interaction.guild.roles.create({
                          name: roleName,
                          color: colorValue,
                          reason: `Cosmético activado: ${cosmeticItem.name}`
                        });

                        await member.roles.add(cosmeticRole).catch(() => {});
                        await i.followUp({ content: `✅ ¡${cosmeticItem.name} **activado**! Se te ha asignado el rol con color personalizado.`, flags: MessageFlags.Ephemeral });
                      } catch (roleError) {
                        console.error('Error creando/modificando rol:', roleError);
                        await i.followUp({ content: `✅ ¡${cosmeticItem.name} **activado**! Nota: No se pudo crear el rol automáticamente.`, flags: MessageFlags.Ephemeral });
                      }
                    } else {
                      await i.followUp({ content: `✅ ¡${cosmeticItem.name} **activado**! Tu cambio será visible en tu perfil.`, flags: MessageFlags.Ephemeral });

                      console.log(`🎨 ${interaction.user.tag} activó cosmético desde inventario: ${cosmeticItem.name}`);
                    }
                  }
                
                // Después de activar/desactivrar, reconstruir la vista del inventario y actualizar el mensaje
                try {
                  const refreshedUser = dataManager.getUser(userId, guildId);
                  let description = '';
                  const activeBoostsRef = refreshedUser.activeBoosts || [];
                  if (activeBoostsRef.length > 0) {
                    description += '**⚡ BOOSTS ACTIVOS:**\n';
                    for (const boost of activeBoostsRef) {
                      const item = Object.values(CONSTANTS.SHOP.ITEMS).find(it => it.id === boost.itemId);
                      if (item) {
                        const timeLeft = Math.max(0, boost.expiresAt - Date.now());
                        const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
                        const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                        description += `${item.name} - ${hoursLeft}h ${minutesLeft}m restantes\n`;
                      }
                    }
                    description += '\n';
                  }

                  description += '**📦 ITEMS EN INVENTARIO:**\n';
                  const groupedItemsRef = {};
                  for (const invItem of (refreshedUser.inventory || [])) {
                    const item = Object.values(CONSTANTS.SHOP.ITEMS).find(it => it.id === invItem.itemId);
                    if (item) {
                      if (!groupedItemsRef[item.id]) groupedItemsRef[item.id] = { item, quantity: 0 };
                      groupedItemsRef[item.id].quantity += (invItem.quantity || 1);
                    }
                  }

                  for (const { item, quantity } of Object.values(groupedItemsRef)) {
                    description += `${item.name}${quantity > 1 ? ` x${quantity}` : ''}\n`;
                  }

                  const inventoryEmbed = new EmbedBuilder()
                    .setColor(COLORS.PRIMARY)
                    .setTitle('📦 Tu Inventario')
                    .setDescription(description || 'No tienes items.')
                    .setFooter({ text: 'Click en los botones para activar cosméticos' })
                    .setTimestamp();

                  const cosmeticItemsRef = Object.values(groupedItemsRef).map(({ item }) => item).filter(item => item.category === 'cosmetics');
                  const rowsRef = [];
                  if (cosmeticItemsRef.length > 0) {
                    let currentRowRef = new ActionRowBuilder();
                    let buttonCountRef = 0;
                    const activeCosmeticsRef = dataManager.getActiveCosmetics(userId, guildId);

                    for (const cosmetic of cosmeticItemsRef) {
                      const cleanName = cosmetic.name.replace(/[👑🌟🏅🥉🥈🥇🎨]/g, '').trim();
                      let isActiveRef = false;
                      if (cosmetic.id.includes('title')) isActiveRef = activeCosmeticsRef.titleId === cosmetic.id;
                      else if (cosmetic.id.includes('badge')) isActiveRef = activeCosmeticsRef.badgeId === cosmetic.id;
                      else if (cosmetic.id.includes('color')) isActiveRef = activeCosmeticsRef.colorId === cosmetic.id;

                      const btn = new ButtonBuilder()
                        .setCustomId(`activate_cosmetic_${cosmetic.id}`)
                        .setLabel(`${isActiveRef ? '✅' : ''} ${cleanName.substring(0, 18)}`.trim())
                        .setStyle(isActiveRef ? ButtonStyle.Success : ButtonStyle.Primary);

                      currentRowRef.addComponents(btn);
                      buttonCountRef++;
                      if (buttonCountRef === 5) { rowsRef.push(currentRowRef); currentRowRef = new ActionRowBuilder(); buttonCountRef = 0; }
                    }
                    if (buttonCountRef > 0) rowsRef.push(currentRowRef);
                  }

                  const backBtn = new ButtonBuilder().setCustomId('shop_back_from_inventory').setLabel('Cerrar inventario').setStyle(ButtonStyle.Secondary).setEmoji('⬅️');
                  const backRowRef = new ActionRowBuilder().addComponents(backBtn);
                  const finalComponentsRef = rowsRef.length > 0 ? [...rowsRef, backRowRef] : [backRowRef];

                  await message.edit({ embeds: [inventoryEmbed], components: finalComponentsRef }).catch(() => {});
                  // Stop processing this interaction further (we already handled it)
                  return;
                } catch (rebuildError) {
                  console.error('Error reconstruyendo inventario tras activación:', rebuildError);
                }

                } catch (error) {
                  console.error('Error activando/desactivando cosmético:', error);
                  if (i.deferred) {
                    await i.followUp({ content: `❌ Error: ${error.message}`, flags: MessageFlags.Ephemeral });
                  } else {
                    await i.reply({ content: `❌ Error: ${error.message}`, flags: MessageFlags.Ephemeral });
                  }
                }
              }

              // Cambiar categoría
              let newCategory = null;
              if (i.customId === 'shop_category_all') {
                newCategory = null;
              } else if (i.customId === 'shop_category_boosts') {
                newCategory = 'boosts';
              } else if (i.customId === 'shop_category_cosmetics') {
                newCategory = 'cosmetics';
              } else if (i.customId === 'shop_category_permanent') {
                newCategory = 'permanent';
              }

              currentCategory = newCategory;

              // Actualizar botones (marcar el seleccionado)
              const updatedAllButton = new ButtonBuilder()
                .setCustomId('shop_category_all')
                .setLabel('Todos')
                .setStyle(newCategory === null ? ButtonStyle.Primary : ButtonStyle.Secondary)
                .setEmoji('🏪');

              const updatedBoostsButton = new ButtonBuilder()
                .setCustomId('shop_category_boosts')
                .setLabel('Boosts')
                .setStyle(newCategory === 'boosts' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                .setEmoji('⚡');

              const updatedCosmeticsButton = new ButtonBuilder()
                .setCustomId('shop_category_cosmetics')
                .setLabel('Cosméticos')
                .setStyle(newCategory === 'cosmetics' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                .setEmoji('🎨');

              const updatedPermanentButton = new ButtonBuilder()
                .setCustomId('shop_category_permanent')
                .setLabel('Permanentes')
                .setStyle(newCategory === 'permanent' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                .setEmoji('⭐');

              const updatedCategoryRow = new ActionRowBuilder()
                .addComponents(updatedAllButton, updatedBoostsButton, updatedCosmeticsButton, updatedPermanentButton, inventoryButton);

              // Obtener datos actualizados del usuario
              const updatedUserDataForCategory = dataManager.getUser(userId, guildId);
              
              await i.update({
                embeds: [generateShopEmbed(newCategory, updatedUserDataForCategory)],
                components: [new ActionRowBuilder().addComponents(generateItemSelectMenu(newCategory)), updatedCategoryRow, closeRow]
              });
            }
          } catch (error) {
            console.error('Error en collector de tienda:', error);
            
            // Determinar el tipo de error
            let errorMessage = '❌ Ocurrió un error. Por favor intenta de nuevo.';
            
            if (error.code === 10062 || error.message?.includes('expired') || error.message?.includes('time')) {
              errorMessage = MESSAGES.GENERIC.INTERACTION_EXPIRED;
            } else if (error.message?.includes('disabled') || error.message?.includes('not available')) {
              errorMessage = MESSAGES.GENERIC.BUTTON_DISABLED;
            } else if (error.message) {
              errorMessage = `❌ Error: ${error.message}. Por favor, intenta de nuevo o usa \`/tienda ver\` para abrir la tienda nuevamente.`;
            }
            
            if (i.deferred || i.replied) {
              await i.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
            } else {
              await i.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
            }
          }
        });

        collector.on('end', () => {
          // Deshabilitar componentes cuando expire o se cierre
          const disabledCategoryRow = new ActionRowBuilder()
            .addComponents(
              allButton.setDisabled(true),
              boostsButton.setDisabled(true),
              cosmeticsButton.setDisabled(true),
              permanentButton.setDisabled(true),
              inventoryButton.setDisabled(true)
            );

          const disabledSelectRow = new ActionRowBuilder()
            .addComponents(generateItemSelectMenu(currentCategory).setDisabled(true));

          const disabledCloseRow = new ActionRowBuilder()
            .addComponents(closeButton.setDisabled(true));

          message.edit({ components: [disabledSelectRow, disabledCategoryRow, disabledCloseRow] }).catch(() => {});
        });

        console.log(`🏪 ${interaction.user.tag} consultó la tienda`);
      }

      // /tienda comprar
      else if (subcommand === 'comprar') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const itemId = interaction.options.getString('item');
        const item = Object.values(CONSTANTS.SHOP.ITEMS).find(i => i.id === itemId);

        if (!item) {
          return interaction.editReply(`❌ Item \`${itemId}\` no encontrado. Usa \`/tienda ver\` para ver los items disponibles.`);
        }

        if (userData.koku < item.price) {
          return interaction.editReply(
            `❌ No tienes suficiente koku. Necesitas **${item.price.toLocaleString()}** koku, pero solo tienes **${userData.koku.toLocaleString()}** koku.`
          );
        }

        // Inicializar inventario si no existe
        if (!userData.inventory) {
          userData.inventory = [];
        }

        // Procesar la compra según el tipo de item
        userData.koku -= item.price;

        if (item.type === 'boost') {
          // Agregar boost activo
          if (!userData.activeBoosts) {
            userData.activeBoosts = [];
          }
          const expiresAt = Date.now() + item.duration;
          userData.activeBoosts.push({
            itemId: item.id,
            expiresAt: expiresAt,
            effect: item.effect
          });
          await dataManager.saveUsers();
          await interaction.editReply(
            `✅ ¡Compra exitosa! Has activado **${item.name}** por ${item.duration / (60 * 60 * 1000)} horas.\n` +
            `💰 Koku restante: **${userData.koku.toLocaleString()}**`
          );
        } else if (item.type === 'consumable') {
          // Agregar al inventario
          userData.inventory.push({
            itemId: item.id,
            purchasedAt: Date.now(),
            quantity: (userData.inventory.find(i => i.itemId === item.id)?.quantity || 0) + 1
          });
          await dataManager.saveUsers();
          await interaction.editReply(
            `✅ ¡Compra exitosa! Has comprado **${item.name}**.\n` +
            `💰 Koku restante: **${userData.koku.toLocaleString()}**\n` +
            `📦 Usa \`/tienda inventario\` para ver tus items.`
          );
        } else if (item.type === 'permanent') {
          // Verificar si ya lo tiene
          const hasItem = userData.inventory.some(i => i.itemId === item.id);
          if (hasItem) {
            userData.koku += item.price; // Reembolsar
            await dataManager.saveUsers();
            return interaction.editReply(`❌ Ya posees este item permanente.`);
          }
          userData.inventory.push({
            itemId: item.id,
            purchasedAt: Date.now()
          });
          await dataManager.saveUsers();
          await interaction.editReply(
            `✅ ¡Compra exitosa! Has adquirido **${item.name}** permanentemente.\n` +
            `💰 Koku restante: **${userData.koku.toLocaleString()}**`
          );
        }

        console.log(`🏪 ${interaction.user.tag} compró ${item.name} por ${item.price} koku`);
      }

      // /tienda inventario
      else if (subcommand === 'inventario') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!userData.inventory || userData.inventory.length === 0) {
          return interaction.editReply('📦 Tu inventario está vacío. Usa `/tienda ver` para ver los items disponibles.');
        }

        let description = '';
        const activeBoosts = userData.activeBoosts || [];
        
        if (activeBoosts.length > 0) {
          description += '**⚡ BOOSTS ACTIVOS:**\n';
          for (const boost of activeBoosts) {
            const item = Object.values(CONSTANTS.SHOP.ITEMS).find(i => i.id === boost.itemId);
            if (item) {
              const timeLeft = Math.max(0, boost.expiresAt - Date.now());
              const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
              const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
              description += `${item.name} - ${hoursLeft}h ${minutesLeft}m restantes\n`;
            }
          }
          description += '\n';
        }

        description += '**📦 ITEMS EN INVENTARIO:**\n';
        const groupedItems = {};
        for (const invItem of userData.inventory) {
          const item = Object.values(CONSTANTS.SHOP.ITEMS).find(i => i.id === invItem.itemId);
          if (item) {
            if (!groupedItems[item.id]) {
              groupedItems[item.id] = { item, quantity: 0 };
            }
            groupedItems[item.id].quantity += (invItem.quantity || 1);
          }
        }

        for (const { item, quantity } of Object.values(groupedItems)) {
          description += `${item.name}${quantity > 1 ? ` x${quantity}` : ''}\n`;
        }

        const embed = new EmbedBuilder()
          .setColor(COLORS.PRIMARY)
          .setTitle('📦 Tu Inventario')
          .setDescription(description || 'No tienes items.')
          .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
          .setTimestamp();

        // Construir botones para la vista directa de /tienda inventario (igual que en la vista interactiva)
        const cosmeticItems = Object.values(groupedItems).map(({ item }) => item).filter(item => item.category === 'cosmetics');

        const rows = [];
        if (cosmeticItems.length > 0) {
          let currentRow = new ActionRowBuilder();
          let buttonCount = 0;
          for (const cosmetic of cosmeticItems) {
            const cleanName = cosmetic.name.replace(/[👑🌟🏅🥉🥈🥇🎨]/g, '').trim();
            const activeCosmetics = dataManager.getActiveCosmetics(interaction.user.id, interaction.guild.id);
            let isActive = false;
            if (cosmetic.id.includes('title')) isActive = activeCosmetics.titleId === cosmetic.id;
            else if (cosmetic.id.includes('badge')) isActive = activeCosmetics.badgeId === cosmetic.id;
            else if (cosmetic.id.includes('color')) isActive = activeCosmetics.colorId === cosmetic.id;

            const button = new ButtonBuilder()
              .setCustomId(`activate_cosmetic_${cosmetic.id}`)
              .setLabel(`${isActive ? '✅' : ''} ${cleanName.substring(0, 18)}`.trim())
              .setStyle(isActive ? ButtonStyle.Success : ButtonStyle.Primary);

            currentRow.addComponents(button);
            buttonCount++;
            if (buttonCount === 5) { rows.push(currentRow); currentRow = new ActionRowBuilder(); buttonCount = 0; }
          }
          if (buttonCount > 0) rows.push(currentRow);
        }

        const backButton = new ButtonBuilder().setCustomId('shop_back_from_inventory').setLabel('Cerrar inventario').setStyle(ButtonStyle.Secondary);
        const backRow = new ActionRowBuilder().addComponents(backButton);
        const finalComponents = rows.length > 0 ? [...rows, backRow] : [backRow];

        await interaction.editReply({ embeds: [embed], components: finalComponents });
        const shopMessage = await interaction.fetchReply();

        // Collector para manejar los botones en la vista de /tienda inventario
        const invCollector = shopMessage.createMessageComponentCollector({ filter: (btnInt) => btnInt.user.id === interaction.user.id, time: 300000 });

        invCollector.on('collect', async (bi) => {
          try {
            if (bi.customId === 'shop_back_from_inventory') {
              // Actualizar la respuesta efímera para cerrar el inventario (no intentar borrar ephemeral)
              await bi.update({ content: '✅ Inventario cerrado.', embeds: [], components: [] }).catch(() => {});
              return invCollector.stop('closed');
            }

            if (bi.customId && bi.customId.startsWith('activate_cosmetic_')) {
              // Reusar la lógica de activación/desactivación (similar a la vista interactiva)
              const cosmeticId = bi.customId.replace('activate_cosmetic_', '');
              const cosmeticItem = Object.values(CONSTANTS.SHOP.ITEMS).find(item => item.id === cosmeticId);
              const userId = bi.user.id;
              const guildId = bi.guildId || interaction.guild.id;
              const currentUserData = dataManager.getUser(userId, guildId);

              if (!cosmeticItem) {
                await safeDeferUpdate(bi);
                await bi.followUp({ content: '❌ Cosmético no encontrado.', flags: MessageFlags.Ephemeral });
                return;
              }

              // Determinar tipo
              let cosmeticType;
              if (cosmeticId.includes('title')) cosmeticType = 'title';
              else if (cosmeticId.includes('badge')) cosmeticType = 'badge';
              else if (cosmeticId.includes('color')) cosmeticType = 'color';
              else {
                await safeDeferUpdate(bi);
                await bi.followUp({ content: '❌ No se pudo determinar el tipo de cosmético.', flags: MessageFlags.Ephemeral });
                return;
              }

              const activeCosmetics = dataManager.getActiveCosmetics(userId, guildId);
              const typeMap = { 'title': 'titleId', 'badge': 'badgeId', 'color': 'colorId' };
              const isCurrentlyActive = activeCosmetics[typeMap[cosmeticType]] === cosmeticId;

              await safeDeferUpdate(bi);

              if (isCurrentlyActive) {
                // Desactivar
                if (cosmeticType === 'color') {
                  try {
                    const member = await bi.guild.members.fetch(userId).catch(() => null);
                    if (member) {
                      const cosmeticRole = member.roles.cache.find(r => r.name.startsWith('🎨'));
                      if (cosmeticRole) {
                        await member.roles.remove(cosmeticRole).catch(() => {});
                        const rolesWithMember = cosmeticRole.members;
                        if (rolesWithMember.size === 0) await cosmeticRole.delete().catch(() => {});
                      }
                    }
                  } catch (err) { console.error('Error eliminando rol:', err); }
                }

                dataManager.setActiveCosmetic(userId, guildId, cosmeticType, null);
                await dataManager.saveUsers();
                await bi.followUp({ content: `✅ ${cosmeticItem.name} **desactivado**.`, flags: MessageFlags.Ephemeral });
              } else {
                // Activar
                dataManager.setActiveCosmetic(userId, guildId, cosmeticType, cosmeticId);
                if (cosmeticItem.type !== 'permanent') {
                  const inventoryIndex = currentUserData.inventory.findIndex(inv => inv.itemId === cosmeticId);
                  if (inventoryIndex !== -1) {
                    if ((currentUserData.inventory[inventoryIndex].quantity || 1) > 1) currentUserData.inventory[inventoryIndex].quantity--;
                    else currentUserData.inventory.splice(inventoryIndex, 1);
                  }
                }
                await dataManager.saveUsers();

                if (cosmeticType === 'color') {
                  try {
                    const member = await bi.guild.members.fetch(userId).catch(() => null);
                    if (!member) { await bi.followUp({ content: '❌ No se pudo encontrar tu usuario en el servidor.', flags: MessageFlags.Ephemeral }); return; }
                    let cosmeticRole = member.roles.cache.find(r => r.name.startsWith('🎨'));
                    if (cosmeticRole) { await member.roles.remove(cosmeticRole).catch(() => {}); const rolesWithMember = cosmeticRole.members; if (rolesWithMember.size === 0) await cosmeticRole.delete().catch(() => {}); }
                    cosmeticRole = await bi.guild.roles.create({ name: `🎨 ${cosmeticItem.name.replace(/🥉🥈🥇/g, '').trim()}`, color: cosmeticItem.effect.roleColor, reason: `Cosmético activado: ${cosmeticItem.name}` });
                    await member.roles.add(cosmeticRole).catch(() => {});
                    await bi.followUp({ content: `✅ ¡${cosmeticItem.name} **activado**! Se te ha asignado el rol con color personalizado.`, flags: MessageFlags.Ephemeral });
                  } catch (err) { console.error('Error creando/modificando rol:', err); await bi.followUp({ content: `✅ ¡${cosmeticItem.name} **activado**! Nota: No se pudo crear el rol automáticamente.`, flags: MessageFlags.Ephemeral }); }
                } else {
                  await bi.followUp({ content: `✅ ¡${cosmeticItem.name} **activado**! Tu cambio será visible en tu perfil.`, flags: MessageFlags.Ephemeral });
                }
              }

              // Reconstruir embed/components y editar el mensaje
              try {
                const refreshedUser = dataManager.getUser(userId, guildId);
                let desc = '';
                const boostsRef = refreshedUser.activeBoosts || [];
                if (boostsRef.length > 0) {
                  desc += '**⚡ BOOSTS ACTIVOS:**\n';
                  for (const boost of boostsRef) {
                    const item = Object.values(CONSTANTS.SHOP.ITEMS).find(it => it.id === boost.itemId);
                    if (item) { const timeLeft = Math.max(0, boost.expiresAt - Date.now()); const hoursLeft = Math.floor(timeLeft/(60*60*1000)); const minutesLeft = Math.floor((timeLeft%(60*60*1000))/(60*1000)); desc += `${item.name} - ${hoursLeft}h ${minutesLeft}m restantes\n`; }
                  }
                  desc += '\n';
                }
                desc += '**📦 ITEMS EN INVENTARIO:**\n';
                const groupedRef = {};
                for (const invItem of (refreshedUser.inventory || [])) { const item = Object.values(CONSTANTS.SHOP.ITEMS).find(i => i.id === invItem.itemId); if (item) { if (!groupedRef[item.id]) groupedRef[item.id] = { item, quantity: 0 }; groupedRef[item.id].quantity += (invItem.quantity || 1); } }
                for (const { item, quantity } of Object.values(groupedRef)) desc += `${item.name}${quantity>1?` x${quantity}`:''}\n`;
                const newEmbed = new EmbedBuilder().setColor(COLORS.PRIMARY).setTitle('📦 Tu Inventario').setDescription(desc||'No tienes items.').setFooter({ text: MESSAGES.FOOTER.DEFAULT }).setTimestamp();

                // rebuild component rows
                const cosmeticsRef = Object.values(groupedRef).map(({ item }) => item).filter(item => item.category === 'cosmetics');
                const rowsNew = [];
                if (cosmeticsRef.length > 0) {
                  let cr = new ActionRowBuilder(); let bc=0; const activeRef = dataManager.getActiveCosmetics(userId, guildId);
                  for (const cosmetic of cosmeticsRef) { const clean = cosmetic.name.replace(/[👑🌟🏅🥉🥈🥇🎨]/g,'').trim(); let isA=false; if (cosmetic.id.includes('title')) isA = activeRef.titleId===cosmetic.id; else if (cosmetic.id.includes('badge')) isA = activeRef.badgeId===cosmetic.id; else if (cosmetic.id.includes('color')) isA = activeRef.colorId===cosmetic.id; const b = new ButtonBuilder().setCustomId(`activate_cosmetic_${cosmetic.id}`).setLabel(`${isA?'✅':''} ${clean.substring(0,18)}`.trim()).setStyle(isA?ButtonStyle.Success:ButtonStyle.Primary); cr.addComponents(b); bc++; if (bc===5) { rowsNew.push(cr); cr=new ActionRowBuilder(); bc=0; } }
                  if (bc>0) rowsNew.push(cr);
                }
                const backR = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('shop_back_from_inventory').setLabel('Cerrar inventario').setStyle(ButtonStyle.Secondary));
                const finalNew = rowsNew.length>0? [...rowsNew, backR] : [backR];
                await shopMessage.edit({ embeds: [newEmbed], components: finalNew }).catch(()=>{});
              } catch (e) { console.error('Error rebuilding inventory (invCollector):', e); }
            }
          } catch (err) {
            console.error('Error en invCollector:', err);
          }
        });

        console.log(`🏪 ${interaction.user.tag} consultó su inventario`);
      }
    }

    // ==================== SISTEMA DE COSMÉTICOS ====================

    else if (commandName === 'cosmetics') {
      const subcommand = interaction.options.getSubcommand();
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;
      const userData = dataManager.getUser(userId, guildId);

      // /cosmetics ver - Ver todos los cosméticos
      if (subcommand === 'ver') {
        const cosmetics = userData.inventory.filter(inv => {
          const item = Object.values(CONSTANTS.SHOP.ITEMS).find(i => i.id === inv.itemId);
          return item && item.category === 'cosmetics';
        });

        if (cosmetics.length === 0) {
          return interaction.reply({
            content: '❌ No tienes cosméticos en tu inventario. Compra algunos en `/tienda`.',
            flags: MessageFlags.Ephemeral
          });
        }

        const activeCosmetics = dataManager.getActiveCosmetics(userId, guildId);
        
        let description = '**🎨 TUS COSMÉTICOS:**\n\n';

        // Agrupar por tipo
        const titles = [];
        const badges = [];
        const colors = [];

        for (const invItem of cosmetics) {
          const item = Object.values(CONSTANTS.SHOP.ITEMS).find(i => i.id === invItem.itemId);
          if (!item) continue;

          const isActive = (
            (item.id.includes('title') && activeCosmetics.titleId === item.id) ||
            (item.id.includes('badge') && activeCosmetics.badgeId === item.id) ||
            (item.id.includes('color') && activeCosmetics.colorId === item.id)
          );

          const indicator = isActive ? ' ✅' : '';

          if (item.id.includes('title')) {
            titles.push(`${item.name}${indicator}`);
          } else if (item.id.includes('badge')) {
            badges.push(`${item.name}${indicator}`);
          } else if (item.id.includes('color')) {
            colors.push(`${item.name}${indicator}`);
          }
        }

        if (titles.length > 0) {
          description += '**👑 Títulos:**\n' + titles.join('\n') + '\n\n';
        }
        if (badges.length > 0) {
          description += '**🏅 Badges:**\n' + badges.join('\n') + '\n\n';
        }
        if (colors.length > 0) {
          description += '**🎨 Colores de Rol:**\n' + colors.join('\n') + '\n\n';
        }

        const embed = new EmbedBuilder()
          .setColor(COLORS.PRIMARY)
          .setTitle('🎨 Tus Cosméticos')
          .setDescription(description)
          .setFooter({ text: 'Usa /cosmetics usar para activar un cosmético' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        console.log(`🎨 ${interaction.user.tag} consultó sus cosméticos`);
      }

      // /cosmetics usar - Activar cosmético
      else if (subcommand === 'usar') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const cosmeticType = interaction.options.getString('tipo');
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const userData = dataManager.getUser(userId, guildId);

        // Filtrar cosméticos disponibles por tipo
        const availableCosmetics = userData.inventory
          .map(inv => {
            const item = Object.values(CONSTANTS.SHOP.ITEMS).find(i => i.id === inv.itemId);
            return item;
          })
          .filter(item => {
            if (!item) return false;
            if (cosmeticType === 'title') return item.id.includes('title');
            if (cosmeticType === 'badge') return item.id.includes('badge');
            if (cosmeticType === 'color') return item.id.includes('color');
            return false;
          });

        if (availableCosmetics.length === 0) {
          return interaction.editReply(`❌ No tienes cosméticos de tipo **${cosmeticType}** en tu inventario.`);
        }

        // Crear menú de selección
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('cosmetic_select')
          .setPlaceholder('Selecciona un cosmético...')
          .setMinValues(1)
          .setMaxValues(1);

        for (const cosmetic of availableCosmetics) {
          const cleanName = cosmetic.name.replace(/[👑🌟🏅🥉🥈🥇🎨]/g, '').trim();
          selectMenu.addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel(cleanName)
              .setValue(cosmetic.id)
              .setDescription(cosmetic.description)
          );
        }

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const typeEmoji = {
          'title': '👑',
          'badge': '🏅',
          'color': '🎨'
        };

        const typeLabel = {
          'title': 'Títulos',
          'badge': 'Badges',
          'color': 'Colores de Rol'
        };

        const selectMessage = await interaction.editReply({
          content: `Selecciona un **${typeLabel[cosmeticType]}** ${typeEmoji[cosmeticType]} para activar:`,
          components: [row],
          flags: MessageFlags.Ephemeral
        });

        // Collector para la selección
        const collector = selectMessage.createMessageComponentCollector({
          filter: (i) => i.user.id === userId,
          time: 60000 // 1 minuto
        });

        collector.on('collect', async (i) => {
          if (i.customId === 'cosmetic_select') {
            const selectedId = i.values[0];
            const selectedCosmetic = Object.values(CONSTANTS.SHOP.ITEMS).find(item => item.id === selectedId);

            try {
              dataManager.setActiveCosmetic(userId, guildId, cosmeticType, selectedId);
              await dataManager.saveUsers();

              // Si es un cosmético de color, crear/modificar el rol
              if (cosmeticType === 'color') {
                const colorValue = selectedCosmetic.effect.roleColor;
                const roleName = `🎨 ${selectedCosmetic.name.replace(/🥉🥈🥇/g, '').trim()}`;

                try {
                  // Obtener miembro
                  const member = await interaction.guild.members.fetch(userId).catch(() => null);
                  if (!member) {
                    return i.reply({
                      content: '❌ No se pudo encontrar tu usuario en el servidor.',
                      flags: MessageFlags.Ephemeral
                    });
                  }

                  // Buscar rol existente del usuario
                  let cosmeticRole = member.roles.cache.find(role => role.name.startsWith('🎨'));

                  // Si existe un rol anterior, eliminarlo
                  if (cosmeticRole) {
                    await member.roles.remove(cosmeticRole);
                    // Solo eliminar si no tiene otros miembros
                    const rolesWithMember = await cosmeticRole.members;
                    if (rolesWithMember.size === 0) {
                      await cosmeticRole.delete().catch(() => {});
                    }
                  }

                  // Crear nuevo rol con el color
                  cosmeticRole = await interaction.guild.roles.create({
                    name: roleName,
                    color: colorValue,
                    reason: `Cosmético activado: ${selectedCosmetic.name}`
                  });

                  // Asignar rol al usuario
                  await member.roles.add(cosmeticRole);

                  await i.reply({
                    content: `✅ ¡Cosmético activado! Se te ha asignado el rol **${roleName}** con color personalizado.`,
                    flags: MessageFlags.Ephemeral
                  });
                } catch (roleError) {
                  console.error('Error creando/modificando rol:', roleError);
                  await i.reply({
                    content: `✅ ¡Cosmético activado! Nota: No se pudo crear el rol automáticamente debido a permisos.`,
                    flags: MessageFlags.Ephemeral
                  });
                }
              } else {
                await i.reply({
                  content: `✅ ¡${selectedCosmetic.name} activado! Tu cambio será visible en tu perfil.\n\nUsa \`/perfil\` para verlo.`,
                  flags: MessageFlags.Ephemeral
                });
              }

              console.log(`🎨 ${interaction.user.tag} activó cosmético: ${selectedCosmetic.name}`);
            } catch (error) {
              console.error('Error activando cosmético:', error);
              await i.reply({
                content: `❌ Error al activar el cosmético: ${error.message}`,
                flags: MessageFlags.Ephemeral
              });
            }
          }
        });

        collector.on('end', () => {
          selectMenu.setDisabled(true);
          selectMessage.edit({ components: [row] }).catch(() => {});
        });
      }

      // /cosmetics deseleccionar - Desactivar cosmético
      else if (subcommand === 'deseleccionar') {
        const cosmeticType = interaction.options.getString('tipo');
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const userData = dataManager.getUser(userId, guildId);

        try {
          // Si es color, eliminar el rol
          if (cosmeticType === 'color') {
            const member = await interaction.guild.members.fetch(userId).catch(() => null);
            if (member) {
              const cosmeticRole = member.roles.cache.find(role => role.name.startsWith('🎨'));
              if (cosmeticRole) {
                await member.roles.remove(cosmeticRole);
                // Eliminar rol si no tiene otros miembros
                const rolesWithMember = await cosmeticRole.members;
                if (rolesWithMember.size === 0) {
                  await cosmeticRole.delete().catch(() => {});
                }
              }
            }
          }

          // Desactivar el cosmético
          dataManager.setActiveCosmetic(userId, guildId, cosmeticType, null);
          await dataManager.saveUsers();

          const typeLabel = {
            'title': 'Título',
            'badge': 'Badge',
            'color': 'Color de Rol'
          };

          await interaction.reply({
            content: `✅ ${typeLabel[cosmeticType]} desactivado.`,
            flags: MessageFlags.Ephemeral
          });

          console.log(`🎨 ${interaction.user.tag} desactivó cosmético de tipo: ${cosmeticType}`);
        } catch (error) {
          console.error('Error desactivando cosmético:', error);
          await interaction.reply({
            content: `❌ Error al desactivar el cosmético: ${error.message}`,
            flags: MessageFlags.Ephemeral
          });
        }
      }
    }

    // ==================== SISTEMA DE MÚSICA (DOJO DEL SONIDO) ====================
    
    // Reproducción básica
    else if (commandName === 'tocar' || commandName === 'play') {
      await musicHandlers.handlePlay(interaction);
    }
    else if (commandName === 'pausar' || commandName === 'pause') {
      await musicHandlers.handlePause(interaction);
    }
    else if (commandName === 'reanudar' || commandName === 'resume') {
      await musicHandlers.handleResume(interaction);
    }
    else if (commandName === 'siguiente' || commandName === 'skip') {
      await musicHandlers.handleSkip(interaction);
    }
    else if (commandName === 'detener' || commandName === 'stop') {
      await musicHandlers.handleStop(interaction);
    }
    // Gestión de cola
    else if (commandName === 'cola' || commandName === 'queue') {
      await musicHandlers.handleQueue(interaction);
    }
    else if (commandName === 'ahora' || commandName === 'sonando' || commandName === 'nowplaying' || commandName === 'np') {
      await musicHandlers.handleNowPlaying(interaction);
    }
    else if (commandName === 'limpiar' || commandName === 'clear') {
      await musicHandlers.handleClear(interaction);
    }
    else if (commandName === 'saltar' || commandName === 'jump') {
      await musicHandlers.handleJump(interaction);
    }
    else if (commandName === 'remover' || commandName === 'remove') {
      await musicHandlers.handleRemove(interaction);
    }
    // Control y opciones
    else if (commandName === 'volumen' || commandName === 'volume') {
      await musicHandlers.handleVolume(interaction);
    }
    else if (commandName === 'buscar' || commandName === 'search') {
      await musicHandlers.handleSearch(interaction);
    }
    else if (commandName === 'mezclar' || commandName === 'shuffle') {
      await musicHandlers.handleShuffle(interaction);
    }
    else if (commandName === 'repetir' || commandName === 'loop') {
      await musicHandlers.handleLoop(interaction);
    }

    // ==================== PLAYLISTS ====================
    else if (commandName === 'playlist') {
      const subcommand = interaction.options.getSubcommand();
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;
      const userData = dataManager.getUser(userId, guildId);

      if (!userData.playlists) {
        userData.playlists = [];
      }

      // CREAR: Crea una playlist vacía
      if (subcommand === 'crear') {
        const nombre = interaction.options.getString('nombre');

        // Validar nombre
        if (nombre.length < 2 || nombre.length > 50) {
          return interaction.reply({
            content: MESSAGES.PLAYLISTS.NAME_TOO_SHORT,
            flags: MessageFlags.Ephemeral
          });
        }

        // Verificar si ya existe
        const existingPlaylist = userData.playlists.find(p => p.name.toLowerCase() === nombre.toLowerCase());
        if (existingPlaylist) {
          return interaction.reply({
            content: MESSAGES.PLAYLISTS.ALREADY_EXISTS(nombre),
            flags: MessageFlags.Ephemeral
          });
        }

        // Verificar límite
        const MAX_PLAYLISTS = CONSTANTS.MUSIC?.MAX_PLAYLISTS_PER_USER || 20;
        if (userData.playlists.length >= MAX_PLAYLISTS) {
          return interaction.reply({
            content: MESSAGES.PLAYLISTS.LIMIT_REACHED(MAX_PLAYLISTS),
            flags: MessageFlags.Ephemeral
          });
        }

        // Crear playlist
        const newPlaylist = {
          name: nombre,
          songs: [],
          createdAt: Date.now(),
          playCount: 0
        };

        userData.playlists.push(newPlaylist);
        dataManager.updateUser(userId, guildId, { playlists: userData.playlists });

        return interaction.reply({
          content: MESSAGES.PLAYLISTS.CREATED(nombre),
          flags: MessageFlags.Ephemeral
        });
      }

      // GUARDAR: Guarda la cola actual como playlist
      else if (subcommand === 'guardar') {
        const nombre = interaction.options.getString('nombre');
        const musicManager = require('./utils/musicManager');
        const queue = musicManager.getQueue(guildId);

        if (!queue || (queue.songs.length === 0 && !queue.nowPlaying)) {
          return interaction.reply({
            content: MESSAGES.PLAYLISTS.QUEUE_EMPTY,
            flags: MessageFlags.Ephemeral
          });
        }

        // Validar nombre
        if (nombre.length < 2 || nombre.length > 50) {
          return interaction.reply({
            content: MESSAGES.PLAYLISTS.NAME_TOO_SHORT,
            flags: MessageFlags.Ephemeral
          });
        }

        // Verificar si ya existe
        const existingPlaylist = userData.playlists.find(p => p.name.toLowerCase() === nombre.toLowerCase());
        if (existingPlaylist) {
          return interaction.reply({
            content: MESSAGES.PLAYLISTS.ALREADY_EXISTS(nombre),
            flags: MessageFlags.Ephemeral
          });
        }

        // Verificar límite
        const MAX_PLAYLISTS = CONSTANTS.MUSIC?.MAX_PLAYLISTS_PER_USER || 20;
        if (userData.playlists.length >= MAX_PLAYLISTS) {
          return interaction.reply({
            content: MESSAGES.PLAYLISTS.LIMIT_REACHED(MAX_PLAYLISTS),
            flags: MessageFlags.Ephemeral
          });
        }

        // Obtener todas las canciones
        const allSongs = [];
        if (queue.nowPlaying) {
          allSongs.push(queue.nowPlaying);
        }
        allSongs.push(...queue.songs);

        // Crear playlist
        const newPlaylist = {
          name: nombre,
          songs: allSongs.map(song => ({
            title: song.title,
            url: song.url,
            duration: song.duration,
            thumbnail: song.thumbnail,
            channel: song.channel
          })),
          createdAt: Date.now(),
          playCount: 0
        };

        userData.playlists.push(newPlaylist);
        dataManager.updateUser(userId, guildId, { playlists: userData.playlists });

        return interaction.reply({
          content: MESSAGES.PLAYLISTS.SAVED(nombre, allSongs.length),
          flags: MessageFlags.Ephemeral
        });
      }

      // CARGAR: Carga una playlist a la cola
      else if (subcommand === 'cargar') {
        const nombre = interaction.options.getString('nombre');
        const playlist = userData.playlists.find(p => p.name.toLowerCase() === nombre.toLowerCase());

        if (!playlist) {
          return interaction.reply({
            content: MESSAGES.PLAYLISTS.NOT_FOUND(nombre),
            flags: MessageFlags.Ephemeral
          });
        }

        if (playlist.songs.length === 0) {
          return interaction.reply({
            content: MESSAGES.PLAYLISTS.EMPTY(nombre),
            flags: MessageFlags.Ephemeral
          });
        }

        // Verificar que el usuario esté en un canal de voz
        if (!interaction.member.voice.channel) {
          return interaction.reply({
            content: MESSAGES.MUSIC.NOT_IN_VOICE,
            flags: MessageFlags.Ephemeral
          });
        }

        await interaction.deferReply();

        const musicManager = require('./utils/musicManager');
        let queue = musicManager.getQueue(guildId);

        // Crear cola si no existe
        if (!queue) {
          const ServerQueue = require('./utils/musicQueue');
          queue = new ServerQueue(
            interaction.guild,
            interaction.member.voice.channel,
            interaction.channel
          );
          musicManager.setQueue(guildId, queue);
        }

        // Agregar todas las canciones a la cola
        let addedCount = 0;
        for (const song of playlist.songs) {
          if (queue.songs.length < (CONSTANTS.MUSIC?.MAX_QUEUE_SIZE || 100)) {
            queue.addSong(song);
            addedCount++;
          }
        }

        // Incrementar contador de reproducción
        playlist.playCount++;
        dataManager.updateUser(userId, guildId, { playlists: userData.playlists });

        // Si no hay nada reproduciéndose, empezar
        if (!queue.nowPlaying) {
          await musicManager.playSong(queue);
        }

        return interaction.editReply({
          content: MESSAGES.PLAYLISTS.LOADED(nombre, addedCount)
        });
      }

      // LISTAR: Muestra todas las playlists con botones para reproducir
      else if (subcommand === 'listar') {
        if (userData.playlists.length === 0) {
          return interaction.reply({
            content: MESSAGES.PLAYLISTS.NO_PLAYLISTS,
            flags: MessageFlags.Ephemeral
          });
        }

        const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

        const embed = new EmbedBuilder()
          .setColor(COLORS.PRIMARY)
          .setTitle(`${EMOJIS.SHAKUHACHI} Tus Playlists del Dojo`)
          .setDescription(
            userData.playlists.map((p, i) =>
              `**${i + 1}.** 📚 **${p.name}**\n` +
              `   └ 🎵 ${p.songs.length} cancion${p.songs.length !== 1 ? 'es' : ''} • ▶️ ${p.playCount} reproducciones`
            ).join('\n\n') +
            '\n\n💡 **Haz clic en un botón para cargar una playlist**'
          )
          .setFooter({ text: MESSAGES.MUSIC.FOOTER })
          .setTimestamp();

        // Crear botones para cada playlist (máximo 25 playlists = 5 filas de 5 botones)
        const buttons = [];
        const maxPlaylists = Math.min(userData.playlists.length, 25);

        for (let i = 0; i < maxPlaylists; i++) {
          const playlist = userData.playlists[i];
          // Crear customId único con el índice de la playlist
          buttons.push(
            new ButtonBuilder()
              .setCustomId(`playlist_load_${userId}_${i}`)
              .setLabel(`${i + 1}. ${playlist.name.substring(0, 50)}`)
              .setStyle(ButtonStyle.Primary)
              .setEmoji('▶️')
          );
        }

        // Organizar botones en filas (máximo 5 botones por fila)
        const rows = [];
        for (let i = 0; i < buttons.length; i += 5) {
          const row = new ActionRowBuilder().addComponents(buttons.slice(i, i + 5));
          rows.push(row);
        }

        return interaction.reply({
          embeds: [embed],
          components: rows,
          flags: MessageFlags.Ephemeral
        });
      }

      // VER: Muestra las canciones de una playlist
      else if (subcommand === 'ver') {
        const nombre = interaction.options.getString('nombre');
        const playlist = userData.playlists.find(p => p.name.toLowerCase() === nombre.toLowerCase());

        if (!playlist) {
          return interaction.reply({
            content: MESSAGES.PLAYLISTS.NOT_FOUND(nombre),
            flags: MessageFlags.Ephemeral
          });
        }

        if (playlist.songs.length === 0) {
          return interaction.reply({
            content: MESSAGES.PLAYLISTS.EMPTY(nombre),
            flags: MessageFlags.Ephemeral
          });
        }

        const { EmbedBuilder } = require('discord.js');

        // Mostrar hasta 10 canciones
        const songsToShow = playlist.songs.slice(0, 10);
        const remaining = playlist.songs.length - 10;

        const embed = new EmbedBuilder()
          .setColor(COLORS.PRIMARY)
          .setTitle(`${EMOJIS.SHAKUHACHI} Playlist: ${playlist.name}`)
          .setDescription(
            songsToShow.map((song, i) =>
              `**${i + 1}.** [${song.title}](${song.url})\n` +
              `   └ ⏱️ ${song.duration || 'Desconocido'}`
            ).join('\n\n') +
            (remaining > 0 ? `\n\n*...y ${remaining} canción${remaining !== 1 ? 'es' : ''} más*` : '')
          )
          .addFields(
            { name: '🎵 Total', value: `${playlist.songs.length} canciones`, inline: true },
            { name: '▶️ Reproducciones', value: `${playlist.playCount} veces`, inline: true },
            { name: '📅 Creada', value: `<t:${Math.floor(playlist.createdAt / 1000)}:R>`, inline: true }
          )
          .setFooter({ text: MESSAGES.MUSIC.FOOTER })
          .setTimestamp();

        return interaction.reply({
          embeds: [embed],
          flags: MessageFlags.Ephemeral
        });
      }

      // ELIMINAR: Elimina una playlist
      else if (subcommand === 'eliminar') {
        const nombre = interaction.options.getString('nombre');
        const playlistIndex = userData.playlists.findIndex(p => p.name.toLowerCase() === nombre.toLowerCase());

        if (playlistIndex === -1) {
          return interaction.reply({
            content: MESSAGES.PLAYLISTS.NOT_FOUND(nombre),
            flags: MessageFlags.Ephemeral
          });
        }

        userData.playlists.splice(playlistIndex, 1);
        dataManager.updateUser(userId, guildId, { playlists: userData.playlists });

        return interaction.reply({
          content: MESSAGES.PLAYLISTS.DELETED(nombre),
          flags: MessageFlags.Ephemeral
        });
      }

      // RENOMBRAR: Cambia el nombre de una playlist
      else if (subcommand === 'renombrar') {
        const nombreActual = interaction.options.getString('nombre_actual');
        const nombreNuevo = interaction.options.getString('nombre_nuevo');

        const playlist = userData.playlists.find(p => p.name.toLowerCase() === nombreActual.toLowerCase());

        if (!playlist) {
          return interaction.reply({
            content: MESSAGES.PLAYLISTS.NOT_FOUND(nombreActual),
            flags: MessageFlags.Ephemeral
          });
        }

        // Validar nuevo nombre
        if (nombreNuevo.length < 2 || nombreNuevo.length > 50) {
          return interaction.reply({
            content: MESSAGES.PLAYLISTS.NAME_TOO_SHORT,
            flags: MessageFlags.Ephemeral
          });
        }

        // Verificar que el nuevo nombre no exista
        const existingPlaylist = userData.playlists.find(p => p.name.toLowerCase() === nombreNuevo.toLowerCase());
        if (existingPlaylist) {
          return interaction.reply({
            content: MESSAGES.PLAYLISTS.ALREADY_EXISTS(nombreNuevo),
            flags: MessageFlags.Ephemeral
          });
        }

        playlist.name = nombreNuevo;
        dataManager.updateUser(userId, guildId, { playlists: userData.playlists });

        return interaction.reply({
          content: MESSAGES.PLAYLISTS.RENAMED(nombreActual, nombreNuevo),
          flags: MessageFlags.Ephemeral
        });
      }

      // AGREGAR: Agrega una canción a una playlist
      else if (subcommand === 'agregar') {
        const nombrePlaylist = interaction.options.getString('playlist');
        const cancion = interaction.options.getString('cancion');

        const playlist = userData.playlists.find(p => p.name.toLowerCase() === nombrePlaylist.toLowerCase());

        if (!playlist) {
          return interaction.reply({
            content: MESSAGES.PLAYLISTS.NOT_FOUND(nombrePlaylist),
            flags: MessageFlags.Ephemeral
          });
        }

        // Verificar límite de canciones
        const MAX_SONGS = CONSTANTS.MUSIC?.MAX_PLAYLIST_SIZE || 50;
        if (playlist.songs.length >= MAX_SONGS) {
          return interaction.reply({
            content: MESSAGES.PLAYLISTS.SONG_LIMIT_REACHED(MAX_SONGS),
            flags: MessageFlags.Ephemeral
          });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
          const musicManager = require('./utils/musicManager');

          // Buscar la canción
          const results = await musicManager.searchSongs(cancion, { limit: 1 });

          if (!results || results.length === 0) {
            return interaction.editReply({
              content: MESSAGES.MUSIC.NO_RESULTS
            });
          }

          const song = results[0];

          // Agregar a la playlist
          playlist.songs.push({
            title: song.title,
            url: song.url,
            duration: song.duration,
            thumbnail: song.thumbnail,
            channel: song.channel
          });

          dataManager.updateUser(userId, guildId, { playlists: userData.playlists });

          return interaction.editReply({
            content: MESSAGES.PLAYLISTS.SONG_ADDED(song.title, nombrePlaylist)
          });
        } catch (error) {
          console.error('Error agregando canción a playlist:', error);
          return interaction.editReply({
            content: MESSAGES.ERRORS.GENERIC
          });
        }
      }

      // QUITAR: Quita una canción de una playlist
      else if (subcommand === 'quitar') {
        const nombrePlaylist = interaction.options.getString('playlist');
        const posicion = interaction.options.getInteger('posicion');

        const playlist = userData.playlists.find(p => p.name.toLowerCase() === nombrePlaylist.toLowerCase());

        if (!playlist) {
          return interaction.reply({
            content: MESSAGES.PLAYLISTS.NOT_FOUND(nombrePlaylist),
            flags: MessageFlags.Ephemeral
          });
        }

        if (playlist.songs.length === 0) {
          return interaction.reply({
            content: MESSAGES.PLAYLISTS.EMPTY(nombrePlaylist),
            flags: MessageFlags.Ephemeral
          });
        }

        // Validar posición
        if (posicion < 1 || posicion > playlist.songs.length) {
          return interaction.reply({
            content: `❌ Posición inválida. La playlist tiene ${playlist.songs.length} canción${playlist.songs.length !== 1 ? 'es' : ''}.`,
            flags: MessageFlags.Ephemeral
          });
        }

        const removedSong = playlist.songs.splice(posicion - 1, 1)[0];
        dataManager.updateUser(userId, guildId, { playlists: userData.playlists });

        return interaction.reply({
          content: MESSAGES.PLAYLISTS.SONG_REMOVED(removedSong.title, nombrePlaylist),
          flags: MessageFlags.Ephemeral
        });
      }
    }

    // ==================== AYUDA DE MÚSICA ====================
    else if (commandName === 'ayudamusica' || commandName === 'helpmusic') {
      const { EmbedBuilder } = require('discord.js');

      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(`${EMOJIS.SHAKUHACHI} Comandos del Dojo del Sonido`)
        .setDescription('El shakuhachi resuena en el dojo. Estos son los comandos disponibles:')
        .addFields(
          {
            name: '🎵 Reproducción',
            value: '`/tocar [canción/url]` - Reproduce una canción\n' +
                   '`/pausar` - Pausa la reproducción\n' +
                   '`/reanudar` - Reanuda la reproducción\n' +
                   '`/siguiente` - Salta a la siguiente canción\n' +
                   '`/detener` - Detiene la música y limpia la cola'
          },
          {
            name: '📋 Cola',
            value: '`/cola` - Muestra la cola de reproducción\n' +
                   '`/ahora` - Muestra la canción actual\n' +
                   '`/limpiar` - Limpia la cola\n' +
                   '`/saltar [posición]` - Salta a una canción específica\n' +
                   '`/remover [posición]` - Quita una canción de la cola'
          },
          {
            name: '🎛️ Control',
            value: '`/volumen [0-100]` - Ajusta el volumen\n' +
                   '`/mezclar` - Mezcla la cola aleatoriamente\n' +
                   '`/repetir [modo]` - Cambia el modo de repetición\n' +
                   '`/buscar [término]` - Busca canciones'
          },
          {
            name: '📚 Playlists',
            value: '`/playlist crear [nombre]` - Crea una playlist vacía\n' +
                   '`/playlist guardar [nombre]` - Guarda la cola actual\n' +
                   '`/playlist cargar [nombre]` - Carga una playlist\n' +
                   '`/playlist listar` - Muestra tus playlists\n' +
                   '`/playlist ver [nombre]` - Ver canciones de una playlist\n' +
                   '`/playlist eliminar [nombre]` - Elimina una playlist\n' +
                   '`/playlist renombrar [actual] [nuevo]` - Renombra\n' +
                   '`/playlist agregar [playlist] [canción]` - Agrega canción\n' +
                   '`/playlist quitar [playlist] [posición]` - Quita canción'
          }
        )
        .setFooter({ text: MESSAGES.MUSIC.FOOTER })
        .setTimestamp();

      return interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
      });
    }

    // Comando no reconocido
    else {
      console.warn(`⚠️ Comando no reconocido: ${commandName} (usado por ${interaction.user.tag})`);
      await interaction.reply({
        content: `❌ Comando \`/${commandName}\` no reconocido. Usa \`/help\` para ver todos los comandos disponibles.`,
        flags: MessageFlags.Ephemeral
      });
    }

  } catch (error) {
    console.error(`Error ejecutando comando slash ${commandName}:`, error);
    const errorMessage = '❌ Ocurrió un error al ejecutar este comando. Por favor intenta de nuevo más tarde.';

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(errorMessage);
    } else {
      await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
    }
  }
});
client.on(Events.Error, (error) => {
  console.error('Error del cliente de Discord:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Rechazo de promesa no manejado:', error);
});

// ==================== GRACEFUL SHUTDOWN ====================
// Guarda todos los datos antes de cerrar el bot
async function gracefulShutdown(signal) {
  console.log(`\n${EMOJIS.WARNING} Señal ${signal} recibida. Iniciando cierre graceful...`);

  try {
    // Guardar todos los datos
    await dataManager.shutdown();

    // Destruir el cliente de Discord
    client.destroy();
    console.log(`${EMOJIS.SUCCESS} Bot desconectado correctamente`);

    console.log(`${EMOJIS.FLAG} Cierre completado. Que el código Bushido te proteja, guerrero.\n`);
    process.exit(0);
  } catch (error) {
    console.error(`${EMOJIS.ERROR} Error durante cierre graceful:`, error);
    process.exit(1);
  }
}

// Capturar señales de cierre
process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // Ctrl+C
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Kill command

// Iniciar sesión en Discord
client.login(process.env.DISCORD_TOKEN).catch((error) => {
  console.error('Falló el inicio de sesión:', error);
  console.error('\n⚠️  SOLUCIÓN: Asegúrate de haber habilitado los "Privileged Gateway Intents" en el Discord Developer Portal');
  console.error('Instrucciones: https://discord.com/developers/applications → Tu Bot → Bot → Privileged Gateway Intents');
  console.error('Habilita: SERVER MEMBERS INTENT y MESSAGE CONTENT INTENT\n');
  process.exit(1);
});





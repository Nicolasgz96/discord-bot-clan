/**
 * DEMON HUNTER BOT - VoiceStateUpdate Event
 * Sistema de honor pasivo en canales de voz y auto-desconexión del bot
 */

const { Events } = require('discord.js');
const CONSTANTS = require('../src/config/constants');
const MESSAGES = require('../src/config/messages');
const EMOJIS = require('../src/config/emojis');
const { isConnected, getVoiceChannelInfo, disconnectFromVoiceChannel } = require('../utils/voiceManager');

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState, { client, dataManager, voiceTimeTracking, lastVoiceSpeakers }) {
    try {
      const guildId = oldState.guild.id;
      const userId = oldState.member.id;
      const trackingKey = `${userId}_${guildId}`;

      // ========== SISTEMA DE HONOR PASIVO: VOZ ===========
      // Rastrear cuando usuarios se unen/salen de canales de voz
      // Exclude bot users from passive rewards
      if (oldState.member.user.bot) return;

      // Usuario se unió a un canal de voz
      if (!oldState.channelId && newState.channelId) {
        // Usuario entró a voz
        voiceTimeTracking.set(trackingKey, {
          joinedAt: Date.now(),
          lastHonorGrant: Date.now()
        });
        // console.log(`[Voice] ${oldState.member.user.tag} entró a voz`);
      }

      // Usuario salió de un canal de voz
      else if (oldState.channelId && !newState.channelId) {
        // Usuario salió de voz - otorgar honor por tiempo total
        const tracking = voiceTimeTracking.get(trackingKey);

        if (tracking) {
          // ✅ FIX BUG #1: Calcular minutos DESDE el último grant para evitar duplicación
          const minutesSinceLastGrant = Math.floor((Date.now() - tracking.lastHonorGrant) / 60000);
          const totalMinutes = Math.floor((Date.now() - tracking.joinedAt) / 60000);

          if (minutesSinceLastGrant > 0) {
            // Otorgar honor y koku solo por los minutos RESTANTES (no por el total)
            const honorToGrant = minutesSinceLastGrant * CONSTANTS.HONOR.PER_VOICE_MINUTE;
            const kokuToGrant = Math.floor(minutesSinceLastGrant * CONSTANTS.ECONOMY.PER_VOICE_MINUTE);

            try {
              const userData = dataManager.addHonor(userId, guildId, honorToGrant);
              // Exclude bot user from earning koku
              if (userData.userId !== client.user.id && !userData.isBot) {
                userData.koku = (userData.koku || 0) + kokuToGrant;
              }

              // Notificar si hubo ascenso de rango por tiempo en voz
              try {
                const meta = userData.__lastHonorChange;
                if (meta && meta.rankChanged) {
                  const usr = await client.users.fetch(userId).catch(() => null);
                  if (usr) {
                    await usr.send(`${MESSAGES.HONOR.RANK_UP(meta.newRank)}\n${MESSAGES.SUCCESS.HONOR_GAINED(meta.amount)}`).catch(() => {});
                  }
                }
              } catch (e) {
                // ignore
              }

              // Actualizar estadísticas de voz (usar tiempo TOTAL, no solo restante)
              if (userData.stats) {
                userData.stats.voiceMinutes = (userData.stats.voiceMinutes || 0) + totalMinutes;
              }

              // Actualizar honor total del clan si el usuario pertenece a uno
              if (userData.clanId) {
                dataManager.updateClanStats(userData.clanId);
              }

              // Marcar datos como modificados
              dataManager.dataModified.users = true;

              console.log(`${EMOJIS.VOICE} ${oldState.member.user.tag} ganó ${honorToGrant} honor + ${kokuToGrant} koku por ${minutesSinceLastGrant} minutos restantes en voz (total: ${totalMinutes} min)`);
            } catch (error) {
              console.error('Error otorgando honor/koku por voz:', error.message);
            }
          }

          voiceTimeTracking.delete(trackingKey);
        }
      }

      // Usuario cambió de canal (se mantiene en voz)
      else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        // Solo actualizar el timestamp de cambio, no resetear el tiempo total
        // El tracking continúa desde el joinedAt original
        // console.log(`[Voice] ${oldState.member.user.tag} cambió de canal de voz`);
      }

      // ========== OTORGAR HONOR CADA 10 MINUTOS MIENTRAS ESTÁ EN VOZ ==========
      // Verificar si el usuario lleva 10+ minutos en voz
      const tracking = voiceTimeTracking.get(trackingKey);
      if (tracking && newState.channelId) {
        const minutesSinceLastGrant = Math.floor((Date.now() - tracking.lastHonorGrant) / 60000);

        // ✅ FIX BUG #5: Cada 10 minutos, otorgar solo 10 honor (koku se calcula al salir)
        if (minutesSinceLastGrant >= 10) {
          try {
            const userData = dataManager.addHonor(userId, guildId, CONSTANTS.HONOR.PER_VOICE_10MIN_BONUS);
            // Koku se calcula al salir (0.5 koku/min) para evitar duplicación
            tracking.lastHonorGrant = Date.now();

            // Actualizar honor total del clan si el usuario pertenece a uno
            if (userData.clanId) {
              dataManager.updateClanStats(userData.clanId);
            }

            // Notificar si hubo ascenso de rango por bono de voz
            try {
              const meta = userData.__lastHonorChange;
              if (meta && meta.rankChanged) {
                const usr = await client.users.fetch(userId).catch(() => null);
                if (usr) await usr.send(`${MESSAGES.HONOR.RANK_UP(meta.newRank)}\n${MESSAGES.SUCCESS.HONOR_GAINED(meta.amount)}`).catch(() => {});
              }
            } catch (e) {
              // ignore
            }

            // Marcar datos como modificados
            dataManager.dataModified.users = true;

            console.log(`${EMOJIS.HONOR} ${oldState.member.user.tag} ganó 10 honor por 10 minutos en voz activa (koku se calcula al salir)`);
          } catch (error) {
            console.error('Error otorgando honor/koku por voz activa:', error.message);
          }
        }
      }
      // ========== FIN SISTEMA DE HONOR PASIVO: VOZ ==========

      // ========== DESCONEXIÓN AUTOMÁTICA DEL BOT ==========
      // Solo procesar si el bot está conectado en este servidor
      if (!isConnected(guildId)) return;

      const voiceChannelInfo = getVoiceChannelInfo(guildId);
      if (!voiceChannelInfo) return;

      const botVoiceChannelId = voiceChannelInfo.channelId;

      // Obtener el canal de voz donde está el bot
      const botVoiceChannel = oldState.guild.channels.cache.get(botVoiceChannelId);
      if (!botVoiceChannel) return;

      // Contar usuarios humanos (no bots) en el canal
      const humanMembers = botVoiceChannel.members.filter(member => !member.user.bot);

      // Si no hay usuarios humanos, desconectar el bot
      if (humanMembers.size === 0) {
        console.log(`🔇 Canal de voz vacío en ${oldState.guild.name}, desconectando bot...`);
        disconnectFromVoiceChannel(guildId);
        // Limpiar registro de últimos hablantes
        lastVoiceSpeakers.delete(guildId);

        // Opcional: enviar mensaje en el último canal donde se usó un comando
        // (esto requeriría guardar el canal, así que lo omitimos por ahora)
      }
    } catch (error) {
      console.error('Error en VoiceStateUpdate:', error);
    }
  }
};

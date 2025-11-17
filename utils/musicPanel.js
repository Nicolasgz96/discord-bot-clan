const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const EMOJIS = require('../src/config/emojis');
const COLORS = require('../src/config/colors');
const MESSAGES = require('../src/config/messages');

/**
 * MUSIC PANEL - SISTEMA DE INTERFAZ INTERACTIVA TIPO HYDRA
 *
 * Este módulo crea y gestiona un panel musical permanente con botones interactivos.
 * Similar a Hydra Bot, mantiene el canal limpio actualizando un solo mensaje.
 *
 * Características:
 * - Mensaje embed persistente que se actualiza
 * - Botones interactivos para controlar la música
 * - Temática samurai (Dojo del Sonido)
 * - Muestra canción actual, cola y estado del reproductor
 */

class MusicPanel {
  /**
   * Crea el embed con información de la canción actual
   */
  static createNowPlayingEmbed(queue) {
    const song = queue.nowPlaying;
    if (!song) {
      return new EmbedBuilder()
        .setColor(COLORS.ERROR)
        .setTitle(`${EMOJIS.SHAKUHACHI} Dojo del Sonido`)
        .setDescription('*Silencio en el dojo...*\n\nNo hay música reproduciéndose actualmente.')
        .setFooter({ text: MESSAGES.MUSIC?.FOOTER || MESSAGES.FOOTER?.DEFAULT || '🎋 Dojo del Sonido • Demon Hunter' })
        .setTimestamp();
    }

    // Calcular progreso
    const progressBar = this.createProgressBar(queue);

    // Estado del reproductor
    const statusEmojis = {
      paused: '⏸️',
      playing: '▶️',
      idle: '⏹️'
    };
    const status = queue.isPaused ? 'paused' : (queue.isPlaying ? 'playing' : 'idle');
    const statusText = queue.isPaused ? 'PAUSADO' : (queue.isPlaying ? 'REPRODUCIENDO' : 'DETENIDO');

    // Modo de repetición
    const loopEmojis = {
      off: '🔁',
      song: '🔂',
      queue: '🔁'
    };
    const loopText = {
      off: 'Desactivado',
      song: 'Canción',
      queue: 'Cola'
    };

    // Construir descripción
    // Formatear duración (puede ser número o string)
    const durationFormatted = typeof song.duration === 'number'
      ? this.formatTime(song.duration)
      : song.duration;
    
    let description = `${statusEmojis[status]} **${statusText}**\n\n`;
    description += `**${song.title}**\n`;
    description += `🔗 [Enlace](${song.url})\n`;
    description += `⏱️ ${durationFormatted}\n`;
    description += `👤 Solicitado por: <@${song.requestedBy}>\n\n`;
    description += `${progressBar}\n\n`;
    description += `🔊 Volumen: **${queue.volume}%** | ${loopEmojis[queue.loop]} Repetir: **${loopText[queue.loop]}**\n`;
    description += `📋 Canciones en cola: **${queue.songs.length}**`;

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setAuthor({
        name: 'Dojo del Sonido - Panel Musical',
        iconURL: 'https://i.imgur.com/AfFp7pu.png'
      })
      .setDescription(description)
      .setThumbnail(song.thumbnail || 'https://i.imgur.com/AfFp7pu.png')
      .setFooter({ text: MESSAGES.MUSIC?.FOOTER || MESSAGES.FOOTER?.DEFAULT || '🎋 Dojo del Sonido • Demon Hunter' })
      .setTimestamp();

    // Agregar próximas canciones si hay cola
    if (queue.songs.length > 0) {
      const nextSongs = queue.songs.slice(0, 3).map((s, i) => {
        const dur = typeof s.duration === 'number' ? this.formatTime(s.duration) : s.duration;
        return `**${i + 1}.** ${s.title} [${dur}]`;
      }).join('\n');
      embed.addFields({
        name: '⏭️ Próximas canciones',
        value: nextSongs + (queue.songs.length > 3 ? `\n*...y ${queue.songs.length - 3} más*` : ''),
        inline: false
      });
    }

    return embed;
  }

  /**
   * Crea barra de progreso visual
   */
  static createProgressBar(queue) {
    const length = 20; // Longitud de la barra
    const song = queue.nowPlaying;

    if (!song || !queue.player || !queue.player.state.resource) {
      return '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ 0:00 / 0:00';
    }

    // Obtener tiempo actual de reproducción (en milisegundos)
    const playbackDuration = queue.player.state.resource.playbackDuration || 0;
    const currentSeconds = Math.floor(playbackDuration / 1000);

    // Duración total en segundos (parseamos del formato MM:SS)
    const totalSeconds = this.parseDuration(song.duration);

    // Calcular porcentaje
    const percentage = totalSeconds > 0 ? currentSeconds / totalSeconds : 0;
    const filledBars = Math.round(percentage * length);

    // Crear barra
    const emptyBar = '▬';
    const filledBar = '🔷';
    const progress = filledBar.repeat(filledBars) + emptyBar.repeat(length - filledBars);

    // Formatear tiempos
    const currentTime = this.formatTime(currentSeconds);
    // Formatear tiempo total (puede ser número o string)
    const totalTime = typeof song.duration === 'number' 
      ? this.formatTime(song.duration) 
      : song.duration;

    return `${progress} ${currentTime} / ${totalTime}`;
  }

  /**
   * Convierte duración a segundos
   * Acepta: número (segundos), string "MM:SS" o "HH:MM:SS"
   */
  static parseDuration(duration) {
    // Si ya es un número, devolverlo
    if (typeof duration === 'number') {
      return duration;
    }
    
    // Si es string, parsearlo
    if (typeof duration === 'string') {
      const parts = duration.split(':').map(p => parseInt(p));
      if (parts.length === 2) {
        return parts[0] * 60 + parts[1]; // MM:SS
      } else if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
      }
    }
    
    return 0;
  }

  /**
   * Formatea segundos a MM:SS
   */
  static formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Crea los botones de control
   */
  static createControlButtons(queue) {
    const isPaused = queue.isPaused;
    const isPlaying = queue.isPlaying;

    // Primera fila de botones: Controles principales
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_pause')
        .setLabel(isPaused ? 'Reanudar' : 'Pausar')
        .setEmoji(isPaused ? '▶️' : '⏸️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!isPlaying && !isPaused),

      new ButtonBuilder()
        .setCustomId('music_skip')
        .setLabel('Siguiente')
        .setEmoji('⏭️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!isPlaying && !isPaused),

      new ButtonBuilder()
        .setCustomId('music_stop')
        .setLabel('Detener')
        .setEmoji('⏹️')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!isPlaying && !isPaused),

      new ButtonBuilder()
        .setCustomId('music_shuffle')
        .setLabel('Mezclar')
        .setEmoji('🔀')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(queue.songs.length === 0),

      new ButtonBuilder()
        .setCustomId('music_loop')
        .setLabel('Repetir')
        .setEmoji(queue.loop === 'off' ? '🔁' : (queue.loop === 'song' ? '🔂' : '🔁'))
        .setStyle(queue.loop === 'off' ? ButtonStyle.Secondary : ButtonStyle.Success)
        .setDisabled(!isPlaying && !isPaused)
    );

    // Segunda fila de botones: Utilidades
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_queue')
        .setLabel('Ver Cola')
        .setEmoji('📋')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('music_volume_down')
        .setLabel('Vol -')
        .setEmoji('🔉')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!isPlaying && !isPaused),

      new ButtonBuilder()
        .setCustomId('music_volume_up')
        .setLabel('Vol +')
        .setEmoji('🔊')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!isPlaying && !isPaused),

      new ButtonBuilder()
        .setCustomId('music_lyrics')
        .setLabel('Letra')
        .setEmoji('📜')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!isPlaying && !isPaused),

      new ButtonBuilder()
        .setCustomId('music_save_playlist')
        .setLabel('Guardar Cola')
        .setEmoji('💾')
        .setStyle(ButtonStyle.Success)
        .setDisabled(queue.songs.length === 0 && !queue.nowPlaying)
    );

    // Tercera fila: Botones adicionales
    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_refresh')
        .setLabel('Actualizar')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Secondary)
    );

    return [row1, row2, row3];
  }

  /**
   * Crea o actualiza el panel musical
   * El panel se crea en el canal de música configurado y se reutiliza si ya existe
   */
  static async createOrUpdatePanel(queue, channel) {
    const embed = this.createNowPlayingEmbed(queue);
    const components = this.createControlButtons(queue);

    try {
      // Obtener el canal de música configurado
      const config = require('../config.json');
      let targetChannel = channel;
      
      if (config.musicChannel?.enabled && config.musicChannel.channelId) {
        try {
          targetChannel = await channel.guild.channels.fetch(config.musicChannel.channelId);
        } catch (error) {
          console.warn('⚠️ No se pudo obtener el canal de música configurado, usando el canal actual');
        }
      }

      // Si ya existe un panel, intentar actualizarlo
      if (queue.panelMessageId && queue.panelChannelId) {
        try {
          const panelChannel = await channel.guild.channels.fetch(queue.panelChannelId);
          const panelMessage = await panelChannel.messages.fetch(queue.panelMessageId);

          await panelMessage.edit({
            embeds: [embed],
            components: components
          });

          console.log(`🔄 Panel actualizado en ${panelChannel.name}`);
          return panelMessage;
        } catch (error) {
          // Si falla (mensaje borrado o canal diferente), crear uno nuevo
          console.log('⚠️ Panel anterior no encontrado, creando nuevo...');
          queue.panelMessageId = null;
          queue.panelChannelId = null;
        }
      }

      // Buscar si ya existe un panel en el canal de música
      if (targetChannel && targetChannel.isTextBased()) {
        try {
          // Buscar mensajes del bot con embeds en el canal (últimos 10)
          const messages = await targetChannel.messages.fetch({ limit: 10 });
          const existingPanel = messages.find(msg => 
            msg.author.id === channel.client.user.id && 
            msg.embeds.length > 0 &&
            msg.embeds[0].author?.name?.includes('Dojo del Sonido')
          );

          if (existingPanel) {
            // Reutilizar panel existente
            queue.panelMessageId = existingPanel.id;
            queue.panelChannelId = targetChannel.id;
            
            await existingPanel.edit({
              embeds: [embed],
              components: components
            });

            console.log(`♻️ Panel reutilizado en ${targetChannel.name}`);
            return existingPanel;
          }
        } catch (error) {
          console.warn('⚠️ Error buscando panel existente:', error.message);
        }
      }

      // Crear nuevo panel en el canal de música
      const message = await targetChannel.send({
        embeds: [embed],
        components: components
      });

      // Guardar IDs del panel
      queue.panelMessageId = message.id;
      queue.panelChannelId = targetChannel.id;

      console.log(`✅ Panel musical creado en ${targetChannel.name}`);
      return message;
    } catch (error) {
      console.error('Error creando/actualizando panel musical:', error);
      return null;
    }
  }

  /**
   * Elimina el panel musical
   */
  static async deletePanel(queue, client) {
    if (!queue.panelMessageId || !queue.panelChannelId) return;

    try {
      const channel = await client.channels.fetch(queue.panelChannelId);
      const message = await channel.messages.fetch(queue.panelMessageId);
      await message.delete();

      queue.panelMessageId = null;
      queue.panelChannelId = null;

      console.log(`${EMOJIS.SUCCESS} Panel musical eliminado`);
    } catch (error) {
      // Panel ya fue eliminado o no existe
      queue.panelMessageId = null;
      queue.panelChannelId = null;
    }
  }
}

module.exports = MusicPanel;

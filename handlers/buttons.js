/**
 * DEMON HUNTER BOT - Button Interaction Handler
 * Maneja todos los botones interactivos (música y playlists)
 */

const { Events, MessageFlags, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createAudioPlayer } = require('@discordjs/voice');
const CONSTANTS = require('../src/config/constants');
const MESSAGES = require('../src/config/messages');
const COLORS = require('../src/config/colors');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, { client, dataManager, musicHandlers }) {
    // Solo manejar botones de música y playlist
    if (!interaction.isButton()) return;
    if (!interaction.customId || (!interaction.customId.startsWith('music_') && !interaction.customId.startsWith('playlist_load_'))) return;

    // Manejar botones de carga de playlist
    if (interaction.customId.startsWith('playlist_load_')) {
      try {
        // Extraer userId e índice del customId: playlist_load_<userId>_<index>
        const parts = interaction.customId.split('_');
        const playlistUserId = parts[2];
        const playlistIndex = parseInt(parts[3]);

        // Verificar que el usuario que hace clic sea el dueño de la playlist
        if (interaction.user.id !== playlistUserId) {
          return interaction.reply({
            content: '❌ Solo puedes cargar tus propias playlists.',
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

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Obtener datos del usuario
        const userData = dataManager.getUser(playlistUserId, interaction.guild.id);

        if (!userData.playlists || !userData.playlists[playlistIndex]) {
          return interaction.editReply({
            content: '❌ Playlist no encontrada.'
          });
        }

        const playlist = userData.playlists[playlistIndex];

        if (playlist.songs.length === 0) {
          return interaction.editReply({
            content: MESSAGES.PLAYLISTS.EMPTY(playlist.name)
          });
        }

        const musicManager = require('../utils/musicManager');
        const ServerQueue = require('../utils/musicQueue');
        const guildId = interaction.guild.id;
        const voiceChannel = interaction.member.voice.channel;

        let queue = musicManager.getQueue(guildId);

        // Crear cola si no existe
        if (!queue) {
          queue = new ServerQueue(
            interaction.guild,
            voiceChannel,
            interaction.channel
          );
          musicManager.setQueue(guildId, queue);
        }

        const wasPlaying = queue.isPlaying;

        // Si el bot no está conectado a voz, conectarlo al canal del usuario
        if (!queue.connection) {
          queue.connection = await musicManager.connectToChannel(voiceChannel);
          queue.voiceChannel = voiceChannel;
          queue.textChannel = interaction.channel;
          musicManager.setupConnectionListeners(queue.connection, guildId);
        }

        // Si no tiene player, crear uno
        if (!queue.player) {
          queue.player = createAudioPlayer();
          queue.connection.subscribe(queue.player);
          musicManager.setupPlayerListeners(queue);
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
        dataManager.updateUser(playlistUserId, interaction.guild.id, { playlists: userData.playlists });

        // Si no hay nada reproduciéndose, empezar
        if (!wasPlaying && !queue.nowPlaying) {
          await musicManager.playSong(queue);
        }

        return interaction.editReply({
          content: MESSAGES.PLAYLISTS.LOADED(playlist.name, addedCount)
        });

      } catch (error) {
        console.error('Error cargando playlist desde botón:', error);
        if (!interaction.replied && !interaction.deferred) {
          return interaction.reply({
            content: '❌ Error al cargar la playlist.',
            flags: MessageFlags.Ephemeral
          });
        } else {
          return interaction.editReply({
            content: '❌ Error al cargar la playlist.'
          });
        }
      }
    }

    // Manejar botones de control de música
    try {
      const musicManager = require('../utils/musicManager');
      const queue = musicManager.getQueue(interaction.guild.id);

      // Verificar que hay una cola activa
      if (!queue || (!queue.nowPlaying && queue.songs.length === 0)) {
        return interaction.reply({
          content: '❌ No hay música reproduciéndose actualmente.',
          flags: MessageFlags.Ephemeral
        });
      }

      // Verificar que el usuario esté en el mismo canal de voz
      if (interaction.member.voice.channel?.id !== queue.voiceChannel?.id) {
        return interaction.reply({
          content: '❌ Debes estar en el mismo canal de voz que el bot para usar estos controles.',
          flags: MessageFlags.Ephemeral
        });
      }

      const customId = interaction.customId;

      // Manejar cada botón
      switch (customId) {
        case 'music_pause':
          if (queue.isPaused) {
            await musicHandlers.handleResume(interaction);
          } else {
            await musicHandlers.handlePause(interaction);
          }
          break;

        case 'music_skip':
          await musicHandlers.handleSkip(interaction);
          break;

        case 'music_stop':
          await musicHandlers.handleStop(interaction);
          break;

        case 'music_shuffle':
          await musicHandlers.handleShuffle(interaction);
          break;

        case 'music_loop':
          // Cambiar modo de loop: off -> song -> queue -> off
          if (queue.loop === 'off') {
            queue.loop = 'song';
          } else if (queue.loop === 'song') {
            queue.loop = 'queue';
          } else {
            queue.loop = 'off';
          }
          await interaction.reply({
            content: `🔁 Modo de repetición: **${queue.loop === 'off' ? 'Desactivado' : queue.loop === 'song' ? 'Canción' : 'Cola'}**`,
            flags: MessageFlags.Ephemeral
          });
          break;

        case 'music_queue':
          await musicHandlers.handleQueue(interaction);
          break;

        case 'music_volume_down':
          if (queue.volume > 0) {
            queue.volume = Math.max(0, queue.volume - 10);
            if (queue.player?.state?.resource?.volume) {
              queue.player.state.resource.volume.setVolume(queue.volume / 100);
            }
            await interaction.reply({
              content: `🔉 Volumen: **${queue.volume}%**`,
              flags: MessageFlags.Ephemeral
            });
          }
          break;

        case 'music_volume_up':
          if (queue.volume < 100) {
            queue.volume = Math.min(100, queue.volume + 10);
            if (queue.player?.state?.resource?.volume) {
              queue.player.state.resource.volume.setVolume(queue.volume / 100);
            }
            await interaction.reply({
              content: `🔊 Volumen: **${queue.volume}%**`,
              flags: MessageFlags.Ephemeral
            });
          }
          break;

        case 'music_lyrics':
          // Obtener letras de la canción actual
          if (!queue.nowPlaying) {
            return interaction.reply({
              content: '❌ No hay ninguna canción reproduciéndose.',
              flags: MessageFlags.Ephemeral
            });
          }

          await interaction.deferReply({ flags: MessageFlags.Ephemeral });

          try {
            const fetch = require('node-fetch');
            const song = queue.nowPlaying;

            // Extraer artista y título de la canción
            // Formato común: "Artista - Título" o solo "Título"
            let artist = '';
            let title = song.title;

            if (song.title.includes(' - ')) {
              const parts = song.title.split(' - ');
              artist = parts[0].trim();
              title = parts.slice(1).join(' - ').trim();
            }

            // Intentar obtener letras de lyrics.ovh (API gratuita)
            let lyrics = null;
            try {
              const searchUrl = artist
                ? `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
                : `https://api.lyrics.ovh/v1/${encodeURIComponent(title)}`;

              const response = await fetch(searchUrl);
              if (response.ok) {
                const data = await response.json();
                lyrics = data.lyrics;
              }
            } catch (error) {
              console.warn('Error obteniendo letras:', error.message);
            }

            if (!lyrics) {
              const searchQuery = artist ? `${artist} ${title}` : title;
              const searchUrl = `https://www.letras.com/buscar/?q=${encodeURIComponent(searchQuery)}`;
              const linkButton = new ButtonBuilder()
                .setLabel('🔎 Buscar letra en letras.com')
                .setStyle(ButtonStyle.Link)
                .setURL(searchUrl);
              const row = new ActionRowBuilder().addComponents(linkButton);

              return interaction.editReply({
                content: `❌ No se encontraron letras para **${song.title}**.\n\n💡 Puedes buscar manualmente:`,
                components: [row]
              });
            }

            // Limitar letras a 2000 caracteres (límite de Discord)
            const lyricsPreview = lyrics.length > 2000
              ? lyrics.substring(0, 1997) + '...'
              : lyrics;

            const lyricsEmbed = new EmbedBuilder()
              .setColor(COLORS.PRIMARY)
              .setTitle(`📜 Letra de: ${song.title}`)
              .setDescription(`\`\`\`${lyricsPreview}\`\`\``)
              .setFooter({ text: MESSAGES.FOOTER?.DEFAULT || '🎋 Dojo del Sonido • Demon Hunter' })
              .setTimestamp();

            if (song.thumbnail) {
              lyricsEmbed.setThumbnail(song.thumbnail);
            }

            await interaction.editReply({ embeds: [lyricsEmbed] });
          } catch (error) {
            console.error('Error obteniendo letras:', error);
            await interaction.editReply({
              content: '❌ Error al obtener las letras. Intenta más tarde.'
            });
          }
          break;

        case 'music_save_playlist':
          // Guardar la cola actual como playlist
          if (queue.songs.length === 0 && !queue.nowPlaying) {
            return interaction.reply({
              content: '❌ No hay canciones en la cola para guardar.',
              flags: MessageFlags.Ephemeral
            });
          }

          // Mostrar modal para ingresar nombre de playlist
          const modal = new ModalBuilder()
            .setCustomId('save_playlist_modal')
            .setTitle('💾 Guardar Playlist');

          const playlistNameInput = new TextInputBuilder()
            .setCustomId('playlist_name')
            .setLabel('Nombre de la playlist')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Mi Playlist Favorita')
            .setRequired(true)
            .setMaxLength(50)
            .setMinLength(2);

          const actionRow = new ActionRowBuilder().addComponents(playlistNameInput);
          modal.addComponents(actionRow);

          await interaction.showModal(modal);
          break;

        case 'music_refresh':
          // Actualizar panel
          if (queue.textChannel && queue.panelMessageId) {
            const MusicPanel = require('../utils/musicPanel');
            await MusicPanel.createOrUpdatePanel(queue, queue.textChannel);
            await interaction.reply({
              content: '✅ Panel actualizado',
              flags: MessageFlags.Ephemeral
            });
          }
          break;

        default:
          await interaction.reply({
            content: '❌ Acción no reconocida',
            flags: MessageFlags.Ephemeral
          });
      }

      // Actualizar panel después de cada acción (excepto refresh y save_playlist que ya lo hacen)
      if (customId !== 'music_refresh' && customId !== 'music_save_playlist' && customId !== 'music_lyrics' && queue.textChannel && queue.panelMessageId) {
        const MusicPanel = require('../utils/musicPanel');
        setTimeout(async () => {
          try {
            await MusicPanel.createOrUpdatePanel(queue, queue.textChannel);
          } catch (error) {
            console.error('Error actualizando panel después de botón:', error);
          }
        }, 500);
      }

    } catch (error) {
      console.error('Error manejando botón de música:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Ocurrió un error al procesar esta acción.',
          flags: MessageFlags.Ephemeral
        });
      }
    }
  }
};

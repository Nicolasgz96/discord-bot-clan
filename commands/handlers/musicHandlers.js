/**
 * DEMON HUNTER - Music Command Handlers
 * Handlers para todos los comandos de música (Dojo del Sonido)
 */

const { AudioPlayerStatus, createAudioPlayer } = require('@discordjs/voice');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const musicManager = require('../../utils/musicManager');
const CONSTANTS = require('../../config/constants');
const MESSAGES = require('../../config/messages');
const EMOJIS = require('../../config/emojis');
const { safeDeferUpdate } = require('../../utils/discordUtils');

/**
 * Handler para /tocar y /play
 */
async function handlePlay(interaction) {
  try {
    await interaction.deferReply();

    const member = interaction.member;
    const query = interaction.options.getString('cancion');

    // Verificar que el usuario esté en un canal de voz
    if (!member.voice.channel) {
      return interaction.editReply(MESSAGES.MUSIC.NOT_IN_VOICE);
    }

    const voiceChannel = member.voice.channel;

    // Verificar permisos
    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions.has('Connect')) {
      return interaction.editReply(MESSAGES.MUSIC.CANNOT_CONNECT);
    }
    if (!permissions.has('Speak')) {
      return interaction.editReply(MESSAGES.MUSIC.CANNOT_SPEAK);
    }

    // Obtener o crear cola
    const queue = musicManager.getQueue(interaction.guild.id);

    // Si el bot ya está en otro canal, verificar que sea el mismo
    if (queue.voiceChannel && queue.voiceChannel.id !== voiceChannel.id) {
      return interaction.editReply(MESSAGES.MUSIC.DIFFERENT_VOICE_CHANNEL);
    }

    // Buscar canciones
    await interaction.editReply(MESSAGES.MUSIC.SEARCHING);

    // Detectar si es una URL o una búsqueda por texto
    const isUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|spotify\.com|soundcloud\.com)/.test(query);

    const songs = await musicManager.searchSongs(query, {
      limit: isUrl ? undefined : CONSTANTS.MUSIC.SEARCH_RESULTS_LIMIT
    });

    if (!songs || songs.length === 0) {
      return interaction.editReply(MESSAGES.MUSIC.NO_RESULTS);
    }

    // Si es una playlist (URL con múltiples canciones), agregarlas todas a la cola
    if (isUrl && songs.length > 1) {
      // Es una playlist de YouTube o Spotify
      await interaction.editReply(`${EMOJIS.MUSIC} Agregando ${songs.length} canciones a la cola...`);

      // Conectar al canal de voz
      if (!queue.connection) {
        queue.connection = await musicManager.connectToChannel(voiceChannel);
        queue.voiceChannel = voiceChannel;
        queue.textChannel = interaction.channel;
        musicManager.setupConnectionListeners(queue.connection, interaction.guild.id);
      }

      if (!queue.player) {
        queue.player = createAudioPlayer();
        queue.connection.subscribe(queue.player);
        musicManager.setupPlayerListeners(queue);
      }

      // Agregar todas las canciones
      let addedCount = 0;
      for (const song of songs) {
        // Verificar límite de cola
        if (queue.songs.length >= CONSTANTS.MUSIC.MAX_QUEUE_SIZE) {
          break;
        }

        // Verificar duración
        if (song.duration && song.duration <= CONSTANTS.MUSIC.MAX_SONG_DURATION) {
          song.requestedBy = interaction.user.id;
          queue.addSong(song);
          addedCount++;
        }
      }

      const wasPlaying = queue.isPlaying;

      if (!wasPlaying && addedCount > 0) {
        musicManager.playSong(queue);
      }

      // Actualizar mensaje
      const playlistType = query.includes('spotify.com') ? 'Spotify' : 'YouTube';
      await interaction.editReply(
        `${EMOJIS.SUCCESS} **Playlist de ${playlistType} agregada**\n` +
        `${EMOJIS.MUSIC} ${addedCount} canciones añadidas a la cola\n` +
        `${wasPlaying ? '🎵 Reproduciendo...' : '▶️ Iniciando reproducción...'}`
      );

      // Actualizar mensaje de la cola si existe
      if (queue.queueMessageId) {
        await musicManager.updateQueueMessage(queue);
      }

      return;
    }

    // Si es una búsqueda por texto (no URL) y hay múltiples resultados, mostrar botones de selección
    if (!isUrl && songs.length > 1) {
      // Crear botones de selección
      const buttons = songs.slice(0, 5).map((song, index) =>
        new ButtonBuilder()
          .setCustomId(`music_select_${index}`)
          .setLabel(`${index + 1}. ${song.title.substring(0, 50)}`)
          .setStyle(ButtonStyle.Primary)
      );

      buttons.push(
        new ButtonBuilder()
          .setCustomId('music_select_cancel')
          .setLabel('Cancelar')
          .setStyle(ButtonStyle.Danger)
      );

      const rows = [];
      for (let i = 0; i < buttons.length; i += 5) {
        rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
      }

      const message = await interaction.editReply({
        content: MESSAGES.MUSIC.SEARCH_RESULTS,
        components: rows
      });

      // Collector para botones
      const collector = message.createMessageComponentCollector({
        time: CONSTANTS.MUSIC.SEARCH_TIMEOUT * 1000
      });

      collector.on('collect', async (buttonInteraction) => {
        if (buttonInteraction.user.id !== interaction.user.id) {
          return buttonInteraction.reply({
            content: `${EMOJIS.WARNING} Solo ${interaction.user} puede seleccionar una canción.`,
            ephemeral: true
          });
        }

        if (buttonInteraction.customId === 'music_select_cancel') {
          collector.stop('cancelled');
          return buttonInteraction.update({
            content: MESSAGES.MUSIC.SEARCH_CANCELLED,
            components: []
          });
        }

        const index = parseInt(buttonInteraction.customId.split('_')[2]);
        const selectedSong = songs[index];

        collector.stop('selected');

        // Agregar canción a la cola
        await safeDeferUpdate(buttonInteraction);

        selectedSong.requestedBy = interaction.user.id;

        // Verificar duración máxima
        if (selectedSong.duration > CONSTANTS.MUSIC.MAX_SONG_DURATION) {
          return buttonInteraction.editReply({
            content: MESSAGES.MUSIC.SONG_TOO_LONG(Math.floor(CONSTANTS.MUSIC.MAX_SONG_DURATION / 60)),
            components: []
          });
        }

        // Verificar límite de cola
        if (queue.songs.length >= CONSTANTS.MUSIC.MAX_QUEUE_SIZE) {
          return buttonInteraction.editReply({
            content: MESSAGES.MUSIC.QUEUE_FULL(CONSTANTS.MUSIC.MAX_QUEUE_SIZE),
            components: []
          });
        }

        queue.addSong(selectedSong);

        const wasPlaying = queue.isPlaying;

        if (!queue.connection) {
          queue.connection = await musicManager.connectToChannel(voiceChannel);
          queue.voiceChannel = voiceChannel;
          queue.textChannel = interaction.channel;
          musicManager.setupConnectionListeners(queue.connection, interaction.guild.id);
        }

        if (!queue.player) {
          queue.player = createAudioPlayer();
          queue.connection.subscribe(queue.player);
          musicManager.setupPlayerListeners(queue);
        }

        if (!wasPlaying) {
          musicManager.playSong(queue);
          await buttonInteraction.editReply({
            content: MESSAGES.MUSIC.PLAYING_STARTED,
            components: []
          });
        } else {
          await buttonInteraction.editReply({
            content: MESSAGES.MUSIC.SONG_ADDED(selectedSong.title, queue.songs.length),
            components: []
          });
        }

        // Actualizar mensaje de la cola si existe
        if (queue.queueMessageId) {
          await musicManager.updateQueueMessage(queue);
        }
      });

      collector.on('end', (collected, reason) => {
        if (reason === 'time') {
          interaction.editReply({
            content: MESSAGES.MUSIC.SEARCH_TIMEOUT,
            components: []
          }).catch(console.error);
        }
      });

      return; // Salir después de configurar el collector
    }

    // Si es una playlist de URL (más de una canción de URL)
    if (isUrl && songs.length > 1) {
      // Verificar límite de cola
      if (queue.songs.length + songs.length > CONSTANTS.MUSIC.MAX_QUEUE_SIZE) {
        return interaction.editReply(MESSAGES.MUSIC.QUEUE_FULL(CONSTANTS.MUSIC.MAX_QUEUE_SIZE));
      }

      // Agregar requestedBy a cada canción
      songs.forEach(song => {
        song.requestedBy = interaction.user.id;
      });

      queue.addSongs(songs);

      const wasPlaying = queue.isPlaying;

      // Si no estaba conectado, conectar
      if (!queue.connection) {
        queue.connection = await musicManager.connectToChannel(voiceChannel);
        queue.voiceChannel = voiceChannel;
        queue.textChannel = interaction.channel;

        musicManager.setupConnectionListeners(queue.connection, interaction.guild.id);
      }

      // Si no tenía player, crear uno
      if (!queue.player) {
        queue.player = createAudioPlayer();
        queue.connection.subscribe(queue.player);
        musicManager.setupPlayerListeners(queue);
      }

      // Si no estaba reproduciendo, empezar
      if (!wasPlaying) {
        musicManager.playSong(queue);
      }

      // Actualizar mensaje de la cola si existe
      if (queue.queueMessageId) {
        await musicManager.updateQueueMessage(queue);
      }

      // Si hay panel, no enviar mensaje normal (el panel se actualiza automáticamente)
      if (queue.panelMessageId) {
        return interaction.deleteReply().catch(() => {});
      }

      return interaction.editReply(MESSAGES.MUSIC.PLAYLIST_ADDED(songs.length));
    }

    // Una sola canción
    const song = songs[0];
    song.requestedBy = interaction.user.id;

    // Verificar duración máxima
    if (song.duration > CONSTANTS.MUSIC.MAX_SONG_DURATION) {
      return interaction.editReply(
        MESSAGES.MUSIC.SONG_TOO_LONG(Math.floor(CONSTANTS.MUSIC.MAX_SONG_DURATION / 60))
      );
    }

    // Verificar límite de cola
    if (queue.songs.length >= CONSTANTS.MUSIC.MAX_QUEUE_SIZE) {
      return interaction.editReply(MESSAGES.MUSIC.QUEUE_FULL(CONSTANTS.MUSIC.MAX_QUEUE_SIZE));
    }

    queue.addSong(song);

    const wasPlaying = queue.isPlaying;

    // Si no estaba conectado, conectar
    if (!queue.connection) {
      queue.connection = await musicManager.connectToChannel(voiceChannel);
      queue.voiceChannel = voiceChannel;
      queue.textChannel = interaction.channel;

      musicManager.setupConnectionListeners(queue.connection, interaction.guild.id);
    }

    // Si no tenía player, crear uno
    if (!queue.player) {
      queue.player = createAudioPlayer();
      queue.connection.subscribe(queue.player);
      musicManager.setupPlayerListeners(queue);
    }

    // Si no estaba reproduciendo, empezar
    if (!wasPlaying) {
      musicManager.playSong(queue);
      // Si hay panel, no enviar mensaje normal (el panel se actualiza automáticamente)
      if (queue.panelMessageId) {
        // Actualizar mensaje de la cola si existe
        if (queue.queueMessageId) {
          await musicManager.updateQueueMessage(queue);
        }
        return interaction.deleteReply().catch(() => {});
      }

      // Actualizar mensaje de la cola si existe
      if (queue.queueMessageId) {
        await musicManager.updateQueueMessage(queue);
      }

      return interaction.editReply(MESSAGES.MUSIC.PLAYING_STARTED);
    } else {
      // Si hay panel, no enviar mensaje normal
      if (queue.panelMessageId) {
        // Actualizar mensaje de la cola si existe
        if (queue.queueMessageId) {
          await musicManager.updateQueueMessage(queue);
        }
        return interaction.deleteReply().catch(() => {});
      }

      // Actualizar mensaje de la cola si existe
      if (queue.queueMessageId) {
        await musicManager.updateQueueMessage(queue);
      }

      return interaction.editReply(MESSAGES.MUSIC.SONG_ADDED(song.title, queue.songs.length));
    }

  } catch (error) {
    console.error('Error en /tocar:', error);
    await interaction.editReply(MESSAGES.MUSIC.SEARCH_ERROR).catch(console.error);
  }
}

/**
 * Handler para /pausar y /pause
 */
async function handlePause(interaction) {
  try {
    const queue = musicManager.getQueue(interaction.guild.id);

    if (!queue || !queue.player) {
      return interaction.reply({ content: MESSAGES.MUSIC.NO_SONG_PLAYING, ephemeral: true });
    }

    if (!musicManager.checkUserVoiceChannel(interaction.member, queue)) {
      return interaction.reply({ content: MESSAGES.MUSIC.DIFFERENT_VOICE_CHANNEL, ephemeral: true });
    }

    // Verificar que el player esté reproduciendo
    if (queue.player.state.status !== AudioPlayerStatus.Playing) {
      return interaction.reply({ content: MESSAGES.MUSIC.NO_SONG_PLAYING, ephemeral: true });
    }

    queue.player.pause();
    queue.isPaused = true;
    queue.isPlaying = false;

    await interaction.reply(MESSAGES.MUSIC.PAUSED);
  } catch (error) {
    console.error('Error en /pausar:', error);
    await interaction.reply({ content: MESSAGES.ERRORS.COMMAND_ERROR, ephemeral: true });
  }
}

/**
 * Handler para /reanudar y /resume
 */
async function handleResume(interaction) {
  try {
    const queue = musicManager.getQueue(interaction.guild.id);

    if (!queue || !queue.player) {
      return interaction.reply({ content: MESSAGES.MUSIC.NO_SONG_PLAYING, ephemeral: true });
    }

    if (!musicManager.checkUserVoiceChannel(interaction.member, queue)) {
      return interaction.reply({ content: MESSAGES.MUSIC.DIFFERENT_VOICE_CHANNEL, ephemeral: true });
    }

    // Verificar que el player esté pausado
    if (queue.player.state.status !== AudioPlayerStatus.Paused) {
      return interaction.reply({ content: '❌ La música no está pausada.', ephemeral: true });
    }

    queue.player.unpause();
    queue.isPaused = false;
    queue.isPlaying = true;

    await interaction.reply(MESSAGES.MUSIC.RESUMED);
  } catch (error) {
    console.error('Error en /reanudar:', error);
    await interaction.reply({ content: MESSAGES.ERRORS.COMMAND_ERROR, ephemeral: true });
  }
}

/**
 * Handler para /siguiente y /skip
 */
async function handleSkip(interaction) {
  try {
    const queue = musicManager.getQueue(interaction.guild.id);

    if (!queue || !queue.isPlaying) {
      return interaction.reply({ content: MESSAGES.MUSIC.NO_SONG_PLAYING, ephemeral: true });
    }

    if (!musicManager.checkUserVoiceChannel(interaction.member, queue)) {
      return interaction.reply({ content: MESSAGES.MUSIC.DIFFERENT_VOICE_CHANNEL, ephemeral: true });
    }

    const skippedSong = queue.nowPlaying;
    queue.player.stop(); // Esto triggerea el evento 'idle' que llama a playSong()

    await interaction.reply(MESSAGES.MUSIC.SKIPPED(skippedSong?.title || 'Canción actual'));
  } catch (error) {
    console.error('Error en /siguiente:', error);
    await interaction.reply({ content: MESSAGES.ERRORS.COMMAND_ERROR, ephemeral: true });
  }
}

/**
 * Handler para /detener y /stop
 */
async function handleStop(interaction) {
  try {
    const queue = musicManager.getQueue(interaction.guild.id);

    if (!queue) {
      return interaction.reply({ content: MESSAGES.MUSIC.BOT_NOT_IN_VOICE, ephemeral: true });
    }

    if (!musicManager.checkUserVoiceChannel(interaction.member, queue)) {
      return interaction.reply({ content: MESSAGES.MUSIC.DIFFERENT_VOICE_CHANNEL, ephemeral: true });
    }

    musicManager.deleteQueue(interaction.guild.id);

    await interaction.reply(MESSAGES.MUSIC.STOPPED);
  } catch (error) {
    console.error('Error en /detener:', error);
    await interaction.reply({ content: MESSAGES.ERRORS.COMMAND_ERROR, ephemeral: true });
  }
}

/**
 * Handler para /cola y /queue
 */
async function handleQueue(interaction) {
  try {
    const queue = musicManager.getQueue(interaction.guild.id);

    if (!queue || (!queue.nowPlaying && queue.songs.length === 0)) {
      return interaction.reply({ content: MESSAGES.MUSIC.QUEUE_EMPTY, ephemeral: true });
    }

    const embed = musicManager.createQueueEmbed(queue, 0);

    const message = await interaction.reply({ embeds: [embed], fetchReply: true });

    // Guardar el ID del mensaje de la cola para actualizarlo dinámicamente
    queue.queueMessageId = message.id;
    queue.queueChannelId = message.channel.id;
  } catch (error) {
    console.error('Error en /cola:', error);
    await interaction.reply({ content: MESSAGES.ERRORS.COMMAND_ERROR, ephemeral: true });
  }
}

/**
 * Handler para /ahora, /sonando, /nowplaying, /np
 */
async function handleNowPlaying(interaction) {
  try {
    const queue = musicManager.getQueue(interaction.guild.id);

    if (!queue || !queue.nowPlaying) {
      return interaction.reply({ content: MESSAGES.MUSIC.NO_SONG_PLAYING, ephemeral: true });
    }

    const embed = musicManager.createNowPlayingEmbed(queue.nowPlaying, queue);

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error en /ahora:', error);
    await interaction.reply({ content: MESSAGES.ERRORS.COMMAND_ERROR, ephemeral: true });
  }
}

/**
 * Handler para /volumen y /volume
 */
async function handleVolume(interaction) {
  try {
    const queue = musicManager.getQueue(interaction.guild.id);
    const volume = interaction.options.getInteger('nivel');

    if (!queue || !queue.isPlaying) {
      return interaction.reply({ content: MESSAGES.MUSIC.NO_SONG_PLAYING, ephemeral: true });
    }

    if (!musicManager.checkUserVoiceChannel(interaction.member, queue)) {
      return interaction.reply({ content: MESSAGES.MUSIC.DIFFERENT_VOICE_CHANNEL, ephemeral: true });
    }

    queue.volume = volume;

    // Ajustar volumen del recurso actual
    if (queue.player.state.status === AudioPlayerStatus.Playing) {
      queue.player.state.resource.volume.setVolume(volume / 100);
    }

    await interaction.reply(MESSAGES.MUSIC.VOLUME_CHANGED(volume));
  } catch (error) {
    console.error('Error en /volumen:', error);
    await interaction.reply({ content: MESSAGES.ERRORS.COMMAND_ERROR, ephemeral: true });
  }
}

/**
 * Handler para /buscar y /search
 */
async function handleSearch(interaction) {
  try {
    await interaction.deferReply();

    const query = interaction.options.getString('termino');
    const member = interaction.member;

    // Verificar que el usuario esté en un canal de voz
    if (!member.voice.channel) {
      return interaction.editReply(MESSAGES.MUSIC.NOT_IN_VOICE);
    }

    // Buscar canciones
    const songs = await musicManager.searchSongs(query, {
      limit: CONSTANTS.MUSIC.SEARCH_RESULTS_LIMIT
    });

    if (!songs || songs.length === 0) {
      return interaction.editReply(MESSAGES.MUSIC.NO_RESULTS);
    }

    // Crear botones de selección
    const buttons = songs.slice(0, 5).map((song, index) =>
      new ButtonBuilder()
        .setCustomId(`music_select_${index}`)
        .setLabel(`${index + 1}. ${song.title.substring(0, 50)}`)
        .setStyle(ButtonStyle.Primary)
    );

    buttons.push(
      new ButtonBuilder()
        .setCustomId('music_select_cancel')
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Danger)
    );

    const rows = [];
    for (let i = 0; i < buttons.length; i += 5) {
      rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
    }

    const message = await interaction.editReply({
      content: MESSAGES.MUSIC.SEARCH_RESULTS,
      components: rows
    });

    // Collector para botones
    const collector = message.createMessageComponentCollector({
      time: CONSTANTS.MUSIC.SEARCH_TIMEOUT * 1000
    });

    collector.on('collect', async (buttonInteraction) => {
      if (buttonInteraction.user.id !== interaction.user.id) {
        return buttonInteraction.reply({
          content: `${EMOJIS.WARNING} Solo ${interaction.user} puede seleccionar una canción.`,
          ephemeral: true
        });
      }

      if (buttonInteraction.customId === 'music_select_cancel') {
        collector.stop('cancelled');
        return buttonInteraction.update({
          content: MESSAGES.MUSIC.SEARCH_CANCELLED,
          components: []
        });
      }

      const index = parseInt(buttonInteraction.customId.split('_')[2]);
      const selectedSong = songs[index];

      collector.stop('selected');

      // Agregar canción a la cola (reutilizar lógica de handlePlay)
      await safeDeferUpdate(buttonInteraction);

      const queue = musicManager.getQueue(interaction.guild.id);
      const voiceChannel = member.voice.channel;

      selectedSong.requestedBy = interaction.user.id;
      queue.addSong(selectedSong);

      const wasPlaying = queue.isPlaying;

      if (!queue.connection) {
        queue.connection = await musicManager.connectToChannel(voiceChannel);
        queue.voiceChannel = voiceChannel;
        queue.textChannel = interaction.channel;
        musicManager.setupConnectionListeners(queue.connection, interaction.guild.id);
      }

      if (!queue.player) {
        queue.player = createAudioPlayer();
        queue.connection.subscribe(queue.player);
        musicManager.setupPlayerListeners(queue);
      }

      if (!wasPlaying) {
        musicManager.playSong(queue);
        await buttonInteraction.editReply({
          content: MESSAGES.MUSIC.PLAYING_STARTED,
          components: []
        });
      } else {
        await buttonInteraction.editReply({
          content: MESSAGES.MUSIC.SONG_ADDED(selectedSong.title, queue.songs.length),
          components: []
        });
      }
    });

    collector.on('end', (collected, reason) => {
      if (reason === 'time') {
        interaction.editReply({
          content: MESSAGES.MUSIC.SEARCH_TIMEOUT,
          components: []
        }).catch(console.error);
      }
    });

  } catch (error) {
    console.error('Error en /buscar:', error);
    await interaction.editReply(MESSAGES.MUSIC.SEARCH_ERROR).catch(console.error);
  }
}

/**
 * Handler para /mezclar y /shuffle
 */
async function handleShuffle(interaction) {
  try {
    const queue = musicManager.getQueue(interaction.guild.id);

    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ content: MESSAGES.MUSIC.QUEUE_EMPTY, ephemeral: true });
    }

    if (!musicManager.checkUserVoiceChannel(interaction.member, queue)) {
      return interaction.reply({ content: MESSAGES.MUSIC.DIFFERENT_VOICE_CHANNEL, ephemeral: true });
    }

    queue.shuffle();

    await interaction.reply(MESSAGES.MUSIC.QUEUE_SHUFFLED);
  } catch (error) {
    console.error('Error en /mezclar:', error);
    await interaction.reply({ content: MESSAGES.ERRORS.COMMAND_ERROR, ephemeral: true });
  }
}

/**
 * Handler para /repetir y /loop
 */
async function handleLoop(interaction) {
  try {
    const queue = musicManager.getQueue(interaction.guild.id);
    const mode = interaction.options.getString('modo');

    if (!queue) {
      return interaction.reply({ content: MESSAGES.MUSIC.BOT_NOT_IN_VOICE, ephemeral: true });
    }

    if (!musicManager.checkUserVoiceChannel(interaction.member, queue)) {
      return interaction.reply({ content: MESSAGES.MUSIC.DIFFERENT_VOICE_CHANNEL, ephemeral: true });
    }

    queue.loop = mode;

    let message;
    if (mode === 'off') {
      message = MESSAGES.MUSIC.LOOP_DISABLED;
    } else if (mode === 'song') {
      message = MESSAGES.MUSIC.LOOP_SONG;
    } else {
      message = MESSAGES.MUSIC.LOOP_QUEUE;
    }

    await interaction.reply(message);
  } catch (error) {
    console.error('Error en /repetir:', error);
    await interaction.reply({ content: MESSAGES.ERRORS.COMMAND_ERROR, ephemeral: true });
  }
}

/**
 * Handler para /limpiar y /clear
 */
async function handleClear(interaction) {
  try {
    const queue = musicManager.getQueue(interaction.guild.id);

    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ content: MESSAGES.MUSIC.QUEUE_EMPTY, ephemeral: true });
    }

    if (!musicManager.checkUserVoiceChannel(interaction.member, queue)) {
      return interaction.reply({ content: MESSAGES.MUSIC.DIFFERENT_VOICE_CHANNEL, ephemeral: true });
    }

    queue.clear();

    await interaction.reply(MESSAGES.MUSIC.QUEUE_CLEARED);

    // Actualizar mensaje de la cola si existe
    if (queue.queueMessageId) {
      await musicManager.updateQueueMessage(queue);
    }
  } catch (error) {
    console.error('Error en /limpiar:', error);
    await interaction.reply({ content: MESSAGES.ERRORS.COMMAND_ERROR, ephemeral: true });
  }
}

/**
 * Handler para /saltar y /jump
 */
async function handleJump(interaction) {
  try {
    const queue = musicManager.getQueue(interaction.guild.id);
    const position = interaction.options.getInteger('posicion');

    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ content: MESSAGES.MUSIC.QUEUE_EMPTY, ephemeral: true });
    }

    if (!musicManager.checkUserVoiceChannel(interaction.member, queue)) {
      return interaction.reply({ content: MESSAGES.MUSIC.DIFFERENT_VOICE_CHANNEL, ephemeral: true });
    }

    if (position < 1 || position > queue.songs.length) {
      return interaction.reply({
        content: MESSAGES.MUSIC.INVALID_POSITION(queue.songs.length),
        ephemeral: true
      });
    }

    const targetSong = queue.jumpTo(position - 1);
    queue.player.stop(); // Triggerea reproducción de la siguiente (que será la saltada)

    await interaction.reply(MESSAGES.MUSIC.JUMPED_TO_SONG(position, targetSong?.title || 'Canción'));

    // Actualizar mensaje de la cola si existe
    if (queue.queueMessageId) {
      await musicManager.updateQueueMessage(queue);
    }
  } catch (error) {
    console.error('Error en /saltar:', error);
    await interaction.reply({ content: MESSAGES.ERRORS.COMMAND_ERROR, ephemeral: true });
  }
}

/**
 * Handler para /remover y /remove
 */
async function handleRemove(interaction) {
  try {
    const queue = musicManager.getQueue(interaction.guild.id);
    const position = interaction.options.getInteger('posicion');

    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ content: MESSAGES.MUSIC.QUEUE_EMPTY, ephemeral: true });
    }

    if (!musicManager.checkUserVoiceChannel(interaction.member, queue)) {
      return interaction.reply({ content: MESSAGES.MUSIC.DIFFERENT_VOICE_CHANNEL, ephemeral: true });
    }

    if (position < 1 || position > queue.songs.length) {
      return interaction.reply({
        content: MESSAGES.MUSIC.INVALID_POSITION(queue.songs.length),
        ephemeral: true
      });
    }

    const removedSong = queue.removeSong(position - 1);

    await interaction.reply(MESSAGES.MUSIC.SONG_REMOVED(position, removedSong?.title || 'Canción'));

    // Actualizar mensaje de la cola si existe
    if (queue.queueMessageId) {
      await musicManager.updateQueueMessage(queue);
    }
  } catch (error) {
    console.error('Error en /remover:', error);
    await interaction.reply({ content: MESSAGES.ERRORS.COMMAND_ERROR, ephemeral: true });
  }
}

module.exports = {
  handlePlay,
  handlePause,
  handleResume,
  handleSkip,
  handleStop,
  handleQueue,
  handleNowPlaying,
  handleVolume,
  handleSearch,
  handleShuffle,
  handleLoop,
  handleClear,
  handleJump,
  handleRemove
};

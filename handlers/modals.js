/**
 * DEMON HUNTER BOT - Modal Interaction Handler
 * Maneja todos los modales (guardar playlist, etc.)
 */

const { Events, MessageFlags } = require('discord.js');
const CONSTANTS = require('../src/config/constants');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, { client, dataManager }) {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== 'save_playlist_modal') return;

    try {
      const playlistName = interaction.fields.getTextInputValue('playlist_name');
      const musicManager = require('../utils/musicManager');
      const queue = musicManager.getQueue(interaction.guild.id);

      if (!queue || (queue.songs.length === 0 && !queue.nowPlaying)) {
        return interaction.reply({
          content: '❌ No hay canciones en la cola para guardar.',
          flags: MessageFlags.Ephemeral
        });
      }

      // Validar nombre
      if (playlistName.length < 2 || playlistName.length > 50) {
        return interaction.reply({
          content: '❌ El nombre de la playlist debe tener entre 2 y 50 caracteres.',
          flags: MessageFlags.Ephemeral
        });
      }

      // Obtener todas las canciones (actual + cola)
      const allSongs = [];
      if (queue.nowPlaying) {
        allSongs.push(queue.nowPlaying);
      }
      allSongs.push(...queue.songs);

      if (allSongs.length === 0) {
        return interaction.reply({
          content: '❌ No hay canciones para guardar.',
          flags: MessageFlags.Ephemeral
        });
      }

      // Guardar playlist usando dataManager
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;
      const userData = dataManager.getUser(userId, guildId);

      if (!userData.playlists) {
        userData.playlists = [];
      }

      // Verificar si ya existe una playlist con ese nombre
      const existingPlaylist = userData.playlists.find(p => p.name.toLowerCase() === playlistName.toLowerCase());
      if (existingPlaylist) {
        return interaction.reply({
          content: `❌ Ya tienes una playlist llamada **${playlistName}**. Usa otro nombre.`,
          flags: MessageFlags.Ephemeral
        });
      }

      // Verificar límite de playlists
      const MAX_PLAYLISTS = CONSTANTS.MUSIC?.MAX_PLAYLISTS || 10;
      if (userData.playlists.length >= MAX_PLAYLISTS) {
        return interaction.reply({
          content: `❌ Has alcanzado el límite de ${MAX_PLAYLISTS} playlists. Elimina alguna para crear una nueva.`,
          flags: MessageFlags.Ephemeral
        });
      }

      // Crear nueva playlist
      const newPlaylist = {
        name: playlistName,
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

      await interaction.reply({
        content: `✅ **Playlist guardada exitosamente**\n📚 **${playlistName}**\n🎵 ${allSongs.length} canciones guardadas`,
        flags: MessageFlags.Ephemeral
      });

      console.log(`💾 ${interaction.user.tag} guardó playlist "${playlistName}" con ${allSongs.length} canciones`);

    } catch (error) {
      console.error('Error guardando playlist:', error);
      await interaction.reply({
        content: '❌ Error al guardar la playlist. Intenta más tarde.',
        flags: MessageFlags.Ephemeral
      }).catch(() => {});
    }
  }
};

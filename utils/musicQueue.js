/**
 * DEMON HUNTER - Music Queue System
 * Sistema de cola de música por servidor con temática samurai
 */

const CONSTANTS = require('../config/constants');
const {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState
} = require('@discordjs/voice');
const play = require('play-dl');

/**
 * Clase ServerQueue - Maneja la cola de música de un servidor
 */
class ServerQueue {
  constructor(guildId) {
    this.guildId = guildId;
    this.songs = [];              // Array de canciones { title, url, duration, requestedBy, thumbnail }
    this.nowPlaying = null;       // Canción actual
    this.volume = CONSTANTS.MUSIC.DEFAULT_VOLUME; // 0-100
    this.loop = 'off';            // 'off', 'song', 'queue'
    this.is247 = false;           // Modo 24/7
    this.filters = [];            // Filtros activos
    this.connection = null;       // Voice connection
    this.player = null;           // Audio player
    this.textChannel = null;      // Canal de texto donde se invocó la música
    this.voiceChannel = null;     // Canal de voz
    this.isPlaying = false;       // Estado de reproducción
    this.isPaused = false;        // Estado de pausa
    this.panelMessageId = null;   // ID del mensaje del panel musical
    this.panelChannelId = null;   // ID del canal donde está el panel
    this.queueMessageId = null;   // ID del mensaje de la cola
    this.queueChannelId = null;   // ID del canal donde está el mensaje de cola
  }

  /**
   * Agrega una canción a la cola
   * @param {Object} song - Objeto con información de la canción
   */
  addSong(song) {
    this.songs.push(song);
  }

  /**
   * Agrega múltiples canciones a la cola (playlist)
   * @param {Array} songs - Array de canciones
   */
  addSongs(songs) {
    this.songs.push(...songs);
  }

  /**
   * Remueve una canción por índice
   * @param {number} index - Índice de la canción
   * @returns {Object|null} Canción removida
   */
  removeSong(index) {
    if (index < 0 || index >= this.songs.length) return null;
    return this.songs.splice(index, 1)[0];
  }

  /**
   * Obtiene la siguiente canción (respetando loop mode)
   * @returns {Object|null} Siguiente canción
   */
  getNextSong() {
    if (this.loop === 'song' && this.nowPlaying) {
      // Loop de canción actual
      return this.nowPlaying;
    }

    if (this.songs.length === 0) {
      if (this.loop === 'queue' && this.nowPlaying) {
        // Si loop de cola y no hay más canciones, agregar la actual al final
        this.songs.push(this.nowPlaying);
      }
      return null;
    }

    const nextSong = this.songs.shift();

    if (this.loop === 'queue' && this.nowPlaying) {
      // Agregar canción actual al final de la cola
      this.songs.push(this.nowPlaying);
    }

    this.nowPlaying = nextSong;
    return nextSong;
  }

  /**
   * Limpia toda la cola
   */
  clear() {
    this.songs = [];
  }

  /**
   * Mezcla aleatoriamente la cola
   */
  shuffle() {
    for (let i = this.songs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.songs[i], this.songs[j]] = [this.songs[j], this.songs[i]];
    }
  }

  /**
   * Obtiene una canción por índice
   * @param {number} index - Índice de la canción
   * @returns {Object|null}
   */
  getSong(index) {
    if (index < 0 || index >= this.songs.length) return null;
    return this.songs[index];
  }

  /**
   * Salta a una canción específica
   * @param {number} index - Índice de la canción
   * @returns {Object|null}
   */
  jumpTo(index) {
    if (index < 0 || index >= this.songs.length) return null;

    // Remover todas las canciones antes del índice
    const removed = this.songs.splice(0, index);

    // La canción objetivo ahora está en índice 0
    return this.songs[0];
  }

  /**
   * Obtiene el total de canciones en la cola (sin contar la actual)
   * @returns {number}
   */
  getQueueSize() {
    return this.songs.length;
  }

  /**
   * Obtiene la duración total de la cola
   * @returns {number} Duración en segundos
   */
  getTotalDuration() {
    let total = 0;
    if (this.nowPlaying) total += this.nowPlaying.duration || 0;
    for (const song of this.songs) {
      total += song.duration || 0;
    }
    return total;
  }

  /**
   * Conecta el bot al canal de voz
   * @param {VoiceChannel} voiceChannel - Canal de voz
   * @param {TextChannel} textChannel - Canal de texto
   * @returns {Promise<boolean>}
   */
  async connect(voiceChannel, textChannel) {
    try {
      this.voiceChannel = voiceChannel;
      this.textChannel = textChannel;

      // Crear conexión de voz
      this.connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: this.guildId,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      });

      // Esperar a que la conexión esté lista
      await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);

      // Crear reproductor de audio
      this.player = createAudioPlayer();

      // Suscribir conexión al reproductor
      this.connection.subscribe(this.player);

      // NOTA: Los listeners del player se configuran en musicManager.setupPlayerListeners()
      // para evitar duplicación. No configuramos listeners aquí.

      console.log(`✅ [MusicQueue] Conectado a canal de voz en servidor ${this.guildId}`);
      return true;

    } catch (error) {
      console.error('❌ [MusicQueue] Error al conectar:', error);
      return false;
    }
  }

  /**
   * Reproduce la siguiente canción en la cola
   * @returns {Promise<boolean>}
   */
  async play() {
    if (!this.player || !this.connection) {
      console.error('❌ [MusicQueue] No hay conexión o reproductor');
      return false;
    }

    // Obtener siguiente canción
    const nextSong = this.getNextSong();

    if (!nextSong) {
      console.log('📭 [MusicQueue] No hay más canciones en la cola');
      this.isPlaying = false;

      if (!this.is247) {
        setTimeout(() => this.destroy(), 3000); // Desconectar después de 3 segundos
      }
      return false;
    }

    try {
      console.log(`▶️ [MusicQueue] Reproduciendo: "${nextSong.title}"`);

      // Obtener stream de audio
      const stream = await play.stream(nextSong.url);

      // Crear recurso de audio
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
        inlineVolume: true
      });

      // Ajustar volumen
      if (resource.volume) {
        resource.volume.setVolume(this.volume / 100);
      }

      // Reproducir
      this.player.play(resource);
      this.isPlaying = true;
      this.isPaused = false;

      return true;

    } catch (error) {
      console.error('❌ [MusicQueue] Error al reproducir canción:', error);

      // Enviar mensaje de error al canal de texto
      if (this.textChannel) {
        this.textChannel.send(`❌ Error al reproducir **${nextSong.title}**. Saltando a la siguiente...`).catch(() => {});
      }

      // Intentar con la siguiente canción
      return this.play();
    }
  }

  /**
   * Maneja el fin de una canción
   */
  async handleSongEnd() {
    console.log('🎵 [MusicQueue] Canción terminada, reproduciendo siguiente...');
    await this.play();
  }

  /**
   * Pausa la reproducción actual
   * @returns {boolean}
   */
  pause() {
    if (this.player && this.isPlaying && !this.isPaused) {
      this.player.pause();
      this.isPaused = true;
      this.isPlaying = false;
      console.log('⏸️ [MusicQueue] Reproducción pausada');
      return true;
    }
    return false;
  }

  /**
   * Reanuda la reproducción
   * @returns {boolean}
   */
  resume() {
    if (this.player && this.isPaused) {
      this.player.unpause();
      this.isPaused = false;
      this.isPlaying = true;
      console.log('▶️ [MusicQueue] Reproducción reanudada');
      return true;
    }
    return false;
  }

  /**
   * Salta la canción actual
   * @returns {boolean}
   */
  skip() {
    if (this.player && this.isPlaying) {
      this.player.stop(); // Esto dispara el evento Idle que llama a handleSongEnd
      console.log('⏭️ [MusicQueue] Canción saltada');
      return true;
    }
    return false;
  }

  /**
   * Detiene la reproducción y limpia la cola
   */
  stop() {
    if (this.player) {
      this.player.stop();
    }

    this.songs = [];
    this.nowPlaying = null;
    this.isPlaying = false;
    this.isPaused = false;

    console.log('⏹️ [MusicQueue] Reproducción detenida y cola limpiada');

    if (!this.is247) {
      setTimeout(() => this.destroy(), 1000);
    }
  }

  /**
   * Cambia el volumen de reproducción
   * @param {number} newVolume - Volumen de 0 a 100
   * @returns {number}
   */
  setVolume(newVolume) {
    // Validar rango
    newVolume = Math.max(0, Math.min(100, newVolume));
    this.volume = newVolume;

    // Aplicar al recurso actual si está reproduciendo
    if (this.player?.state?.resource?.volume) {
      this.player.state.resource.volume.setVolume(newVolume / 100);
    }

    console.log(`🔊 [MusicQueue] Volumen cambiado a ${newVolume}%`);
    return this.volume;
  }

  /**
   * Alterna modo loop
   * @returns {string} Nuevo modo ('off', 'song', 'queue')
   */
  toggleLoop() {
    const modes = ['off', 'song', 'queue'];
    const currentIndex = modes.indexOf(this.loop);
    this.loop = modes[(currentIndex + 1) % modes.length];
    console.log(`🔁 [MusicQueue] Modo loop: ${this.loop}`);
    return this.loop;
  }

  /**
   * Alterna modo 24/7
   * @returns {boolean}
   */
  toggle247() {
    this.is247 = !this.is247;
    console.log(`🏯 [MusicQueue] Modo 24/7: ${this.is247 ? 'activado' : 'desactivado'}`);
    return this.is247;
  }

  /**
   * Limpia todos los datos y detiene la reproducción
   */
  destroy() {
    if (this.player) {
      this.player.stop();
      this.player = null;
    }
    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
    }
    this.songs = [];
    this.nowPlaying = null;
    this.isPlaying = false;
    this.isPaused = false;
    console.log('🔇 [MusicQueue] Cola destruida');
  }

  /**
   * Formatea la duración de segundos a MM:SS o HH:MM:SS
   * @param {number} seconds - Duración en segundos
   * @returns {string}
   */
  static formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Crea una barra de progreso ASCII para la canción actual
   * @param {number} currentTime - Tiempo actual en segundos
   * @param {number} totalTime - Duración total en segundos
   * @param {number} length - Longitud de la barra (default: 20)
   * @returns {string}
   */
  static createProgressBar(currentTime, totalTime, length = 20) {
    if (!totalTime || totalTime === 0) return '▬'.repeat(length);

    const progress = currentTime / totalTime;
    const position = Math.floor(progress * length);

    const bar = '▬'.repeat(position) + '🔘' + '▬'.repeat(length - position - 1);
    const percentage = Math.floor(progress * 100);

    return `${bar} ${percentage}%`;
  }
}

module.exports = ServerQueue;

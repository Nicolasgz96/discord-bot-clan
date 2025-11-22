/**
 * DEMON HUNTER - Music Manager (Dojo del Sonido)
 * Sistema completo de reproducción de música con temática samurai
 */

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType
} = require('@discordjs/voice');
const playdl = require('play-dl');
const ytdl = require('@distube/ytdl-core');
const YTDlpWrap = require('yt-dlp-wrap').default;
const { spawn } = require('child_process');
const { Readable } = require('stream');
const https = require('https');
const http = require('http');

// Crear agentes HTTP con keep-alive para mejor rendimiento
const httpAgent = new http.Agent({ keepAlive: true, keepAliveMsecs: 1000, maxSockets: 1 });
const httpsAgent = new https.Agent({ keepAlive: true, keepAliveMsecs: 1000, maxSockets: 1 });
const { EmbedBuilder } = require('discord.js');
const ServerQueue = require('./musicQueue');
const MusicPanel = require('./musicPanel');
const CONSTANTS = require('../config/constants');
const MESSAGES = require('../config/messages');
const EMOJIS = require('../config/emojis');

// Map de colas por servidor
const queues = new Map();

// Timeouts de inactividad por servidor
const inactivityTimeouts = new Map();

// Intervalos de actualización del panel por servidor
const panelUpdateIntervals = new Map();

// Instancia de yt-dlp-wrap (más robusto que ytdl-core)
let ytDlpWrap = null;
try {
  // yt-dlp está instalado en /usr/bin/yt-dlp
  ytDlpWrap = new YTDlpWrap('/usr/bin/yt-dlp');
  console.log('✅ [MusicManager] yt-dlp-wrap inicializado con yt-dlp del sistema');
} catch (error) {
  console.warn('⚠️ [MusicManager] yt-dlp-wrap no disponible:', error.message);
  console.warn('💡 yt-dlp está instalado pero yt-dlp-wrap no pudo inicializarlo');
}

// ==================== SPOTIFY SUPPORT ====================

// Configuración de Spotify API
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Cache de access token (expira en 1 hora)
let spotifyAccessToken = null;
let spotifyTokenExpiry = 0;

/**
 * Obtiene un access token de Spotify usando Client Credentials Flow
 * @returns {Promise<string>} Access token
 */
async function getSpotifyAccessToken() {
  // Si ya tenemos un token válido, retornarlo
  if (spotifyAccessToken && Date.now() < spotifyTokenExpiry) {
    return spotifyAccessToken;
  }

  // Verificar que las credenciales estén configuradas
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error(
      'Credenciales de Spotify no configuradas. ' +
      'Por favor agrega SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET a tu archivo .env'
    );
  }

  try {
    console.log('🔑 [Spotify] Obteniendo nuevo access token...');

    const authString = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Spotify Auth failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    spotifyAccessToken = data.access_token;
    // Guardar expiry (1 hora menos 5 minutos de margen)
    spotifyTokenExpiry = Date.now() + ((data.expires_in - 300) * 1000);

    console.log('✅ [Spotify] Access token obtenido');
    return spotifyAccessToken;
  } catch (error) {
    console.error('❌ [Spotify] Error obteniendo access token:', error.message);
    throw error;
  }
}

/**
 * Detecta si una URL es de Spotify
 * @param {string} url - URL a verificar
 * @returns {Object|null} {type: 'track'|'playlist'|'album', id: string} o null
 */
function detectSpotifyURL(url) {
  const trackMatch = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (trackMatch) return { type: 'track', id: trackMatch[1] };

  const playlistMatch = url.match(/spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
  if (playlistMatch) return { type: 'playlist', id: playlistMatch[1] };

  const albumMatch = url.match(/spotify\.com\/album\/([a-zA-Z0-9]+)/);
  if (albumMatch) return { type: 'album', id: albumMatch[1] };

  return null;
}

/**
 * Obtiene información de un track de Spotify usando embed
 * @param {string} trackId - ID del track de Spotify
 * @returns {Promise<Object>} {title, artist, duration}
 */
async function getSpotifyTrackInfo(trackId) {
  try {
    const embedUrl = `https://open.spotify.com/oembed?url=spotify:track:${trackId}`;
    const response = await fetch(embedUrl);

    if (!response.ok) {
      throw new Error(`Spotify API returned ${response.status}`);
    }

    const data = await response.json();

    // El título viene como "Artista - Canción"
    const fullTitle = data.title || '';
    const parts = fullTitle.split(' - ');
    const artist = parts[0] || 'Unknown Artist';
    const title = parts.slice(1).join(' - ') || fullTitle;

    return {
      title: `${artist} - ${title}`,
      artist,
      songName: title,
      spotifyUrl: `https://open.spotify.com/track/${trackId}`
    };
  } catch (error) {
    console.error(`❌ Error obteniendo info de Spotify track ${trackId}:`, error.message);
    throw error;
  }
}

/**
 * Obtiene información de una playlist/album de Spotify usando la API oficial
 * @param {string} playlistId - ID de la playlist
 * @param {string} type - 'playlist' o 'album'
 * @returns {Promise<Array>} Array de {title, artist}
 */
async function getSpotifyPlaylist(playlistId, type = 'playlist') {
  try {
    const url = `https://open.spotify.com/${type}/${playlistId}`;
    console.log(`🔍 [Spotify] Obteniendo ${type} usando API oficial: ${url}`);

    // Obtener access token
    const accessToken = await getSpotifyAccessToken();

    let tracks = [];
    let nextUrl = null;

    // Endpoint según el tipo
    if (type === 'playlist') {
      // Obtener tracks de playlist (paginado de 100 en 100)
      let offset = 0;
      const limit = 100;

      do {
        const apiUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`;
        console.log(`📥 [Spotify] Obteniendo tracks ${offset + 1}-${offset + limit}...`);

        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Spotify API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();

        // Extraer tracks
        for (const item of data.items || []) {
          if (!item.track) continue;

          const track = item.track;
          const artists = track.artists || [];
          const artistNames = artists.map(a => a.name).filter(Boolean);
          const title = track.name;

          if (title && artistNames.length > 0) {
            tracks.push({
              title: `${artistNames.join(', ')} - ${title}`,
              artist: artistNames.join(', '),
              songName: title
            });
          }
        }

        // Verificar si hay más páginas
        if (data.next && tracks.length < CONSTANTS.MUSIC.MAX_PLAYLIST_SIZE) {
          offset += limit;
        } else {
          nextUrl = null;
        }
      } while (nextUrl && tracks.length < CONSTANTS.MUSIC.MAX_PLAYLIST_SIZE);

    } else if (type === 'album') {
      // Obtener tracks de album
      const apiUrl = `https://api.spotify.com/v1/albums/${playlistId}/tracks?limit=50`;
      console.log(`📥 [Spotify] Obteniendo tracks del album...`);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Spotify API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      // Extraer tracks
      for (const track of data.items || []) {
        const artists = track.artists || [];
        const artistNames = artists.map(a => a.name).filter(Boolean);
        const title = track.name;

        if (title && artistNames.length > 0) {
          tracks.push({
            title: `${artistNames.join(', ')} - ${title}`,
            artist: artistNames.join(', '),
            songName: title
          });
        }
      }
    }

    if (tracks.length === 0) {
      throw new Error(`La ${type} de Spotify está vacía o no contiene tracks válidos`);
    }

    console.log(`✅ [Spotify API] Extraídos ${tracks.length} tracks de ${type} ${playlistId}`);
    return tracks;
  } catch (error) {
    console.error(`❌ Error obteniendo ${type} de Spotify:`, error.message);
    throw error;
  }
}

/**
 * Obtiene o crea la cola de un servidor
 * @param {string} guildId - ID del servidor
 * @returns {ServerQueue}
 */
function getQueue(guildId) {
  if (!queues.has(guildId)) {
    queues.set(guildId, new ServerQueue(guildId));
  }
  return queues.get(guildId);
}

/**
 * Elimina la cola de un servidor
 * @param {string} guildId - ID del servidor
 */
async function deleteQueue(guildId) {
  // Limpiar intervalos de actualización del panel
  if (panelUpdateIntervals.has(guildId)) {
    clearInterval(panelUpdateIntervals.get(guildId));
    panelUpdateIntervals.delete(guildId);
  }

  const queue = queues.get(guildId);
  if (queue) {
    // Eliminar mensaje de la cola si existe
    await deleteQueueMessage(queue);

    queue.destroy();
    queues.delete(guildId);
  }

  // Limpiar timeout de inactividad
  if (inactivityTimeouts.has(guildId)) {
    clearTimeout(inactivityTimeouts.get(guildId));
    inactivityTimeouts.delete(guildId);
  }
}

/**
 * Limpia mensajes antiguos del canal de música (excepto el panel)
 * Similar a Hydra Bot - mantiene el chat limpio
 * @param {TextChannel} channel - Canal de texto
 * @param {string} panelMessageId - ID del mensaje del panel (no borrar)
 */
async function cleanMusicChannel(channel, panelMessageId) {
  try {
    // Solo limpiar si es el canal de música configurado
    const config = require('../config.json');
    if (!config.musicChannel?.enabled || channel.id !== config.musicChannel.channelId) {
      return;
    }

    // Obtener mensajes recientes (últimos 50)
    const messages = await channel.messages.fetch({ limit: 50 });
    
    // Filtrar mensajes a borrar (no el panel, no más antiguos de 2 horas)
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    const messagesToDelete = messages.filter(msg => {
      // No borrar el panel
      if (msg.id === panelMessageId) return false;
      // No borrar mensajes del bot que sean embeds (pueden ser importantes)
      if (msg.author.id === channel.client.user.id && msg.embeds.length > 0) {
        // Solo borrar embeds antiguos (más de 5 minutos)
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        return msg.createdTimestamp < fiveMinutesAgo;
      }
      // Borrar mensajes de texto normales del bot
      if (msg.author.id === channel.client.user.id) return true;
      // Borrar mensajes muy antiguos (más de 2 horas)
      return msg.createdTimestamp < twoHoursAgo;
    });

    // Borrar en lotes (Discord limita a 100 mensajes por bulk delete)
    if (messagesToDelete.size > 0) {
      const messagesArray = Array.from(messagesToDelete.values());
      const batches = [];
      for (let i = 0; i < messagesArray.length; i += 100) {
        batches.push(messagesArray.slice(i, i + 100));
      }

      for (const batch of batches) {
        // Solo borrar mensajes de menos de 14 días (límite de Discord)
        const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
        const deletable = batch.filter(msg => msg.createdTimestamp > twoWeeksAgo);
        
        if (deletable.length > 0) {
          if (deletable.length === 1) {
            await deletable[0].delete().catch(() => {});
          } else {
            await channel.bulkDelete(deletable, true).catch(() => {});
          }
        }
      }
    }
  } catch (error) {
    // Silenciar errores de permisos o límites de rate
    console.warn('⚠️ [MusicManager] No se pudieron limpiar algunos mensajes:', error.message);
  }
}

/**
 * Inicia la actualización automática del panel (cada 5 segundos)
 * @param {ServerQueue} queue - Cola del servidor
 */
function startPanelAutoUpdate(queue) {
  // Limpiar intervalo anterior si existe
  if (panelUpdateIntervals.has(queue.guildId)) {
    clearInterval(panelUpdateIntervals.get(queue.guildId));
  }

  // Crear nuevo intervalo
  const interval = setInterval(async () => {
    if (!queue.textChannel || !queue.panelMessageId) {
      clearInterval(interval);
      panelUpdateIntervals.delete(queue.guildId);
      return;
    }

    // Solo actualizar si hay música reproduciéndose
    if (queue.isPlaying || queue.isPaused) {
      try {
        await MusicPanel.createOrUpdatePanel(queue, queue.textChannel);
      } catch (error) {
        // Si el panel fue borrado, limpiar intervalo
        if (error.code === 10008) { // Unknown Message
          clearInterval(interval);
          panelUpdateIntervals.delete(queue.guildId);
          queue.panelMessageId = null;
          queue.panelChannelId = null;
        }
      }
    }
  }, 5000); // Actualizar cada 5 segundos

  panelUpdateIntervals.set(queue.guildId, interval);
}

/**
 * Detiene la actualización automática del panel
 * @param {string} guildId - ID del servidor
 */
function stopPanelAutoUpdate(guildId) {
  if (panelUpdateIntervals.has(guildId)) {
    clearInterval(panelUpdateIntervals.get(guildId));
    panelUpdateIntervals.delete(guildId);
  }
}

/**
 * Verifica si un usuario está en el canal de voz correcto
 * @param {GuildMember} member - Miembro del servidor
 * @param {ServerQueue} queue - Cola del servidor
 * @returns {boolean}
 */
function checkUserVoiceChannel(member, queue) {
  const userVoiceChannel = member.voice.channel;

  if (!userVoiceChannel) {
    return false;
  }

  if (queue && queue.voiceChannel && userVoiceChannel.id !== queue.voiceChannel.id) {
    return false;
  }

  return true;
}

/**
 * Conecta el bot a un canal de voz
 * @param {VoiceChannel} voiceChannel - Canal de voz
 * @returns {VoiceConnection}
 */
async function connectToChannel(voiceChannel) {
  try {
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    await entersState(connection, VoiceConnectionStatus.Ready, 20_000);

    console.log(`✓ Conectado a canal de voz: ${voiceChannel.name} (${voiceChannel.guild.name})`);

    return connection;
  } catch (error) {
    console.error(`Error conectando a canal de voz:`, error);
    throw error;
  }
}

/**
 * Busca canciones en YouTube o Spotify
 * @param {string} query - Término de búsqueda o URL (YouTube o Spotify)
 * @param {Object} options - Opciones de búsqueda
 * @returns {Promise<Array>} Array de resultados
 */
async function searchSongs(query, options = {}) {
  try {
    const limit = options.limit || CONSTANTS.MUSIC.SEARCH_RESULTS_LIMIT;

    // ==================== SPOTIFY SUPPORT ====================
    const spotifyInfo = detectSpotifyURL(query);
    if (spotifyInfo) {
      console.log(`🎵 [Spotify] Detectado ${spotifyInfo.type}: ${spotifyInfo.id}`);

      if (spotifyInfo.type === 'track') {
        // Track individual de Spotify
        const trackInfo = await getSpotifyTrackInfo(spotifyInfo.id);
        console.log(`🔍 [Spotify] Buscando en YouTube: "${trackInfo.title}"`);

        // Buscar en YouTube
        const searchResults = await playdl.search(trackInfo.title, {
          limit: 1,
          source: { youtube: 'video' }
        });

        if (searchResults.length === 0) {
          throw new Error(`No se encontró "${trackInfo.title}" en YouTube`);
        }

        const video = searchResults[0];
        return [{
          title: video.title,
          url: video.url,
          duration: video.durationInSec || 0,
          thumbnail: video.thumbnails[0]?.url || null,
          channel: video.channel?.name || 'Desconocido',
          spotifyUrl: trackInfo.spotifyUrl
        }];

      } else if (spotifyInfo.type === 'playlist' || spotifyInfo.type === 'album') {
        // Playlist o album de Spotify
        const tracks = await getSpotifyPlaylist(spotifyInfo.id, spotifyInfo.type);

        if (tracks.length === 0) {
          throw new Error(`La ${spotifyInfo.type} de Spotify está vacía`);
        }

        console.log(`🔍 [Spotify] Buscando ${tracks.length} canciones en YouTube...`);

        // Limitar a MAX_PLAYLIST_SIZE
        const limitedTracks = tracks.slice(0, CONSTANTS.MUSIC.MAX_PLAYLIST_SIZE);
        const results = [];

        // Buscar cada track en YouTube (con límite de concurrencia)
        for (let i = 0; i < limitedTracks.length; i++) {
          const track = limitedTracks[i];
          console.log(`🔍 [${i + 1}/${limitedTracks.length}] Buscando: ${track.title}`);

          try {
            const searchResults = await playdl.search(track.title, {
              limit: 1,
              source: { youtube: 'video' }
            });

            if (searchResults.length > 0) {
              const video = searchResults[0];
              results.push({
                title: video.title,
                url: video.url,
                duration: video.durationInSec || 0,
                thumbnail: video.thumbnails[0]?.url || null,
                channel: video.channel?.name || 'Desconocido'
              });
            } else {
              console.warn(`⚠️ No se encontró en YouTube: ${track.title}`);
            }

            // Pequeño delay para no saturar YouTube
            if (i < limitedTracks.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          } catch (error) {
            console.error(`❌ Error buscando "${track.title}":`, error.message);
          }
        }

        console.log(`✅ [Spotify] ${results.length}/${limitedTracks.length} canciones encontradas en YouTube`);
        return results;
      }
    }

    // ==================== YOUTUBE SUPPORT ====================
    const urlValidation = playdl.yt_validate(query);
    const isURL = urlValidation !== false;

    if (isURL) {
      const type = urlValidation;

      // Detectar si es una URL de playlist explícita
      // IMPORTANTE: URLs con watch?v= son SIEMPRE videos individuales, incluso si tienen list= como parámetro
      const isWatchUrl = query.includes('watch?v=') || query.includes('youtu.be/');
      // Detectar playlist: debe tener /playlist? o list= sin watch?v=
      const isPlaylistUrl = (query.includes('/playlist?') || (query.includes('list=') && !isWatchUrl)) && !isWatchUrl;
      
      // Si tiene watch?v= o youtu.be/, es SIEMPRE un video individual (no playlist)
      if (isWatchUrl) {
        // Video individual - limpiar URL primero para evitar parámetros que causen problemas
        try {
          // Extraer solo el ID del video de la URL para construir una URL limpia
          let cleanUrl = query;
          const videoIdMatch = query.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
          if (videoIdMatch && videoIdMatch[1]) {
            cleanUrl = `https://www.youtube.com/watch?v=${videoIdMatch[1]}`;
            console.log(`🎬 [MusicManager] URL limpiada para video individual: ${cleanUrl}`);
          }
          
          console.log(`🎬 [MusicManager] Detectado video individual: ${cleanUrl}`);
          const info = await playdl.video_info(cleanUrl);
          
          // Asegurar que tenemos una URL válida - usar la URL limpia
          let videoUrl = cleanUrl;
          if (info.video_details.id && !videoUrl.includes(info.video_details.id)) {
            videoUrl = `https://www.youtube.com/watch?v=${info.video_details.id}`;
          }
          
          // Validar que la URL final sea válida
          const finalValidation = playdl.yt_validate(videoUrl);
          if (finalValidation === false) {
            throw new Error(`URL final no válida: ${videoUrl}`);
          }
          
          return [{
            title: info.video_details.title,
            url: videoUrl,
            duration: info.video_details.durationInSec,
            thumbnail: info.video_details.thumbnails?.[0]?.url || null,
            channel: info.video_details.channel?.name || 'Desconocido'
          }];
        } catch (error) {
          console.error('❌ [MusicManager] Error obteniendo info del video:', error);
          // Si falla, intentar búsqueda normal
          throw error;
        }
      } else if (isPlaylistUrl) {
        // Solo procesar si es explícitamente una playlist (no tiene watch?v=)
        // Playlist explícita
        console.log(`📋 [MusicManager] Detectada playlist: ${query}`);
        try {
          const playlist = await playdl.playlist_info(query);
          const videos = await playlist.all_videos();

          if (!videos || videos.length === 0) {
            console.warn('⚠️ [MusicManager] Playlist vacía o sin videos');
            throw new Error('Playlist vacía');
          }

          console.log(`📋 [MusicManager] Playlist contiene ${videos.length} videos`);

          // Limitar a MAX_PLAYLIST_SIZE
          const limitedVideos = videos.slice(0, CONSTANTS.MUSIC.MAX_PLAYLIST_SIZE);
          console.log(`📋 [MusicManager] Agregando ${limitedVideos.length} videos a la cola (límite: ${CONSTANTS.MUSIC.MAX_PLAYLIST_SIZE})`);

          const processedVideos = limitedVideos.map((video, index) => {
            // Construir URL válida - usar el método correcto de play-dl
            let videoUrl;
            if (video.url) {
              videoUrl = video.url;
            } else if (video.id) {
              // Asegurar formato correcto de URL
              videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
            } else {
              console.warn(`⚠️ [MusicManager] Video ${index + 1} sin URL ni ID, omitiendo`);
              return null;
            }

            return {
              title: video.title || 'Desconocido',
              url: videoUrl,
              duration: video.durationInSec || 0,
              thumbnail: video.thumbnails?.[0]?.url || null,
              channel: video.channel?.name || 'Desconocido'
            };
          }).filter(video => video !== null); // Filtrar nulos

          console.log(`✅ [MusicManager] Playlist procesada: ${processedVideos.length} videos listos`);
          return processedVideos;
        } catch (error) {
          console.error('❌ [MusicManager] Error procesando playlist:', error);
          throw error;
        }
      }
    }

    // Buscar en YouTube
    const searchResults = await playdl.search(query, {
      limit: limit,
      source: { youtube: 'video' }
    });

    if (searchResults.length === 0) {
      return [];
    }

    return searchResults.map(video => ({
      title: video.title,
      url: video.url,
      duration: video.durationInSec || 0,
      thumbnail: video.thumbnails[0]?.url || null,
      channel: video.channel?.name || 'Desconocido'
    }));

  } catch (error) {
    console.error('Error buscando canciones:', error);
    throw error;
  }
}

/**
 * Reproduce una canción
 * @param {ServerQueue} queue - Cola del servidor
 */
async function playSong(queue) {
  // Verificar que existe conexión y player
  if (!queue.connection || !queue.player) {
    console.error('❌ [MusicManager] No hay conexión o player disponible');
    queue.isPlaying = false;
    return;
  }

  // Verificar que la conexión esté lista
  if (queue.connection.state.status === VoiceConnectionStatus.Destroyed || 
      queue.connection.state.status === VoiceConnectionStatus.Disconnected) {
    console.error('❌ [MusicManager] Conexión de voz no disponible');
    queue.isPlaying = false;
    return;
  }

  const song = queue.getNextSong();

  if (!song) {
    // No hay más canciones
    if (!queue.is247) {
      // Si no está en modo 24/7, desconectar después de un tiempo
      setInactivityTimeout(queue.guildId);
    }
    queue.isPlaying = false;
    return;
  }

  queue.isPlaying = true;
  queue.isPaused = false;

  try {
    console.log(`🎵 [MusicManager] Obteniendo stream para: "${song.title}"`);
    console.log(`🔗 [MusicManager] URL: ${song.url}`);
    
    // Asegurar que la URL esté en formato correcto para play-dl
    // Extraer ID del video y construir URL limpia
    let validUrl = song.url;
    const videoIdMatch = song.url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (videoIdMatch && videoIdMatch[1]) {
      validUrl = `https://www.youtube.com/watch?v=${videoIdMatch[1]}`;
      if (validUrl !== song.url) {
        console.log(`🔧 [MusicManager] URL limpiada: ${song.url} -> ${validUrl}`);
      }
    }
    
    // Validar URL antes de intentar obtener stream
    const urlValidation = playdl.yt_validate(validUrl);
    if (urlValidation === false) {
      throw new Error(`URL inválida después de limpiar: ${validUrl} (original: ${song.url})`);
    }
    
    if (urlValidation !== 'video') {
      console.warn(`⚠️ [MusicManager] URL validada como '${urlValidation}', esperado 'video'`);
    }
    
    // Obtener información del video primero
    console.log(`📥 [MusicManager] Obteniendo información del video...`);
    const videoInfo = await playdl.video_info(validUrl);
    
    if (!videoInfo || !videoInfo.video_details) {
      throw new Error('No se pudo obtener información del video');
    }
    
    console.log(`✅ [MusicManager] Información del video obtenida: ${videoInfo.video_details.title}`);
    
    // Intentar obtener stream - probar múltiples métodos
    console.log(`🎬 [MusicManager] Obteniendo stream...`);
    let stream;
    let streamMethod = 'unknown';
    
    // Método 1: Usar yt-dlp directamente con spawn (más confiable, como Euphon)
    try {
      console.log(`🔄 [MusicManager] Intentando método 1: yt-dlp spawn directo (método Euphon)...`);
      const videoId = videoInfo.video_details.id;
      if (videoId) {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        // Usar spawn directamente para tener mejor control del proceso
        // Priorizar opus/webm para mejor streaming sin cortes
        const ytdlp = spawn('yt-dlp', [
          videoUrl,
          '-f', 'bestaudio[ext=webm][acodec=opus]/bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio/best',
          '--no-playlist',
          '--no-warnings',
          '-o', '-' // Output a stdout
        ]);
        
        // Manejar errores del proceso sin cerrar el stream
        ytdlp.stderr.on('data', (data) => {
          // Solo loguear si no es un warning común
          const errorStr = data.toString();
          if (!errorStr.includes('WARNING') && !errorStr.includes('DeprecationWarning')) {
            console.warn(`⚠️ [yt-dlp] stderr: ${errorStr.substring(0, 100)}`);
          }
        });
        
        // Manejar el cierre del proceso (no lanzar error si termina normalmente)
        ytdlp.on('close', (code) => {
          if (code !== 0 && code !== null) {
            console.warn(`⚠️ [yt-dlp] Proceso terminó con código: ${code}`);
          }
        });
        
        ytdlp.on('error', (err) => {
          console.error(`❌ [yt-dlp] Error en proceso: ${err.message}`);
        });
        
        // El stdout de yt-dlp es nuestro stream de audio
        // Guardar referencia al proceso en la queue para evitar que se cierre
        if (!queue._ytdlpProcesses) {
          queue._ytdlpProcesses = [];
        }
        queue._ytdlpProcesses.push(ytdlp);
        
        // Prevenir que el stream se cierre prematuramente
        ytdlp.stdout.on('error', (err) => {
          console.error(`❌ [yt-dlp] Error en stdout: ${err.message}`);
        });
        
        // No cerrar el proceso cuando el stream termine (se cerrará cuando termine la canción)
        ytdlp.stdout.on('end', () => {
          console.log('📡 [yt-dlp] Stream stdout terminó (normal)');
        });
        
        stream = {
          stream: ytdlp.stdout,
          type: StreamType.Arbitrary
        };
        streamMethod = 'yt_dlp_spawn';
        console.log(`✅ [MusicManager] Stream obtenido con método 1 (yt-dlp spawn directo)`);
      } else {
        throw new Error('No se pudo obtener ID del video');
      }
    } catch (error1) {
      console.warn(`⚠️ [MusicManager] Método 1 (yt-dlp directo) falló: ${error1.message}`);
      
      // Método 2: Intentar stream directo con la URL limpia (play-dl)
      try {
        console.log(`🔄 [MusicManager] Intentando método 2: play-dl stream() con URL limpia...`);
        stream = await Promise.race([
          playdl.stream(validUrl),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 30000)
          )
        ]);
        streamMethod = 'playdl_stream';
        console.log(`✅ [MusicManager] Stream obtenido con método 2 (play-dl stream)`);
      } catch (error2) {
        console.warn(`⚠️ [MusicManager] Método 2 falló: ${error2.message}`);
        
        // Método 3: Intentar con el ID del video (play-dl)
        try {
          const videoId = videoInfo.video_details.id;
          if (videoId) {
            const videoIdUrl = `https://www.youtube.com/watch?v=${videoId}`;
            console.log(`🔄 [MusicManager] Intentando método 3: play-dl stream() con ID...`);
            stream = await Promise.race([
              playdl.stream(videoIdUrl),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 30000)
              )
            ]);
            streamMethod = 'playdl_stream_id';
            console.log(`✅ [MusicManager] Stream obtenido con método 3 (play-dl con ID)`);
          } else {
            throw new Error('No se pudo obtener ID del video');
          }
        } catch (error3) {
          console.warn(`⚠️ [MusicManager] Método 3 falló: ${error3.message}`);
          
          // Método 4: Intentar stream_from_info (puede fallar pero intentamos)
          try {
            console.log(`🔄 [MusicManager] Intentando método 4: stream_from_info()...`);
            stream = await Promise.race([
              playdl.stream_from_info(videoInfo.video_details),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 30000)
              )
            ]);
            streamMethod = 'stream_from_info';
            console.log(`✅ [MusicManager] Stream obtenido con método 4 (stream_from_info)`);
          } catch (error4) {
            console.warn(`⚠️ [MusicManager] Método 4 falló: ${error4.message}`);
            
            // Método 5: Usar ytdl-core como fallback
            try {
              console.log(`🔄 [MusicManager] Intentando método 5: ytdl-core...`);
              const videoId = videoInfo.video_details.id;
              if (videoId) {
                const ytdlStream = ytdl(`https://www.youtube.com/watch?v=${videoId}`, {
                  filter: 'audioonly',
                  quality: 'highestaudio',
                  highWaterMark: 1 << 25
                });
                
                stream = {
                  stream: ytdlStream,
                  type: StreamType.Arbitrary
                };
                streamMethod = 'ytdl_core';
                console.log(`✅ [MusicManager] Stream obtenido con método 5 (ytdl-core)`);
              } else {
                throw new Error('No se pudo obtener ID del video');
              }
            } catch (error5) {
              console.error(`❌ [MusicManager] Todos los métodos fallaron:`);
              console.error(`   Método 1 (yt-dlp directo): ${error1.message}`);
              console.error(`   Método 2 (play-dl stream): ${error2.message}`);
              console.error(`   Método 3 (play-dl con ID): ${error3.message}`);
              console.error(`   Método 4 (stream_from_info): ${error4.message}`);
              console.error(`   Método 5 (ytdl-core): ${error5.message}`);
              throw new Error(`No se pudo obtener stream con ningún método.`);
            }
          }
        }
      }
    }

    // Verificar estructura del stream (puede variar según la versión de play-dl)
    if (!stream) {
      throw new Error('Stream no disponible');
    }
    
    // El stream puede venir en diferentes formatos
    const streamData = stream.stream || stream;
    let streamType = stream.type || StreamType.Arbitrary;
    
    if (!streamData) {
      throw new Error('Stream data no disponible');
    }

    // Si es ytdl-core, asegurar que usamos el tipo correcto
    if (streamMethod === 'ytdl_core') {
      streamType = StreamType.Arbitrary;
    }

    // Crear recurso de audio con opciones optimizadas para streaming fluido
    let resourceOptions = {
      inputType: streamType,
      inlineVolume: true
    };
    
    // Para yt-dlp spawn, optimizar para streaming sin cortes
    if (streamMethod === 'yt_dlp_spawn') {
      resourceOptions.inputType = StreamType.Arbitrary;
      // No especificar buffering aquí, dejar que discord.js lo maneje automáticamente
    }
    
    // Para yt-dlp-wrap, optimizar para streaming sin cortes
    if (streamMethod === 'yt_dlp_wrap') {
      resourceOptions.inputType = StreamType.Arbitrary;
      // No especificar buffering aquí, dejar que discord.js lo maneje automáticamente
    }
    
    // Para ytdl-core, forzar Arbitrary para que discord.js procese el stream correctamente
    if (streamMethod === 'ytdl_core') {
      resourceOptions.inputType = StreamType.Arbitrary;
    }
    
    const resource = createAudioResource(streamData, resourceOptions);

    // Ajustar volumen
    if (resource.volume) {
      resource.volume.setVolume(queue.volume / 100);
    }

    // Verificar que el player esté en un estado válido antes de reproducir
    if (queue.player.state.status === AudioPlayerStatus.Playing) {
      queue.player.stop();
    }

    // Reproducir
    queue.player.play(resource);

    // Limpiar timeout de inactividad (si existe)
    if (inactivityTimeouts.has(queue.guildId)) {
      clearTimeout(inactivityTimeouts.get(queue.guildId));
      inactivityTimeouts.delete(queue.guildId);
    }

    // Crear o actualizar panel musical (tipo Hydra)
    if (queue.textChannel) {
      try {
        await MusicPanel.createOrUpdatePanel(queue, queue.textChannel);
        // Limpiar mensajes antiguos del chat (excepto el panel)
        await cleanMusicChannel(queue.textChannel, queue.panelMessageId);
        // Iniciar actualización automática del panel
        startPanelAutoUpdate(queue);
      } catch (error) {
        console.error('Error creando/actualizando panel:', error);
      }
    }

    console.log(`✅ [MusicManager] Reproduciendo: "${song.title}"`);

  } catch (error) {
    console.error('❌ [MusicManager] Error reproduciendo canción:', error.message || error);

    // Informar error
    if (queue.textChannel) {
      const errorMsg = song 
        ? `❌ Error al reproducir **${song.title}**. Saltando a la siguiente...`
        : MESSAGES.MUSIC.PLAYBACK_ERROR;
      queue.textChannel.send(errorMsg).catch(console.error);
    }

    // Si la canción falló, removerla de nowPlaying y continuar
    if (queue.nowPlaying && queue.nowPlaying.url === song?.url) {
      queue.nowPlaying = null;
    }

    // Intentar siguiente canción después de un breve delay
    setTimeout(() => {
      playSong(queue);
    }, 2000);
  }
}

/**
 * Crea un embed de "Now Playing"
 * @param {Object} song - Información de la canción
 * @param {ServerQueue} queue - Cola del servidor
 * @returns {EmbedBuilder}
 */
function createNowPlayingEmbed(song, queue) {
  const embed = new EmbedBuilder()
    .setColor('#FF6B6B')
    .setTitle(`${EMOJIS.NOW_PLAYING} Sonando Ahora en el Dojo`)
    .setDescription(`**${song.title}**`)
    .addFields([
      { name: `${EMOJIS.MICROPHONE} Canal`, value: song.channel || 'Desconocido', inline: true },
      { name: `${EMOJIS.CLOCK} Duración`, value: ServerQueue.formatDuration(song.duration), inline: true },
      { name: `${EMOJIS.VOLUME_HIGH} Volumen`, value: `${queue.volume}%`, inline: true },
    ])
    .setFooter({ text: MESSAGES.MUSIC.FOOTER });

  if (song.thumbnail) {
    embed.setThumbnail(song.thumbnail);
  }

  if (song.requestedBy) {
    embed.addFields([
      { name: `${EMOJIS.KATANA} Pedido por`, value: `<@${song.requestedBy}>`, inline: false }
    ]);
  }

  // Información de loop
  if (queue.loop !== 'off') {
    const loopText = queue.loop === 'song' ? 'Canción' : 'Cola';
    embed.addFields([
      { name: `${EMOJIS.LOOP} Repetición`, value: loopText, inline: true }
    ]);
  }

  // Canciones en cola
  if (queue.songs.length > 0) {
    embed.addFields([
      { name: `${EMOJIS.QUEUE} Próximas`, value: `${queue.songs.length} canciones`, inline: true }
    ]);
  }

  return embed;
}

/**
 * Crea un embed de cola de música
 * @param {ServerQueue} queue - Cola del servidor
 * @param {number} page - Página actual (0-indexed)
 * @returns {EmbedBuilder}
 */
function createQueueEmbed(queue, page = 0) {
  const songsPerPage = 10;
  const start = page * songsPerPage;
  const end = start + songsPerPage;

  const embed = new EmbedBuilder()
    .setColor('#4A90E2')
    .setTitle(`${EMOJIS.QUEUE} Cola de Música - Dojo Samurai`)
    .setFooter({ text: MESSAGES.MUSIC.FOOTER });

  // Canción actual
  if (queue.nowPlaying) {
    embed.addFields([
      {
        name: `${EMOJIS.NOW_PLAYING} Sonando Ahora`,
        value: `**${queue.nowPlaying.title}** [${ServerQueue.formatDuration(queue.nowPlaying.duration)}]`,
        inline: false
      }
    ]);
  }

  // Lista de canciones
  if (queue.songs.length === 0) {
    embed.setDescription(MESSAGES.MUSIC.QUEUE_EMPTY);
  } else {
    const queueList = queue.songs
      .slice(start, end)
      .map((song, index) => {
        const position = start + index + 1;
        return `**${position}.** ${song.title} [${ServerQueue.formatDuration(song.duration)}]`;
      })
      .join('\n');

    embed.addFields([
      {
        name: `${EMOJIS.SCROLL} Próximas Canciones`,
        value: queueList,
        inline: false
      }
    ]);

    // Información adicional
    const totalPages = Math.ceil(queue.songs.length / songsPerPage);
    const totalDuration = queue.getTotalDuration();

    embed.addFields([
      {
        name: '📊 Estadísticas',
        value: `**Total:** ${queue.songs.length} canciones | **Duración:** ${ServerQueue.formatDuration(totalDuration)}\n**Página:** ${page + 1}/${totalPages}`,
        inline: false
      }
    ]);
  }

  // Loop mode
  if (queue.loop !== 'off') {
    const loopEmoji = queue.loop === 'song' ? EMOJIS.LOOP_ONE : EMOJIS.LOOP;
    const loopText = queue.loop === 'song' ? 'Canción' : 'Cola completa';
    embed.addFields([
      { name: `${loopEmoji} Repetición`, value: loopText, inline: true }
    ]);
  }

  // Volume
  embed.addFields([
    { name: `${EMOJIS.VOLUME_HIGH} Volumen`, value: `${queue.volume}%`, inline: true }
  ]);

  return embed;
}

/**
 * Establece un timeout de inactividad
 * @param {string} guildId - ID del servidor
 */
function setInactivityTimeout(guildId) {
  // Limpiar timeout previo
  if (inactivityTimeouts.has(guildId)) {
    clearTimeout(inactivityTimeouts.get(guildId));
  }

  const timeout = setTimeout(() => {
    const queue = queues.get(guildId);
    if (queue && !queue.is247) {
      if (queue.textChannel) {
        queue.textChannel.send(MESSAGES.MUSIC.DISCONNECTED_INACTIVITY).catch(console.error);
      }
      deleteQueue(guildId);
    }
  }, CONSTANTS.MUSIC.INACTIVITY_TIMEOUT * 1000);

  inactivityTimeouts.set(guildId, timeout);
}

/**
 * Configura los event listeners del audio player
 * @param {ServerQueue} queue - Cola del servidor
 */
function setupPlayerListeners(queue) {
  // Evitar configurar listeners múltiples veces
  if (queue._listenersSetup) {
    console.log('⚠️ [MusicManager] Listeners ya configurados, omitiendo...');
    return;
  }

  queue.player.on(AudioPlayerStatus.Idle, async () => {
    // Limpiar procesos yt-dlp anteriores
    if (queue._ytdlpProcesses && queue._ytdlpProcesses.length > 0) {
      queue._ytdlpProcesses.forEach(process => {
        if (!process.killed) {
          process.kill('SIGTERM');
        }
      });
      queue._ytdlpProcesses = [];
    }
    
    // Canción terminó, reproducir siguiente
    console.log('🎵 [MusicManager] Canción terminó, reproduciendo siguiente...');
    await playSong(queue);

    // Actualizar panel si existe
    if (queue.panelMessageId && queue.textChannel) {
      try {
        await MusicPanel.createOrUpdatePanel(queue, queue.textChannel);
        await cleanMusicChannel(queue.textChannel, queue.panelMessageId);
      } catch (error) {
        console.error('Error actualizando panel:', error);
      }
    }

    // Actualizar mensaje de la cola si existe
    if (queue.queueMessageId) {
      try {
        await updateQueueMessage(queue);
      } catch (error) {
        console.error('Error actualizando mensaje de cola:', error);
      }
    }

    // Si la cola está vacía y no hay canción reproduciéndose, eliminar mensaje de cola
    if (!queue.nowPlaying && queue.songs.length === 0 && queue.queueMessageId) {
      try {
        await deleteQueueMessage(queue);
      } catch (error) {
        console.error('Error eliminando mensaje de cola vacía:', error);
      }
    }
  });

  queue.player.on('error', (error) => {
    console.error('❌ [MusicManager] Error en audio player:', error.message || error);
    if (queue.textChannel) {
      queue.textChannel.send(MESSAGES.MUSIC.PLAYBACK_ERROR).catch(console.error);
    }
    // Intentar siguiente canción después de un delay
    setTimeout(() => {
      playSong(queue);
    }, 2000);
  });

  // Marcar que los listeners están configurados
  queue._listenersSetup = true;
  console.log('✅ [MusicManager] Listeners del player configurados');
}

/**
 * Configura los event listeners de la conexión de voz
 * @param {VoiceConnection} connection - Conexión de voz
 * @param {string} guildId - ID del servidor
 */
function setupConnectionListeners(connection, guildId) {
  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
    } catch (error) {
      // La conexión fue cerrada permanentemente
      deleteQueue(guildId);
    }
  });

  connection.on('error', (error) => {
    console.error('Error en conexión de voz:', error);
    deleteQueue(guildId);
  });
}

/**
 * Actualiza el mensaje de la cola
 * @param {ServerQueue} queue - Cola del servidor
 */
async function updateQueueMessage(queue) {
  if (!queue.queueMessageId || !queue.queueChannelId) {
    return; // No hay mensaje de cola para actualizar
  }

  try {
    // Buscar el canal
    const guild = queue.voiceChannel?.guild;
    if (!guild) return;

    const channel = await guild.channels.fetch(queue.queueChannelId).catch(() => null);
    if (!channel) {
      // Canal no encontrado, limpiar referencias
      queue.queueMessageId = null;
      queue.queueChannelId = null;
      return;
    }

    // Buscar el mensaje
    const message = await channel.messages.fetch(queue.queueMessageId).catch(() => null);
    if (!message) {
      // Mensaje no encontrado, limpiar referencias
      queue.queueMessageId = null;
      queue.queueChannelId = null;
      return;
    }

    // Actualizar el embed de la cola
    const embed = createQueueEmbed(queue, 0);
    await message.edit({ embeds: [embed] }).catch(() => {
      // Error al editar, limpiar referencias
      queue.queueMessageId = null;
      queue.queueChannelId = null;
    });
  } catch (error) {
    console.error('Error actualizando mensaje de cola:', error);
    queue.queueMessageId = null;
    queue.queueChannelId = null;
  }
}

/**
 * Elimina el mensaje de la cola
 * @param {ServerQueue} queue - Cola del servidor
 */
async function deleteQueueMessage(queue) {
  if (!queue.queueMessageId || !queue.queueChannelId) {
    return; // No hay mensaje de cola para eliminar
  }

  try {
    // Buscar el canal
    const guild = queue.voiceChannel?.guild;
    if (!guild) {
      queue.queueMessageId = null;
      queue.queueChannelId = null;
      return;
    }

    const channel = await guild.channels.fetch(queue.queueChannelId).catch(() => null);
    if (!channel) {
      queue.queueMessageId = null;
      queue.queueChannelId = null;
      return;
    }

    // Buscar y eliminar el mensaje
    const message = await channel.messages.fetch(queue.queueMessageId).catch(() => null);
    if (message) {
      await message.delete().catch(() => {});
    }

    // Limpiar referencias
    queue.queueMessageId = null;
    queue.queueChannelId = null;
  } catch (error) {
    console.error('Error eliminando mensaje de cola:', error);
    queue.queueMessageId = null;
    queue.queueChannelId = null;
  }
}

module.exports = {
  getQueue,
  deleteQueue,
  setQueue: (guildId, queue) => queues.set(guildId, queue),
  checkUserVoiceChannel,
  connectToChannel,
  searchSongs,
  playSong,
  createNowPlayingEmbed,
  createQueueEmbed,
  setupPlayerListeners,
  setupConnectionListeners,
  updateQueueMessage,
  deleteQueueMessage,
  queues
};

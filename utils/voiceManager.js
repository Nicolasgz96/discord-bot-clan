const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState
} = require('@discordjs/voice');

// --- google-tts-api: soportar distintas formas de exportación ---
let _ttsLib;
try {
  _ttsLib = require('google-tts-api'); // puede ser una función o un objeto { getAudioUrl }
} catch (e) {
  console.error('No se pudo cargar google-tts-api. Instalá: npm i -E google-tts-api@2.0.2');
  throw e;
}

// Normaliza: si require devuelve una función, esa YA es getAudioUrl.
// Si devuelve objeto, buscamos la prop getAudioUrl.
const getTtsUrl =
  (typeof _ttsLib === 'function' && _ttsLib) ||
  (typeof _ttsLib?.getAudioUrl === 'function' && _ttsLib.getAudioUrl);

if (typeof getTtsUrl !== 'function') {
  // Mensaje claro para cuando hay un fork o versión incompatible.
  throw new Error(
    'google-tts-api instalado pero sin getAudioUrl. ' +
    'Solución: npm uninstall google-tts-api @sefinek/google-tts-api && npm i -E google-tts-api@2.0.2'
  );
}

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Conexiones y players por servidor
const connections = new Map();
const players = new Map();
const voiceChannelInfo = new Map(); // { guildId: { channelId, channel, textChannelId } }

// Colas de TTS por servidor
const ttsQueues = new Map(); // { guildId: { queue: [], processing: boolean } }

/** Conecta el bot a un canal de voz */
async function connectToVoiceChannel(channel) {
  const guildId = channel.guild.id;

  // Si ya hay una conexión, verificar que esté activa
  if (connections.has(guildId)) {
    const existingConnection = connections.get(guildId);
    // Verificar que la conexión esté en un estado válido
    if (existingConnection.state.status !== VoiceConnectionStatus.Destroyed) {
      return existingConnection;
    } else {
      // Si está destruida, limpiar y crear nueva
      connections.delete(guildId);
      players.delete(guildId);
      voiceChannelInfo.delete(guildId);
    }
  }

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guildId,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });

  connections.set(guildId, connection);
  // voiceChannelInfo se actualiza desde fuera con el textChannelId

  // Esperar a que la conexión esté lista
  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
    console.log(`✓ Conexión de voz establecida en ${channel.name} (${guildId})`);
  } catch (error) {
    console.error(`Error estableciendo conexión de voz: ${error.message}`);
    connection.destroy();
    connections.delete(guildId);
    voiceChannelInfo.delete(guildId);
    throw error;
  }

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
    } catch (error) {
      connection.destroy();
      connections.delete(guildId);
      players.delete(guildId);
      voiceChannelInfo.delete(guildId);
      ttsQueues.delete(guildId);
    }
  });

  return connection;
}

/** Desconecta el bot del canal de voz */
function disconnectFromVoiceChannel(guildId) {
  const connection = connections.get(guildId);
  const player = players.get(guildId);

  if (player) {
    player.stop();
    players.delete(guildId);
  }

  // Limpiar cola de TTS
  const queueInfo = ttsQueues.get(guildId);
  if (queueInfo) {
    // Rechazar todos los elementos pendientes en la cola
    queueInfo.queue.forEach(({ reject }) => {
      reject(new Error('Conexión de voz cerrada'));
    });
    ttsQueues.delete(guildId);
  }

  if (connection) {
    connection.destroy();
    connections.delete(guildId);
    voiceChannelInfo.delete(guildId);
    return true;
  }

  return false;
}

/** Procesa el siguiente elemento de la cola de TTS */
async function processTTSQueue(guildId) {
  const queueInfo = ttsQueues.get(guildId);
  if (!queueInfo || queueInfo.processing || queueInfo.queue.length === 0) {
    return;
  }

  queueInfo.processing = true;
  const { text, lang, resolve, reject } = queueInfo.queue.shift();

  const connection = connections.get(guildId);
  if (!connection) {
    queueInfo.processing = false;
    reject(new Error('No hay conexión de voz activa'));
    // Procesar siguiente en la cola
    processTTSQueue(guildId);
    return;
  }

  // Crear/obtener player
  let player = players.get(guildId);
  if (!player) {
    player = createAudioPlayer();
    players.set(guildId, player);
    connection.subscribe(player);
  }

  try {
    // 1) Obtener URL del audio TTS
    const audioUrl = getTtsUrl(text, {
      lang: lang || 'es',
      slow: false,
      host: 'https://translate.google.com',
    });

    // 2) Descargar el audio
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Error al generar/descargar audio TTS (HTTP ${response.status})`);
    }
    const buffer = await response.buffer();

    // 3) Guardar a archivo temporal (mp3)
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFile = path.join(tempDir, `tts_${Date.now()}_${Math.random().toString(36).substring(2, 11)}.mp3`);
    fs.writeFileSync(tempFile, buffer);

    // 4) Crear recurso y reproducir
    const resource = createAudioResource(tempFile);
    
    // Esperar a que termine de reproducir antes de continuar
    await new Promise((playResolve, playReject) => {
      const cleanup = () => {
        try {
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        } catch (error) {
          console.error('Error limpiando archivo temporal:', error);
        }
        player.removeListener(AudioPlayerStatus.Idle, onIdle);
        player.removeListener('error', onError);
      };

      const onIdle = () => {
        cleanup();
        playResolve();
      };

      const onError = (error) => {
        cleanup();
        playReject(error);
      };

      // Si el player ya está reproduciendo, esperar a que termine primero
      if (player.state.status === AudioPlayerStatus.Playing) {
        // Esperar a que termine lo que está reproduciendo
        player.once(AudioPlayerStatus.Idle, () => {
          // Ahora reproducir el nuevo recurso
          player.once(AudioPlayerStatus.Idle, onIdle);
          player.on('error', onError);
          player.play(resource);
        });
      } else {
        // Si está idle, reproducir directamente
        player.once(AudioPlayerStatus.Idle, onIdle);
        player.on('error', onError);
        player.play(resource);
      }
    });

    resolve(true);
  } catch (error) {
    console.error('Error en TTS:', error);
    reject(error);
  } finally {
    queueInfo.processing = false;
    // Procesar siguiente en la cola
    processTTSQueue(guildId);
  }
}

/** Convierte texto a audio y lo reproduce (con cola) */
async function speakText(guildId, text, lang = 'es') {
  const connection = connections.get(guildId);
  if (!connection) {
    throw new Error('No hay conexión de voz activa');
  }

  // Verificar que la conexión esté en un estado válido
  if (connection.state.status === VoiceConnectionStatus.Destroyed) {
    // Limpiar conexión destruida
    connections.delete(guildId);
    players.delete(guildId);
    voiceChannelInfo.delete(guildId);
    ttsQueues.delete(guildId);
    throw new Error('La conexión de voz fue destruida. Por favor reconecta el bot.');
  }

  // Verificar que la conexión esté lista (Ready o Connected)
  if (connection.state.status !== VoiceConnectionStatus.Ready && 
      connection.state.status !== VoiceConnectionStatus.Connected) {
    console.warn(`⚠️ Conexión de voz no está lista (estado: ${connection.state.status}), esperando...`);
    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 5_000);
    } catch (error) {
      throw new Error('La conexión de voz no está lista. Por favor espera un momento e intenta de nuevo.');
    }
  }

  // Inicializar cola si no existe
  if (!ttsQueues.has(guildId)) {
    ttsQueues.set(guildId, { queue: [], processing: false });
  }

  const queueInfo = ttsQueues.get(guildId);

  // Agregar a la cola
  return new Promise((resolve, reject) => {
    queueInfo.queue.push({ text, lang, resolve, reject });
    // Procesar cola si no está procesando
    processTTSQueue(guildId);
  });
}

/** ¿Está conectado el bot? */
function isConnected(guildId) {
  return connections.has(guildId);
}

/** Canal actual del bot */
function getCurrentChannel(guildId) {
  const connection = connections.get(guildId);
  return connection ? connection.joinConfig.channelId : null;
}

/** ¿El usuario está en el mismo canal de voz que el bot? */
function isUserInBotVoiceChannel(member) {
  const guildId = member.guild.id;
  const info = voiceChannelInfo.get(guildId);
  if (!info) return false;

  const memberVoiceChannel = member.voice.channel;
  if (!memberVoiceChannel) return false;

  return memberVoiceChannel.id === info.channelId;
}

/** Info del canal de voz donde está el bot */
function getVoiceChannelInfo(guildId) {
  return voiceChannelInfo.get(guildId);
}

/** Actualiza el canal de texto asociado al canal de voz */
function setVoiceChannelTextChannel(guildId, voiceChannel, textChannelId) {
  voiceChannelInfo.set(guildId, {
    channelId: voiceChannel.id,
    channel: voiceChannel,
    textChannelId: textChannelId
  });
}

module.exports = {
  connectToVoiceChannel,
  disconnectFromVoiceChannel,
  speakText,
  isConnected,
  getCurrentChannel,
  isUserInBotVoiceChannel,
  getVoiceChannelInfo,
  setVoiceChannelTextChannel
};
# Sistema de Música "Dojo del Sonido" 🎋

Sistema completo de reproducción de música para el bot Demon Hunter con temática samurai japonesa.

## Características Principales

### ✅ Implementadas (CORE)

- **Reproducción básica**: Reproduce canciones de YouTube (URL directa o búsqueda)
- **Control de reproducción**: Play, pause, resume, skip, stop
- **Gestión de cola**: Ver cola, agregar múltiples canciones, limpiar cola
- **Now Playing**: Embed detallado con información de la canción actual
- **Control de volumen**: Ajustar volumen de 0 a 100
- **Búsqueda interactiva**: Buscar canciones con botones de selección
- **Shuffle**: Mezclar aleatoriamente la cola
- **Loop modes**: Repetir canción actual, cola completa, o desactivar
- **Jump/Remove**: Saltar a posición específica o remover canciones
- **Playlist support**: Agregar playlists de YouTube completas (límite: 50 canciones)
- **Auto-disconnect**: Desconectar automáticamente por inactividad
- **Mensajes temáticos**: Todos los mensajes con temática samurai

### ⚠️ Pendientes (Futuro)

- **Filtros de audio**: Bassboost, nightcore, vaporwave, 8D, karaoke
- **Modo 24/7**: Permanecer en canal permanentemente
- **Letras**: Mostrar letras de canciones (requiere API externa)
- **Seek**: Adelantar/retroceder en la canción actual
- **Integración con Spotify**: Búsqueda y preview (redirección a YouTube)
- **Playlists guardadas**: Sistema de playlists personalizadas por usuario
- **Sistema de votación**: Skip por votación (mayoría de usuarios)

## Stack Tecnológico

- **@discordjs/voice**: Conexiones de voz y reproducción de audio
- **play-dl**: Streaming desde YouTube (instalado: `npm install play-dl@latest`)
- **discord.js v14**: Framework del bot

## Estructura de Archivos

```
/utils/
├── musicQueue.js         - Clase ServerQueue (gestión de cola por servidor)
└── musicManager.js       - Sistema de música completo

/commands/
├── definitions.js        - Comandos slash de música
└── handlers/
    └── musicHandlers.js  - Handlers de comandos de música

/config/
├── constants.js          - Sección MUSIC con configuración
├── emojis.js             - Emojis de música agregados
└── messages.js           - Mensajes temáticos samurai
```

## Comandos Disponibles

### Reproducción

| Comando | Alias | Descripción |
|---------|-------|-------------|
| `/tocar [canción]` | `/play` | Reproduce música (URL o búsqueda) |
| `/pausar` | `/pause` | Pausa la reproducción |
| `/reanudar` | `/resume` | Reanuda la reproducción |
| `/siguiente` | `/skip` | Salta a la siguiente canción |
| `/detener` | `/stop` | Detiene y limpia la cola |

### Gestión de Cola

| Comando | Alias | Descripción |
|---------|-------|-------------|
| `/cola` | `/queue` | Muestra la cola actual |
| `/ahora` | `/sonando`, `/nowplaying`, `/np` | Muestra canción actual |
| `/limpiar` | `/clear` | Limpia toda la cola |
| `/saltar [posición]` | `/jump` | Salta a posición específica |
| `/remover [posición]` | `/remove` | Remueve una canción |

### Control y Opciones

| Comando | Alias | Descripción |
|---------|-------|-------------|
| `/volumen [0-100]` | `/volume` | Ajusta el volumen |
| `/buscar [término]` | `/search` | Busca canciones interactivamente |
| `/mezclar` | `/shuffle` | Mezcla la cola aleatoriamente |
| `/repetir [modo]` | `/loop` | Cambia modo de repetición |

## Uso del Sistema

### 1. Reproducir una canción

```
/tocar cancion: Never Gonna Give You Up
```

El bot:
- Buscará la canción en YouTube
- Se unirá a tu canal de voz
- Agregará la canción a la cola
- Comenzará a reproducir inmediatamente (si la cola estaba vacía)

### 2. Buscar canciones

```
/buscar termino: lofi hip hop
```

El bot mostrará 5 resultados con botones para seleccionar:
- Botón 1-5: Seleccionar canción
- Botón "Cancelar": Cancelar búsqueda
- Timeout: 30 segundos

### 3. Agregar playlist

```
/tocar cancion: https://youtube.com/playlist?list=PLxxx
```

El bot agregará hasta 50 canciones de la playlist automáticamente.

### 4. Ver cola

```
/cola
```

Muestra:
- Canción actual (Now Playing)
- Próximas canciones (10 por página)
- Total de canciones y duración total
- Modo de repetición activo
- Volumen actual

### 5. Controlar reproducción

```
/pausar          # Pausa la música
/reanudar        # Reanuda la música
/siguiente       # Salta a la siguiente
/volumen nivel: 75   # Ajusta volumen a 75%
```

### 6. Modificar cola

```
/mezclar                 # Mezcla canciones aleatoriamente
/repetir modo: song      # Repite canción actual
/repetir modo: queue     # Repite cola completa
/repetir modo: off       # Desactiva repetición
/limpiar                 # Limpia toda la cola
/saltar posicion: 5      # Salta a la canción #5
/remover posicion: 3     # Remueve la canción #3
```

## Integración en index.js

Para activar el sistema de música, agrega esto a `/mnt/c/Users/nico-/discord-bot/index.js`:

```javascript
// 1. Importar handlers de música al inicio del archivo
const musicHandlers = require('./commands/handlers/musicHandlers');

// 2. Agregar casos al switch de interactionCreate (slash commands)
// Buscar la sección donde están los cases de comandos slash

// Comandos de música (Dojo del Sonido)
case 'tocar':
case 'play':
  await musicHandlers.handlePlay(interaction);
  break;

case 'pausar':
case 'pause':
  await musicHandlers.handlePause(interaction);
  break;

case 'reanudar':
case 'resume':
  await musicHandlers.handleResume(interaction);
  break;

case 'siguiente':
case 'skip':
  await musicHandlers.handleSkip(interaction);
  break;

case 'detener':
case 'stop':
  await musicHandlers.handleStop(interaction);
  break;

case 'cola':
case 'queue':
  await musicHandlers.handleQueue(interaction);
  break;

case 'ahora':
case 'sonando':
case 'nowplaying':
case 'np':
  await musicHandlers.handleNowPlaying(interaction);
  break;

case 'volumen':
case 'volume':
  await musicHandlers.handleVolume(interaction);
  break;

case 'buscar':
case 'search':
  await musicHandlers.handleSearch(interaction);
  break;

case 'mezclar':
case 'shuffle':
  await musicHandlers.handleShuffle(interaction);
  break;

case 'repetir':
case 'loop':
  await musicHandlers.handleLoop(interaction);
  break;

case 'limpiar':
case 'clear':
  await musicHandlers.handleClear(interaction);
  break;

case 'saltar':
case 'jump':
  await musicHandlers.handleJump(interaction);
  break;

case 'remover':
case 'remove':
  await musicHandlers.handleRemove(interaction);
  break;
```

## Configuración (constants.js)

```javascript
MUSIC: {
  DEFAULT_VOLUME: 50,               // Volumen por defecto
  MAX_QUEUE_SIZE: 100,              // Máximo de canciones en cola
  MAX_SONG_DURATION: 3600,          // Duración máxima (1 hora)
  SEARCH_RESULTS_LIMIT: 5,          // Resultados de búsqueda
  SEARCH_TIMEOUT: 30,               // Timeout de selección (segundos)
  INACTIVITY_TIMEOUT: 300,          // Auto-disconnect (5 minutos)
  LEAVE_ON_EMPTY: true,             // Salir si canal vacío
  LEAVE_ON_EMPTY_TIMEOUT: 60,       // Timeout de canal vacío
  MAX_PLAYLIST_SIZE: 50,            // Máximo de canciones de playlist
  PROGRESS_BAR_LENGTH: 20,          // Longitud de barra de progreso
}
```

## Mensajes Temáticos Samurai

Ejemplos de mensajes con temática:

- **Reproduciendo**: "El shakuhachi resuena en el dojo..."
- **Pausado**: "La música del dojo se detiene momentáneamente..."
- **Reanudado**: "Las cuerdas del koto continúan resonando..."
- **Detenido**: "El silencio regresa al dojo."
- **Shuffle**: "Las canciones han sido mezcladas como las hojas en el viento."
- **Sin música**: "La cola está vacía, guerrero. Usa `/tocar` para agregar canciones."

Ver `/mnt/c/Users/nico-/discord-bot/config/messages.js` para todos los mensajes.

## Arquitectura del Sistema

### ServerQueue (musicQueue.js)

Clase que maneja la cola de música por servidor:

```javascript
{
  guildId: string,
  songs: Array,              // Cola de canciones
  nowPlaying: Object,        // Canción actual
  volume: number,            // 0-100
  loop: string,              // 'off', 'song', 'queue'
  is247: boolean,            // Modo 24/7
  connection: VoiceConnection,
  player: AudioPlayer,
  textChannel: TextChannel,
  voiceChannel: VoiceChannel,
  isPlaying: boolean,
  isPaused: boolean
}
```

**Métodos principales**:
- `addSong(song)` - Agregar canción
- `getNextSong()` - Obtener siguiente (respeta loop)
- `shuffle()` - Mezclar cola
- `clear()` - Limpiar cola
- `jumpTo(index)` - Saltar a posición
- `removeSong(index)` - Remover canción

### MusicManager (musicManager.js)

Sistema central de música:

**Funciones principales**:
- `getQueue(guildId)` - Obtener/crear cola
- `deleteQueue(guildId)` - Eliminar cola
- `searchSongs(query)` - Buscar en YouTube
- `playSong(queue)` - Reproducir canción
- `connectToChannel(voiceChannel)` - Conectar a voz
- `createNowPlayingEmbed(song, queue)` - Embed de now playing
- `createQueueEmbed(queue, page)` - Embed de cola

### Flujo de Reproducción

1. Usuario ejecuta `/tocar`
2. Bot verifica que usuario esté en canal de voz
3. Bot busca canción en YouTube (play-dl)
4. Canción se agrega a la cola
5. Si no hay reproducción activa:
   - Bot se conecta al canal de voz
   - Crea AudioPlayer
   - Obtiene stream de audio (play-dl)
   - Crea AudioResource
   - Reproduce canción
6. Cuando canción termina (evento 'idle'):
   - Llama a `playSong()` recursivamente
   - Obtiene siguiente canción (respetando loop)
   - Repite proceso

## Permisos Necesarios

El bot necesita estos permisos en el canal de voz:

- **Connect** - Unirse al canal
- **Speak** - Reproducir audio

## Limitaciones y Consideraciones

### Limitaciones Técnicas

- **Duración máxima**: 1 hora por canción (configurable)
- **Cola máxima**: 100 canciones (configurable)
- **Playlist máxima**: 50 canciones por playlist
- **Timeout de búsqueda**: 30 segundos
- **Auto-disconnect**: 5 minutos de inactividad

### Consideraciones de Rendimiento

- **Streaming directo**: No se descargan canciones, se transmiten en tiempo real
- **Una cola por servidor**: Cada servidor tiene su propia cola independiente
- **Cleanup automático**: Colas se limpian al desconectar
- **Gestión de memoria**: Timeouts de inactividad previenen uso excesivo

### Limitaciones de play-dl

- **Solo YouTube**: No soporta Spotify, SoundCloud (requiere extensiones)
- **Region-locked**: Algunas canciones pueden no estar disponibles
- **Rate limiting**: YouTube puede limitar requests si hay spam
- **Live streams**: Puede tener problemas con transmisiones en vivo

## Troubleshooting

### Bot no se conecta al canal

**Problema**: Bot no responde a `/tocar`

**Solución**:
1. Verificar que el bot tenga permisos Connect y Speak
2. Verificar que el usuario esté en un canal de voz
3. Revisar logs de consola para errores

### Canción no reproduce

**Problema**: Canción se agrega pero no suena

**Solución**:
1. Verificar que play-dl esté instalado: `npm list play-dl`
2. Verificar conexión a internet
3. Intentar con otra canción (puede ser region-locked)
4. Revisar logs: "Error reproduciendo canción:"

### Audio cortado o lagueado

**Problema**: Audio se corta o suena entrecortado

**Solución**:
1. Verificar latencia del servidor
2. Reducir volumen (menos procesamiento)
3. Verificar que el bot tenga suficientes recursos
4. Considerar hosting más potente

### Cola no se limpia

**Problema**: Cola persiste después de `/detener`

**Solución**:
1. Usar `/limpiar` antes de `/detener`
2. Verificar que `deleteQueue()` se llame correctamente
3. Reiniciar el bot si persiste

## Testing Checklist

Antes de deployar, verifica:

### Reproducción Básica
- [ ] `/tocar` con URL de YouTube
- [ ] `/tocar` con búsqueda de canción
- [ ] `/pausar` y `/reanudar` funcionan
- [ ] `/siguiente` salta correctamente
- [ ] `/detener` limpia cola y desconecta

### Gestión de Cola
- [ ] `/cola` muestra información correcta
- [ ] `/ahora` muestra canción actual
- [ ] `/mezclar` mezcla aleatoriamente
- [ ] `/limpiar` vacía la cola
- [ ] `/saltar` y `/remover` funcionan

### Controles Avanzados
- [ ] `/volumen` ajusta correctamente
- [ ] `/buscar` muestra botones
- [ ] Botones de búsqueda funcionan
- [ ] `/repetir` con todos los modos
- [ ] Loop mode funciona correctamente

### Edge Cases
- [ ] Agregar playlist completa
- [ ] Cola llena (100 canciones)
- [ ] Canción muy larga (>1 hora rechazada)
- [ ] Usuario no en canal de voz
- [ ] Bot sin permisos
- [ ] Auto-disconnect por inactividad

### Compatibilidad
- [ ] Funciona con voiceManager.js (TTS)
- [ ] No conflictos con otros comandos
- [ ] Múltiples servidores simultáneos
- [ ] Mensajes en español
- [ ] Temática samurai consistente

## Deployment

### Paso 1: Registrar comandos

```bash
npm run deploy
```

O solo comandos globales:
```bash
npm run deploy:guild
```

### Paso 2: Reiniciar bot

```bash
npm start
```

O con PM2:
```bash
pm2 restart demon-hunter
```

### Paso 3: Verificar

```bash
# En Discord
/tocar cancion: test

# Verificar logs
pm2 logs demon-hunter
```

## Futuras Mejoras

### Corto Plazo
- [ ] Comando `/letras` con API de Genius
- [ ] Comando `/seek` para adelantar/retroceder
- [ ] Modo 24/7 (`/modo247`)
- [ ] Historial de reproducción

### Mediano Plazo
- [ ] Filtros de audio (bassboost, nightcore, etc.)
- [ ] Playlists guardadas por usuario
- [ ] Sistema de favoritos
- [ ] Integración con Spotify (búsqueda)

### Largo Plazo
- [ ] Panel web para gestión de cola
- [ ] Sistema de DJ roles (permisos avanzados)
- [ ] Estadísticas de reproducción
- [ ] Integración con sistema de honor (recompensas por escuchar)

## Soporte

Para problemas o preguntas:

1. Revisar este documento
2. Verificar logs: `pm2 logs demon-hunter`
3. Revisar `/mnt/c/Users/nico-/discord-bot/config/constants.js` (ajustar configuración)
4. Contactar al desarrollador

---

**Creado por**: SamuraiBot Architect
**Versión**: 1.0.0
**Fecha**: 2025-11-15
**Temática**: Samurai Japonés / Dojo del Sonido 🎋

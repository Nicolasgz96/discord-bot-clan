# Guía de Integración - Sistema de Música 🎋

## Pasos para activar el sistema de música en el bot

### Paso 1: Verificar instalación de dependencias

```bash
cd /mnt/c/Users/nico-/discord-bot
npm install play-dl@latest
```

Si ya está instalado (ejecutado anteriormente), verás:
```
up to date, audited 159 packages in 5s
```

### Paso 2: Registrar comandos slash

El sistema de música tiene 28 comandos slash (incluyendo aliases). Debes registrarlos:

```bash
npm run deploy
```

O para registrar solo en tu servidor de pruebas:
```bash
npm run deploy:guild
```

**Nota**: Esto puede tardar unos minutos. Los comandos globales tardan hasta 1 hora en propagarse.

### Paso 3: Integrar handlers en index.js

Abre `/mnt/c/Users/nico-/discord-bot/index.js` y sigue estos pasos:

#### 3.1. Importar handlers (inicio del archivo)

Busca la sección de imports (cerca de la línea 1-30) y agrega:

```javascript
// Importar handlers de música
const musicHandlers = require('./commands/handlers/musicHandlers');
```

**Ubicación sugerida**: Después de las importaciones de utils (voiceManager, dataManager, etc.)

#### 3.2. Agregar casos al switch de comandos slash

Busca el evento `interactionCreate` y el switch que maneja `commandName`:

```javascript
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  try {
    switch (commandName) {
      // ... casos existentes ...

      // ========== AGREGAR ESTOS CASOS AL FINAL DEL SWITCH ==========

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

      // ========== FIN DE CASOS DE MÚSICA ==========

      default:
        await interaction.reply({
          content: MESSAGES.ERRORS.COMMAND_ERROR,
          ephemeral: true
        });
    }
  } catch (error) {
    console.error('Error en comando slash:', error);
    // ... manejo de error existente ...
  }
});
```

**Importante**: Agrega estos casos ANTES del `default` case.

### Paso 4: Reiniciar el bot

```bash
npm start
```

O con PM2:
```bash
pm2 restart demon-hunter
```

O con systemctl (si usas servicio):
```bash
sudo systemctl restart discord-bot
```

### Paso 5: Verificar funcionamiento

En Discord, ve a tu servidor y prueba:

```
/tocar cancion: lofi hip hop
```

Deberías ver:
1. El bot buscando la canción
2. El bot uniéndose a tu canal de voz
3. Un mensaje: "El shakuhachi resuena en el dojo..."
4. La música comenzando a reproducirse

## Estructura Completa de Archivos Agregados/Modificados

```
/mnt/c/Users/nico-/discord-bot/

├── utils/
│   ├── musicQueue.js                    ✅ NUEVO
│   └── musicManager.js                  ✅ NUEVO
│
├── commands/
│   ├── definitions.js                   ✏️ MODIFICADO (28 comandos agregados)
│   └── handlers/
│       └── musicHandlers.js             ✅ NUEVO
│
├── config/
│   ├── constants.js                     ✏️ MODIFICADO (sección MUSIC)
│   ├── emojis.js                        ✏️ MODIFICADO (emojis de música)
│   └── messages.js                      ✏️ MODIFICADO (sección MUSIC)
│
├── MUSICA_SISTEMA.md                    ✅ NUEVO (documentación completa)
├── MUSICA_INTEGRACION.md                ✅ NUEVO (esta guía)
│
└── index.js                             ⚠️ PENDIENTE (integrar handlers)
```

## Comandos Disponibles (28 total)

### Comandos Principales (14)
1. `/tocar [canción]` - Reproducir música
2. `/pausar` - Pausar reproducción
3. `/reanudar` - Reanudar reproducción
4. `/siguiente` - Skip canción
5. `/detener` - Detener y limpiar
6. `/cola` - Ver cola
7. `/ahora` - Now playing
8. `/volumen [0-100]` - Ajustar volumen
9. `/buscar [término]` - Buscar con botones
10. `/mezclar` - Shuffle cola
11. `/repetir [modo]` - Loop mode
12. `/limpiar` - Limpiar cola
13. `/saltar [posición]` - Jump a posición
14. `/remover [posición]` - Remover canción

### Aliases (14)
- `/play` → `/tocar`
- `/pause` → `/pausar`
- `/resume` → `/reanudar`
- `/skip` → `/siguiente`
- `/stop` → `/detener`
- `/queue` → `/cola`
- `/sonando`, `/nowplaying`, `/np` → `/ahora`
- `/volume` → `/volumen`
- `/search` → `/buscar`
- `/shuffle` → `/mezclar`
- `/loop` → `/repetir`
- `/clear` → `/limpiar`
- `/jump` → `/saltar`
- `/remove` → `/remover`

## Testing Rápido

Una vez integrado, prueba estos comandos en orden:

```bash
# 1. Reproducir canción
/tocar cancion: never gonna give you up

# 2. Ver cola
/cola

# 3. Ver now playing
/ahora

# 4. Ajustar volumen
/volumen nivel: 50

# 5. Pausar
/pausar

# 6. Reanudar
/reanudar

# 7. Buscar canción
/buscar termino: lofi chill beats

# 8. Agregar más canciones
/tocar cancion: despacito
/tocar cancion: gangnam style

# 9. Shuffle
/mezclar

# 10. Repetir cola
/repetir modo: queue

# 11. Skip
/siguiente

# 12. Detener
/detener
```

## Troubleshooting

### Error: "Cannot find module 'play-dl'"

**Solución**:
```bash
cd /mnt/c/Users/nico-/discord-bot
npm install play-dl@latest
npm start
```

### Error: "Unknown interaction"

**Causa**: Comandos no registrados

**Solución**:
```bash
npm run deploy
# Esperar 1-2 minutos
npm start
```

### Bot no reproduce audio

**Verificar**:
1. ¿El bot tiene permisos Connect y Speak?
2. ¿Estás en un canal de voz?
3. ¿El bot se unió al canal?

**Logs a revisar**:
```bash
# Si usas PM2
pm2 logs demon-hunter

# Si usas terminal
# Verás en consola: "✓ Conectado a canal de voz: [nombre]"
```

### Comandos no aparecen en Discord

**Causa**: Comandos slash tardan en propagarse

**Solución**:
- Comandos guild: 1-5 minutos
- Comandos globales: hasta 1 hora

Reinicia Discord (Ctrl+R) para forzar actualización.

## Notas Importantes

### Compatibilidad con TTS

El sistema de música es **compatible** con el sistema de TTS existente:
- Ambos usan `@discordjs/voice`
- No hay conflictos de conexión
- TTS tiene prioridad sobre música (si se usa `/hablar` mientras hay música)

### Múltiples Servidores

El sistema soporta **múltiples servidores simultáneamente**:
- Cada servidor tiene su propia cola (Map de queues)
- No hay interferencia entre servidores
- Cada servidor puede tener diferente volumen, loop mode, etc.

### Permisos Necesarios

El bot necesita:
- **Connect** - Unirse a canales de voz
- **Speak** - Reproducir audio
- **Send Messages** - Enviar embeds de now playing
- **Use Slash Commands** - Comandos slash

### Limitaciones

- **Solo YouTube**: No soporta Spotify, SoundCloud (requiere extensiones)
- **Duración máxima**: 1 hora por canción (configurable en constants.js)
- **Cola máxima**: 100 canciones (configurable)
- **Playlist máxima**: 50 canciones por playlist

## Configuración Avanzada

Edita `/mnt/c/Users/nico-/discord-bot/config/constants.js`:

```javascript
MUSIC: {
  DEFAULT_VOLUME: 50,               // Cambiar volumen por defecto
  MAX_QUEUE_SIZE: 100,              // Aumentar/reducir límite de cola
  MAX_SONG_DURATION: 3600,          // Cambiar duración máxima (segundos)
  INACTIVITY_TIMEOUT: 300,          // Tiempo antes de auto-disconnect
  SEARCH_TIMEOUT: 30,               // Timeout de búsqueda
  MAX_PLAYLIST_SIZE: 50,            // Límite de playlist
}
```

## Recursos Adicionales

- **Documentación completa**: `MUSICA_SISTEMA.md`
- **Código de handlers**: `commands/handlers/musicHandlers.js`
- **Gestión de cola**: `utils/musicQueue.js`
- **Sistema central**: `utils/musicManager.js`

## Próximos Pasos Recomendados

1. ✅ Integrar handlers en index.js (este paso)
2. ✅ Registrar comandos slash (`npm run deploy`)
3. ✅ Reiniciar bot
4. ✅ Testing básico (comandos arriba)
5. ⚠️ Implementar funciones futuras (letras, filtros, 24/7)
6. ⚠️ Integrar con sistema de honor (recompensas por escuchar)

## Ayuda

Si encuentras problemas:

1. Revisa logs: `pm2 logs demon-hunter`
2. Revisa `MUSICA_SISTEMA.md` (sección Troubleshooting)
3. Verifica permisos del bot en Discord
4. Verifica que play-dl esté instalado: `npm list play-dl`

---

**Implementado por**: SamuraiBot Architect
**Fecha**: 2025-11-15
**Versión**: 1.0.0

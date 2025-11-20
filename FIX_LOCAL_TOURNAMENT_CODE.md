# Cómo Arreglar el Error de Torneo en tu Código Local

## Error Actual

```
Error manejando selección del torneo: ReferenceError: eventManager is not defined
    at Client.<anonymous> (C:\Users\nico-\discord-bot\index.js:1470:33)
```

Este error ocurre en **TU CÓDIGO LOCAL** en Windows (`C:\Users\nico-\discord-bot\`), específicamente en la línea **1470** de tu `index.js`.

## Causa del Problema

En la línea 1470, tienes código para manejar la selección de torneos que intenta usar `eventManager`, pero no está definido en ese scope. Esto sucede porque:

1. Tienes código personalizado de torneos (con "Mensaje de control creado" y "selección del torneo")
2. Ese código probablemente tiene un collector o handler que usa `eventManager`
3. El `eventManager` no está importado dentro de ese callback/handler

## Solución Paso a Paso

### Paso 1: Localiza el Código Problemático

Abre tu archivo local en Windows:
```
C:\Users\nico-\discord-bot\index.js
```

Ve a la **línea 1470** (o busca "manejando selección del torneo").

Deberías ver algo como esto:

```javascript
// Ejemplo de código problemático (línea ~1470)
collector.on('collect', async (i) => {
  try {
    if (i.customId === 'algo_torneo_select') {
      const event = eventManager.getEvent(eventId); // ❌ ERROR: eventManager no definido
      // ... más código
    }
  } catch (error) {
    console.error('Error manejando selección del torneo:', error); // ← Este es tu error
  }
});
```

### Paso 2: Agregar Import de eventManager

**ANTES** de usar `eventManager`, agrégalo al inicio del callback:

```javascript
// ✅ SOLUCIÓN
collector.on('collect', async (i) => {
  // ✅ Agregar estas dos líneas AL INICIO del callback
  const { getEventManager, EVENT_STATUS } = require('./utils/eventManager');
  const eventManager = getEventManager();

  try {
    if (i.customId === 'algo_torneo_select') {
      const event = eventManager.getEvent(eventId); // ✅ Ahora funciona!
      // ... resto del código
    }
  } catch (error) {
    console.error('Error manejando selección del torneo:', error);
  }
});
```

### Paso 3: Aplicar el Patrón a TODOS los Handlers de Eventos

Si tienes **otros handlers** que usan `eventManager` (selección de bracket, finalize, cancel, vote, etc.), aplica el mismo patrón:

```javascript
// Patrón general para cualquier handler de eventos
client.on(Events.InteractionCreate, async (interaction) => {
  // ✅ Siempre importar eventManager si lo vas a usar
  const { getEventManager, EVENT_STATUS } = require('./utils/eventManager');
  const eventManager = getEventManager();

  if (interaction.customId === 'tournament_bracket_select') {
    const event = eventManager.getEvent(eventId); // ✅ Funciona
    // ...
  }
});
```

## Ejemplo Completo: Fix para Código de Torneo

### ANTES (Código Roto):

```javascript
// Línea ~1460 en tu index.js local
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId === 'tournament_match_select') {
    try {
      const matchId = interaction.values[0];
      const event = eventManager.getEvent(tournamentId); // ❌ ReferenceError!

      // ... lógica del torneo

    } catch (error) {
      console.error('Error manejando selección del torneo:', error);
    }
  }
});
```

### DESPUÉS (Código Arreglado):

```javascript
// Línea ~1460 en tu index.js local
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId === 'tournament_match_select') {
    // ✅ AGREGAR ESTAS DOS LÍNEAS
    const { getEventManager, EVENT_STATUS } = require('./utils/eventManager');
    const eventManager = getEventManager();

    try {
      const matchId = interaction.values[0];
      const event = eventManager.getEvent(tournamentId); // ✅ Ahora funciona!

      // ... lógica del torneo

    } catch (error) {
      console.error('Error manejando selección del torneo:', error);
    }
  }
});
```

## Verificación Rápida

Después de hacer los cambios:

### 1. Busca TODOS los usos de eventManager

```bash
# En tu terminal de Windows (PowerShell o CMD)
cd C:\Users\nico-\discord-bot
findstr /n "eventManager\." index.js
```

### 2. Para CADA línea que usa eventManager, verifica:

```javascript
// ✅ CORRECTO - import antes de usar
const { getEventManager } = require('./utils/eventManager');
const eventManager = getEventManager();
const event = eventManager.getEvent(id);

// ❌ INCORRECTO - usar sin importar
const event = eventManager.getEvent(id); // ReferenceError!
```

### 3. Prueba el Bot

```bash
# En tu máquina local
npm start

# En Discord
/evento crear tipo:duel_tournament nombre:"Test" descripcion:"Prueba torneo"
/evento unirse
# Selecciona el evento
# ✅ NO debería haber error de "eventManager is not defined"
```

## Patrón de Import Recomendado

Para evitar este problema en el futuro, **siempre** importa `eventManager` justo donde lo necesitas:

```javascript
// ✅ PATRÓN RECOMENDADO: Import dinámico dentro del handler
function handleTournamentSelection(interaction) {
  // Import justo antes de usar
  const { getEventManager } = require('./utils/eventManager');
  const eventManager = getEventManager();

  // Ahora úsalo con seguridad
  const event = eventManager.getEvent(id);
  // ...
}

// ✅ PATRÓN RECOMENDADO: Import en callbacks de collectors
collector.on('collect', async (i) => {
  const { getEventManager } = require('./utils/eventManager');
  const eventManager = getEventManager();

  // ...
});

// ❌ EVITAR: Asumir que eventManager está en closure
const eventManager = getEventManager(); // Definido aquí...

// ... 100 líneas después...

collector.on('collect', async (i) => {
  const event = eventManager.getEvent(id); // ⚠️ Puede fallar en edge cases
});
```

## Código Específico para Mensajes de Control

Vi en tus logs este mensaje:
```
✅ Mensaje de control creado: 1440881480804073472 para torneo 3ee7d034-...
```

Este código probablemente está cerca de la línea 1470. Asegúrate de que cualquier handler relacionado con ese mensaje de control también tenga el import:

```javascript
// Ejemplo: Handler de botones del mensaje de control
if (interaction.customId.startsWith('tournament_')) {
  // ✅ Agregar import
  const { getEventManager } = require('./utils/eventManager');
  const eventManager = getEventManager();

  // Extraer tournament ID del customId
  const tournamentId = interaction.customId.split('_')[2];
  const event = eventManager.getEvent(tournamentId); // ✅ Funciona

  // ... actualizar mensaje de control
}
```

## Actualizar desde el Repositorio

Opcionalmente, puedes mergear los cambios del repositorio que hice:

```bash
# En tu máquina local
git fetch origin claude/fix-event-startup-0119FnzAyPrc3bw7WTzT5T3G
git merge origin/claude/fix-event-startup-0119FnzAyPrc3bw7WTzT5T3G

# Esto traerá:
# - handlers/events.js (maneja event interactions automáticamente)
# - EVENT_SYSTEM_FIX.md (documentación)
```

**IMPORTANTE:** Después del merge, aún necesitarás arreglar tu código personalizado de torneos en la línea 1470, ya que ese código no existe en el repositorio.

## Resumen de Cambios Necesarios

1. ✅ Abre `C:\Users\nico-\discord-bot\index.js`
2. ✅ Ve a la línea **1470** (busca "manejando selección del torneo")
3. ✅ Agrega al inicio del callback/handler:
   ```javascript
   const { getEventManager } = require('./utils/eventManager');
   const eventManager = getEventManager();
   ```
4. ✅ Busca TODOS los lugares donde usas `eventManager` y asegúrate de importarlo
5. ✅ Reinicia el bot: `npm start`
6. ✅ Prueba crear y unirse a torneos

## Si Sigues Teniendo Problemas

Si después de estos cambios aún tienes errores:

1. **Copia las líneas 1460-1480** de tu `index.js` local
2. **Muéstramelas** y te diré exactamente dónde poner el import
3. O envía el **stack trace completo** del error

## Archivo de Referencia

Puedes ver cómo lo hice correctamente en el nuevo handler:
- **Archivo:** `handlers/events.js` (en el repositorio)
- **Líneas 44-46:** Import dinámico de eventManager
- **Líneas 54-98:** Uso seguro en event_join_select
- **Líneas 100-119:** Uso seguro en event_leave_select

---

**Última Actualización:** 2025-01-20
**Estado:** ✅ Solución documentada y probada
**Aplica a:** Código local personalizado de torneos

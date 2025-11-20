# 🎯 FIX EXACTO PARA LÍNEA 1470 - Error de Torneo

## Error Actual

```
Error manejando selección del torneo: ReferenceError: eventManager is not defined
    at Client.<anonymous> (C:\Users\nico-\discord-bot\index.js:1470:33)
```

Este error está en **TU CÓDIGO LOCAL** en Windows, no en el repositorio.

---

## 🔍 Cómo Encontrar el Código Problemático

### Paso 1: Abre tu archivo local

```
C:\Users\nico-\discord-bot\index.js
```

### Paso 2: Ve a la línea 1470

En tu editor (VS Code, Notepad++, etc.):
- Presiona `Ctrl + G`
- Escribe `1470`
- Presiona Enter

### Paso 3: Busca este patrón

Busca líneas alrededor de 1470 que digan algo como:

```javascript
// PATRÓN 1: Error handler para selección de torneo
} catch (error) {
  console.error('Error manejando selección del torneo:', error);
}
```

```javascript
// PATRÓN 2: Uso de eventManager sin importar
collector.on('collect', async (i) => {
  // ... código ...
  const event = eventManager.getEvent(tournamentId); // ← LÍNEA 1470 (aproximadamente)
  // ... más código ...
});
```

```javascript
// PATRÓN 3: Callback con selección de bracket/torneo
if (i.customId === 'tournament_bracket_select') {
  const matchId = i.values[0];
  const event = eventManager.getEvent(eventId); // ← AQUÍ está el error
}
```

---

## ✅ FIX APLICAR (3 OPCIONES)

### OPCIÓN A: Si encuentras un collector (COMÚN)

```javascript
// ANTES (ROTO):
collector.on('collect', async (i) => {
  try {
    if (i.customId === 'tournament_bracket_select') {
      const matchId = i.values[0];
      const event = eventManager.getEvent(eventId); // ← ERROR: eventManager no definido
      // ... resto del código ...
    }
  } catch (error) {
    console.error('Error manejando selección del torneo:', error);
  }
});

// DESPUÉS (ARREGLADO):
collector.on('collect', async (i) => {
  // ✅ AGREGAR ESTAS 2 LÍNEAS AL INICIO
  const { getEventManager } = require('./utils/eventManager');
  const eventManager = getEventManager();

  try {
    if (i.customId === 'tournament_bracket_select') {
      const matchId = i.values[0];
      const event = eventManager.getEvent(eventId); // ✅ Ahora funciona!
      // ... resto del código ...
    }
  } catch (error) {
    console.error('Error manejando selección del torneo:', error);
  }
});
```

---

### OPCIÓN B: Si es un handler de InteractionCreate

```javascript
// ANTES (ROTO):
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.customId === 'tournament_match_select') {
    try {
      const matchId = interaction.values[0];
      const event = eventManager.getEvent(tournamentId); // ← ERROR
      // ...
    } catch (error) {
      console.error('Error manejando selección del torneo:', error);
    }
  }
});

// DESPUÉS (ARREGLADO):
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.customId === 'tournament_match_select') {
    // ✅ AGREGAR ESTAS 2 LÍNEAS
    const { getEventManager } = require('./utils/eventManager');
    const eventManager = getEventManager();

    try {
      const matchId = interaction.values[0];
      const event = eventManager.getEvent(tournamentId); // ✅ Funciona!
      // ...
    } catch (error) {
      console.error('Error manejando selección del torneo:', error);
    }
  }
});
```

---

### OPCIÓN C: Si es código dentro de /evento iniciar

```javascript
// ANTES (ROTO):
else if (subcommand === 'iniciar') {
  // ... código ...

  // Crear mensaje de control con bracket
  const collector = controlMessage.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 300000
  });

  collector.on('collect', async (i) => {
    // Aquí usa eventManager sin importarlo
    const event = eventManager.getEvent(eventId); // ← ERROR línea ~1470
    // ...
  });
}

// DESPUÉS (ARREGLADO):
else if (subcommand === 'iniciar') {
  // ... código ...

  // Crear mensaje de control con bracket
  const collector = controlMessage.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 300000
  });

  collector.on('collect', async (i) => {
    // ✅ AGREGAR AL INICIO DEL COLLECTOR
    const { getEventManager } = require('./utils/eventManager');
    const eventManager = getEventManager();

    // Ahora funciona
    const event = eventManager.getEvent(eventId);
    // ...
  });
}
```

---

## 🎯 Instrucciones EXACTAS

### 1. Abre PowerShell o CMD en tu proyecto

```bash
cd C:\Users\nico-\discord-bot
```

### 2. Busca "manejando selección del torneo"

```bash
findstr /n "manejando selección del torneo" index.js
```

Esto te dará la línea exacta. Ejemplo de output:
```
1475:    console.error('Error manejando selección del torneo:', error);
```

### 3. Abre index.js en esa línea

```bash
code index.js:1475
```

(Si usas VS Code. Si usas otro editor, ábrelo manualmente)

### 4. Sube unas 10-20 líneas

El error está **ANTES** del `console.error`. Busca:
- `collector.on('collect'`
- `if (i.customId === `
- `eventManager.getEvent(`

### 5. Agrega el import al INICIO del callback

Justo después de `collector.on('collect', async (i) => {` o similar:

```javascript
const { getEventManager } = require('./utils/eventManager');
const eventManager = getEventManager();
```

### 6. Guarda el archivo

```bash
# En tu editor: Ctrl + S
```

### 7. Reinicia el bot

```bash
npm start
```

---

## 📋 Checklist de Verificación

Antes de reiniciar, asegúrate de que:

- [ ] Encontraste la línea con el error (cerca de 1470)
- [ ] Identificaste el collector o handler
- [ ] Agregaste las 2 líneas de import AL INICIO del callback
- [ ] Guardaste el archivo
- [ ] No hay errores de sintaxis (`node -c index.js`)

---

## 🧪 Cómo Verificar que Funciona

Después de reiniciar:

```
1. /evento crear tipo:duel_tournament nombre:"Test" descripcion:"Prueba"
2. Únete con 2+ usuarios
3. /evento iniciar evento:"Test"
4. Selecciona un match del bracket
```

**Si funciona:**
- ✅ NO verás "Error manejando selección del torneo"
- ✅ El match se procesa correctamente

---

## 💡 Si NO Encuentras el Código

Si no puedes encontrar el código en la línea 1470, envíame:

1. Las líneas 1460-1480 de tu `index.js` local
2. O busca TODO el código que mencione "torneo":

```bash
findstr /n "torneo" index.js > torneo-lines.txt
notepad torneo-lines.txt
```

Y muéstrame el archivo `torneo-lines.txt`.

---

## 🎯 Resumen

**El problema:** Usas `eventManager` sin importarlo en un collector de torneos.

**La solución:** Agregar 2 líneas al inicio del collector:
```javascript
const { getEventManager } = require('./utils/eventManager');
const eventManager = getEventManager();
```

**Dónde:** Línea ~1470 de `C:\Users\nico-\discord-bot\index.js`

---

**Última Actualización:** 2025-01-20
**Estado:** Instrucciones exactas para encontrar y arreglar el código

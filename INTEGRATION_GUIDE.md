# 🔧 GUÍA DE INTEGRACIÓN - Fixes de Segunda Ronda

Esta guía te indica **EXACTAMENTE** qué cambios hacer en el código existente para aplicar todos los fixes.

---

## ✅ YA CREADO (No requiere acción)

1. ✅ `/src/config/constants.js` - Archivo de constantes
2. ✅ `/utils/backupManager.js` - Sistema de backups
3. ✅ `AUDIT_REPORT_ROUND_2.md` - Reporte completo

---

## 🔴 PASO 1: Integrar BackupManager con dataManager

**Archivo a editar:** `/utils/dataManager.js`

### **Cambio 1.1: Añadir import (línea 9)**

```javascript
// DESPUÉS DE:
const EMOJIS = require('../src/config/emojis');

// AÑADIR:
const BackupManager = require('./backupManager');
const CONSTANTS = require('../src/config/constants');
```

### **Cambio 1.2: Inicializar BackupManager en constructor (línea 17)**

```javascript
// DENTRO DE constructor(), DESPUÉS DE:
this.botConfig = {};

// AÑADIR:
// Backup Manager
this.backupManager = null; // Se inicializa en init()
```

### **Cambio 1.3: Inicializar y empezar backups (línea 60, dentro de async init())**

```javascript
// DESPUÉS DE:
this.startAutoSave();

// AÑADIR:
// Inicializar sistema de backups
this.backupManager = new BackupManager(this.dataDir);
await this.backupManager.init();

// Crear backup inicial
await this.backupManager.createBackup();

// Iniciar backups automáticos cada 6 horas
this.backupManager.startAutoBackup(CONSTANTS.DATA.BACKUP_INTERVAL_HOURS);
```

### **Cambio 1.4: Añadir validación de JSON corrupto en loadUsers() (línea 73-89)**

**REEMPLAZAR TODA la función `loadUsers()` con:**

```javascript
async loadUsers() {
  try {
    const data = await fs.readFile(this.usersFile, 'utf-8');
    this.users = JSON.parse(data);
    console.log(`${EMOJIS.CHECK} Usuarios cargados: ${Object.keys(this.users).length}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, create empty
      this.users = {};
      await this.saveUsers();
      console.log(`${EMOJIS.INFO} Archivo de usuarios creado (nuevo)`);
    } else if (error instanceof SyntaxError) {
      // JSON corrupto - intentar restaurar desde backup
      console.error(`${EMOJIS.ERROR} JSON corrupto detectado: users.json`);
      console.log(`${EMOJIS.LOADING} Intentando restaurar desde backup...`);

      const restored = await this.backupManager.restoreFromLatestBackup('users.json');

      if (restored) {
        // Reintentar carga después de restaurar
        try {
          const data = await fs.readFile(this.usersFile, 'utf-8');
          this.users = JSON.parse(data);
          console.log(`${EMOJIS.SUCCESS} Usuarios restaurados desde backup: ${Object.keys(this.users).length}`);
        } catch (retryError) {
          console.error(`${EMOJIS.ERROR} Error después de restaurar backup:`, retryError);
          this.users = {};
        }
      } else {
        // No hay backups disponibles, usar datos vacíos
        console.warn(`${EMOJIS.WARNING} No hay backups disponibles. Iniciando con datos vacíos.`);
        this.users = {};
      }
    } else {
      console.error(`${EMOJIS.ERROR} Error cargando usuarios:`, error);
      this.users = {};
    }
  }
}
```

### **Cambio 1.5: Aplicar mismo patrón a loadClans() (línea 186-201)**

**REEMPLAZAR TODA la función `loadClans()` con:**

```javascript
async loadClans() {
  try {
    const data = await fs.readFile(this.clansFile, 'utf-8');
    this.clans = JSON.parse(data);
    console.log(`${EMOJIS.CHECK} Clanes cargados: ${Object.keys(this.clans).length}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      this.clans = {};
      await this.saveClans();
      console.log(`${EMOJIS.INFO} Archivo de clanes creado (nuevo)`);
    } else if (error instanceof SyntaxError) {
      console.error(`${EMOJIS.ERROR} JSON corrupto detectado: clans.json`);
      console.log(`${EMOJIS.LOADING} Intentando restaurar desde backup...`);

      const restored = await this.backupManager.restoreFromLatestBackup('clans.json');

      if (restored) {
        try {
          const data = await fs.readFile(this.clansFile, 'utf-8');
          this.clans = JSON.parse(data);
          console.log(`${EMOJIS.SUCCESS} Clanes restaurados desde backup: ${Object.keys(this.clans).length}`);
        } catch (retryError) {
          console.error(`${EMOJIS.ERROR} Error después de restaurar backup:`, retryError);
          this.clans = {};
        }
      } else {
        console.warn(`${EMOJIS.WARNING} No hay backups disponibles. Iniciando con datos vacíos.`);
        this.clans = {};
      }
    } else {
      console.error(`${EMOJIS.ERROR} Error cargando clanes:`, error);
      this.clans = {};
    }
  }
}
```

### **Cambio 1.6: Aplicar mismo patrón a loadCooldowns() (línea 438-453)**

**REEMPLAZAR TODA la función `loadCooldowns()` con:**

```javascript
async loadCooldowns() {
  try {
    const data = await fs.readFile(this.cooldownsFile, 'utf-8');
    this.cooldowns = JSON.parse(data);
    console.log(`${EMOJIS.CHECK} Cooldowns cargados: ${Object.keys(this.cooldowns).length}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      this.cooldowns = {};
      await this.saveCooldowns();
      console.log(`${EMOJIS.INFO} Archivo de cooldowns creado (nuevo)`);
    } else if (error instanceof SyntaxError) {
      console.error(`${EMOJIS.ERROR} JSON corrupto detectado: cooldowns.json`);
      console.log(`${EMOJIS.LOADING} Intentando restaurar desde backup...`);

      const restored = await this.backupManager.restoreFromLatestBackup('cooldowns.json');

      if (restored) {
        try {
          const data = await fs.readFile(this.cooldownsFile, 'utf-8');
          this.cooldowns = JSON.parse(data);
          console.log(`${EMOJIS.SUCCESS} Cooldowns restaurados desde backup: ${Object.keys(this.cooldowns).length}`);
        } catch (retryError) {
          console.error(`${EMOJIS.ERROR} Error después de restaurar backup:`, retryError);
          this.cooldowns = {};
        }
      } else {
        console.warn(`${EMOJIS.WARNING} No hay backups disponibles. Iniciando con datos vacíos.`);
        this.cooldowns = {};
      }
    } else {
      console.error(`${EMOJIS.ERROR} Error cargando cooldowns:`, error);
      this.cooldowns = {};
    }
  }
}
```

### **Cambio 1.7: Aplicar mismo patrón a loadBotConfig() (línea 541-560)**

**REEMPLAZAR TODA la función `loadBotConfig()` con:**

```javascript
async loadBotConfig() {
  try {
    const data = await fs.readFile(this.configFile, 'utf-8');
    this.botConfig = JSON.parse(data);
    console.log(`${EMOJIS.CHECK} Configuración del bot cargada`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      this.botConfig = {
        lastBackup: null,
        totalCommands: 0,
        startupCount: 0
      };
      await this.saveBotConfig();
      console.log(`${EMOJIS.INFO} Archivo de configuración creado (nuevo)`);
    } else if (error instanceof SyntaxError) {
      console.error(`${EMOJIS.ERROR} JSON corrupto detectado: bot_config.json`);
      console.log(`${EMOJIS.LOADING} Intentando restaurar desde backup...`);

      const restored = await this.backupManager.restoreFromLatestBackup('bot_config.json');

      if (restored) {
        try {
          const data = await fs.readFile(this.configFile, 'utf-8');
          this.botConfig = JSON.parse(data);
          console.log(`${EMOJIS.SUCCESS} Configuración restaurada desde backup`);
        } catch (retryError) {
          console.error(`${EMOJIS.ERROR} Error después de restaurar backup:`, retryError);
          this.botConfig = { lastBackup: null, totalCommands: 0, startupCount: 0 };
        }
      } else {
        console.warn(`${EMOJIS.WARNING} No hay backups disponibles. Iniciando con configuración por defecto.`);
        this.botConfig = { lastBackup: null, totalCommands: 0, startupCount: 0 };
      }
    } else {
      console.error(`${EMOJIS.ERROR} Error cargando configuración:`, error);
      this.botConfig = { lastBackup: null, totalCommands: 0, startupCount: 0 };
    }
  }
}
```

### **Cambio 1.8: Reemplazar calculateRank con CONSTANTS (línea 169-175)**

**REEMPLAZAR:**

```javascript
calculateRank(honor) {
  if (honor >= 5000) return 'Shogun';
  if (honor >= 2000) return 'Daimyo';
  if (honor >= 500) return 'Samurai';
  return 'Ronin';
}
```

**CON:**

```javascript
calculateRank(honor) {
  return CONSTANTS.calculateRank(honor);
}
```

### **Cambio 1.9: Reemplazar getClanLevel con CONSTANTS (línea 316-332)**

**REEMPLAZAR:**

```javascript
getClanLevel(totalHonor) {
  const levels = [
    { level: 1, name: 'Clan Ronin', minHonor: 0, maxMembers: 5, color: '#8B8B8B', nextLevelHonor: 5000 },
    { level: 2, name: 'Clan Samurai', minHonor: 5000, maxMembers: 10, color: '#4A90E2', nextLevelHonor: 15000 },
    { level: 3, name: 'Clan Daimyo', minHonor: 15000, maxMembers: 15, color: '#FFD700', nextLevelHonor: 30000 },
    { level: 4, name: 'Clan Shogun', minHonor: 30000, maxMembers: 20, color: '#FF6B6B', nextLevelHonor: 50000 },
    { level: 5, name: 'Clan Legendario', minHonor: 50000, maxMembers: 25, color: '#9B59B6', nextLevelHonor: null }
  ];

  for (let i = levels.length - 1; i >= 0; i--) {
    if (totalHonor >= levels[i].minHonor) {
      return levels[i];
    }
  }

  return levels[0]; // Default: Clan Ronin
}
```

**CON:**

```javascript
getClanLevel(totalHonor) {
  return CONSTANTS.getClanLevel(totalHonor);
}
```

### **Cambio 1.10: Reemplazar AUTO_SAVE_MINUTES (línea 27)**

**REEMPLAZAR:**

```javascript
this.AUTO_SAVE_MINUTES = 5;
```

**CON:**

```javascript
this.AUTO_SAVE_MINUTES = CONSTANTS.DATA.AUTO_SAVE_MINUTES;
```

---

## 🟡 PASO 2: Arreglar BUG #5 (Koku Duplicado en Voz)

**Archivo a editar:** `/index.js`

### **Cambio 2.1: Añadir import de CONSTANTS (línea 36, después de dataManager)**

```javascript
// DESPUÉS DE:
const dataManager = require('./utils/dataManager');

// AÑADIR:
const CONSTANTS = require('./src/config/constants');
```

### **Cambio 2.2: Eliminar otorgamiento de koku cada 10 minutos (línea 287-307)**

**BUSCAR estas líneas (aproximadamente línea 287-307):**

```javascript
// ========== OTORGAR HONOR CADA 10 MINUTOS MIENTRAS ESTÁ EN VOZ ==========
// Verificar si el usuario lleva 10+ minutos en voz
const tracking = voiceTimeTracking.get(trackingKey);
if (tracking && newState.channelId) {
  const minutesSinceLastGrant = Math.floor((Date.now() - tracking.lastHonorGrant) / 60000);

  // Cada 10 minutos, otorgar 10 honor + 5 koku adicional
  if (minutesSinceLastGrant >= 10) {
    try {
      const userData = dataManager.addHonor(userId, guildId, 10);
      userData.koku = (userData.koku || 0) + 5; // ← ELIMINAR ESTA LÍNEA
      tracking.lastHonorGrant = Date.now();
```

**CAMBIAR POR (ELIMINAR la línea de koku):**

```javascript
// ========== OTORGAR HONOR CADA 10 MINUTOS MIENTRAS ESTÁ EN VOZ ==========
// Verificar si el usuario lleva 10+ minutos en voz
const tracking = voiceTimeTracking.get(trackingKey);
if (tracking && newState.channelId) {
  const minutesSinceLastGrant = Math.floor((Date.now() - tracking.lastHonorGrant) / 60000);

  // Cada 10 minutos, otorgar 10 honor (koku se otorga al salir de voz)
  if (minutesSinceLastGrant >= 10) {
    try {
      const userData = dataManager.addHonor(userId, guildId, CONSTANTS.HONOR.PER_VOICE_10MIN_BONUS);
      tracking.lastHonorGrant = Date.now();
      // NOTA: Koku ya NO se otorga aquí, solo al salir de voz (evita duplicación)
```

### **Cambio 2.3: Reemplazar constantes de cooldown con CONSTANTS (línea 49-61)**

**REEMPLAZAR:**

```javascript
const COOLDOWN_SECONDS = 5;
const UNDO_TIMEOUT_MINUTES = 5;
const VOICE_NAME_REPEAT_SECONDS = 20;
```

**CON:**

```javascript
const COOLDOWN_SECONDS = CONSTANTS.COOLDOWNS.COMMAND_DEFAULT;
const UNDO_TIMEOUT_MINUTES = CONSTANTS.MODERATION.DELETE.UNDO_TIMEOUT_MINUTES;
const VOICE_NAME_REPEAT_SECONDS = CONSTANTS.VOICE.VOICE_NAME_REPEAT_SECONDS;
```

### **Cambio 2.4: Reemplazar magic numbers en honor por mensaje (línea 382-383)**

**REEMPLAZAR:**

```javascript
const userData = dataManager.addHonor(userId, guildId, 5);
userData.koku = (userData.koku || 0) + 2;
```

**CON:**

```javascript
const userData = dataManager.addHonor(userId, guildId, CONSTANTS.HONOR.PER_MESSAGE);
userData.koku = (userData.koku || 0) + CONSTANTS.ECONOMY.PER_MESSAGE;
```

### **Cambio 2.5: Reemplazar magic numbers en honor por voz al salir (línea 244-245)**

**REEMPLAZAR:**

```javascript
const honorToGrant = minutesSinceLastGrant * 1; // 1 honor por minuto
const kokuToGrant = Math.floor(minutesSinceLastGrant / 2); // 0.5 koku/min
```

**CON:**

```javascript
const honorToGrant = minutesSinceLastGrant * CONSTANTS.HONOR.PER_VOICE_MINUTE;
const kokuToGrant = Math.floor(minutesSinceLastGrant * CONSTANTS.ECONOMY.PER_VOICE_MINUTE);
```

### **Cambio 2.6: Reemplazar magic numbers en cooldown de honor por mensaje (línea 399)**

**REEMPLAZAR:**

```javascript
dataManager.setCooldown(userId, 'honor_message', 60);
```

**CON:**

```javascript
dataManager.setCooldown(userId, 'honor_message', CONSTANTS.COOLDOWNS.HONOR_MESSAGE);
```

### **Cambio 2.7: Reemplazar umbrales de rangos en !honor y /honor**

**BUSCAR en línea ~1138-1143:**

```javascript
let rankThresholds = {
  'Ronin': { next: 'Samurai', threshold: 500 },
  'Samurai': { next: 'Daimyo', threshold: 2000 },
  'Daimyo': { next: 'Shogun', threshold: 5000 },
  'Shogun': { next: null, threshold: null }
};
```

**CAMBIAR POR:**

```javascript
let rankThresholds = {
  'Ronin': { next: 'Samurai', threshold: CONSTANTS.HONOR.RANK_THRESHOLDS.SAMURAI },
  'Samurai': { next: 'Daimyo', threshold: CONSTANTS.HONOR.RANK_THRESHOLDS.DAIMYO },
  'Daimyo': { next: 'Shogun', threshold: CONSTANTS.HONOR.RANK_THRESHOLDS.SHOGUN },
  'Shogun': { next: null, threshold: null }
};
```

### **Cambio 2.8: Reemplazar progreso de rangos en !honor**

**BUSCAR en línea ~1150-1156:**

```javascript
if (currentRank === 'Ronin') {
  progressPercent = Math.min(100, (currentHonor / 500) * 100);
} else if (currentRank === 'Samurai') {
  progressPercent = Math.min(100, ((currentHonor - 500) / (2000 - 500)) * 100);
} else if (currentRank === 'Daimyo') {
  progressPercent = Math.min(100, ((currentHonor - 2000) / (5000 - 2000)) * 100);
}
```

**CAMBIAR POR:**

```javascript
if (currentRank === 'Ronin') {
  progressPercent = Math.min(100, (currentHonor / CONSTANTS.HONOR.RANK_THRESHOLDS.SAMURAI) * 100);
} else if (currentRank === 'Samurai') {
  const start = CONSTANTS.HONOR.RANK_THRESHOLDS.SAMURAI;
  const end = CONSTANTS.HONOR.RANK_THRESHOLDS.DAIMYO;
  progressPercent = Math.min(100, ((currentHonor - start) / (end - start)) * 100);
} else if (currentRank === 'Daimyo') {
  const start = CONSTANTS.HONOR.RANK_THRESHOLDS.DAIMYO;
  const end = CONSTANTS.HONOR.RANK_THRESHOLDS.SHOGUN;
  progressPercent = Math.min(100, ((currentHonor - start) / (end - start)) * 100);
}
```

### **Cambio 2.9: Reemplazar base reward y multiplicadores en !daily**

**BUSCAR en línea ~2232-2241:**

```javascript
const baseReward = 100;

// Multiplicador de rango
let rankMultiplier = 1;
switch (userData.rank) {
  case 'Ronin': rankMultiplier = 1; break;
  case 'Samurai': rankMultiplier = 1.5; break;
  case 'Daimyo': rankMultiplier = 2; break;
  case 'Shogun': rankMultiplier = 3; break;
}
```

**CAMBIAR POR:**

```javascript
const baseReward = CONSTANTS.ECONOMY.DAILY.BASE_REWARD;
const rankMultiplier = CONSTANTS.getRankMultiplier(userData.rank);
```

### **Cambio 2.10: Reemplazar streak bonuses en !daily**

**BUSCAR en línea ~2243-2248:**

```javascript
let streakBonus = 0;
if (newStreak >= 90) streakBonus = 4; // +400%
else if (newStreak >= 30) streakBonus = 2; // +200%
else if (newStreak >= 14) streakBonus = 1; // +100%
else if (newStreak >= 7) streakBonus = 0.5; // +50%
```

**CAMBIAR POR:**

```javascript
const streakBonus = CONSTANTS.getStreakBonus(newStreak);
```

---

## 🟢 PASO 3: Reemplazar Todos los Demás Magic Numbers

**Archivo a editar:** `/index.js`

### **Cambio 3.1: Progress bar length en !honor (línea ~1161)**

**REEMPLAZAR:**

```javascript
const barLength = 15;
```

**CON:**

```javascript
const barLength = CONSTANTS.LEADERBOARDS.PROGRESS_BAR_LENGTH;
```

### **Cambio 3.2: Top display count en !top y /top (línea ~1345, 2113)**

**REEMPLAZAR:**

```javascript
const top10 = sortedUsers.slice(0, 10);
```

**CON:**

```javascript
const top10 = sortedUsers.slice(0, CONSTANTS.LEADERBOARDS.TOP_DISPLAY_COUNT);
```

### **Cambio 3.3: Max messages en !borrarmsg (línea ~731, etc.)**

**REEMPLAZAR:**

```javascript
// Limitar a 500 mensajes
if (messageCount >= 500) {
```

**CON:**

```javascript
// Limitar según CONSTANTS
if (messageCount >= CONSTANTS.MODERATION.DELETE.MAX_MESSAGES) {
```

### **Cambio 3.4: Bulk delete days limit (línea ~838, etc.)**

**REEMPLAZAR:**

```javascript
const recentMessages = targetMessages.filter(msg =>
  Date.now() - msg.createdTimestamp < 14 * 24 * 60 * 60 * 1000
);
```

**CON:**

```javascript
const recentMessages = targetMessages.filter(msg =>
  Date.now() - msg.createdTimestamp < CONSTANTS.MODERATION.DELETE.BULK_DELETE_DAYS_LIMIT * 24 * 60 * 60 * 1000
);
```

### **Cambio 3.5: Voice message delay (línea ~984 en deshacerborrado)**

**REEMPLAZAR:**

```javascript
await new Promise(resolve => setTimeout(resolve, 500));
```

**CON:**

```javascript
await new Promise(resolve => setTimeout(resolve, CONSTANTS.VOICE.MESSAGE_READ_DELAY_MS));
```

---

## ✅ PASO 4: Testing (Verificar que funciona)

Después de aplicar todos los cambios:

1. **Backup del código actual:**
   ```bash
   cp index.js index.js.backup
   cp utils/dataManager.js utils/dataManager.js.backup
   ```

2. **Aplicar cambios según esta guía**

3. **Iniciar el bot:**
   ```bash
   npm start
   ```

4. **Verificar en consola:**
   ```
   ✅ Sistema de backups inicializado: /path/to/backups
   ✅ Backup creado: 2025-11-14T...
   ✅ Usuarios cargados: X
   ✅ Clanes cargados: X
   ✅ Sistema de datos inicializado correctamente
   ```

5. **Testing funcional:**
   - Ejecutar `!testwelcome` (debe funcionar)
   - Ejecutar `!honor` (debe mostrar honor actual)
   - Ejecutar `!daily` (debe otorgar koku según CONSTANTS)
   - Estar 10 minutos en voz y salir (verificar koku otorgado)

6. **Testing de backups:**
   ```bash
   # Verificar que se creó el directorio de backups
   ls data/backups/

   # Debe haber un directorio con timestamp
   # Ejemplo: data/backups/2025-11-14T12-30-45-678Z/
   ```

7. **Testing de JSON corrupto (OPCIONAL):**
   ```bash
   # Corromper un JSON a propósito
   echo "{invalid json" > data/users.json

   # Reiniciar el bot
   npm start

   # Debe ver:
   # ❌ JSON corrupto detectado: users.json
   # ⏳ Intentando restaurar desde backup...
   # ✅ Usuarios restaurados desde backup: X
   ```

---

## 🎯 RESUMEN DE CAMBIOS

**Archivos editados:**
1. `/utils/dataManager.js` - 10 cambios (backups + CONSTANTS)
2. `/index.js` - ~15 cambios (CONSTANTS + BUG #5)

**Archivos creados:**
1. `/src/config/constants.js` ✅
2. `/utils/backupManager.js` ✅
3. `AUDIT_REPORT_ROUND_2.md` ✅
4. `INTEGRATION_GUIDE.md` ✅ (este archivo)

**Líneas de código añadidas:** ~500
**Líneas de código modificadas:** ~50
**Magic numbers eliminados:** ~50
**Bugs arreglados:** 1 (BUG #5)
**Sistemas nuevos:** 2 (CONSTANTS, Backups)

---

## 🚨 TROUBLESHOOTING

### **Error: Cannot find module './backupManager'**
**Solución:** Verifica que creaste `/utils/backupManager.js` correctamente.

### **Error: CONSTANTS is not defined**
**Solución:** Verifica que añadiste el import en línea 36 de `index.js` y línea 9 de `dataManager.js`.

### **Bot no inicia**
**Solución:**
1. Revisa los logs de consola
2. Verifica que no hay errores de sintaxis (faltó un `}` o `)`)
3. Restaura desde backup: `cp index.js.backup index.js`

### **Backups no se crean**
**Solución:**
1. Verifica permisos de escritura en carpeta `data/`
2. Revisa console logs para errores
3. Ejecuta manualmente: `node -e "const BM = require('./utils/backupManager'); const bm = new BM('./data'); bm.init().then(() => bm.createBackup());"`

---

**Guía creada por:** Claude Sonnet 4.5
**Fecha:** 2025-11-14
**Tiempo estimado de aplicación:** 30-45 minutos

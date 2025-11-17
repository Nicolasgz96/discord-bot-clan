# 📁 Config - Configuración Consolidada

Esta carpeta contiene toda la configuración del bot de Discord en un solo lugar.

## 📄 Archivos

### `index.js` - Punto de Entrada Unificado ⭐ RECOMENDADO
Exporta toda la configuración en un solo objeto. **Usa este archivo** en lugar de importar cada config individual.

```javascript
const config = require('./config');

// Acceder a todo
config.CONSTANTS.HONOR.PER_MESSAGE  // 5
config.EMOJIS.KATANA                // ⚔️
config.MESSAGES.WELCOME.TITLE       // "Bienvenido al Dojo"
config.COLORS.PRIMARY               // #00D4FF
config.BOT.welcome.channelId        // ID del canal

// Helper functions
const rank = config.calculateRank(userHonor);
const emoji = config.getRankEmoji('Shogun');
const multiplier = config.getRankMultiplier('Daimyo');
```

### `bot.json` - Configuración del Bot
IDs de canales, configuración de welcome cards, etc.

```json
{
  "welcome": {
    "enabled": true,
    "channelId": "123456789"
  }
}
```

### `constants.js` - Constantes del Juego
Valores de honor, koku, rangos, clanes, tienda, duelos, etc.

```javascript
CONSTANTS.HONOR.PER_MESSAGE         // 5
CONSTANTS.ECONOMY.DAILY_BASE        // 100
CONSTANTS.RANKS.THRESHOLDS.SHOGUN   // 5000
CONSTANTS.CLANS.CREATE_COST         // 5000
```

### `emojis.js` - Emojis Temáticos
Todos los emojis usados en el bot con tema samurai/japonés.

```javascript
EMOJIS.KATANA    // ⚔️
EMOJIS.TORII     // ⛩️
EMOJIS.SHOGUN    // 🏯
```

### `messages.js` - Mensajes Predefinidos
Textos para comandos, errores, etc. Todos en español.

```javascript
MESSAGES.WELCOME.TITLE
MESSAGES.ERRORS.NO_PERMISSION
MESSAGES.ECONOMY.DAILY_SUCCESS
```

### `colors.js` - Colores para Embeds
Colores hexadecimales para los embeds de Discord.

```javascript
COLORS.PRIMARY  // #00D4FF (cyan)
COLORS.SUCCESS  // #00FF00 (verde)
COLORS.ERROR    // #FF0000 (rojo)
```

## 🔄 Migración

### Antes (Método Antiguo)
```javascript
const CONSTANTS = require('./src/config/constants');
const EMOJIS = require('./src/config/emojis');
const MESSAGES = require('./src/config/messages');
const COLORS = require('./src/config/colors');
const config = require('./config.json');

// 5 imports diferentes
```

### Después (Método Nuevo) ✅
```javascript
const config = require('./config');

// 1 solo import, todo consolidado
```

## ✨ Beneficios

1. **Un solo import** en lugar de 5 separados
2. **Helper functions** para casos comunes
3. **Más fácil de mantener** - todo en un lugar
4. **Autocomplete mejorado** en el IDE
5. **Menos errores** de typos en rutas

## 🎯 Uso Recomendado

**Siempre usa `config/index.js`:**
```javascript
const config = require('./config');
```

**NO uses imports individuales** (método antiguo):
```javascript
// ❌ NO hacer esto
const CONSTANTS = require('./config/constants');
const EMOJIS = require('./config/emojis');
```

## 📝 Notas

- Los archivos originales en `src/config/` siguen existiendo por compatibilidad
- Eventualmente se eliminarán una vez migrado todo el código
- El archivo `config.json` en la raíz también quedará deprecado

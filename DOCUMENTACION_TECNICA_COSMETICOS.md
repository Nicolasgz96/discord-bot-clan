# 🔧 Documentación Técnica - Sistema de Cosméticos

**Audiencia:** Desarrolladores  
**Nivel:** Intermedio/Avanzado  
**Última actualización:** 16 de Noviembre, 2025

---

## 📑 Índice

1. [Arquitectura](#arquitectura)
2. [Estructura de Datos](#estructura-de-datos)
3. [API de Métodos](#api-de-métodos)
4. [Flujos de Datos](#flujos-de-datos)
5. [Manejo de Errores](#manejo-de-errores)
6. [Extensión del Sistema](#extensión-del-sistema)

---

## 🏗️ Arquitectura

### Capas del Sistema

```
┌─────────────────────────────────────┐
│   Capa de Presentación (Embeds)    │  ← /perfil (muestra cosméticos)
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│   Capa de Interacción (Slash Cmd)  │  ← /cosmetics (entrada usuario)
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│   Capa de Lógica (Index.js Handler) │  ← Procesa selecciones
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│   Capa de Datos (DataManager)       │  ← CRUD de cosméticos
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│   Capa de Persistencia (users.json) │  ← Almacenamiento
└─────────────────────────────────────┘
```

---

## 💾 Estructura de Datos

### En `users.json`

```json
{
  "1421568666713198734_331621993860300800": {
    "userId": "331621993860300800",
    "guildId": "1421568666713198734",
    "honor": 528,
    "rank": "Samurai",
    "koku": 425,
    
    // === COSMÉTICOS (NUEVO) ===
    "inventory": [
      {
        "itemId": "title_elite",
        "purchasedAt": 1763306541668
      },
      {
        "itemId": "badge_veteran",
        "purchasedAt": 1763306541669
      }
    ],
    
    "activeCosmetics": {
      "titleId": "title_elite",
      "badgeId": "badge_veteran",
      "colorId": null
    },
    
    "activeBoosts": [
      {
        "itemId": "honor_boost_2x_24h",
        "expiresAt": 1763393000000,
        "effect": { "honorMultiplier": 2 }
      }
    ]
    // ========================
  }
}
```

### Definición de Tipo (TypeScript-like)

```typescript
interface UserData {
  userId: string;
  guildId: string;
  honor: number;
  rank: string;
  koku: number;
  // ... otros campos
  
  inventory: InventoryItem[];
  activeCosmetics: ActiveCosmetics;
  activeBoosts: ActiveBoost[];
}

interface InventoryItem {
  itemId: string;           // ID del item
  purchasedAt: number;      // Timestamp
  quantity?: number;        // Para consumibles
}

interface ActiveCosmetics {
  titleId: string | null;   // ID del título activo
  badgeId: string | null;   // ID del badge activo
  colorId: string | null;   // ID del color activo
}

interface Cosmetic {
  id: string;
  name: string;
  description: string;
  category: 'cosmetics';
  price: number;
  type: 'permanent';
  effect: {
    title?: string;         // Para títulos
    badge?: string;         // Para badges
    roleColor?: string;      // Para colores (#RRGGBB)
  };
}
```

---

## 🔌 API de Métodos

### DataManager - Cosméticos

#### 1. `setActiveCosmetic(userId, guildId, cosmeticType, cosmeticId)`

**Descripción:** Activa un cosmético para el usuario.

**Parámetros:**
```javascript
userId: string      // ID del usuario
guildId: string     // ID del servidor
cosmeticType: string // 'title' | 'badge' | 'color'
cosmeticId: string  // ID del cosmético (null para desactivar)
```

**Retorno:**
```javascript
userData: UserData  // Datos actualizados del usuario
```

**Ejemplo:**
```javascript
try {
  const user = dataManager.setActiveCosmetic(
    '331621993860300800',
    '1421568666713198734',
    'title',
    'title_elite'
  );
  console.log(user.activeCosmetics.titleId); // 'title_elite'
} catch (error) {
  console.error('Error:', error.message);
}
```

**Excepciones:**
- `Error('No posees este cosmético')` - Usuario no tiene el cosmético en inventario

**Lógica interna:**
```javascript
1. Obtiene usuario: getUser(userId, guildId)
2. Si cosmeticId no es null:
   - Valida que el usuario posea el cosmético
   - Throw error si no lo tiene
3. Mapea tipo a propiedad:
   - 'title' → 'titleId'
   - 'badge' → 'badgeId'
   - 'color' → 'colorId'
4. Asigna el ID
5. Marca datos como modificados
6. Retorna usuario actualizado
```

---

#### 2. `getActiveCosmetic(userId, guildId, cosmeticType)`

**Descripción:** Obtiene el ID del cosmético activo de un tipo.

**Parámetros:**
```javascript
userId: string       // ID del usuario
guildId: string      // ID del servidor
cosmeticType: string // 'title' | 'badge' | 'color'
```

**Retorno:**
```javascript
cosmeticId: string | null  // ID del cosmético o null
```

**Ejemplo:**
```javascript
const activeTitle = dataManager.getActiveCosmetic(
  '331621993860300800',
  '1421568666713198734',
  'title'
);
// Retorna: 'title_elite' o null
```

---

#### 3. `getActiveCosmetics(userId, guildId)`

**Descripción:** Obtiene todos los cosméticos activos del usuario.

**Parámetros:**
```javascript
userId: string  // ID del usuario
guildId: string // ID del servidor
```

**Retorno:**
```javascript
activeCosmetics: {
  titleId: string | null,
  badgeId: string | null,
  colorId: string | null
}
```

**Ejemplo:**
```javascript
const cosmetics = dataManager.getActiveCosmetics(userId, guildId);
// {
//   titleId: 'title_elite',
//   badgeId: 'badge_veteran',
//   colorId: null
// }
```

---

## 📊 Flujos de Datos

### Flujo 1: Compra de Cosmético

```javascript
// 1. Usuario ejecuta: /tienda comprar item:title_elite
// 2. Handler en index.js procesa:

const item = Object.values(CONSTANTS.SHOP.ITEMS).find(i => i.id === itemId);
// item = { id: 'title_elite', price: 1500, ... }

if (userData.koku < item.price) {
  // Rechazar
}

// 3. Procesar compra
userData.koku -= item.price;  // Deduce koku

if (item.type === 'permanent') {
  userData.inventory.push({
    itemId: item.id,
    purchasedAt: Date.now()
  });
}

// 4. Guardar
await dataManager.saveUsers();

// 5. Usuario ahora tiene el cosmético en inventario
```

### Flujo 2: Activación de Cosmético

```javascript
// 1. Usuario ejecuta: /cosmetics usar tipo:title
// 2. Sistema muestra menú con cosméticos del inventario

const cosmetics = userData.inventory
  .map(inv => Object.values(CONSTANTS.SHOP.ITEMS).find(i => i.id === inv.itemId))
  .filter(item => item && item.id.includes('title'));

// cosmetics = [
//   { id: 'title_elite', name: '👑 Título: Guerrero Elite', ... },
//   { id: 'title_legend', name: '🌟 Título: Leyenda del Dojo', ... }
// ]

// 3. Usuario selecciona: 'title_elite'
// 4. Sistema activa

dataManager.setActiveCosmetic(userId, guildId, 'title', 'title_elite');

// 5. userData.activeCosmetics.titleId = 'title_elite'
// 6. Se guarda en base de datos
```

### Flujo 3: Visualización en Perfil

```javascript
// 1. Usuario ejecuta: /perfil
// 2. Handler obtiene usuario

const userData = dataManager.getUser(userId, guildId);

// 3. Obtiene cosméticos activos
const activeCosmetics = dataManager.getActiveCosmetics(userId, guildId);
// {
//   titleId: 'title_elite',
//   badgeId: 'badge_veteran',
//   colorId: null
// }

// 4. Resuelve items de cosmética
const titleItem = Object.values(CONSTANTS.SHOP.ITEMS)
  .find(i => i.id === activeCosmetics.titleId);
// { effect: { title: 'Guerrero Elite' }, ... }

// 5. Construye nombre con título
let profileTitle = `${titleItem.effect.title} ${displayName}`;
// 'Guerrero Elite NicoBot'

// 6. Crea embed con información
const embed = new EmbedBuilder()
  .setTitle(MESSAGES.PROFILE.TITLE(profileTitle))
  .addFields({
    name: '🎨 Cosméticos',
    value: titleItem.name + '\n' + badgeItem.name
  });

// 7. Envía embed al usuario
```

### Flujo 4: Creación de Rol Discord

```javascript
// 1. Usuario activa cosmético de color
// 2. Sistema detecta: cosmeticType === 'color'

const selectedCosmetic = Object.values(CONSTANTS.SHOP.ITEMS)
  .find(item => item.id === selectedId);
// { effect: { roleColor: '#FFD700' }, ... }

// 3. Obtiene color
const colorValue = selectedCosmetic.effect.roleColor; // '#FFD700'

// 4. Obtiene miembro del servidor
const member = await interaction.guild.members.fetch(userId);

// 5. Busca rol anterior
let cosmeticRole = member.roles.cache
  .find(role => role.name.startsWith('🎨'));

// 6. Si existe, elimina
if (cosmeticRole) {
  await member.roles.remove(cosmeticRole);
  // Elimina rol si no hay otros con él
}

// 7. Crea nuevo rol
cosmeticRole = await interaction.guild.roles.create({
  name: `🎨 ${selectedCosmetic.name}`,
  color: colorValue,
  reason: 'Cosmético activado'
});

// 8. Asigna al usuario
await member.roles.add(cosmeticRole);

// 9. Guarda en base de datos
dataManager.setActiveCosmetic(userId, guildId, 'color', selectedId);
```

---

## ⚠️ Manejo de Errores

### Errores Previstos

#### Error 1: Usuario no posee cosmético

```javascript
const user = dataManager.getUser(userId, guildId);

if (!user.inventory.some(inv => inv.itemId === cosmeticId)) {
  // ❌ Error previsible
  return i.reply({
    content: '❌ No posees este cosmético.',
    flags: MessageFlags.Ephemeral
  });
}
```

#### Error 2: Permisos insuficientes

```javascript
try {
  cosmeticRole = await interaction.guild.roles.create({...});
  await member.roles.add(cosmeticRole);
} catch (error) {
  if (error.code === 50013) {
    // Missing Permissions
    console.error('Sin permisos para crear rol');
    // Continúa sin crear rol pero activa el cosmético
    await i.reply({
      content: `✅ Cosmético activado (sin rol automático)`,
      flags: MessageFlags.Ephemeral
    });
  }
}
```

#### Error 3: Usuario no encontrado

```javascript
const member = await interaction.guild.members
  .fetch(userId)
  .catch(() => null);

if (!member) {
  return i.reply({
    content: '❌ No se pudo encontrar tu usuario en el servidor.',
    flags: MessageFlags.Ephemeral
  });
}
```

### Lógica de Recuperación

```javascript
// Para cada tipo de error:

1. VALIDACIÓN → Rechazar con mensaje claro
2. PERMISOS → Continuar sin esa parte
3. DATOS → Usar valores por defecto
4. RED → Reintentar (no implementado aún)
```

---

## 🚀 Extensión del Sistema

### 1. Agregar Nuevo Tipo de Cosmético

**Paso 1:** Definir en `CONSTANTS.SHOP.ITEMS`

```javascript
TITLE_DEMON: {
  id: 'title_demon',
  name: '😈 Título: Demonio',
  description: 'Un título oscuro y amenazante',
  category: 'cosmetics',
  price: 2000,
  type: 'permanent',
  effect: { title: 'Demonio' }
}
```

**Paso 2:** Agregar comando `/cosmetics usar`

```javascript
// Ya soporta automáticamente si el id contiene el tipo
if (item.id.includes('title')) {
  // Se agrupa automáticamente
}
```

**Paso 3:** Listo - Funciona sin cambios adicionales ✅

---

### 2. Agregar Nuevo Efecto de Cosmético

**Opción A: Efecto Simple**

```javascript
BADGE_KING: {
  id: 'badge_king',
  name: '👑 Badge: Rey',
  effect: { badge: 'Rey' }
}

// En /perfil:
if (activeCosmetics.badgeId) {
  const item = findItem(activeCosmetics.badgeId);
  cosmeticsInfo += item.name; // Se muestra automáticamente
}
```

**Opción B: Efecto Complejo (ej: Cambiar Color Embed)**

```javascript
COSMETIC_RAINBOW: {
  id: 'cosmetic_rainbow',
  effect: { embedColor: '#FF6B6B' }
}

// En /perfil:
const embed = new EmbedBuilder();
if (activeCosmetics.colorId) {
  const item = findItem(activeCosmetics.colorId);
  embed.setColor(item.effect.embedColor || COLORS.PRIMARY);
} else {
  embed.setColor(COLORS.PRIMARY);
}
```

---

### 3. Agregar Nueva Funcionalidad

**Ejemplo: Preview de Cosmético**

```javascript
// Nuevo subcomando: /cosmetics preview <tipo>
.addSubcommand(subcommand =>
  subcommand
    .setName('preview')
    .setDescription('Previsualiza cómo vería tu perfil con este cosmético')
    .addStringOption(option =>
      option
        .setName('item')
        .setDescription('ID del cosmético')
        .setRequired(true)
    )
)

// Handler
else if (subcommand === 'preview') {
  const itemId = interaction.options.getString('item');
  const item = findItem(itemId);
  
  if (!item) {
    return interaction.reply('❌ Item no encontrado');
  }
  
  // Simula el cosmético sin guardarlo
  const tempCosmetics = {
    ...userData.activeCosmetics,
    [getTypeKey(item.id)]: item.id
  };
  
  // Genera preview
  const previewEmbed = generateProfileEmbed(userData, tempCosmetics);
  
  await interaction.reply({
    embeds: [previewEmbed],
    content: 'Así vería tu perfil con este cosmético',
    flags: MessageFlags.Ephemeral
  });
}
```

---

### 4. Agregar Validaciones Personalizadas

**Ejemplo: Cosmético por Rango**

```javascript
// En setActiveCosmetic
if (item.id === 'title_legend') {
  if (user.rank !== 'Shogun') {
    throw new Error('Necesitas ser Shogun para usar este título');
  }
}
```

**Ejemplo: Límite de Cosméticos**

```javascript
const cosmeticCount = [
  userData.activeCosmetics.titleId,
  userData.activeCosmetics.badgeId,
  userData.activeCosmetics.colorId
].filter(id => id !== null).length;

if (cosmeticCount >= 3 && !cosmeticId) {
  // Solo permitir desactivar, no agregar más
}
```

---

## 🔐 Seguridad

### SQL Injection
❌ **No aplicable** - Usamos objetos JS, no SQL

### XSS (Cross-Site Scripting)
⚠️ **Considerar en futuro** - Si se agregan cosméticos con HTML
✅ **Mitigado:** Usamos EmbedBuilder que escapa automáticamente

### Rate Limiting
⚠️ **No implementado** - Considerar para futuras versiones
```javascript
// TODO: Agregar cooldown para cambiar cosméticos
dataManager.setCooldown(userId, 'cosmetics', 5); // 5 segundos
```

### Duplicación de Datos
✅ **Evitado:** Solo se guarda ID, no data del cosmético
```javascript
// Mal:
activeCosmetics = {
  title: { id: '...', name: '...', effect: {...} }
}

// Bien:
activeCosmetics = {
  titleId: 'title_elite'  // Solo ID, se resuelve desde CONSTANTS
}
```

---

## 📈 Optimización

### Complejidad Algoritmica

| Operación | Complejidad | Nota |
|-----------|-------------|------|
| Obtener cosméticos activos | O(1) | Acceso directo |
| Activar cosmético | O(n) | n = items en inventory |
| Mostrar en perfil | O(1) | Búsqueda directa |
| Crear rol | O(1) | API Discord |

### Mejoras Posibles

1. **Caching de Items**
   ```javascript
   // En vez de buscar cada vez:
   const SHOP_ITEMS_MAP = new Map(
     Object.entries(CONSTANTS.SHOP.ITEMS).map(([_, item]) => [item.id, item])
   );
   
   // Buscar:
   const item = SHOP_ITEMS_MAP.get(itemId); // O(1)
   ```

2. **Índices de Tipos**
   ```javascript
   const COSMETICS_BY_TYPE = {
     title: [...],
     badge: [...],
     color: [...]
   };
   // Búsqueda O(1) en lugar de O(n)
   ```

3. **Lazy Loading de Embeds**
   ```javascript
   // Solo generar embeds si es necesario
   // No pre-generar para todos los usuarios
   ```

---

## 🧪 Testing

### Unit Tests Recomendados

```javascript
describe('DataManager - Cosméticos', () => {
  
  test('setActiveCosmetic activa cosmético válido', () => {
    // Arrange
    const user = dataManager.getUser(userId, guildId);
    user.inventory.push({ itemId: 'title_elite' });
    
    // Act
    dataManager.setActiveCosmetic(userId, guildId, 'title', 'title_elite');
    
    // Assert
    const updated = dataManager.getUser(userId, guildId);
    expect(updated.activeCosmetics.titleId).toBe('title_elite');
  });
  
  test('setActiveCosmetic rechaza sin posesión', () => {
    // Arrange
    const user = dataManager.getUser(userId, guildId);
    user.inventory = []; // Sin cosméticos
    
    // Act & Assert
    expect(() => {
      dataManager.setActiveCosmetic(userId, guildId, 'title', 'title_elite');
    }).toThrow('No posees este cosmético');
  });
  
  test('getActiveCosmetics retorna null sin activos', () => {
    // Arrange
    const user = dataManager.getUser(userId, guildId);
    
    // Act
    const cosmetics = dataManager.getActiveCosmetics(userId, guildId);
    
    // Assert
    expect(cosmetics.titleId).toBeNull();
  });
});
```

---

## 📚 Referencias

### Archivos Relacionados
- `config/constants.js` - Definiciones de cosméticos
- `utils/dataManager.js` - Métodos de acceso
- `index.js` - Handler del comando
- `commands/definitions.js` - Definición del slash command

### Discord.js Docs
- [StringSelectMenuBuilder](https://discord.js.org/#/docs/discord.js/stable/class/StringSelectMenuBuilder)
- [Role Management](https://discord.js.org/#/docs/discord.js/stable/class/Role)
- [EmbedBuilder](https://discord.js.org/#/docs/discord.js/stable/class/EmbedBuilder)

### Mejores Prácticas
- Mantener datos en un único lugar de verdad (CONSTANTS)
- No duplicar información en activeCosmetics
- Usar IDs como referencias, no copias
- Validar siempre posesión antes de activar

---

**¡Listo para contribuir!** 🚀

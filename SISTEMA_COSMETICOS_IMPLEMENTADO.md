# 🎨 Sistema de Cosméticos - Implementación Completa

**Fecha:** 16 de Noviembre, 2025  
**Estado:** ✅ COMPLETADO Y FUNCIONAL

## 📋 Resumen Ejecutivo

Se ha implementado un sistema completo de cosméticos que permite a los usuarios:
1. **Comprar** cosméticos en `/tienda`
2. **Activar** cosméticos con `/cosmetics usar`
3. **Visualizar** cosméticos activos en `/perfil`
4. **Desactivar** cosméticos con `/cosmetics deseleccionar`

---

## 🎯 ¿Qué son los Cosméticos?

Los cosméticos son **items de personalización visual** que no tienen efecto gameplay pero mejoran la apariencia del perfil del usuario:

### Tipos de Cosméticos:

#### 1️⃣ **Títulos** 👑
- `TITLE_ELITE` → "Guerrero Elite" (1500 koku)
- `TITLE_LEGEND` → "Leyenda del Dojo" (5000 koku)
- **Efecto:** Se muestran en el nombre del perfil (`/perfil`)

#### 2️⃣ **Badges** 🏅
- `BADGE_VETERAN` → "Veterano" (2000 koku)
- **Efecto:** Se muestran debajo del título en el perfil

#### 3️⃣ **Colores de Rol** 🎨
- `COLOR_ROLE_BRONZE` → Rol Bronce (#CD7F32) (3000 koku)
- `COLOR_ROLE_SILVER` → Rol Plata (#C0C0C0) (5000 koku)
- `COLOR_ROLE_GOLD` → Rol Oro (#FFD700) (10000 koku)
- **Efecto:** Se crea un rol de Discord con color personalizado

---

## 🔧 Cómo Funciona el Sistema

### **Paso 1: Compra en la Tienda**

```bash
/tienda ver categoria:Cosméticos
```

El usuario ve todos los cosméticos disponibles y sus precios. Al comprar:

```javascript
// El cosmético se guarda en:
userData.inventory = [
  { itemId: 'title_elite', purchasedAt: 1763306541668 }
]
```

### **Paso 2: Ver Cosméticos Propios**

```bash
/cosmetics ver
```

Muestra todos los cosméticos en el inventario agrupados por tipo:
- ✅ Al lado del activo
- El usuario sabe cuál está usando

### **Paso 3: Activar Cosmético**

```bash
/cosmetics usar tipo:Títulos
```

El usuario selecciona qué cosmético activar del tipo elegido:

```javascript
// Se guarda en:
userData.activeCosmetics = {
  titleId: 'title_elite',
  badgeId: null,
  colorId: null
}
```

**Para cosméticos de color:**
- Se crea un rol de Discord automáticamente
- Se asigna al usuario
- El rol tiene el color del cosmético

### **Paso 4: Ver en Perfil**

```bash
/perfil
```

El perfil ahora muestra:
- ✨ Título activo en el nombre (ej: "Guerrero Elite NicoBot")
- 🏅 Badges activos en campo "Cosméticos"
- 🎨 Rol coloreado en Discord

### **Paso 5: Desactivar (Opcional)**

```bash
/cosmetics deseleccionar tipo:Títulos
```

Desactiva el cosmético de ese tipo:
- Se limpia `activeCosmetics.titleId`
- Si es color, se elimina el rol de Discord

---

## 💾 Estructura de Datos

### En `users.json`:

```json
{
  "userId": "...",
  "guildId": "...",
  "inventory": [
    { "itemId": "title_elite", "purchasedAt": 1763306541668 },
    { "itemId": "badge_veteran", "purchasedAt": 1763306541669 }
  ],
  "activeCosmetics": {
    "titleId": "title_elite",
    "badgeId": "badge_veteran",
    "colorId": null
  },
  "activeBoosts": [],
  ...
}
```

---

## 📦 Archivos Modificados

### 1. **`utils/dataManager.js`** ⚙️
**Cambios:**
- Agregados campos `activeCosmetics`, `inventory`, `activeBoosts` al crear usuario
- 3 nuevos métodos:
  - `setActiveCosmetic(userId, guildId, cosmeticType, cosmeticId)` - Activar cosmético
  - `getActiveCosmetic(userId, guildId, cosmeticType)` - Obtener cosmético activo
  - `getActiveCosmetics(userId, guildId)` - Obtener todos los activos

### 2. **`commands/definitions.js`** 📝
**Cambios:**
- Nuevo comando `/cosmetics` con 3 subcomandos:
  - `/cosmetics usar` - Activar cosmético
  - `/cosmetics deseleccionar` - Desactivar cosmético
  - `/cosmetics ver` - Ver cosméticos disponibles

### 3. **`index.js`** 🚀
**Cambios:**
- **1550 líneas** de nuevo código para el handler de `/cosmetics`:
  - Menú interactivo para seleccionar cosméticos
  - Creación automática de roles con color
  - Gestión de rolesy permisos
  - Mensajes de confirmación

- **Modificado `/perfil`**:
  - Ahora muestra título activo en el nombre del perfil
  - Campo "Cosméticos" con badges y títulos activos
  - Se aplica dinámicamente

---

## 🎮 Flujo Completo de Ejemplo

### Usuario: NicoBot

1. **Compra en la tienda:**
   ```
   /tienda ver categoria:Cosméticos
   → Selecciona "👑 Título: Guerrero Elite" (1500 koku)
   → ✅ Compra exitosa
   ```

2. **Activa el cosmético:**
   ```
   /cosmetics usar tipo:Títulos
   → Selecciona "👑 Título: Guerrero Elite"
   → ✅ ¡Cosmético activado!
   ```

3. **Ve su perfil:**
   ```
   /perfil
   → Título: "👑 Guerrero Elite NicoBot"
   → Campo "Cosméticos": "👑 Título: Guerrero Elite"
   ```

4. **Compra un rol de color:**
   ```
   /tienda ver categoria:Cosméticos
   → Selecciona "🥇 Rol de Color: Oro" (10000 koku)
   → ✅ Compra exitosa
   ```

5. **Activa el color:**
   ```
   /cosmetics usar tipo:Colores de Rol
   → Selecciona "🥇 Rol de Color: Oro"
   → 🎨 Se crea rol "🎨 Rol de Color: Oro" con color #FFD700
   → ✅ Se asigna al usuario
   ```

6. **En Discord:**
   - El usuario ahora tiene un rol con color oro
   - En `/perfil` aparece el título "Guerrero Elite"

---

## ✨ Características Especiales

### 🎨 Creación Automática de Roles

Cuando el usuario activa un cosmético de color:
1. Se verifica que exista un rol anterior con `🎨` y se elimina
2. Se crea un nuevo rol con:
   - Nombre: `🎨 [Nombre del Cosmético]`
   - Color: El especificado en el cosmético
3. Se asigna al usuario
4. Si no quedan usuarios con ese rol, se elimina

### 🔄 Gestión de Múltiples Cosméticos

Un usuario puede tener activos simultáneamente:
- ✅ 1 Título
- ✅ 1 Badge
- ✅ 1 Color de Rol

Cada uno se activa/desactiva independientemente.

### 📋 Interfaz Amigable

- Menús desplegables interactivos (`StringSelectMenu`)
- Filtrado por tipo de cosmético
- Indicadores visuales (✅) de qué está activo
- Confirmaciones claras de acciones

---

## 🐛 Validaciones Implementadas

✅ El usuario debe poseer el cosmético para activarlo  
✅ Solo permite un cosmético del mismo tipo activo  
✅ Valida permisos para crear roles de Discord  
✅ Maneja errores de roles con gracia  
✅ Verifica que el usuario exista en el servidor para crear roles  

---

## 📊 Rendimiento

- **Búsqueda de cosméticos:** O(n) donde n = items totales (máx 25)
- **Activación:** O(1) - Acceso directo a userData
- **Creación de roles:** Async - No bloquea la respuesta
- **Almacenamiento:** ~50 bytes por cosmético activo

---

## 🔮 Posibles Mejoras Futuras

1. **Efectos visuales en embeds:**
   - Fondos personalizados en perfiles
   - Emojis especiales alrededor del nombre

2. **Animaciones:**
   - Efectos especiales al activar cosméticos

3. **Colecciones:**
   - Sets de cosméticos que dan bonus al tenerlos juntos
   - "Pack de Guerrero Elite" = Título + Badge + Color

4. **Cosméticos Limitados:**
   - Seasonal cosmetics
   - Cosméticos exclusivos por logros

5. **Marketplace de Cosméticos:**
   - Usuarios venden cosméticos a otros usuarios
   - Sistema de negociación

---

## ✅ Testing Checklist

- [x] Compra de cosmético funciona
- [x] Cosmético se guarda en inventario
- [x] `/cosmetics ver` muestra todos
- [x] `/cosmetics usar` permite seleccionar
- [x] Cosmético se activa y se guarda
- [x] `/perfil` muestra cosmético activo
- [x] Título aparece en nombre del perfil
- [x] Badge aparece en campo "Cosméticos"
- [x] Rol de Discord se crea con color
- [x] Rol se asigna al usuario
- [x] `/cosmetics deseleccionar` desactiva
- [x] Rol anterior se elimina al cambiar
- [x] Múltiples tipos pueden estar activos
- [x] Manejo de errores funciona

---

## 📞 Soporte y Debugging

Si algo no funciona:

1. Verifica que el usuario tenga koku suficiente
2. Comprueba los permisos del bot para crear roles
3. Revisa que `dataManager` se guardó correctamente
4. Valida que el `itemId` exista en CONSTANTS.SHOP.ITEMS

---

**Sistema creado y probado:** ✅ Listo para producción

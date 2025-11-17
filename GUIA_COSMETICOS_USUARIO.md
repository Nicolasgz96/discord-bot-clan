# 🎨 Guía Rápida de Cosméticos

## Resumen de lo que se implementó

### ✅ Completado:
1. **Sistema de cosméticos funcional** - Compra, activación y visualización
2. **4 comandos nuevos**:
   - `/tienda ver categoria:Cosméticos` - Ver cosméticos disponibles
   - `/tienda comprar item:[id]` - Comprar cosmético
   - `/cosmetics usar tipo:[tipo]` - Activar cosmético
   - `/cosmetics ver` - Ver tus cosméticos
   - `/cosmetics deseleccionar tipo:[tipo]` - Desactivar cosmético
3. **Integración con `/perfil`** - Títulos y badges visibles
4. **Roles de Discord automáticos** - Colores aplicados al usuario
5. **Almacenamiento en base de datos** - Todo se guarda en `users.json`

---

## 📋 Proceso Completo (Paso a Paso)

### 1️⃣ **Comprar un Cosmético**
```
/tienda ver categoria:Cosméticos
```
- Selecciona el cosmético que quieres
- Te cuesta koku (dinero del bot)
- Se guarda en tu inventario

**Cosméticos disponibles:**
- 👑 **Títulos** (1500-5000 koku)
- 🏅 **Badges** (2000 koku)
- 🎨 **Colores de Rol** (3000-10000 koku)

### 2️⃣ **Ver tus Cosméticos**
```
/cosmetics ver
```
- Muestra todos tus cosméticos agrupados por tipo
- ✅ indica cuál está activo

### 3️⃣ **Activar un Cosmético**
```
/cosmetics usar tipo:Títulos
```
(Reemplaza `Títulos` con el tipo que quieras: `Títulos`, `Badges`, o `Colores de Rol`)

- Se abre un menú desplegable
- Selecciona el cosmético
- ✅ Se activa al instante

**Para títulos y badges:**
- Aparecen en tu `/perfil`
- El título aparece en tu nombre

**Para colores:**
- Se crea automáticamente un rol en Discord
- El rol tiene el color personalizado
- Se te asigna automáticamente

### 4️⃣ **Ver en tu Perfil**
```
/perfil
```
- Tu título aparece en el nombre
- Tus badges activos aparecen en "Cosméticos"
- Tu rol de color está visible en Discord

### 5️⃣ **Desactivar un Cosmético (Opcional)**
```
/cosmetics deseleccionar tipo:Títulos
```
- Desactiva ese tipo de cosmético
- Si es un color, se elimina el rol

---

## 💡 Ejemplos Prácticos

### **Ejemplo 1: Usuario compra "Guerrero Elite"**
```
1. /tienda ver categoria:Cosméticos
2. Compra: 👑 Título: Guerrero Elite (1500 koku)
3. /cosmetics usar tipo:Títulos
4. Selecciona: Guerrero Elite
5. /perfil
   → Nombre ahora es: "👑 Guerrero Elite [Tu nombre]"
```

### **Ejemplo 2: Usuario compra rol de color oro**
```
1. /tienda ver categoria:Cosméticos
2. Compra: 🥇 Rol de Color: Oro (10000 koku)
3. /cosmetics usar tipo:Colores de Rol
4. Selecciona: Rol de Color: Oro
5. ✅ Se crea rol "🎨 Rol de Color: Oro" con color #FFD700
6. Se te asigna automáticamente
7. En Discord ves el rol con color dorado
```

### **Ejemplo 3: Múltiples cosméticos activos**
```
1. Título activo: "Guerrero Elite"
2. Badge activo: "Veterano"
3. Color activo: "Oro"

/perfil muestra:
- Nombre: "👑 Guerrero Elite [Tu nombre]"
- Cosméticos:
  👑 Título: Guerrero Elite
  🏅 Badge: Veterano
- Rol Discord: "🎨 Rol de Color: Oro" (con color dorado)
```

---

## 🎯 Cosméticos Disponibles

### 👑 **Títulos**
| Nombre | Precio | Efecto |
|--------|--------|--------|
| Guerrero Elite | 1500 | Aparece en nombre |
| Leyenda del Dojo | 5000 | Aparece en nombre |

### 🏅 **Badges**
| Nombre | Precio | Efecto |
|--------|--------|--------|
| Badge: Veterano | 2000 | Aparece en perfil |

### 🎨 **Colores de Rol**
| Nombre | Precio | Color |
|--------|--------|-------|
| Bronce | 3000 | #CD7F32 (marrón) |
| Plata | 5000 | #C0C0C0 (gris) |
| Oro | 10000 | #FFD700 (amarillo) |

---

## ❓ Preguntas Frecuentes

### **¿Puedo tener múltiples cosméticos del mismo tipo?**
No, solo uno por tipo. Si activas otro, el anterior se desactiva.

### **¿Puedo tener múltiples tipos activos?**
Sí, puedes tener activos simultáneamente:
- 1 Título
- 1 Badge
- 1 Color

### **¿Se me cobra cada vez que activo un cosmético?**
No, solo pagas una vez al comprar. Activar es gratis.

### **¿Puedo cambiar el cosmético activo?**
Sí, `/cosmetics usar tipo:[tipo]` te permite cambiar sin volver a comprar.

### **¿Qué pasa si desactivo?**
Se quita de tu perfil pero lo sigues teniendo en el inventario. Puedes reactivarlo cuando quieras.

### **¿Se elimina mi rol si desactivo?**
Sí, el rol se elimina automáticamente si no hay otros usuarios con ese rol.

### **¿Pierdo el cosmético si dejo el servidor?**
Se guarda en la base de datos de ese servidor. Si vuelves, lo recuperas.

---

## 🔧 Datos Técnicos

**Archivos modificados:**
- ✅ `utils/dataManager.js` - Métodos de cosméticos
- ✅ `commands/definitions.js` - Comando `/cosmetics`
- ✅ `index.js` - Handler del comando + modificación de `/perfil`

**Estructura en `users.json`:**
```json
{
  "activeCosmetics": {
    "titleId": "title_elite",
    "badgeId": "badge_veteran",
    "colorId": "color_role_gold"
  },
  "inventory": [
    { "itemId": "title_elite", "purchasedAt": 1234567890 }
  ]
}
```

---

## 📢 Comandos Rápidos

```
# Ver todos los cosméticos
/tienda ver categoria:Cosméticos

# Comprar uno
/tienda comprar item:title_elite

# Ver tus cosméticos
/cosmetics ver

# Activar uno
/cosmetics usar tipo:Títulos

# Desactivar
/cosmetics deseleccionar tipo:Títulos

# Ver perfil con cosméticos
/perfil
```

---

## ✨ Lo que hace Especial este Sistema

1. **Interfaz Interactiva** - Menús desplegables, no necesitas recordar IDs
2. **Automático** - Los roles se crean y asignan solos
3. **Flexible** - Puedes cambiar cosméticos sin recomprar
4. **Visual** - Los títulos aparecen en tu nombre, los colores en Discord
5. **Persistente** - Todo se guarda en la base de datos

---

¡Disfruta personalizando tu perfil! 🎨✨

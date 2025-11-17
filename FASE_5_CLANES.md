# FASE 5: Sistema de Clanes

## Descripcion General

La **Fase 5** implementa un sistema completo de clanes con jerarquia, niveles, gestion de miembros, invitaciones, y rankings. Los clanes permiten a los guerreros del dojo unirse bajo un mismo estandarte y competir por honor colectivo.

## Fecha de Implementacion

**2025-01-14**

---

## Nuevas Funcionalidades

### 1. Comando `/clan crear <nombre> <tag>` - Crear Clan

**Descripcion:** Permite a un guerrero de rango Daimyo o superior fundar un nuevo clan.

**Uso:**
```
/clan crear Guerreros del Alba GDA
/clan crear Sombras Nocturnas SOMBRA
```

**Requisitos:**
- Rango minimo: **Daimyo** (2,000+ honor)
- Costo: **5,000 koku**
- No estar en otro clan
- Nombre: 3-30 caracteres
- Tag: 2-5 caracteres (solo letras y numeros)

**Validaciones:**
- El nombre y tag deben ser unicos en el servidor
- El creador se convierte automaticamente en lider del clan
- El clan comienza en **Nivel 1 (Clan Ronin)** con maximo 5 miembros

**Ejemplo de Salida:**
```
[Embed: Clan Fundado]
Clan Guerreros del Alba [GDA] fundado exitosamente!
Costo: -5,000 koku
Eres el lider del clan.

Tag: [GDA]
Nivel: 1 - Clan Ronin
Miembros: 1/5
Honor Total: 2,500 puntos
Tu Balance: 3,200 koku
```

---

### 2. Comando `/clan info [nombre_clan]` - Informacion del Clan

**Descripcion:** Muestra informacion detallada de un clan especifico o tu clan actual.

**Uso:**
```
/clan info                    # Ver tu clan actual
/clan info Guerreros del Alba # Ver un clan especifico
/clan info GDA                # Buscar por tag tambien funciona
```

**Informacion Mostrada:**
- Nombre y tag del clan
- Nivel del clan (1-5)
- Lider del clan (con emoji de rango)
- Numero de miembros / maximo
- Honor total del clan
- Progreso hacia el siguiente nivel
- Fecha de fundacion
- Lista de miembros (top 10) con sus rangos y honor

**Ejemplo de Salida:**
```
[Embed: Guerreros del Alba [GDA]]
Nivel 2 - Clan Samurai

Lider: Daimyo JuanGuerrero
Miembros: 7/10
Honor Total: 8,500 puntos
Fundado: 10/01/2025
Progreso: 8,500/15,000 (56%)

Miembros del Clan:
Lider Daimyo JuanGuerrero - 2,500 honor
Samurai MariaKatana - 1,800 honor
Samurai PedroNinja - 1,200 honor
Ronin LuisSamurai - 900 honor
...
```

---

### 3. Comando `/clan unirse <nombre_clan>` - Unirse a un Clan

**Descripcion:** Permite unirse a un clan existente que tenga espacio disponible.

**Uso:**
```
/clan unirse Guerreros del Alba
/clan unirse GDA
```

**Validaciones:**
- No puedes estar en otro clan
- El clan debe existir en el servidor
- El clan no puede estar lleno (depende de su nivel)

**Flujo:**
1. Usuario ejecuta el comando
2. Bot verifica requisitos
3. Usuario es anadido al clan
4. Se actualiza el honor total del clan
5. Se notifica al lider del clan via DM

**Ejemplo:**
```
Usuario: /clan unirse GDA
Bot: Te has unido al clan Guerreros del Alba [GDA].

Lider del clan recibe DM:
Juan se ha unido al clan
Clan: Guerreros del Alba
```

---

### 4. Comando `/clan salir` - Salir del Clan

**Descripcion:** Abandona tu clan actual.

**Casos Especiales:**

**Caso 1: Lider con otros miembros**
- El bot solicita confirmacion
- Si confirmas, el liderazgo se transfiere al miembro con mas honor
- El nuevo lider recibe notificacion via DM

**Caso 2: Unico miembro (lider o no)**
- El clan se disuelve automaticamente

**Caso 3: Miembro normal**
- Sale del clan inmediatamente
- Se notifica al lider

**Ejemplo (Lider saliendo):**
```
Usuario: /clan salir
Bot: Eres el lider del clan. Si sales, el liderazgo se transferira al miembro con mas honor.
     [Confirmar Salida] [Cancelar]

Usuario: [Click Confirmar]
Bot: Has abandonado el clan Guerreros del Alba.

Nuevo lider recibe DM:
El liderazgo ha sido transferido a JuanGuerrero.
```

---

### 5. Comando `/clan miembros` - Lista de Miembros

**Descripcion:** Muestra todos los miembros de tu clan ordenados por honor.

**Uso:**
```
/clan miembros
```

**Informacion por Miembro:**
- Posicion en ranking interno
- Emoji de rango
- Nombre de usuario
- Honor total
- Koku total
- Badge de lider (si aplica)

**Ejemplo:**
```
[Embed: Miembros de Guerreros del Alba [GDA]]
Total: 7/10 miembros

1. Lider Daimyo JuanGuerrero
   2,500 honor | 12,000 koku

2. Samurai MariaKatana
   1,800 honor | 8,500 koku

3. Samurai PedroNinja
   1,200 honor | 6,200 koku

...
```

---

### 6. Comando `/clan top` - Ranking de Clanes

**Descripcion:** Muestra el top 10 de clanes del servidor con pestanas interactivas.

**Uso:**
```
/clan top
```

**Tipos de Rankings:**
- Honor Total (default)
- Numero de Miembros
- Nivel del Clan

**Caracteristicas:**
- Botones interactivos para cambiar criterio
- Medallas para top 3
- Muestra: tag, nombre, lider, miembros, honor, nivel
- Botones activos durante 2 minutos

**Ejemplo:**
```
[Embed: Top Clanes del Servidor]
Ordenado por: Honor Total

Medalla de Oro [WAR] Guerreros de Guerra
   Nivel 3 | 22,500 honor
   Lider: Shogun Commander | 15/15 miembros

Medalla de Plata [SHDW] Sombras Oscuras
   Nivel 2 | 18,000 honor
   Lider: Daimyo DarkNinja | 10/10 miembros

...

[Honor] [Miembros] [Nivel]
```

---

### 7. Comando `/clan invitar @usuario` - Invitar Miembros

**Descripcion:** El lider del clan puede invitar usuarios a unirse.

**Uso:**
```
/clan invitar @JuanGuerrero
```

**Requisitos:**
- Solo el lider puede invitar
- El usuario no debe estar en otro clan
- El clan no debe estar lleno
- El usuario no puede ser un bot

**Flujo:**
1. Lider ejecuta comando
2. Bot envia DM al usuario invitado con embed informativo
3. Usuario tiene 2 minutos para aceptar/rechazar
4. Si acepta: se une al clan automaticamente
5. Si rechaza o expira: invitacion cancelada
6. Lider recibe notificacion del resultado

**Ejemplo:**
```
Lider: /clan invitar @Maria
Bot: Invitacion enviada a Maria.

Maria recibe DM:
[Embed: Invitacion al Clan]
JuanGuerrero te ha invitado al clan Guerreros del Alba.

Tag: [GDA]
Nivel: 2 - Clan Samurai
Miembros: 7/10
Honor Total: 8,500 puntos

[Aceptar] [Rechazar]

Maria: [Click Aceptar]
Bot: Te has unido al clan Guerreros del Alba [GDA].

Lider recibe DM:
Maria ha aceptado la invitacion al clan Guerreros del Alba.
```

---

### 8. Comando `/clan expulsar @usuario` - Expulsar Miembros

**Descripcion:** El lider puede expulsar miembros del clan.

**Uso:**
```
/clan expulsar @PedroNinja
```

**Requisitos:**
- Solo el lider puede expulsar
- No puedes expulsarte a ti mismo (usa `/clan salir`)
- El usuario debe ser miembro del clan

**Flujo:**
1. Lider ejecuta comando
2. Bot solicita confirmacion (botones)
3. Si confirma: usuario es expulsado
4. Usuario expulsado recibe notificacion via DM
5. Timeout de confirmacion: 30 segundos

**Ejemplo:**
```
Lider: /clan expulsar @Pedro
Bot: Estas seguro de expulsar a Pedro del clan?
     [Confirmar Expulsion] [Cancelar]

Lider: [Click Confirmar]
Bot: Pedro ha sido expulsado del clan.

Pedro recibe DM:
Has sido expulsado del clan Guerreros del Alba.
```

---

## Sistema de Niveles de Clan

Los clanes suben de nivel segun su **honor total** (suma del honor de todos los miembros):

| Nivel | Nombre            | Honor Minimo | Maximo Miembros | Color    |
|-------|-------------------|--------------|-----------------|----------|
| 1     | Clan Ronin        | 0            | 5               | Gris     |
| 2     | Clan Samurai      | 5,000        | 10              | Azul     |
| 3     | Clan Daimyo       | 15,000       | 15              | Dorado   |
| 4     | Clan Shogun       | 30,000       | 20              | Rojo     |
| 5     | Clan Legendario   | 50,000+      | 25              | Purpura  |

**Calculo Automatico:**
- Cada vez que un miembro gana honor, el honor total del clan se recalcula
- Si el clan alcanza el honor necesario, sube de nivel automaticamente
- Subir de nivel aumenta el limite de miembros

**Integracion con Ganancia de Honor:**
- Ganar honor por mensajes actualiza `clan.totalHonor`
- Ganar honor por tiempo en voz actualiza `clan.totalHonor`
- Ganar honor por cualquier medio actualiza el clan

---

## Funciones Helper Creadas

### En `/utils/dataManager.js`:

1. **`updateClan(clanId, updates)`**
   - Actualiza datos de un clan

2. **`deleteClan(clanId)`**
   - Elimina un clan

3. **`addClanMember(clanId, userId)`**
   - Anade un usuario al clan

4. **`removeClanMember(clanId, userId)`**
   - Remueve un usuario del clan

5. **`getClanLevel(totalHonor)`**
   - Calcula el nivel del clan segun honor total
   - Retorna: `{ level, maxMembers, name, color, nextLevelHonor }`

6. **`updateClanStats(clanId)`**
   - Recalcula `totalHonor` sumando honor de todos los miembros
   - Actualiza `level` segun nuevo total
   - **Se llama automaticamente cada vez que un miembro gana honor**

7. **`canCreateClan(userId, guildId)`**
   - Verifica si el usuario cumple requisitos para crear un clan
   - Retorna: `{ canCreate: boolean, reason: string }`

8. **`transferClanLeadership(clanId, newLeaderId)`**
   - Transfiere el liderazgo del clan

9. **`disbandClan(clanId)`**
   - Disuelve el clan y actualiza todos los miembros

10. **`findClanByNameOrTag(guildId, nameOrTag)`**
    - Busca un clan por nombre o tag (case-insensitive)

11. **`clanNameOrTagExists(guildId, name, tag)`**
    - Verifica si ya existe un clan con ese nombre o tag

---

## Archivos Modificados

### 1. `/utils/dataManager.js`
**Cambios:** Anadidas 11 funciones helper de clanes
- Funciones de gestion de clanes
- Sistema de niveles de clan
- Validaciones de creacion de clanes
- Funciones de busqueda de clanes

### 2. `/src/config/emojis.js`
**Cambios:** Anadidos emojis de clanes
```javascript
CLAN_TAG: '📛',
CLAN_INFO: '📜',
CLAN_INVITE: '✉️',
CLAN_JOIN: '🚪',
CLAN_LEAVE: '🚶',
CLAN_KICK: '⚔️',
CLAN_LEVEL: '🎖️',
```

### 3. `/src/config/messages.js`
**Cambios:** Anadidos 25+ mensajes del sistema de clanes
- Mensajes de creacion de clan
- Mensajes de union/salida
- Mensajes de invitacion
- Mensajes de expulsion
- Mensajes de error y validacion

### 4. `/commands.js`
**Cambios:** Anadido comando `/clan` con 8 subcomandos
- `/clan crear` - Crear clan
- `/clan info` - Info del clan
- `/clan unirse` - Unirse a clan
- `/clan salir` - Salir del clan
- `/clan miembros` - Lista de miembros
- `/clan top` - Ranking de clanes
- `/clan invitar` - Invitar usuario
- `/clan expulsar` - Expulsar miembro

### 5. `/index.js`
**Cambios:**

**a) Actualizacion automatica de honor de clan (lineas ~235, ~273, ~369):**
```javascript
// Cuando un usuario gana honor, actualizar clan.totalHonor
if (userData.clanId) {
  dataManager.updateClanStats(userData.clanId);
}
```

**b) Handler `/clan` (lineas ~2587-3297):**
- 8 subcomandos implementados
- Sistema de confirmaciones con botones
- Validaciones completas
- Notificaciones via DM
- Embeds informativos
- Collectors para interacciones

**c) Comando `/honor` actualizado (lineas ~1940-1953):**
- Muestra informacion del clan si el usuario pertenece a uno
- Incluye tag, nombre, nivel, miembros

---

## Datos Persistidos

### Estructura de Clan en `/data/clans.json`:

```json
{
  "guildId_timestamp": {
    "clanId": "guildId_1736889600000",
    "name": "Guerreros del Alba",
    "tag": "GDA",
    "leaderId": "123456789",
    "guildId": "987654321",
    "members": ["123456789", "987654322", "987654323"],
    "totalHonor": 8500,
    "level": 2,
    "createdAt": "2025-01-10T12:00:00.000Z"
  }
}
```

### Estructura de Usuario Actualizada:

```json
{
  "guildId_userId": {
    "userId": "123456789",
    "guildId": "987654321",
    "honor": 2500,
    "rank": "Daimyo",
    "koku": 12000,
    "lastDailyClaim": 1736889600000,
    "dailyStreak": 7,
    "clanId": "guildId_1736889600000",
    "warnings": [],
    "createdAt": "2025-01-10T12:00:00.000Z",
    "stats": {
      "messagesCount": 150,
      "voiceMinutes": 320,
      "duelsWon": 0,
      "duelsLost": 0,
      "commandsUsed": 25
    }
  }
}
```

**Auto-guardado:** Cada 5 minutos automaticamente.

---

## Consideraciones Importantes

### Sistema de Liderazgo
- Solo un lider por clan
- El lider tiene permisos exclusivos: invitar, expulsar
- Cuando el lider sale, el liderazgo se transfiere al miembro con mas honor
- Si el lider es el unico miembro, el clan se disuelve

### Limites de Clanes
- **Por servidor:** Ilimitados (cada servidor puede tener multiples clanes)
- **Por usuario:** Maximo 1 clan a la vez
- **Miembros por clan:** Depende del nivel (5-25)

### Recalculo de Stats
El sistema recalcula automaticamente:
- **Honor total del clan:** Cada vez que un miembro gana honor
- **Nivel del clan:** Cada vez que se actualiza totalHonor
- **Limite de miembros:** Cada vez que cambia el nivel

### Sistema de Invitaciones
- Invitaciones enviadas via **DM** al usuario
- Timeout de **2 minutos** para responder
- Si el usuario no tiene DMs abiertos, la invitacion falla
- Botones interactivos para aceptar/rechazar
- Notificaciones al lider del resultado

### Validaciones de Tag
- **2-5 caracteres**
- **Solo letras y numeros** (A-Z, 0-9)
- **Automaticamente en mayusculas**
- **Unico por servidor**

Ejemplos validos: `WAR`, `GDA`, `NINJA`, `SHDW`, `FIRE`

Ejemplos invalidos: `W`, `WARRIOR123` (muy largo), `WAR!`, `wa r` (espacios)

---

## Testing Checklist

Antes de desplegar, verificar:

### Comando `/clan crear`
- [ ] Crear clan siendo Ronin (debe rechazar)
- [ ] Crear clan siendo Daimyo sin koku suficiente (debe rechazar)
- [ ] Crear clan siendo Daimyo con 5000+ koku (debe funcionar)
- [ ] Crear clan con nombre muy corto (< 3 caracteres)
- [ ] Crear clan con tag invalido (espacios, simbolos)
- [ ] Crear clan con nombre/tag que ya existe
- [ ] Verificar que el costo de 5000 koku se deduce
- [ ] Verificar que el usuario se une automaticamente al clan
- [ ] Verificar que clan.totalHonor se calcula correctamente

### Comando `/clan info`
- [ ] Ver info de clan sin estar en uno (debe rechazar)
- [ ] Ver info de tu clan actual
- [ ] Ver info de otro clan por nombre
- [ ] Ver info de clan por tag
- [ ] Verificar que muestra hasta 10 miembros
- [ ] Verificar que muestra lider con badge
- [ ] Verificar calculo de progreso a siguiente nivel

### Comando `/clan unirse`
- [ ] Unirse a clan estando en otro (debe rechazar)
- [ ] Unirse a clan que no existe (debe rechazar)
- [ ] Unirse a clan lleno (debe rechazar)
- [ ] Unirse a clan con espacio disponible (debe funcionar)
- [ ] Verificar que se actualiza clan.totalHonor
- [ ] Verificar notificacion al lider via DM

### Comando `/clan salir`
- [ ] Salir sin estar en clan (debe rechazar)
- [ ] Salir siendo lider con otros miembros (confirmacion)
- [ ] Salir siendo lider unico (disuelve clan)
- [ ] Salir siendo miembro normal (sale inmediatamente)
- [ ] Verificar transferencia de liderazgo al miembro con mas honor
- [ ] Verificar notificacion al nuevo lider
- [ ] Verificar que se actualiza clan.totalHonor

### Comando `/clan miembros`
- [ ] Ver miembros sin estar en clan (debe rechazar)
- [ ] Ver miembros de tu clan
- [ ] Verificar orden por honor (mayor a menor)
- [ ] Verificar badge de lider
- [ ] Verificar muestra honor y koku de cada miembro

### Comando `/clan top`
- [ ] Ver ranking sin clanes en servidor (mensaje informativo)
- [ ] Ver ranking con clanes existentes
- [ ] Cambiar a ranking por miembros (boton)
- [ ] Cambiar a ranking por nivel (boton)
- [ ] Verificar medallas para top 3
- [ ] Verificar timeout de botones (2 minutos)
- [ ] Verificar que solo el autor puede usar botones

### Comando `/clan invitar`
- [ ] Invitar sin estar en clan (debe rechazar)
- [ ] Invitar siendo miembro normal (debe rechazar - solo lider)
- [ ] Invitar a un bot (debe rechazar)
- [ ] Invitar a usuario en otro clan (debe rechazar)
- [ ] Invitar a clan lleno (debe rechazar)
- [ ] Invitar exitosamente (usuario recibe DM)
- [ ] Aceptar invitacion (se une al clan)
- [ ] Rechazar invitacion (no se une)
- [ ] Timeout de invitacion (2 minutos)
- [ ] Verificar notificacion al lider del resultado

### Comando `/clan expulsar`
- [ ] Expulsar sin estar en clan (debe rechazar)
- [ ] Expulsar siendo miembro normal (debe rechazar - solo lider)
- [ ] Expulsar a ti mismo (debe rechazar)
- [ ] Expulsar a usuario no miembro (debe rechazar)
- [ ] Expulsar exitosamente con confirmacion
- [ ] Cancelar expulsion
- [ ] Timeout de confirmacion (30 segundos)
- [ ] Verificar notificacion al usuario expulsado
- [ ] Verificar que se actualiza clan.totalHonor

### Sistema de Niveles
- [ ] Crear clan nivel 1 (0 honor)
- [ ] Subir a nivel 2 (5000+ honor total)
- [ ] Subir a nivel 3 (15000+ honor total)
- [ ] Subir a nivel 4 (30000+ honor total)
- [ ] Subir a nivel 5 (50000+ honor total)
- [ ] Verificar cambio de limite de miembros por nivel

### Integracion con Honor
- [ ] Ganar honor por mensaje actualiza clan.totalHonor
- [ ] Ganar honor por voz actualiza clan.totalHonor
- [ ] Comando `/honor` muestra info del clan
- [ ] Badge de lider en `/honor`

### Persistencia
- [ ] Datos guardados en `data/clans.json`
- [ ] `clanId` guardado en `user.clanId`
- [ ] Auto-guardado cada 5 minutos funciona
- [ ] Reiniciar bot y verificar que clanes persisten
- [ ] Graceful shutdown guarda todos los datos

---

## Comandos de Testing Rapido

```bash
# Iniciar bot
npm start

# En Discord:
/clan crear Mi Clan CLAN        # Crear clan (requiere Daimyo + 5000 koku)
/clan info                       # Ver tu clan
/clan info Mi Clan               # Ver otro clan
/clan unirse CLAN                # Unirse a clan
/clan miembros                   # Ver miembros
/clan top                        # Ranking de clanes
/clan invitar @usuario           # Invitar (solo lider)
/clan expulsar @usuario          # Expulsar (solo lider)
/clan salir                      # Salir del clan
/honor                           # Ver honor (ahora muestra clan)

# Comandos anteriores (siguen funcionando):
/daily, /balance, /pay, /leaderboard, /top, /rango
```

---

## Notas para Futuras Fases

### Posibles Mejoras (Fase 6+)
- Guerras de Clanes con apuestas de honor
- Tesoreria compartida de clan (koku colectivo)
- Sistema de roles dentro del clan (oficiales, etc)
- Emblemas/banners personalizables
- Territorios o regiones reclamables
- Eventos exclusivos para clanes de alto nivel
- Alianzas entre clanes
- Chat privado de clan
- Misiones de clan con recompensas compartidas
- Log de actividad del clan

### Consideraciones Tecnicas
- Sistema de clanes escalable (facil anadir nuevas features)
- DataManager ya soporta todos los campos necesarios
- Arquitectura modular (facil anadir subcomandos)
- Sistema de confirmacion reutilizable (botones)
- Integracion completa con sistema de honor
- Recalculo automatico de stats

---

## Conclusion

La **Fase 5** implementa un sistema de clanes completo y funcional con:
- 8 comandos de gestion de clanes
- Sistema de niveles de clan (1-5)
- Jerarquia de liderazgo
- Invitaciones con confirmacion
- Expulsion de miembros
- Rankings de clanes interactivos
- Integracion total con sistema de honor
- Actualizacion automatica de honor total del clan
- Persistencia completa en JSON

**Estado:** **Completado y funcional**

**Proxima Fase:** Fase 6 - Guerras de Clanes / Sistema de Duelos / Tienda de Items

---

**Autor:** SamuraiBot Architect
**Fecha:** 2025-01-14
**Version del Bot:** 1.5.0 (Fase 5 - Clanes)
**Total de Comandos:** 25 comandos slash

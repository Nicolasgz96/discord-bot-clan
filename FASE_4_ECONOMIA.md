# FASE 4: Sistema de Economía y Recompensas Diarias

## Descripción General

La **Fase 4** implementa un sistema completo de economía con la moneda **koku** (moneda histórica japonesa), recompensas diarias con sistema de rachas (streaks), transferencias entre usuarios, y leaderboards interactivos.

## Fecha de Implementación

**2025-01-14**

---

## Nuevas Funcionalidades

### 1. Comando `/daily` - Recompensa Diaria

**Descripción:** Permite reclamar una recompensa diaria de koku una vez cada 24 horas.

**Uso:**
```
/daily
```

**Características:**
- ✅ Solo se puede reclamar **1 vez cada 24 horas**
- 🔥 Sistema de **rachas (streaks)**: reclamar días consecutivos aumenta la recompensa
- 👑 **Multiplicador de rango**: rangos superiores reciben más koku
- 📊 **Bonos progresivos** por rachas largas

**Cálculo de Recompensa:**
```
Recompensa Total = Base (100 koku) × Multiplicador de Rango × (1 + Bonus de Racha)
```

**Multiplicadores de Rango:**
| Rango   | Multiplicador | Recompensa Base |
|---------|--------------|-----------------|
| Ronin   | 1x           | 100 koku        |
| Samurai | 1.5x         | 150 koku        |
| Daimyo  | 2x           | 200 koku        |
| Shogun  | 3x           | 300 koku        |

**Bonos de Racha:**
| Días Consecutivos | Bonus    | Ejemplo (Ronin) |
|-------------------|----------|-----------------|
| 1-6 días          | +0%      | 100 koku        |
| 7-13 días         | +50%     | 150 koku        |
| 14-29 días        | +100%    | 200 koku        |
| 30-89 días        | +200%    | 300 koku        |
| 90+ días          | +400%    | 500 koku        |

**Lógica de Rachas:**
- Si reclamas **dentro de 24-48 horas** desde el último claim → racha continúa (+1 día)
- Si pasaron **más de 48 horas** → racha se reinicia a 1 día
- Mensajes especiales en **milestones** (7, 14, 30, 90 días)

**Ejemplo de Uso:**
```
Usuario: /daily
Bot: [Embed mostrando]
     💰 Koku Ganado: +150 koku
     🔥 Racha: 7 días
     🏦 Balance Total: 1,250 koku

     Detalles:
     💰 Base: 100 koku
     ⚔️ Multiplicador de rango (Samurai): x1.5
     🔥 Bonus de racha: +0%
```

---

### 2. Comando `/balance` (o `/bal`) - Consultar Balance

**Descripción:** Muestra el balance completo de koku, honor, racha y próximo daily del usuario.

**Uso:**
```
/balance
/bal
```

**Información Mostrada:**
- 💰 **Koku:** Cantidad total de moneda
- ⭐ **Honor:** Puntos de honor actuales
- ⚔️ **Rango:** Rango samurai actual
- 🔥 **Racha Diaria:** Días consecutivos reclamados
- 📅 **Próximo Daily:** Tiempo restante hasta poder reclamar de nuevo

**Ejemplo de Salida:**
```
[Embed: Balance de Usuario]
💰 Koku: 1,250 koku
⭐ Honor: 850 puntos
⚔️ Rango: Samurai
🔥 Racha Diaria: 7 días
📅 Próximo Daily: En 12h 35m
```

---

### 3. Comando `/pay` (o `/pagar`) - Transferir Koku

**Descripción:** Transfiere koku a otro guerrero del dojo.

**Uso:**
```
/pay @usuario 100
/pagar @usuario 500
```

**Parámetros:**
- `usuario` (requerido): Usuario que recibirá el koku
- `cantidad` (requerido): Cantidad de koku a transferir (min: 10, max: 10,000)

**Validaciones:**
- ❌ No puedes pagarte a ti mismo
- ❌ No puedes pagar a bots
- ❌ Cantidad mínima: 10 koku
- ❌ Cantidad máxima: 10,000 koku por transacción
- ❌ Debes tener saldo suficiente

**Flujo de Confirmación:**
1. Usuario ejecuta `/pay @usuario 100`
2. Bot muestra botones de confirmación (✅ Confirmar / ❌ Cancelar)
3. Usuario tiene 30 segundos para confirmar
4. Si confirma:
   - Se descuenta koku del remitente
   - Se añade koku al receptor
   - Bot intenta enviar DM al receptor notificándole
   - Si falla DM, envía notificación pública en el canal

**Ejemplo:**
```
Usuario: /pay @Guerrero 250
Bot: ⚠️ ¿Estás seguro de transferir 250 koku a Guerrero?
     [✅ Confirmar] [❌ Cancelar]

Usuario: [Click ✅ Confirmar]
Bot: 💸 Has transferido 250 koku a Guerrero.

Guerrero recibe DM:
💰 Has recibido 250 koku de Usuario.
ℹ️ En el servidor: Mi Dojo Samurai
```

---

### 4. Comando `/leaderboard` (o `/lb`) - Rankings del Dojo

**Descripción:** Muestra rankings interactivos con pestañas para Honor, Koku y Rachas.

**Uso:**
```
/leaderboard
/lb
```

**Tipos de Rankings:**
- 🏆 **Honor:** Top 10 guerreros por puntos de honor
- 💰 **Koku:** Top 10 guerreros por riqueza (koku)
- 🔥 **Rachas:** Top 10 guerreros por racha diaria consecutiva

**Características:**
- ✨ **Botones interactivos** para cambiar entre rankings
- 🥇🥈🥉 **Medallas** para top 3
- ➤ **Resaltado** de tu posición en el ranking
- 📊 **Posición personal** mostrada si estás fuera del top 10
- ⏱️ Botones activos durante **2 minutos**, luego se desactivan

**Ejemplo de Uso:**
```
Usuario: /lb
Bot: [Embed: Ranking de Honor del Dojo]
     🥇 ⚔️ Usuario1 - 5,200 honor
     🥈 ⚔️ Usuario2 - 3,800 honor
     🥉 👑 Usuario3 - 2,100 honor
     ...

     [🏆 Honor] [💰 Koku] [🔥 Rachas]

Usuario: [Click 💰 Koku]
Bot: [Embed: Ranking de Riqueza del Dojo]
     🥇 🏯 Usuario4 - 15,000 koku
     🥈 ⚔️ Usuario5 - 12,500 koku
     ...
```

---

## Ganancia Pasiva de Koku

Los usuarios ganan koku automáticamente por participar en el servidor:

### Por Mensajes
- **Ganancia:** +2 koku por mensaje
- **Cooldown:** 1 minuto (igual que el sistema de honor)
- **También ganan:** +5 honor simultáneamente

### Por Tiempo en Voz
- **Ganancia al salir:** ~0.5 koku por minuto (5 koku cada 10 minutos)
- **Ganancia activa:** +5 koku cada 10 minutos mientras está conectado
- **También ganan:** +1 honor por minuto + 10 honor cada 10 minutos

**Ejemplo:**
- Usuario envía 10 mensajes en 10 minutos → +20 koku + 50 honor
- Usuario está 30 minutos en voz → ~15 koku (salir) + 15 koku (bonos activos) + 30 honor

---

## Archivos Modificados

### 1. `/src/config/emojis.js`
**Cambios:** Añadidos emojis de economía
```javascript
KOKU: '💰',
WEALTH: '💎',
DAILY: '📅',
PAYMENT: '💸',
BANK: '🏦',
CHART: '📊',
CALENDAR: '🗓️',
```

### 2. `/src/config/messages.js`
**Cambios:** Añadidos mensajes del sistema de economía
- `ECONOMY.DAILY_CLAIMED(koku, streak)`
- `ECONOMY.DAILY_ALREADY_CLAIMED(timeLeft)`
- `ECONOMY.PAYMENT_SUCCESS(amount, recipient)`
- `ECONOMY.INSUFFICIENT_KOKU(required, current)`
- `ECONOMY.LEADERBOARD_HONOR/KOKU/STREAK`
- Y más...

### 3. `/commands.js`
**Cambios:** Añadidos 8 nuevos comandos slash
- `/daily` - Reclamar recompensa diaria
- `/balance` - Ver balance
- `/bal` - Alias de balance
- `/pay` - Transferir koku
- `/pagar` - Alias de pay
- `/leaderboard` - Ver rankings
- `/lb` - Alias de leaderboard

### 4. `/index.js`
**Cambios:**

**a) Sistema de Ganancia Pasiva (líneas ~338-357):**
```javascript
// Ganar +5 honor y +2 koku por mensaje
const userData = dataManager.addHonor(userId, guildId, 5);
userData.koku = (userData.koku || 0) + 2;
```

**b) Sistema de Voz (líneas ~220-275):**
```javascript
// Otorgar honor y koku por tiempo en voz
const honorToGrant = totalMinutes * 1;
const kokuToGrant = Math.floor(totalMinutes / 2);
userData.koku = (userData.koku || 0) + kokuToGrant;

// Bonus cada 10 minutos
userData.koku = (userData.koku || 0) + 5;
```

**c) Handlers de Comandos (líneas ~2117-2572):**
- Handler `/daily` (líneas 2117-2234)
- Handler `/balance` (líneas 2236-2304)
- Handler `/pay` (líneas 2306-2414)
- Handler `/leaderboard` (líneas 2416-2572)

### 5. `/utils/dataManager.js`
**Sin cambios** - Ya tenía soporte para `koku`, `lastDailyClaim`, `dailyStreak` desde Fase 2.

---

## Datos Persistidos

Toda la información se guarda en `/data/users.json`:

```json
{
  "guildId_userId": {
    "userId": "123456789",
    "guildId": "987654321",
    "honor": 850,
    "rank": "Samurai",
    "koku": 1250,
    "lastDailyClaim": 1736889600000,
    "dailyStreak": 7,
    "clanId": null,
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

**Auto-guardado:** Cada 5 minutos automáticamente (sin pérdida de datos).

---

## Consideraciones Importantes

### Sistema de Rachas (Streaks)
- **Ventana de reclamación:** 24-48 horas
- **Lógica:**
  - Si `lastDailyClaim` es `null` → primer claim, streak = 1
  - Si han pasado < 48 horas → streak += 1
  - Si han pasado ≥ 48 horas → streak = 1 (se perdió)
- **Guardado:** Se actualiza `lastDailyClaim` y `dailyStreak` inmediatamente

### Transferencias de Koku
- **Límites:** Mín 10, Máx 10,000 koku por transacción
- **Confirmación:** Botones interactivos con timeout de 30 segundos
- **Notificación:** DM al receptor (si falla, notificación pública)
- **Atomicidad:** La transacción se completa o se cancela (no hay estados intermedios)

### Leaderboards Interactivos
- **Collector timeout:** 2 minutos
- **Botones deshabilitados** después del timeout
- **Solo el autor** puede usar los botones de su leaderboard
- **Caché de usuarios:** Se cachean para evitar fetch excesivo

---

## Testing Checklist

Antes de desplegar, verificar:

### Comando `/daily`
- [ ] Reclamar daily por primera vez (streak = 1)
- [ ] Reclamar daily dentro de 24 horas (debe rechazar)
- [ ] Reclamar daily después de 24-48 horas (streak += 1)
- [ ] Reclamar daily después de 48+ horas (streak = 1)
- [ ] Verificar multiplicadores de rango (Ronin, Samurai, Daimyo, Shogun)
- [ ] Verificar bonos de racha (7, 14, 30, 90 días)
- [ ] Verificar milestones especiales (mensajes de logro)
- [ ] Verificar cálculo correcto de tiempo restante

### Comando `/balance`
- [ ] Mostrar balance de usuario nuevo (0 koku, 0 honor)
- [ ] Mostrar balance de usuario con datos
- [ ] Verificar cálculo de tiempo hasta próximo daily
- [ ] Verificar formato "Disponible ahora" cuando ya puede reclamar

### Comando `/pay`
- [ ] Intentar pagarse a sí mismo (debe rechazar)
- [ ] Intentar pagar a un bot (debe rechazar)
- [ ] Intentar pagar menos de 10 koku (debe rechazar)
- [ ] Intentar pagar más de 10,000 koku (debe rechazar)
- [ ] Intentar pagar sin saldo suficiente (debe rechazar)
- [ ] Pago exitoso con confirmación
- [ ] Pago cancelado
- [ ] Timeout de confirmación (30 segundos)
- [ ] Notificación DM al receptor
- [ ] Notificación pública si falla DM

### Comando `/leaderboard`
- [ ] Ver ranking de honor (por defecto)
- [ ] Cambiar a ranking de koku
- [ ] Cambiar a ranking de rachas
- [ ] Verificar medallas top 3 (🥇🥈🥉)
- [ ] Verificar resaltado de posición propia
- [ ] Verificar posición fuera del top 10
- [ ] Verificar que solo el autor pueda usar los botones
- [ ] Verificar timeout de 2 minutos (botones deshabilitados)

### Ganancia Pasiva
- [ ] Enviar mensaje → +5 honor + 2 koku
- [ ] Cooldown de 1 minuto para mensajes
- [ ] Entrar a voz y salir después de 10 minutos → verificar koku ganado
- [ ] Estar 30 minutos en voz → verificar bonus cada 10 minutos
- [ ] Salir de voz → verificar cálculo total de koku

### Persistencia
- [ ] Datos guardados en `data/users.json` correctamente
- [ ] Auto-guardado cada 5 minutos funciona
- [ ] Reiniciar bot y verificar que datos persisten
- [ ] Graceful shutdown guarda todos los datos

---

## Comandos de Testing Rápido

```bash
# Iniciar bot
npm start

# En Discord:
/daily              # Reclamar daily
/balance            # Ver balance
/pay @usuario 100   # Transferir koku
/leaderboard        # Ver rankings

# Comandos antiguos (siguen funcionando):
/honor              # Ver honor
/rango              # Ver rango
/top                # Top honor (ahora duplicado en /lb)
```

---

## Notas para Futuras Fases

### Posibles Mejoras (Fase 5+)
- 🏪 **Tienda de Items:** Comprar items con koku
- ⚔️ **Sistema de Duelos:** Apostar koku en duelos
- 🎯 **Misiones/Quests:** Ganar koku por completar tareas
- 🎲 **Gacha/Casino:** Sistema de azar con koku
- 🏛️ **Clan Treasury:** Tesorería compartida de clanes
- 📈 **Inversiones:** Sistema de intereses/bancos
- 🎁 **Eventos Especiales:** Bonos de koku en eventos

### Consideraciones Técnicas
- ✅ Sistema de economía escalable (fácil añadir nuevos usos de koku)
- ✅ DataManager ya soporta todos los campos necesarios
- ✅ Arquitectura modular (fácil añadir comandos)
- ✅ Sistema de confirmación reutilizable (botones)
- ✅ Leaderboards genéricos (fácil añadir nuevos rankings)

---

## Conclusión

La **Fase 4** implementa un sistema de economía completo y funcional con:
- ✅ Recompensas diarias con rachas
- ✅ Sistema de moneda (koku) persistente
- ✅ Transferencias entre usuarios
- ✅ Rankings interactivos
- ✅ Ganancia pasiva por actividad
- ✅ Integración completa con sistema de honor

**Estado:** ✅ **Completado y funcional**

**Próxima Fase:** Fase 5 - Sistema de Clanes (creación, gestión, guerras de clanes)

---

**Autor:** SamuraiBot Architect
**Fecha:** 2025-01-14
**Versión del Bot:** 1.4.0 (Fase 4 - Economía)

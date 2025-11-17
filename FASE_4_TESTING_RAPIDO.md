# ⚡ Testing Rápido - Fase 4: Sistema de Economía

## 💰 Comandos Nuevos Disponibles

### Slash Commands:
- `/daily` 📅 - Reclamar recompensa diaria de koku
- `/balance` o `/bal` 💰 - Ver tu balance de koku y honor
- `/pay @usuario cantidad` 💸 - Transferir koku a otro usuario
- `/leaderboard` o `/lb` 📊 - Rankings de honor, koku y rachas

### Text Commands:
- `!daily`, `!balance`, `!pay @usuario cantidad`, `!leaderboard`

---

## 🧪 Test Rápido (5 minutos)

### 1. Iniciar el Bot

```bash
npm start
```

✅ Verifica que veas:
```
✅ Bot en línea como DemonHunter OFICIAL#XXXX
✅ Sistema de datos inicializado correctamente
```

---

### 2. Test de `/daily` - Recompensa Diaria

En Discord, escribe:
```
/daily
```

**Primera vez (Resultado esperado):**
- ✅ Embed mostrando koku ganado
- ✅ Racha actual: 1 día
- ✅ Koku recibido según tu rango:
  - Ronin: 100 koku
  - Samurai: 150 koku
  - Daimyo: 200 koku
  - Shogun: 300 koku
- ✅ Próxima reclamación en 24 horas

**Inmediatamente después, intenta `/daily` de nuevo:**

**Resultado esperado:**
- ❌ Mensaje de error: "Ya reclamaste tu recompensa diaria"
- ✅ Muestra tiempo restante: "Vuelve en 23 horas y 59 minutos"

---

### 3. Test de `/balance` - Ver Balance

Escribe:
```
/balance
```

o el alias:
```
/bal
```

**Resultado esperado:**
- ✅ Embed mostrando:
  - 💰 Koku total (100+ según tu rango)
  - ⭐ Honor total
  - 🥷 Rango actual
  - 🔥 Racha diaria: 1 día
  - ⏰ Próximo daily disponible en: ~24 horas
  - 📊 Estadísticas (mensajes, voz)

---

### 4. Test de Ganancia Pasiva de Koku

#### Por Mensajes:

1. Envía un mensaje normal: `Hola mundo`
2. Espera **1 minuto** (cooldown)
3. Usa `/balance`

**Resultado esperado:**
- ✅ Koku debe incrementar en +2
- ✅ Honor debe incrementar en +5
- ✅ Contador de mensajes +1

#### Por Voz:

1. Únete a un canal de voz
2. Espera **10 minutos completos**
3. Sal del canal
4. Usa `/balance`

**Resultado esperado:**
- ✅ Koku debe incrementar en ~5-10
- ✅ Honor debe incrementar en +20 (10 por minuto + bonus)
- ✅ Minutos en voz: 10

---

### 5. Test de `/pay` - Transferir Koku

**Prerequisito:** Necesitas otro usuario en el servidor

Escribe:
```
/pay @usuario 50
```

**Resultado esperado:**
- ✅ Mensaje de confirmación con botones
- ✅ Muestra: "¿Transferir 50 koku a @usuario?"
- ✅ Botones: ✅ Confirmar / ❌ Cancelar

**Haz clic en ✅ Confirmar:**

**Resultado esperado:**
- ✅ Tu koku disminuye en 50
- ✅ Koku del receptor aumenta en 50
- ✅ Mensaje de confirmación: "Transferencia completada"
- ✅ Notificación DM al receptor (si es posible)

**Errores a Probar:**

1. Intenta pagar más koku del que tienes:
   ```
   /pay @usuario 999999
   ```
   ❌ Debe rechazar: "No tienes suficiente koku"

2. Intenta pagar menos de 10 koku:
   ```
   /pay @usuario 5
   ```
   ❌ Debe rechazar: "Mínimo 10 koku"

3. Intenta pagarte a ti mismo:
   ```
   /pay @tunombre 50
   ```
   ❌ Debe rechazar: "No puedes pagarte a ti mismo"

---

### 6. Test de `/leaderboard` - Rankings

Escribe:
```
/leaderboard
```

o el alias:
```
/lb
```

**Resultado esperado:**
- ✅ Embed mostrando top 10 por Honor (por defecto)
- ✅ Botones: 🏆 Honor | 💰 Koku | 🔥 Rachas
- ✅ Tu posición resaltada con 👉
- ✅ Medallas 🥇🥈🥉 para top 3

**Haz clic en botón "💰 Koku":**

**Resultado esperado:**
- ✅ Cambia a ranking de Koku
- ✅ Muestra top 10 usuarios con más koku
- ✅ Botón activo visualmente diferente

**Haz clic en botón "🔥 Rachas":**

**Resultado esperado:**
- ✅ Cambia a ranking de rachas diarias
- ✅ Muestra usuarios con más días consecutivos
- ✅ Botón activo visualmente diferente

**Espera 2 minutos:**

**Resultado esperado:**
- ✅ Los botones se desactivan automáticamente
- ✅ Mensaje: "Esta interacción ha expirado"

---

### 7. Test de Sistema de Rachas (Streaks)

**Día 1:**
1. Usa `/daily` (primera vez)
2. Verifica: Racha = 1 día, Koku = 100 (Ronin)

**Día 2 (24 horas después):**
1. Usa `/daily` de nuevo
2. **Resultado esperado:**
   - ✅ Racha = 2 días
   - ✅ Koku ganado = 100 (sin bonus aún)

**Día 7:**
1. Usa `/daily`
2. **Resultado esperado:**
   - ✅ Racha = 7 días
   - ✅ Koku ganado = 150 (100 base + 50% bonus)

**Día 30:**
1. Usa `/daily`
2. **Resultado esperado:**
   - ✅ Racha = 30 días
   - ✅ Koku ganado = 300 (100 base + 200% bonus)

**Si pierdes un día (48+ horas sin reclamar):**
1. Espera más de 48 horas
2. Usa `/daily`
3. **Resultado esperado:**
   - ⚠️ Racha = 1 día (reset)
   - ✅ Mensaje advirtiendo que perdiste la racha

---

### 8. Test de Multiplicadores por Rango

**Para probar esto necesitas tener diferentes rangos:**

**Ronin (0-499 honor):**
- Daily base: 100 koku

**Samurai (500-1999 honor):**
- Daily base: 150 koku (1.5x)

**Daimyo (2000-4999 honor):**
- Daily base: 200 koku (2x)

**Shogun (5000+ honor):**
- Daily base: 300 koku (3x)

**Ejemplo combinado (Shogun + 30 días streak):**
- Base: 300 koku
- Bonus racha: +200% (x3)
- Total: 900 koku 💰

---

## 📊 Sistema de Economía Completo

### Ganancia de Koku:

| Actividad | Koku Ganado | Cooldown |
|-----------|-------------|----------|
| Mensaje enviado | +2 koku | 1 minuto |
| 10 min en voz | +5 koku | Ninguno |
| Daily claim (Ronin) | +100 koku | 24 horas |
| Daily claim (Shogun) | +300 koku | 24 horas |
| Daily 30 días (Ronin) | +300 koku | 24 horas |
| Daily 30 días (Shogun) | +900 koku | 24 horas |

### Usos de Koku (Actuales):

- ✅ Transferir a otros usuarios (`/pay`)
- ✅ Competir en leaderboard de koku
- 🔜 Tienda de items (Fase futura)
- 🔜 Apuestas en duelos (Fase futura)
- 🔜 Mejoras de clan (Fase futura)

---

## ✅ Checklist de Testing Completo

- [ ] Bot inicia sin errores
- [ ] `/daily` - Primer reclamo funciona
- [ ] `/daily` - Cooldown de 24h funciona
- [ ] `/balance` - Muestra koku y honor correctamente
- [ ] `/balance` - Muestra racha diaria
- [ ] `/pay` - Transferencia exitosa
- [ ] `/pay` - Validaciones funcionan (mínimo, saldo, etc)
- [ ] `/pay` - Botones de confirmación funcionan
- [ ] `/leaderboard` - Muestra ranking de honor
- [ ] `/lb` - Cambia a ranking de koku
- [ ] `/lb` - Cambia a ranking de rachas
- [ ] `/lb` - Botones se desactivan después de 2 min
- [ ] Ganancia pasiva por mensajes (+2 koku)
- [ ] Ganancia pasiva por voz (+5 koku cada 10 min)
- [ ] Sistema de rachas funciona (incrementa día a día)
- [ ] Sistema de rachas resetea si pierdes un día
- [ ] Multiplicadores por rango funcionan
- [ ] Bonos de racha funcionan (7, 14, 30, 90 días)
- [ ] Datos persisten al reiniciar bot
- [ ] Versiones de texto (`!daily`, `!balance`, etc) funcionan

---

## 🐛 Troubleshooting

### "/daily no aparece en Discord"
- Espera 5-10 minutos después de registrar
- Reinicia Discord (Ctrl+R)
- Verifica: `node register-commands.js` ejecutado

### "No puedo reclamar daily después de 24 horas"
- Verifica tu zona horaria
- El cooldown es exacto: 24h = 86400000 ms
- Usa `/balance` para ver tiempo exacto restante

### "No gano koku por mensajes"
- Espera 1 minuto entre mensajes (mismo cooldown que honor)
- No uses comandos (! o /)
- Revisa consola del bot

### "Racha se resetea incorrectamente"
- Lógica: <24h = no puedes reclamar, 24-48h = racha +1, >48h = racha reset
- Si reclamas exactamente en 24h, racha continúa

### "Transferencia de koku no funciona"
- Verifica que tienes suficiente koku
- Mínimo: 10 koku, Máximo: 10,000 koku
- No puedes pagarte a ti mismo
- No puedes pagar a bots

---

## 📚 Documentación Completa

Para información detallada:
- **`FASE_4_ECONOMIA.md`** - Documentación completa (447 líneas)
  - Sistema de economía explicado
  - Todos los comandos con ejemplos
  - Fórmulas de cálculo de recompensas
  - Roadmap de futuras features

---

## 🎯 Próximas Fases

Con el sistema de economía funcionando, las próximas fases pueden incluir:

- **Fase 5:** Sistema de Clanes (crear, unirse, guerra de clanes)
- **Fase 6:** Sistema de Duelos (desafiar, apostar koku)
- **Fase 7:** Tienda (comprar items, roles, mejoras con koku)

---

**Creado:** 2025-01-13
**Fase:** 4 - Sistema de Economía y Recompensas Diarias
**Comandos nuevos:** 7 slash commands (4 únicos + 3 aliases)
**Sistema de economía:** Koku, daily rewards, streaks, transfers, leaderboards

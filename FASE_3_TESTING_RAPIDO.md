# ⚡ Testing Rápido - Fase 3: Sistema de Honor

## 🎯 Comandos Nuevos Disponibles

### Slash Commands:
- `/honor` - Ver tu honor y progreso
- `/rango` - Ver información de tu rango
- `/top` - Ver ranking del servidor

### Text Commands:
- `!honor` - Versión de texto
- `!rango` - Versión de texto
- `!top` - Versión de texto

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

### 2. Test de Comando `/honor`

En Discord, escribe:
```
/honor
```

**Resultado esperado:**
- ✅ Embed con tu honor actual (probablemente 0 si es primera vez)
- ✅ Rango actual: 🥷 Ronin
- ✅ Barra de progreso visual
- ✅ Estadísticas (mensajes, voz, duelos)

---

### 3. Test de Ganancia de Honor por Mensajes

1. Envía un mensaje normal: `Hola mundo`
2. Espera **1 minuto** (cooldown)
3. Usa `/honor` de nuevo

**Resultado esperado:**
- ✅ Honor debe incrementar en +5
- ✅ Contador de mensajes debe incrementar en +1

4. Envía otro mensaje inmediatamente
5. Usa `/honor`

**Resultado esperado:**
- ❌ Honor NO debe cambiar (cooldown activo)

---

### 4. Test de Ganancia de Honor por Voz

1. Únete a cualquier canal de voz
2. Espera **3 minutos**
3. Sal del canal de voz
4. Usa `/honor`

**Resultado esperado:**
- ✅ Honor debe incrementar en +3 (1 por minuto)
- ✅ "Minutos en voz" debe mostrar 3

5. Únete de nuevo y espera **10 minutos** completos
6. Sal del canal
7. Usa `/honor`

**Resultado esperado:**
- ✅ Honor debe incrementar en +20 (10 por minuto + 10 bonus)

---

### 5. Test de Comando `/rango`

Escribe:
```
/rango
```

**Resultado esperado:**
- ✅ Embed mostrando tu rango actual
- ✅ Descripción del rango
- ✅ Beneficios del rango
- ✅ Honor necesario para siguiente rango
- ✅ Color del embed según rango (Ronin = gris)

---

### 6. Test de Comando `/top`

Escribe:
```
/top
```

**Resultado esperado:**
- ✅ Ranking de usuarios del servidor
- ✅ Tu posición resaltada
- ✅ Emojis de rango para cada usuario
- ✅ Medallas 🥇🥈🥉 para top 3

---

### 7. Test de Progresión de Rango

Para probar la progresión rápidamente, puedes simular ganancia de honor:

1. Envía muchos mensajes (espera 1 min entre cada uno)
2. Pasa tiempo en voz
3. Cuando llegues a **500 honor**, verifica:

**Resultado esperado:**
- ✅ `/rango` debe mostrar: ⚔️ Samurai (no Ronin)
- ✅ Color del embed debe cambiar a azul
- ✅ Descripción debe cambiar

---

### 8. Test de Comandos de Texto

Prueba las versiones con `!`:

```
!honor
!rango
!top
```

**Resultado esperado:**
- ✅ Deben funcionar idénticamente a las versiones `/`

---

## 📊 Rangos Samurai

| Rango | Emoji | Honor Requerido | Color |
|-------|-------|-----------------|-------|
| Ronin | 🥷 | 0 - 499 | Gris |
| Samurai | ⚔️ | 500 - 1,999 | Azul |
| Daimyo | 👑 | 2,000 - 4,999 | Púrpura |
| Shogun | 🏯 | 5,000+ | Dorado |

---

## 🎮 Sistema de Ganancia de Honor

### Por Mensajes:
- **+5 honor** por mensaje
- **Cooldown:** 60 segundos
- **Condición:** Solo mensajes normales (no comandos)

### Por Voz:
- **+1 honor** por minuto en canal de voz
- **+10 honor bonus** cada 10 minutos
- **Sin cooldown** (se calcula al salir del canal)

---

## ✅ Checklist de Testing

- [ ] Bot inicia sin errores
- [ ] `/honor` muestra información correctamente
- [ ] Ganancia de honor por mensajes funciona (+5 por mensaje)
- [ ] Cooldown de mensajes funciona (1 minuto)
- [ ] Ganancia de honor por voz funciona (+1 por minuto)
- [ ] Bonus de voz funciona (+10 cada 10 minutos)
- [ ] `/rango` muestra información del rango
- [ ] `/top` muestra ranking correctamente
- [ ] Versiones de texto (`!honor`, `!rango`, `!top`) funcionan
- [ ] Honor persiste al reiniciar el bot
- [ ] Ascenso de rango funciona (Ronin → Samurai a 500 honor)

---

## 🐛 Troubleshooting

### Los slash commands no aparecen en Discord
- Espera 5-10 minutos después de registrar
- Reinicia Discord (Ctrl+R)
- Verifica que ejecutaste `node register-commands.js`

### No gano honor por mensajes
- Verifica que no estés usando comandos (! o /)
- Espera 1 minuto entre mensajes (cooldown)
- Revisa consola del bot para logs

### No gano honor por voz
- Asegúrate de SALIR del canal (no solo desmutearte)
- Verifica en consola del bot los logs de voz

### Honor no persiste al reiniciar
- Usa Ctrl+C para cerrar el bot correctamente
- Verifica que veas "Guardando todos los datos..."
- Revisa `data/users.json` para confirmar

---

## 📝 Documentación Completa

Para información detallada, lee:
- `FASE_3_HONOR_RANGOS.md` - Documentación completa de la Fase 3

---

**Creado:** 2025-01-13
**Fase:** 3 - Sistema de Honor y Rangos
**Comandos nuevos:** 3 slash + 3 text = 6 comandos
**Sistema pasivo:** Ganancia de honor por mensajes y voz

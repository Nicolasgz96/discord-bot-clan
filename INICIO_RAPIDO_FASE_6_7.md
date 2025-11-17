# INICIO RÁPIDO - FASES 6 Y 7

## NUEVOS COMANDOS DISPONIBLES

### 🎮 Comandos Interactivos (FASE 6)

```bash
# Duelo PvP con apuestas de honor
/duelo oponente:@amigo apuesta:100

# Citas de sabiduría samurai
/sabiduria

# Fortuna del día (Omikuji)
/fortuna

# Perfil completo con estadísticas
/perfil
/perfil usuario:@amigo
```

### 🌐 Sistema de Traducción (FASE 7)

```bash
# Traducir a japonés
/traducir idioma:japonés texto:Hola, guerrero samurai

# Traducir a español
/traducir idioma:español texto:Hello warrior

# Traducir a inglés
/traducir idioma:inglés texto:Bienvenido al dojo
```

---

## INICIAR EL BOT

```bash
# 1. Instalar dependencia nueva (si no está instalada)
npm install

# 2. Registrar comandos (YA ESTÁ HECHO)
# node register-commands.js

# 3. Iniciar el bot
npm start
```

**Salida Esperada:**
```
⚔️🐉═══════════════════════════════════════⚔️🐉
🏯 DEMON HUNTER BOT - SISTEMA SAMURAI
⛩️═══════════════════════════════════════⛩️

✅ Bot en línea como Demon Hunter#1234
🏯 Sirviendo 1 dojos (servidores)
🌸 Función de bienvenida: Activada
✅ Sistema de persistencia de datos activado

🎌 Código Bushido activado. El dojo está listo.
```

---

## PRUEBA RÁPIDA (5 MINUTOS)

### Test 1: Sabiduría Samurai
```bash
/sabiduria
```
**Esperado:** Embed con cita aleatoria de un maestro samurai.

### Test 2: Fortuna del Día
```bash
/fortuna
```
**Esperado:** Te asigna una fortuna aleatoria (Dai-kichi, Kichi, Chukichi o Kyo).

### Test 3: Perfil
```bash
/perfil
```
**Esperado:** Muestra tu honor, koku, racha, stats, clan y fortuna.

### Test 4: Duelo (necesitas un amigo)
```bash
/duelo oponente:@amigo apuesta:50
```
**Esperado:**
1. Amigo recibe invitación
2. Acepta con botón
3. Ambos eligen arma
4. Sistema calcula ganador
5. Honor transferido

### Test 5: Traducción
```bash
/traducir idioma:japonés texto:El camino del samurái
```
**Esperado:** Traducción a japonés con formato profesional.

---

## CARACTERÍSTICAS DESTACADAS

### ⚔️ Sistema de Duelos
- **Mecánica:** Piedra-papel-tijera samurai
  - Katana vence a Tanto
  - Wakizashi vence a Katana
  - Tanto vence a Wakizashi
- **Apuestas:** 10-500 puntos de honor
- **Cooldown:** 60 segundos
- **Estadísticas:** Guardadas automáticamente

### 📜 Base de Datos de Sabiduría
- **50+ citas** de maestros samurai
- **5 fuentes:** Miyamoto Musashi, Hagakure, Sun Tzu, Bushido, Proverbios
- **Sin cooldown:** Úsalo las veces que quieras

### 🎴 Sistema de Fortuna
- **4 tipos de fortuna:** Dai-kichi (10%), Kichi (30%), Chukichi (40%), Kyo (20%)
- **Bonificaciones:** +20%, +10%, 0%, -10% de honor por 24h
- **Cooldown:** 24 horas
- **NOTA:** Bonus guardado pero NO aplicado automáticamente (pendiente FASE 8)

### 👤 Perfiles Completos
- **Información mostrada:** Honor, rango, koku, racha, mensajes, voz, duelos, clan, fortuna
- **Sin cooldown:** Consulta cuantas veces quieras
- **Multi-usuario:** Puedes ver perfiles de otros

### 🌐 Traducción Multilingüe
- **Idiomas:** Español, Japonés, Inglés
- **Auto-detección** del idioma origen
- **Máximo:** 500 caracteres
- **Cooldown:** 5 segundos

---

## ARCHIVOS IMPORTANTES

### Documentación
- `FASE_6_7_COMPLETADAS.md` - Documentación técnica completa
- `TESTING_FASE_6_7.md` - Guía exhaustiva de testing
- `RESUMEN_EJECUTIVO_FASE_6_7.md` - Resumen ejecutivo

### Código Modificado
- `index.js` - +430 líneas (handlers)
- `commands.js` - +58 líneas (definiciones)
- `src/config/constants.js` - +140 líneas (constantes)
- `src/config/messages.js` - +60 líneas (mensajes)
- `src/config/emojis.js` - +13 líneas (emojis)
- `utils/dataManager.js` - +8 líneas (estructura datos)

---

## EJEMPLOS DE USO

### Escenario 1: Jugador Nuevo
```bash
1. Únete al servidor
2. Recibes tarjeta de bienvenida automática
3. /sabiduria  # Lee una cita inspiradora
4. /fortuna  # Consulta tu fortuna del día
5. /perfil  # Verifica tus datos iniciales (0 honor, Ronin)
6. Envía mensajes en chat (ganas honor pasivo)
7. /perfil  # Verifica que tu honor aumentó
8. /duelo @amigo 10  # Tu primer duelo
```

### Escenario 2: Jugador Experimentado
```bash
1. /fortuna  # Consulta fortuna si no lo hiciste hoy
2. /perfil  # Verifica tus stats actuales
3. /top  # Verifica tu posición en el ranking
4. /duelo @rival 100  # Duelo por honor alto
5. /perfil  # Verifica nuevas estadísticas
6. /traducir idioma:japonés texto:Mi clan es el mejor
```

---

## SOLUCIÓN DE PROBLEMAS

### Error: "Used disallowed intents"
**Solución:** Habilita Privileged Gateway Intents en Discord Developer Portal
- Ve a https://discord.com/developers/applications
- Selecciona tu bot → Bot → Privileged Gateway Intents
- Habilita: SERVER MEMBERS INTENT y MESSAGE CONTENT INTENT

### Error: "Cannot find module '@vitalets/google-translate-api'"
**Solución:**
```bash
npm install @vitalets/google-translate-api
```

### Comandos no aparecen en Discord
**Solución:**
1. Espera hasta 1 hora (propagación global)
2. Reinicia Discord completamente
3. Verifica que ejecutaste `node register-commands.js`

### Traducción falla con error
**Solución:**
- Espera 10 segundos y vuelve a intentar
- La API gratuita tiene rate limiting ocasional
- Si persiste, puede ser problema de la API (fuera de nuestro control)

### Bonus de fortuna no se aplica
**Solución:**
- Esto es NORMAL, el bonus se guarda pero NO se aplica automáticamente
- Se implementará en FASE 8 durante el refactoring

---

## PRÓXIMOS PASOS

### FASE 8: Reorganización del Código (PENDIENTE)
1. Modularizar `index.js` en archivos separados
2. Implementar tests automatizados
3. **Aplicar bonus de fortuna automáticamente**
4. Optimizar sistema de cooldowns
5. Agregar comando `/ayuda` interactivo mejorado

---

## CONTACTO Y SOPORTE

### Documentación Completa
Lee `FASE_6_7_COMPLETADAS.md` para información técnica detallada.

### Testing
Lee `TESTING_FASE_6_7.md` para guía completa de testing.

### Problemas Conocidos
1. Bonus de fortuna no se aplica automáticamente (pendiente FASE 8)
2. API de traducción puede tener rate limiting ocasional

---

## RESUMEN RÁPIDO

**✅ TODO FUNCIONA:**
- 5 comandos nuevos implementados
- 709 líneas de código agregadas
- 50+ citas de sabiduría samurai
- Sistema de duelos completamente jugable
- Traducción entre 3 idiomas
- Perfiles con estadísticas completas

**🎌 EL BOT ESTÁ LISTO PARA USARSE**

```bash
npm start  # ← Ejecuta esto y empieza a jugar
```

---

**Generado con [Claude Code](https://claude.com/claude-code)**

Co-Authored-By: Claude <noreply@anthropic.com>

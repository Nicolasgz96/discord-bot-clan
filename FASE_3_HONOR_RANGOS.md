# FASE 3: Sistema de Honor y Rangos - Demon Hunter Bot

## Fecha de Implementación
2025-11-14

## Resumen
La Fase 3 implementa el sistema completo de honor y rangos samurai, permitiendo a los usuarios ganar honor pasivamente por actividad en el servidor y ver su progreso hacia rangos superiores.

---

## Nuevos Comandos Implementados

### 1. `/honor` o `!honor`
**Descripción:** Muestra tu honor actual y progreso hacia el siguiente rango.

**Características:**
- Muestra honor total acumulado
- Rango actual con emoji temático
- Barra de progreso visual hacia el siguiente rango
- Porcentaje de progreso
- Honor necesario para subir de rango
- Estadísticas: mensajes enviados, minutos en voz, duelos ganados

**Ejemplo de uso:**
```
/honor
!honor
```

**Salida:**
```
⭐ Honor de TuNombre
Tu camino samurai en NombreDelServidor

⭐ Honor Actual: 150 puntos
🥷 Rango: Ronin
⏳ Progreso hacia Samurai
███████░░░░░░░░ 30.0%
⚔️ Faltan 350 puntos de honor

📜 Estadísticas
💬 Mensajes: 30
🎤 Minutos en voz: 0
⚔️ Duelos ganados: 0
```

---

### 2. `/rango` o `!rango`
**Descripción:** Muestra información detallada sobre tu rango actual y beneficios.

**Características:**
- Descripción del rango actual
- Rango de honor necesario
- Lista de beneficios del rango
- Próximo rango a alcanzar
- Colores temáticos según el rango

**Ejemplo de uso:**
```
/rango
!rango
```

**Salida:**
```
🥷 Ronin
Un guerrero sin maestro que busca su camino en el dojo.

📜 Rango de Honor: 0 - 499
⭐ Tu Honor: 150 puntos

🎁 Beneficios del Rango
• Acceso a comandos básicos del dojo
• Ganancia de honor por actividad
• Participación en el ranking

⚔️ Próximo Rango
Samurai (500 honor)
```

---

### 3. `/top` o `!top`
**Descripción:** Muestra el ranking de honor del dojo (top 10 guerreros).

**Características:**
- Top 10 usuarios con más honor
- Medallas para los 3 primeros (🥇🥈🥉)
- Emojis de rango para cada usuario
- Resalta tu posición si estás en el top 10
- Muestra tu posición actual si estás fuera del top 10
- Cantidad de honor de cada usuario

**Ejemplo de uso:**
```
/top
!top
```

**Salida:**
```
🏆 Ranking de Honor - NombreDelServidor

🥇 ⚔️ Usuario1 - 5200 honor
🥈 👑 Usuario2 - 3500 honor
🥉 ⚔️ Usuario3 - 2100 honor
`4.` 🥷 Usuario4 - 800 honor
`5.` 🥷 Usuario5 - 450 honor
**➤ `6.` 🥷 TuNombre - 150 honor**

ℹ️ Tu Posición
No registrado - ¡Usa comandos para ganar honor!
```

---

## Sistema de Ganancia Pasiva de Honor

### Por Mensajes en el Servidor
**Ganancia:** +5 honor por mensaje
**Cooldown:** 1 minuto entre mensajes
**Condiciones:**
- Solo mensajes en servidores (no DMs)
- No se otorga honor por comandos (mensajes que empiezan con `!` o `/`)
- Automáticamente incrementa el contador de mensajes

**Ejemplo:**
```
Usuario envía mensaje → +5 honor (si no tiene cooldown)
Usuario envía mensaje 30 segundos después → No gana honor (cooldown activo)
Usuario envía mensaje 1 minuto después → +5 honor
```

### Por Tiempo en Voz
**Ganancia:**
- +1 honor por cada minuto completo en voz
- +10 honor adicional cada 10 minutos en voz activa

**Cálculo:**
- Al entrar a un canal de voz, se inicia el rastreo
- Al salir del canal, se otorga honor por el tiempo total
- Cambiar de canal de voz NO resetea el tiempo

**Ejemplo:**
```
Usuario entra a voz → Se inicia rastreo
Usuario está 15 minutos en voz → Al salir, recibe 15 honor base + 10 honor (bonus de 10 minutos) = 25 honor
```

---

## Sistema de Rangos Samurai

### Ronin (0-499 honor)
**Emoji:** 🥷
**Descripción:** Un guerrero sin maestro que busca su camino en el dojo.
**Beneficios:**
- Acceso a comandos básicos del dojo
- Ganancia de honor por actividad
- Participación en el ranking

### Samurai (500-1,999 honor)
**Emoji:** ⚔️
**Descripción:** Un guerrero disciplinado que ha demostrado su valía en el dojo.
**Beneficios:**
- Todos los beneficios de Ronin
- Mayor ganancia de honor diaria
- Acceso a comandos de clan
- Emblema especial en el ranking

### Daimyo (2,000-4,999 honor)
**Emoji:** 👑
**Descripción:** Un señor feudal respetado, líder entre los guerreros del dojo.
**Beneficios:**
- Todos los beneficios de Samurai
- Recompensas diarias mejoradas
- Capacidad de crear clanes
- Prioridad en eventos del dojo
- Emblema dorado en el ranking

### Shogun (5,000+ honor)
**Emoji:** 🏯
**Descripción:** El comandante supremo, maestro absoluto del arte samurai.
**Beneficios:**
- Todos los beneficios de Daimyo
- Máximas recompensas diarias
- Acceso a comandos exclusivos
- Emblema legendario en el ranking
- Reconocimiento eterno en el dojo
- Rol especial (si configurado)

---

## Archivos Modificados

### `/home/onik/proyects/AI/discord-bot/commands.js`
**Cambios:**
- Añadidos 3 nuevos slash commands: `/honor`, `/rango`, `/top`

### `/home/onik/proyects/AI/discord-bot/index.js`
**Cambios:**
- Añadida función helper `getRankEmoji(rank)` para obtener emoji del rango
- Implementado sistema de ganancia de honor por mensajes en `MessageCreate` event
- Implementado sistema de ganancia de honor por voz en `VoiceStateUpdate` event
- Añadidos handlers para slash commands: `/honor`, `/rango`, `/top`
- Añadidos handlers para comandos de texto: `!honor`, `!rango`, `!top`
- Añadido rastreo de tiempo en voz con `voiceTimeTracking` Map

---

## Instrucciones para Registro y Prueba

### 1. Registrar los Nuevos Comandos Slash

Ejecuta el script de registro de comandos:

```bash
node register-commands.js
```

**Salida esperada:**
```
Registrando 10 comandos slash globalmente...
✓ Comandos registrados globalmente exitosamente
Comandos registrados:
- testwelcome
- help
- borrarmsg
- deshacerborrado
- hablar
- join
- salir
- honor      (NUEVO)
- rango      (NUEVO)
- top        (NUEVO)
```

**Nota:** Los comandos slash pueden tardar hasta 1 hora en aparecer globalmente. Para pruebas inmediatas en tu servidor de desarrollo, puedes usar `register-commands-guild.js` (si existe) o esperar.

### 2. Iniciar el Bot

```bash
npm start
```

**Verificar en la consola:**
```
🐉⚔️═══════════════════════════════════════⚔️🐉
🏯 DEMON HUNTER BOT - SISTEMA SAMURAI
⛩️═══════════════════════════════════════⛩️

✅ Bot en línea como DemonHunterBot#1234
🏯 Sirviendo 2 dojos (servidores)
🌸 Función de bienvenida: Activada
✅ Sistema de persistencia de datos activado

🎌 Código Bushido activado. El dojo está listo.
```

### 3. Probar Ganancia de Honor por Mensajes

**Test 1: Enviar mensaje normal**
1. En cualquier canal del servidor, envía un mensaje normal: "Hola"
2. Espera 1 minuto
3. Usa `/honor` o `!honor` para verificar que ganaste 5 honor
4. El contador de mensajes debe incrementarse

**Test 2: Cooldown de mensajes**
1. Envía un mensaje: "Mensaje 1"
2. Inmediatamente envía otro: "Mensaje 2" (menos de 1 minuto después)
3. Usa `/honor` - solo deberías haber ganado 5 honor (del primer mensaje)

**Test 3: Comandos no otorgan honor**
1. Usa un comando: `!help`
2. Usa `/honor` - no deberías ganar honor por el comando

### 4. Probar Ganancia de Honor por Voz

**Test 1: Tiempo en voz básico**
1. Únete a un canal de voz
2. Permanece conectado por 2-3 minutos
3. Sal del canal de voz
4. Usa `/honor` - deberías ver que ganaste 2-3 honor (1 por minuto)
5. El contador de minutos en voz debe incrementarse

**Test 2: Bonus de 10 minutos**
1. Únete a un canal de voz
2. Permanece conectado por 11 minutos
3. Sal del canal
4. Usa `/honor` - deberías ver que ganaste 21 honor (11 base + 10 bonus)

**Test 3: Cambio de canal**
1. Únete a un canal de voz A
2. Espera 5 minutos
3. Cambia al canal de voz B (sin salir completamente de voz)
4. Espera 5 minutos más
5. Sal del canal
6. Usa `/honor` - deberías ver 10 honor (tiempo se mantiene al cambiar de canal)

### 5. Probar Comandos de Honor

**Test `/honor` o `!honor`:**
1. Usa el comando: `/honor`
2. Verifica que muestra:
   - Honor actual
   - Rango actual
   - Barra de progreso visual
   - Porcentaje de progreso
   - Honor necesario para siguiente rango
   - Estadísticas (mensajes, voz, duelos)

**Test `/rango` o `!rango`:**
1. Usa el comando: `/rango`
2. Verifica que muestra:
   - Descripción del rango
   - Rango de honor
   - Beneficios
   - Próximo rango
   - Color correcto del embed

**Test `/top` o `!top`:**
1. Invita a varios usuarios a usar comandos
2. Haz que ganen diferentes cantidades de honor
3. Usa `/top`
4. Verifica que muestra:
   - Top 10 usuarios ordenados por honor
   - Medallas para top 3
   - Tu posición resaltada
   - Emoji de rango correcto para cada usuario

### 6. Probar Progresión de Rangos

**Test de ascenso de rango:**
1. Comienza con 0 honor (Ronin)
2. Gana honor hasta alcanzar 500 (envía mensajes, usa voz)
3. Usa `/honor` - deberías ver que tu rango cambió a "Samurai"
4. La barra de progreso debe mostrar progreso hacia Daimyo

**Atajos para testing (solo desarrollo):**

Si necesitas probar rápidamente los rangos sin esperar, puedes modificar temporalmente el honor en `/home/onik/proyects/AI/discord-bot/data/users.json`:

```json
{
  "GUILD_ID_USER_ID": {
    "userId": "TU_USER_ID",
    "guildId": "TU_GUILD_ID",
    "honor": 5000,  // Cambiar este valor
    "rank": "Shogun",  // Se recalculará automáticamente
    ...
  }
}
```

**Importante:** Reinicia el bot después de modificar manualmente el JSON.

---

## Verificación de Persistencia

**Test de persistencia:**
1. Gana algo de honor (por ejemplo, 50 honor)
2. Usa `/honor` para verificar
3. Detén el bot (Ctrl+C)
4. Inicia el bot de nuevo
5. Usa `/honor` - deberías ver el mismo honor que antes
6. Verifica que el archivo `data/users.json` contiene tus datos

---

## Troubleshooting

### Los comandos slash no aparecen
**Solución:**
1. Ejecuta `node register-commands.js`
2. Espera hasta 1 hora (comandos globales)
3. Recarga Discord (Ctrl+R)
4. Verifica que el bot tiene permisos de "Use Application Commands"

### No gano honor por mensajes
**Verifica:**
1. Que no estás usando comandos (!, /)
2. Que pasó 1 minuto desde tu último mensaje que otorgó honor
3. Que estás en un servidor, no en DMs
4. Revisa la consola por errores

### No gano honor por voz
**Verifica:**
1. Que permaneciste al menos 1 minuto en voz
2. Que saliste del canal (honor se otorga al salir)
3. Revisa la consola por mensajes de "ganó X honor por Y minutos en voz"

### El ranking no muestra usuarios
**Verifica:**
1. Que los usuarios han ganado algo de honor
2. Que estás en el servidor correcto
3. Que el archivo `data/users.json` existe y tiene datos

---

## Próximos Pasos (Futuras Fases)

**Fase 4 (Pendiente):** Sistema de Economía (Koku)
- Comando `/daily` - Reclamar recompensa diaria
- Comando `/balance` - Ver koku y honor
- Sistema de rachas diarias
- Tienda de items

**Fase 5 (Pendiente):** Sistema de Clanes
- Comando `/clan crear` - Crear un clan
- Comando `/clan info` - Ver información del clan
- Comando `/clan unirse` - Unirse a un clan
- Leaderboard de clanes

**Fase 6 (Pendiente):** Sistema de Duelos
- Comando `/duelo` - Desafiar a otro usuario
- Sistema de apuestas de honor
- Registro de victorias/derrotas

---

## Notas Técnicas

### Almacenamiento de Datos
- Todos los datos se guardan en `data/users.json`
- Auto-guardado cada 5 minutos
- Cooldowns se guardan en `data/cooldowns.json`
- Sistema de graceful shutdown para guardar antes de cerrar

### Performance
- Cooldowns de honor por mensaje: 1 minuto (evita spam)
- Rastreo de voz en memoria (Map), honor se otorga al salir
- Queries eficientes usando `dataManager.getGuildUsers()`

### Seguridad
- Validación de guild/user IDs
- Error handling en todos los comandos
- Fallos silenciosos en ganancia pasiva (no interrumpe flujo)
- Logs detallados para debugging

---

## Créditos
Implementado por: Claude Code (SamuraiBot Architect)
Fecha: 2025-11-14
Versión del Bot: Demon Hunter v2.3 (Fase 3)

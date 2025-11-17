# 🧪 Manual de Testing - Demon Hunter Bot

## 📋 Checklist de Testing Completo

Sigue estos pasos **en orden** para verificar que el bot funciona correctamente después de aplicar los fixes de bugs.

---

## ✅ FASE 1: Verificación de Inicio

### 1.1 Iniciar el Bot

```bash
npm start
```

### 1.2 Verificar Mensajes de Inicio Correctos

Debes ver estos mensajes en consola (en español):

```
[dotenv] injecting env...
📜 Inicializando sistema de datos...
✓ Directorio de datos creado/verificado: /home/onik/proyects/AI/discord-bot/data
✓ Usuarios cargados: 0
✓ Clanes cargados: 0
✓ Cooldowns activos: 0
✅ Sistema de datos inicializado correctamente
ℹ️ Usuarios cargados: 0
ℹ️ Clanes cargados: 0
ℹ️ Cooldowns activos: 0
🔄 Iniciando auto-guardado (cada 5 minutos)...
✅ Configuración válida
✅ Bot en línea como: Demon Hunter#XXXX
📊 Servidores conectados: 1
```

**❌ Si ves errores:**
- "Used disallowed intents" → Ve a CONFIGURACION_DISCORD_PORTAL.md y habilita los intents
- "Invalid token" → Verifica tu .env file
- "Missing Access" → Re-invita el bot con el link correcto

---

## ✅ FASE 2: Testing de Slash Commands

### 2.1 Test: `/testwelcome` (CRÍTICO - Este comando crasheaba antes)

**Objetivo:** Verificar que el fix del cooldown funciona

1. En Discord, escribe: `/testwelcome`
2. **Resultado esperado:**
   - ✅ Se genera una tarjeta de bienvenida
   - ✅ Mensaje: "🎌 ¡Aquí está tu vista previa, [tu nombre]!"

3. **Inmediatamente** vuelve a escribir: `/testwelcome`
4. **Resultado esperado:**
   - ✅ Mensaje de cooldown: "🔥 Tu katana debe descansar. Vuelve en X segundos, samurái."
   - ❌ **NO debe crashear** (este era el bug)

5. Espera 5 segundos y prueba de nuevo
6. **Resultado esperado:**
   - ✅ Genera nueva tarjeta sin problemas

**✅ TEST PASADO** si no hay errores en consola y el cooldown funciona correctamente.

---

### 2.2 Test: `/help` (Fix de estilo aplicado)

**Objetivo:** Verificar que el embed tiene el estilo samurai correcto

1. En Discord, escribe: `/help`
2. **Resultado esperado:**
   - ✅ Embed con color azul (#0066FF, no cyan)
   - ✅ Título: "⛩️ Comandos del Dojo - Demon Hunter"
   - ✅ Descripción menciona tu username
   - ✅ Lista todos los comandos disponibles
   - ✅ Tip sobre slash commands al final

**✅ TEST PASADO** si el embed se ve temático y profesional.

---

### 2.3 Test: `/borrarmsg` (CRÍTICO - Este comando crasheaba antes)

**Objetivo:** Verificar que el fix del cooldown funciona en comando de moderación

**Prerequisitos:**
- Debes tener permiso "Manage Messages"
- Necesitas al menos 2 usuarios en el canal (tú y otro)

**Pasos:**

1. Pide a otro usuario que envíe 3-5 mensajes en un canal de prueba
2. Escribe: `/borrarmsg @usuario` (menciona al otro usuario)
3. **Resultado esperado:**
   - ✅ Aparecen botones de confirmación (✅ Confirmar / ❌ Cancelar)
   - ✅ Mensaje muestra cuántos mensajes se borrarán

4. Haz clic en **✅ Confirmar**
5. **Resultado esperado:**
   - ✅ Los mensajes se borran exitosamente
   - ✅ Mensaje: "🗑️ X mensajes de [usuario] han sido eliminados"
   - ✅ Mención de que puedes usar `/deshacerborrado`

6. **Inmediatamente** intenta: `/borrarmsg @usuario` de nuevo
7. **Resultado esperado:**
   - ✅ Mensaje de cooldown: "🔥 Tu katana debe descansar. Vuelve en X segundos, samurái."
   - ❌ **NO debe crashear** (este era el bug)

**✅ TEST PASADO** si el comando funciona y el cooldown no crashea.

---

### 2.4 Test: `/deshacerborrado` (Restaurar mensajes)

**Objetivo:** Verificar que la restauración funciona correctamente

**Prerequisitos:**
- Debes haber ejecutado `/borrarmsg` en los últimos 5 minutos
- Debes tener permisos "Manage Messages" y "Manage Webhooks"

**Pasos:**

1. Después de borrar mensajes con `/borrarmsg`, escribe: `/deshacerborrado`
2. **Resultado esperado:**
   - ✅ Los mensajes se restauran vía webhook
   - ✅ Aparecen con el nombre/avatar del autor original
   - ✅ Los mensajes aparecen en orden cronológico correcto
   - ✅ Mensaje de confirmación: "✅ Se restauraron X mensajes"

3. Verifica que los attachments (imágenes) también se restauraron
4. Intenta `/deshacerborrado` de nuevo
5. **Resultado esperado:**
   - ✅ Mensaje: "❌ No hay mensajes recientes para restaurar en este canal"

**✅ TEST PASADO** si la restauración funciona completamente.

---

## ✅ FASE 3: Testing de Text Commands (!)

### 3.1 Test: `!testwelcome` (Comando de texto)

**Objetivo:** Verificar que los comandos de texto funcionan igual que slash commands

1. Escribe en Discord: `!testwelcome`
2. **Resultado esperado:**
   - ✅ Genera tarjeta de bienvenida
   - ✅ Mismo comportamiento que `/testwelcome`

3. Prueba inmediatamente de nuevo: `!testwelcome`
4. **Resultado esperado:**
   - ✅ Mensaje de cooldown samurai
   - ✅ Usa dataManager (cooldown persistente)

**✅ TEST PASADO** si funciona idénticamente a la versión slash.

---

### 3.2 Test: `!borrarmsg` (CRÍTICO - Fix aplicado)

**Objetivo:** Verificar que el comando de texto usa dataManager (no Map viejo)

**Pasos:**

1. Escribe: `!borrarmsg @usuario`
2. **Resultado esperado:**
   - ✅ Botones de confirmación aparecen
   - ✅ Funciona correctamente

3. Confirma el borrado
4. Inmediatamente intenta: `!borrarmsg @usuario` de nuevo
5. **Resultado esperado:**
   - ✅ Mensaje de cooldown temático (no genérico)
   - ✅ Mensaje: "🔥 Tu katana debe descansar. Vuelve en X segundos, samurái."

**✅ TEST PASADO** si usa mensajes temáticos y dataManager.

---

### 3.3 Test: `!help` (Comando de ayuda)

**Objetivo:** Verificar que el menú de ayuda funciona

1. Escribe: `!help` o `!ayuda`
2. **Resultado esperado:**
   - ✅ Embed interactivo con todos los comandos
   - ✅ Estilo profesional
   - ✅ Incluye descripciones y ejemplos

**✅ TEST PASADO** si el embed se muestra correctamente.

---

## ✅ FASE 4: Testing de Persistencia (CRÍTICO)

### 4.1 Test: Cooldowns Persisten Entre Reinicios

**Objetivo:** Verificar que el sistema dataManager guarda cooldowns en JSON

**Pasos:**

1. Usa `/testwelcome` para activar cooldown
2. Verifica que está en cooldown (intenta de nuevo, debe dar error)
3. **Detén el bot:** `Ctrl+C` en terminal
4. **Verifica en consola:**
   ```
   ⚠️ Señal SIGINT recibida. Iniciando cierre graceful...
   📜 Guardando todos los datos...
   ✅ Todos los datos guardados exitosamente
   ✅ Bot desconectado correctamente
   🎌 Cierre completado. Que el código Bushido te proteja, guerrero.
   ```

5. **Verifica que se guardó el cooldown:**
   ```bash
   cat data/cooldowns.json
   ```
   Debes ver algo como:
   ```json
   {
     "TU_USER_ID_testwelcome": {
       "userId": "123456789",
       "command": "testwelcome",
       "expiresAt": 1705171200000
     }
   }
   ```

6. **Reinicia el bot:** `npm start`
7. **Inmediatamente** intenta: `/testwelcome`
8. **Resultado esperado:**
   - ✅ **El cooldown DEBE persistir** (debe dar error de cooldown)
   - ❌ **NO debe permitir** usar el comando inmediatamente

**✅ TEST PASADO** si el cooldown sobrevive al reinicio del bot.

---

### 4.2 Test: Auto-Guardado Funciona

**Objetivo:** Verificar que el sistema guarda datos cada 5 minutos

**Pasos:**

1. Deja el bot corriendo
2. Usa varios comandos (para generar datos modificados)
3. **Espera 5 minutos**
4. **Verifica en consola:**
   ```
   ✅ Auto-guardado completado: X archivos guardados en Yms
   ```

5. Verifica los archivos JSON:
   ```bash
   ls -lh data/
   cat data/cooldowns.json
   ```

**✅ TEST PASADO** si el auto-guardado se ejecuta y guarda archivos modificados.

---

## ✅ FASE 5: Testing de Comandos de Voz

### 5.1 Test: `/join` (Unirse a voz)

**Prerequisitos:**
- Debes estar en un canal de voz

**Pasos:**

1. Únete a un canal de voz
2. Escribe: `/join`
3. **Resultado esperado:**
   - ✅ El bot se une a tu canal de voz
   - ✅ Mensaje de confirmación

**✅ TEST PASADO** si el bot se conecta correctamente.

---

### 5.2 Test: `/hablar` (Text-to-speech)

**Prerequisitos:**
- El bot debe estar en un canal de voz (`/join`)

**Pasos:**

1. Escribe: `/hablar texto:Hola, soy el Demon Hunter Bot`
2. **Resultado esperado:**
   - ✅ El bot reproduce el texto en español con voz TTS
   - ✅ Puedes escucharlo en el canal de voz

**✅ TEST PASADO** si el TTS funciona.

---

### 5.3 Test: `/salir` (Salir de voz)

**Pasos:**

1. Con el bot en voz, escribe: `/salir`
2. **Resultado esperado:**
   - ✅ El bot se desconecta del canal de voz
   - ✅ Mensaje de despedida

**✅ TEST PASADO** si el bot sale correctamente.

---

## ✅ FASE 6: Testing de Welcome Cards Automáticas

### 6.1 Test: Welcome Card en Nuevo Miembro

**Prerequisitos:**
- Necesitas crear un link de invitación temporal
- Usa una cuenta secundaria o pide a alguien que se una

**Pasos:**

1. Crea invite link temporal:
   - Discord → Tu servidor → Invitaciones → Crear invitación
2. Únete con otra cuenta (o pide a alguien)
3. **Resultado esperado:**
   - ✅ El bot genera automáticamente una welcome card
   - ✅ Se envía al canal configurado en `config.json`
   - ✅ Muestra: nombre del usuario, avatar, "Miembro #X"
   - ✅ Si `autoRole.enabled: true`, se asigna el rol automáticamente

**✅ TEST PASADO** si la bienvenida automática funciona.

---

## 📊 Resumen de Testing

Marca cada test completado:

### Slash Commands:
- [ ] `/testwelcome` - Genera tarjeta y cooldown funciona
- [ ] `/help` - Muestra menú con estilo samurai
- [ ] `/borrarmsg` - Borra mensajes y cooldown funciona
- [ ] `/deshacerborrado` - Restaura mensajes correctamente

### Text Commands:
- [ ] `!testwelcome` - Funciona igual que slash version
- [ ] `!borrarmsg` - Usa dataManager y mensajes temáticos
- [ ] `!help` - Muestra menú de ayuda

### Persistencia:
- [ ] Cooldowns persisten entre reinicios
- [ ] Auto-guardado funciona cada 5 minutos
- [ ] Graceful shutdown guarda todos los datos

### Comandos de Voz:
- [ ] `/join` - Bot se une a voz
- [ ] `/hablar` - TTS funciona en español
- [ ] `/salir` - Bot sale de voz

### Welcome System:
- [ ] Welcome cards automáticas se generan
- [ ] Auto-role se asigna (si está habilitado)

---

## 🐛 Reportar Bugs

Si encuentras errores durante el testing:

1. **Captura el error de consola** (completo)
2. **Anota los pasos exactos** que causaron el error
3. **Verifica** si es un error crítico (crashea el bot) o menor
4. **Reporta** con detalles:
   - Comando usado
   - Error en consola
   - Comportamiento esperado vs actual

---

## ✅ Criterios de Éxito

El bot está **LISTO PARA PRODUCCIÓN** si:

- ✅ Todos los slash commands funcionan sin crashear
- ✅ Todos los text commands funcionan correctamente
- ✅ Los cooldowns persisten entre reinicios
- ✅ El auto-guardado funciona cada 5 minutos
- ✅ El graceful shutdown guarda datos al cerrar
- ✅ Los mensajes son temáticos (samurai style)
- ✅ Welcome cards se generan automáticamente
- ✅ No hay errores críticos en consola

---

**Documento de testing generado:** 2025-01-13
**Versión del bot:** Post-Bug-Fixes (Fase 2 Completada)
**Bugs críticos arreglados:** 4 (testwelcome, borrarmsg slash, borrarmsg text, help style)

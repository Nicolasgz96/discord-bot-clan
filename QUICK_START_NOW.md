# ⚡ INICIO RÁPIDO - 3 PASOS

## 🎯 Tu bot está 100% listo. Solo haz esto:

---

## PASO 1: Verificar que todo está OK

```bash
node verify-setup.js
```

✅ Si ves "🎉 ¡TODO ESTÁ PERFECTO!" → Continúa al Paso 2
❌ Si hay errores → Lee el mensaje y corrige

---

## PASO 2: Iniciar el bot

```bash
npm start
```

✅ Si ves:
```
✅ Bot en línea como DemonHunter OFICIAL#XXXX
🏯 Sirviendo X dojos (servidores)
✅ Sistema de datos inicializado correctamente
```

**¡FELICIDADES! El bot está funcionando.** 🎉

❌ Si ves error "Used disallowed intents":
1. Ve a https://discord.com/developers/applications
2. Selecciona tu bot → Bot section
3. Activa **SERVER MEMBERS INTENT** y **MESSAGE CONTENT INTENT**
4. Guarda y reinicia el bot

---

## PASO 3: Probar en Discord

### Prueba Rápida (2 minutos):

1. **Test de slash command:**
   ```
   /testwelcome
   ```
   ✅ Debe generar una tarjeta de bienvenida

2. **Test de cooldown:**
   ```
   /testwelcome
   ```
   (inmediatamente después)
   ✅ Debe decir "Tu katana debe descansar..."

3. **Test de menú:**
   ```
   /help
   ```
   ✅ Debe mostrar "⛩️ Comandos del Dojo - Demon Hunter"

**Si los 3 tests pasan → Tu bot funciona perfectamente.** ✅

---

## 📚 DOCUMENTACIÓN COMPLETA

Si quieres más detalles:

- **`DEPLOYMENT_READY.md`** - Todo lo que se completó
- **`MANUAL_TESTING.md`** - Checklist completo de testing
- **`CONFIGURACION_DISCORD_PORTAL.md`** - Configuración de Discord Portal

---

## ⚠️ IMPORTANTE: Cómo Detener el Bot

**SIEMPRE usa `Ctrl+C`** para detener el bot.

Verás:
```
📜 Guardando todos los datos...
✅ Todos los datos guardados exitosamente
```

Esto asegura que no pierdes datos de cooldowns/usuarios.

---

## 🆘 AYUDA RÁPIDA

**Bot no se conecta:**
→ Habilita intents en Discord Developer Portal (ver Paso 2)

**Slash commands no aparecen:**
→ Ejecuta `node register-commands.js` y espera 5-10 minutos

**Welcome cards no funcionan:**
→ Verifica `welcome.channelId` en `config.json`

**Cooldowns no persisten:**
→ Usa `Ctrl+C` para cerrar el bot (no cierres la terminal)

---

## 🚀 YA ESTÁ - ¡Disfruta tu bot!

```
════════════════════════════════════════
🎌 DEMON HUNTER BOT
⛩️ Listo para servir a tu dojo
🏯 Que el código Bushido te proteja
════════════════════════════════════════
```

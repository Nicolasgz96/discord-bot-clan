# 🔧 Configuración del Discord Developer Portal

## ⚠️ PASO CRÍTICO - Habilitar Intents

**SIN ESTOS INTENTS EL BOT NO FUNCIONARÁ**

### 1. Accede al Developer Portal

1. Ve a: https://discord.com/developers/applications
2. Selecciona tu aplicación: **Demon Hunter Bot** (ID: `1437866826859282452`)
3. En el menú lateral, haz clic en **"Bot"**

### 2. Habilita los Privileged Gateway Intents

Desplázate hasta la sección **"Privileged Gateway Intents"** y activa:

```
☐ PRESENCE INTENT          (Opcional - para ver estado online/offline)
☑ SERVER MEMBERS INTENT    (CRÍTICO - para GuildMemberAdd event)
☑ MESSAGE CONTENT INTENT   (CRÍTICO - para leer contenido de mensajes)
```

**Los dos marcados con ☑ son OBLIGATORIOS**

### 3. Guarda los Cambios

Haz clic en **"Save Changes"** al final de la página.

---

## 🔗 Link de Invitación del Bot

### Permisos Necesarios

Tu bot necesita estos permisos para funcionar correctamente:

**Permisos Generales:**
- ✅ View Channels (Ver canales)
- ✅ Send Messages (Enviar mensajes)
- ✅ Embed Links (Insertar enlaces)
- ✅ Attach Files (Adjuntar archivos)
- ✅ Read Message History (Leer historial de mensajes)
- ✅ Use External Emojis (Usar emojis externos)
- ✅ Add Reactions (Añadir reacciones)

**Permisos de Moderación:**
- ✅ Manage Messages (Gestionar mensajes) - Para !borrarmsg
- ✅ Manage Webhooks (Gestionar webhooks) - Para !deshacerborrado

**Permisos de Voz:**
- ✅ Connect (Conectar a canales de voz)
- ✅ Speak (Hablar en canales de voz)

**Permisos de Roles:**
- ✅ Manage Roles (Gestionar roles) - Para auto-roles de bienvenida

### Link de Invitación Generado

Usa este link para invitar el bot a tu servidor con TODOS los permisos necesarios:

```
https://discord.com/api/oauth2/authorize?client_id=1437866826859282452&permissions=1099780105216&scope=bot%20applications.commands
```

**Permisos incluidos en el link:** `1099780105216`
- Manage Roles
- Manage Channels
- Manage Webhooks
- View Channels
- Send Messages
- Manage Messages
- Embed Links
- Attach Files
- Read Message History
- Use External Emojis
- Add Reactions
- Connect
- Speak

---

## 📋 Checklist de Configuración

Verifica que completaste todos estos pasos:

### En Discord Developer Portal:
- [ ] Accediste a https://discord.com/developers/applications
- [ ] Abriste tu aplicación (ID: 1437866826859282452)
- [ ] Fuiste a la sección **Bot**
- [ ] Habilitaste **SERVER MEMBERS INTENT** ✅
- [ ] Habilitaste **MESSAGE CONTENT INTENT** ✅
- [ ] Guardaste los cambios con **Save Changes**

### En Discord (Servidor):
- [ ] Usaste el link de invitación generado arriba
- [ ] Seleccionaste tu servidor de destino
- [ ] Autorizaste TODOS los permisos solicitados
- [ ] El bot aparece en la lista de miembros (offline por ahora)

---

## 🚨 Errores Comunes

### Error: "Used disallowed intents"
**Causa:** No habilitaste los intents en Developer Portal
**Solución:** Vuelve al paso 2 y activa SERVER MEMBERS INTENT y MESSAGE CONTENT INTENT

### Error: "Missing Access"
**Causa:** El bot no tiene permisos en el servidor
**Solución:** Re-invita el bot usando el link de arriba

### Error: "Unknown interaction"
**Causa:** Los slash commands no están sincronizados
**Solución:** Ya ejecutamos `node register-commands.js`, espera 5-10 minutos

### Bot no responde a comandos de texto (!testwelcome)
**Causa:** MESSAGE CONTENT INTENT no está habilitado
**Solución:** Habilítalo en Developer Portal → Bot → Privileged Gateway Intents

### Welcome cards no se generan
**Causa:** El canal configurado no existe o el bot no tiene permisos
**Solución:** Verifica que `channelId` en config.json es correcto y el bot puede escribir ahí

---

## ✅ Una vez completado todo esto...

Ejecuta estos comandos en tu terminal:

```bash
# Inicia el bot
npm start

# Deberías ver este mensaje:
# ✅ Bot en línea como: Demon Hunter#1234
# 📜 Inicializando sistema de datos...
# ✅ Sistema de datos inicializado correctamente
```

Si ves esos mensajes, ¡todo está funcionando! 🎉

Ahora ve a Discord y prueba:
- `/testwelcome` - Debe generar una tarjeta de bienvenida
- `/help` - Debe mostrar el menú de ayuda
- `!testwelcome` - Versión de texto del comando

---

**Documento generado:** 2025-01-13
**Bot ID:** 1437866826859282452
**Estado:** Listo para configuración manual en Discord Portal

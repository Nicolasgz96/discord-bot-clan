# Cómo Iniciar el Bot - Guía Rápida

## ⚠️ PRIMERO: Habilitar Intents (MUY IMPORTANTE)

Tu error "Used disallowed intents" se soluciona habilitando los intents privilegiados en Discord.

### Pasos (2 minutos):

1. **Abre el Discord Developer Portal**
   - Ve a: https://discord.com/developers/applications
   - Haz clic en tu aplicación de bot

2. **Habilita los Intents Privilegiados**
   - Haz clic en **"Bot"** en la barra lateral izquierda
   - Baja hasta **"Privileged Gateway Intents"**
   - Activa estos DOS toggles:
     - ✅ **SERVER MEMBERS INTENT** (REQUERIDO)
     - ✅ **MESSAGE CONTENT INTENT** (REQUERIDO)
   - Haz clic en **"Save Changes"** al final

3. **Listo!**
   - Ahora el bot funcionará correctamente

---

## 🚀 Iniciar el Bot

```bash
cd C:\Users\nico-\discord-bot
npm start
```

Deberías ver:
```
✓ Configuración validada exitosamente
✓ Bot en línea como TuBot#1234
✓ Sirviendo 1 servidores
✓ Función de bienvenida: Activada
```

---

## 🧪 Probar el Bot

En Discord, escribe:
```
!testwelcome
```

El bot generará una tarjeta de bienvenida de prueba con:
- Tu avatar
- "Bienvenido"
- Tu nombre de usuario
- "a [Nombre del Servidor]"
- Tu imagen de fondo personalizada

---

## 🎨 Tu Configuración Actual

Tu imagen de fondo está configurada como:
```
https://i.imgur.com/4FNd3Nz.png
```

Si quieres cambiarla, edita `config.json`:
```json
"backgroundImage": "https://i.imgur.com/TU_IMAGEN_AQUI.png"
```

---

## 🔧 Solución de Problemas

### Error: "Used disallowed intents"
- **Solución**: Sigue los pasos de arriba para habilitar los intents en el Developer Portal

### Error: "Canal de bienvenida no encontrado"
- **Solución**: Verifica que el `channelId` en `config.json` sea correcto
- Cómo obtener el ID:
  1. Activa "Modo Desarrollador" en Discord (Ajustes → Avanzado → Modo Desarrollador)
  2. Click derecho en el canal → Copiar ID
  3. Pega el ID en `config.json`

### La imagen de fondo no carga
- **Solución**: Asegúrate de que la URL sea un enlace directo a la imagen (debe terminar en .png, .jpg, etc.)
- Ejemplo correcto: `https://i.imgur.com/4FNd3Nz.png`
- Ejemplo incorrecto: `https://imgur.com/a/W3RaKr6` (es un álbum, no una imagen)

### Cooldown del comando
- El comando `!testwelcome` tiene un cooldown de 5 segundos
- Si lo usas muy rápido, verás: "⏱️ Por favor espera X segundos antes de usar este comando de nuevo."
- Esto es normal y previene spam

---

## 📝 Notas Importantes

- **Todos los mensajes están en español** - tanto los mensajes del bot como los mensajes de consola
- **La tarjeta dice "Bienvenido"** en lugar de "Welcome"
- **Rate limiting activado** - previene spam (5 segundos de cooldown)
- **Validación de configuración** - el bot verifica tu config.json al iniciar
- **Reintentos automáticos** - si Discord falla, el bot reintenta automáticamente

---

## ✅ Lista de Verificación

Antes de que el bot funcione, verifica:

- [ ] Intents habilitados en Discord Developer Portal
- [ ] Token del bot en `.env`
- [ ] ID del canal de bienvenida correcto en `config.json`
- [ ] URL de imagen de fondo válida
- [ ] Bot invitado al servidor con permisos:
  - Enviar Mensajes
  - Adjuntar Archivos
  - Leer Mensajes/Ver Canales

---

## 🎉 ¡Disfruta tu Bot!

Una vez que hayas habilitado los intents, el bot funcionará perfectamente.

**Comando de prueba**: `!testwelcome`

**Funcionalidad automática**: Cuando alguien se una al servidor, recibirá automáticamente una tarjeta de bienvenida en el canal configurado.

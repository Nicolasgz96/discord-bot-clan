# 📋 Instrucciones para que los Comandos Aparezcan Inmediatamente

## ⚠️ Problema
Los comandos slash pueden tardar **hasta 1 hora** en aparecer cuando se registran globalmente en Discord.

## ✅ Solución: Registro en Servidor Específico

Para que los comandos aparezcan **INMEDIATAMENTE**, regístralos en un servidor específico:

### Paso 1: Obtener el ID del Servidor (Guild ID)

1. Abre Discord
2. Ve a **Configuración de Usuario** → **Avanzado**
3. Activa **"Modo Desarrollador"**
4. Haz clic derecho en tu servidor → **"Copiar ID"**

### Paso 2: Agregar GUILD_ID al .env

Abre tu archivo `.env` y agrega:

```env
DISCORD_TOKEN=tu_token_aqui
CLIENT_ID=tu_client_id_aqui
GUILD_ID=tu_guild_id_aqui  # ← Agrega esta línea
```

### Paso 3: Ejecutar el Script de Registro en Servidor

```bash
node register-commands-guild.js
```

**¡Listo!** Los comandos aparecerán **inmediatamente** en ese servidor.

---

## 📝 Comandos Disponibles (23 total)

### Bienvenida y Ayuda
- `/testwelcome` - Vista previa de tarjeta de bienvenida
- `/help` - Lista de comandos

### Moderación
- `/borrarmsg` - Elimina mensajes de un usuario
- `/deshacerborrado` - Restaura mensajes eliminados

### Voz / TTS
- `/join` - Bot se une a voz y lee mensajes
- `/hablar <texto>` - Text-to-speech en español
- `/salir` - Desconecta el bot de voz

### Honor y Rangos
- `/honor [@usuario]` - Ver honor y progreso
- `/rango` - Info del sistema de rangos
- `/top` - Ranking de honor (top 10)

### Economía
- `/daily` - Recompensa diaria de koku
- `/balance` o `/bal` - Ver balance
- `/pay` o `/pagar` - Transferir koku
- `/leaderboard` o `/lb` - Rankings

### Clanes
- `/clan crear` - Crear clan
- `/clan info` - Info de clan
- `/clan unirse` - Unirse a clan
- `/clan salir` - Salir de clan
- `/clan miembros` - Lista de miembros
- `/clan top` - Ranking de clanes
- `/clan invitar` - Invitar usuario
- `/clan expulsar` - Expulsar miembro

### Interactivos
- `/duelo @usuario` - Desafiar a duelo
- `/sabiduria` - Citas samurai
- `/fortuna` - Fortuna del día
- `/perfil [@usuario]` - Ver perfil

### Utilidades
- `/traducir` - Traducir texto

---

## 🔄 Si los Comandos No Aparecen

1. **Reinicia Discord completamente** (cierra y vuelve a abrir)
2. **Espera 5-10 minutos** (a veces tarda un poco)
3. **Verifica que el bot esté en el servidor** y tenga permisos
4. **Usa el registro en servidor específico** (más rápido)

---

## 📌 Notas Importantes

- Los comandos **globales** pueden tardar hasta 1 hora
- Los comandos **en servidor específico** aparecen inmediatamente
- Siempre reinicia Discord después de registrar comandos
- El bot debe estar **en línea** para que los comandos funcionen

---

## 🛠️ Scripts Disponibles

- `register-commands.js` - Registra comandos globalmente (lento)
- `register-commands-guild.js` - Registra en servidor específico (rápido)


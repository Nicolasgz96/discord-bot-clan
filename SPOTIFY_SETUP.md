# 🎵 Configuración de Spotify API para el Bot

## ¿Por qué necesito esto?

Para que el bot pueda reproducir **playlists y albums de Spotify**, necesitas credenciales de la API oficial de Spotify. Esto permite:

- ✅ Playlists completas de Spotify (hasta 100 canciones)
- ✅ Albums completos de Spotify
- ✅ Canciones individuales de Spotify

**Nota:** Las **canciones individuales** de Spotify ya funcionan sin estas credenciales (usan oEmbed). Solo necesitas esto para **playlists y albums**.

---

## Paso 1: Crear una App en Spotify

1. Ve a **Spotify Developer Dashboard**: https://developer.spotify.com/dashboard

2. **Inicia sesión** con tu cuenta de Spotify (cualquier cuenta gratuita funciona)

3. Click en **"Create app"** (botón verde en la esquina superior derecha)

4. Rellena el formulario:
   - **App name:** `Demon Hunter Bot` (o el nombre que quieras)
   - **App description:** `Discord music bot`
   - **Website:** Puedes poner `https://github.com/tu-usuario/discord-bot-clan` o cualquier URL
   - **Redirect URIs:** Deja vacío (no lo necesitamos)
   - **Which API/SDKs are you planning to use?** Marca **"Web API"**
   - Acepta los términos de servicio

5. Click en **"Save"**

---

## Paso 2: Obtener las Credenciales

1. Una vez creada la app, verás tu **Dashboard**

2. Haz click en **"Settings"** (botón en la esquina superior derecha)

3. Verás dos campos importantes:
   - **Client ID** - Es un string largo tipo `a1b2c3d4e5f6...`
   - **Client secret** - Click en **"View client secret"** para verlo

4. **Copia ambos valores** (los necesitarás en el siguiente paso)

---

## Paso 3: Configurar el Bot

1. Abre tu archivo **`.env`** (si no existe, cópialo de `.env.example`)

2. Agrega las siguientes líneas:

```env
# Spotify API (Get from https://developer.spotify.com/dashboard)
SPOTIFY_CLIENT_ID=tu_client_id_aqui
SPOTIFY_CLIENT_SECRET=tu_client_secret_aqui
```

3. Reemplaza los valores con tus credenciales reales

4. **Reinicia el bot:**
   ```bash
   npm start
   ```

---

## Verificación

Una vez configurado, cuando uses `/tocar` con una **playlist o album de Spotify**, deberías ver en la consola:

```
🔑 [Spotify] Obteniendo nuevo access token...
✅ [Spotify] Access token obtenido
🔍 [Spotify] Obteniendo playlist usando API oficial: https://open.spotify.com/playlist/...
📥 [Spotify] Obteniendo tracks 1-100...
✅ [Spotify API] Extraídos X tracks de playlist ...
```

---

## ¿Qué pasa si no configuro esto?

- ❌ Las **playlists y albums de Spotify NO funcionarán**
- ✅ Las **canciones individuales de Spotify SÍ funcionarán** (usan oEmbed)
- ✅ Todo lo demás funciona normal (YouTube, búsquedas, etc.)

---

## Límites de la API

Spotify ofrece un plan **gratuito** con límites muy generosos:

- **Sin límite** de requests diarios para tu bot
- Las credenciales son **permanentes** (no expiran)
- Solo necesitas configurarlas **una vez**

---

## Problemas Comunes

### Error: "Credenciales de Spotify no configuradas"

**Solución:** Verifica que el archivo `.env` tenga las variables `SPOTIFY_CLIENT_ID` y `SPOTIFY_CLIENT_SECRET` correctamente escritas.

### Error: "Spotify Auth failed (401)"

**Solución:** Tus credenciales son incorrectas. Verifica que copiaste bien el Client ID y Client Secret desde el dashboard de Spotify.

### Error: "Spotify API error (403)"

**Solución:** Tu app de Spotify puede estar en modo "Development". Esto es normal y no afecta el funcionamiento del bot.

---

## Soporte

Si tienes problemas, verifica:

1. Que las credenciales estén en el archivo `.env` (no `.env.example`)
2. Que no haya espacios extra al copiar las credenciales
3. Que reiniciaste el bot después de agregar las credenciales
4. Que la URL de Spotify sea válida y pública

¡Listo! Ahora tu bot puede reproducir cualquier playlist o album de Spotify 🎵

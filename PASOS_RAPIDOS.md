# 🚀 Pasos Rápidos - Oracle Cloud

Guía express para hostear tu bot en Oracle Cloud (30 minutos).

## 📋 Lo Que Necesitas

- [ ] Cuenta de Oracle Cloud (crear en: https://www.oracle.com/cloud/free/)
- [ ] Tarjeta de crédito/débito para verificación (no te cobran)
- [ ] Tu token de Discord
- [ ] El ID del canal de bienvenida

---

## 🎯 Pasos Principales

### 1️⃣ Crear Cuenta de Oracle Cloud (10 min)

1. Ve a: https://www.oracle.com/cloud/free/
2. Click "Start for free"
3. Completa el registro
4. **Importante**: Elige región cerca de ti (no se puede cambiar después)
   - Para Latinoamérica: `Brazil East (Sao Paulo)` o `US East (Ashburn)`
5. Verifica con tarjeta (no te cobran)
6. Espera activación (~10 min)

### 2️⃣ Crear Máquina Virtual (5 min)

1. En Oracle Cloud Dashboard → **"Create a VM instance"**
2. **Nombre**: `discord-bot`
3. **Shape**: Click "Change Shape"
   - Selecciona: **"Ampere"**
   - Tipo: **VM.Standard.A1.Flex**
   - OCPU: **2**
   - Memory: **12 GB**
4. **Image**: Click "Change Image"
   - Selecciona: **Ubuntu 22.04**
5. **SSH Keys**: Click "Generate a key pair for me"
   - **MUY IMPORTANTE**: Descarga y guarda `oracle-key.pem`
6. Click **"Create"**
7. **Anota la IP pública** que aparece (ejemplo: 132.145.xxx.xxx)

### 3️⃣ Conectarse al Servidor (2 min)

**En tu WSL/Terminal:**

```bash
# Copiar la clave SSH
cp /mnt/c/Users/TU_USUARIO/Downloads/oracle-key.pem ~/

# Cambiar permisos
chmod 400 ~/oracle-key.pem

# Conectarse
ssh -i ~/oracle-key.pem ubuntu@TU_IP_PUBLICA
```

**Primera vez**: Dirá "authenticity can't be established" → Escribe `yes`

### 4️⃣ Copiar Archivos del Bot (3 min)

**En otra terminal (en tu máquina local):**

```bash
# Navegar a tu carpeta del bot
cd /mnt/c/Users/nico-/discord-bot

# Copiar TODO al servidor
scp -i ~/oracle-key.pem -r * ubuntu@TU_IP_PUBLICA:/home/ubuntu/discord-bot/
```

### 5️⃣ Instalar el Bot (5 min)

**De vuelta en la terminal SSH (conectado al servidor):**

```bash
# Ir a la carpeta del bot
cd /home/ubuntu/discord-bot

# Dar permisos al script
chmod +x install.sh

# Ejecutar instalación (esto hace TODO automáticamente)
./install.sh
```

**El script preguntará cosas, simplemente:**
1. Espera a que instale Node.js y dependencias
2. Cuando diga "Presiona Enter cuando hayas copiado los archivos" → Presiona Enter (ya los copiaste)
3. Cuando pida editar `.env`:
   ```bash
   nano .env
   ```
   - Agrega tu `DISCORD_TOKEN=tu_token_aqui`
   - Agrega tu `CLIENT_ID=tu_client_id_aqui`
   - Guarda: `Ctrl + O`, Enter, `Ctrl + X`
4. Presiona Enter para continuar
5. ¡Listo! El bot se inicia automáticamente

### 6️⃣ Verificar que Funciona (1 min)

**En el servidor:**

```bash
# Ver estado del bot
sudo systemctl status discord-bot
```

Deberías ver:
```
● discord-bot.service - Discord Welcome Bot
   Active: active (running)
```

**Ver logs en vivo:**

```bash
sudo journalctl -u discord-bot -f
```

Deberías ver:
```
✓ Configuración validada exitosamente
✓ Bot en línea como TuBot#1234
✓ Sirviendo 1 servidores
✓ Función de bienvenida: Activada
```

**Presiona `Ctrl + C` para salir de los logs**

### 7️⃣ Probar en Discord

1. Ve a tu servidor de Discord
2. El bot debe aparecer **ONLINE** ✅
3. Escribe: `!testwelcome`
4. Deberías recibir la tarjeta de bienvenida

### 8️⃣ Desconectarse

```bash
exit
```

**El bot sigue corriendo 24/7** incluso después de que te desconectes. 🎉

---

## 🛠️ Comandos Útiles (Para Después)

### Ver Estado del Bot

```bash
# Conectarse
ssh -i ~/oracle-key.pem ubuntu@TU_IP

# Ver estado
sudo systemctl status discord-bot

# Ver logs en vivo
sudo journalctl -u discord-bot -f
```

### Actualizar el Bot

**Cuando cambies algo en tu código local:**

```bash
# 1. Copiar archivos nuevos
cd /mnt/c/Users/nico-/discord-bot
scp -i ~/oracle-key.pem index.js utils/welcomeCard.js ubuntu@TU_IP:/home/ubuntu/discord-bot/

# 2. Conectar y reiniciar
ssh -i ~/oracle-key.pem ubuntu@TU_IP
cd /home/ubuntu/discord-bot
sudo systemctl restart discord-bot
```

O usa el script:
```bash
./update-bot.sh
```

### Reiniciar el Bot

```bash
sudo systemctl restart discord-bot
```

### Ver Logs Completos

```bash
# Últimos 100 logs
sudo journalctl -u discord-bot -n 100

# Ver archivo de log
tail -f /home/ubuntu/discord-bot/bot.log
```

---

## ❓ Problemas Comunes

### No puedo conectarme por SSH

```bash
# Verificar permisos de la clave
chmod 400 ~/oracle-key.pem

# Verificar que la IP es correcta
# Ve a Oracle Cloud Console y verifica la IP pública
```

### El bot no inicia

```bash
# Ver el error exacto
sudo journalctl -u discord-bot -n 50
```

Causas comunes:
- `.env` no tiene el token correcto
- `config.json` tiene un channel ID inválido
- Olvidaste habilitar los intents en Discord Developer Portal

### Bot se detiene solo

```bash
# Verificar que el servicio está habilitado
sudo systemctl is-enabled discord-bot

# Si dice "disabled", habilitarlo:
sudo systemctl enable discord-bot
```

---

## ✅ Checklist Final

- [ ] Cuenta de Oracle Cloud creada
- [ ] VM creada (Ampere, Ubuntu 22.04)
- [ ] Clave SSH descargada y guardada
- [ ] Conectado por SSH exitosamente
- [ ] Archivos copiados al servidor
- [ ] `install.sh` ejecutado
- [ ] `.env` configurado con tu token
- [ ] Bot muestra "active (running)" en status
- [ ] Bot aparece online en Discord
- [ ] `!testwelcome` funciona

---

## 🎉 ¡Felicidades!

Tu bot está funcionando 24/7 completamente gratis en Oracle Cloud.

**Para más detalles**, lee: `ORACLE_CLOUD_SETUP.md`

**Para soporte técnico detallado**, lee: `COMO_INICIAR.md`

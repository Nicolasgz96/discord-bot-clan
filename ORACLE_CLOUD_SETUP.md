# Guía Completa: Hostear Bot en Oracle Cloud GRATIS 24/7

Oracle Cloud ofrece **2 VMs ARM gratuitas para siempre** - perfecto para tu bot de Discord funcionando 24/7 sin pagar nunca.

## ✨ Lo Que Obtienes GRATIS

- ✅ 2 máquinas virtuales ARM (Ampere A1)
- ✅ 24 GB RAM total (puedes usar 12GB en cada VM)
- ✅ 200 GB de almacenamiento
- ✅ **Gratis para siempre** (no es prueba, es permanente)
- ✅ 24/7 sin interrupciones
- ✅ IP pública incluida

---

## 📋 Parte 1: Crear Cuenta en Oracle Cloud

### Paso 1: Registrarse

1. Ve a: https://www.oracle.com/cloud/free/
2. Click en **"Start for free"**
3. Ingresa:
   - Tu email
   - País (selecciona tu país real)
   - Nombre completo

4. **Verificación de email**: Revisa tu correo y verifica

5. **Información de la cuenta**:
   - Nombre de usuario único
   - Contraseña segura
   - Home Region (IMPORTANTE: Elige una región cerca de ti - **NO PODRÁS CAMBIARLA**)
     - Para Latinoamérica: `Brazil East (Sao Paulo)` o `US East (Ashburn)`

6. **Verificación de identidad**:
   - Requiere tarjeta de crédito/débito para verificación
   - **NO TE COBRARÁN** mientras uses solo los recursos gratuitos
   - Es solo para verificar que no eres un bot

7. Espera 5-10 minutos mientras Oracle activa tu cuenta

### Paso 2: Acceder al Dashboard

1. Ve a: https://cloud.oracle.com/
2. Ingresa tu **Cloud Account Name** (te lo dieron al registrarte)
3. Click en **Continue**
4. Ingresa tu usuario y contraseña
5. Llegarás al **Oracle Cloud Dashboard**

---

## 🖥️ Parte 2: Crear la Máquina Virtual (VM)

### Paso 1: Crear Instancia de Compute

1. En el dashboard, click en **"Create a VM instance"** o ve a:
   - Menú hamburguesa (☰) → **Compute** → **Instances**

2. Click en **"Create Instance"**

### Paso 2: Configurar la Instancia

**Nombre:**
- Escribe: `discord-bot` (o el nombre que quieras)

**Placement:**
- Deja por defecto (la región que elegiste)

**Image and shape:**
1. Click en **"Edit"** en la sección "Image and shape"

2. **Shape**:
   - Click en **"Change Shape"**
   - Selecciona: **"Ampere"** (arquitectura ARM)
   - Selecciona: **VM.Standard.A1.Flex**
   - Configura:
     - **OCPU count:** 2 (o menos si quieres ahorrar para otra VM)
     - **Memory (GB):** 12 (o 6 si usas 1 OCPU)
   - Click **"Select Shape"**

3. **Image**:
   - Click en **"Change Image"**
   - Selecciona: **Ubuntu** (Canonical Ubuntu)
   - Versión: **22.04** (la más reciente LTS)
   - Click **"Select Image"**

**Networking:**
- Deja todo por defecto
- Asegúrate que **"Assign a public IPv4 address"** esté marcado ✅

**Add SSH keys:**
- Aquí tienes 2 opciones:

  **Opción A - Generar nuevo par de claves (Recomendado si no tienes):**
  1. Selecciona **"Generate a key pair for me"**
  2. Click en **"Save Private Key"** - DESCARGA Y GUARDA ESTE ARCHIVO
  3. Guarda el archivo como `oracle-key.pem` en un lugar seguro
  4. Click en **"Save Public Key"** también (opcional pero recomendado)

  **Opción B - Usar clave existente:**
  1. Selecciona **"Upload public key files"**
  2. Sube tu archivo `.pub`

**Boot volume:**
- Deja por defecto (50 GB es más que suficiente)

### Paso 3: Crear la Instancia

1. Click en **"Create"** al final de la página
2. Espera 1-2 minutos mientras se crea
3. Verás el estado cambiar a: **RUNNING** (círculo verde)

### Paso 4: Anotar la IP Pública

1. En la página de la instancia, busca **"Public IP address"**
2. Anota esta IP - la necesitarás para conectarte
3. Ejemplo: `132.145.xxx.xxx`

---

## 🔐 Parte 3: Configurar Firewall

Oracle Cloud bloquea todos los puertos por defecto. Aunque no necesitas abrir puertos para el bot, aquí está cómo configurarlo:

### Paso 1: Abrir Puertos (Si es Necesario en el Futuro)

1. Ve a la página de tu instancia
2. Click en el **subnet** (debajo de "Primary VNIC")
3. Click en la **Security List** que aparece
4. Click en **"Add Ingress Rules"**

Para un bot de Discord, **NO necesitas abrir puertos** porque el bot se conecta a Discord (salida), no recibe conexiones.

---

## 🚀 Parte 4: Conectarse y Configurar el Bot

### Paso 1: Preparar la Clave SSH

**En Windows (WSL):**

```bash
# Copiar la clave a tu home de WSL
cp /mnt/c/Users/TU_USUARIO/Downloads/oracle-key.pem ~/

# Cambiar permisos (muy importante)
chmod 400 ~/oracle-key.pem
```

**En Windows (PowerShell - si no usas WSL):**

Descarga PuTTY y usa PuTTYgen para convertir `.pem` a `.ppk`, luego usa PuTTY para conectar.

### Paso 2: Conectarse a la VM

```bash
ssh -i ~/oracle-key.pem ubuntu@TU_IP_PUBLICA
```

Reemplaza `TU_IP_PUBLICA` con la IP que anotaste.

**Primera vez:**
- Dirá: "The authenticity of host... can't be established"
- Escribe: `yes` y presiona Enter

**Deberías ver:**
```
ubuntu@discord-bot:~$
```

¡Estás dentro! 🎉

### Paso 3: Copiar Archivos del Bot

**Desde tu máquina local (otra terminal):**

```bash
# Navega a tu carpeta del bot
cd /mnt/c/Users/nico-/discord-bot

# Copia todos los archivos a Oracle Cloud
scp -i ~/oracle-key.pem -r ./* ubuntu@TU_IP_PUBLICA:/home/ubuntu/
```

**Archivos que se copiarán:**
- `index.js`
- `config.json`
- `package.json`
- `utils/` (carpeta completa)
- `install.sh`
- `update-bot.sh`
- `discord-bot.service`

**NO copiar:**
- `node_modules/` (se instalará en el servidor)
- `.env` (lo crearás manualmente en el servidor por seguridad)

### Paso 4: Ejecutar Script de Instalación

**En la VM (conectado por SSH):**

```bash
# Dar permisos de ejecución al script
chmod +x install.sh

# Ejecutar instalación
./install.sh
```

El script hará:
1. ✅ Actualizar sistema
2. ✅ Instalar Node.js 20
3. ✅ Instalar dependencias del sistema
4. ✅ Instalar dependencias de npm
5. ✅ Crear archivo `.env`
6. ✅ Configurar servicio systemd
7. ✅ Iniciar el bot automáticamente

### Paso 5: Configurar Variables de Entorno

Cuando el script te lo pida:

```bash
nano .env
```

Edita el archivo:
```
DISCORD_TOKEN=tu_token_real_aqui
CLIENT_ID=tu_client_id_aqui
```

**Para guardar en nano:**
- Presiona `Ctrl + O` (guardar)
- Presiona `Enter`
- Presiona `Ctrl + X` (salir)

### Paso 6: Verificar que el Bot Funciona

```bash
# Ver estado del bot
sudo systemctl status discord-bot

# Ver logs en tiempo real
sudo journalctl -u discord-bot -f

# Salir de logs: Ctrl + C
```

**Deberías ver:**
```
✓ Configuración validada exitosamente
✓ Bot en línea como TuBot#1234
✓ Sirviendo 1 servidores
✓ Función de bienvenida: Activada
```

---

## 🛠️ Comandos Útiles

### Gestión del Bot

```bash
# Ver estado
sudo systemctl status discord-bot

# Reiniciar bot
sudo systemctl restart discord-bot

# Detener bot
sudo systemctl stop discord-bot

# Iniciar bot
sudo systemctl start discord-bot

# Ver logs en vivo
sudo journalctl -u discord-bot -f

# Ver últimos 50 logs
sudo journalctl -u discord-bot -n 50

# Ver archivo de log
tail -f /home/ubuntu/discord-bot/bot.log
```

### Actualizar el Bot

Cuando hagas cambios en tu código local:

**1. En tu máquina local:**
```bash
cd /mnt/c/Users/nico-/discord-bot
scp -i ~/oracle-key.pem index.js ubuntu@TU_IP:/home/ubuntu/discord-bot/
scp -i ~/oracle-key.pem config.json ubuntu@TU_IP:/home/ubuntu/discord-bot/
scp -i ~/oracle-key.pem -r utils/ ubuntu@TU_IP:/home/ubuntu/discord-bot/
```

**2. En el servidor:**
```bash
# Opción fácil - usa el script
./update-bot.sh

# O manualmente:
sudo systemctl restart discord-bot
```

### Gestión del Servidor

```bash
# Ver uso de recursos
htop  # (si no está instalado: sudo apt install htop)

# Ver uso de disco
df -h

# Ver memoria
free -h

# Reiniciar servidor
sudo reboot
```

---

## 🔒 Seguridad

### Actualizar Sistema Regularmente

```bash
# Conectarse al servidor
ssh -i ~/oracle-key.pem ubuntu@TU_IP

# Actualizar
sudo apt update && sudo apt upgrade -y
```

### Configurar Actualizaciones Automáticas (Opcional)

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 🐛 Solución de Problemas

### El bot no se inicia

```bash
# Ver logs completos
sudo journalctl -u discord-bot -n 100

# Ver errores específicos
tail -f /home/ubuntu/discord-bot/bot-error.log
```

### Error de permisos

```bash
# Asegurarte que ubuntu sea el dueño
sudo chown -R ubuntu:ubuntu /home/ubuntu/discord-bot
```

### Bot se detiene después de un tiempo

```bash
# Verificar que el servicio esté habilitado
sudo systemctl is-enabled discord-bot

# Si dice "disabled", habilitarlo:
sudo systemctl enable discord-bot
```

### No puedo conectarme por SSH

1. Verifica que la IP es correcta
2. Verifica que la clave `.pem` tiene permisos 400:
   ```bash
   chmod 400 ~/oracle-key.pem
   ```
3. Verifica que la instancia está RUNNING en Oracle Cloud Console

### La instancia fue "parada" por Oracle

Oracle puede parar instancias ARM si:
- No usas recursos por 7+ días (idle)
- **Solución**: Conéctate por SSH al menos una vez a la semana, o configura un cron job que haga algo ligero

```bash
# Agregar cron job para mantener actividad (cada 6 días)
crontab -e

# Agregar esta línea:
0 0 */6 * * echo "keepalive" >> /home/ubuntu/keepalive.log
```

---

## 📊 Monitoreo

### Ver Estadísticas en Oracle Cloud

1. Ve a tu instancia en Oracle Cloud Console
2. Click en **"Metrics"**
3. Verás:
   - Uso de CPU
   - Uso de memoria
   - Tráfico de red

---

## ✅ Checklist Final

Verifica que todo esté correcto:

- [ ] Cuenta de Oracle Cloud creada
- [ ] VM creada y en estado RUNNING
- [ ] Conectado por SSH exitosamente
- [ ] Bot instalado (`install.sh` ejecutado)
- [ ] Archivo `.env` configurado con tu token
- [ ] `config.json` tiene tu channel ID correcto
- [ ] Bot iniciado: `sudo systemctl status discord-bot` muestra "active (running)"
- [ ] Bot aparece online en Discord
- [ ] Comando `!testwelcome` funciona en Discord
- [ ] Servicio habilitado para auto-start: `sudo systemctl is-enabled discord-bot` muestra "enabled"

---

## 🎉 ¡Listo!

Tu bot ahora está funcionando 24/7 en Oracle Cloud **completamente gratis**.

**Características:**
- ✅ Se inicia automáticamente si el servidor se reinicia
- ✅ Se reinicia automáticamente si crashea
- ✅ Logs guardados automáticamente
- ✅ Gratis para siempre (no expira)

**Para verificar que funciona:**
1. Ve a Discord
2. Tu bot debe aparecer **online**
3. Escribe `!testwelcome` en un canal
4. Deberías recibir la tarjeta de bienvenida

**Para desconectarte del servidor:**
```bash
exit
```

El bot seguirá corriendo 24/7 incluso después de que te desconectes. 🚀

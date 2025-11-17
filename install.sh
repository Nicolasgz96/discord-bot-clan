#!/bin/bash
# Script de instalación automatizado para Oracle Cloud (Ubuntu ARM64)
# Este script instala Node.js, dependencias y configura el bot

set -e  # Salir si hay algún error

echo "================================================"
echo "  Instalación de Discord Bot - Oracle Cloud"
echo "================================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # Sin color

# Función para imprimir con color
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${BLUE}➜${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# 1. Actualizar sistema
print_info "Actualizando sistema..."
sudo apt update
sudo apt upgrade -y
print_success "Sistema actualizado"

# 2. Instalar Node.js 20.x (LTS)
print_info "Instalando Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
print_success "Node.js $(node --version) instalado"
print_success "npm $(npm --version) instalado"

# 3. Instalar dependencias del sistema para @napi-rs/canvas
print_info "Instalando dependencias del sistema..."
sudo apt install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
print_success "Dependencias del sistema instaladas"

# 4. Crear directorio para el bot
BOT_DIR="/home/ubuntu/discord-bot"
print_info "Creando directorio del bot en $BOT_DIR..."
mkdir -p "$BOT_DIR"
cd "$BOT_DIR"
print_success "Directorio creado"

# 5. Copiar archivos del bot (esto se hace manualmente después)
print_info "Ahora necesitas copiar los archivos del bot aquí"
echo ""
echo "Desde tu máquina local, ejecuta:"
echo "  scp -i tu-clave.pem -r /mnt/c/Users/nico-/discord-bot/* ubuntu@TU_IP_ORACLE:$BOT_DIR/"
echo ""
read -p "Presiona Enter cuando hayas copiado los archivos..."

# 6. Instalar dependencias de npm
print_info "Instalando dependencias de npm..."
npm install --production
print_success "Dependencias de npm instaladas"

# 7. Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    print_info "Creando archivo .env..."
    echo "DISCORD_TOKEN=" > .env
    echo "CLIENT_ID=" >> .env
    print_success "Archivo .env creado - DEBES EDITARLO CON TUS TOKENS"
    echo ""
    echo "Edita el archivo con: nano .env"
    echo "Agrega tu DISCORD_TOKEN y CLIENT_ID"
    echo ""
    read -p "Presiona Enter cuando hayas editado .env..."
fi

# 8. Crear servicio systemd para que el bot se ejecute automáticamente
print_info "Creando servicio systemd..."
sudo tee /etc/systemd/system/discord-bot.service > /dev/null <<EOF
[Unit]
Description=Discord Welcome Bot
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=$BOT_DIR
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
StandardOutput=append:/home/ubuntu/discord-bot/bot.log
StandardError=append:/home/ubuntu/discord-bot/bot-error.log

# Variables de entorno
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
print_success "Servicio systemd creado"

# 9. Habilitar e iniciar el servicio
print_info "Habilitando servicio..."
sudo systemctl daemon-reload
sudo systemctl enable discord-bot.service
print_success "Servicio habilitado (se iniciará automáticamente al reiniciar)"

print_info "Iniciando bot..."
sudo systemctl start discord-bot.service
print_success "Bot iniciado"

# 10. Verificar estado
echo ""
echo "================================================"
echo "  ¡Instalación Completada!"
echo "================================================"
echo ""
print_success "El bot está corriendo 24/7"
echo ""
echo "Comandos útiles:"
echo "  Ver estado:        sudo systemctl status discord-bot"
echo "  Ver logs en vivo:  sudo journalctl -u discord-bot -f"
echo "  Detener bot:       sudo systemctl stop discord-bot"
echo "  Reiniciar bot:     sudo systemctl restart discord-bot"
echo "  Ver logs del bot:  tail -f $BOT_DIR/bot.log"
echo ""

# Verificar estado actual
sleep 2
sudo systemctl status discord-bot --no-pager

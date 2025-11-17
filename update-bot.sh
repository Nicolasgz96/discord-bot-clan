#!/bin/bash
# Script para actualizar el bot en Oracle Cloud
# Uso: ./update-bot.sh

set -e

echo "================================================"
echo "  Actualizando Discord Bot"
echo "================================================"
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${BLUE}➜${NC} $1"
}

BOT_DIR="/home/ubuntu/discord-bot"
cd "$BOT_DIR"

# 1. Detener el bot
print_info "Deteniendo bot..."
sudo systemctl stop discord-bot
print_success "Bot detenido"

# 2. Hacer backup del .env actual
print_info "Haciendo backup de .env..."
cp .env .env.backup
print_success "Backup creado (.env.backup)"

# 3. Actualizar archivos
# (Los archivos se deben copiar antes con scp)
print_info "Asegúrate de haber copiado los archivos nuevos con scp"
echo "Comando: scp -i tu-clave.pem -r /mnt/c/Users/nico-/discord-bot/* ubuntu@TU_IP:$BOT_DIR/"
read -p "Presiona Enter cuando hayas copiado los archivos..."

# 4. Restaurar .env si fue sobrescrito
if [ -f ".env.backup" ]; then
    print_info "Restaurando .env..."
    cp .env.backup .env
    print_success ".env restaurado"
fi

# 5. Instalar nuevas dependencias (si las hay)
print_info "Instalando/actualizando dependencias..."
npm install --production
print_success "Dependencias actualizadas"

# 6. Reiniciar el bot
print_info "Iniciando bot..."
sudo systemctl start discord-bot
print_success "Bot iniciado"

# 7. Verificar estado
sleep 2
echo ""
print_success "Actualización completada"
echo ""
echo "Estado del bot:"
sudo systemctl status discord-bot --no-pager

echo ""
echo "Ver logs en tiempo real: sudo journalctl -u discord-bot -f"

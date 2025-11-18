const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { AttachmentBuilder } = require('discord.js');
const config = require('../config.json');
const COLORS = require('../src/config/colors');

// === Color para cubrir letras japonesas / fondo oscuro ===
// Cambiá por '#2C2F33' si querés el tono gris oscuro de Discord.
const COVER_COLOR = '#0A0F1A';

// Canvas configuration constants
const CANVAS_CONFIG = {
  WIDTH: 1024,
  HEIGHT: 500,
  AVATAR: {
    SIZE: 80,  // Un poco más pequeño
    BORDER_WIDTH: 5,
    REQUESTED_SIZE: 128,
  },
  ACCENT: {
    LINE_WIDTH: 8,
    CURVE_RADIUS: 60,
  },
  TEXT_POSITIONS: {
    MEMBER_COUNT_Y: 40,
    // Posiciones para el grupo de avatar + textos (ajustado para no cortar)
    GROUP_Y: 455,  // Posición vertical del grupo - sin cortar el avatar
    AVATAR_LEFT: 320,  // Avatar más a la izquierda
    TEXT_LEFT: 420,    // Texto a la derecha del avatar
    USERNAME_OFFSET: -15,  // Username arriba
    SERVER_OFFSET: 25,     // Servidor abajo
  },
};

/**
 * Creates a personalized welcome card for a new member
 * @param {GuildMember} member - The Discord guild member who joined
 * @param {Object} userData - Optional user data with custom background
 * @returns {Promise<AttachmentBuilder>} - The welcome card as a Discord attachment
 */
async function createWelcomeCard(member, userData = null) {
  const canvas = createCanvas(CANVAS_CONFIG.WIDTH, CANVAS_CONFIG.HEIGHT);
  const ctx = canvas.getContext('2d');
  const cardConfig = config.welcome.card;

  try {
    // 1) Fondo (check for custom background first)
    const customBackground = userData?.customization?.backgroundUrl;
    await drawBackground(ctx, cardConfig, customBackground);

    // 2) Panel inferior de cobertura (tapa las letras japonesas del arte)
    drawBottomCoverPanel(ctx);
    drawAccentDecoration(ctx, cardConfig);

    // 3) Acentos y contenido
    drawAccentDecoration(ctx, cardConfig);
    drawMemberCount(ctx, member, cardConfig);
    await drawAvatar(ctx, member, cardConfig);
    drawWelcomeText(ctx, member, cardConfig);

  } catch (error) {
    console.error('❌ Error creando tarjeta de bienvenida:', error.message);
    throw error;
  }

  // Convert canvas to buffer
  const buffer = canvas.toBuffer('image/png');
  return new AttachmentBuilder(buffer, { name: 'welcome-card.png' });
}

/**
 * Draws the background image (stretched to fill canvas)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} cardConfig - Card configuration
 * @param {string} customBackground - Optional custom background URL (takes priority)
 */
async function drawBackground(ctx, cardConfig, customBackground = null) {
  // Priority: custom background > config background > solid color
  const backgroundUrl = customBackground || cardConfig.backgroundImage;

  if (backgroundUrl) {
    try {
      const background = await loadImage(backgroundUrl);
      // Stretch image to fill entire canvas
      ctx.drawImage(background, 0, 0, CANVAS_CONFIG.WIDTH, CANVAS_CONFIG.HEIGHT);
      return;
    } catch (error) {
      console.warn(`⚠️ No se pudo cargar la imagen de fondo: ${error.message}`);
      console.warn('Usando color sólido de respaldo');
    }
  }

  // Fallback a color sólido
  ctx.fillStyle = cardConfig.backgroundColor || COVER_COLOR;
  ctx.fillRect(0, 0, CANVAS_CONFIG.WIDTH, CANVAS_CONFIG.HEIGHT);
}

/**
 * Draws gradient overlay for better text visibility
 */
function drawGradientOverlay(ctx) {
  // Degradado de arriba a abajo (MUY transparente arriba, más oscuro abajo)
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_CONFIG.HEIGHT);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.05)');    // Top - casi invisible
  gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.1)');   // Medio - muy transparente
  gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0.5)');  // Abajo - más oscuro
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');     // Bottom - oscuro para texto

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_CONFIG.WIDTH, CANVAS_CONFIG.HEIGHT);
}

/**
 * Panel inferior para cubrir texto/arte del fondo (letras japonesas)
 */
function drawBottomCoverPanel(ctx) {
  // Área detrás del avatar y el texto (centrada donde aparecen las letras japonesas)
  const groupY = CANVAS_CONFIG.TEXT_POSITIONS.GROUP_Y;
  const avatarX = CANVAS_CONFIG.TEXT_POSITIONS.AVATAR_LEFT;
  const textX = CANVAS_CONFIG.TEXT_POSITIONS.TEXT_LEFT;

  // Calculamos un rectángulo que cubra el fondo entre el avatar y el texto
  const paddingY = 60; // alto del bloque para cubrir todo el texto japonés
  const paddingX = 60; // margen horizontal
  const startX = avatarX - paddingX; // un poco antes del avatar
  const width = (textX + 280) - startX; // cubre avatar + texto hasta un poco después
  const startY = groupY - 50; // un poco más arriba del grupo
  const height = 180; // suficiente para cubrir letras y área de texto

  ctx.save();
  ctx.fillStyle = '#05080D'; // color oscuro
  ctx.globalAlpha = 0.95; // leve transparencia
  ctx.beginPath();
  ctx.roundRect(startX, startY, width, height, 25); // bordes redondeados suaves
  ctx.fill();
  ctx.restore();
}

/**
 * Draws accent decorations in corners
 */
function drawAccentDecoration(ctx, cardConfig) {
  const { LINE_WIDTH, CURVE_RADIUS } = CANVAS_CONFIG.ACCENT;
  const margin = 30;

  // Color del acento
  ctx.strokeStyle = cardConfig.accentColor || '#00D9FF';
  ctx.lineWidth = LINE_WIDTH;
  ctx.lineCap = 'round';

  // Agregar sombra a los acentos
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Top-left corner accent
  ctx.beginPath();
  ctx.arc(margin + CURVE_RADIUS, margin + CURVE_RADIUS, CURVE_RADIUS, Math.PI, Math.PI * 1.5);
  ctx.stroke();

  // Bottom-right corner accent
  ctx.beginPath();
  ctx.arc(
    CANVAS_CONFIG.WIDTH - margin - CURVE_RADIUS,
    CANVAS_CONFIG.HEIGHT - margin - CURVE_RADIUS,
    CURVE_RADIUS,
    0,
    Math.PI * 0.5
  );
  ctx.stroke();

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

/**
 * Draws the member count at the very top
 */
function drawMemberCount(ctx, member, cardConfig) {
  const memberCount = member.guild.memberCount;
  const text = `Miembro #${memberCount.toLocaleString()}`;

  ctx.font = `bold 26px ${cardConfig.font || 'sans-serif'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Borde negro para el texto
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.lineWidth = 6;
  ctx.strokeText(text, CANVAS_CONFIG.WIDTH / 2, CANVAS_CONFIG.TEXT_POSITIONS.MEMBER_COUNT_Y);

  // Sombra fuerte
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Texto principal
  ctx.fillStyle = cardConfig.memberCountColor || '#FFFFFF';
  ctx.fillText(text, CANVAS_CONFIG.WIDTH / 2, CANVAS_CONFIG.TEXT_POSITIONS.MEMBER_COUNT_Y);

  // Reset
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

/**
 * Draws the member's avatar (a la izquierda, centrado con los textos)
 */
async function drawAvatar(ctx, member, cardConfig) {
  const { SIZE, BORDER_WIDTH, REQUESTED_SIZE } = CANVAS_CONFIG.AVATAR;
  const avatarX = CANVAS_CONFIG.TEXT_POSITIONS.AVATAR_LEFT;
  const avatarY = CANVAS_CONFIG.TEXT_POSITIONS.GROUP_Y - (SIZE / 2);

  try {
    const avatarURL = member.user.displayAvatarURL({
      extension: 'png',
      size: REQUESTED_SIZE
    });
    const avatar = await loadImage(avatarURL);

    // --- Disco de cobertura detrás del avatar (por si el fondo tiene texto) ---
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      avatarX + SIZE / 2,
      avatarY + SIZE / 2,
      SIZE / 2 + BORDER_WIDTH + 10,
      0, Math.PI * 2
    );
    ctx.closePath();
    ctx.fillStyle = COVER_COLOR;
    ctx.fill();
    ctx.restore();

    // Sombra general del avatar
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;

    // Borde externo con degradado
    ctx.beginPath();
    ctx.arc(
      avatarX + SIZE / 2,
      avatarY + SIZE / 2,
      SIZE / 2 + BORDER_WIDTH,
      0,
      Math.PI * 2
    );

    const borderGradient = ctx.createLinearGradient(
      avatarX,
      avatarY,
      avatarX + SIZE,
      avatarY + SIZE
    );
    borderGradient.addColorStop(0, COLORS.PRIMARY);   // Azul samurai del logo
    borderGradient.addColorStop(0.5, COLORS.ELECTRIC); // Azul eléctrico
    borderGradient.addColorStop(1, COLORS.WHITE);     // Blanco

    ctx.fillStyle = borderGradient;
    ctx.fill();
    ctx.closePath();

    ctx.restore();

    // Clip circular y dibujar avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + SIZE / 2, avatarY + SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(avatar, avatarX, avatarY, SIZE, SIZE);
    ctx.restore();

  } catch (error) {
    console.warn(`⚠️ No se pudo cargar avatar para ${member.user.tag}: ${error.message}`);
    // Placeholder con color azul samurai
    ctx.beginPath();
    ctx.arc(avatarX + SIZE / 2, avatarY + SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.PRIMARY;  // Azul samurai
    ctx.fill();
    ctx.closePath();
  }
}

/**
 * Fits text to a maximum width by truncating with ellipsis
 */
function fitTextToWidth(ctx, text, maxWidth) {
  let width = ctx.measureText(text).width;

  if (width <= maxWidth) return text;

  while (width > maxWidth && text.length > 3) {
    text = text.slice(0, -1);
    width = ctx.measureText(text + '...').width;
  }

  return text + '...';
}

/**
 * Draws the welcome text (a la derecha del avatar, uno encima del otro)
 */
function drawWelcomeText(ctx, member, cardConfig) {
  const textX = CANVAS_CONFIG.TEXT_POSITIONS.TEXT_LEFT;
  const baseY = CANVAS_CONFIG.TEXT_POSITIONS.GROUP_Y;
  const maxTextWidth = CANVAS_CONFIG.WIDTH - textX - 50;

  ctx.textAlign = 'left';  // Alineado a la izquierda
  ctx.textBaseline = 'middle';

  // Sombra fuerte para todo el texto
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 25;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // --- Username (arriba) ---
  const username = member.user.username;
  ctx.font = `bold 42px ${cardConfig.font || 'sans-serif'}`;

  // Borde negro
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.lineWidth = 7;
  const truncatedUsername = fitTextToWidth(ctx, username, maxTextWidth);
  ctx.strokeText(truncatedUsername, textX, baseY + CANVAS_CONFIG.TEXT_POSITIONS.USERNAME_OFFSET);

  // Texto blanco brillante
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(truncatedUsername, textX, baseY + CANVAS_CONFIG.TEXT_POSITIONS.USERNAME_OFFSET);

  // --- Server name (abajo) ---
  const serverName = member.guild.name;
  ctx.font = `30px ${cardConfig.font || 'sans-serif'}`;

  // Borde negro
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.lineWidth = 6;
  const truncatedServerName = fitTextToWidth(ctx, `a ${serverName}`, maxTextWidth);
  ctx.strokeText(truncatedServerName, textX, baseY + CANVAS_CONFIG.TEXT_POSITIONS.SERVER_OFFSET);

  // Texto cyan claro
  ctx.fillStyle = '#B0E0FF';
  ctx.fillText(truncatedServerName, textX, baseY + CANVAS_CONFIG.TEXT_POSITIONS.SERVER_OFFSET);

  // Reset
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

module.exports = { createWelcomeCard };

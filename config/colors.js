/**
 * DEMON HUNTER - Samurai Color Scheme
 * Based on the blue samurai and dragon logo
 */

const COLORS = {
  // Primary Colors (Blue Samurai Theme)
  PRIMARY: '#0066FF',        // Azul primario del samurai y dragón
  ELECTRIC: '#00D4FF',       // Azul eléctrico para acentos
  DARK: '#001F3F',          // Azul oscuro para fondos

  // Accent Colors
  GOLD: '#FFD700',          // Dorado para rangos especiales
  WHITE: '#FFFFFF',         // Blanco puro para texto

  // Status Colors
  SUCCESS: '#00FF88',       // Verde brillante para éxito
  ERROR: '#FF3366',         // Rojo para errores
  WARNING: '#FFD700',       // Dorado para advertencias
  INFO: '#00D4FF',          // Azul eléctrico para información

  // Rank Colors
  RONIN: '#778899',         // Gris para Ronin
  SAMURAI: '#0066FF',       // Azul para Samurai
  DAIMYO: '#9370DB',        // Púrpura para Daimyo
  SHOGUN: '#FFD700',        // Dorado para Shogun

  // Special
  HONOR: '#FFD700',         // Color del honor
  KOKU: '#FFA500',          // Color del dinero (koku)
  CLAN: '#8B4789',          // Púrpura oscuro para clanes
};

// Color aliases for easy access
COLORS.DEFAULT = COLORS.PRIMARY;
COLORS.EMBED_PRIMARY = COLORS.PRIMARY;
COLORS.EMBED_SUCCESS = COLORS.SUCCESS;
COLORS.EMBED_ERROR = COLORS.ERROR;

module.exports = COLORS;

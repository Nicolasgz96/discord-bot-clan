/**
 * CONFIG - Punto de entrada unificado para toda la configuración del bot
 *
 * Este archivo consolida todos los archivos de configuración en un solo lugar
 * para facilitar el mantenimiento y evitar múltiples imports.
 *
 * Uso:
 *   const config = require('./config');
 *   config.CONSTANTS.HONOR.PER_MESSAGE
 *   config.EMOJIS.KATANA
 *   config.MESSAGES.WELCOME.TITLE
 *   config.COLORS.PRIMARY
 *   config.BOT.welcome.channelId
 */

// Cargar todos los archivos de configuración
const CONSTANTS = require('./constants');
const EMOJIS = require('./emojis');
const MESSAGES = require('./messages');
const COLORS = require('./colors');
const BOT = require('./bot.json');

/**
 * Exportar todo consolidado
 */
module.exports = {
  // Configuración principal del bot (IDs de canales, etc.)
  BOT,

  // Constantes del juego (honor, koku, rangos, etc.)
  CONSTANTS,

  // Emojis temáticos
  EMOJIS,

  // Mensajes predefinidos
  MESSAGES,

  // Colores para embeds
  COLORS,

  // Helper functions para configuración común

  /**
   * Obtener ID de canal de comandos
   */
  getCommandChannelId() {
    return BOT.commands?.channelId || null;
  },

  /**
   * Obtener ID de canal de welcome
   */
  getWelcomeChannelId() {
    return BOT.welcome?.channelId || null;
  },

  /**
   * Verificar si el welcome está habilitado
   */
  isWelcomeEnabled() {
    return BOT.welcome?.enabled || false;
  },

  /**
   * Calcular rango basado en honor
   */
  calculateRank(honor) {
    if (honor >= CONSTANTS.RANKS.THRESHOLDS.SHOGUN) return 'Shogun';
    if (honor >= CONSTANTS.RANKS.THRESHOLDS.DAIMYO) return 'Daimyo';
    if (honor >= CONSTANTS.RANKS.THRESHOLDS.SAMURAI) return 'Samurai';
    return 'Ronin';
  },

  /**
   * Obtener emoji de un rango
   */
  getRankEmoji(rank) {
    switch (rank) {
      case 'Ronin': return EMOJIS.RONIN;
      case 'Samurai': return EMOJIS.SAMURAI;
      case 'Daimyo': return EMOJIS.DAIMYO;
      case 'Shogun': return EMOJIS.SHOGUN;
      default: return EMOJIS.RONIN;
    }
  },

  /**
   * Obtener multiplicador de rango para daily rewards
   */
  getRankMultiplier(rank) {
    return CONSTANTS.getRankMultiplier(rank);
  },

  /**
   * Obtener bonus de racha
   */
  getStreakBonus(days) {
    return CONSTANTS.getStreakBonus(days);
  }
};

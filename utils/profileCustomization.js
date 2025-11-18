/**
 * DEMON HUNTER BOT - Profile Customization Manager
 * Allows users to customize profile cards with backgrounds, colors, titles, and bios
 */

/**
 * Validate image URL
 * Checks if URL is valid and points to an image
 */
function isValidImageUrl(url) {
  try {
    const urlObj = new URL(url);

    // Check if it's http/https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'Solo se permiten URLs HTTP/HTTPS' };
    }

    // Check file extension (optional, as some URLs may not have extensions)
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasValidExtension = validExtensions.some(ext => url.toLowerCase().endsWith(ext));

    // Allow URLs without extensions if they're from trusted domains
    const trustedDomains = ['imgur.com', 'i.imgur.com', 'cdn.discordapp.com', 'media.discordapp.net'];
    const isTrustedDomain = trustedDomains.some(domain => urlObj.hostname.includes(domain));

    if (!hasValidExtension && !isTrustedDomain) {
      return {
        valid: false,
        error: 'La URL debe terminar en .jpg, .jpeg, .png, .gif, .webp o ser de un dominio confiable (Imgur, Discord CDN)'
      };
    }

    return { valid: true };
  } catch (e) {
    return { valid: false, error: 'URL inválida' };
  }
}

/**
 * Validate hex color
 * Checks if color is valid hex format
 */
function isValidHexColor(color) {
  const hexRegex = /^#[0-9A-F]{6}$/i;

  if (!color.startsWith('#')) {
    return { valid: false, error: 'El color debe empezar con # (ejemplo: #FF5733)' };
  }

  if (!hexRegex.test(color)) {
    return { valid: false, error: 'Formato de color inválido. Usa formato hexadecimal: #RRGGBB (ejemplo: #FF5733)' };
  }

  return { valid: true };
}

/**
 * Validate bio text
 * Checks length and content
 */
function isValidBio(bio) {
  const maxLength = 100;
  const minLength = 1;

  if (bio.length < minLength) {
    return { valid: false, error: 'La biografía no puede estar vacía' };
  }

  if (bio.length > maxLength) {
    return { valid: false, error: `La biografía no puede exceder ${maxLength} caracteres (actual: ${bio.length})` };
  }

  // Check for inappropriate content (basic filter)
  const forbiddenWords = ['discord.gg/', 'http://', 'https://'];
  const hasForbidden = forbiddenWords.some(word => bio.toLowerCase().includes(word));

  if (hasForbidden) {
    return { valid: false, error: 'La biografía no puede contener enlaces' };
  }

  return { valid: true };
}

/**
 * Get user's available titles
 * Returns list of titles user has unlocked
 */
function getAvailableTitles(userData) {
  const titles = userData.titles || [];

  // Add rank-based titles
  const rankTitles = {
    'Ronin': 'Guerrero Errante',
    'Samurai': 'Guerrero del Dojo',
    'Daimyo': 'Señor Feudal',
    'Shogun': 'Comandante Supremo'
  };

  const rankTitle = rankTitles[userData.rank];
  if (rankTitle && !titles.includes(rankTitle)) {
    titles.unshift(rankTitle);
  }

  return titles;
}

/**
 * Set custom background
 */
function setCustomBackground(userData, imageUrl) {
  const validation = isValidImageUrl(imageUrl);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (!userData.customization) {
    userData.customization = {};
  }

  userData.customization.backgroundUrl = imageUrl;
  return userData;
}

/**
 * Set custom embed color
 */
function setCustomColor(userData, hexColor) {
  const validation = isValidHexColor(hexColor);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (!userData.customization) {
    userData.customization = {};
  }

  userData.customization.embedColor = hexColor;
  return userData;
}

/**
 * Set display title
 */
function setDisplayTitle(userData, title) {
  const availableTitles = getAvailableTitles(userData);

  if (title && !availableTitles.includes(title)) {
    throw new Error('No has desbloqueado este título. Usa `/logros` para ver tus títulos disponibles.');
  }

  if (!userData.customization) {
    userData.customization = {};
  }

  userData.customization.displayTitle = title || null;
  return userData;
}

/**
 * Set bio
 */
function setBio(userData, bio) {
  const validation = isValidBio(bio);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (!userData.customization) {
    userData.customization = {};
  }

  userData.customization.bio = bio;
  return userData;
}

/**
 * Reset customization
 */
function resetCustomization(userData, type) {
  if (!userData.customization) {
    return userData;
  }

  switch (type) {
    case 'background':
      delete userData.customization.backgroundUrl;
      break;
    case 'color':
      delete userData.customization.embedColor;
      break;
    case 'title':
      delete userData.customization.displayTitle;
      break;
    case 'bio':
      delete userData.customization.bio;
      break;
    case 'all':
      userData.customization = {};
      break;
    default:
      throw new Error('Tipo de reset inválido');
  }

  return userData;
}

/**
 * Get customization summary
 */
function getCustomizationSummary(userData) {
  const customization = userData.customization || {};
  const availableTitles = getAvailableTitles(userData);

  return {
    backgroundUrl: customization.backgroundUrl || 'Por defecto',
    embedColor: customization.embedColor || '#00D4FF (Por defecto)',
    displayTitle: customization.displayTitle || 'Ninguno',
    bio: customization.bio || 'Sin biografía',
    availableTitles: availableTitles,
    hasCustomBackground: !!customization.backgroundUrl,
    hasCustomColor: !!customization.embedColor,
    hasCustomTitle: !!customization.displayTitle,
    hasCustomBio: !!customization.bio
  };
}

/**
 * Apply customization to embed
 * Modifies an embed builder with user's custom color
 */
function applyCustomizationToEmbed(embed, userData) {
  const customization = userData.customization || {};

  if (customization.embedColor) {
    embed.setColor(customization.embedColor);
  }

  return embed;
}

/**
 * Get display name with title
 * Returns formatted name with custom title if set
 */
function getDisplayNameWithTitle(username, userData) {
  const customization = userData.customization || {};

  if (customization.displayTitle) {
    return `${username} • ${customization.displayTitle}`;
  }

  return username;
}

/**
 * Preset color palettes
 */
const COLOR_PRESETS = {
  'fuego': { color: '#FF5733', name: 'Fuego Samurai' },
  'oceano': { color: '#0077BE', name: 'Océano Pacífico' },
  'bosque': { color: '#228B22', name: 'Bosque de Bambú' },
  'sakura': { color: '#FFB7C5', name: 'Flor de Cerezo' },
  'noche': { color: '#191970', name: 'Noche Estrellada' },
  'oro': { color: '#FFD700', name: 'Oro Imperial' },
  'sangre': { color: '#8B0000', name: 'Sangre del Dragón' },
  'jade': { color: '#00A86B', name: 'Jade Místico' },
  'purpura': { color: '#9932CC', name: 'Púrpura Real' },
  'plata': { color: '#C0C0C0', name: 'Plata Lunar' }
};

/**
 * Get color preset
 */
function getColorPreset(presetName) {
  const preset = COLOR_PRESETS[presetName.toLowerCase()];
  if (!preset) {
    const availablePresets = Object.entries(COLOR_PRESETS)
      .map(([key, val]) => `\`${key}\` (${val.name})`)
      .join(', ');
    throw new Error(`Preset no encontrado. Disponibles: ${availablePresets}`);
  }
  return preset;
}

/**
 * Get all color presets
 */
function getAllColorPresets() {
  return COLOR_PRESETS;
}

module.exports = {
  // Validation
  isValidImageUrl,
  isValidHexColor,
  isValidBio,

  // Title management
  getAvailableTitles,

  // Setters
  setCustomBackground,
  setCustomColor,
  setDisplayTitle,
  setBio,
  resetCustomization,

  // Getters
  getCustomizationSummary,
  applyCustomizationToEmbed,
  getDisplayNameWithTitle,

  // Color presets
  COLOR_PRESETS,
  getColorPreset,
  getAllColorPresets
};

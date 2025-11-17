/**
 * Validates bot configuration to prevent crashes from bad config
 */
function validateConfig(config) {
  if (!config || !config.welcome) {
    throw new Error('Missing welcome configuration');
  }

  const { welcome } = config;

  // Validate enabled flag
  if (typeof welcome.enabled !== 'boolean') {
    throw new Error('welcome.enabled must be a boolean (true or false)');
  }

  // Validate channel ID (Discord snowflake: 17-19 digits)
  if (!welcome.channelId || !/^\d{17,19}$/.test(welcome.channelId)) {
    throw new Error('Invalid channelId - must be a 17-19 digit Discord snowflake ID');
  }

  // Validate card config exists
  if (!welcome.card) {
    throw new Error('Missing welcome.card configuration');
  }

  const { card } = welcome;

  // Validate background image URL if provided
  if (card.backgroundImage && card.backgroundImage !== '') {
    try {
      const url = new URL(card.backgroundImage);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Background image must use http or https protocol');
      }
    } catch (e) {
      throw new Error(`Invalid backgroundImage URL: ${e.message}`);
    }
  }

  // Validate colors
  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
  const rgbaColorRegex = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/;

  const colorFields = [
    'backgroundColor',
    'cardBackgroundColor',
    'accentColor',
    'titleColor',
    'descriptionColor',
    'memberCountColor'
  ];

  for (const field of colorFields) {
    const value = card[field];
    if (value && !hexColorRegex.test(value) && !rgbaColorRegex.test(value)) {
      throw new Error(
        `Invalid ${field}: "${value}". Must be hex (#RRGGBB) or rgba (rgba(r,g,b,a))`
      );
    }
  }

  // Validate font (basic check)
  if (card.font && typeof card.font !== 'string') {
    throw new Error('Invalid font - must be a string');
  }

  // Validate autoRole config if it exists
  if (config.autoRole) {
    if (typeof config.autoRole.enabled !== 'boolean') {
      throw new Error('autoRole.enabled must be a boolean (true or false)');
    }

    // roleId is optional, but if provided must be valid Discord snowflake
    if (config.autoRole.roleId && config.autoRole.roleId !== '' && !/^\d{17,19}$/.test(config.autoRole.roleId)) {
      throw new Error('Invalid autoRole.roleId - must be a 17-19 digit Discord snowflake ID or empty string');
    }
  }

  return true;
}

module.exports = { validateConfig };

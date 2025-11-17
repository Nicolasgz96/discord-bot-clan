/**
 * DEMON HUNTER - Samurai Themed Emojis
 * All emojis used throughout the bot for consistent theming
 */

const EMOJIS = {
  // Samurai Theme
  KATANA: '⚔️',
  CASTLE: '🏯',
  DRAGON: '🐉',
  TORII: '⛩️',
  FLAG: '🎌',
  NINJA: '🥷',
  SCROLL: '📜',
  SAKURA: '🌸',
  MOON: '🌙',
  FIRE: '🔥',

  // Weapons (Sistema de Duelos)
  SWORD: '⚔️',
  DAGGER: '🗡️',
  KNIFE: '🔪',
  BOW: '🏹',
  SHIELD: '🛡️',

  // Armas de Duelo
  WEAPON_KATANA: '⚔️',
  WEAPON_WAKIZASHI: '🗡️',
  WEAPON_TANTO: '🔪',

  // Ranks
  RONIN: '🥷',
  SAMURAI: '⚔️',
  DAIMYO: '👑',
  SHOGUN: '🏯',

  // Actions
  DUEL: '⚔️',
  HONOR: '⭐',
  COIN: '💰',
  GIFT: '🎁',
  STREAK: '🔥',
  LEVEL_UP: '📈',

  // Status
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  LOADING: '⏳',
  CHECK: '✓',
  CROSS: '✗',

  // Medals
  FIRST: '🥇',
  SECOND: '🥈',
  THIRD: '🥉',
  TROPHY: '🏆',
  MEDAL: '🎖️',

  // Clan
  CLAN: '🏯',
  LEADER: '👑',
  MEMBERS: '👥',
  CLAN_TAG: '📛',
  CLAN_INFO: '📜',
  CLAN_INVITE: '✉️',
  CLAN_JOIN: '🚪',
  CLAN_LEAVE: '🚶',
  CLAN_KICK: '⚔️',
  CLAN_LEVEL: '🎖️',

  // Activities
  MESSAGE: '💬',
  VOICE: '🎤',
  WELCOME: '👋',
  QUEST: '🎯',

  // Fortune
  FORTUNE_GREAT: '🌸',
  FORTUNE_GOOD: '⭐',
  FORTUNE_MEDIUM: '🌑',
  FORTUNE_BAD: '⚠️',

  // Economy
  KOKU: '💰',
  WEALTH: '💎',
  DAILY: '📅',
  PAYMENT: '💸',
  BANK: '🏦',
  CHART: '📊',
  CALENDAR: '🗓️',
  SHOP: '🏪',

  // Misc
  BOOK: '📚',
  CROWN: '👑',
  STAR: '⭐',
  GLOBE: '🌐',
  PAINT: '🎨',
  GAME: '🎮',
  BELL: '🔔',
  HEART: '❤️',
  DEMON: '👹',
  HUNTER: '🏹',
  CLOCK: '⏱️',

  // Banderas para traducción
  FLAG_SPAIN: '🇪🇸',
  FLAG_JAPAN: '🇯🇵',
  FLAG_UK: '🇬🇧',
  FLAG_US: '🇺🇸',

  // Sabiduría
  WISDOM: '📜',
  QUOTE: '💭',
  SCROLL_ANCIENT: '📖',

  // Música (Sistema Dojo del Sonido)
  MUSIC: '🎵',
  NOTE: '🎶',
  PLAY: '▶️',
  PAUSE: '⏸️',
  STOP: '⏹️',
  SKIP: '⏭️',
  PREVIOUS: '⏮️',
  SHUFFLE: '🔀',
  LOOP: '🔁',
  LOOP_ONE: '🔂',
  VOLUME_HIGH: '🔊',
  VOLUME_LOW: '🔉',
  VOLUME_MUTE: '🔇',
  QUEUE: '📋',
  NOW_PLAYING: '🎼',
  LYRICS: '📜',
  SEARCH: '🔍',
  PLAYLIST: '📚',
  MICROPHONE: '🎤',
  SPEAKER: '🔊',
  HEADPHONES: '🎧',
  RADIO: '📻',
  CD: '💿',
  MUSICAL_NOTE: '🎵',
  INSTRUMENTS: '🎸',

  // Instrumentos japoneses (temática samurai)
  SHAKUHACHI: '🎋',  // Flauta de bambú (representado con bambú)
  KOTO: '🎶',        // Arpa japonesa
  TAIKO: '🥁',       // Tambor japonés
};

// Emoji combinations for special messages
EMOJIS.DEMON_HUNTER = `${EMOJIS.DEMON}${EMOJIS.HUNTER}`;
EMOJIS.SAMURAI_DRAGON = `${EMOJIS.KATANA}${EMOJIS.DRAGON}`;
EMOJIS.DOJO_ENTRANCE = `${EMOJIS.TORII}${EMOJIS.CASTLE}`;

module.exports = EMOJIS;

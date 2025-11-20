/**
 * DEMON HUNTER BOT - Achievement System
 * Sistema de logros y medallas con temática samurai
 */

const EMOJIS = require('../src/config/emojis');
const dataManager = require('./dataManager');

// ==================== ACHIEVEMENT DEFINITIONS ====================

const ACHIEVEMENTS = {
  // ========== SOCIAL ACHIEVEMENTS ==========
  first_steps: {
    id: 'first_steps',
    name: 'Primeros Pasos',
    nameEn: 'First Steps',
    description: 'Envía tu primer mensaje en el servidor',
    category: 'social',
    tier: 'bronze',
    emoji: '👣',
    requirement: { type: 'messages', count: 1 },
    reward: { koku: 50 },
    hidden: false
  },

  chatterbox: {
    id: 'chatterbox',
    name: 'Hablador',
    nameEn: 'Chatterbox',
    description: 'Envía 1,000 mensajes',
    category: 'social',
    tier: 'silver',
    emoji: '💬',
    requirement: { type: 'messages', count: 1000 },
    reward: { koku: 500 },
    hidden: false
  },

  conversation_master: {
    id: 'conversation_master',
    name: 'Maestro de Conversación',
    nameEn: 'Conversation Master',
    description: 'Envía 10,000 mensajes',
    category: 'social',
    tier: 'gold',
    emoji: '🗣️',
    requirement: { type: 'messages', count: 10000 },
    reward: { koku: 2000 },
    hidden: false
  },

  voice_initiate: {
    id: 'voice_initiate',
    name: 'Iniciado en Voz',
    nameEn: 'Voice Initiate',
    description: 'Pasa 10 horas en canales de voz',
    category: 'social',
    tier: 'bronze',
    emoji: '🎤',
    requirement: { type: 'voiceMinutes', count: 600 }, // 10 hours
    reward: { koku: 100 },
    hidden: false
  },

  voice_champion: {
    id: 'voice_champion',
    name: 'Campeón de Voz',
    nameEn: 'Voice Champion',
    description: 'Pasa 100 horas en canales de voz',
    category: 'social',
    tier: 'gold',
    emoji: '🏆',
    requirement: { type: 'voiceMinutes', count: 6000 }, // 100 hours
    reward: { koku: 3000 },
    hidden: false
  },

  night_owl: {
    id: 'night_owl',
    name: 'Búho Nocturno',
    nameEn: 'Night Owl',
    description: 'Envía 50 mensajes entre las 2 AM y 6 AM',
    category: 'social',
    tier: 'silver',
    emoji: '🦉',
    requirement: { type: 'nightMessages', count: 50 },
    reward: { koku: 300, title: 'El Insomne' },
    hidden: false
  },

  // ========== HONOR ACHIEVEMENTS ==========

  first_honor: {
    id: 'first_honor',
    name: 'Primera Muestra de Honor',
    nameEn: 'First Honor',
    description: 'Alcanza 100 puntos de honor',
    category: 'honor',
    tier: 'bronze',
    emoji: EMOJIS.HONOR,
    requirement: { type: 'honor', count: 100 },
    reward: { koku: 100 },
    hidden: false
  },

  samurai_ascension: {
    id: 'samurai_ascension',
    name: 'Ascenso Samurai',
    nameEn: 'Samurai Ascension',
    description: 'Alcanza el rango de Samurai',
    category: 'honor',
    tier: 'silver',
    emoji: EMOJIS.SAMURAI,
    requirement: { type: 'rank', value: 'Samurai' },
    reward: { koku: 500 },
    hidden: false
  },

  daimyo_authority: {
    id: 'daimyo_authority',
    name: 'Autoridad Daimyo',
    nameEn: 'Daimyo Authority',
    description: 'Alcanza el rango de Daimyo',
    category: 'honor',
    tier: 'gold',
    emoji: EMOJIS.DAIMYO,
    requirement: { type: 'rank', value: 'Daimyo' },
    reward: { koku: 2000 },
    hidden: false
  },

  shogun_legacy: {
    id: 'shogun_legacy',
    name: 'Legado del Shogun',
    nameEn: 'Shogun Legacy',
    description: 'Alcanza el rango de Shogun',
    category: 'honor',
    tier: 'legendary',
    emoji: EMOJIS.SHOGUN,
    requirement: { type: 'rank', value: 'Shogun' },
    reward: { koku: 5000, title: 'Shogun Supremo' },
    hidden: false
  },

  // ========== ECONOMIC ACHIEVEMENTS ==========

  first_koku: {
    id: 'first_koku',
    name: 'Primer Koku',
    nameEn: 'First Koku',
    description: 'Gana tu primer koku',
    category: 'economy',
    tier: 'bronze',
    emoji: EMOJIS.KOKU,
    requirement: { type: 'koku', count: 1 },
    reward: { koku: 50 },
    hidden: false
  },

  wealthy_warrior: {
    id: 'wealthy_warrior',
    name: 'Guerrero Adinerado',
    nameEn: 'Wealthy Warrior',
    description: 'Acumula 10,000 koku',
    category: 'economy',
    tier: 'silver',
    emoji: '💰',
    requirement: { type: 'koku', count: 10000 },
    reward: { koku: 1000 },
    hidden: false
  },

  merchant_lord: {
    id: 'merchant_lord',
    name: 'Señor Mercader',
    nameEn: 'Merchant Lord',
    description: 'Acumula 50,000 koku',
    category: 'economy',
    tier: 'gold',
    emoji: '🏪',
    requirement: { type: 'koku', count: 50000 },
    reward: { koku: 5000 },
    hidden: false
  },

  generous_soul: {
    id: 'generous_soul',
    name: 'Alma Generosa',
    nameEn: 'Generous Soul',
    description: 'Dona un total de 5,000 koku a otros usuarios',
    category: 'economy',
    tier: 'gold',
    emoji: '🎁',
    requirement: { type: 'kokuDonated', count: 5000 },
    reward: { koku: 1000, title: 'El Generoso' },
    hidden: false
  },

  daily_dedication: {
    id: 'daily_dedication',
    name: 'Dedicación Diaria',
    nameEn: 'Daily Dedication',
    description: 'Mantén una racha de 30 días',
    category: 'economy',
    tier: 'gold',
    emoji: '📅',
    requirement: { type: 'dailyStreak', count: 30 },
    reward: { koku: 2000 },
    hidden: false
  },

  // ========== CLAN ACHIEVEMENTS ==========

  clan_founder: {
    id: 'clan_founder',
    name: 'Fundador de Clan',
    nameEn: 'Clan Founder',
    description: 'Crea tu propio clan',
    category: 'clan',
    tier: 'silver',
    emoji: EMOJIS.CASTLE,
    requirement: { type: 'clanCreated', count: 1 },
    reward: { koku: 500, title: 'Fundador' },
    hidden: false
  },

  clan_loyal: {
    id: 'clan_loyal',
    name: 'Leal al Clan',
    nameEn: 'Clan Loyal',
    description: 'Permanece en el mismo clan por 30 días',
    category: 'clan',
    tier: 'silver',
    emoji: '🛡️',
    requirement: { type: 'clanDays', count: 30 },
    reward: { koku: 800 },
    hidden: false
  },

  clan_contributor: {
    id: 'clan_contributor',
    name: 'Contribuidor del Clan',
    nameEn: 'Clan Contributor',
    description: 'Contribuye 1,000 honor a tu clan',
    category: 'clan',
    tier: 'gold',
    emoji: '⚔️',
    requirement: { type: 'clanHonorContribution', count: 1000 },
    reward: { koku: 1500 },
    hidden: false
  },

  // ========== MUSIC ACHIEVEMENTS ==========

  music_lover: {
    id: 'music_lover',
    name: 'Amante de la Música',
    nameEn: 'Music Lover',
    description: 'Reproduce 100 canciones',
    category: 'music',
    tier: 'bronze',
    emoji: '🎵',
    requirement: { type: 'songsPlayed', count: 100 },
    reward: { koku: 200 },
    hidden: false
  },

  dj_master: {
    id: 'dj_master',
    name: 'Maestro DJ',
    nameEn: 'DJ Master',
    description: 'Reproduce 1,000 canciones',
    category: 'music',
    tier: 'gold',
    emoji: '🎧',
    requirement: { type: 'songsPlayed', count: 1000 },
    reward: { koku: 2000 },
    hidden: false
  },

  playlist_creator: {
    id: 'playlist_creator',
    name: 'Creador de Playlists',
    nameEn: 'Playlist Creator',
    description: 'Crea 5 playlists',
    category: 'music',
    tier: 'silver',
    emoji: '📚',
    requirement: { type: 'playlistsCreated', count: 5 },
    reward: { koku: 500 },
    hidden: false
  },

  // ========== SPECIAL ACHIEVEMENTS ==========

  recruiter: {
    id: 'recruiter',
    name: 'El Esclavizador',
    nameEn: 'The Enslaver',
    description: 'Invita 5 personas al servidor',
    category: 'special',
    tier: 'silver',
    emoji: '⛓️',
    requirement: { type: 'invites', count: 5 },
    reward: { koku: 1000, title: 'El Esclavizador' },
    hidden: false,
    restrictedTo: '615330007153246209' // Solo este usuario puede obtener este logro
  },

  master_recruiter: {
    id: 'master_recruiter',
    name: 'Esclavizador Supremo',
    nameEn: 'Supreme Enslaver',
    description: 'Invita 20 personas al servidor',
    category: 'special',
    tier: 'gold',
    emoji: '👹',
    requirement: { type: 'invites', count: 20 },
    reward: { koku: 5000, title: 'Esclavizador Supremo' },
    hidden: false
  },

  founder: {
    id: 'founder',
    name: 'Fundador del Servidor',
    nameEn: 'Server Founder',
    description: 'Uno de los primeros 10 miembros del servidor',
    category: 'special',
    tier: 'legendary',
    emoji: '👑',
    requirement: { type: 'memberNumber', count: 10 },
    reward: { koku: 10000, title: 'Fundador' },
    hidden: false
  },

  early_adopter: {
    id: 'early_adopter',
    name: 'Adoptador Temprano',
    nameEn: 'Early Adopter',
    description: 'Uno de los primeros 50 miembros del servidor',
    category: 'special',
    tier: 'gold',
    emoji: '🌟',
    requirement: { type: 'memberNumber', count: 50 },
    reward: { koku: 2000, title: 'Pionero' },
    hidden: false
  },

  trivia_master: {
    id: 'trivia_master',
    name: 'Maestro de Trivia',
    nameEn: 'Trivia Master',
    description: 'Gana 10 juegos de sabiduría',
    category: 'special',
    tier: 'gold',
    emoji: '🧠',
    requirement: { type: 'triviaWins', count: 10 },
    reward: { koku: 1500, title: 'El Sabio' },
    hidden: false
  },

  duel_champion: {
    id: 'duel_champion',
    name: 'Campeón de Duelos',
    nameEn: 'Duel Champion',
    description: 'Gana 20 duelos',
    category: 'special',
    tier: 'gold',
    emoji: '🥋',
    requirement: { type: 'duelWins', count: 20 },
    reward: { koku: 2000, title: 'Invicto' },
    hidden: false
  },

  // ========== HIDDEN ACHIEVEMENTS ==========

  lucky_seven: {
    id: 'lucky_seven',
    name: 'Suerte del Siete',
    nameEn: 'Lucky Seven',
    description: '???',
    category: 'hidden',
    tier: 'platinum',
    emoji: '🍀',
    requirement: { type: 'fortuneRolls', value: 777 },
    reward: { koku: 7777, title: 'Afortunado' },
    hidden: true
  },

  midnight_warrior: {
    id: 'midnight_warrior',
    name: 'Guerrero de Medianoche',
    nameEn: 'Midnight Warrior',
    description: '???',
    category: 'hidden',
    tier: 'platinum',
    emoji: '🌙',
    requirement: { type: 'midnightMessages', count: 100 }, // Exactly at midnight
    reward: { koku: 3000, title: 'Nocturno' },
    hidden: true
  }
};

// Achievement tier colors and emojis
const TIER_INFO = {
  bronze: { color: 0xCD7F32, emoji: '🥉', name: 'Bronce' },
  silver: { color: 0xC0C0C0, emoji: '🥈', name: 'Plata' },
  gold: { color: 0xFFD700, emoji: '🥇', name: 'Oro' },
  platinum: { color: 0xE5E4E2, emoji: '💎', name: 'Platino' },
  legendary: { color: 0xFF6B35, emoji: '👑', name: 'Legendario' }
};

// Category emojis
const CATEGORY_EMOJIS = {
  social: '👥',
  honor: EMOJIS.HONOR,
  economy: EMOJIS.KOKU,
  clan: EMOJIS.CASTLE,
  music: '🎵',
  special: '⭐',
  hidden: '❓'
};

// ==================== ACHIEVEMENT TRACKING ====================

/**
 * Check if a user has unlocked an achievement
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @param {string} achievementId - Achievement ID
 * @returns {boolean}
 */
function hasAchievement(userId, guildId, achievementId) {
  const userData = dataManager.getUser(userId, guildId);
  if (!userData.achievements) userData.achievements = [];
  return userData.achievements.includes(achievementId);
}

/**
 * Award an achievement to a user
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @param {string} achievementId - Achievement ID
 * @returns {Object|null} Achievement object if newly unlocked, null if already had it
 */
function awardAchievement(userId, guildId, achievementId) {
  const achievement = ACHIEVEMENTS[achievementId];
  if (!achievement) {
    console.error(`Achievement not found: ${achievementId}`);
    return null;
  }

  // Check if already has it
  if (hasAchievement(userId, guildId, achievementId)) {
    return null;
  }

  const userData = dataManager.getUser(userId, guildId);
  if (!userData.achievements) userData.achievements = [];

  userData.achievements.push(achievementId);
  userData.achievementUnlockedAt = userData.achievementUnlockedAt || {};
  userData.achievementUnlockedAt[achievementId] = Date.now();

  // Grant rewards
  if (achievement.reward) {
    if (achievement.reward.koku) {
      userData.koku = (userData.koku || 0) + achievement.reward.koku;
    }
    if (achievement.reward.title) {
      userData.titles = userData.titles || [];
      if (!userData.titles.includes(achievement.reward.title)) {
        userData.titles.push(achievement.reward.title);
      }
    }
  }

  dataManager.dataModified.users = true;

  console.log(`🏆 ${userId} unlocked achievement: ${achievement.name} (+${achievement.reward?.koku || 0} koku)`);

  return achievement;
}

/**
 * Check and award achievements based on user stats
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @param {Object} userData - User data object
 * @returns {Array<Object>} Array of newly unlocked achievements
 */
function checkAchievements(userId, guildId, userData) {
  const newlyUnlocked = [];

  for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
    // Skip if already has it
    if (hasAchievement(userId, guildId, id)) continue;

    // Skip if achievement is restricted to specific user
    if (achievement.restrictedTo && achievement.restrictedTo !== userId) {
      continue;
    }

    let meetsRequirement = false;

    // Check requirement
    switch (achievement.requirement.type) {
      case 'messages':
        meetsRequirement = (userData.stats?.messagesCount || 0) >= achievement.requirement.count;
        break;

      case 'voiceMinutes':
        meetsRequirement = (userData.stats?.voiceMinutes || 0) >= achievement.requirement.count;
        break;

      case 'honor':
        meetsRequirement = (userData.honor || 0) >= achievement.requirement.count;
        break;

      case 'rank':
        meetsRequirement = userData.rank === achievement.requirement.value;
        break;

      case 'koku':
        meetsRequirement = (userData.koku || 0) >= achievement.requirement.count;
        break;

      case 'kokuDonated':
        meetsRequirement = (userData.stats?.kokuDonated || 0) >= achievement.requirement.count;
        break;

      case 'dailyStreak':
        meetsRequirement = (userData.dailyStreak || 0) >= achievement.requirement.count;
        break;

      case 'clanCreated':
        meetsRequirement = (userData.stats?.clansCreated || 0) >= achievement.requirement.count;
        break;

      case 'clanDays':
        if (userData.clanJoinedAt) {
          const daysSinceJoin = Math.floor((Date.now() - userData.clanJoinedAt) / (24 * 60 * 60 * 1000));
          meetsRequirement = daysSinceJoin >= achievement.requirement.count;
        }
        break;

      case 'songsPlayed':
        meetsRequirement = (userData.stats?.songsPlayed || 0) >= achievement.requirement.count;
        break;

      case 'playlistsCreated':
        meetsRequirement = (userData.playlists?.length || 0) >= achievement.requirement.count;
        break;

      case 'triviaWins':
        meetsRequirement = (userData.stats?.triviaWins || 0) >= achievement.requirement.count;
        break;

      case 'duelWins':
        meetsRequirement = (userData.stats?.duelWins || 0) >= achievement.requirement.count;
        break;

      case 'nightMessages':
        meetsRequirement = (userData.stats?.nightMessages || 0) >= achievement.requirement.count;
        break;

      case 'midnightMessages':
        meetsRequirement = (userData.stats?.midnightMessages || 0) >= achievement.requirement.count;
        break;

      case 'memberNumber':
        // Special handling for early adopter achievements
        meetsRequirement = (userData.memberNumber || Infinity) <= achievement.requirement.count;
        break;

      case 'invites':
        meetsRequirement = (userData.stats?.invitesCount || 0) >= achievement.requirement.count;
        break;
    }

    if (meetsRequirement) {
      const awarded = awardAchievement(userId, guildId, id);
      if (awarded) {
        newlyUnlocked.push(awarded);
      }
    }
  }

  return newlyUnlocked;
}

/**
 * Get all achievements for a user
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @returns {Object} { unlocked: Array, locked: Array, stats: Object }
 */
function getUserAchievements(userId, guildId) {
  const userData = dataManager.getUser(userId, guildId);
  const userAchievements = userData.achievements || [];

  const unlocked = [];
  const locked = [];

  for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
    if (userAchievements.includes(id)) {
      unlocked.push({
        ...achievement,
        unlockedAt: userData.achievementUnlockedAt?.[id] || null
      });
    } else if (!achievement.hidden) {
      // Don't show restricted achievements to other users
      if (achievement.restrictedTo && achievement.restrictedTo !== userId) {
        continue;
      }
      locked.push(achievement);
    }
  }

  // Calculate completion stats
  const totalAchievements = Object.keys(ACHIEVEMENTS).filter(id => !ACHIEVEMENTS[id].hidden).length;
  const completionPercent = Math.round((unlocked.length / totalAchievements) * 100);

  // Group by category
  const byCategory = {};
  for (const ach of unlocked) {
    if (!byCategory[ach.category]) byCategory[ach.category] = [];
    byCategory[ach.category].push(ach);
  }

  return {
    unlocked,
    locked,
    stats: {
      total: unlocked.length,
      totalPossible: totalAchievements,
      completion: completionPercent,
      byCategory,
      latestUnlock: unlocked.sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0))[0] || null
    }
  };
}

/**
 * Get achievement leaderboard
 * @param {string} guildId - Guild ID
 * @param {number} limit - Number of users to return
 * @returns {Array} Sorted array of users by achievement count
 */
function getAchievementLeaderboard(guildId, limit = 10) {
  const allUsers = dataManager.getAllUsers(guildId);

  const leaderboard = allUsers
    .map(userData => ({
      userId: userData.userId,
      achievementCount: (userData.achievements || []).length,
      latestAchievement: userData.achievements?.[userData.achievements.length - 1] || null
    }))
    .filter(entry => entry.achievementCount > 0)
    .sort((a, b) => b.achievementCount - a.achievementCount)
    .slice(0, limit);

  return leaderboard;
}

/**
 * Get user's featured badges (prestigious achievements to display)
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @param {number} limit - Max number of badges to return
 * @returns {Array<Object>} Array of badge objects
 */
function getFeaturedBadges(userId, guildId, limit = 5) {
  const userData = dataManager.getUser(userId, guildId);
  const userAchievements = userData.achievements || [];

  // Priority order: legendary > platinum > gold > with titles
  const tierPriority = { legendary: 4, platinum: 3, gold: 2, silver: 1, bronze: 0 };

  const badges = userAchievements
    .map(id => ACHIEVEMENTS[id])
    .filter(ach => ach) // Remove undefined
    .sort((a, b) => {
      // First sort by tier priority
      const tierDiff = tierPriority[b.tier] - tierPriority[a.tier];
      if (tierDiff !== 0) return tierDiff;

      // Then prioritize achievements with title rewards
      const aHasTitle = a.reward?.title ? 1 : 0;
      const bHasTitle = b.reward?.title ? 1 : 0;
      return bHasTitle - aHasTitle;
    })
    .slice(0, limit)
    .map(ach => ({
      name: ach.name,
      emoji: ach.emoji,
      tier: ach.tier,
      tierEmoji: TIER_INFO[ach.tier].emoji,
      tierName: TIER_INFO[ach.tier].name,
      color: TIER_INFO[ach.tier].color
    }));

  return badges;
}

/**
 * Format badges for display in embed
 * @param {Array<Object>} badges - Badge objects
 * @returns {string} Formatted string
 */
function formatBadgesDisplay(badges) {
  if (!badges || badges.length === 0) {
    return '*No hay insignias desbloqueadas*';
  }

  return badges
    .map(badge => `${badge.emoji} **${badge.name}** ${badge.tierEmoji}`)
    .join('\n');
}

/**
 * Get user's rarest achievement (for special display/nickname)
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @returns {Object|null} Achievement object or null
 */
function getRarestAchievement(userId, guildId) {
  const badges = getFeaturedBadges(userId, guildId, 1);
  return badges.length > 0 ? badges[0] : null;
}

module.exports = {
  ACHIEVEMENTS,
  TIER_INFO,
  CATEGORY_EMOJIS,
  hasAchievement,
  awardAchievement,
  checkAchievements,
  getUserAchievements,
  getAchievementLeaderboard,
  getFeaturedBadges,
  formatBadgesDisplay,
  getRarestAchievement
};

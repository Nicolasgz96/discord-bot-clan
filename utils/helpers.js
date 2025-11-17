/**
 * DEMON HUNTER BOT - Helper Utilities
 * Funciones auxiliares reutilizables (retry logic, caching, username fetching)
 */

const EMOJIS = require('../src/config/emojis');

// ✅ FIX BUG #3: Cache de usernames para reducir llamadas a Discord API
// { userId: { username: string, timestamp: number } }
const usernameCache = new Map();
const USERNAME_CACHE_TTL = 60 * 60 * 1000; // 1 hora en milisegundos

// Limpieza automática de cache de usernames (cada 1 hora)
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;

  for (const [userId, data] of usernameCache.entries()) {
    if ((now - data.timestamp) > USERNAME_CACHE_TTL) {
      usernameCache.delete(userId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 [Cleanup] Limpiadas ${cleaned} entradas expiradas de usernameCache`);
  }
}, 60 * 60 * 1000); // Cada 1 hora

/**
 * Enviar mensajes con lógica de reintento
 * @param {TextChannel} channel - Canal de Discord
 * @param {Object} options - Opciones del mensaje (content, embeds, etc.)
 * @param {number} maxRetries - Número máximo de reintentos (default: 3)
 * @returns {Promise<Message>} - Mensaje enviado
 */
async function sendWithRetry(channel, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await channel.send(options);
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const delay = Math.pow(2, attempt - 1) * 1000;
      console.warn(`Envío falló (intento ${attempt}/${maxRetries}), reintentando en ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Obtener el emoji de un rango
 * @param {string} rank - Nombre del rango (Ronin, Samurai, Daimyo, Shogun)
 * @returns {string} - Emoji del rango
 */
function getRankEmoji(rank) {
  switch (rank) {
    case 'Ronin': return EMOJIS.RONIN;
    case 'Samurai': return EMOJIS.SAMURAI;
    case 'Daimyo': return EMOJIS.DAIMYO;
    case 'Shogun': return EMOJIS.SHOGUN;
    default: return EMOJIS.RONIN;
  }
}

/**
 * ✅ FIX BUG #3: Fetch username con cache para reducir API calls
 * @param {Client} client - Cliente de Discord
 * @param {string} userId - ID del usuario de Discord
 * @returns {Promise<string>} - Username del usuario
 */
async function fetchUsername(client, userId) {
  // Verificar si está en cache y no ha expirado
  const cached = usernameCache.get(userId);
  if (cached && (Date.now() - cached.timestamp) < USERNAME_CACHE_TTL) {
    return cached.username;
  }

  // Si no está en cache o expiró, hacer fetch
  try {
    const discordUser = await client.users.fetch(userId);
    const username = discordUser.username;

    // Guardar en cache
    usernameCache.set(userId, {
      username: username,
      timestamp: Date.now()
    });

    return username;
  } catch (error) {
    // Si falla el fetch, devolver ID truncado
    return `Usuario ${userId.slice(0, 6)}`;
  }
}

/**
 * ✅ FIX BUG #3: Fetch múltiples usernames en paralelo
 * @param {Client} client - Cliente de Discord
 * @param {Array<string>} userIds - Array de IDs de usuarios
 * @returns {Promise<Map<string, string>>} - Map de userId -> username
 */
async function fetchUsernamesBatch(client, userIds) {
  const promises = userIds.map(userId =>
    fetchUsername(client, userId).then(username => ({ userId, username }))
  );

  const results = await Promise.all(promises);

  const usernameMap = new Map();
  results.forEach(({ userId, username }) => {
    usernameMap.set(userId, username);
  });

  return usernameMap;
}

/**
 * Obtener displayName del servidor (nombre modificado en el canal)
 * @param {Client} client - Cliente de Discord
 * @param {Guild} guild - Servidor de Discord
 * @param {string} userId - ID del usuario
 * @returns {Promise<string>} - DisplayName del usuario en el servidor
 */
async function fetchDisplayName(client, guild, userId) {
  try {
    // Intentar obtener el miembro del servidor
    let member = guild.members.cache.get(userId);

    // Si no está en cache, hacer fetch
    if (!member) {
      member = await guild.members.fetch(userId);
    }

    // Usar displayName (nombre modificado) o username como fallback
    return member.displayName || member.user.username;
  } catch (error) {
    // Si falla, intentar obtener username como fallback
    try {
      const user = await client.users.fetch(userId);
      return user.username;
    } catch (err) {
      return `Usuario ${userId.slice(0, 6)}`;
    }
  }
}

/**
 * Obtener múltiples displayNames del servidor en paralelo
 * @param {Client} client - Cliente de Discord
 * @param {Guild} guild - Servidor de Discord
 * @param {Array<string>} userIds - Array de IDs de usuarios
 * @returns {Promise<Map<string, string>>} - Map de userId -> displayName
 */
async function fetchDisplayNamesBatch(client, guild, userIds) {
  const promises = userIds.map(userId =>
    fetchDisplayName(client, guild, userId).then(displayName => ({ userId, displayName }))
  );

  const results = await Promise.all(promises);

  const displayNameMap = new Map();
  results.forEach(({ userId, displayName }) => {
    displayNameMap.set(userId, displayName);
  });

  return displayNameMap;
}

module.exports = {
  sendWithRetry,
  getRankEmoji,
  fetchUsername,
  fetchUsernamesBatch,
  fetchDisplayName,
  fetchDisplayNamesBatch,
  // Export cache for external cleanup if needed
  usernameCache,
  USERNAME_CACHE_TTL
};

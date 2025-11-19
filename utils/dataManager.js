/**
 * DEMON HUNTER - Data Manager
 * Handles all JSON file-based data persistence
 * No database needed - simple, reliable, easy to backup
 */

const fs = require('fs').promises;
const path = require('path');
const EMOJIS = require('../src/config/emojis');
const BackupManager = require('./backupManager');
const CONSTANTS = require('../src/config/constants');

class DataManager {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.clansFile = path.join(this.dataDir, 'clans.json');
    this.cooldownsFile = path.join(this.dataDir, 'cooldowns.json');
    this.configFile = path.join(this.dataDir, 'bot_config.json');

    // In-memory caches (loaded from JSON files)
    this.users = {};
    this.clans = {};
    this.cooldowns = {};
    this.botConfig = {};

    // Backup Manager
    this.backupManager = null; // Se inicializa en init()

    // Auto-save interval (5 minutes)
    this.autoSaveInterval = null;
    this.AUTO_SAVE_MINUTES = 5;

    // Track if data has been modified (to avoid unnecessary writes)
    this.dataModified = {
      users: false,
      clans: false,
      cooldowns: false,
      config: false
    };
  }

  /**
   * Initialize data manager - load all JSON files
   */
  async init() {
    try {
      console.log(`${EMOJIS.SCROLL} Inicializando sistema de datos...`);

      // Create data directory if not exists
      await fs.mkdir(this.dataDir, { recursive: true });
      console.log(`${EMOJIS.SUCCESS} Directorio de datos creado/verificado: ${this.dataDir}`);

      // Load all data files
      await this.loadUsers();

      // Remove any persisted bot user entries so the bot never appears in leaderboards
      try {
        const botId = (global.client && global.client.user && global.client.user.id) ? global.client.user.id : process.env.BOT_USER_ID;
        if (botId) {
          let removed = 0;
          for (const key of Object.keys(this.users)) {
            const u = this.users[key];
            if (!u) continue;
            if (u.userId === botId || u.isBot) {
              delete this.users[key];
              removed++;
            }
          }
          if (removed > 0) {
            console.log(`🧹 [DataManager] Removed ${removed} persisted bot user entries from users.json`);
            this.dataModified.users = true;
            await this.saveUsers();
          }
        }
      } catch (e) {
        // ignore cleanup errors
      }
      await this.loadClans();
      await this.loadCooldowns();
      await this.loadBotConfig();

      // Clean expired cooldowns on startup
      this.cleanExpiredCooldowns();

      // Start auto-save
      this.startAutoSave();

      // Inicializar sistema de backups
      this.backupManager = new BackupManager(this.dataDir);
      await this.backupManager.init();

      // Crear backup inicial
      await this.backupManager.createBackup();

      // Iniciar backups automáticos cada 6 horas
      this.backupManager.startAutoBackup(CONSTANTS.DATA.BACKUP_INTERVAL_HOURS);

      console.log(`${EMOJIS.SUCCESS} Sistema de datos inicializado correctamente`);
      console.log(`${EMOJIS.INFO} Usuarios cargados: ${Object.keys(this.users).length}`);
      console.log(`${EMOJIS.INFO} Clanes cargados: ${Object.keys(this.clans).length}`);
      console.log(`${EMOJIS.INFO} Cooldowns activos: ${Object.keys(this.cooldowns).length}`);
    } catch (error) {
      console.error(`${EMOJIS.ERROR} Error inicializando sistema de datos:`, error);
      throw error;
    }
  }

  // ==================== USERS ====================

  async loadUsers() {
    try {
      const data = await fs.readFile(this.usersFile, 'utf-8');
      this.users = JSON.parse(data);
      console.log(`${EMOJIS.CHECK} Usuarios cargados: ${Object.keys(this.users).length}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create empty
        this.users = {};
        await this.saveUsers();
        console.log(`${EMOJIS.INFO} Archivo de usuarios creado (nuevo)`);
      } else if (error instanceof SyntaxError) {
        // JSON corrupto - intentar restaurar desde backup
        console.error(`${EMOJIS.ERROR} JSON corrupto detectado: users.json`);
        console.log(`${EMOJIS.LOADING} Intentando restaurar desde backup...`);

        const restored = await this.backupManager.restoreFromLatestBackup('users.json');

        if (restored) {
          // Reintentar carga después de restaurar
          try {
            const data = await fs.readFile(this.usersFile, 'utf-8');
            this.users = JSON.parse(data);
            console.log(`${EMOJIS.SUCCESS} Usuarios restaurados desde backup: ${Object.keys(this.users).length}`);
          } catch (retryError) {
            console.error(`${EMOJIS.ERROR} Error después de restaurar backup:`, retryError);
            this.users = {};
          }
        } else {
          // No hay backups disponibles, usar datos vacíos
          console.warn(`${EMOJIS.WARNING} No hay backups disponibles. Iniciando con datos vacíos.`);
          this.users = {};
        }
      } else {
        console.error(`${EMOJIS.ERROR} Error cargando usuarios:`, error);
        this.users = {};
      }
    }
  }

  async saveUsers() {
    try {
      await fs.writeFile(this.usersFile, JSON.stringify(this.users, null, 2), 'utf-8');
      this.dataModified.users = false;
    } catch (error) {
      console.error(`${EMOJIS.ERROR} Error guardando usuarios:`, error);
      throw error;
    }
  }

  /**
   * Get user data (creates default if doesn't exist)
   */
  getUser(userId, guildId) {
    const key = `${guildId}_${userId}`;

    if (!this.users[key]) {
      // Create default user
      this.users[key] = {
        userId: userId,
        guildId: guildId,
        honor: 0,
        rank: 'Ronin',
        koku: 0,
        lastDailyClaim: null,
        dailyStreak: 0,
        clanId: null,
        warnings: [],
        createdAt: new Date().toISOString(),
        stats: {
          messagesCount: 0,
          voiceMinutes: 0,
          duelsWon: 0,
          duelsLost: 0,
          duelsTotal: 0,
          commandsUsed: 0
        },
        fortune: {
          type: null,
          date: null,
          bonus: 0
        },
        activeCosmetics: {
          titleId: null,
          badgeId: null,
          colorId: null
        },
        inventory: [],
        activeBoosts: [],
        // Sistema de combate
        combat: {
          equipment: {
            weapon: null,          // ID del arma equipada
            armor: null            // ID de la armadura equipada
          },
          skills: [],              // Array de IDs de habilidades desbloqueadas
          training: {
            strength: 0,           // Nivel de entrenamiento de fuerza
            agility: 0,            // Nivel de entrenamiento de agilidad
            ki_mastery: 0,         // Nivel de meditación de Ki
            vitality: 0            // Nivel de entrenamiento de resistencia
          },
          consumables: []          // Array de consumibles de combate {itemId, quantity}
        }
      };
      this.dataModified.users = true;
    } else {
      // Migración: Agregar campos faltantes a usuarios existentes
      const user = this.users[key];
      let modified = false;

      if (!user.activeCosmetics) {
        user.activeCosmetics = {
          titleId: null,
          badgeId: null,
          colorId: null
        };
        modified = true;
      }

      if (!user.inventory) {
        user.inventory = [];
        modified = true;
      }

      if (!user.activeBoosts) {
        user.activeBoosts = [];
        modified = true;
      }

      // Migración: Sistema de combate
      if (!user.combat) {
        user.combat = {
          equipment: {
            weapon: null,
            armor: null
          },
          skills: [],
          training: {
            strength: 0,
            agility: 0,
            ki_mastery: 0,
            vitality: 0
          },
          consumables: []
        };
        modified = true;
      }

      if (modified) {
        this.dataModified.users = true;
      }
    }

    return this.users[key];
  }

  /**
   * Update user data
   */
  updateUser(userId, guildId, updates) {
    const key = `${guildId}_${userId}`;
    const user = this.getUser(userId, guildId);

    // Merge updates
    Object.assign(user, updates);
    this.dataModified.users = true;

    return user;
  }

  /**
   * Add honor to user
   */
  addHonor(userId, guildId, amount) {
    const user = this.getUser(userId, guildId);
    // Exclude bot user from earning honor
    const botId = (global.client && global.client.user && global.client.user.id) ? global.client.user.id : process.env.BOT_USER_ID;
    if (user.userId === botId || user.isBot) return user;

    // Preserve previous rank for change detection
    const previousRank = user.rank;

    // ✅ FIX BUG #2: Aplicar bonus de fortuna si está activo (dentro de 24 horas)
    if (user.fortune && user.fortune.date && user.fortune.bonus !== 0) {
      const fortuneDate = new Date(user.fortune.date);
      const now = new Date();
      const hoursSinceFortuneCheck = (now - fortuneDate) / (1000 * 60 * 60);

      // Si la fortuna fue consultada hace menos de 24 horas, aplicar bonus
      if (hoursSinceFortuneCheck < 24) {
        const originalAmount = amount;
        amount = Math.floor(amount * (1 + user.fortune.bonus));

        // Log solo si el bonus es significativo (evitar spam por bonus = 0)
        if (user.fortune.bonus !== 0) {
          console.log(`🎴 [Fortune] Bonus aplicado: ${originalAmount} → ${amount} honor (${user.fortune.bonus > 0 ? '+' : ''}${(user.fortune.bonus * 100).toFixed(0)}%)`);
        }
      }
    }

    user.honor += amount;

    // Update rank based on honor
    user.rank = this.calculateRank(user.honor);

    // Attach transient metadata so callers can notify users if rank changed
    try {
      const rankChanged = previousRank !== user.rank;
      // Non-persistent property, will not be saved
      user.__lastHonorChange = {
        amount: amount,
        oldRank: previousRank,
        newRank: user.rank,
        rankChanged: rankChanged
      };
    } catch (e) {
      // ignore
    }

    // ✅ FIX BUG #3: Actualizar clan automáticamente cuando un miembro gana honor
    if (user.clanId) {
      this.updateClanStats(user.clanId);
    }

    this.dataModified.users = true;
    return user;
  }

  /**
   * Calculate rank based on honor points
   */
  calculateRank(honor) {
    if (honor >= 5000) return 'Shogun';
    if (honor >= 2000) return 'Daimyo';
    if (honor >= 500) return 'Samurai';
    return 'Ronin';
  }

  /**
   * Get all users for a guild (for leaderboards)
   */
  getGuildUsers(guildId) {
    // Exclude bot user from leaderboards
    const botId = (global.client && global.client.user && global.client.user.id) ? global.client.user.id : process.env.BOT_USER_ID;
    return Object.values(this.users).filter(u => u.guildId === guildId && u.userId !== botId && !u.isBot);
  }

  /**
   * Set active cosmetic for user
   * @param {string} userId 
   * @param {string} guildId 
   * @param {string} cosmeticType - 'title', 'badge', or 'color'
   * @param {string} cosmeticId - ID of the cosmetic item
   */
  setActiveCosmetic(userId, guildId, cosmeticType, cosmeticId) {
    const user = this.getUser(userId, guildId);
    
    // Inicializar activeCosmetics si no existe (compatibilidad con usuarios antiguos)
    if (!user.activeCosmetics) {
      user.activeCosmetics = {
        titleId: null,
        badgeId: null,
        colorId: null
      };
    }
    
    // Verify user has the cosmetic
    if (cosmeticId && !user.inventory.some(inv => inv.itemId === cosmeticId)) {
      throw new Error('No posees este cosmético');
    }

    // Map cosmetic type to activeCosmetics property
    const typeMap = {
      'title': 'titleId',
      'badge': 'badgeId',
      'color': 'colorId'
    };

    if (typeMap[cosmeticType]) {
      user.activeCosmetics[typeMap[cosmeticType]] = cosmeticId;
      this.dataModified.users = true;
    }

    return user;
  }

  /**
   * Get active cosmetic by type
   */
  getActiveCosmetic(userId, guildId, cosmeticType) {
    const user = this.getUser(userId, guildId);
    
    // Inicializar si no existe
    if (!user.activeCosmetics) {
      user.activeCosmetics = {
        titleId: null,
        badgeId: null,
        colorId: null
      };
    }
    
    const typeMap = {
      'title': 'titleId',
      'badge': 'badgeId',
      'color': 'colorId'
    };

    return user.activeCosmetics[typeMap[cosmeticType]] || null;
  }

  /**
   * Get all active cosmetics for a user
   */
  getActiveCosmetics(userId, guildId) {
    const user = this.getUser(userId, guildId);
    
    // Inicializar si no existe
    if (!user.activeCosmetics) {
      user.activeCosmetics = {
        titleId: null,
        badgeId: null,
        colorId: null
      };
    }
    
    return user.activeCosmetics;
  }

  // ==================== CLANS ====================

  async loadClans() {
    try {
      const data = await fs.readFile(this.clansFile, 'utf-8');
      this.clans = JSON.parse(data);
      console.log(`${EMOJIS.CHECK} Clanes cargados: ${Object.keys(this.clans).length}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.clans = {};
        await this.saveClans();
        console.log(`${EMOJIS.INFO} Archivo de clanes creado (nuevo)`);
      } else {
        console.error(`${EMOJIS.ERROR} Error cargando clanes:`, error);
        this.clans = {};
      }
    }
  }

  async saveClans() {
    try {
      await fs.writeFile(this.clansFile, JSON.stringify(this.clans, null, 2), 'utf-8');
      this.dataModified.clans = false;
    } catch (error) {
      console.error(`${EMOJIS.ERROR} Error guardando clanes:`, error);
      throw error;
    }
  }

  /**
   * Create a new clan
   */
  createClan(clanName, tag, leaderId, guildId) {
    const clanId = `${guildId}_${Date.now()}`;

    this.clans[clanId] = {
      clanId: clanId,
      name: clanName,
      tag: tag,
      leaderId: leaderId,
      guildId: guildId,
      members: [leaderId],
      totalHonor: 0,
      level: 1,
      createdAt: new Date().toISOString()
    };

    this.dataModified.clans = true;
    return this.clans[clanId];
  }

  /**
   * Get clan by ID
   */
  getClan(clanId) {
    return this.clans[clanId] || null;
  }

  /**
   * Get all clans for a guild
   */
  getGuildClans(guildId) {
    return Object.values(this.clans).filter(c => c.guildId === guildId);
  }

  /**
   * Get user's clan
   */
  getUserClan(userId, guildId) {
    return Object.values(this.clans).find(clan =>
      clan.guildId === guildId && clan.members.includes(userId)
    ) || null;
  }

  /**
   * Update clan data
   */
  updateClan(clanId, updates) {
    const clan = this.getClan(clanId);
    if (!clan) return null;

    Object.assign(clan, updates);
    this.dataModified.clans = true;
    return clan;
  }

  /**
   * Delete a clan
   */
  deleteClan(clanId) {
    if (!this.clans[clanId]) return false;

    delete this.clans[clanId];
    this.dataModified.clans = true;
    return true;
  }

  /**
   * Add member to clan
   */
  addClanMember(clanId, userId) {
    const clan = this.getClan(clanId);
    if (!clan) return null;

    if (!clan.members.includes(userId)) {
      clan.members.push(userId);
      this.dataModified.clans = true;
    }

    return clan;
  }

  /**
   * Remove member from clan
   */
  removeClanMember(clanId, userId) {
    const clan = this.getClan(clanId);
    if (!clan) return null;

    const index = clan.members.indexOf(userId);
    if (index > -1) {
      clan.members.splice(index, 1);
      this.dataModified.clans = true;
    }

    return clan;
  }

  /**
   * Get clan level based on total honor
   * Returns: { level, maxMembers, name, color, nextLevelHonor }
   */
  getClanLevel(totalHonor) {
    const levels = [
      { level: 1, name: 'Clan Ronin', minHonor: 0, maxMembers: 5, color: '#8B8B8B', nextLevelHonor: 5000 },
      { level: 2, name: 'Clan Samurai', minHonor: 5000, maxMembers: 10, color: '#4A90E2', nextLevelHonor: 15000 },
      { level: 3, name: 'Clan Daimyo', minHonor: 15000, maxMembers: 15, color: '#FFD700', nextLevelHonor: 30000 },
      { level: 4, name: 'Clan Shogun', minHonor: 30000, maxMembers: 20, color: '#FF6B6B', nextLevelHonor: 50000 },
      { level: 5, name: 'Clan Legendario', minHonor: 50000, maxMembers: 25, color: '#9B59B6', nextLevelHonor: null }
    ];

    for (let i = levels.length - 1; i >= 0; i--) {
      if (totalHonor >= levels[i].minHonor) {
        return levels[i];
      }
    }

    return levels[0]; // Default: Clan Ronin
  }

  /**
   * Update clan stats (totalHonor, level)
   * Call this whenever a clan member's honor changes
   */
  updateClanStats(clanId) {
    const clan = this.getClan(clanId);
    if (!clan) return null;

    // Calculate total honor from all members
    let totalHonor = 0;
    for (const memberId of clan.members) {
      const user = this.getUser(memberId, clan.guildId);
      totalHonor += user.honor || 0;
    }

    // Update clan honor and level
    clan.totalHonor = totalHonor;
    const levelInfo = this.getClanLevel(totalHonor);
    clan.level = levelInfo.level;

    this.dataModified.clans = true;
    return clan;
  }

  /**
   * Check if user can create a clan
   * Returns: { canCreate: boolean, reason: string }
   */
  canCreateClan(userId, guildId) {
    const user = this.getUser(userId, guildId);

    // Check if user already in a clan
    if (user.clanId) {
      return { canCreate: false, reason: 'Ya perteneces a un clan. Debes salir primero.' };
    }

    // Check rank requirement (Daimyo = 2000+ honor)
    if (user.honor < 2000) {
      return { canCreate: false, reason: 'Necesitas el rango de **Daimyo** (2,000+ honor) para crear un clan.' };
    }

    // Check koku requirement
    if (user.koku < 5000) {
      return { canCreate: false, reason: 'Necesitas **5,000 koku** para crear un clan.' };
    }

    return { canCreate: true, reason: '' };
  }

  /**
   * Transfer clan leadership to a new leader
   */
  transferClanLeadership(clanId, newLeaderId) {
    const clan = this.getClan(clanId);
    if (!clan) return null;

    clan.leaderId = newLeaderId;
    this.dataModified.clans = true;
    return clan;
  }

  /**
   * Disband a clan (delete clan and remove clanId from all members)
   */
  disbandClan(clanId) {
    const clan = this.getClan(clanId);
    if (!clan) return false;

    // Remove clanId from all members
    for (const memberId of clan.members) {
      const user = this.getUser(memberId, clan.guildId);
      user.clanId = null;
      this.dataModified.users = true;
    }

    // Delete clan
    this.deleteClan(clanId);
    return true;
  }

  /**
   * Find clan by name or tag in a guild
   * Returns: clan object or null
   */
  findClanByNameOrTag(guildId, nameOrTag) {
    const search = nameOrTag.toLowerCase().trim();
    return Object.values(this.clans).find(clan =>
      clan.guildId === guildId &&
      (clan.name.toLowerCase() === search || clan.tag.toLowerCase() === search)
    ) || null;
  }

  /**
   * Check if clan name or tag already exists in guild
   */
  clanNameOrTagExists(guildId, name, tag) {
    return Object.values(this.clans).some(clan =>
      clan.guildId === guildId &&
      (clan.name.toLowerCase() === name.toLowerCase() || clan.tag.toLowerCase() === tag.toLowerCase())
    );
  }

  // ==================== COOLDOWNS ====================

  async loadCooldowns() {
    try {
      const data = await fs.readFile(this.cooldownsFile, 'utf-8');
      this.cooldowns = JSON.parse(data);
      console.log(`${EMOJIS.CHECK} Cooldowns cargados: ${Object.keys(this.cooldowns).length}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.cooldowns = {};
        await this.saveCooldowns();
        console.log(`${EMOJIS.INFO} Archivo de cooldowns creado (nuevo)`);
      } else {
        console.error(`${EMOJIS.ERROR} Error cargando cooldowns:`, error);
        this.cooldowns = {};
      }
    }
  }

  async saveCooldowns() {
    try {
      await fs.writeFile(this.cooldownsFile, JSON.stringify(this.cooldowns, null, 2), 'utf-8');
      this.dataModified.cooldowns = false;
    } catch (error) {
      console.error(`${EMOJIS.ERROR} Error guardando cooldowns:`, error);
      throw error;
    }
  }

  /**
   * Set cooldown for user and command
   */
  setCooldown(userId, commandName, seconds) {
    const key = `${userId}_${commandName}`;
    const expiresAt = Date.now() + (seconds * 1000);

    this.cooldowns[key] = {
      userId: userId,
      command: commandName,
      expiresAt: expiresAt
    };

    this.dataModified.cooldowns = true;

    // Auto-cleanup after expiry
    setTimeout(() => {
      delete this.cooldowns[key];
      this.dataModified.cooldowns = true;
    }, seconds * 1000);
  }

  /**
   * Check if user has active cooldown
   */
  hasCooldown(userId, commandName) {
    const key = `${userId}_${commandName}`;
    const cooldown = this.cooldowns[key];

    if (!cooldown) return false;

    // Check if expired
    if (Date.now() >= cooldown.expiresAt) {
      delete this.cooldowns[key];
      this.dataModified.cooldowns = true;
      return false;
    }

    return true;
  }

  /**
   * Get remaining cooldown time in seconds
   */
  getCooldownTime(userId, commandName) {
    const key = `${userId}_${commandName}`;
    const cooldown = this.cooldowns[key];

    if (!cooldown) return 0;

    const remaining = cooldown.expiresAt - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  /**
   * Remove a specific cooldown for a user
   */
  removeCooldown(userId, commandName) {
    const key = `${userId}_${commandName}`;
    if (this.cooldowns[key]) {
      delete this.cooldowns[key];
      this.dataModified.cooldowns = true;
      return true;
    }
    return false;
  }

  /**
   * Remove all expired cooldowns
   */
  cleanExpiredCooldowns() {
    const now = Date.now();
    let cleaned = 0;

    for (const key in this.cooldowns) {
      if (this.cooldowns[key].expiresAt <= now) {
        delete this.cooldowns[key];
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.dataModified.cooldowns = true;
      console.log(`${EMOJIS.INFO} Limpiados ${cleaned} cooldowns expirados`);
    }
  }

  // ==================== BOT CONFIG ====================

  async loadBotConfig() {
    try {
      const data = await fs.readFile(this.configFile, 'utf-8');
      this.botConfig = JSON.parse(data);
      console.log(`${EMOJIS.CHECK} Configuración del bot cargada`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.botConfig = {
          lastBackup: null,
          totalCommands: 0,
          startupCount: 0
        };
        await this.saveBotConfig();
        console.log(`${EMOJIS.INFO} Archivo de configuración creado (nuevo)`);
      } else {
        console.error(`${EMOJIS.ERROR} Error cargando configuración:`, error);
        this.botConfig = {};
      }
    }
  }

  async saveBotConfig() {
    try {
      await fs.writeFile(this.configFile, JSON.stringify(this.botConfig, null, 2), 'utf-8');
      this.dataModified.config = false;
    } catch (error) {
      console.error(`${EMOJIS.ERROR} Error guardando configuración:`, error);
      throw error;
    }
  }

  // ==================== AUTO-SAVE ====================

  /**
   * Start auto-save timer (saves every 5 minutes)
   */
  startAutoSave() {
    console.log(`${EMOJIS.LOADING} Iniciando auto-guardado (cada ${this.AUTO_SAVE_MINUTES} minutos)...`);

    this.autoSaveInterval = setInterval(async () => {
      // ✅ FIX BUG #4: Limpiar cooldowns expirados antes de guardar
      this.cleanExpiredCooldowns();
      await this.saveAll();
    }, this.AUTO_SAVE_MINUTES * 60 * 1000);
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log(`${EMOJIS.INFO} Auto-guardado detenido`);
    }
  }

  /**
   * Save all data (only saves files that were modified)
   */
  async saveAll() {
    const startTime = Date.now();
    let savedCount = 0;

    try {
      if (this.dataModified.users) {
        await this.saveUsers();
        savedCount++;
      }

      if (this.dataModified.clans) {
        await this.saveClans();
        savedCount++;
      }

      if (this.dataModified.cooldowns) {
        await this.saveCooldowns();
        savedCount++;
      }

      if (this.dataModified.config) {
        await this.saveBotConfig();
        savedCount++;
      }

      if (savedCount > 0) {
        const elapsed = Date.now() - startTime;
        console.log(`${EMOJIS.SUCCESS} Auto-guardado completado: ${savedCount} archivos guardados en ${elapsed}ms`);
      }
    } catch (error) {
      console.error(`${EMOJIS.ERROR} Error en auto-guardado:`, error);
    }
  }

  /**
   * Force save all data immediately (for graceful shutdown)
   */
  async forceSaveAll() {
    console.log(`${EMOJIS.SCROLL} Guardando todos los datos...`);

    await this.saveUsers();
    await this.saveClans();
    await this.saveCooldowns();
    await this.saveBotConfig();

    console.log(`${EMOJIS.SUCCESS} Todos los datos guardados exitosamente`);
  }

  // ==================== SISTEMA DE COMBATE ====================

  /**
   * Equipar un item (arma o armadura)
   * @param {string} userId - ID del usuario
   * @param {string} guildId - ID del servidor
   * @param {string} itemId - ID del item a equipar
   * @param {string} slot - 'weapon' o 'armor'
   * @returns {boolean} - True si se equipó correctamente
   */
  equipItem(userId, guildId, itemId, slot) {
    const user = this.getUser(userId, guildId);

    if (!user.combat) {
      user.combat = {
        equipment: { weapon: null, armor: null },
        skills: [],
        training: { strength: 0, agility: 0, ki_mastery: 0, vitality: 0 },
        consumables: []
      };
    }

    // Verificar que el usuario posee el item en su inventario
    const hasItem = user.inventory.some(inv => inv.itemId === itemId);
    if (!hasItem && itemId !== 'none') {
      return false;
    }

    // Equipar el item
    user.combat.equipment[slot] = itemId === 'none' ? null : itemId;
    this.dataModified.users = true;

    return true;
  }

  /**
   * Comprar una habilidad de combate
   * @param {string} userId - ID del usuario
   * @param {string} guildId - ID del servidor
   * @param {string} skillId - ID de la habilidad
   * @returns {boolean} - True si se compró correctamente
   */
  purchaseSkill(userId, guildId, skillId) {
    const user = this.getUser(userId, guildId);

    if (!user.combat) {
      user.combat = {
        equipment: { weapon: null, armor: null },
        skills: [],
        training: { strength: 0, agility: 0, ki_mastery: 0, vitality: 0 },
        consumables: []
      };
    }

    // Verificar que no tenga ya la habilidad
    if (user.combat.skills.includes(skillId)) {
      return false;
    }

    // Agregar habilidad
    user.combat.skills.push(skillId);
    this.dataModified.users = true;

    return true;
  }

  /**
   * Entrenar un stat
   * @param {string} userId - ID del usuario
   * @param {string} guildId - ID del servidor
   * @param {string} statType - Tipo de stat (strength, agility, ki_mastery, vitality)
   * @returns {Object} - { success: boolean, newLevel: number, message: string }
   */
  trainStat(userId, guildId, statType) {
    const user = this.getUser(userId, guildId);

    if (!user.combat) {
      user.combat = {
        equipment: { weapon: null, armor: null },
        skills: [],
        training: { strength: 0, agility: 0, ki_mastery: 0, vitality: 0 },
        consumables: []
      };
    }

    const training = CONSTANTS.TRAINING.TYPES[statType.toUpperCase()];
    if (!training) {
      return { success: false, newLevel: 0, message: 'Tipo de entrenamiento inválido' };
    }

    const currentLevel = user.combat.training[statType] || 0;

    // Verificar nivel máximo
    if (currentLevel >= training.maxLevel) {
      return { success: false, newLevel: currentLevel, message: `Ya alcanzaste el nivel máximo (${training.maxLevel})` };
    }

    // Incrementar nivel
    user.combat.training[statType] = currentLevel + 1;
    this.dataModified.users = true;

    return { success: true, newLevel: currentLevel + 1, message: 'Entrenamiento completado' };
  }

  /**
   * Agregar consumibles de combate al inventario
   * @param {string} userId - ID del usuario
   * @param {string} guildId - ID del servidor
   * @param {string} itemId - ID del consumible
   * @param {number} quantity - Cantidad a agregar
   */
  addConsumable(userId, guildId, itemId, quantity = 1) {
    const user = this.getUser(userId, guildId);

    if (!user.combat) {
      user.combat = {
        equipment: { weapon: null, armor: null },
        skills: [],
        training: { strength: 0, agility: 0, ki_mastery: 0, vitality: 0 },
        consumables: []
      };
    }

    // Buscar si ya tiene el consumible
    const existingItem = user.combat.consumables.find(c => c.itemId === itemId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.combat.consumables.push({ itemId, quantity });
    }

    this.dataModified.users = true;
  }

  /**
   * Usar un consumible de combate
   * @param {string} userId - ID del usuario
   * @param {string} guildId - ID del servidor
   * @param {string} itemId - ID del consumible
   * @returns {boolean} - True si se usó correctamente
   */
  useConsumable(userId, guildId, itemId) {
    const user = this.getUser(userId, guildId);

    if (!user.combat || !user.combat.consumables) {
      return false;
    }

    const consumable = user.combat.consumables.find(c => c.itemId === itemId);

    if (!consumable || consumable.quantity <= 0) {
      return false;
    }

    // Reducir cantidad
    consumable.quantity -= 1;

    // Eliminar si llegó a 0
    if (consumable.quantity === 0) {
      user.combat.consumables = user.combat.consumables.filter(c => c.itemId !== itemId);
    }

    this.dataModified.users = true;
    return true;
  }

  /**
   * Obtener stats de combate calculados de un usuario
   * @param {string} userId - ID del usuario
   * @param {string} guildId - ID del servidor
   * @returns {Object} - Stats de combate { maxHP, maxKi, damageBonus, damageMultiplier, evasionChance }
   */
  getCombatStats(userId, guildId) {
    const user = this.getUser(userId, guildId);

    if (!user.combat) {
      user.combat = {
        equipment: { weapon: null, armor: null },
        skills: [],
        training: { strength: 0, agility: 0, ki_mastery: 0, vitality: 0 },
        consumables: []
      };
    }

    return {
      maxHP: CONSTANTS.calculateMaxHP(user.combat),
      maxKi: CONSTANTS.calculateMaxKi(user.combat),
      damageBonus: CONSTANTS.calculateDamageBonus(user.combat),
      damageMultiplier: CONSTANTS.calculateDamageMultiplier(user.combat),
      evasionChance: CONSTANTS.calculateEvasionChance(user.combat),
      duelRank: CONSTANTS.getDuelRank(user.stats.duelsWon || 0)
    };
  }

  /**
   * Graceful shutdown - save all data and stop auto-save
   */
  async shutdown() {
    console.log(`${EMOJIS.WARNING} Iniciando cierre graceful del sistema de datos...`);

    this.stopAutoSave();
    await this.forceSaveAll();

    console.log(`${EMOJIS.SUCCESS} Sistema de datos cerrado correctamente`);
  }
}

// Export singleton instance
module.exports = new DataManager();

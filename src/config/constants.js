/**
 * DEMON HUNTER - Game Balance Constants
 * Todos los magic numbers centralizados para fácil ajuste de balance
 *
 * NOTA: Si cambias estos valores, afectarás la economía del bot.
 * Testea cuidadosamente antes de deployar cambios.
 */

const CONSTANTS = {
  // ==================== SISTEMA DE HONOR ====================
  HONOR: {
    // Honor ganado por actividades pasivas
    PER_MESSAGE: 5,                    // Honor por enviar mensaje (cooldown: 1 min)
    PER_VOICE_MINUTE: 1,               // Honor por minuto en canal de voz
    PER_VOICE_10MIN_BONUS: 10,         // Bonus cada 10 minutos consecutivos en voz

    // Rangos y umbrales
    RANKS: {
      RONIN: { min: 0, max: 499, name: 'Ronin' },
      SAMURAI: { min: 500, max: 1999, name: 'Samurai' },
      DAIMYO: { min: 2000, max: 4999, name: 'Daimyo' },
      SHOGUN: { min: 5000, max: Infinity, name: 'Shogun' }
    },

    // Umbrales específicos (para compatibilidad con código existente)
    RANK_THRESHOLDS: {
      SAMURAI: 500,
      DAIMYO: 2000,
      SHOGUN: 5000
    }
  },

  // ==================== SISTEMA DE ECONOMÍA (KOKU) ====================
  ECONOMY: {
    // Koku ganado por actividades pasivas
    PER_MESSAGE: 2,                    // Koku por mensaje (cooldown: 1 min)
    PER_VOICE_MINUTE: 0.5,             // Koku por minuto en voz (otorgado al salir)
    PER_VOICE_10MIN_BONUS: 5,          // Bonus cada 10 minutos consecutivos en voz

    // Daily rewards
    DAILY: {
      BASE_REWARD: 100,                 // Koku base de recompensa diaria

      // Multiplicadores por rango
      RANK_MULTIPLIERS: {
        RONIN: 1,
        SAMURAI: 1.5,
        DAIMYO: 2,
        SHOGUN: 3
      },

      // Bonus de streak (adicional multiplicativo)
      STREAK_BONUSES: {
        DAYS_7: 0.5,                    // +50% a partir del día 7
        DAYS_14: 1,                     // +100% a partir del día 14
        DAYS_30: 2,                     // +200% a partir del día 30
        DAYS_90: 4                      // +400% a partir del día 90
      },

      // Tiempo antes de perder streak
      STREAK_TIMEOUT_HOURS: 48          // Perder streak después de 48 horas sin reclamar
    },

    // Límites de transferencia
    PAYMENT: {
      MIN_AMOUNT: 10,
      MAX_AMOUNT: 10000
    }
  },

  // ==================== SISTEMA DE CLANES ====================
  CLANS: {
    // Costos
    CREATION_COST: 5000,                // Koku necesarios para crear clan
    CREATION_HONOR_REQUIRED: 2000,      // Honor necesario (rango Daimyo)

    // Límites de nombres
    NAME: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 30
    },
    TAG: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 5,
      REGEX: /^[A-Z0-9]+$/i             // Solo letras y números
    },

    // Niveles de clan
    LEVELS: [
      { level: 1, name: 'Clan Ronin', minHonor: 0, maxMembers: 5, color: '#8B8B8B', nextLevelHonor: 5000 },
      { level: 2, name: 'Clan Samurai', minHonor: 5000, maxMembers: 10, color: '#4A90E2', nextLevelHonor: 15000 },
      { level: 3, name: 'Clan Daimyo', minHonor: 15000, maxMembers: 15, color: '#FFD700', nextLevelHonor: 30000 },
      { level: 4, name: 'Clan Shogun', minHonor: 30000, maxMembers: 20, color: '#FF6B6B', nextLevelHonor: 50000 },
      { level: 5, name: 'Clan Legendario', minHonor: 50000, maxMembers: 25, color: '#9B59B6', nextLevelHonor: null }
    ]
  },

  // ==================== COOLDOWNS Y LÍMITES DE TIEMPO ====================
  COOLDOWNS: {
    // Cooldowns de comandos (segundos)
    COMMAND_DEFAULT: 5,                 // Cooldown por defecto para comandos
    TESTWELCOME: 5,
    BORRARMSG: 5,
    HONOR_MESSAGE: 60,                  // Cooldown para ganar honor por mensaje

    // Rate limiting global
    GLOBAL_RATE_LIMIT: {
      MAX_COMMANDS: 10,                 // Máximo de comandos
      WINDOW_SECONDS: 60,               // En ventana de tiempo (segundos)
      REFILL_RATE: 6                    // Recargar 1 comando cada X segundos
    }
  },

  // ==================== MODERACIÓN ====================
  MODERATION: {
    // Límites de borrado de mensajes
    DELETE: {
      MAX_MESSAGES: 500,                // Máximo de mensajes a borrar por comando
      UNDO_TIMEOUT_MINUTES: 5,          // Tiempo para deshacer borrado
      BULK_DELETE_DAYS_LIMIT: 14        // Discord limita bulkDelete a 14 días
    }
  },

  // ==================== VOZ (TTS Y TRACKING) ====================
  VOICE: {
    // TTS
    VOICE_NAME_REPEAT_SECONDS: 20,      // Segundos antes de repetir nombre en lectura automática
    MESSAGE_READ_DELAY_MS: 500,         // Delay entre mensajes para evitar rate limit

    // Tracking
    HONOR_GRANT_INTERVAL_MINUTES: 10,   // Intervalo para otorgar honor en voz activa
    TRACKING_CLEANUP_HOURS: 1,          // Limpiar tracking huérfano cada X horas
    TRACKING_MAX_AGE_HOURS: 1           // Eliminar tracking más viejo que X horas
  },

  // ==================== DATA PERSISTENCE ====================
  DATA: {
    AUTO_SAVE_MINUTES: 5,               // Guardar datos cada X minutos
    BACKUP_RETENTION_DAYS: 7,           // Mantener backups por X días
    BACKUP_INTERVAL_HOURS: 6,           // Crear backup cada X horas
    BACKUP_MAX_FILES: 28                // Máximo de archivos de backup a mantener (7 días * 4 backups/día)
  },

  // ==================== LEADERBOARDS Y UI ====================
  LEADERBOARDS: {
    TOP_DISPLAY_COUNT: 10,              // Mostrar top X en leaderboards
    USERNAME_CACHE_TTL_MINUTES: 60,     // Caché de usernames por X minutos
    PROGRESS_BAR_LENGTH: 15             // Longitud de barra de progreso en caracteres
  },

  // ==================== VALIDACIONES ====================
  VALIDATION: {
    DISCORD_SNOWFLAKE_REGEX: /^\d{17,19}$/,  // Regex para IDs de Discord
    CLAN_NAME_FORBIDDEN_CHARS: /[<>@#&]/,     // Caracteres prohibidos en nombres de clan
    MAX_EMBED_FIELDS: 25,                      // Discord límite de campos en embed
    MAX_EMBED_DESCRIPTION: 4096                // Discord límite de descripción
  },

  // ==================== SISTEMA DE DUELOS ====================
  DUELS: {
    MIN_BET: 10,                             // Apuesta mínima de honor
    MAX_BET: 500,                            // Apuesta máxima de honor
    COOLDOWN: 60,                            // Cooldown en segundos
    INVITE_TIMEOUT: 30,                      // Tiempo de espera para aceptar duelo (segundos)
    TURN_TIMEOUT: 45,                        // Segundos para elegir acción en turno

    // Rankings de duelo (basado en victorias)
    RANKS: {
      NOVATO: { min: 0, max: 9, name: 'Novato', emoji: '🥋', color: '#95A5A6' },
      EXPERTO: { min: 10, max: 29, name: 'Experto', emoji: '⚔️', color: '#3498DB' },
      MAESTRO: { min: 30, max: 99, name: 'Maestro', emoji: '👺', color: '#E74C3C' },
      LEYENDA: { min: 100, max: Infinity, name: 'Leyenda', emoji: '🏯', color: '#F39C12' }
    }
  },

  // ==================== SISTEMA DE COMBATE ====================
  COMBAT: {
    // Stats base
    BASE_HP: 100,                            // HP inicial
    BASE_KI: 3,                              // Ki (energía) por turno
    MAX_TURNS: 20,                           // Turnos máximos antes de empate

    // Tipos de acciones en combate
    ACTIONS: {
      LIGHT_ATTACK: {
        id: 'light_attack',
        name: 'Ataque Rápido',
        emoji: '⚡',
        kiCost: 1,
        damage: { min: 15, max: 25 },
        accuracy: 0.80,                      // 80% de acierto
        description: 'Ataque veloz con buena precisión'
      },
      HEAVY_ATTACK: {
        id: 'heavy_attack',
        name: 'Ataque Pesado',
        emoji: '💥',
        kiCost: 2,
        damage: { min: 30, max: 45 },
        accuracy: 0.60,                      // 60% de acierto
        description: 'Ataque poderoso pero menos preciso'
      },
      CRITICAL_STRIKE: {
        id: 'critical_strike',
        name: 'Golpe Crítico',
        emoji: '💢',
        kiCost: 3,
        damage: { min: 50, max: 70 },
        accuracy: 0.40,                      // 40% de acierto
        description: 'Golpe devastador de alto riesgo'
      },
      DEFEND: {
        id: 'defend',
        name: 'Defender',
        emoji: '🛡️',
        kiCost: 0,
        damageReduction: 0.50,               // Reduce 50% daño próximo turno
        description: 'Postura defensiva para mitigar daño'
      },
      COUNTER: {
        id: 'counter',
        name: 'Contraataque',
        emoji: '⚔️',
        kiCost: 2,
        counterMultiplier: 1.5,              // Devuelve 150% del daño bloqueado
        successChance: 0.50,                 // 50% de éxito
        description: 'Bloquea y contraataca si tienes éxito'
      }
    },

    // Armas disponibles (equipables, se compran en tienda)
    WEAPONS: {
      NONE: {
        id: 'none',
        name: 'Sin Arma',
        emoji: '👊',
        damageBonus: 0,
        price: 0,
        description: 'Combate desarmado'
      },
      WOODEN_KATANA: {
        id: 'wooden_katana',
        name: 'Katana de Madera',
        emoji: '🗡️',
        damageBonus: 5,
        price: 1000,
        description: 'Katana de entrenamiento (+5 daño)'
      },
      STEEL_KATANA: {
        id: 'steel_katana',
        name: 'Katana Forjada',
        emoji: '⚔️',
        damageBonus: 10,
        price: 5000,
        description: 'Katana de acero templado (+10 daño)'
      },
      LEGENDARY_KATANA: {
        id: 'legendary_katana',
        name: 'Katana Legendaria',
        emoji: '🔥',
        damageBonus: 20,
        price: 25000,
        description: 'Obra maestra forjada por un maestro herrero (+20 daño)'
      }
    },

    // Armaduras disponibles
    ARMOR: {
      NONE: {
        id: 'none',
        name: 'Sin Armadura',
        emoji: '👔',
        hpBonus: 0,
        price: 0,
        description: 'Sin protección'
      },
      APPRENTICE_GI: {
        id: 'apprentice_gi',
        name: 'Gi del Aprendiz',
        emoji: '🥋',
        hpBonus: 10,
        price: 800,
        description: 'Vestimenta básica de entrenamiento (+10 HP)'
      },
      DAIMYO_ARMOR: {
        id: 'daimyo_armor',
        name: 'Armadura del Daimyo',
        emoji: '🛡️',
        hpBonus: 25,
        price: 3000,
        description: 'Armadura reforzada de señor feudal (+25 HP)'
      },
      SHOGUN_ARMOR: {
        id: 'shogun_armor',
        name: 'Armadura del Shogun',
        emoji: '👑',
        hpBonus: 50,
        price: 15000,
        description: 'Armadura sagrada del comandante supremo (+50 HP)'
      }
    },

    // Habilidades especiales (se compran permanentemente)
    SKILLS: {
      FLAME_SLASH: {
        id: 'flame_slash',
        name: 'Corte Llameante',
        emoji: '🔥',
        kiCost: 3,
        damage: 60,
        accuracy: 1.0,                       // 100% garantizado
        cooldown: 3,                         // Turnos de cooldown
        price: 5000,
        description: 'Corte infernal que causa 60 daño garantizado'
      },
      TEMPEST_DANCE: {
        id: 'tempest_dance',
        name: 'Danza de la Tempestad',
        emoji: '🌪️',
        kiCost: 3,
        hits: 3,
        damagePerHit: { min: 12, max: 18 },
        accuracy: 0.70,
        cooldown: 4,
        price: 7500,
        description: 'Tres ataques rápidos en sucesión'
      },
      SHOGUN_STANCE: {
        id: 'shogun_stance',
        name: 'Postura del Shogun',
        emoji: '🏯',
        kiCost: 3,
        immunity: true,                      // Inmunidad completa 1 turno
        cooldown: 5,
        price: 10000,
        description: 'Inmunidad total al daño durante 1 turno'
      },
      HEAVEN_BLADE: {
        id: 'heaven_blade',
        name: 'Filo Celestial',
        emoji: '⚡',
        kiCost: 3,
        damage: 100,
        accuracy: 1.0,
        usesPerDuel: 1,                      // Solo 1 uso por duelo
        price: 15000,
        description: 'Técnica definitiva: 100 daño garantizado (1 uso/duelo)'
      }
    },

    // Items consumibles (se usan en duelo)
    CONSUMABLES: {
      HEALING_TEA: {
        id: 'healing_tea',
        name: 'Té Medicinal',
        emoji: '🍵',
        healAmount: 30,
        price: 200,
        description: 'Restaura 30 HP durante el combate'
      },
      WARRIOR_ELIXIR: {
        id: 'warrior_elixir',
        name: 'Elixir del Guerrero',
        emoji: '💊',
        damageBoost: 0.50,                   // +50% daño
        duration: 3,                         // 3 turnos
        price: 500,
        description: 'Aumenta tu daño en 50% por 3 turnos'
      },
      PRECISION_CHARM: {
        id: 'precision_charm',
        name: 'Amuleto de Precisión',
        emoji: '🔮',
        accuracyBoost: 0.30,                 // +30% precisión
        duration: 999,                       // Todo el duelo
        price: 300,
        description: 'Aumenta la precisión en 30% durante todo el duelo'
      },
      KI_POTION: {
        id: 'ki_potion',
        name: 'Poción de Ki',
        emoji: '⚗️',
        kiRestore: 2,
        price: 250,
        description: 'Restaura 2 puntos de Ki inmediatamente'
      }
    }
  },

  // ==================== SISTEMA DE ENTRENAMIENTOS ====================
  TRAINING: {
    // Límites de entrenamiento
    MAX_LEVEL: 20,                           // Nivel máximo de cada stat

    // Tipos de entrenamiento disponibles
    TYPES: {
      STRENGTH: {
        id: 'strength',
        name: 'Entrenar Fuerza',
        emoji: '💪',
        baseCost: 500,
        costIncrease: 50,                    // +50 koku por nivel
        maxLevel: 20,
        bonusPerLevel: 0.01,                 // +1% daño por nivel
        description: 'Aumenta tu daño base permanentemente'
      },
      AGILITY: {
        id: 'agility',
        name: 'Entrenar Agilidad',
        emoji: '🏃',
        baseCost: 500,
        costIncrease: 50,
        maxLevel: 15,
        bonusPerLevel: 0.02,                 // +2% evasión por nivel
        description: 'Aumenta tu probabilidad de esquivar ataques'
      },
      KI_MASTERY: {
        id: 'ki_mastery',
        name: 'Meditar Ki',
        emoji: '🧘',
        baseCost: 2000,
        costIncrease: 500,
        maxLevel: 5,
        bonusPerLevel: 1,                    // +1 Ki máximo por nivel
        description: 'Aumenta tu Ki máximo por turno'
      },
      VITALITY: {
        id: 'vitality',
        name: 'Entrenar Resistencia',
        emoji: '❤️',
        baseCost: 750,
        costIncrease: 75,
        maxLevel: 10,
        bonusPerLevel: 5,                    // +5 HP por nivel
        description: 'Aumenta tu HP máximo permanentemente'
      }
    }
  },

  // ==================== SISTEMA DE TIENDA ====================
  SHOP: {
    // Inventario
    DEFAULT_INVENTORY_SIZE: 50,        // Slots de inventario por defecto
    INVENTORY_EXPAND_BONUS: 10,        // Slots adicionales por expansión

    // Categorías de items
    CATEGORIES: {
      BOOSTS: 'boosts',
      COSMETICS: 'cosmetics',
      PERMANENT: 'permanent',
      WEAPONS: 'weapons',              // Armas de combate
      ARMOR: 'armor',                  // Armaduras
      SKILLS: 'skills',                // Habilidades especiales
      CONSUMABLES: 'consumables'       // Items consumibles de combate
    },

    // Items de la tienda
    ITEMS: {
      // ========== BOOSTS TEMPORALES ==========
      HONOR_BOOST_2X_24H: {
        id: 'honor_boost_2x_24h',
        name: '⚡ Boost de Honor x2',
        description: 'Duplica el honor ganado por 24 horas',
        category: 'boosts',
        price: 750,
        type: 'boost',
        duration: 24 * 60 * 60 * 1000, // 24 horas en ms
        effect: { honorMultiplier: 2 }
      },
      HONOR_BOOST_3X_12H: {
        id: 'honor_boost_3x_12h',
        name: '🔥 Boost de Honor x3',
        description: 'Triplica el honor ganado por 12 horas',
        category: 'boosts',
        price: 1000,
        type: 'boost',
        duration: 12 * 60 * 60 * 1000, // 12 horas en ms
        effect: { honorMultiplier: 3 }
      },
      KOKU_BOOST_2X_24H: {
        id: 'koku_boost_2x_24h',
        name: '💰 Boost de Koku x2',
        description: 'Duplica el koku ganado por 24 horas',
        category: 'boosts',
        price: 600,
        type: 'boost',
        duration: 24 * 60 * 60 * 1000,
        effect: { kokuMultiplier: 2 }
      },
      COOLDOWN_REDUCE_50_12H: {
        id: 'cooldown_reduce_50_12h',
        name: '⏱️ Reducción de Cooldowns',
        description: 'Reduce todos los cooldowns en 50% por 12 horas',
        category: 'boosts',
        price: 500,
        type: 'boost',
        duration: 12 * 60 * 60 * 1000,
        effect: { cooldownReduction: 0.5 }
      },
      DAILY_BONUS_2X: {
        id: 'daily_bonus_2x',
        name: '🎁 Daily Bonus x2',
        description: 'Duplica tu próxima recompensa diaria',
        category: 'boosts',
        price: 400,
        type: 'consumable',
        effect: { dailyMultiplier: 2 }
      },

      // ========== ITEMS COSMÉTICOS ==========
      TITLE_ELITE: {
        id: 'title_elite',
        name: '👑 Título: Guerrero Elite',
        description: 'Título especial que aparece en tu perfil',
        category: 'cosmetics',
        price: 1500,
        type: 'permanent',
        effect: { title: 'Guerrero Elite' }
      },
      TITLE_LEGEND: {
        id: 'title_legend',
        name: '🌟 Título: Leyenda del Dojo',
        description: 'Título legendario exclusivo',
        category: 'cosmetics',
        price: 5000,
        type: 'permanent',
        effect: { title: 'Leyenda del Dojo' }
      },
      BADGE_VETERAN: {
        id: 'badge_veteran',
        name: '🏅 Badge: Veterano',
        description: 'Badge que muestra tu experiencia',
        category: 'cosmetics',
        price: 2000,
        type: 'permanent',
        effect: { badge: 'Veterano' }
      },
      COLOR_ROLE_BRONZE: {
        id: 'color_role_bronze',
        name: '🥉 Rol de Color: Bronce',
        description: 'Rol con color personalizado (Bronce)',
        category: 'cosmetics',
        price: 3000,
        type: 'permanent',
        effect: { roleColor: '#CD7F32' }
      },
      COLOR_ROLE_SILVER: {
        id: 'color_role_silver',
        name: '🥈 Rol de Color: Plata',
        description: 'Rol con color personalizado (Plata)',
        category: 'cosmetics',
        price: 5000,
        type: 'permanent',
        effect: { roleColor: '#C0C0C0' }
      },
      COLOR_ROLE_GOLD: {
        id: 'color_role_gold',
        name: '🥇 Rol de Color: Oro',
        description: 'Rol con color personalizado (Oro)',
        category: 'cosmetics',
        price: 10000,
        type: 'permanent',
        effect: { roleColor: '#FFD700' }
      },

      // ========== ITEMS PERMANENTES ==========
      INVENTORY_EXPAND: {
        id: 'inventory_expand',
        name: '🎒 Expansión de Inventario',
        description: 'Aumenta tu capacidad de inventario en +10 slots',
        category: 'permanent',
        price: 2500,
        type: 'permanent',
        effect: { inventorySlots: 10 }
      },
      EXTRA_DAILY_CLAIM: {
        id: 'extra_daily_claim',
        name: '📅 Reclamo Diario Extra',
        description: 'Permite reclamar el daily una vez más hoy',
        category: 'permanent',
        price: 800,
        type: 'consumable',
        effect: { extraDaily: true }
      },
      HONOR_BONUS_PERMANENT: {
        id: 'honor_bonus_permanent',
        name: '⭐ Bonus de Honor Permanente',
        description: '+5% de honor permanente en todas las actividades',
        category: 'permanent',
        price: 15000,
        type: 'permanent',
        effect: { honorBonus: 0.05 }
      },

      // ========== ARMAS DE COMBATE ==========
      WOODEN_KATANA: {
        id: 'wooden_katana',
        name: '🗡️ Katana de Madera',
        description: 'Katana de entrenamiento (+5 daño)',
        category: 'weapons',
        price: 1000,
        type: 'equipment',
        stats: { damageBonus: 5 }
      },
      STEEL_KATANA: {
        id: 'steel_katana',
        name: '⚔️ Katana Forjada',
        description: 'Katana de acero templado (+10 daño)',
        category: 'weapons',
        price: 5000,
        type: 'equipment',
        stats: { damageBonus: 10 }
      },
      LEGENDARY_KATANA: {
        id: 'legendary_katana',
        name: '🔥 Katana Legendaria',
        description: 'Obra maestra forjada (+20 daño)',
        category: 'weapons',
        price: 25000,
        type: 'equipment',
        stats: { damageBonus: 20 }
      },

      // ========== ARMADURAS ==========
      APPRENTICE_GI: {
        id: 'apprentice_gi',
        name: '🥋 Gi del Aprendiz',
        description: 'Vestimenta básica de entrenamiento (+10 HP)',
        category: 'armor',
        price: 800,
        type: 'equipment',
        stats: { hpBonus: 10 }
      },
      DAIMYO_ARMOR: {
        id: 'daimyo_armor',
        name: '🛡️ Armadura del Daimyo',
        description: 'Armadura reforzada (+25 HP)',
        category: 'armor',
        price: 3000,
        type: 'equipment',
        stats: { hpBonus: 25 }
      },
      SHOGUN_ARMOR: {
        id: 'shogun_armor',
        name: '👑 Armadura del Shogun',
        description: 'Armadura sagrada (+50 HP)',
        category: 'armor',
        price: 15000,
        type: 'equipment',
        stats: { hpBonus: 50 }
      },

      // ========== HABILIDADES ESPECIALES ==========
      FLAME_SLASH: {
        id: 'flame_slash',
        name: '🔥 Corte Llameante',
        description: 'Corte infernal: 60 daño garantizado',
        category: 'skills',
        price: 5000,
        type: 'skill',
        skillData: { damage: 60, kiCost: 3, cooldown: 3 }
      },
      TEMPEST_DANCE: {
        id: 'tempest_dance',
        name: '🌪️ Danza de la Tempestad',
        description: 'Tres ataques rápidos en sucesión',
        category: 'skills',
        price: 7500,
        type: 'skill',
        skillData: { hits: 3, kiCost: 3, cooldown: 4 }
      },
      SHOGUN_STANCE: {
        id: 'shogun_stance',
        name: '🏯 Postura del Shogun',
        description: 'Inmunidad total 1 turno',
        category: 'skills',
        price: 10000,
        type: 'skill',
        skillData: { immunity: true, kiCost: 3, cooldown: 5 }
      },
      HEAVEN_BLADE: {
        id: 'heaven_blade',
        name: '⚡ Filo Celestial',
        description: 'Técnica definitiva: 100 daño (1 uso/duelo)',
        category: 'skills',
        price: 15000,
        type: 'skill',
        skillData: { damage: 100, kiCost: 3, usesPerDuel: 1 }
      },

      // ========== CONSUMIBLES DE COMBATE ==========
      HEALING_TEA: {
        id: 'healing_tea',
        name: '🍵 Té Medicinal',
        description: 'Restaura 30 HP en combate',
        category: 'consumables',
        price: 200,
        type: 'consumable',
        effect: { healAmount: 30 }
      },
      WARRIOR_ELIXIR: {
        id: 'warrior_elixir',
        name: '💊 Elixir del Guerrero',
        description: '+50% daño por 3 turnos',
        category: 'consumables',
        price: 500,
        type: 'consumable',
        effect: { damageBoost: 0.50, duration: 3 }
      },
      PRECISION_CHARM: {
        id: 'precision_charm',
        name: '🔮 Amuleto de Precisión',
        description: '+30% precisión todo el duelo',
        category: 'consumables',
        price: 300,
        type: 'consumable',
        effect: { accuracyBoost: 0.30, duration: 999 }
      },
      KI_POTION: {
        id: 'ki_potion',
        name: '⚗️ Poción de Ki',
        description: 'Restaura 2 Ki inmediatamente',
        category: 'consumables',
        price: 250,
        type: 'consumable',
        effect: { kiRestore: 2 }
      }
    }
  },

  // ==================== SISTEMA DE FORTUNA (OMIKUJI) ====================
  FORTUNE: {
    COOLDOWN: 86400,                         // 24 horas en segundos

    // Tipos de fortuna con probabilidades y bonificaciones
    TYPES: {
      DAI_KICHI: {
        name: 'Dai-kichi',
        chance: 0.10,                        // 10% probabilidad
        bonus: 0.20,                         // +20% honor por 24h
        emoji: '🌸'
      },
      KICHI: {
        name: 'Kichi',
        chance: 0.30,                        // 30% probabilidad
        bonus: 0.10,                         // +10% honor por 24h
        emoji: '⭐'
      },
      CHUKICHI: {
        name: 'Chukichi',
        chance: 0.40,                        // 40% probabilidad
        bonus: 0,                            // Sin bonus
        emoji: '🌑'
      },
      KYO: {
        name: 'Kyo',
        chance: 0.20,                        // 20% probabilidad
        bonus: -0.10,                        // -10% honor por 24h
        emoji: '⚠️'
      }
    }
  },

  // ==================== SISTEMA DE TRADUCCIÓN ====================
  TRANSLATION: {
    MAX_LENGTH: 500,                         // Máximo de caracteres a traducir
    COOLDOWN: 5,                             // Cooldown en segundos

    LANGUAGES: {
      SPANISH: { code: 'es', name: 'Español', flag: '🇪🇸' },
      JAPANESE: { code: 'ja', name: 'Japonés', flag: '🇯🇵' },
      ENGLISH: { code: 'en', name: 'Inglés', flag: '🇬🇧' }
    }
  },

  // ==================== BASE DE DATOS DE SABIDURÍA SAMURAI ====================
  WISDOM_QUOTES: [
    // Miyamoto Musashi
    { quote: 'No pienses deshonestamente. El camino está en el entrenamiento.', author: 'Miyamoto Musashi' },
    { quote: 'Acepta todo tal y como es.', author: 'Miyamoto Musashi' },
    { quote: 'No busques placer por placer mismo.', author: 'Miyamoto Musashi' },
    { quote: 'No permitas que te afecte ningún evento.', author: 'Miyamoto Musashi' },
    { quote: 'No lamentes lo que has perdido.', author: 'Miyamoto Musashi' },
    { quote: 'No envidies a los demás, ni en lo bueno ni en lo malo.', author: 'Miyamoto Musashi' },
    { quote: 'No tengas preferencia hacia nada en particular.', author: 'Miyamoto Musashi' },
    { quote: 'Haz de ti mismo el camino que debes seguir.', author: 'Miyamoto Musashi' },
    { quote: 'Estudia el camino de todas las profesiones.', author: 'Miyamoto Musashi' },
    { quote: 'Conoce la diferencia entre ganar y perder en asuntos materiales.', author: 'Miyamoto Musashi' },
    { quote: 'Desarrolla la habilidad intuitiva de juzgar en todas las cosas.', author: 'Miyamoto Musashi' },
    { quote: 'Percibe aquellas cosas que no pueden verse.', author: 'Miyamoto Musashi' },
    { quote: 'Presta atención incluso a las cosas más triviales.', author: 'Miyamoto Musashi' },
    { quote: 'No hagas nada que sea inútil.', author: 'Miyamoto Musashi' },
    { quote: 'La espada tiene que ser más que un simple arma; tiene que ser una respuesta a la vida.', author: 'Miyamoto Musashi' },

    // Hagakure (El Código del Samurái)
    { quote: 'El camino del samurái se encuentra en la muerte.', author: 'Hagakure' },
    { quote: 'Cuando surge la ocasión, sé rápido como el viento; cuando estés en calma, sé como el bosque.', author: 'Hagakure' },
    { quote: 'Un samurái debe permanecer calmado en todo momento, incluso ante el caos.', author: 'Hagakure' },
    { quote: 'Si tienes que elegir, escoge siempre el camino más difícil.', author: 'Hagakure' },
    { quote: 'La lealtad y la piedad filial son fundamentales para el samurái.', author: 'Hagakure' },
    { quote: 'No hay nada fuera de ti que pueda permitirte convertirte en un mejor guerrero.', author: 'Hagakure' },
    { quote: 'En el camino del samurái, la muerte debe ser lo primero en la mente.', author: 'Hagakure' },
    { quote: 'Aquel que se aferra a la vida morirá, y aquel que desafía a la muerte vivirá.', author: 'Hagakure' },
    { quote: 'Un samurái no debería tener otro pensamiento que el de cumplir con su deber.', author: 'Hagakure' },
    { quote: 'La victoria depende de la estrategia y no del número de guerreros.', author: 'Hagakure' },

    // Sun Tzu
    { quote: 'El arte supremo de la guerra es someter al enemigo sin luchar.', author: 'Sun Tzu' },
    { quote: 'Si conoces al enemigo y te conoces a ti mismo, no temas el resultado de cien batallas.', author: 'Sun Tzu' },
    { quote: 'En medio del caos, también hay oportunidad.', author: 'Sun Tzu' },
    { quote: 'Las oportunidades se multiplican al ser tomadas.', author: 'Sun Tzu' },
    { quote: 'La victoria ama la preparación.', author: 'Sun Tzu' },
    { quote: 'Aparece en lugares a los que tu enemigo debe acudir. Muévete rápidamente a lugares donde no te espera.', author: 'Sun Tzu' },
    { quote: 'Toda batalla se gana antes de ser luchada.', author: 'Sun Tzu' },
    { quote: 'El guerrero sabio evita la batalla.', author: 'Sun Tzu' },
    { quote: 'La invencibilidad está en la defensa; la posibilidad de victoria, en el ataque.', author: 'Sun Tzu' },
    { quote: 'Cuando seas débil, aparenta fortaleza. Cuando seas fuerte, aparenta debilidad.', author: 'Sun Tzu' },

    // Bushido (El Código del Guerrero)
    { quote: 'El verdadero guerrero es aquel que conquista a sí mismo.', author: 'Bushido' },
    { quote: 'La rectitud es el poder de decidir un determinado curso de conducta de acuerdo con la razón.', author: 'Bushido' },
    { quote: 'El coraje sin honor es la ferocidad de una bestia.', author: 'Bushido' },
    { quote: 'La benevolencia es el amor, el afecto por los demás, la compasión y la simpatía.', author: 'Bushido' },
    { quote: 'La cortesía es el resultado del dominio de uno mismo.', author: 'Bushido' },
    { quote: 'La sinceridad es la base de toda virtud.', author: 'Bushido' },
    { quote: 'El honor es el sentimiento de la propia dignidad.', author: 'Bushido' },
    { quote: 'La lealtad es la virtud fundamental del guerrero.', author: 'Bushido' },
    { quote: 'El autocontrol es la piedra angular del carácter.', author: 'Bushido' },
    { quote: 'Un samurái sin espada es como un samurái con espada. Uno solo.', author: 'Bushido' },

    // Proverbios Japoneses
    { quote: 'Cae siete veces, levántate ocho.', author: 'Proverbio Japonés' },
    { quote: 'El clavo que sobresale será martillado.', author: 'Proverbio Japonés' },
    { quote: 'Incluso el polvo, si se acumula, puede formar montañas.', author: 'Proverbio Japonés' },
    { quote: 'La visión sin acción es un sueño. La acción sin visión es una pesadilla.', author: 'Proverbio Japonés' },
    { quote: 'El bambú que se dobla es más fuerte que el roble que resiste.', author: 'Proverbio Japonés' },
    { quote: 'Un solo minuto puede decidir el resultado de una batalla, y una sola batalla puede decidir el resultado de una guerra.', author: 'Proverbio Japonés' },
    { quote: 'No temas crecer lentamente; solo teme quedarte quieto.', author: 'Proverbio Japonés' },
    { quote: 'El sabio aprende más de sus enemigos que el tonto de sus amigos.', author: 'Proverbio Japonés' },
    { quote: 'Si el problema tiene solución, ¿para qué preocuparse? Si no tiene solución, ¿para qué preocuparse?', author: 'Proverbio Japonés' },
    { quote: 'Mil millas comienzan con un solo paso.', author: 'Proverbio Japonés' }
  ],

  // ==================== SISTEMA DE MÚSICA (DOJO DEL SONIDO) ====================
  MUSIC: {
    // Volumen
    DEFAULT_VOLUME: 50,           // Volumen predeterminado (0-100)
    MIN_VOLUME: 0,                // Volumen mínimo
    MAX_VOLUME: 100,              // Volumen máximo

    // Cola de reproducción
    MAX_QUEUE_SIZE: 100,          // Máximo de canciones en cola
    MAX_SONG_DURATION: 3600,      // Duración máxima en segundos (1 hora)

    // Búsqueda
    SEARCH_RESULTS_LIMIT: 5,      // Resultados a mostrar en búsqueda
    SEARCH_TIMEOUT: 30,           // Segundos para seleccionar de búsqueda

    // Timeouts
    INACTIVITY_TIMEOUT: 300,      // Segundos de inactividad antes de desconectar (5 min)
    DISCONNECT_DELAY: 5,          // Segundos antes de desconectar del canal

    // Playlists de usuario
    MAX_PLAYLIST_SIZE: 50,        // Canciones por playlist
    MAX_PLAYLISTS_PER_USER: 20,   // Playlists por usuario

    // Panel de música (actualización)
    PANEL_UPDATE_INTERVAL: 10,    // Segundos entre actualizaciones del panel
    PANEL_MAX_QUEUE_DISPLAY: 5,   // Canciones a mostrar en el panel

    // Filtros de audio
    BASS_BOOST: {
      enabled: false,
      gain: 0.2
    },

    // Streaming
    BITRATE: 128,                 // Bitrate de audio (kbps)
    AUDIO_QUALITY: 'high'         // Calidad: low, medium, high
  }
};

// ==================== FUNCIONES HELPER ====================

/**
 * Calcula el multiplicador de rango para daily rewards
 * @param {string} rank - Nombre del rango (Ronin, Samurai, Daimyo, Shogun)
 * @returns {number} Multiplicador
 */
CONSTANTS.getR

ankMultiplier = function(rank) {
  return CONSTANTS.ECONOMY.DAILY.RANK_MULTIPLIERS[rank.toUpperCase()] || 1;
};

/**
 * Calcula el bonus de streak para daily rewards
 * @param {number} streak - Días consecutivos de streak
 * @returns {number} Bonus multiplicativo (0 = sin bonus, 1 = +100%, etc.)
 */
CONSTANTS.getStreakBonus = function(streak) {
  const bonuses = CONSTANTS.ECONOMY.DAILY.STREAK_BONUSES;
  if (streak >= 90) return bonuses.DAYS_90;
  if (streak >= 30) return bonuses.DAYS_30;
  if (streak >= 14) return bonuses.DAYS_14;
  if (streak >= 7) return bonuses.DAYS_7;
  return 0;
};

/**
 * Calcula el rango basado en honor
 * @param {number} honor - Puntos de honor
 * @returns {string} Nombre del rango
 */
CONSTANTS.calculateRank = function(honor) {
  const ranks = CONSTANTS.HONOR.RANKS;
  if (honor >= ranks.SHOGUN.min) return ranks.SHOGUN.name;
  if (honor >= ranks.DAIMYO.min) return ranks.DAIMYO.name;
  if (honor >= ranks.SAMURAI.min) return ranks.SAMURAI.name;
  return ranks.RONIN.name;
};

/**
 * Obtiene el multiplicador de daily reward basado en rango
 * @param {string} rank - Nombre del rango
 * @returns {number} Multiplicador
 */
CONSTANTS.getRankMultiplier = function(rank) {
  const multipliers = CONSTANTS.ECONOMY.DAILY.RANK_MULTIPLIERS;
  switch (rank) {
    case 'Ronin': return multipliers.RONIN;
    case 'Samurai': return multipliers.SAMURAI;
    case 'Daimyo': return multipliers.DAIMYO;
    case 'Shogun': return multipliers.SHOGUN;
    default: return multipliers.RONIN;
  }
};

/**
 * Obtiene información del nivel de clan basado en honor total
 * @param {number} totalHonor - Honor total del clan
 * @returns {object} Información del nivel { level, name, minHonor, maxMembers, color, nextLevelHonor }
 */
CONSTANTS.getClanLevel = function(totalHonor) {
  const levels = CONSTANTS.CLANS.LEVELS;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (totalHonor >= levels[i].minHonor) {
      return levels[i];
    }
  }
  return levels[0]; // Default: Clan Ronin
};

/**
 * Calcula la capacidad total del inventario de un usuario
 * @param {Object} userData - Datos del usuario con inventario
 * @returns {number} Capacidad total del inventario
 */
CONSTANTS.getInventoryCapacity = function(userData) {
  let capacity = CONSTANTS.SHOP.DEFAULT_INVENTORY_SIZE;

  // Contar cuántas expansiones de inventario tiene el usuario
  if (userData.inventory) {
    const expansions = userData.inventory.filter(inv => inv.itemId === 'inventory_expand').length;
    capacity += expansions * CONSTANTS.SHOP.INVENTORY_EXPAND_BONUS;
  }

  return capacity;
};

/**
 * Calcula el ranking de duelo basado en victorias
 * @param {number} wins - Número de victorias
 * @returns {object} Información del rank { name, emoji, color, min, max }
 */
CONSTANTS.getDuelRank = function(wins) {
  const ranks = CONSTANTS.DUELS.RANKS;
  if (wins >= ranks.LEYENDA.min) return ranks.LEYENDA;
  if (wins >= ranks.MAESTRO.min) return ranks.MAESTRO;
  if (wins >= ranks.EXPERTO.min) return ranks.EXPERTO;
  return ranks.NOVATO;
};

/**
 * Calcula el costo de un nivel de entrenamiento
 * @param {string} trainingType - Tipo de entrenamiento (strength, agility, etc.)
 * @param {number} currentLevel - Nivel actual
 * @returns {number} Costo en koku
 */
CONSTANTS.getTrainingCost = function(trainingType, currentLevel) {
  const training = CONSTANTS.TRAINING.TYPES[trainingType.toUpperCase()];
  if (!training) return 0;
  return training.baseCost + (training.costIncrease * currentLevel);
};

/**
 * Calcula el HP máximo de un jugador basado en equipamiento y entrenamientos
 * @param {Object} combatData - Datos de combate del usuario
 * @returns {number} HP máximo
 */
CONSTANTS.calculateMaxHP = function(combatData) {
  let maxHP = CONSTANTS.COMBAT.BASE_HP;

  // Bonus de armadura
  if (combatData.equipment && combatData.equipment.armor) {
    const armorId = combatData.equipment.armor.toUpperCase();
    const armor = CONSTANTS.COMBAT.ARMOR[armorId];
    if (armor) maxHP += armor.hpBonus;
  }

  // Bonus de entrenamiento de vitalidad
  if (combatData.training && combatData.training.vitality) {
    const vitalityBonus = CONSTANTS.TRAINING.TYPES.VITALITY.bonusPerLevel;
    maxHP += combatData.training.vitality * vitalityBonus;
  }

  return maxHP;
};

/**
 * Calcula el Ki máximo de un jugador
 * @param {Object} combatData - Datos de combate del usuario
 * @returns {number} Ki máximo
 */
CONSTANTS.calculateMaxKi = function(combatData) {
  let maxKi = CONSTANTS.COMBAT.BASE_KI;

  // Bonus de entrenamiento de ki
  if (combatData.training && combatData.training.ki_mastery) {
    const kiBonus = CONSTANTS.TRAINING.TYPES.KI_MASTERY.bonusPerLevel;
    maxKi += combatData.training.ki_mastery * kiBonus;
  }

  return maxKi;
};

/**
 * Calcula el bonus de daño de un jugador
 * @param {Object} combatData - Datos de combate del usuario
 * @returns {number} Bonus de daño
 */
CONSTANTS.calculateDamageBonus = function(combatData) {
  let damageBonus = 0;

  // Bonus de arma
  if (combatData.equipment && combatData.equipment.weapon) {
    const weaponId = combatData.equipment.weapon.toUpperCase();
    const weapon = CONSTANTS.COMBAT.WEAPONS[weaponId];
    if (weapon) damageBonus += weapon.damageBonus;
  }

  return damageBonus;
};

/**
 * Calcula el multiplicador de daño basado en entrenamientos
 * @param {Object} combatData - Datos de combate del usuario
 * @returns {number} Multiplicador de daño (1.0 = sin bonus)
 */
CONSTANTS.calculateDamageMultiplier = function(combatData) {
  let multiplier = 1.0;

  // Bonus de fuerza
  if (combatData.training && combatData.training.strength) {
    const strengthBonus = CONSTANTS.TRAINING.TYPES.STRENGTH.bonusPerLevel;
    multiplier += combatData.training.strength * strengthBonus;
  }

  return multiplier;
};

/**
 * Calcula la probabilidad de evasión
 * @param {Object} combatData - Datos de combate del usuario
 * @returns {number} Probabilidad de evasión (0.0 - 1.0)
 */
CONSTANTS.calculateEvasionChance = function(combatData) {
  let evasion = 0;

  // Bonus de agilidad
  if (combatData.training && combatData.training.agility) {
    const agilityBonus = CONSTANTS.TRAINING.TYPES.AGILITY.bonusPerLevel;
    evasion += combatData.training.agility * agilityBonus;
  }

  return Math.min(evasion, 0.30); // Cap de 30% evasión
};

// ==================== VALIDACIONES ====================

/**
 * Valida que un string sea un Discord Snowflake ID válido
 * @param {string} id - ID a validar
 * @returns {boolean}
 */
CONSTANTS.isValidSnowflake = function(id) {
  return CONSTANTS.VALIDATION.DISCORD_SNOWFLAKE_REGEX.test(id);
};

/**
 * Valida nombre de clan
 * @param {string} name - Nombre a validar
 * @returns {{ valid: boolean, reason: string }}
 */
CONSTANTS.validateClanName = function(name) {
  const { MIN_LENGTH, MAX_LENGTH } = CONSTANTS.CLANS.NAME;

  if (!name || typeof name !== 'string') {
    return { valid: false, reason: 'El nombre debe ser un texto válido.' };
  }

  const trimmed = name.trim();

  if (trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH) {
    return { valid: false, reason: `El nombre debe tener entre ${MIN_LENGTH} y ${MAX_LENGTH} caracteres.` };
  }

  if (CONSTANTS.VALIDATION.CLAN_NAME_FORBIDDEN_CHARS.test(trimmed)) {
    return { valid: false, reason: 'El nombre contiene caracteres prohibidos (<, >, @, #, &).' };
  }

  return { valid: true, reason: '' };
};

/**
 * Valida tag de clan
 * @param {string} tag - Tag a validar
 * @returns {{ valid: boolean, reason: string }}
 */
CONSTANTS.validateClanTag = function(tag) {
  const { MIN_LENGTH, MAX_LENGTH, REGEX } = CONSTANTS.CLANS.TAG;

  if (!tag || typeof tag !== 'string') {
    return { valid: false, reason: 'El tag debe ser un texto válido.' };
  }

  const trimmed = tag.trim();

  if (trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH) {
    return { valid: false, reason: `El tag debe tener entre ${MIN_LENGTH} y ${MAX_LENGTH} caracteres.` };
  }

  if (!REGEX.test(trimmed)) {
    return { valid: false, reason: 'El tag solo puede contener letras y números.' };
  }

  return { valid: true, reason: '' };
};

// ==================== SISTEMA DE LOGROS ====================
CONSTANTS.ACHIEVEMENTS = {
  // Límites
  MAX_ACHIEVEMENTS: 100,              // Máximo de logros en el sistema

  // Notificaciones
  NOTIFY_DM: true,                    // Enviar notificación por DM
  NOTIFY_CHANNEL: true,               // Enviar anuncio en canal de logros
  ANNOUNCE_LEGENDARY: true,           // Anunciar logros legendarios públicamente

  // Visualización
  ACHIEVEMENTS_PER_PAGE: 10,          // Logros mostrados por página
  SHOW_LOCKED_PROGRESS: true,         // Mostrar progreso en logros bloqueados
};

// Freeze para prevenir modificaciones accidentales
Object.freeze(CONSTANTS.HONOR);
Object.freeze(CONSTANTS.ECONOMY);
Object.freeze(CONSTANTS.CLANS);
Object.freeze(CONSTANTS.COOLDOWNS);
Object.freeze(CONSTANTS.MODERATION);
Object.freeze(CONSTANTS.VOICE);
Object.freeze(CONSTANTS.DATA);
Object.freeze(CONSTANTS.LEADERBOARDS);
Object.freeze(CONSTANTS.VALIDATION);
Object.freeze(CONSTANTS.DUELS);
Object.freeze(CONSTANTS.COMBAT);
Object.freeze(CONSTANTS.TRAINING);
Object.freeze(CONSTANTS.FORTUNE);
Object.freeze(CONSTANTS.TRANSLATION);
Object.freeze(CONSTANTS.WISDOM_QUOTES);
Object.freeze(CONSTANTS.SHOP);
Object.freeze(CONSTANTS.MUSIC);
Object.freeze(CONSTANTS.ACHIEVEMENTS);

module.exports = CONSTANTS;

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
    BACKUP_MAX_FILES: 2                 // Máximo de archivos de backup a mantener (solo los 2 más recientes)
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

    // Mecánica de combate (piedra, papel, tijera samurai)
    WEAPONS: {
      KATANA: { name: 'Katana', emoji: '⚔️', beats: 'TANTO' },
      WAKIZASHI: { name: 'Wakizashi', emoji: '🗡️', beats: 'KATANA' },
      TANTO: { name: 'Tanto', emoji: '🔪', beats: 'WAKIZASHI' }
    }
  },

  // ==================== SISTEMA DE TIENDA ====================
  SHOP: {
    // Categorías de items
    CATEGORIES: {
      BOOSTS: 'boosts',
      COSMETICS: 'cosmetics',
      PERMANENT: 'permanent'
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

  // ==================== SISTEMA DE MÚSICA (DOJO DEL SONIDO) ====================
  MUSIC: {
    // Configuración general
    DEFAULT_VOLUME: 50,               // Volumen por defecto (0-100)
    MAX_QUEUE_SIZE: 100,              // Máximo de canciones en cola
    MAX_SONG_DURATION: 3600,          // Duración máxima de canción (1 hora en segundos)

    // Límites de búsqueda
    SEARCH_RESULTS_LIMIT: 5,          // Resultados de búsqueda a mostrar
    SEARCH_TIMEOUT: 30,               // Timeout para selección de búsqueda (segundos)

    // Timeouts y delays
    INACTIVITY_TIMEOUT: 300,          // Auto-disconnect después de X segundos sin actividad (5 min)
    LEAVE_ON_EMPTY: true,             // Salir si el canal de voz queda vacío
    LEAVE_ON_EMPTY_TIMEOUT: 60,       // Tiempo de espera antes de salir (segundos)

    // Playlist limits
    MAX_PLAYLIST_SIZE: 50,            // Máximo de canciones de una playlist a agregar
    MAX_PLAYLISTS_PER_USER: 20,       // Máximo de playlists por usuario
    MAX_SONGS_PER_PLAYLIST: 100,      // Máximo de canciones en una playlist guardada
    PLAYLIST_NAME_MIN_LENGTH: 2,      // Longitud mínima nombre de playlist
    PLAYLIST_NAME_MAX_LENGTH: 50,     // Longitud máxima nombre de playlist

    // Progress bar
    PROGRESS_BAR_LENGTH: 20,          // Longitud de barra de progreso

    // Loop modes
    LOOP_MODES: {
      OFF: 'off',
      SONG: 'song',
      QUEUE: 'queue'
    },

    // Audio quality
    AUDIO_QUALITY: 'high',            // 'low', 'medium', 'high'

    // Filters disponibles (para futuro)
    FILTERS: {
      BASSBOOST: 'bassboost',
      NIGHTCORE: 'nightcore',
      VAPORWAVE: 'vaporwave',
      '8D': '8d',
      KARAOKE: 'karaoke'
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
  ]
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
Object.freeze(CONSTANTS.FORTUNE);
Object.freeze(CONSTANTS.TRANSLATION);
Object.freeze(CONSTANTS.WISDOM_QUOTES);
Object.freeze(CONSTANTS.SHOP);
Object.freeze(CONSTANTS.MUSIC);

module.exports = CONSTANTS;

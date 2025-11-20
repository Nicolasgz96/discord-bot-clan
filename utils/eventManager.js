/**
 * DEMON HUNTER BOT - Event Manager
 * Manages server events: tournaments, trivia, building contests, voice marathons, koku rushes
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const EVENTS_FILE = path.join(__dirname, '../data/events.json');

// Event Types
const EVENT_TYPES = {
  DUEL_TOURNAMENT: 'duel_tournament',
  TRIVIA: 'trivia',
  BUILDING_CONTEST: 'building_contest',
  VOICE_MARATHON: 'voice_marathon',
  KOKU_RUSH: 'koku_rush'
};

// Event Statuses
const EVENT_STATUS = {
  PENDING: 'pending',    // Created but not started
  ACTIVE: 'active',      // Currently running
  COMPLETED: 'completed', // Finished
  CANCELLED: 'cancelled'  // Cancelled by admin
};

// Event Configuration Templates
const EVENT_TEMPLATES = {
  duel_tournament: {
    name: 'Torneo de Honor',
    description: 'Competencia de duelos estilo eliminación',
    emoji: '⚔️',
    minParticipants: 2,
    maxParticipants: 32,
    defaultDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
    defaultPrizes: {
      1: { koku: 5000, title: 'Campeón del Torneo' },
      2: { koku: 3000, title: 'Subcampeón' },
      3: { koku: 1500 }
    }
  },
  trivia: {
    name: 'Trivia Samurai',
    description: 'Competencia de preguntas y respuestas',
    emoji: '📚',
    minParticipants: 2,
    maxParticipants: 100,
    defaultDuration: 1 * 60 * 60 * 1000, // 1 hour
    defaultPrizes: {
      1: { koku: 2000, title: 'Maestro del Conocimiento' },
      2: { koku: 1000 },
      3: { koku: 500 }
    }
  },
  building_contest: {
    name: 'Concurso de Construcción',
    description: 'Competencia de construcciones en Minecraft',
    emoji: '🏗️',
    minParticipants: 2,
    maxParticipants: 50,
    defaultDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
    defaultPrizes: {
      1: { koku: 4000, title: 'Arquitecto Legendario' },
      2: { koku: 2500, title: 'Constructor Maestro' },
      3: { koku: 1500 }
    }
  },
  voice_marathon: {
    name: 'Maratón de Voz',
    description: 'Competencia de tiempo en canales de voz',
    emoji: '🎤',
    minParticipants: 2,
    maxParticipants: 100,
    defaultDuration: 24 * 60 * 60 * 1000, // 24 hours
    defaultPrizes: {
      1: { koku: 3000, title: 'Rey de la Voz' },
      2: { koku: 2000 },
      3: { koku: 1000 }
    }
  },
  koku_rush: {
    name: 'Carrera de Koku',
    description: 'Competencia por ganar más koku en tiempo limitado',
    emoji: '💰',
    minParticipants: 2,
    maxParticipants: 100,
    defaultDuration: 48 * 60 * 60 * 1000, // 48 hours
    defaultPrizes: {
      1: { koku: 5000, title: 'Comerciante Supremo' },
      2: { koku: 3000 },
      3: { koku: 1500 }
    }
  }
};

/**
 * Event Manager Class
 */
class EventManager {
  constructor() {
    this.events = this.loadEvents();
  }

  /**
   * Load events from JSON file
   */
  loadEvents() {
    try {
      if (fs.existsSync(EVENTS_FILE)) {
        const data = fs.readFileSync(EVENTS_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('❌ Error cargando eventos:', error.message);
    }
    return {};
  }

  /**
   * Save events to JSON file
   */
  saveEvents() {
    try {
      const dir = path.dirname(EVENTS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(EVENTS_FILE, JSON.stringify(this.events, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('❌ Error guardando eventos:', error.message);
      return false;
    }
  }

  /**
   * Create a new event
   */
  createEvent(guildId, type, name, description, creatorId, options = {}) {
    const template = EVENT_TEMPLATES[type];
    if (!template) {
      throw new Error(`Tipo de evento inválido: ${type}`);
    }

    const eventId = uuidv4();
    const now = Date.now();

    const event = {
      id: eventId,
      guildId,
      type,
      name: name || template.name,
      description: description || template.description,
      emoji: template.emoji,
      creatorId,
      createdAt: now,
      startTime: options.startTime || now,
      endTime: options.endTime || (now + template.defaultDuration),
      status: EVENT_STATUS.PENDING,
      participants: [],
      minParticipants: template.minParticipants,
      maxParticipants: options.maxParticipants || template.maxParticipants,
      prizes: options.prizes || template.defaultPrizes,
      results: {},
      metadata: {
        // Type-specific metadata
        ...(type === 'trivia' && { questions: [], currentQuestion: 0 }),
        ...(type === 'building_contest' && { submissions: {} }),
        ...(type === 'duel_tournament' && { bracket: [], matches: [] }),
        ...(type === 'voice_marathon' && { voiceTime: {} }),
        ...(type === 'koku_rush' && { startingKoku: {} })
      }
    };

    this.events[eventId] = event;
    this.saveEvents();

    return event;
  }

  /**
   * Get event by ID
   */
  getEvent(eventId) {
    return this.events[eventId] || null;
  }

  /**
   * Get all events for a guild
   */
  getGuildEvents(guildId, status = null) {
    return Object.values(this.events).filter(event => {
      if (event.guildId !== guildId) return false;
      if (status && event.status !== status) return false;
      return true;
    });
  }

  /**
   * Get active events for a guild
   */
  getActiveEvents(guildId) {
    return this.getGuildEvents(guildId, EVENT_STATUS.ACTIVE);
  }

  /**
   * Join an event
   */
  joinEvent(eventId, userId) {
    const event = this.getEvent(eventId);
    if (!event) {
      throw new Error('Evento no encontrado');
    }

    if (event.status === EVENT_STATUS.COMPLETED || event.status === EVENT_STATUS.CANCELLED) {
      throw new Error('El evento ya ha finalizado');
    }

    if (event.participants.includes(userId)) {
      throw new Error('Ya estás inscrito en este evento');
    }

    if (event.participants.length >= event.maxParticipants) {
      throw new Error('El evento está lleno');
    }

    event.participants.push(userId);

    // Initialize participant data based on event type
    if (event.type === EVENT_TYPES.VOICE_MARATHON) {
      event.metadata.voiceTime[userId] = 0;
    } else if (event.type === EVENT_TYPES.KOKU_RUSH) {
      // Store starting koku (must be passed from dataManager)
      event.metadata.startingKoku[userId] = 0;
    }

    this.saveEvents();
    return event;
  }

  /**
   * Leave an event
   */
  leaveEvent(eventId, userId) {
    const event = this.getEvent(eventId);
    if (!event) {
      throw new Error('Evento no encontrado');
    }

    if (event.status === EVENT_STATUS.ACTIVE) {
      throw new Error('No puedes salir de un evento activo');
    }

    const index = event.participants.indexOf(userId);
    if (index === -1) {
      throw new Error('No estás inscrito en este evento');
    }

    event.participants.splice(index, 1);
    this.saveEvents();
    return event;
  }

  /**
   * Start an event
   */
  startEvent(eventId) {
    const event = this.getEvent(eventId);
    if (!event) {
      throw new Error('Evento no encontrado');
    }

    if (event.status !== EVENT_STATUS.PENDING) {
      throw new Error('El evento ya ha sido iniciado o finalizado');
    }

    if (event.participants.length < event.minParticipants) {
      throw new Error(`Se requieren al menos ${event.minParticipants} participantes`);
    }

    event.status = EVENT_STATUS.ACTIVE;
    event.startTime = Date.now();

    // Initialize event-specific data
    if (event.type === EVENT_TYPES.DUEL_TOURNAMENT) {
      event.metadata.bracket = this.generateBracket(event.participants);
    }

    this.saveEvents();
    return event;
  }

  /**
   * End an event
   */
  endEvent(eventId) {
    const event = this.getEvent(eventId);
    if (!event) {
      throw new Error('Evento no encontrado');
    }

    if (event.status !== EVENT_STATUS.ACTIVE) {
      throw new Error('El evento no está activo');
    }

    event.status = EVENT_STATUS.COMPLETED;
    event.endTime = Date.now();
    this.saveEvents();

    console.log(`✅ Evento marcado como completado: ${event.name} (${eventId})`);
    return event;
  }

  /**
   * Cancel an event
   */
  cancelEvent(eventId) {
    const event = this.getEvent(eventId);
    if (!event) {
      throw new Error('Evento no encontrado');
    }

    if (event.status === EVENT_STATUS.COMPLETED) {
      throw new Error('El evento ya ha finalizado');
    }

    event.status = EVENT_STATUS.CANCELLED;

    // Eliminar el evento automáticamente después de cancelarlo
    delete this.events[eventId];
    this.saveEvents();

    console.log(`🗑️ Evento cancelado y eliminado: ${event.name} (${eventId})`);
    return event;
  }

  /**
   * Update participant score
   */
  updateScore(eventId, userId, score, operation = 'set') {
    const event = this.getEvent(eventId);
    if (!event) {
      throw new Error('Evento no encontrado');
    }

    if (!event.participants.includes(userId)) {
      throw new Error('Usuario no está inscrito en este evento');
    }

    if (!event.results[userId]) {
      event.results[userId] = { score: 0, rank: 0 };
    }

    switch (operation) {
      case 'set':
        event.results[userId].score = score;
        break;
      case 'add':
        event.results[userId].score = (event.results[userId].score || 0) + score;
        break;
      case 'increment':
        event.results[userId].score = (event.results[userId].score || 0) + 1;
        break;
    }

    // Recalculate ranks
    this.updateRanks(eventId);
    this.saveEvents();
    return event;
  }

  /**
   * Update ranks based on scores
   */
  updateRanks(eventId) {
    const event = this.getEvent(eventId);
    if (!event) return;

    // Sort participants by score (descending)
    const sorted = Object.entries(event.results).sort((a, b) => b[1].score - a[1].score);

    // Assign ranks
    sorted.forEach(([userId, data], index) => {
      event.results[userId].rank = index + 1;
    });
  }

  /**
   * Get leaderboard for an event
   */
  getLeaderboard(eventId, limit = 10) {
    const event = this.getEvent(eventId);
    if (!event) {
      throw new Error('Evento no encontrado');
    }

    const sorted = Object.entries(event.results)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, limit)
      .map(([userId, data]) => ({
        userId,
        score: data.score,
        rank: data.rank
      }));

    return sorted;
  }

  /**
   * Generate tournament bracket
   */
  generateBracket(participants) {
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const bracket = [];

    // Create pairs
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        bracket.push({
          player1: shuffled[i],
          player2: shuffled[i + 1],
          winner: null,
          round: 1
        });
      } else {
        // Bye - player advances automatically
        bracket.push({
          player1: shuffled[i],
          player2: null,
          winner: shuffled[i],
          round: 1
        });
      }
    }

    return bracket;
  }

  /**
   * Submit building contest entry
   */
  submitBuildingEntry(eventId, userId, imageUrl, description) {
    const event = this.getEvent(eventId);
    if (!event) {
      throw new Error('Evento no encontrado');
    }

    if (event.type !== EVENT_TYPES.BUILDING_CONTEST) {
      throw new Error('Este no es un concurso de construcción');
    }

    if (!event.participants.includes(userId)) {
      throw new Error('No estás inscrito en este evento');
    }

    event.metadata.submissions[userId] = {
      imageUrl,
      description,
      submittedAt: Date.now(),
      votes: 0,
      voters: []
    };

    this.saveEvents();
    return event;
  }

  /**
   * Vote for building contest entry
   */
  voteBuildingEntry(eventId, voterId, targetUserId) {
    const event = this.getEvent(eventId);
    if (!event) {
      throw new Error('Evento no encontrado');
    }

    if (event.type !== EVENT_TYPES.BUILDING_CONTEST) {
      throw new Error('Este no es un concurso de construcción');
    }

    if (voterId === targetUserId) {
      throw new Error('No puedes votar por tu propia construcción');
    }

    const submission = event.metadata.submissions[targetUserId];
    if (!submission) {
      throw new Error('Esta entrada no existe');
    }

    // Check if already voted
    for (const [userId, sub] of Object.entries(event.metadata.submissions)) {
      if (sub.voters.includes(voterId)) {
        throw new Error('Ya has votado en este concurso');
      }
    }

    submission.votes++;
    submission.voters.push(voterId);

    // Update score
    this.updateScore(eventId, targetUserId, submission.votes, 'set');
    this.saveEvents();
    return event;
  }

  /**
   * Track voice time for voice marathon
   */
  trackVoiceTime(eventId, userId, minutes) {
    const event = this.getEvent(eventId);
    if (!event) return;

    if (event.type !== EVENT_TYPES.VOICE_MARATHON) return;
    if (!event.participants.includes(userId)) return;

    event.metadata.voiceTime[userId] = (event.metadata.voiceTime[userId] || 0) + minutes;
    this.updateScore(eventId, userId, event.metadata.voiceTime[userId], 'set');
    this.saveEvents();
  }

  /**
   * Track koku gain for koku rush
   */
  trackKokuGain(eventId, userId, currentKoku) {
    const event = this.getEvent(eventId);
    if (!event) return;

    if (event.type !== EVENT_TYPES.KOKU_RUSH) return;
    if (!event.participants.includes(userId)) return;

    const startingKoku = event.metadata.startingKoku[userId] || 0;
    const gained = Math.max(0, currentKoku - startingKoku);

    this.updateScore(eventId, userId, gained, 'set');
    this.saveEvents();
  }

  /**
   * Award prizes to winners
   */
  awardPrizes(eventId, dataManager) {
    const event = this.getEvent(eventId);
    if (!event) {
      throw new Error('Evento no encontrado');
    }

    if (event.status !== EVENT_STATUS.COMPLETED) {
      throw new Error('El evento aún no ha finalizado');
    }

    const winners = [];

    // Award prizes based on ranks
    for (const [userId, result] of Object.entries(event.results)) {
      const prize = event.prizes[result.rank];
      if (prize) {
        const userData = dataManager.getUser(userId, event.guildId);

        // Award koku
        if (prize.koku) {
          userData.koku = (userData.koku || 0) + prize.koku;
        }

        // Award title
        if (prize.title) {
          if (!userData.titles) userData.titles = [];
          if (!userData.titles.includes(prize.title)) {
            userData.titles.push(prize.title);
          }
        }

        // Track event wins for achievements
        if (!userData.stats) userData.stats = {};
        userData.stats.eventWins = (userData.stats.eventWins || 0) + 1;

        if (result.rank === 1) {
          userData.stats.firstPlaceWins = (userData.stats.firstPlaceWins || 0) + 1;
        }

        dataManager.dataModified.users = true;

        winners.push({
          userId,
          rank: result.rank,
          score: result.score,
          prize
        });
      }
    }

    // Eliminar el evento después de otorgar premios
    const eventName = event.name;
    delete this.events[eventId];
    this.saveEvents();
    console.log(`🗑️ Evento eliminado después de otorgar premios: ${eventName} (${eventId})`);

    return winners;
  }

  /**
   * Get user's events
   */
  getUserEvents(guildId, userId) {
    return Object.values(this.events).filter(event => {
      if (event.guildId !== guildId) return false;
      return event.participants.includes(userId);
    });
  }

  /**
   * Clean up old completed events (older than 30 days)
   */
  cleanupOldEvents() {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    let removed = 0;

    for (const [eventId, event] of Object.entries(this.events)) {
      if (event.status === EVENT_STATUS.COMPLETED && event.endTime < thirtyDaysAgo) {
        delete this.events[eventId];
        removed++;
      }
    }

    if (removed > 0) {
      this.saveEvents();
      console.log(`🗑️ Limpieza de eventos: ${removed} eventos antiguos eliminados`);
    }

    return removed;
  }

  /**
   * Genera embed VS para combate de torneo con avatares en las esquinas
   * @param {Object} match - Datos del combate { player1, player2, winner, round }
   * @param {Object} p1Data - Datos del jugador 1 (userData)
   * @param {Object} p2Data - Datos del jugador 2 (userData)
   * @param {Client} client - Cliente de Discord
   * @returns {Promise<EmbedBuilder>} Embed del combate
   */
  async generateMatchVSEmbed(match, p1Data, p2Data, client) {
    const { EmbedBuilder } = require('discord.js');
    const EMOJIS = require('../src/config/emojis');
    const COLORS = require('../src/config/colors');

    // Obtener usuarios de Discord
    const player1 = await client.users.fetch(match.player1).catch(() => null);
    const player2 = await client.users.fetch(match.player2).catch(() => null);

    // Obtener guild para displayNames
    const guild = client.guilds.cache.first();
    const member1 = guild ? await guild.members.fetch(match.player1).catch(() => null) : null;
    const member2 = guild ? await guild.members.fetch(match.player2).catch(() => null) : null;

    // MEJORA 4: Usar displayName (nick del servidor) si está disponible
    const p1Name = member1 ? member1.displayName : (player1 ? player1.username : match.player1);
    const p2Name = member2 ? member2.displayName : (player2 ? player2.username : match.player2);

    // Obtener avatares con tamaño consistente más grande
    const p1Avatar = player1 ? player1.displayAvatarURL({ size: 256 }) : null;
    const p2Avatar = player2 ? player2.displayAvatarURL({ size: 256 }) : null;

    // Obtener bio desde customization
    const p1Bio = p1Data?.customization?.bio || 'Un guerrero misterioso...';
    const p2Bio = p2Data?.customization?.bio || 'Un guerrero misterioso...';

    const embed = new EmbedBuilder()
      .setColor(COLORS.COMBAT || '#FF6B35')
      .setTitle(`${EMOJIS.COMBAT || '⚔️'} COMBATE DE TORNEO ${EMOJIS.COMBAT || '⚔️'}`)
      .setDescription('Dos guerreros se enfrentan en batalla')
      .addFields(
        {
          name: `${EMOJIS.KATANA || '⚔️'} ${p1Name}`,
          value:
            `**Rango:** ${p1Data?.rank || 'Ronin'}\n` +
            `**Honor:** ${p1Data?.honor || 0}\n` +
            `**Bio:** *"${p1Bio}"*`,
          inline: true
        },
        {
          name: `${EMOJIS.VS || '⚡'}`,
          value: '**VS**',
          inline: true
        },
        {
          name: `${EMOJIS.KATANA || '⚔️'} ${p2Name}`,
          value:
            `**Rango:** ${p2Data?.rank || 'Ronin'}\n` +
            `**Honor:** ${p2Data?.honor || 0}\n` +
            `**Bio:** *"${p2Bio}"*`,
          inline: true
        }
      )
      .setTimestamp();

    // MEJORA 1: Avatares en las esquinas (limitación de Discord: tamaños diferentes)
    // Avatar P1 en thumbnail (esquina superior derecha) - MÁS GRANDE
    if (p1Avatar) {
      embed.setThumbnail(p1Avatar);
    }

    // Avatar P2 en image (abajo, centrado) - GRANDE
    // Usamos setImage para el segundo avatar para que sea visible y grande
    if (p2Avatar) {
      embed.setImage(p2Avatar);
    }

    return embed;
  }

  /**
   * Genera mensaje de control del torneo (solo para creador)
   * @param {string} eventId - ID del evento
   * @param {Client} client - Cliente de Discord
   * @returns {Promise<Object>} { embed, components }
   */
  async generateTournamentControlMessage(eventId, client) {
    const event = this.getEvent(eventId);
    if (!event || event.type !== EVENT_TYPES.DUEL_TOURNAMENT) return null;

    const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
    const EMOJIS = require('../src/config/emojis');
    const COLORS = require('../src/config/colors');

    const bracket = event.metadata.bracket;
    const currentRound = Math.max(...bracket.map(m => m.round));

    // Encontrar combate actual (sin ganador y con ambos jugadores)
    const currentMatch = bracket.find(m =>
      m.round === currentRound &&
      !m.winner &&
      m.player2
    );

    if (!currentMatch) {
      // No hay más combates, torneo terminado
      console.log(`🏁 generateTournamentControlMessage: No hay combates pendientes, retornando null`);
      return null;
    }

    // Obtener guild para displayNames
    const guild = client.guilds.cache.first();
    const member1 = guild ? await guild.members.fetch(currentMatch.player1).catch(() => null) : null;
    const member2 = guild ? await guild.members.fetch(currentMatch.player2).catch(() => null) : null;
    const user1 = await client.users.fetch(currentMatch.player1).catch(() => null);
    const user2 = await client.users.fetch(currentMatch.player2).catch(() => null);

    // MEJORA 4: Usar displayName en lugar de username
    const p1Name = member1 ? member1.displayName : (user1 ? user1.username : currentMatch.player1);
    const p2Name = member2 ? member2.displayName : (user2 ? user2.username : currentMatch.player2);

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle('🏆 Resultado del Torneo')
      .setDescription(
        `**Combate Actual: Ronda ${currentRound}**\n\n` +
        `${EMOJIS.KATANA || '⚔️'} **${p1Name}** VS **${p2Name}** ${EMOJIS.KATANA || '⚔️'}\n\n` +
        `Selecciona el ganador del dropdown abajo.`
      )
      .setFooter({ text: 'Solo el creador del evento puede registrar resultados' });

    // Dropdown con los 2 participantes
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('tournament_winner_select')
      .setPlaceholder('Selecciona el ganador del combate')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(p1Name)
          .setValue(currentMatch.player1)
          .setEmoji(EMOJIS.KATANA || '⚔️'),
        new StringSelectMenuOptionBuilder()
          .setLabel(p2Name)
          .setValue(currentMatch.player2)
          .setEmoji(EMOJIS.KATANA || '⚔️')
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    return {
      embed,
      components: [row]
    };
  }

  /**
   * Registra el ganador de un combate de torneo
   * @param {string} eventId - ID del evento
   * @param {string} winnerId - ID del ganador
   * @param {string} loserId - ID del perdedor
   * @returns {Object} Evento actualizado
   */
  recordTournamentWinner(eventId, winnerId, loserId) {
    const event = this.getEvent(eventId);
    if (!event || event.type !== EVENT_TYPES.DUEL_TOURNAMENT) {
      throw new Error('Evento no es un torneo de duelos');
    }

    const bracket = event.metadata.bracket;
    const currentRound = Math.max(...bracket.map(m => m.round));

    // Encontrar el combate
    const match = bracket.find(m =>
      m.round === currentRound &&
      !m.winner &&
      m.player2 &&
      (m.player1 === winnerId || m.player2 === winnerId) &&
      (m.player1 === loserId || m.player2 === loserId)
    );

    if (!match) {
      throw new Error('No se encontró el combate correspondiente');
    }

    // Registrar ganador
    match.winner = winnerId;

    // Actualizar scores (ganador +1 punto)
    if (!event.results) event.results = {};
    if (!event.results[winnerId]) event.results[winnerId] = { score: 0, rank: null };
    event.results[winnerId].score += 1;

    // Verificar si quedan combates en esta ronda
    const pendingMatchesInRound = bracket.filter(m =>
      m.round === currentRound &&
      !m.winner &&
      m.player2
    );

    // Si no quedan combates pendientes, crear siguiente ronda
    if (pendingMatchesInRound.length === 0) {
      const winners = bracket
        .filter(m => m.round === currentRound && m.winner)
        .map(m => m.winner);

      if (winners.length > 1) {
        // Crear combates de siguiente ronda
        const nextRound = currentRound + 1;
        for (let i = 0; i < winners.length; i += 2) {
          if (i + 1 < winners.length) {
            bracket.push({
              player1: winners[i],
              player2: winners[i + 1],
              winner: null,
              round: nextRound
            });
          } else {
            // Bye - avanza automáticamente
            bracket.push({
              player1: winners[i],
              player2: null,
              winner: winners[i],
              round: nextRound
            });
          }
        }
      }
    }

    // Actualizar rankings
    this.updateRanks(eventId);
    this.saveEvents();

    return event;
  }

  /**
   * Obtiene el displayName de un usuario en un servidor
   * @param {Client} client - Cliente de Discord
   * @param {string} guildId - ID del servidor
   * @param {string} userId - ID del usuario
   * @returns {Promise<string>} DisplayName o username
   */
  async getDisplayName(client, guildId, userId) {
    try {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        const user = await client.users.fetch(userId).catch(() => null);
        return user ? user.username : userId;
      }

      const member = await guild.members.fetch(userId).catch(() => null);
      if (member) {
        return member.displayName;
      }

      const user = await client.users.fetch(userId).catch(() => null);
      return user ? user.username : userId;
    } catch (error) {
      return userId;
    }
  }

  /**
   * Genera embed del bracket del torneo
   * @param {string} eventId - ID del evento
   * @param {Client} client - Cliente de Discord
   * @returns {Promise<EmbedBuilder>} Embed del bracket
   */
  async generateBracketEmbed(eventId, client) {
    const event = this.getEvent(eventId);
    if (!event || event.type !== EVENT_TYPES.DUEL_TOURNAMENT) return null;

    const { EmbedBuilder } = require('discord.js');
    const EMOJIS = require('../src/config/emojis');
    const COLORS = require('../src/config/colors');

    const bracket = event.metadata.bracket;
    const currentRound = Math.max(...bracket.map(m => m.round));

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`${EMOJIS.TOURNAMENT || '🏆'} Bracket del Torneo: ${event.name}`)
      .setDescription(`**Ronda Actual:** ${currentRound}`);

    // Agrupar por rondas
    for (let round = 1; round <= currentRound; round++) {
      const matchesInRound = bracket.filter(m => m.round === round);
      const matchesText = await Promise.all(matchesInRound.map(async (match, idx) => {
        const p1Name = await this.getDisplayName(client, event.guildId, match.player1);
        const p2Name = match.player2 ? await this.getDisplayName(client, event.guildId, match.player2) : 'BYE';
        const winnerMark = match.winner ? (match.winner === match.player1 ? '✅' : '❌') : '⏳';
        const loserMark = match.winner ? (match.winner === match.player2 ? '✅' : '❌') : '⏳';

        return `\`${idx + 1}.\` ${winnerMark} **${p1Name}** vs ${loserMark} **${p2Name}**`;
      }));

      embed.addFields({
        name: `⚔️ Ronda ${round}`,
        value: matchesText.join('\n') || 'Sin combates',
        inline: false
      });
    }

    return embed;
  }
}

// Singleton instance
let eventManagerInstance = null;

function getEventManager() {
  if (!eventManagerInstance) {
    eventManagerInstance = new EventManager();
  }
  return eventManagerInstance;
}

module.exports = {
  getEventManager,
  EventManager,
  EVENT_TYPES,
  EVENT_STATUS,
  EVENT_TEMPLATES
};

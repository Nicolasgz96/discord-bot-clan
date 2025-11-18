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
    this.saveEvents();
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

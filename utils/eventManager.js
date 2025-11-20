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
   * Update ranks based on scores (o bracket para torneos)
   */
  updateRanks(eventId) {
    const event = this.getEvent(eventId);
    if (!event) return;

    // Para torneos, calcular ranking basado en la estructura del bracket
    if (event.type === EVENT_TYPES.DUEL_TOURNAMENT && event.metadata.bracket) {
      this.updateTournamentRanks(eventId);
      return;
    }

    // Para otros eventos, ranking por score
    const sorted = Object.entries(event.results).sort((a, b) => b[1].score - a[1].score);

    // Assign ranks
    sorted.forEach(([userId, data], index) => {
      event.results[userId].rank = index + 1;
    });
  }

  /**
   * Calcula rankings para torneos basado en la ronda más alta alcanzada
   */
  updateTournamentRanks(eventId) {
    const event = this.getEvent(eventId);
    if (!event) return;

    const bracket = event.metadata.bracket;
    if (!bracket || bracket.length === 0) return;

    const maxRound = Math.max(...bracket.map(m => m.round));

    // Encontrar al campeón (ganador del último combate)
    const finalMatch = bracket.find(m => m.round === maxRound && m.winner && m.player2);

    if (finalMatch) {
      const champion = finalMatch.winner;
      const runnerUp = finalMatch.player1 === champion ? finalMatch.player2 : finalMatch.player1;

      // Campeón = Rank 1
      if (!event.results[champion]) event.results[champion] = { score: 0, rank: null };
      event.results[champion].rank = 1;
      event.results[champion].score = maxRound; // Score = ronda alcanzada

      // Subcampeón = Rank 2
      if (!event.results[runnerUp]) event.results[runnerUp] = { score: 0, rank: null };
      event.results[runnerUp].rank = 2;
      event.results[runnerUp].score = maxRound - 1;

      // Resto de participantes ordenados por ronda alcanzada
      const otherParticipants = event.participants.filter(p => p !== champion && p !== runnerUp);

      // Calcular ronda alcanzada por cada participante
      const participantRounds = otherParticipants.map(userId => {
        // Encontrar la ronda más alta donde perdió
        const lostIn = bracket.find(m =>
          m.winner &&
          m.winner !== userId &&
          (m.player1 === userId || m.player2 === userId)
        );

        const roundReached = lostIn ? lostIn.round - 1 : 0;

        return { userId, roundReached };
      });

      // Ordenar por ronda alcanzada (descendente)
      participantRounds.sort((a, b) => b.roundReached - a.roundReached);

      // Asignar ranks (empezando desde 3)
      participantRounds.forEach((p, index) => {
        if (!event.results[p.userId]) event.results[p.userId] = { score: 0, rank: null };
        event.results[p.userId].rank = index + 3;
        event.results[p.userId].score = p.roundReached;
      });

      console.log(`🏆 Rankings de torneo actualizados - Campeón: ${champion}, Subcampeón: ${runnerUp}`);
    }
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
   * Record winner of a tournament match
   */
  recordTournamentWinner(eventId, winnerId, loserId) {
    const event = this.getEvent(eventId);
    if (!event) {
      throw new Error('Evento no encontrado');
    }

    if (event.type !== EVENT_TYPES.DUEL_TOURNAMENT) {
      throw new Error('Este no es un torneo de duelos');
    }

    if (event.status !== EVENT_STATUS.ACTIVE) {
      throw new Error('El torneo no está activo');
    }

    const bracket = event.metadata.bracket;

    // Find the match with these two players in current round
    const currentRound = Math.max(...bracket.map(m => m.round));
    const match = bracket.find(m =>
      m.round === currentRound &&
      !m.winner &&
      ((m.player1 === winnerId && m.player2 === loserId) ||
       (m.player1 === loserId && m.player2 === winnerId))
    );

    if (!match) {
      throw new Error('No se encontró un combate pendiente entre estos jugadores en la ronda actual');
    }

    // Record the winner
    match.winner = winnerId;
    match.completedAt = Date.now();

    // Store match in history
    if (!event.metadata.matches) event.metadata.matches = [];
    event.metadata.matches.push({
      round: match.round,
      player1: match.player1,
      player2: match.player2,
      winner: winnerId,
      timestamp: Date.now()
    });

    // Check if round is complete
    const roundMatches = bracket.filter(m => m.round === currentRound);
    const allMatchesComplete = roundMatches.every(m => m.winner !== null);

    if (allMatchesComplete) {
      // Advance to next round
      this.advanceToNextRound(eventId);
      // Mark that round advanced so we can announce new matches
      event.metadata.roundAdvanced = true;
    }

    this.saveEvents();
    return event;
  }

  /**
   * Advance tournament to next round
   */
  advanceToNextRound(eventId) {
    const event = this.getEvent(eventId);
    if (!event) {
      throw new Error('Evento no encontrado');
    }

    const bracket = event.metadata.bracket;
    const currentRound = Math.max(...bracket.map(m => m.round));
    const winners = bracket.filter(m => m.round === currentRound && m.winner).map(m => m.winner);

    // Check if tournament is complete (only 1 winner left)
    if (winners.length === 1) {
      // Tournament complete!
      event.status = EVENT_STATUS.COMPLETED;
      event.endTime = Date.now();

      // Record final standings
      const finalMatch = bracket.find(m => m.round === currentRound);
      const champion = winners[0];
      const runnerUp = finalMatch.player1 === champion ? finalMatch.player2 : finalMatch.player1;

      // Find 3rd place (loser of previous round that isn't the runner-up)
      let thirdPlace = null;
      if (currentRound > 1) {
        const semiFinalists = bracket
          .filter(m => m.round === currentRound - 1)
          .flatMap(m => [m.player1, m.player2])
          .filter(p => p && p !== champion && p !== runnerUp);
        thirdPlace = semiFinalists[0]; // Take first semi-finalist who lost
      }

      event.results = {
        [champion]: { rank: 1, prize: 'champion' },
        [runnerUp]: { rank: 2, prize: 'runner_up' }
      };

      if (thirdPlace) {
        event.results[thirdPlace] = { rank: 3, prize: 'third_place' };
      }

      this.saveEvents();
      return { complete: true, champion, runnerUp, thirdPlace };
    }

    // Create next round matches
    const nextRound = currentRound + 1;
    const newMatches = [];

    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 < winners.length) {
        const match = {
          player1: winners[i],
          player2: winners[i + 1],
          winner: null,
          round: nextRound
        };
        bracket.push(match);
        newMatches.push(match);
      } else {
        // Bye - player advances automatically
        const match = {
          player1: winners[i],
          player2: null,
          winner: winners[i],
          round: nextRound
        };
        bracket.push(match);
        newMatches.push(match);
      }
    }

    this.saveEvents();
    return {
      complete: false,
      nextRound,
      matchesCreated: Math.ceil(winners.length / 2),
      newMatches // Devolver los matches creados para anunciarlos
    };
  }

  /**
   * Get current tournament bracket formatted
   */
  getTournamentBracket(eventId) {
    const event = this.getEvent(eventId);
    if (!event || event.type !== EVENT_TYPES.DUEL_TOURNAMENT) {
      throw new Error('Torneo no encontrado');
    }

    const bracket = event.metadata.bracket || [];
    const rounds = {};

    // Group matches by round
    for (const match of bracket) {
      if (!rounds[match.round]) rounds[match.round] = [];
      rounds[match.round].push(match);
    }

    return {
      event,
      rounds,
      currentRound: bracket.length > 0 ? Math.max(...bracket.map(m => m.round)) : 0,
      totalRounds: Math.ceil(Math.log2(event.participants.length))
    };
  }

  /**
   * Generate visual bracket embed for tournament
   */
  generateBracketEmbed(eventId, client) {
    const { EmbedBuilder } = require('discord.js');
    const COLORS = require('../src/config/colors');
    const EMOJIS = require('../src/config/emojis');

    const bracketData = this.getTournamentBracket(eventId);
    const { event, rounds, currentRound, totalRounds } = bracketData;

    const embed = new EmbedBuilder()
      .setColor(event.status === 'completed' ? COLORS.SUCCESS : COLORS.PRIMARY)
      .setTitle(`🏆 ${event.name} - Bracket`)
      .setDescription(
        `**Participantes:** ${event.participants.length}\n` +
        `**Ronda Actual:** ${currentRound}/${totalRounds}\n` +
        `**Estado:** ${event.status === 'active' ? '🟢 Activo' : event.status === 'completed' ? '✅ Finalizado' : '⚫ Pendiente'}`
      )
      .setTimestamp();

    // Agregar cada ronda
    for (let round = 1; round <= currentRound; round++) {
      const matches = rounds[round] || [];
      let roundText = '';

      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const player1User = client.users.cache.get(match.player1);
        const player2User = match.player2 ? client.users.cache.get(match.player2) : null;

        const p1Name = player1User?.username || 'Guerrero';
        const p2Name = player2User?.username || 'BYE';

        if (match.winner) {
          const winnerUser = client.users.cache.get(match.winner);
          const winnerName = winnerUser?.username || 'Ganador';
          roundText += `✅ ${p1Name} vs ${p2Name} → **${winnerName}**\n`;
        } else {
          roundText += `⏳ ${p1Name} vs ${p2Name}\n`;
        }
      }

      const roundName = round === currentRound && event.status === 'active'
        ? `⚔️ Ronda ${round} (ACTUAL)`
        : `📊 Ronda ${round}`;

      embed.addFields({
        name: roundName,
        value: roundText || 'Sin combates',
        inline: false
      });
    }

    // Si está completo, mostrar podio
    if (event.status === 'completed' && event.results) {
      const champion = Object.keys(event.results).find(id => event.results[id].rank === 1);
      const runnerUp = Object.keys(event.results).find(id => event.results[id].rank === 2);
      const thirdPlace = Object.keys(event.results).find(id => event.results[id].rank === 3);

      let winnersText = '';
      if (champion) {
        const champUser = client.users.cache.get(champion);
        winnersText += `🥇 **${champUser?.username || 'Campeón'}**\n`;
      }
      if (runnerUp) {
        const runnerUser = client.users.cache.get(runnerUp);
        winnersText += `🥈 **${runnerUser?.username || 'Subcampeón'}**\n`;
      }
      if (thirdPlace) {
        const thirdUser = client.users.cache.get(thirdPlace);
        winnersText += `🥉 **${thirdUser?.username || '3er Lugar'}**\n`;
      }

      if (winnersText) {
        embed.addFields({
          name: '🏆 Podio Final',
          value: winnersText,
          inline: false
        });
      }
    }

    return embed;
  }

  /**
   * Get user's current tournament match
   */
  getUserTournamentMatch(eventId, userId) {
    const event = this.getEvent(eventId);
    if (!event || event.type !== EVENT_TYPES.DUEL_TOURNAMENT) {
      return null;
    }

    const bracket = event.metadata.bracket || [];
    const currentRound = bracket.length > 0 ? Math.max(...bracket.map(m => m.round)) : 0;

    // Find user's match in current round
    const match = bracket.find(m =>
      m.round === currentRound &&
      !m.winner &&
      (m.player1 === userId || m.player2 === userId)
    );

    return match;
  }

  /**
   * Generate tournament match VS embed showing both players' profiles
   */
  generateMatchVSEmbed(match, player1Data, player2Data, client) {
    const { EmbedBuilder } = require('discord.js');
    const COLORS = require('../src/config/colors');
    const EMOJIS = require('../src/config/emojis');

    // Get user objects from Discord client
    const player1 = client.users.cache.get(match.player1);
    const player2 = match.player2 ? client.users.cache.get(match.player2) : null;

    // Extract bio and rank info
    const p1Bio = player1Data?.customization?.bio || 'Un guerrero silencioso...';
    const p1Rank = player1Data?.rank || 'Ronin';
    const p1Honor = player1Data?.honor || 0;

    const p2Bio = player2Data?.customization?.bio || 'Un guerrero silencioso...';
    const p2Rank = player2Data?.rank || 'Ronin';
    const p2Honor = player2Data?.honor || 0;

    const embed = new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle('⚔️ COMBATE DE TORNEO ⚔️')
      .setDescription('**Dos guerreros se enfrentan en batalla**')
      .addFields(
        {
          name: `${EMOJIS.KATANA} ${player1?.username || 'Guerrero Desconocido'}`,
          value:
            `**Rango:** ${p1Rank}\n` +
            `**Honor:** ${p1Honor.toLocaleString()}\n` +
            `**Bio:** *"${p1Bio}"*`,
          inline: true
        },
        {
          name: '⚡',
          value: '**VS**',
          inline: true
        },
        {
          name: `${EMOJIS.KATANA} ${player2?.username || 'BYE'}`,
          value: player2
            ? `**Rango:** ${p2Rank}\n` +
              `**Honor:** ${p2Honor.toLocaleString()}\n` +
              `**Bio:** *"${p2Bio}"*`
            : '*Pase automático a la siguiente ronda*',
          inline: true
        }
      )
      .setTimestamp();

    // Set thumbnails with player avatars
    if (player1) {
      embed.setThumbnail(player1.displayAvatarURL({ dynamic: true, size: 256 }));
    }

    if (player2) {
      embed.setImage(player2.displayAvatarURL({ dynamic: true, size: 256 }));
    }

    return embed;
  }

  /**
   * Generate tournament control message with dropdown for next pending match
   * Returns { embed, components, match } or null if no pending matches
   */
  generateTournamentControlMessage(eventId, client) {
    const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
    const COLORS = require('../src/config/colors');
    const EMOJIS = require('../src/config/emojis');

    const event = this.getEvent(eventId);
    if (!event || event.type !== EVENT_TYPES.DUEL_TOURNAMENT) {
      return null;
    }

    const bracket = event.metadata.bracket || [];
    const currentRound = bracket.length > 0 ? Math.max(...bracket.map(m => m.round)) : 0;

    // Get next pending match in current round
    const pendingMatches = bracket.filter(m => m.round === currentRound && !m.winner && m.player2);

    if (pendingMatches.length === 0) {
      // No pending matches - check if tournament is complete
      const totalRounds = Math.ceil(Math.log2(event.participants.length));
      const allMatchesComplete = bracket.filter(m => m.round === currentRound).every(m => m.winner || !m.player2);

      if (currentRound >= totalRounds && allMatchesComplete) {
        // Tournament complete
        const embed = new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setTitle('🏆 TORNEO COMPLETADO')
          .setDescription(
            `**${event.name}**\n\n` +
            `¡El torneo ha finalizado! Usa \`/torneo bracket\` para ver el podio final.`
          )
          .setTimestamp();

        return { embed, components: [], match: null };
      } else {
        // Round complete, waiting for next round
        const embed = new EmbedBuilder()
          .setColor(COLORS.PRIMARY)
          .setTitle('⏳ Ronda Completa')
          .setDescription(
            `**${event.name}**\n\n` +
            `Todos los combates de la Ronda ${currentRound} han sido completados.\n` +
            `La siguiente ronda se iniciará automáticamente.`
          )
          .setTimestamp();

        return { embed, components: [], match: null };
      }
    }

    // Get the first pending match
    const match = pendingMatches[0];
    const p1User = client.users.cache.get(match.player1);
    const p2User = client.users.cache.get(match.player2);
    const p1Name = p1User?.username || 'Guerrero';
    const p2Name = p2User?.username || 'Guerrero';

    // Create dropdown with both players as options
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('tournament_winner_select')
      .setPlaceholder('Selecciona el ganador del combate')
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions([
        {
          label: `🏆 ${p1Name}`,
          description: 'Seleccionar como ganador',
          value: match.player1,
          emoji: '⚔️'
        },
        {
          label: `🏆 ${p2Name}`,
          description: 'Seleccionar como ganador',
          value: match.player2,
          emoji: '⚔️'
        }
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle('🎮 Panel de Control del Torneo')
      .setDescription(
        `**${event.name}**\n` +
        `**Ronda ${currentRound}** - Combate ${bracket.filter(m => m.round === currentRound && m.winner).length + 1}/${bracket.filter(m => m.round === currentRound && m.player2).length}\n\n` +
        `**Siguiente Combate:**\n` +
        `<@${match.player1}> ⚔️ <@${match.player2}>\n\n` +
        `**Combates Restantes:** ${pendingMatches.length}\n\n` +
        `${EMOJIS.ADMIN} **Solo el creador del evento puede registrar resultados**`
      )
      .addFields({
        name: '📝 Instrucciones',
        value: '1. Los jugadores completan su combate\n2. Selecciona el ganador del dropdown\n3. El mensaje se actualizará automáticamente al siguiente combate',
        inline: false
      })
      .setTimestamp();

    return { embed, components: [row], match };
  }

  /**
   * Genera el bracket visual en formato ASCII tipo Mundial de Fútbol
   * @param {string} eventId - ID del evento
   * @param {Client} client - Cliente de Discord
   * @returns {Promise<string>} Texto del bracket en ASCII
   */
  async generateVisualBracketText(eventId, client) {
    const event = this.getEvent(eventId);
    if (!event || event.type !== EVENT_TYPES.DUEL_TOURNAMENT) return '';

    const bracket = event.metadata.bracket;
    if (!bracket || bracket.length === 0) return '';

    const currentRound = Math.max(...bracket.map(m => m.round));
    const totalRounds = Math.ceil(Math.log2(event.participants.length));

    // Obtener nombres de todos los jugadores
    const playerNames = {};
    for (const match of bracket) {
      if (!playerNames[match.player1]) {
        playerNames[match.player1] = await this.getDisplayName(client, event.guildId, match.player1);
      }
      if (match.player2 && !playerNames[match.player2]) {
        playerNames[match.player2] = await this.getDisplayName(client, event.guildId, match.player2);
      }
    }

    // Agrupar matches por ronda
    const roundsData = {};
    for (let round = 1; round <= currentRound; round++) {
      roundsData[round] = bracket.filter(m => m.round === round);
    }

    // Construir bracket ASCII
    let bracketText = '```\n';
    bracketText += '╔════════════════ BRACKET ════════════════╗\n\n';

    // Generar nombres de rondas
    const roundNames = this.getRoundNames(totalRounds);
    let headerLine = '';
    for (let round = 1; round <= totalRounds; round++) {
      const roundName = roundNames[round] || `R${round}`;
      headerLine += roundName.padEnd(16);
    }
    bracketText += headerLine + '\n';
    bracketText += '─'.repeat(Math.min(headerLine.length, 50)) + '\n\n';

    // Generar el árbol visual - Ronda 1 (Cuartos/Octavos)
    const round1Matches = roundsData[1] || [];
    for (let i = 0; i < round1Matches.length; i++) {
      const match = round1Matches[i];
      const p1Name = (playerNames[match.player1] || 'Guerrero').substring(0, 8).padEnd(8);
      const p2Name = match.player2 ? (playerNames[match.player2] || 'Guerrero').substring(0, 8).padEnd(8) : 'BYE     ';

      const p1Mark = match.winner === match.player1 ? '✅' : (match.winner ? '❌' : '⏳');
      const p2Mark = match.winner === match.player2 ? '✅' : (match.winner ? '❌' : '⏳');

      bracketText += `${p1Name} ${p1Mark} ─╮\n`;

      // Conectar a siguiente ronda (semifinales)
      if (match.winner && roundsData[2]) {
        const winnerName = (playerNames[match.winner] || 'Ganador').substring(0, 8).padEnd(8);
        const semiMatch = roundsData[2].find(m => m.player1 === match.winner || m.player2 === match.winner);
        const semiMark = semiMatch?.winner === match.winner ? '✅' : (semiMatch?.winner ? '❌' : '⏳');

        if (i % 2 === 1 || round1Matches.length === 1) {
          // Par de combates completo - conectar a semifinal
          bracketText += `            ├─→ ${winnerName} ${semiMark}`;

          // Si hay final, conectar desde semifinal
          if (roundsData[3] && semiMatch?.winner) {
            const finalMatch = roundsData[3].find(m => m.player1 === semiMatch.winner || m.player2 === semiMatch.winner);
            const finalMark = finalMatch?.winner === semiMatch.winner ? '✅' : (finalMatch?.winner ? '❌' : '⏳');
            const semiWinnerName = (playerNames[semiMatch.winner] || 'Finalista').substring(0, 9).padEnd(9);

            if (i === 1 || (i === round1Matches.length - 1 && round1Matches.length <= 2)) {
              bracketText += ` ─╮\n`;
              bracketText += `                                        ├─→ ${semiWinnerName} ${finalMark}\n`;
            } else {
              bracketText += ` ─╮\n`;
            }
          } else {
            bracketText += ` ─╮\n`;
          }
        } else {
          bracketText += `            ├─→ ${winnerName} ${semiMark}\n`;
        }
      } else {
        bracketText += `            ├─→\n`;
      }

      bracketText += `${p2Name} ${p2Mark} ─╯\n`;

      if (i < round1Matches.length - 1 && i % 2 === 1) {
        bracketText += '\n';
      }
    }

    // Mostrar campeón si todos los combates están terminados
    const allMatchesCompleted = bracket.filter(m => m.player2).every(m => m.winner);
    if (allMatchesCompleted) {
      const finalMatch = bracket.find(m => m.round === currentRound && m.winner);
      if (finalMatch && finalMatch.winner) {
        const champName = (playerNames[finalMatch.winner] || 'Campeón').substring(0, 10).padEnd(10);
        bracketText += `\n                                                            ├─→ 👑 ${champName}\n`;
      } else {
        bracketText += `\n                                                            ├─→ 👑 ???\n`;
      }
    } else {
      bracketText += `\n                                                            ├─→ 👑 ???\n`;
    }

    bracketText += '\n╚═════════════════════════════════════════╝\n';
    bracketText += '```';

    return bracketText;
  }

  /**
   * Obtiene nombres de rondas según el total
   * @param {number} totalRounds - Total de rondas
   * @returns {Object} Nombres de rondas
   */
  getRoundNames(totalRounds) {
    const names = {
      1: totalRounds === 1 ? 'FINAL       ' : 'RONDA 1     ',
      2: totalRounds === 2 ? 'FINAL       ' : 'SEMIFINAL   ',
      3: totalRounds === 3 ? 'FINAL       ' : 'SEMIFINAL   ',
      4: 'FINAL       '
    };

    if (totalRounds >= 3) {
      names[1] = 'CUARTOS     ';
      names[2] = 'SEMIFINAL   ';
      names[3] = 'FINAL       ';
    }

    if (totalRounds >= 4) {
      names[4] = 'CAMPEÓN     ';
    }

    return names;
  }

  /**
   * Actualiza el mensaje principal del bracket del torneo
   * @param {string} eventId - ID del evento
   * @param {Channel} channel - Canal del torneo
   * @param {Client} client - Cliente de Discord
   * @param {DataManager} dataManager - DataManager para obtener datos de usuarios
   * @param {string} guildId - ID del servidor
   * @returns {Promise<void>}
   */
  async updateBracketMessage(eventId, channel, client, dataManager, guildId) {
    try {
      const event = this.getEvent(eventId);
      if (!event || event.type !== EVENT_TYPES.DUEL_TOURNAMENT) {
        console.log(`❌ No se puede actualizar bracket: evento no encontrado o no es torneo`);
        return;
      }

      const bracketMessageId = event.metadata?.bracketMessageId;
      if (!bracketMessageId) {
        console.log(`⚠️ No hay bracketMessageId guardado para el torneo ${eventId}`);
        return;
      }

      // Buscar el mensaje
      const bracketMessage = await channel.messages.fetch(bracketMessageId).catch(() => null);
      if (!bracketMessage) {
        console.log(`❌ No se pudo encontrar el mensaje del bracket: ${bracketMessageId}`);
        return;
      }

      // Generar embed actualizado con bracket visual
      const { EmbedBuilder } = require('discord.js');
      const EMOJIS = require('../src/config/emojis');
      const COLORS = require('../src/config/colors');

      const bracket = event.metadata.bracket;
      const currentRound = Math.max(...bracket.map(m => m.round));
      const totalRounds = Math.ceil(Math.log2(event.participants.length));

      // Obtener último resultado
      let lastResult = null;
      if (event.metadata.matches && event.metadata.matches.length > 0) {
        const lastMatch = event.metadata.matches[event.metadata.matches.length - 1];
        const winnerName = await this.getDisplayName(client, guildId, lastMatch.winner);
        const loserName = await this.getDisplayName(client, guildId,
          lastMatch.player1 === lastMatch.winner ? lastMatch.player2 : lastMatch.player1
        );
        const timeAgo = Math.floor((Date.now() - lastMatch.timestamp) / 1000);
        lastResult = `**${winnerName}** derrotó a **${loserName}**\n⏱️ <t:${Math.floor(lastMatch.timestamp / 1000)}:R>`;
      }

      // Generar bracket visual
      const bracketText = await this.generateVisualBracketText(eventId, client);

      // Crear embed
      const embed = new EmbedBuilder()
        .setColor(event.status === 'completed' ? COLORS.SUCCESS : COLORS.PRIMARY)
        .setTitle(`${EMOJIS.TOURNAMENT || '🏆'} ${event.name}`)
        .setDescription(
          `**Estado:** ${event.status === 'active' ? '🟢 Activo' : event.status === 'completed' ? '✅ Finalizado' : '⏳ Pendiente'}\n` +
          `**Ronda:** ${currentRound}/${totalRounds}\n` +
          `**Participantes:** ${event.participants.length}`
        );

      // Agregar último resultado si existe
      if (lastResult) {
        embed.addFields({
          name: '🔥 Último Resultado',
          value: lastResult,
          inline: false
        });
      }

      // Agregar bracket visual
      if (bracketText) {
        embed.addFields({
          name: '📊 Bracket del Torneo',
          value: bracketText,
          inline: false
        });
      }

      // Verificar si todos los combates están terminados
      const allMatchesCompleted = bracket.filter(m => m.player2).every(m => m.winner);

      // Agregar combate actual o mostrar ganador
      const pendingMatches = bracket.filter(m => m.round === currentRound && !m.winner && m.player2);
      if (pendingMatches.length > 0) {
        const nextMatch = pendingMatches[0];
        const p1Name = await this.getDisplayName(client, guildId, nextMatch.player1);
        const p2Name = await this.getDisplayName(client, guildId, nextMatch.player2);
        embed.addFields({
          name: '⚔️ Combate Actual',
          value: `**${p1Name}** 🆚 **${p2Name}**`,
          inline: false
        });
      } else if (allMatchesCompleted) {
        // Todos los combates terminados - mostrar ganador
        const finalMatch = bracket.find(m => m.round === currentRound && m.winner);
        if (finalMatch && finalMatch.winner) {
          const championName = await this.getDisplayName(client, guildId, finalMatch.winner);
          const runnerUpId = finalMatch.player1 === finalMatch.winner ? finalMatch.player2 : finalMatch.player1;
          const runnerUpName = await this.getDisplayName(client, guildId, runnerUpId);

          // Encontrar tercer puesto (perdedor de semifinal que no llegó a la final)
          let podiumText = `🥇 **Campeón:** ${championName}\n🥈 **Subcampeón:** ${runnerUpName}`;

          if (currentRound > 1) {
            // Buscar semifinales (ronda anterior)
            const semiFinalsRound = currentRound - 1;
            const semiFinals = bracket.filter(m => m.round === semiFinalsRound && m.winner);

            // Encontrar los perdedores de semifinales (excluir al subcampeón)
            const thirdPlaceCandidates = [];
            for (const match of semiFinals) {
              const loserId = match.player1 === match.winner ? match.player2 : match.player1;
              if (loserId !== runnerUpId) {
                thirdPlaceCandidates.push(loserId);
              }
            }

            if (thirdPlaceCandidates.length > 0) {
              const thirdPlaceName = await this.getDisplayName(client, guildId, thirdPlaceCandidates[0]);
              podiumText += `\n🥉 **Tercer Puesto:** ${thirdPlaceName}`;
            }
          }

          embed.addFields({
            name: '👑 ¡Torneo Completado!',
            value: podiumText,
            inline: false
          });
        }
      }

      embed.setFooter({ text: `Última actualización` })
        .setTimestamp();

      // Editar el mensaje
      await bracketMessage.edit({ embeds: [embed] });
      console.log(`✅ Bracket actualizado exitosamente para ${event.name}`);
    } catch (error) {
      console.error(`❌ Error actualizando bracket message:`, error);
    }
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
   * @param {string} guildId - ID del servidor
   * @returns {Promise<EmbedBuilder>} Embed del combate
   */
  async generateMatchVSEmbed(match, p1Data, p2Data, client, guildId = null) {
    const { EmbedBuilder } = require('discord.js');
    const EMOJIS = require('../src/config/emojis');
    const COLORS = require('../src/config/colors');

    // Verificar si son usuarios ficticios (de prueba)
    const isTestUser1 = match.player1.startsWith('test_');
    const isTestUser2 = match.player2.startsWith('test_');

    // Obtener usuarios de Discord (solo si NO son ficticios)
    const player1 = !isTestUser1 ? await client.users.fetch(match.player1).catch(() => null) : null;
    const player2 = !isTestUser2 ? await client.users.fetch(match.player2).catch(() => null) : null;

    // Obtener guild correcto usando el guildId proporcionado
    let guild = null;
    if (guildId && (!isTestUser1 || !isTestUser2)) {
      guild = client.guilds.cache.get(guildId);
      console.log(`🔍 Buscando servidor con ID: ${guildId} - ${guild ? `✅ Encontrado: ${guild.name}` : '❌ NO ENCONTRADO'}`);
    } else if (!isTestUser1 || !isTestUser2) {
      guild = client.guilds.cache.first();
      console.log(`⚠️ No se proporcionó guildId, usando primer servidor: ${guild ? guild.name : 'ninguno'}`);
    }

    if (!guild && (!isTestUser1 || !isTestUser2)) {
      const availableGuilds = Array.from(client.guilds.cache.entries()).map(([id, g]) => `${id} (${g.name})`);
      console.log(`❌ ERROR: No se pudo obtener el servidor. Servidores en cache: ${availableGuilds.join(', ')}`);
    }

    const member1 = (!isTestUser1 && guild) ? await guild.members.fetch(match.player1).catch((e) => {
      console.log(`⚠️ No se pudo obtener member1 (${match.player1}): ${e.message}`);
      return null;
    }) : null;
    const member2 = (!isTestUser2 && guild) ? await guild.members.fetch(match.player2).catch((e) => {
      console.log(`⚠️ No se pudo obtener member2 (${match.player2}): ${e.message}`);
      return null;
    }) : null;

    // Obtener nombres (usar await getDisplayName para manejar usuarios ficticios)
    const p1Name = isTestUser1 ? await this.getDisplayName(client, guildId, match.player1) :
                   (member1 ? member1.displayName : (player1 ? player1.username : match.player1));
    const p2Name = isTestUser2 ? await this.getDisplayName(client, guildId, match.player2) :
                   (member2 ? member2.displayName : (player2 ? player2.username : match.player2));

    console.log(`🏷️ Nombres finales - P1: "${p1Name}" (test: ${isTestUser1}), P2: "${p2Name}" (test: ${isTestUser2})`);

    // Obtener avatares (null para usuarios ficticios)
    const p1Avatar = (!isTestUser1 && player1) ? player1.displayAvatarURL({ size: 256 }) : null;
    const p2Avatar = (!isTestUser2 && player2) ? player2.displayAvatarURL({ size: 256 }) : null;

    // Obtener bio desde customization
    const p1Bio = p1Data?.customization?.bio || 'Un guerrero misterioso...';
    const p2Bio = p2Data?.customization?.bio || 'Un guerrero misterioso...';

    const embed = new EmbedBuilder()
      .setColor(COLORS.COMBAT || '#FF6B35')
      .setTitle(`${EMOJIS.COMBAT || '⚔️'} COMBATE DE TORNEO ${EMOJIS.COMBAT || '⚔️'}`)
      .setDescription('Dos guerreros se enfrentan en batalla')
      .addFields(
        {
          name: `⚔️ Jugador 1`,
          value:
            `**Nombre:** ${p1Name}\n` +
            `**Rango:** ${p1Data?.rank || 'Ronin'}\n` +
            `**Honor:** ${p1Data?.honor || 0}\n` +
            `**Bio:** *"${p1Bio}"*`,
          inline: true
        },
        {
          name: '⚡',
          value: '**VS**',
          inline: true
        },
        {
          name: `⚔️ Jugador 2`,
          value:
            `**Nombre:** ${p2Name}\n` +
            `**Rango:** ${p2Data?.rank || 'Ronin'}\n` +
            `**Honor:** ${p2Data?.honor || 0}\n` +
            `**Bio:** *"${p2Bio}"*`,
          inline: true
        }
      )
      .setTimestamp();

    // Avatar pequeño del Jugador 1 en author (esquina superior izquierda)
    if (p1Avatar) {
      embed.setAuthor({
        name: p1Name,
        iconURL: p1Avatar
      });
    }

    // Avatar mediano del Jugador 2 en thumbnail (esquina superior derecha)
    if (p2Avatar) {
      embed.setThumbnail(p2Avatar);
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

    // Obtener guild correcto para displayNames
    const guild = client.guilds.cache.get(event.guildId);
    console.log(`🔍 [TournamentControl] Servidor: ${event.guildId} - ${guild ? `✅ ${guild.name}` : '❌ NO ENCONTRADO'}`);

    const member1 = guild ? await guild.members.fetch(currentMatch.player1).catch(() => null) : null;
    const member2 = guild ? await guild.members.fetch(currentMatch.player2).catch(() => null) : null;
    const user1 = await client.users.fetch(currentMatch.player1).catch(() => null);
    const user2 = await client.users.fetch(currentMatch.player2).catch(() => null);

    // MEJORA 4: Usar displayName en lugar de username
    const p1Name = member1 ? member1.displayName : (user1 ? user1.username : currentMatch.player1);
    const p2Name = member2 ? member2.displayName : (user2 ? user2.username : currentMatch.player2);

    console.log(`🏷️ [TournamentControl] P1: "${p1Name}" (displayName: ${member1?.displayName || 'N/A'}), P2: "${p2Name}" (displayName: ${member2?.displayName || 'N/A'})`);

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
      // Manejar usuarios ficticios (de prueba)
      if (userId.startsWith('test_')) {
        // Extraer el número del ID: test_timestamp_N
        const parts = userId.split('_');
        const userNumber = parts[parts.length - 1];
        return `TestUser_${userNumber}`;
      }

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

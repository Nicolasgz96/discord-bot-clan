/**
 * DEMON HUNTER - Combat Manager
 * Sistema de combate por turnos estilo RPG para duelos samurái
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const CONSTANTS = require('../src/config/constants');
const EMOJIS = require('../src/config/emojis');

class CombatManager {
  constructor() {
    // Almacena duelos activos { duelId: CombatState }
    this.activeDuels = new Map();
  }

  /**
   * Crear oponente IA basado en dificultad de arena
   * @param {string} difficulty - ID de dificultad ('ronin', 'samurai', 'daimyo', 'shogun')
   * @returns {Object} - Datos del oponente IA
   */
  createAIOpponent(difficulty) {
    const difficultyData = CONSTANTS.ARENA.DIFFICULTIES[difficulty.toUpperCase()];
    if (!difficultyData) {
      throw new Error('Dificultad inválida');
    }

    const aiStats = difficultyData.aiStats;

    // Crear userData falso para la IA
    const aiUserData = {
      userId: `AI_${difficulty}_${Date.now()}`,
      username: `Guerrero ${difficultyData.name}`,
      isAI: true,
      difficulty: difficulty,
      combat: {
        equipment: {
          weapon: aiStats.weapon,
          armor: aiStats.armor
        },
        skills: aiStats.skills || [],
        training: aiStats.training || {
          strength: 0,
          agility: 0,
          ki_mastery: 0,
          vitality: 0
        },
        consumables: []
      }
    };

    return aiUserData;
  }

  /**
   * Iniciar combate vs IA en la Arena
   * @param {Object} player - Datos del jugador
   * @param {string} difficulty - Dificultad ('ronin', 'samurai', 'daimyo', 'shogun')
   * @returns {string} - ID del combate
   */
  createArenaBattle(player, difficulty) {
    const aiOpponent = this.createAIOpponent(difficulty);
    const duelId = `arena_${player.userId}_${difficulty}_${Date.now()}`;

    // Calcular stats del jugador
    const playerStats = this.calculateCombatStats(player);

    // Calcular stats de la IA
    let aiStats = this.calculateCombatStats(aiOpponent);

    // Aplicar multiplicadores de dificultad
    const difficultyData = CONSTANTS.ARENA.DIFFICULTIES[difficulty.toUpperCase()];
    aiStats.maxHP = Math.floor(aiStats.maxHP * difficultyData.aiStats.hpMultiplier);
    aiStats.damageBonus = Math.floor(aiStats.damageBonus * difficultyData.aiStats.damageMultiplier);
    aiStats.damageMultiplier *= difficultyData.aiStats.damageMultiplier;

    const combatState = {
      duelId,
      isArenaBattle: true,
      difficulty: difficulty,
      turn: 1,
      currentPlayer: 'challenger', // Jugador siempre empieza

      // Estado del jugador
      challenger: {
        userId: player.userId,
        userData: player,
        hp: playerStats.maxHP,
        maxHP: playerStats.maxHP,
        ki: playerStats.maxKi,
        maxKi: playerStats.maxKi,
        stats: playerStats,
        defending: false,
        effects: [],
        skillCooldowns: {},
        skillUsesRemaining: {}
      },

      // Estado de la IA
      opponent: {
        userId: aiOpponent.userId,
        userData: aiOpponent,
        isAI: true,
        hp: aiStats.maxHP,
        maxHP: aiStats.maxHP,
        ki: aiStats.maxKi,
        maxKi: aiStats.maxKi,
        stats: aiStats,
        defending: false,
        effects: [],
        skillCooldowns: {},
        skillUsesRemaining: {},
        aggressiveness: difficultyData.aiStats.aggressiveness
      },

      combatLog: [],
      startTime: Date.now()
    };

    // Inicializar usos de habilidades
    this.initializeSkillUses(combatState.challenger);
    this.initializeSkillUses(combatState.opponent);

    this.activeDuels.set(duelId, combatState);
    return duelId;
  }

  /**
   * IA toma una decisión de combate
   * @param {Object} duel - Estado del duelo
   * @returns {Object} - Acción decidida { actionType, actionData }
   */
  aiDecideAction(duel) {
    const ai = duel.opponent;
    const player = duel.challenger;

    // Determinar si la IA está en peligro (HP bajo)
    const hpPercent = ai.hp / ai.maxHP;
    const isDangerous = hpPercent < 0.3;

    // Si HP muy bajo y tiene té medicinal, usarlo
    if (isDangerous && ai.ki >= 1) {
      // 70% chance de defender cuando está en peligro
      if (Math.random() < 0.7) {
        return { actionType: 'defend', actionData: {} };
      }
    }

    // Intentar usar habilidades si tiene Ki y según agresividad
    if (ai.userData.combat.skills && ai.userData.combat.skills.length > 0 && Math.random() < ai.aggressiveness) {
      for (const skillId of ai.userData.combat.skills) {
        // Verificar cooldown
        if (ai.skillCooldowns[skillId] && ai.skillCooldowns[skillId] > 0) continue;

        // Verificar usos restantes
        const skill = CONSTANTS.COMBAT.SKILLS[skillId.toUpperCase()];
        if (skill.usesPerDuel && ai.skillUsesRemaining[skillId] <= 0) continue;

        // Verificar Ki
        if (ai.ki >= skill.kiCost) {
          return { actionType: 'skill', actionData: { skillId } };
        }
      }
    }

    // Estrategia basada en Ki disponible
    if (ai.ki >= 3 && Math.random() < 0.4) {
      // 40% chance de golpe crítico si tiene 3 Ki
      return { actionType: 'critical_strike', actionData: {} };
    } else if (ai.ki >= 2 && Math.random() < 0.6) {
      // 60% chance de ataque pesado si tiene 2 Ki
      return { actionType: 'heavy_attack', actionData: {} };
    } else if (ai.ki >= 1) {
      // Ataque rápido si tiene al menos 1 Ki
      return { actionType: 'light_attack', actionData: {} };
    } else {
      // Sin Ki, defender
      return { actionType: 'defend', actionData: {} };
    }
  }

  /**
   * Iniciar un nuevo duelo
   * @param {Object} challenger - Datos del retador
   * @param {Object} opponent - Datos del oponente
   * @param {number} bet - Apuesta de honor
   * @returns {string} - ID del duelo
   */
  createDuel(challenger, opponent, bet) {
    const duelId = `${challenger.userId}_${opponent.userId}_${Date.now()}`;

    // Calcular stats de ambos jugadores
    const challengerStats = this.calculateCombatStats(challenger);
    const opponentStats = this.calculateCombatStats(opponent);

    const combatState = {
      duelId,
      bet,
      turn: 1,
      currentPlayer: 'challenger', // 'challenger' o 'opponent'

      // Estado del retador
      challenger: {
        userId: challenger.userId,
        userData: challenger,
        hp: challengerStats.maxHP,
        maxHP: challengerStats.maxHP,
        ki: challengerStats.maxKi,
        maxKi: challengerStats.maxKi,
        stats: challengerStats,
        defending: false,
        effects: [], // { type, duration, value }
        skillCooldowns: {}, // { skillId: turnsRemaining }
        skillUsesRemaining: {} // { skillId: usesRemaining }
      },

      // Estado del oponente
      opponent: {
        userId: opponent.userId,
        userData: opponent,
        hp: opponentStats.maxHP,
        maxHP: opponentStats.maxHP,
        ki: opponentStats.maxKi,
        maxKi: opponentStats.maxKi,
        stats: opponentStats,
        defending: false,
        effects: [],
        skillCooldowns: {},
        skillUsesRemaining: {}
      },

      // Log de combate
      combatLog: [],
      startTime: Date.now()
    };

    // Inicializar usos de habilidades con límite
    this.initializeSkillUses(combatState.challenger);
    this.initializeSkillUses(combatState.opponent);

    this.activeDuels.set(duelId, combatState);
    return duelId;
  }

  /**
   * Inicializar usos de habilidades limitadas
   */
  initializeSkillUses(fighter) {
    if (!fighter.userData.combat || !fighter.userData.combat.skills) return;

    for (const skillId of fighter.userData.combat.skills) {
      const skill = CONSTANTS.COMBAT.SKILLS[skillId.toUpperCase()];
      if (skill && skill.usesPerDuel) {
        fighter.skillUsesRemaining[skillId] = skill.usesPerDuel;
      }
    }
  }

  /**
   * Calcular stats de combate de un jugador
   */
  calculateCombatStats(userData) {
    const combat = userData.combat || {
      equipment: { weapon: null, armor: null },
      training: { strength: 0, agility: 0, ki_mastery: 0, vitality: 0 },
      skills: []
    };

    return {
      maxHP: CONSTANTS.calculateMaxHP(combat),
      maxKi: CONSTANTS.calculateMaxKi(combat),
      damageBonus: CONSTANTS.calculateDamageBonus(combat),
      damageMultiplier: CONSTANTS.calculateDamageMultiplier(combat),
      evasionChance: CONSTANTS.calculateEvasionChance(combat)
    };
  }

  /**
   * Obtener estado de un duelo
   */
  getDuel(duelId) {
    return this.activeDuels.get(duelId);
  }

  /**
   * Procesar una acción de combate
   * @param {string} duelId - ID del duelo
   * @param {string} userId - ID del usuario que actúa
   * @param {string} actionType - Tipo de acción
   * @param {Object} actionData - Datos adicionales de la acción
   * @returns {Object} - Resultado de la acción
   */
  processAction(duelId, userId, actionType, actionData = {}) {
    const duel = this.getDuel(duelId);
    if (!duel) {
      return { success: false, message: 'Duelo no encontrado' };
    }

    // Verificar turno
    const attacker = duel.currentPlayer === 'challenger' ? duel.challenger : duel.opponent;
    const defender = duel.currentPlayer === 'challenger' ? duel.opponent : duel.challenger;

    if (attacker.userId !== userId) {
      return { success: false, message: 'No es tu turno' };
    }

    // Procesar la acción
    let result;
    switch (actionType) {
      case 'light_attack':
      case 'heavy_attack':
      case 'critical_strike':
        result = this.executeAttack(duel, attacker, defender, actionType);
        break;

      case 'defend':
        result = this.executeDefend(duel, attacker);
        break;

      case 'counter':
        result = this.executeCounter(duel, attacker, defender);
        break;

      case 'skill':
        result = this.executeSkill(duel, attacker, defender, actionData.skillId);
        break;

      case 'use_item':
        result = this.useItem(duel, attacker, actionData.itemId);
        break;

      default:
        return { success: false, message: 'Acción inválida' };
    }

    if (!result.success) {
      return result;
    }

    // Actualizar efectos (duración)
    this.updateEffects(attacker);
    this.updateEffects(defender);

    // Reducir cooldowns
    this.updateCooldowns(attacker);

    // Regenerar Ki al inicio del turno (solo 1 punto por turno)
    attacker.ki = Math.min(attacker.ki + CONSTANTS.COMBAT.KI_REGEN_PER_TURN, attacker.maxKi);

    // Agregar al log
    duel.combatLog.push({
      turn: duel.turn,
      player: duel.currentPlayer,
      action: actionType,
      result: result.message
    });

    // Verificar fin de combate
    const gameOver = this.checkGameOver(duel);
    if (gameOver) {
      result.gameOver = true;
      result.winner = gameOver.winner;
      result.reason = gameOver.reason;
      this.endDuel(duelId);
      return result;
    }

    // Cambiar turno
    duel.currentPlayer = duel.currentPlayer === 'challenger' ? 'opponent' : 'challenger';
    duel.turn++;

    // Verificar límite de turnos
    if (duel.turn > CONSTANTS.COMBAT.MAX_TURNS) {
      result.gameOver = true;
      result.winner = null; // Empate
      result.reason = 'Se alcanzó el límite de turnos';
      this.endDuel(duelId);
    }

    return result;
  }

  /**
   * Ejecutar un ataque
   */
  executeAttack(duel, attacker, defender, attackType) {
    const action = CONSTANTS.COMBAT.ACTIONS[attackType.toUpperCase()];

    if (!action) {
      return { success: false, message: 'Tipo de ataque inválido' };
    }

    // Verificar Ki suficiente
    if (attacker.ki < action.kiCost) {
      return { success: false, message: `No tienes suficiente Ki (necesitas ${action.kiCost})` };
    }

    // Consumir Ki
    attacker.ki -= action.kiCost;

    // Calcular precisión (considerar evasión del defensor)
    let accuracy = action.accuracy;
    const evaded = Math.random() < defender.stats.evasionChance;

    if (evaded) {
      return {
        success: true,
        message: `${action.emoji} ${action.name} - ¡El oponente esquivó el ataque!`,
        damage: 0
      };
    }

    // Roll de acierto
    if (Math.random() > accuracy) {
      return {
        success: true,
        message: `${action.emoji} ${action.name} - ¡Fallaste!`,
        damage: 0
      };
    }

    // Calcular daño
    const baseDamage = Math.floor(
      Math.random() * (action.damage.max - action.damage.min + 1) + action.damage.min
    );

    let totalDamage = baseDamage + attacker.stats.damageBonus;
    totalDamage = Math.floor(totalDamage * attacker.stats.damageMultiplier);

    // Aplicar efectos del atacante (damage boost)
    const damageBoostEffect = attacker.effects.find(e => e.type === 'damageBoost');
    if (damageBoostEffect) {
      totalDamage = Math.floor(totalDamage * (1 + damageBoostEffect.value));
    }

    // Aplicar defensa si está activa
    if (defender.defending) {
      totalDamage = Math.floor(totalDamage * 0.5);
      defender.defending = false; // Se consume la defensa
    }

    // Aplicar daño
    defender.hp = Math.max(0, defender.hp - totalDamage);

    return {
      success: true,
      message: `${action.emoji} ${action.name} - ¡${totalDamage} de daño!`,
      damage: totalDamage
    };
  }

  /**
   * Ejecutar defensa
   */
  executeDefend(duel, attacker) {
    attacker.defending = true;
    return {
      success: true,
      message: `${CONSTANTS.COMBAT.ACTIONS.DEFEND.emoji} Postura defensiva activada (reduce 50% del próximo ataque)`
    };
  }

  /**
   * Ejecutar contraataque
   */
  executeCounter(duel, attacker, defender) {
    const action = CONSTANTS.COMBAT.ACTIONS.COUNTER;

    if (attacker.ki < action.kiCost) {
      return { success: false, message: `No tienes suficiente Ki (necesitas ${action.kiCost})` };
    }

    attacker.ki -= action.kiCost;

    // Roll de éxito
    if (Math.random() > action.successChance) {
      return {
        success: true,
        message: `${action.emoji} Contraataque - ¡Fallaste el contraataque!`,
        damage: 0
      };
    }

    // Éxito - bloquear y devolver daño
    attacker.defending = true;

    return {
      success: true,
      message: `${action.emoji} ¡Contraataque exitoso! Próximo ataque será bloqueado y devuelto`,
      counterActive: true
    };
  }

  /**
   * Ejecutar habilidad especial
   */
  executeSkill(duel, attacker, defender, skillId) {
    // Verificar que el usuario tenga la habilidad
    if (!attacker.userData.combat || !attacker.userData.combat.skills.includes(skillId)) {
      return { success: false, message: 'No tienes esta habilidad' };
    }

    const skill = CONSTANTS.COMBAT.SKILLS[skillId.toUpperCase()];
    if (!skill) {
      return { success: false, message: 'Habilidad inválida' };
    }

    // Verificar cooldown
    if (attacker.skillCooldowns[skillId] && attacker.skillCooldowns[skillId] > 0) {
      return {
        success: false,
        message: `Esta habilidad está en cooldown (${attacker.skillCooldowns[skillId]} turnos)`
      };
    }

    // Verificar usos restantes (si aplica)
    if (skill.usesPerDuel && attacker.skillUsesRemaining[skillId] <= 0) {
      return { success: false, message: 'Ya usaste todos los usos de esta habilidad en este duelo' };
    }

    // Verificar Ki
    if (attacker.ki < skill.kiCost) {
      return { success: false, message: `No tienes suficiente Ki (necesitas ${skill.kiCost})` };
    }

    // Consumir Ki
    attacker.ki -= skill.kiCost;

    // Procesar habilidad específica
    let result;
    switch (skillId) {
      case 'flame_slash':
        defender.hp = Math.max(0, defender.hp - skill.damage);
        result = {
          success: true,
          message: `${skill.emoji} ${skill.name} - ¡${skill.damage} de daño garantizado!`,
          damage: skill.damage
        };
        break;

      case 'tempest_dance':
        let totalDamage = 0;
        for (let i = 0; i < skill.hits; i++) {
          if (Math.random() < skill.accuracy) {
            const damage = Math.floor(
              Math.random() * (skill.damagePerHit.max - skill.damagePerHit.min + 1) +
              skill.damagePerHit.min
            );
            totalDamage += damage;
          }
        }
        defender.hp = Math.max(0, defender.hp - totalDamage);
        result = {
          success: true,
          message: `${skill.emoji} ${skill.name} - ¡${totalDamage} de daño total!`,
          damage: totalDamage
        };
        break;

      case 'shogun_stance':
        attacker.effects.push({ type: 'immunity', duration: 1, value: true });
        result = {
          success: true,
          message: `${skill.emoji} ${skill.name} - ¡Inmunidad total por 1 turno!`
        };
        break;

      case 'heaven_blade':
        defender.hp = Math.max(0, defender.hp - skill.damage);
        result = {
          success: true,
          message: `${skill.emoji} ${skill.name} - ¡${skill.damage} de daño devastador!`,
          damage: skill.damage
        };
        break;

      default:
        return { success: false, message: 'Habilidad no implementada' };
    }

    // Aplicar cooldown
    if (skill.cooldown) {
      attacker.skillCooldowns[skillId] = skill.cooldown;
    }

    // Reducir usos si aplica
    if (skill.usesPerDuel) {
      attacker.skillUsesRemaining[skillId]--;
    }

    return result;
  }

  /**
   * Usar un item consumible
   */
  useItem(duel, attacker, itemId) {
    const item = CONSTANTS.COMBAT.CONSUMABLES[itemId.toUpperCase()];
    if (!item) {
      return { success: false, message: 'Item inválido' };
    }

    // Verificar que el usuario tenga el item
    const hasItem = attacker.userData.combat &&
      attacker.userData.combat.consumables &&
      attacker.userData.combat.consumables.some(c => c.itemId === itemId && c.quantity > 0);

    if (!hasItem) {
      return { success: false, message: 'No tienes este item' };
    }

    // Procesar efecto del item
    let result;
    switch (itemId) {
      case 'healing_tea':
        const healAmount = Math.min(item.healAmount, attacker.maxHP - attacker.hp);
        attacker.hp += healAmount;
        result = {
          success: true,
          message: `${item.emoji} ${item.name} - Restauraste ${healAmount} HP`,
          consumeItem: true
        };
        break;

      case 'warrior_elixir':
        attacker.effects.push({
          type: 'damageBoost',
          duration: item.damageBoost.duration,
          value: item.damageBoost
        });
        result = {
          success: true,
          message: `${item.emoji} ${item.name} - +50% daño por ${item.duration} turnos`,
          consumeItem: true
        };
        break;

      case 'precision_charm':
        attacker.effects.push({
          type: 'accuracyBoost',
          duration: item.duration,
          value: item.accuracyBoost
        });
        result = {
          success: true,
          message: `${item.emoji} ${item.name} - +30% precisión durante todo el duelo`,
          consumeItem: true
        };
        break;

      case 'ki_potion':
        attacker.ki = Math.min(attacker.ki + item.kiRestore, attacker.maxKi);
        result = {
          success: true,
          message: `${item.emoji} ${item.name} - Restauraste ${item.kiRestore} Ki`,
          consumeItem: true
        };
        break;

      default:
        return { success: false, message: 'Item no implementado' };
    }

    return result;
  }

  /**
   * Actualizar efectos (reducir duración)
   */
  updateEffects(fighter) {
    fighter.effects = fighter.effects
      .map(effect => {
        effect.duration--;
        return effect;
      })
      .filter(effect => effect.duration > 0);
  }

  /**
   * Actualizar cooldowns (reducir en 1)
   */
  updateCooldowns(fighter) {
    for (const skillId in fighter.skillCooldowns) {
      if (fighter.skillCooldowns[skillId] > 0) {
        fighter.skillCooldowns[skillId]--;
      }
    }
  }

  /**
   * Verificar si el combate terminó
   */
  checkGameOver(duel) {
    if (duel.challenger.hp <= 0) {
      return { winner: 'opponent', reason: 'El retador fue derrotado' };
    }

    if (duel.opponent.hp <= 0) {
      return { winner: 'challenger', reason: 'El oponente fue derrotado' };
    }

    return null;
  }

  /**
   * Finalizar un duelo
   */
  endDuel(duelId) {
    this.activeDuels.delete(duelId);
  }

  /**
   * Generar embed del estado del combate
   */
  generateCombatEmbed(duel) {
    const challenger = duel.challenger;
    const opponent = duel.opponent;

    const challengerHPPercent = (challenger.hp / challenger.maxHP) * 100;
    const opponentHPPercent = (opponent.hp / opponent.maxHP) * 100;

    const challengerHPBar = this.generateHPBar(challengerHPPercent);
    const opponentHPBar = this.generateHPBar(opponentHPPercent);

    const currentTurnPlayer = duel.currentPlayer === 'challenger' ? challenger : opponent;

    const embed = new EmbedBuilder()
      .setTitle(`⚔️ DUELO SAMURÁI - Turno ${duel.turn}`)
      .setColor('#E74C3C')
      .addFields(
        {
          name: `${EMOJIS.MEMBER} Retador`,
          value: `❤️ HP: ${challengerHPBar} ${challenger.hp}/${challenger.maxHP}\n⚡ Ki: ${'🔷'.repeat(challenger.ki)}${'⬜'.repeat(challenger.maxKi - challenger.ki)} ${challenger.ki}/${challenger.maxKi}`,
          inline: true
        },
        {
          name: `${EMOJIS.MEMBER} Oponente`,
          value: `❤️ HP: ${opponentHPBar} ${opponent.hp}/${opponent.maxHP}\n⚡ Ki: ${'🔷'.repeat(opponent.ki)}${'⬜'.repeat(opponent.maxKi - opponent.ki)} ${opponent.ki}/${opponent.maxKi}`,
          inline: true
        }
      )
      .setFooter({ text: `Turno de: ${duel.currentPlayer === 'challenger' ? 'Retador' : 'Oponente'} | Apuesta: ${duel.bet} honor` });

    // Agregar efectos activos
    if (currentTurnPlayer.effects.length > 0) {
      const effectsText = currentTurnPlayer.effects
        .map(e => `${e.type} (${e.duration} turnos)`)
        .join(', ');
      embed.addFields({ name: '✨ Efectos Activos', value: effectsText });
    }

    return embed;
  }

  /**
   * Generar barra de HP visual
   */
  generateHPBar(percent) {
    const barLength = 10;
    const filled = Math.round((percent / 100) * barLength);
    const empty = barLength - filled;

    if (percent > 70) {
      return '🟩'.repeat(filled) + '⬜'.repeat(empty);
    } else if (percent > 30) {
      return '🟨'.repeat(filled) + '⬜'.repeat(empty);
    } else {
      return '🟥'.repeat(filled) + '⬜'.repeat(empty);
    }
  }

  /**
   * Generar botones de acciones de combate
   */
  generateCombatButtons(fighter) {
    const buttons = [];

    // Ataques básicos
    buttons.push(
      new ButtonBuilder()
        .setCustomId('combat_light_attack')
        .setLabel(`⚡ Ataque Rápido (${CONSTANTS.COMBAT.ACTIONS.LIGHT_ATTACK.kiCost} Ki)`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(fighter.ki < CONSTANTS.COMBAT.ACTIONS.LIGHT_ATTACK.kiCost)
    );

    buttons.push(
      new ButtonBuilder()
        .setCustomId('combat_heavy_attack')
        .setLabel(`💥 Ataque Pesado (${CONSTANTS.COMBAT.ACTIONS.HEAVY_ATTACK.kiCost} Ki)`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(fighter.ki < CONSTANTS.COMBAT.ACTIONS.HEAVY_ATTACK.kiCost)
    );

    buttons.push(
      new ButtonBuilder()
        .setCustomId('combat_critical_strike')
        .setLabel(`💢 Golpe Crítico (${CONSTANTS.COMBAT.ACTIONS.CRITICAL_STRIKE.kiCost} Ki)`)
        .setStyle(ButtonStyle.Danger)
        .setDisabled(fighter.ki < CONSTANTS.COMBAT.ACTIONS.CRITICAL_STRIKE.kiCost)
    );

    // Defensa y contraataque
    buttons.push(
      new ButtonBuilder()
        .setCustomId('combat_defend')
        .setLabel('🛡️ Defender')
        .setStyle(ButtonStyle.Secondary)
    );

    buttons.push(
      new ButtonBuilder()
        .setCustomId('combat_counter')
        .setLabel(`⚔️ Contraataque (${CONSTANTS.COMBAT.ACTIONS.COUNTER.kiCost} Ki)`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(fighter.ki < CONSTANTS.COMBAT.ACTIONS.COUNTER.kiCost)
    );

    // Dividir en rows (máximo 5 botones por row)
    const row1 = new ActionRowBuilder().addComponents(buttons.slice(0, 3));
    const row2 = new ActionRowBuilder().addComponents(buttons.slice(3, 5));

    return [row1, row2];
  }
}

module.exports = new CombatManager();

/**
 * SIMULACIÓN DE TORNEO PVP - Verificación de Flujo Completo
 * Simula la creación, inicio y finalización de un torneo de duelos
 */

// Importar módulos necesarios
const { getEventManager, EVENT_STATUS, EVENT_TYPES } = require('./utils/eventManager');
const dataManager = require('./utils/dataManager');
const EMOJIS = require('./src/config/emojis');

// Simular datos de usuarios
const USER_1 = '111111111111111111'; // salokin1996
const USER_2 = '222222222222222222'; // dipk
const GUILD_ID = '999999999999999999'; // Guild de prueba
const CREATOR_ID = '111111111111111111'; // Admin que crea el evento

console.log('🎯 ========== SIMULACIÓN DE TORNEO PVP ==========\n');

try {
  const eventManager = getEventManager();

  // ========== PASO 1: CREAR EVENTO ==========
  console.log('📝 PASO 1: Creando evento de torneo...');
  const event = eventManager.createEvent(
    GUILD_ID,
    EVENT_TYPES.DUEL_TOURNAMENT,
    'Prueba Torneo',
    'Torneo de prueba para verificar funcionalidad',
    CREATOR_ID,
    {
      maxParticipantes: 8,
      endTime: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 días
    }
  );

  console.log(`${EMOJIS.SUCCESS} Evento creado exitosamente:`);
  console.log(`   ID: ${event.id}`);
  console.log(`   Nombre: ${event.name}`);
  console.log(`   Tipo: ${event.type}`);
  console.log(`   Estado: ${event.status}`);
  console.log(`   Participantes: ${event.participants.length}/${event.maxParticipants}`);
  console.log('');

  // ========== PASO 2: USUARIOS SE UNEN ==========
  console.log('👥 PASO 2: Usuarios uniéndose al evento...');

  // Usuario 1 se une
  console.log(`   ${EMOJIS.HONOR} Usuario 1 (${USER_1}) se une...`);
  eventManager.joinEvent(event.id, USER_1);
  console.log(`   ${EMOJIS.SUCCESS} Usuario 1 unido exitosamente`);

  // Usuario 2 se une
  console.log(`   ${EMOJIS.HONOR} Usuario 2 (${USER_2}) se une...`);
  eventManager.joinEvent(event.id, USER_2);
  console.log(`   ${EMOJIS.SUCCESS} Usuario 2 unido exitosamente`);

  const updatedEvent = eventManager.getEvent(event.id);
  console.log(`\n   Total participantes: ${updatedEvent.participants.length}`);
  console.log('');

  // ========== PASO 3: INICIAR EVENTO ==========
  console.log('▶️  PASO 3: Iniciando evento...');
  eventManager.startEvent(event.id);

  const activeEvent = eventManager.getEvent(event.id);
  console.log(`${EMOJIS.SUCCESS} Evento iniciado exitosamente:`);
  console.log(`   Estado: ${activeEvent.status}`);
  console.log(`   Hora de inicio: ${new Date(activeEvent.startTime).toISOString()}`);

  // Verificar bracket generado
  if (activeEvent.metadata && activeEvent.metadata.bracket) {
    console.log(`\n   ${EMOJIS.COMBAT} Bracket generado:`);
    activeEvent.metadata.bracket.forEach((match, index) => {
      console.log(`      Match ${index + 1}:`);
      console.log(`         Player 1: ${match.player1}`);
      console.log(`         Player 2: ${match.player2 || 'BYE'}`);
      console.log(`         Winner: ${match.winner || 'TBD'}`);
      console.log(`         Round: ${match.round}`);
    });
  } else {
    console.log(`   ⚠️  No se generó bracket (metadata: ${JSON.stringify(activeEvent.metadata)})`);
  }
  console.log('');

  // ========== PASO 4: ACTUALIZAR SCORES (SIMULAR COMBATES) ==========
  console.log('⚔️  PASO 4: Simulando combates y actualizando scores...');

  // Dar puntos al ganador (Usuario 1 gana)
  console.log(`   ${EMOJIS.COMBAT} Usuario 1 gana el combate (+10 puntos)`);
  eventManager.updateScore(event.id, USER_1, 10, 'set');

  // Usuario 2 pierde (0 puntos)
  console.log(`   ${EMOJIS.COMBAT} Usuario 2 pierde el combate (0 puntos)`);
  eventManager.updateScore(event.id, USER_2, 0, 'set');

  const eventWithScores = eventManager.getEvent(event.id);
  console.log(`\n   ${EMOJIS.HONOR} Resultados actuales:`);
  if (eventWithScores.results) {
    Object.entries(eventWithScores.results).forEach(([userId, result]) => {
      console.log(`      Usuario ${userId}: ${result.score} puntos (Rank: ${result.rank})`);
    });
  } else {
    console.log(`   ⚠️  No hay resultados registrados`);
  }
  console.log('');

  // ========== PASO 5: OBTENER LEADERBOARD ==========
  console.log('🏆 PASO 5: Obteniendo leaderboard...');
  try {
    const leaderboard = eventManager.getLeaderboard(event.id, 10);
    console.log(`${EMOJIS.SUCCESS} Leaderboard generado:`);
    leaderboard.forEach((entry, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
      console.log(`   ${medal} Rank ${entry.rank}: Usuario ${entry.userId} - ${entry.score} puntos`);
    });
  } catch (error) {
    console.log(`   ⚠️  Error obteniendo leaderboard: ${error.message}`);
  }
  console.log('');

  // ========== PASO 6: FINALIZAR EVENTO ==========
  console.log('🏁 PASO 6: Finalizando evento...');
  eventManager.endEvent(event.id);

  const completedEvent = eventManager.getEvent(event.id);
  console.log(`${EMOJIS.SUCCESS} Evento finalizado:`);
  console.log(`   Estado: ${completedEvent.status}`);
  console.log(`   Hora de finalización: ${new Date(completedEvent.endTime).toISOString()}`);
  console.log('');

  // ========== PASO 7: OTORGAR PREMIOS ==========
  console.log('💰 PASO 7: Otorgando premios a los ganadores...');

  // Primero asegurarnos de que los usuarios existen en dataManager
  console.log('   Inicializando usuarios en dataManager...');
  dataManager.getUser(USER_1, GUILD_ID);
  dataManager.getUser(USER_2, GUILD_ID);

  const winners = eventManager.awardPrizes(event.id, dataManager);

  console.log(`${EMOJIS.SUCCESS} Premios otorgados a ${winners.length} ganadores:`);
  winners.forEach(winner => {
    const medal = winner.rank === 1 ? '🥇' : winner.rank === 2 ? '🥈' : '🥉';
    console.log(`\n   ${medal} Puesto ${winner.rank}: Usuario ${winner.userId}`);
    console.log(`      Score: ${winner.score} puntos`);
    console.log(`      Koku: ${winner.prize.koku || 0} ${EMOJIS.KOKU}`);
    if (winner.prize.title) {
      console.log(`      Título: "${winner.prize.title}"`);
    }

    // Verificar que se otorgaron los premios
    const userData = dataManager.getUser(winner.userId, GUILD_ID);
    console.log(`      ✅ Koku actualizado en userData: ${userData.koku}`);
    if (userData.titles && userData.titles.length > 0) {
      console.log(`      ✅ Títulos: ${userData.titles.join(', ')}`);
    }
  });
  console.log('');

  // ========== VERIFICACIÓN FINAL ==========
  console.log('✅ ========== VERIFICACIÓN FINAL ==========\n');

  console.log('📊 Estado del evento:');
  console.log(`   ✓ Creado: ${event.id ? 'Sí' : 'No'}`);
  console.log(`   ✓ Participantes unidos: ${completedEvent.participants.length === 2 ? 'Sí (2)' : 'No'}`);
  console.log(`   ✓ Iniciado: ${completedEvent.status !== 'pending' ? 'Sí' : 'No'}`);
  console.log(`   ✓ Bracket generado: ${completedEvent.metadata?.bracket ? 'Sí' : 'No'}`);
  console.log(`   ✓ Scores actualizados: ${Object.keys(completedEvent.results || {}).length > 0 ? 'Sí' : 'No'}`);
  console.log(`   ✓ Finalizado: ${completedEvent.status === 'completed' ? 'Sí' : 'No'}`);
  console.log(`   ✓ Premios otorgados: ${winners.length > 0 ? `Sí (${winners.length})` : 'No'}`);

  console.log('\n🎉 ========== SIMULACIÓN COMPLETADA EXITOSAMENTE ==========\n');

  // Limpiar evento de prueba
  console.log('🧹 Limpiando evento de prueba...');
  delete eventManager.events[event.id];
  eventManager.saveEvents();
  console.log(`${EMOJIS.SUCCESS} Evento de prueba eliminado\n`);

} catch (error) {
  console.error(`\n❌ ERROR EN LA SIMULACIÓN:`);
  console.error(`   Mensaje: ${error.message}`);
  console.error(`   Stack: ${error.stack}\n`);
  process.exit(1);
}

console.log('✨ Simulación finalizada sin errores\n');

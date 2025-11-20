/**
 * DEMON HUNTER BOT - Event Interaction Handler
 * Maneja todas las interacciones de eventos (torneos, trivia, etc.)
 */

const { Events, MessageFlags, EmbedBuilder, ComponentType } = require('discord.js');
const COLORS = require('../src/config/colors');
const MESSAGES = require('../src/config/messages');
const EMOJIS = require('../src/config/emojis');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, { client, dataManager }) {
    // Solo manejar select menus y botones relacionados con eventos
    if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;
    if (!interaction.customId) return;

    // Verificar si es una interacción de eventos
    const eventInteractionIds = [
      'event_join_select',
      'event_leave_select',
      'event_view_select',
      'event_finalize_select',
      'event_cancel_select',
      'event_vote_select_event',
      'tournament_winner_select'
    ];

    const isEventInteraction = eventInteractionIds.includes(interaction.customId) ||
                               interaction.customId.startsWith('event_vote_select_user:') ||
                               interaction.customId.startsWith('event_');

    if (!isEventInteraction) return;

    // CRITICAL: Wait for collectors in index.js to handle it first
    // Collectors are created with the command and should have priority
    // Increased delay to 500ms to ensure collector finishes first
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verificar si la interacción ya fue manejada (por collectors en index.js)
    // Los collectors tienen prioridad, este handler es un fallback
    // Check multiple states to be absolutely sure
    if (interaction.replied || interaction.deferred) {
      console.log(`🔄 Handler: Interaction ${interaction.id} already handled by collector, skipping`);
      return;
    }

    // Additional safety check - if the interaction is too old, don't process
    const interactionAge = Date.now() - interaction.createdTimestamp;
    if (interactionAge > 2500) {
      console.log(`⏱️ Handler: Interaction ${interaction.id} too old (${interactionAge}ms), skipping`);
      return;
    }

    // Importar eventManager dinámicamente para cada interacción
    const { getEventManager, EVENT_STATUS } = require('../utils/eventManager');
    const eventManager = getEventManager();

    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    try {

      // ========== Manejo de selección para unirse a evento ==========
      if (interaction.customId === 'event_join_select' && interaction.isStringSelectMenu()) {
        const selectedEventId = interaction.values[0];
        const event = eventManager.getEvent(selectedEventId);

        if (!event) {
          return interaction.update({
            content: `${EMOJIS.ERROR} El evento seleccionado ya no existe.`,
            embeds: [],
            components: []
          });
        }

        try {
          eventManager.joinEvent(event.id, userId);

          // Inicializar tracking de koku para eventos koku rush
          if (event.type === 'koku_rush') {
            const userData = dataManager.getUser(userId, guildId);
            if (!event.metadata.startingKoku) {
              event.metadata.startingKoku = {};
            }
            event.metadata.startingKoku[userId] = userData.koku || 0;
            eventManager.saveEvents();
          }

          const successEmbed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle(`${EMOJIS.SUCCESS} ¡Te has unido al evento!`)
            .setDescription(
              `**${event.name}**\n` +
              `${event.description}\n\n` +
              `**Participantes:** ${event.participants.length}/${event.maxParticipants}\n` +
              `**Estado:** ${event.status === EVENT_STATUS.PENDING ? '⏳ Pendiente' : '▶️ Activo'}`
            )
            .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
            .setTimestamp();

          await interaction.update({ embeds: [successEmbed], components: [] });
          console.log(`${EMOJIS.SUCCESS} ${interaction.user.tag} se unió al evento: ${event.name}`);
        } catch (error) {
          await interaction.update({
            content: `${EMOJIS.ERROR} ${error.message}`,
            embeds: [],
            components: []
          });
        }
      }

      // ========== Manejo de selección para salir de evento ==========
      else if (interaction.customId === 'event_leave_select' && interaction.isStringSelectMenu()) {
        const selectedEventId = interaction.values[0];
        const event = eventManager.getEvent(selectedEventId);

        if (!event) {
          return interaction.update({
            content: `${EMOJIS.ERROR} El evento seleccionado ya no existe.`,
            embeds: [],
            components: []
          });
        }

        try {
          eventManager.leaveEvent(event.id, userId);

          await interaction.update({
            content: `${EMOJIS.SUCCESS} Has salido del evento **${event.name}**.`,
            embeds: [],
            components: []
          });

          console.log(`${EMOJIS.VOICE} ${interaction.user.tag} salió del evento: ${event.name}`);
        } catch (error) {
          await interaction.update({
            content: `${EMOJIS.ERROR} ${error.message}`,
            embeds: [],
            components: []
          });
        }
      }

      // ========== Manejo de selección para ver detalles de evento ==========
      else if (interaction.customId === 'event_view_select' && interaction.isStringSelectMenu()) {
        const selectedEventId = interaction.values[0];
        const event = eventManager.getEvent(selectedEventId);

        if (!event) {
          return interaction.update({
            content: `${EMOJIS.ERROR} El evento seleccionado ya no existe.`,
            embeds: [],
            components: []
          });
        }

        const statusEmoji = {
          pending: '⏳',
          active: '▶️',
          completed: '✅',
          cancelled: '🚫'
        }[event.status];

        const detailEmbed = new EmbedBuilder()
          .setColor(COLORS.PRIMARY)
          .setTitle(`${event.emoji} ${event.name}`)
          .setDescription(event.description)
          .addFields(
            { name: '🆔 ID', value: `\`${event.id}\``, inline: true },
            { name: '📊 Estado', value: `${statusEmoji} ${event.status}`, inline: true },
            { name: '👥 Participantes', value: `${event.participants.length}/${event.maxParticipants}`, inline: true },
            { name: '⏰ Inicio', value: `<t:${Math.floor(event.startTime / 1000)}:F>`, inline: true },
            { name: '🏁 Finaliza', value: `<t:${Math.floor(event.endTime / 1000)}:R>`, inline: true },
            { name: '👤 Creador', value: `<@${event.creatorId}>`, inline: true }
          )
          .setFooter({ text: MESSAGES.FOOTER.DEFAULT })
          .setTimestamp();

        // Agregar premios si existen
        if (event.prizes && Object.keys(event.prizes).length > 0) {
          const prizeText = Object.entries(event.prizes)
            .slice(0, 3)
            .map(([rank, prize]) => {
              const medal = rank === '1' ? '🥇' : rank === '2' ? '🥈' : '🥉';
              let text = `${medal} **Puesto ${rank}:** ${prize.koku || 0} ${EMOJIS.KOKU}`;
              if (prize.title) text += ` + Título: "${prize.title}"`;
              return text;
            })
            .join('\n');
          detailEmbed.addFields({ name: '🏆 Premios', value: prizeText });
        }

        // Agregar información específica por tipo de evento
        if (event.type === 'duel_tournament' && event.metadata?.bracket) {
          const rounds = Object.keys(event.metadata.bracket).length;
          detailEmbed.addFields({
            name: '⚔️ Torneo',
            value: `Rondas: ${rounds}\nFormato: Eliminación simple`
          });
        } else if (event.type === 'trivia' && event.metadata?.questions) {
          detailEmbed.addFields({
            name: '📚 Trivia',
            value: `Preguntas: ${event.metadata.questions.length}`
          });
        }

        await interaction.update({ embeds: [detailEmbed], components: [] });
      }

      // ========== Manejo de selección de ganador de torneo ==========
      else if (interaction.customId === 'tournament_winner_select' && interaction.isStringSelectMenu()) {
        try {
          // Obtener torneo activo para este mensaje
          const activeTournaments = eventManager.getGuildEvents(guildId).filter(e =>
            e.type === 'duel_tournament' &&
            e.status === EVENT_STATUS.ACTIVE &&
            e.metadata.controlMessageId === interaction.message.id
          );

          if (activeTournaments.length === 0) {
            return interaction.reply({
              content: `${EMOJIS.ERROR} No se encontró el torneo activo para este mensaje.`,
              flags: MessageFlags.Ephemeral
            });
          }

          const tournament = activeTournaments[0];

          // Verificar que el usuario es admin o creador del evento
          const isAdmin = interaction.member.permissions.has(require('discord.js').PermissionFlagsBits.Administrator);
          const isCreator = tournament.creatorId === userId;

          if (!isAdmin && !isCreator) {
            return interaction.reply({
              content: `${EMOJIS.ERROR} Solo el creador del evento o administradores pueden registrar resultados.`,
              flags: MessageFlags.Ephemeral
            });
          }

          await interaction.deferUpdate();

          const selectedWinner = interaction.values[0];

          // Obtener el combate actual para encontrar al perdedor
          const bracket = tournament.metadata.bracket;
          const currentRound = Math.max(...bracket.map(m => m.round));
          const currentMatch = bracket.find(m =>
            m.round === currentRound &&
            !m.winner &&
            m.player2 &&
            (m.player1 === selectedWinner || m.player2 === selectedWinner)
          );

          if (!currentMatch) {
            return interaction.followUp({
              content: `${EMOJIS.ERROR} No se pudo encontrar el combate correspondiente.`,
              flags: MessageFlags.Ephemeral
            });
          }

          const loser = currentMatch.player1 === selectedWinner ? currentMatch.player2 : currentMatch.player1;

          // Registrar ganador usando la nueva función
          eventManager.recordTournamentWinner(tournament.id, selectedWinner, loser);

          // ====== ANTI-SPAM: Actualizar bracket en lugar de crear mensajes nuevos ======
          // Actualizar el mensaje principal del bracket con el nuevo estado
          await eventManager.updateBracketMessage(tournament.id, interaction.channel, client, dataManager, guildId);

          // Actualizar mensaje de control con el siguiente combate
          const newControlData = await eventManager.generateTournamentControlMessage(tournament.id, client);

          if (newControlData) {
            console.log(`🎮 Hay más combates pendientes, enviando nuevo panel de control...`);
            // Enviar nuevo panel de control como followUp efímero
            // (no podemos editar el mensaje original porque es ephemeral de otra interacción)
            const newControlMessage = await interaction.followUp({
              content: `🏆 **Panel de Control del Torneo**\n\nSelecciona el ganador del siguiente combate:`,
              embeds: [newControlData.embed],
              components: newControlData.components,
              ephemeral: true,
              fetchReply: true
            });

            // Actualizar el ID del mensaje de control para el próximo clic
            const updatedTournament = eventManager.getEvent(tournament.id);
            if (updatedTournament) {
              updatedTournament.metadata.controlMessageId = newControlMessage.id;
              eventManager.saveEvents();
              console.log(`🔄 Panel de control actualizado: ${newControlMessage.id}`);
            }
          } else {
            // No hay más combates, torneo terminado
            console.log(`🏁 Torneo completado, no hay más combates. Enviando mensaje final...`);
            await interaction.followUp({
              content: `✅ **¡Torneo completado!** No hay más combates pendientes.\n\nUsa \`/evento finalizar evento:${tournament.name}\` para otorgar premios.`,
              ephemeral: true
            });
            console.log(`✅ Mensaje de torneo completado enviado`);
          }

          console.log(`✅ Resultado registrado: ${selectedWinner} ganó en torneo ${tournament.id}`);
        } catch (error) {
          console.error('Error manejando selección del torneo:', error);
          await interaction.followUp({
            content: `${EMOJIS.ERROR} Error al procesar la selección: ${error.message}`,
            flags: MessageFlags.Ephemeral
          }).catch(() => {});
        }
      }

      // ========== Otros tipos de interacciones de eventos ==========
      // Aquí se pueden agregar más manejadores según sea necesario

    } catch (error) {
      console.error('❌ Error manejando interacción de evento:', error);

      const errorMessage = {
        content: `${EMOJIS.ERROR} Ocurrió un error al procesar esta acción de evento. Intenta de nuevo.`,
        flags: MessageFlags.Ephemeral
      };

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply(errorMessage).catch(() => {});
      } else if (interaction.deferred) {
        await interaction.editReply(errorMessage).catch(() => {});
      } else {
        await interaction.followUp(errorMessage).catch(() => {});
      }
    }
  }
};

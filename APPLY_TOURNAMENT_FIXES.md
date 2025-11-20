# 🎯 Aplicar Fixes de Torneo - Código Exacto

## ✅ Funciones Agregadas a eventManager.js

Ya agregué estas funciones al repositorio:
- ✅ `generateMatchVSEmbed()` - Avatares en esquinas
- ✅ `generateTournamentControlMessage()` - Panel de control
- ✅ `recordTournamentWinner()` - Registrar ganadores
- ✅ `getDisplayName()` - Obtener nicks del servidor
- ✅ `generateBracketEmbed()` - Bracket mejorado

---

## 🔧 CAMBIOS EN TU CÓDIGO LOCAL (index.js)

### Cambio 1: Handler `tournament_winner_select` (Línea ~1469)

Busca tu código actual y reemplázalo completamente:

**ANTES (TU CÓDIGO ACTUAL):**
```javascript
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isStringSelectMenu() && interaction.customId === 'tournament_winner_select') {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    try {
      // Obtener torneo activo
      const activeTournaments = eventManager.getGuildEvents(guildId).filter(e =>
        e.type === 'duel_tournament' &&
        e.status === 'active' &&
        e.metadata.controlMessageId === interaction.message.id
      );

      // ... resto del código ...
    }
  }
});
```

**DESPUÉS (CÓDIGO MEJORADO):**
```javascript
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isStringSelectMenu() && interaction.customId === 'tournament_winner_select') {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    try {
      // ✅ Importar eventManager
      const { getEventManager } = require('./utils/eventManager');
      const eventManager = getEventManager();

      // Obtener torneo activo
      const activeTournaments = eventManager.getGuildEvents(guildId).filter(e =>
        e.type === 'duel_tournament' &&
        e.status === 'active' &&
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
      const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
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

      // ✅ Usar la nueva función para registrar ganador
      eventManager.recordTournamentWinner(tournament.id, selectedWinner, loser);

      // ✅ MEJORA 2 y 4: Actualizar mensaje existente con displayNames
      const winnerName = await eventManager.getDisplayName(interaction.client, guildId, selectedWinner);
      const loserName = await eventManager.getDisplayName(interaction.client, guildId, loser);

      const resultEmbed = new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle('🏆 Último Resultado del Torneo')
        .setDescription(
          `**${winnerName}** ha derrotado a **${loserName}**\n\n` +
          `✅ ${winnerName} avanza a la siguiente ronda!`
        )
        .setFooter({ text: `Torneo: ${tournament.name}` })
        .setTimestamp();

      // Buscar y actualizar mensaje de anuncio
      let announcementMessage;
      if (tournament.metadata.announcementMessageId) {
        try {
          announcementMessage = await interaction.channel.messages.fetch(tournament.metadata.announcementMessageId);
          await announcementMessage.edit({ embeds: [resultEmbed] });
        } catch (error) {
          // Si no se encuentra, crear nuevo
          announcementMessage = await interaction.channel.send({ embeds: [resultEmbed] });
          tournament.metadata.announcementMessageId = announcementMessage.id;
          eventManager.saveEvents();
        }
      } else {
        // Crear nuevo mensaje de anuncio
        announcementMessage = await interaction.channel.send({ embeds: [resultEmbed] });
        tournament.metadata.announcementMessageId = announcementMessage.id;
        eventManager.saveEvents();
      }

      // Verificar si se avanzó a nueva ronda
      const updatedTournament = eventManager.getEvent(tournament.id);
      const updatedBracket = updatedTournament.metadata.bracket;
      const updatedCurrentRound = Math.max(...updatedBracket.map(m => m.round));

      // Si la ronda cambió, anunciar nueva ronda
      if (updatedCurrentRound > currentRound) {
        const newRoundMatches = updatedBracket.filter(m => m.round === updatedCurrentRound && !m.winner && m.player2);

        if (newRoundMatches.length > 0) {
          await interaction.channel.send({
            content: `\n🎊 **¡NUEVA RONDA INICIADA!** 🎊\n**Ronda ${updatedCurrentRound}** del torneo **${updatedTournament.name}**\n\n**Combates de esta ronda:**`
          });

          // ✅ MEJORA 1 y 4: Usar generateMatchVSEmbed con avatares en esquinas
          for (const match of newRoundMatches) {
            const p1Data = dataManager.getUser(match.player1, guildId);
            const p2Data = dataManager.getUser(match.player2, guildId);
            const matchEmbed = await eventManager.generateMatchVSEmbed(match, p1Data, p2Data, interaction.client);

            await interaction.channel.send({ embeds: [matchEmbed] });
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // ✅ Actualizar mensaje de control con el siguiente combate
      const newControlData = await eventManager.generateTournamentControlMessage(tournament.id, interaction.client);

      if (newControlData) {
        await interaction.message.edit({
          embeds: [newControlData.embed],
          components: newControlData.components
        });
      }

      console.log(`✅ Resultado registrado: ${selectedWinner} ganó en torneo ${tournament.id}`);
    } catch (error) {
      console.error('Error manejando selección del torneo:', error);
      await interaction.followUp({
        content: `${EMOJIS.ERROR} Error al procesar la selección: ${error.message}`,
        flags: MessageFlags.Ephemeral
      }).catch(() => {});
    }

    return;
  }
});
```

---

### Cambio 2: Enviar Mensaje de Control (Línea ~6850)

Busca donde envías el mensaje de control del torneo:

**ANTES:**
```javascript
// Crear mensaje de control
const controlData = eventManager.generateTournamentControlMessage(event.id, interaction.client);

const controlMessage = await interaction.channel.send({
  content: '🏆 **Bracket del Torneo:**',
  embeds: [controlData.embed],
  components: controlData.components
});

// Guardar ID del mensaje de control
event.metadata.controlMessageId = controlMessage.id;
eventManager.saveEvents();
```

**DESPUÉS (MENSAJE EFÍMERO SOLO PARA CREADOR):**
```javascript
// ✅ MEJORA 3: Mensaje de control solo para el creador
const controlData = await eventManager.generateTournamentControlMessage(event.id, interaction.client);

const controlMessage = await interaction.followUp({
  content: `🏆 **Panel de Control del Torneo** (solo tú puedes ver esto)\n\nSelecciona el ganador de cada combate:`,
  embeds: [controlData.embed],
  components: controlData.components,
  ephemeral: true,  // ← Solo visible para quien inició el torneo
  fetchReply: true
});

// Guardar ID del mensaje de control
event.metadata.controlMessageId = controlMessage.id;
eventManager.saveEvents();

console.log(`✅ Mensaje de control creado: ${controlMessage.id} para torneo ${event.id}`);
```

---

### Cambio 3: Anunciar Combates Iniciales (Línea ~6820)

Busca donde anuncias los combates de la primera ronda:

**ANTES:**
```javascript
// Anunciar cada combate
for (const match of firstRoundMatches) {
  const p1Data = dataManager.getUser(match.player1, guildId);
  const p2Data = dataManager.getUser(match.player2, guildId);
  const matchEmbed = eventManager.generateMatchVSEmbed(match, p1Data, p2Data, interaction.client);

  await interaction.channel.send({ embeds: [matchEmbed] });
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

**DESPUÉS (CON AWAIT):**
```javascript
// ✅ MEJORA 1 y 4: Anunciar cada combate con avatares en esquinas
for (const match of firstRoundMatches) {
  const p1Data = dataManager.getUser(match.player1, guildId);
  const p2Data = dataManager.getUser(match.player2, guildId);

  // ✅ Agregar await para que sea asíncrono
  const matchEmbed = await eventManager.generateMatchVSEmbed(match, p1Data, p2Data, interaction.client);

  const matchMessage = await interaction.channel.send({ embeds: [matchEmbed] });

  // Guardar ID del primer mensaje como announcementMessageId
  if (!event.metadata.announcementMessageId) {
    event.metadata.announcementMessageId = matchMessage.id;
    eventManager.saveEvents();
  }

  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

---

## 📋 Resumen de Cambios

### En `index.js` debes:

1. **Línea ~1469** (Handler `tournament_winner_select`):
   - ✅ Agregar import de `eventManager`
   - ✅ Usar `recordTournamentWinner()`
   - ✅ Usar `getDisplayName()` para nombres
   - ✅ Actualizar mensaje existente en lugar de crear nuevo
   - ✅ Usar `generateMatchVSEmbed()` con `await`

2. **Línea ~6850** (Enviar mensaje de control):
   - ✅ Cambiar a `interaction.followUp()`
   - ✅ Agregar `ephemeral: true`
   - ✅ Agregar `await` a `generateTournamentControlMessage()`

3. **Línea ~6820** (Anunciar combates):
   - ✅ Agregar `await` a `generateMatchVSEmbed()`
   - ✅ Guardar `announcementMessageId`

---

## 🧪 Cómo Probar

```bash
# 1. Hacer pull de los cambios
cd C:\Users\nico-\discord-bot
git pull origin claude/fix-event-startup-0119FnzAyPrc3bw7WTzT5T3G

# 2. Aplicar los cambios arriba a tu index.js local

# 3. Verificar sintaxis
node -c index.js

# 4. Reiniciar bot
npm start

# 5. En Discord - Prueba completa:
/evento crear tipo:duel_tournament nombre:"Test Mejorado" descripcion:"Con todas las mejoras"

# Únete con 2+ usuarios (asegúrate de tener nicks diferentes)

/evento iniciar evento:"Test Mejorado"

# 6. Verificar:
# ✅ Avatares en las esquinas del embed VS (izquierda y derecha)
# ✅ Panel de control solo visible para ti (ephemeral)
# ✅ Nicks del servidor en lugar de usernames
# ✅ Al seleccionar ganador, mensaje se actualiza (no crea nuevo)
```

---

## ✅ Checklist Final

- [ ] Pull de cambios del repositorio
- [ ] Código de `eventManager.js` actualizado automáticamente
- [ ] Modificar handler `tournament_winner_select` en index.js
- [ ] Modificar envío de mensaje de control en index.js
- [ ] Agregar `await` a `generateMatchVSEmbed()`
- [ ] Verificar sintaxis: `node -c index.js`
- [ ] Reiniciar bot: `npm start`
- [ ] Probar crear torneo con 3+ usuarios
- [ ] Verificar avatares en esquinas
- [ ] Verificar panel solo visible para creador
- [ ] Verificar nicks en lugar de usernames
- [ ] Verificar mensajes se actualizan

---

**Última Actualización:** 2025-01-20
**Estado:** Funciones agregadas al repositorio, código de ejemplo listo para copiar

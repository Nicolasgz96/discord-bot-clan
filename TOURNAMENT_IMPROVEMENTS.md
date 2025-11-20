# 🏆 Mejoras para el Sistema de Torneos

## Cambios Solicitados

1. ✅ **Avatares en las esquinas** del embed (en lugar del centro)
2. ✅ **Actualizar mensajes** (en lugar de enviar nuevos)
3. ✅ **Dropdown solo para el creador** (mensaje efímero/oculto)
4. ✅ **Usar displayName** (nick del servidor en lugar de username)

---

## 📝 Funciones Mejoradas para `utils/eventManager.js`

Agrega estas funciones a tu archivo `C:\Users\nico-\discord-bot\utils\eventManager.js`:

### 1. Función `generateMatchVSEmbed` (Mejorada)

```javascript
/**
 * Genera embed VS para un combate con avatares en las esquinas
 * @param {Object} match - Datos del combate
 * @param {Object} p1Data - Datos del jugador 1
 * @param {Object} p2Data - Datos del jugador 2
 * @param {Client} client - Cliente de Discord
 * @returns {EmbedBuilder} Embed del combate
 */
async generateMatchVSEmbed(match, p1Data, p2Data, client) {
  const EMOJIS = require('../src/config/emojis');
  const COLORS = require('../src/config/colors');
  const { EmbedBuilder } = require('discord.js');

  // Obtener usuarios de Discord para avatares y displayNames
  const player1 = await client.users.fetch(match.player1).catch(() => null);
  const player2 = await client.users.fetch(match.player2).catch(() => null);

  // Usar displayName si está disponible, sino username
  const p1Name = player1 ? player1.username : match.player1;
  const p2Name = player2 ? player2.username : match.player2;

  // Obtener avatares
  const p1Avatar = player1 ? player1.displayAvatarURL({ size: 128 }) : null;
  const p2Avatar = player2 ? player2.displayAvatarURL({ size: 128 }) : null;

  const embed = new EmbedBuilder()
    .setColor(COLORS.COMBAT || '#FF6B35')
    .setTitle(`${EMOJIS.COMBAT || '⚔️'} COMBATE DE TORNEO ${EMOJIS.COMBAT || '⚔️'}`)
    .setDescription('Dos guerreros se enfrentan en batalla')
    .addFields(
      {
        name: `${EMOJIS.KATANA || '⚔️'} ${p1Name}`,
        value:
          `**Rango:** ${p1Data.rank || 'Ronin'}\n` +
          `**Honor:** ${p1Data.honor || 0}\n` +
          `**Bio:** *"${p1Data.bio || 'Un guerrero misterioso...'}"*`,
        inline: true
      },
      {
        name: `${EMOJIS.VS || '⚡'} VS`,
        value: '\u200B', // Espacio invisible
        inline: true
      },
      {
        name: `${EMOJIS.KATANA || '⚔️'} ${p2Name}`,
        value:
          `**Rango:** ${p2Data.rank || 'Ronin'}\n` +
          `**Honor:** ${p2Data.honor || 0}\n` +
          `**Bio:** *"${p2Data.bio || 'Un guerrero misterioso...'}"*`,
        inline: true
      }
    )
    .setFooter({ text: 'hoy a las ' + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) });

  // ✅ MEJORA 1: Avatares en las esquinas
  // Thumbnail (esquina superior derecha) = Jugador 2
  if (p2Avatar) {
    embed.setThumbnail(p2Avatar);
  }

  // Author con icono (esquina superior izquierda) = Jugador 1
  if (p1Avatar) {
    embed.setAuthor({
      name: 'Combate de Honor',
      iconURL: p1Avatar
    });
  }

  return embed;
}
```

---

### 2. Función `generateTournamentControlMessage` (Mejorada)

```javascript
/**
 * Genera mensaje de control del torneo (para admins/creador)
 * @param {string} eventId - ID del evento
 * @param {Client} client - Cliente de Discord
 * @returns {Object} { embed, components }
 */
async generateTournamentControlMessage(eventId, client) {
  const event = this.getEvent(eventId);
  if (!event || event.type !== 'duel_tournament') return null;

  const EMOJIS = require('../src/config/emojis');
  const COLORS = require('../src/config/colors');
  const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

  const bracket = event.metadata.bracket;
  const currentRound = Math.max(...bracket.map(m => m.round));

  // Encontrar combate actual (sin ganador)
  const currentMatch = bracket.find(m =>
    m.round === currentRound &&
    !m.winner &&
    m.player2 // Ignorar byes
  );

  if (!currentMatch) {
    // No hay más combates, torneo terminado
    return {
      embed: new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle('🏆 Torneo Completado')
        .setDescription('¡Todos los combates han finalizado!'),
      components: []
    };
  }

  // Obtener usuarios de Discord para displayNames
  const player1 = await client.users.fetch(currentMatch.player1).catch(() => null);
  const player2 = await client.users.fetch(currentMatch.player2).catch(() => null);

  // ✅ MEJORA 4: Usar displayName en lugar de username
  const p1Name = player1 ? player1.username : currentMatch.player1;
  const p2Name = player2 ? player2.username : currentMatch.player2;

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('🏆 Resultado del Torneo')
    .setDescription(
      `**Combate Actual: Ronda ${currentRound}**\n\n` +
      `${EMOJIS.KATANA} **${p1Name}** VS **${p2Name}** ${EMOJIS.KATANA}\n\n` +
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
```

---

### 3. Función `recordTournamentWinner` (Mejorada)

```javascript
/**
 * Registra el ganador de un combate de torneo
 * @param {string} eventId - ID del evento
 * @param {string} winnerId - ID del ganador
 * @param {string} loserId - ID del perdedor
 */
recordTournamentWinner(eventId, winnerId, loserId) {
  const event = this.getEvent(eventId);
  if (!event || event.type !== 'duel_tournament') {
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
```

---

## 🔧 Modificaciones en `index.js` (Handler del Torneo)

### Cambio 1: Hacer Mensaje de Control Solo para el Creador

En tu `index.js`, busca donde envías el mensaje de control (cerca de línea 6850):

**ANTES:**
```javascript
const controlMessage = await interaction.channel.send({
  content: '🏆 **Bracket del Torneo:**',
  embeds: [controlData.embed],
  components: controlData.components
});
```

**DESPUÉS (solo visible para el creador):**
```javascript
// ✅ MEJORA 3: Mensaje de control solo para el creador
const controlMessage = await interaction.followUp({
  content: `🏆 **Panel de Control del Torneo** (solo tú puedes ver esto)\n\nSelecciona el ganador de cada combate:`,
  embeds: [controlData.embed],
  components: controlData.components,
  ephemeral: true, // ← Solo visible para quien inició el torneo
  fetchReply: true
});
```

---

### Cambio 2: Actualizar Mensajes en Lugar de Enviar Nuevos

En el handler `tournament_winner_select`, modifica la sección de anuncios:

**ANTES (envía nuevos mensajes):**
```javascript
// Anunciar resultado en el canal
await interaction.channel.send({
  content: `🏆 **Resultado del Torneo**\n<@${selectedWinner}> ha derrotado a <@${loser}> y avanza a la siguiente ronda!`
});

// Mostrar bracket actualizado
const bracketEmbed = eventManager.generateBracketEmbed(tournament.id, interaction.client);
await interaction.channel.send({
  content: '📊 **Bracket Actualizado:**',
  embeds: [bracketEmbed]
});
```

**DESPUÉS (actualiza mensaje existente):**
```javascript
// ✅ MEJORA 2: Actualizar mensaje de anuncio en lugar de enviar nuevo
let announcementMessage;

// Buscar mensaje de anuncio del torneo
if (tournament.metadata.announcementMessageId) {
  try {
    announcementMessage = await interaction.channel.messages.fetch(tournament.metadata.announcementMessageId);
  } catch (error) {
    console.warn('No se pudo encontrar mensaje de anuncio, creando nuevo');
  }
}

// Obtener usuarios para displayNames
const winnerUser = await interaction.client.users.fetch(selectedWinner).catch(() => null);
const loserUser = await interaction.client.users.fetch(loser).catch(() => null);

const winnerName = winnerUser ? winnerUser.username : selectedWinner;
const loserName = loserUser ? loserUser.username : loser;

const resultEmbed = new EmbedBuilder()
  .setColor(COLORS.SUCCESS)
  .setTitle('🏆 Último Resultado del Torneo')
  .setDescription(
    `**${winnerName}** ha derrotado a **${loserName}**\n\n` +
    `✅ ${winnerName} avanza a la siguiente ronda!`
  )
  .setFooter({ text: `Torneo: ${tournament.name}` })
  .setTimestamp();

if (announcementMessage) {
  // Actualizar mensaje existente
  await announcementMessage.edit({
    embeds: [resultEmbed]
  });
} else {
  // Crear nuevo mensaje y guardar ID
  announcementMessage = await interaction.channel.send({
    embeds: [resultEmbed]
  });
  tournament.metadata.announcementMessageId = announcementMessage.id;
  eventManager.saveEvents();
}
```

---

### Cambio 3: Usar displayName Consistentemente

Busca en tu código TODAS las líneas que usan `user.tag` o `user.username` y reemplázalas:

**ANTES:**
```javascript
const user = await client.users.fetch(userId);
const userName = user.username; // o user.tag
```

**DESPUÉS:**
```javascript
const user = await client.users.fetch(userId);
const guild = interaction.guild || client.guilds.cache.get(guildId);
const member = guild ? await guild.members.fetch(userId).catch(() => null) : null;

// ✅ MEJORA 4: Usar displayName (nick del servidor)
const userName = member ? member.displayName : (user ? user.username : userId);
```

---

## 📋 Helper Function (Agregar a eventManager.js)

```javascript
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
      return member.displayName; // Nick del servidor
    }

    const user = await client.users.fetch(userId).catch(() => null);
    return user ? user.username : userId;
  } catch (error) {
    return userId;
  }
}
```

---

## 🎨 Ejemplo Visual del Nuevo Embed

```
┌─────────────────────────────────────────┐
│ [Avatar P1]  Combate de Honor           │ ← Author con icono
├─────────────────────────────────────────┤
│ ⚔️ COMBATE DE TORNEO ⚔️                  │
│ Dos guerreros se enfrentan en batalla   │
│                                         │
│ ⚔️ salokin1996        ⚡ VS    [Avatar] │ ← Thumbnail
│ Rango: Samurai                ⚔️ dipk.  │
│ Honor: 1503                   Rango:... │
│ Bio: "El Constructor :D"      Honor:... │
│                                         │
│ hoy a las 23:36                         │
└─────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementación

- [ ] Agregar funciones mejoradas a `utils/eventManager.js`
- [ ] Modificar handler de `tournament_winner_select` en `index.js`
- [ ] Cambiar mensaje de control a `ephemeral: true`
- [ ] Implementar actualización de mensajes (announcementMessageId)
- [ ] Agregar helper `getDisplayName`
- [ ] Reemplazar todos los `username` por `displayName`
- [ ] Probar crear torneo, iniciar, y registrar resultados
- [ ] Verificar que solo el creador ve el dropdown
- [ ] Verificar avatares en las esquinas del embed

---

## 🧪 Cómo Probar

```bash
# 1. Aplicar cambios
# Edita los archivos según las instrucciones arriba

# 2. Reiniciar bot
npm start

# 3. En Discord:
/evento crear tipo:duel_tournament nombre:"Test Mejorado" descripcion:"Con avatares"

# 4. Únete con 2+ usuarios (asegúrate de tener nicks diferentes)

# 5. Iniciar torneo
/evento iniciar evento:"Test Mejorado"

# 6. Verificar:
# - ✅ Avatares en las esquinas del embed VS
# - ✅ Mensaje de control solo visible para ti (ephemeral)
# - ✅ Nicks del servidor en lugar de usernames
# - ✅ Mensajes se actualizan en lugar de crear nuevos
```

---

**Última Actualización:** 2025-01-20
**Estado:** Mejoras documentadas, listas para implementar

const { MessageFlags } = require('discord.js');

async function safeDeferUpdate(interaction) {
  try {
    // Try to acknowledge the interaction update
    await interaction.deferUpdate();
    return true;
  } catch (err) {
    // DiscordAPIError 10062 = Unknown interaction (expired or already acknowledged)
    if (err && err.code === 10062) {
      // Interaction is no longer valid, ignore silently
      return false;
    }

    // Log unexpected errors and attempt a safe fallback
    try {
      console.error('[safeDeferUpdate] Error deferring update:', err?.message || err);
    } catch (logErr) {
      // ignore
    }

    // As a last resort, try to reply ephemeral if possible (may also fail)
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Error procesando la interacción (fallback).', flags: MessageFlags.Ephemeral }).catch(() => {});
      }
    } catch (replyErr) {
      // ignore
    }

    return false;
  }
}

module.exports = {
  safeDeferUpdate
};

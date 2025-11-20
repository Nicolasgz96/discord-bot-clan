/**
 * DEMON HUNTER BOT - ClientReady Event
 * Sistema de inicio y configuración del bot (data manager, purge scheduler)
 */

const { Events } = require('discord.js');
const EMOJIS = require('../src/config/emojis');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client, { config, dataManager }) {
    console.log(`\n${EMOJIS.DRAGON}${EMOJIS.KATANA}═══════════════════════════════════════${EMOJIS.KATANA}${EMOJIS.DRAGON}`);
    console.log(`${EMOJIS.CASTLE} DEMON HUNTER BOT - SISTEMA SAMURAI`);
    console.log(`${EMOJIS.TORII}═══════════════════════════════════════${EMOJIS.TORII}\n`);
    console.log(`${EMOJIS.SUCCESS} Bot en línea como ${client.user.tag}`);
    console.log(`${EMOJIS.CASTLE} Sirviendo ${client.guilds.cache.size} dojos (servidores)`);
    console.log(`${EMOJIS.SAKURA} Función de bienvenida: ${config.welcome.enabled ? 'Activada' : 'Desactivada'}`);
    if (config.autoRole && config.autoRole.enabled) {
      if (config.autoRole.roleId) {
        console.log(`${EMOJIS.RONIN} Asignación automática de rol: Activada (Rol ID: ${config.autoRole.roleId})`);
      } else {
        console.log(`${EMOJIS.WARNING} Asignación automática de rol: Activada pero sin rol configurado (configura roleId en config.json)`);
      }
    } else {
      console.log(`${EMOJIS.INFO} Asignación automática de rol: Desactivada`);
    }

    // Initialize data manager (JSON persistence)
    try {
      await dataManager.init();
      console.log(`${EMOJIS.SUCCESS} Sistema de persistencia de datos activado`);
    } catch (error) {
      console.error(`${EMOJIS.ERROR} Error inicializando sistema de datos:`, error);
      console.error(`${EMOJIS.WARNING} El bot continuará, pero los datos no se guardarán`);
    }

    // TASK: Auto-purge old messages in specific channels. Read settings from config.json
    const purgeConfig = (config && config.purge && typeof config.purge === 'object') ? config.purge : null;
    const purgeEnabled = purgeConfig ? Boolean(purgeConfig.enabled) : false;
    const CHANNEL_IDS = purgeConfig && Array.isArray(purgeConfig.channelIds) && purgeConfig.channelIds.length > 0
      ? purgeConfig.channelIds.map(String)
      : [];
    const MS_INTERVAL = (purgeConfig && Number.isFinite(Number(purgeConfig.intervalHours)) ? Number(purgeConfig.intervalHours) : 24) * 60 * 60 * 1000;
    const MS_CUTOFF = (purgeConfig && Number.isFinite(Number(purgeConfig.cutoffHours)) ? Number(purgeConfig.cutoffHours) : 24) * 60 * 60 * 1000;
    const MAX_DELETES_PER_RUN = (purgeConfig && Number.isFinite(Number(purgeConfig.maxDeletesPerRun)) ? Number(purgeConfig.maxDeletesPerRun) : 0);
    const RUN_HOUR = (purgeConfig && Number.isFinite(Number(purgeConfig.runHour)) ? Number(purgeConfig.runHour) : 9);
    const INCLUDE_ALL = purgeConfig && Boolean(purgeConfig.includeAll);
    const INCLUDE_PINNED = purgeConfig && Boolean(purgeConfig.includePinned);
    const RUN_ON_STARTUP = purgeConfig && Boolean(purgeConfig.runOnStartup);
    let isPurgeRunning = false;

    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    const cleanOldMessagesInChannel = async (channel) => {
      try {
        // Delete messages according to config: if INCLUDE_ALL is true, delete all messages
        // (optionally including pinned if INCLUDE_PINNED). Otherwise delete messages older than MS_CUTOFF.
        let totalDeletedThisRun = 0;
        while (true) {
          const fetched = await channel.messages.fetch({ limit: 100 }).catch(() => null);
          if (!fetched || fetched.size === 0) break;

          const now = Date.now();
          // Determine eligible messages
          const eligible = fetched.filter(m => {
            if (!INCLUDE_PINNED && m.pinned) return false;
            if (INCLUDE_ALL) return true;
            return (now - m.createdTimestamp) > MS_CUTOFF;
          });

          const totalFound = fetched.size;
          const totalToRemove = eligible.size;
          console.log(`🧹 [Purge] Fetched ${totalFound} messages; ${totalToRemove} eligible for deletion in ${channel.name || channel.id}`);

          if (totalToRemove === 0) {
            console.log(`🧹 [Purge] No eligible messages to delete in channel ${channel.id}, stopping.`);
            break;
          }

          // Prepare lists
          const toBulk = [];
          const toDeleteIndividually = [];
          for (const msg of eligible.values()) {
            const age = now - msg.createdTimestamp;
            if (age < (14 * 24 * 60 * 60 * 1000)) toBulk.push(msg.id);
            else toDeleteIndividually.push(msg.id);
          }

          // Respect max deletes per run (0 = unlimited)
          const remainingAllowed = MAX_DELETES_PER_RUN > 0 ? Math.max(0, MAX_DELETES_PER_RUN - totalDeletedThisRun) : Infinity;
          if (remainingAllowed === 0) {
            console.log(`🧹 [Purge] Reached maxDeletesPerRun (${MAX_DELETES_PER_RUN}), stopping for channel ${channel.id}.`);
            break;
          }

          // Attempt bulk deletion (up to remainingAllowed)
          const bulkSlice = toBulk.slice(0, remainingAllowed === Infinity ? toBulk.length : Math.min(toBulk.length, remainingAllowed));
          if (bulkSlice.length > 0) {
            try {
              const deleted = await channel.bulkDelete(bulkSlice, true).catch(() => null);
              const deletedCount = deleted ? deleted.size : 0;
              totalDeletedThisRun += deletedCount;
              console.log(`🧹 [Purge] Bulk deleted ${deletedCount} msgs in #${channel.name || channel.id}`);
            } catch (err) {
              console.error('Error bulk deleting messages:', err);
            }
          }

          // Recompute remaining allowed
          const remainingAfterBulk = MAX_DELETES_PER_RUN > 0 ? Math.max(0, MAX_DELETES_PER_RUN - totalDeletedThisRun) : Infinity;

          // Individually delete older messages or any remaining pinned (if bulk skipped them)
          if (toDeleteIndividually.length > 0 && remainingAfterBulk !== 0) {
            const individualToAttempt = toDeleteIndividually.slice(0, remainingAfterBulk === Infinity ? toDeleteIndividually.length : Math.min(toDeleteIndividually.length, remainingAfterBulk));
            for (const id of individualToAttempt) {
              try {
                const m = await channel.messages.fetch(id).catch(() => null);
                if (m) {
                  // If pinned and INCLUDE_PINNED is true, try to unpin first to ensure deletion
                  if (m.pinned && INCLUDE_PINNED) {
                    try { await m.unpin().catch(() => {}); } catch (e) {}
                  }
                  await m.delete().catch(() => {});
                  totalDeletedThisRun += 1;
                }
              } catch (err) {
                console.error('Error deleting individual message:', err);
              }
              if (MAX_DELETES_PER_RUN > 0 && totalDeletedThisRun >= MAX_DELETES_PER_RUN) break;
            }
            console.log(`🧹 [Purge] Individually deleted ${Math.min(individualToAttempt.length, totalDeletedThisRun)} msgs in #${channel.name || channel.id}`);
          }

          if (MAX_DELETES_PER_RUN > 0 && totalDeletedThisRun >= MAX_DELETES_PER_RUN) {
            console.log(`🧹 [Purge] Reached maxDeletesPerRun (${MAX_DELETES_PER_RUN}) for channel ${channel.id}, stopping.`);
            break;
          }

          await sleep(800);
        }
        console.log(`🧹 [Purge] Total deleted this run in ${channel.name || channel.id}: ${totalDeletedThisRun}`);
      } catch (err) {
        console.error(`Error cleaning channel ${channel.id}:`, err);
      }
    };

    const runPurgeTask = async () => {
      try {
        if (!purgeEnabled) {
          console.log('🧹 [Purge] Purge task is disabled in config.purge, skipping run.');
          return;
        }

        if (!Array.isArray(CHANNEL_IDS) || CHANNEL_IDS.length === 0) {
          console.log('🧹 [Purge] No channel IDs configured in config.purge.channelIds, skipping run.');
          return;
        }

        for (const chId of CHANNEL_IDS) {
          // Try to fetch channel from cache or API
          let channel = client.channels.cache.get(chId);
          if (!channel) {
            try {
              channel = await client.channels.fetch(chId).catch(() => null);
            } catch (e) {
              channel = null;
            }
          }

          if (!channel) {
            console.log(`⚠️ [Purge] Channel not found: ${chId}, skipping.`);
            continue;
          }

          // Only text-based channels can have messages
          if (!channel.isTextBased || !channel.isTextBased()) {
            console.log(`⚠️ [Purge] Channel ${chId} is not a text channel, skipping.`);
            continue;
          }

          // ensure we have permission to manage messages in that channel
          const mePerms = channel.permissionsFor(client.user);
          if (!mePerms || !mePerms.has('ManageMessages')) {
            console.log(`⚠️ [Purge] Missing ManageMessages permission in channel ${chId}, skipping.`);
            continue;
          }

          // Run cleaning for this channel (aggressively paging through messages)
          await cleanOldMessagesInChannel(channel);
        }
      } catch (err) {
        console.error('Error running purge task:', err);
      }
    };

    // Run once on startup if configured
    if (RUN_ON_STARTUP) {
      runPurgeTask().catch(err => console.error('Initial purge failed:', err));
    } else {
      console.log('🧹 [Purge] Initial purge skipped (config.purge.runOnStartup is false)');
    }

    // Schedule according to config.runHour (local server time). Calculate next occurrence of RUN_HOUR.
    const scheduleNextRunAtHour = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(RUN_HOUR, 0, 0, 0);
      if (next <= now) {
        // already passed today, schedule for tomorrow
        next.setDate(next.getDate() + 1);
      }
      const delay = next.getTime() - now.getTime();
      console.log(`🧹 [Purge] Next scheduled purge at local time: ${next.toString()}`);
      setTimeout(async () => {
        // run task if not already running
        if (isPurgeRunning) {
          console.log('🧹 [Purge] Previous purge still running; skipping this scheduled run.');
        } else {
          try {
            isPurgeRunning = true;
            await runPurgeTask();
          } catch (err) {
            console.error('Scheduled purge failed:', err);
          } finally {
            isPurgeRunning = false;
          }
        }

        // After first scheduled run, set interval to MS_INTERVAL
        setInterval(async () => {
          if (isPurgeRunning) {
            console.log('🧹 [Purge] Previous purge still running; skipping interval run.');
            return;
          }
          try {
            isPurgeRunning = true;
            await runPurgeTask();
          } catch (err) {
            console.error('Scheduled purge failed:', err);
          } finally {
            isPurgeRunning = false;
          }
        }, MS_INTERVAL);
      }, delay);
    };

    scheduleNextRunAtHour();

    // Expose purge control to other parts of the bot (so slash commands can trigger it)
    client.runPurgeTask = runPurgeTask;
    client.isPurgeRunningFlag = () => isPurgeRunning;
    client.setPurgeRunning = (v) => { isPurgeRunning = Boolean(v); };

    // Initialize invite cache for tracking invitations
    try {
      client.inviteCache = new Map();

      for (const guild of client.guilds.cache.values()) {
        try {
          const invites = await guild.invites.fetch();
          const inviteMap = new Map();

          for (const [code, invite] of invites) {
            inviteMap.set(code, { uses: invite.uses });
          }

          client.inviteCache.set(guild.id, inviteMap);
          console.log(`${EMOJIS.SUCCESS} Cache de invitaciones inicializado para ${guild.name} (${invites.size} invitaciones)`);
        } catch (error) {
          // Si no tenemos permisos, ignorar silenciosamente
          if (error.code !== 50013) {
            console.log(`${EMOJIS.WARNING} No se pudo cachear invitaciones para ${guild.name}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.error(`${EMOJIS.ERROR} Error inicializando cache de invitaciones:`, error.message);
    }

    console.log(`\n${EMOJIS.FLAG} Código Bushido activado. El dojo está listo.\n`);
  }
};

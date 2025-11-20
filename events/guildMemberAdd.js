/**
 * DEMON HUNTER BOT - GuildMemberAdd Event
 * Sistema de bienvenida y auto-asignación de roles
 */

const { Events, PermissionFlagsBits } = require('discord.js');
const { createWelcomeCard } = require('../utils/welcomeCard');
const { sendWithRetry } = require('../utils/helpers');
const EMOJIS = require('../src/config/emojis');
const MESSAGES = require('../src/config/messages');
const achievementManager = require('../utils/achievementManager');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member, { config, dataManager, client }) {
    // ========== ASIGNACIÓN AUTOMÁTICA DE ROL ==========
    if (config.autoRole && config.autoRole.enabled && config.autoRole.roleId) {
      try {
        const role = member.guild.roles.cache.get(config.autoRole.roleId);

        if (!role) {
          console.error(`❌ Rol automático no encontrado: ${config.autoRole.roleId} en ${member.guild.name}`);
          console.error(`💡 Verifica que el ID del rol sea correcto y que el bot pueda ver el rol`);
          return; // Salir temprano si no hay rol
        }

        const botMember = member.guild.members.me;

        // Verificar que el bot tiene permisos para asignar roles
        if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
          console.error(`❌ El bot no tiene el permiso "Administrar Roles" en ${member.guild.name}`);
          console.error(`💡 Solución: Ve a Configuración del Servidor → Roles → Rol del Bot → Activa "Administrar Roles"`);
          return;
        }

        // Verificar que el rol del bot esté por encima del rol a asignar
        if (botMember.roles.highest.position <= role.position) {
          console.error(`❌ El rol del bot (${botMember.roles.highest.name}) debe estar por encima del rol "${role.name}" para poder asignarlo`);
          console.error(`💡 Solución: Arrastra el rol del bot por encima del rol "${role.name}" en Configuración del Servidor → Roles`);
          return;
        }

        // Verificar que el rol no esté gestionado por una integración (como MEE6, Dyno, etc.)
        if (role.managed) {
          console.error(`❌ El rol "${role.name}" está gestionado por una integración y no puede ser asignado automáticamente`);
          console.error(`💡 Solución: Usa un rol que no esté gestionado por otro bot o integración`);
          return;
        }

        // Intentar asignar el rol
        await member.roles.add(role, 'Asignación automática de rol al unirse al servidor');
        console.log(`✓ Rol "${role.name}" asignado automáticamente a ${member.user.tag} en ${member.guild.name}`);

      } catch (error) {
        console.error(`❌ Error asignando rol automático a ${member.user.tag} en ${member.guild.name}:`, error.message);

        // Mensajes de error más específicos
        if (error.code === 50013) {
          console.error(`💡 El bot no tiene permisos suficientes. Verifica que tenga "Administrar Roles" y que su rol esté por encima del rol a asignar.`);
        } else if (error.code === 10011) {
          console.error(`💡 El rol no existe o el bot no puede verlo. Verifica el ID del rol en config.json`);
        } else {
          console.error(`💡 Error desconocido. Verifica los permisos del bot y la configuración del rol.`);
        }
      }
    }
    // ========== FIN ASIGNACIÓN AUTOMÁTICA DE ROL ==========

    // ========== TRACKING DE INVITACIONES ==========
    try {
      // Obtener todas las invitaciones del servidor
      const invites = await member.guild.invites.fetch();

      // Verificar si tenemos invitaciones cacheadas desde el ready event
      const cachedInvites = client.inviteCache?.get(member.guild.id) || new Map();

      let inviterId = null;

      // Comparar invitaciones para encontrar cuál se usó
      for (const [code, invite] of invites) {
        const cachedInvite = cachedInvites.get(code);

        // Si la invitación tiene más usos que antes, esta fue la usada
        if (cachedInvite && invite.uses > cachedInvite.uses) {
          inviterId = invite.inviter?.id;
          break;
        }
      }

      // Si encontramos quién invitó, incrementar su contador
      if (inviterId && dataManager) {
        const inviterData = dataManager.getUser(inviterId, member.guild.id);
        if (!inviterData.stats) inviterData.stats = {};
        inviterData.stats.invitesCount = (inviterData.stats.invitesCount || 0) + 1;
        dataManager.dataModified.users = true;

        console.log(`📣 ${inviterId} invitó a ${member.user.tag} (total invitaciones: ${inviterData.stats.invitesCount})`);

        // Verificar logros de invitación
        const newAchievements = achievementManager.checkAchievements(inviterId, member.guild.id, inviterData);

        // Notificar sobre nuevos logros desbloqueados
        if (newAchievements.length > 0 && config.achievementsChannel?.enabled) {
          const achievementsChannel = member.guild.channels.cache.get(config.achievementsChannel.channelId);
          if (achievementsChannel) {
            for (const achievement of newAchievements) {
              await sendWithRetry(achievementsChannel, {
                content: `🎉 <@${inviterId}> ha desbloqueado el logro **${achievement.emoji} ${achievement.name}**!\n` +
                        `*${achievement.description}*\n` +
                        `**Recompensa:** +${achievement.reward?.koku || 0} ${EMOJIS.KOKU}` +
                        (achievement.reward?.title ? ` + Título "${achievement.reward.title}"` : '')
              });

              // Assign achievement role/tag (appears in server profile)
              if (achievementManager.shouldCreateRoleTag(achievement)) {
                try {
                  await achievementManager.assignAchievementRole(member.guild, inviterId, achievement);
                } catch (e) {
                  console.error('Error asignando rol de logro:', e.message);
                }
              }
            }
          }
        }
      }

      // Actualizar cache de invitaciones
      if (!client.inviteCache) client.inviteCache = new Map();
      const newCache = new Map();
      for (const [code, invite] of invites) {
        newCache.set(code, { uses: invite.uses });
      }
      client.inviteCache.set(member.guild.id, newCache);

    } catch (error) {
      // Si no tenemos permisos para ver invitaciones, ignorar silenciosamente
      if (error.code !== 50013) {
        console.error(`⚠️ Error tracking invitaciones para ${member.user.tag}:`, error.message);
      }
    }
    // ========== FIN TRACKING DE INVITACIONES ==========

    // Verificar si la función de bienvenida está activada
    if (!config.welcome.enabled) return;

    try {
      // Obtener el canal de bienvenida
      const channel = member.guild.channels.cache.get(config.welcome.channelId);

      if (!channel) {
        console.error(`❌ Canal de bienvenida no encontrado: ${config.welcome.channelId}`);
        return;
      }

      // Get user data for custom background
      const userData = dataManager ? dataManager.getUser(member.id, member.guild.id) : null;

      // Crear la tarjeta de bienvenida (with custom background if set)
      const attachment = await createWelcomeCard(member, userData);

      // Usar mención explícita para que el usuario reciba la alerta en el canal
      const mention = `<@${member.user.id}>`;

      // Enviar el mensaje de bienvenida con lógica de reintento
      await sendWithRetry(channel, {
        content: `${EMOJIS.CASTLE} ${MESSAGES.WELCOME.NEW_MEMBER(mention)} ${EMOJIS.DRAGON}\n\n` +
                 `${MESSAGES.WELCOME.ROLE_ASSIGNED}\n` +
                 `${MESSAGES.WELCOME.WELCOME_CARD_SUBTITLE(member.guild.name)}`,
        files: [attachment],
        allowedMentions: { parse: ['users'] }
      });

      console.log(`${EMOJIS.SUCCESS} Tarjeta de bienvenida enviada para ${member.user.tag}`);
    } catch (error) {
      console.error(`❌ Error al enviar mensaje de bienvenida para ${member.user.tag}:`, error.message);
    }
  }
};

# Achievement System Implementation Plan

**Status:** 🚧 In Progress
**Features:** Achievements, Profile Customization, Events System, Shop Enhancements

---

## ✅ Completed So Far

### 1. Achievement Manager Created (`utils/achievementManager.js`)

**Features:**
- 28 unique achievements across 7 categories
- 5 tier system (Bronze, Silver, Gold, Platinum, Legendary)
- Automatic tracking and awarding
- Hidden achievements for surprises
- Rewards system (koku + titles)

**Achievement Categories:**
- 🎭 **Social** (6 achievements) - Messages, voice time, night owl
- ⚔️ **Honor** (4 achievements) - Honor milestones, rank progression
- 💰 **Economy** (5 achievements) - Koku accumulation, donations, daily streaks
- 🏯 **Clan** (3 achievements) - Clan creation, loyalty, contributions
- 🎵 **Music** (3 achievements) - Songs played, playlists created
- ⭐ **Special** (5 achievements) - Founder, early adopter, trivia, duels
- ❓ **Hidden** (2 achievements) - Secret achievements with ??? descriptions

**Example Achievements:**
```javascript
// First Steps (Bronze) - Send 1 message → 50 koku
// Chatterbox (Silver) - Send 1,000 messages → 500 koku
// Voice Champion (Gold) - 100 hours in voice → 3,000 koku
// Shogun Legacy (Legendary) - Reach Shogun rank → 5,000 koku + "Shogun Supremo" title
// Night Owl (Silver) - 50 messages between 2-6 AM → 300 koku + "El Insomne" title
```

### 2. Command Definitions Added (`commands/definitions.js`)

**New Commands:**
- `/logros` - View your achievements (Spanish)
- `/achievements` - Alias for /logros (English)
- `/medallas` - Alternative view (badges focus)

---

## 🚀 Next Steps

### Step 1: Implement Command Handlers

Add to `index.js` InteractionCreate section:

```javascript
// Achievement Commands
else if (commandName === 'logros' || commandName === 'achievements' || commandName === 'medallas') {
  const userId = interaction.user.id;
  const guildId = interaction.guild.id;

  await interaction.deferReply();

  const achievementManager = require('./utils/achievementManager');
  const { unlocked, locked, stats } = achievementManager.getUserAchievements(userId, guildId);

  // Create embed showing achievements
  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJIS.HONOR} Logros de ${interaction.user.username}`)
    .setDescription(`Has desbloqueado **${stats.total}/${stats.totalPossible}** logros (${stats.completion}%)`)
    .addFields(
      { name: `🏆 Último Logro`, value: stats.latestUnlock ? `${stats.latestUnlock.emoji} **${stats.latestUnlock.name}**` : 'Ninguno aún', inline: true }
    );

  // Add unlocked achievements by category
  for (const [category, achievements] of Object.entries(stats.byCategory)) {
    const categoryEmoji = achievementManager.CATEGORY_EMOJIS[category];
    const achList = achievements.map(a => `${a.emoji} **${a.name}** (${achievementManager.TIER_INFO[a.tier].emoji})`).join('\n');
    embed.addFields({ name: `${categoryEmoji} ${category.toUpperCase()}`, value: achList || 'Ninguno', inline: false });
  }

  await interaction.editReply({ embeds: [embed] });
}
```

### Step 2: Integrate with Existing Systems

**MessageCreate Event** - Track message-based achievements:
```javascript
// In MessageCreate, after granting honor:
const achievementManager = require('./utils/achievementManager');

// Track night messages (2-6 AM)
const hour = new Date().getHours();
if (hour >= 2 && hour < 6) {
  userData.stats.nightMessages = (userData.stats.nightMessages || 0) + 1;
}

// Track midnight messages (exactly 12 AM)
if (hour === 0) {
  userData.stats.midnightMessages = (userData.stats.midnightMessages || 0) + 1;
}

// Check for new achievements
const newAchievements = achievementManager.checkAchievements(userId, guildId, userData);

// Notify user of new achievements
for (const achievement of newAchievements) {
  try {
    const user = await client.users.fetch(userId);
    await user.send(
      `🏆 **¡Nuevo Logro Desbloqueado!**\n\n` +
      `${achievement.emoji} **${achievement.name}** ${achievementManager.TIER_INFO[achievement.tier].emoji}\n` +
      `${achievement.description}\n\n` +
      `**Recompensa:** ${achievement.reward.koku || 0} ${EMOJIS.KOKU}` +
      (achievement.reward.title ? ` + Título: "${achievement.reward.title}"` : '')
    );
  } catch (e) {
    // Ignore DM failures
  }
}
```

**VoiceStateUpdate Event** - Already tracks voice minutes, just add achievement check:
```javascript
// After granting voice honor/koku:
const newAchievements = achievementManager.checkAchievements(userId, guildId, userData);
// ... (same notification logic)
```

**Clan System** - Track clan achievements:
```javascript
// When user creates a clan:
userData.stats.clansCreated = (userData.stats.clansCreated || 0) + 1;
userData.clanJoinedAt = Date.now();

// When user joins a clan:
userData.clanJoinedAt = Date.now();
```

**Music System** - Track songs played:
```javascript
// In music manager after playing a song:
userData.stats.songsPlayed = (userData.stats.songsPlayed || 0) + 1;
```

### Step 3: Add Member Number Tracking

**In GuildMemberAdd event:**
```javascript
// Track member join order for founder/early adopter achievements
const botConfig = dataManager.getBotConfig();
botConfig.totalMembers = (botConfig.totalMembers || 0) + 1;
userData.memberNumber = botConfig.totalMembers;
dataManager.saveBotConfig(botConfig);
```

### Step 4: Register New Commands

```bash
node register-commands.js
```

---

## 🎨 Profile Customization Plan

### Features to Add:

1. **Background Images** for profile cards
2. **Custom Colors** for embeds
3. **Title Display** (from achievements)
4. **Bio/Description** (100 char limit)

### Implementation:

**New Commands:**
```javascript
/perfil personalizar background <url>  - Set custom background image
/perfil personalizar color <hex>       - Set custom embed color
/perfil personalizar titulo <title>    - Set display title (from unlocked titles)
/perfil personalizar bio <text>        - Set personal bio
```

**Data Structure:**
```javascript
userData.customization = {
  backgroundUrl: 'https://...',
  embedColor: '#FF6B35',
  displayTitle: 'Shogun Supremo',
  bio: 'Guerrero del Dojo desde 2025'
};
```

**Welcome Card Integration:**
- Check for custom background before using default
- Overlay username + rank on custom background
- Maintain samurai aesthetic with filters/overlays

---

## 🎪 Events System Plan

### Features:

1. **PvP Tournaments** - Bracket-style duels
2. **Building Contests** - Screenshot submissions + voting
3. **Trivia Events** - Timed quizzes with leaderboards
4. **Clan Wars** - Clan vs clan competitions

### Commands:

```javascript
/evento crear <tipo> <nombre> <descripcion>  - Create event (Admin only)
/evento unirse <evento>                      - Join event
/evento ver [evento]                         - View event details
/evento clasificacion <evento>               - Event leaderboard
/evento finalizar <evento>                   - End event and award prizes (Admin)
```

### Event Types:

- **duel_tournament** - Elimination bracket
- **building_contest** - Image submission + voting
- **trivia** - Timed questions
- **voice_marathon** - Most voice hours in 24h
- **koku_rush** - Earn most koku in timeframe

### Data Structure:

```javascript
events.json:
{
  eventId: {
    name: 'Torneo de Honor Semanal',
    type: 'duel_tournament',
    description: 'Batalla por el honor supremo',
    startTime: timestamp,
    endTime: timestamp,
    participants: ['userId1', 'userId2'],
    status: 'active', // pending, active, completed
    prizes: {
      1: { koku: 5000, title: 'Campeón del Torneo' },
      2: { koku: 3000 },
      3: { koku: 1000 }
    },
    results: {
      'userId1': { score: 100, rank: 1 }
    }
  }
}
```

---

## 🛍️ Shop Enhancements Plan

### Current Shop Status:

Already exists in the bot - need to enhance with:

1. **Role purchases** - Cosmetic roles with custom colors
2. **Achievement unlocks** - Pay koku to unlock special achievements
3. **Profile items** - Custom backgrounds, colors, badges
4. **Clan perks** - Expand clan member limit, custom tag colors
5. **Temporary boosts** - 2x honor for 24h, 2x koku, etc.

### New Shop Items:

```javascript
SHOP_ITEMS = {
  // Cosmetic Roles
  gold_namecolor: {
    name: 'Nombre Dorado',
    price: 10000,
    type: 'role',
    roleColor: '#FFD700',
    description: 'Nombre en color dorado durante 30 días'
  },

  // Profile Customization
  custom_background: {
    name: 'Fondo Personalizado',
    price: 5000,
    type: 'profile_unlock',
    description: 'Desbloquea fondos personalizados para tu perfil'
  },

  // Boosters
  honor_boost_24h: {
    name: 'Potenciador de Honor 24h',
    price: 3000,
    type: 'boost',
    effect: { honorMultiplier: 2, duration: 86400000 },
    description: 'Duplica el honor ganado durante 24 horas'
  },

  // Clan Perks
  clan_expansion: {
    name: 'Expansión de Clan',
    price: 15000,
    type: 'clan_perk',
    effect: { memberSlots: +5 },
    description: 'Agrega 5 espacios adicionales a tu clan'
  }
};
```

---

## 📊 Testing Plan

### Test Cases:

1. **Achievement Unlocking:**
   - [ ] Send 1 message → Unlock "Primeros Pasos"
   - [ ] Send 1,000 messages → Unlock "Hablador"
   - [ ] Reach Samurai rank → Unlock "Ascenso Samurai"
   - [ ] Create a clan → Unlock "Fundador de Clan"

2. **Command Testing:**
   - [ ] `/logros` shows correct achievements
   - [ ] Locked achievements show progress
   - [ ] Achievement notifications sent to DM
   - [ ] Leaderboard works

3. **Integration Testing:**
   - [ ] Achievements don't duplicate
   - [ ] Rewards granted correctly
   - [ ] Titles saved properly
   - [ ] Stats tracked accurately

4. **Profile Customization:**
   - [ ] Custom backgrounds work
   - [ ] Colors apply correctly
   - [ ] Bio displays properly

5. **Events System:**
   - [ ] Events can be created
   - [ ] Users can join
   - [ ] Leaderboards update
   - [ ] Prizes awarded

---

## 🚀 Deployment Order

1. ✅ Achievement Manager (DONE)
2. ✅ Command Definitions (DONE)
3. 🚧 Command Handlers (IN PROGRESS)
4. ⏳ Integration with passive systems
5. ⏳ Profile customization
6. ⏳ Events system
7. ⏳ Shop enhancements
8. ⏳ Testing
9. ⏳ Documentation update
10. ⏳ Register commands + restart bot

---

## ❓ Questions for You

1. **Achievement Notifications:** Send to DM or public channel?
2. **Profile Backgrounds:** Allow any URL or whitelist (Imgur, Discord CDN only)?
3. **Event Permissions:** Who can create events? Admins only or anyone?
4. **Shop Prices:** Are the koku prices reasonable? (5k-15k for items)
5. **Music Tracking:** Track per-user song plays or total server plays?

---

Ready to continue? I can now implement the command handlers and integrations. Let me know if you want me to proceed or if you have any changes to the plan!

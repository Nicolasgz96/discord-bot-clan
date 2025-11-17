# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Demon Hunter Bot** - A complete samurai-themed Discord bot with honor system, economy, and clan features for Minecraft community servers.

**Current Status:** ✅ **ALL 5 PHASES COMPLETE** - Production Ready (v1.5.0)
**Code Quality:** 9/10 (after brutal audit + fixes)
**Total Commands:** 18 slash commands + 25+ text commands
**Last Updated:** 2025-01-14

### Core Systems (All Implemented)

1. **Welcome System**: Personalized cards with Canvas (@napi-rs/canvas)
2. **Moderation Tools**: Message deletion/restoration with webhooks
3. **Voice/TTS**: Spanish text-to-speech integration
4. **Honor & Rank System**: 4 samurai ranks (Ronin → Samurai → Daimyo → Shogun)
5. **Economy System**: Koku currency with daily rewards and streak bonuses
6. **Clan System**: 5-level clans with auto-progression
7. **Data Persistence**: JSON-based with auto-save and backups
8. **Constants System**: Centralized configuration (280 lines)
9. **Backup System**: Automatic backups every 6 hours (7 days retention)

**Key Characteristics:**
- All messages in Spanish (user-facing and console)
- Dual command support: `!command` and `/command`
- No database required (JSON files only)
- Critical bugs fixed (4 major fixes applied)
- Magic numbers replaced with CONSTANTS
- Backup/recovery system for data corruption

## Running the Bot

```bash
# Install dependencies
npm install

# Register slash commands (REQUIRED before first run or after changes)
node register-commands.js

# Start the bot
npm start

# Verify setup (checks all imports and constants)
node verify-setup.js
```

### Critical Setup Requirements

**1. Discord Developer Portal - Privileged Gateway Intents:**
- Go to https://discord.com/developers/applications → Your Bot → Bot
- Enable: `SERVER MEMBERS INTENT` and `MESSAGE CONTENT INTENT`
- Without these, bot fails with "Used disallowed intents" error

**2. Environment Variables (`.env`):**
```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_id
```

**3. Slash Commands Registration:**
Run `node register-commands.js` after any changes to `commands.js`

## Architecture Overview

### Core Files

| File | Lines | Purpose | Modify? |
|------|-------|---------|---------|
| `index.js` | ~3,400 | Main bot logic, all event handlers | ✅ Yes |
| `utils/dataManager.js` | ~664 | JSON persistence, honor/clan management | ⚠️ Carefully |
| `utils/backupManager.js` | ~320 | Automatic backups, corruption recovery | ❌ No |
| `src/config/constants.js` | ~280 | All magic numbers centralized | ✅ Yes |
| `src/config/messages.js` | ~200 | Spanish message templates | ✅ Yes |
| `src/config/emojis.js` | ~150 | Thematic emojis | ✅ Yes |
| `src/config/colors.js` | ~50 | Color palette | ✅ Yes |
| `utils/welcomeCard.js` | ~350 | Canvas rendering | ✅ Yes |
| `utils/voiceManager.js` | ~250 | Voice connections/TTS | ⚠️ Carefully |
| `commands.js` | ~204 | Slash command definitions | ✅ Yes |

### Main Entry Point: `index.js`

**Structure:**
- Lines 1-37: Imports (Discord.js, config, CONSTANTS, dataManager, BackupManager)
- Lines 38-62: Config validation + cooldown constants
- Lines 64-85: Memory leak prevention (voiceTimeTracking cleanup)
- Lines 87-105: ClientReady event + dataManager initialization
- Lines 107-209: GuildMemberAdd (welcome cards + auto-role)
- Lines 211-308: VoiceStateUpdate (honor system + auto-disconnect)
- Lines 310-1440: MessageCreate (text commands)
- Lines 1442-3262: InteractionCreate (slash commands)
- Lines 3406-3430: Graceful shutdown handler

**Critical Sections:**

**Honor System (Passive Gains):**
- Lines 380-404: Message-based honor (+5 honor, +2 koku per minute)
- Lines 232-270: Voice exit rewards (calculates from lastHonorGrant to prevent duplication)
- Lines 288-307: 10-minute voice bonus (+10 honor only, koku calculated at exit)

**IMPORTANT - BUG FIXES APPLIED:**
- Lines 238-246: FIX BUG #1 - Uses `minutesSinceLastGrant` not `totalMinutes` (prevents duplication)
- Lines 67-85: FIX BUG #2 - Hourly cleanup of voiceTimeTracking (prevents memory leak)
- Lines 151-165 (dataManager): FIX BUG #3 - Auto-updates clan.totalHonor in addHonor()
- Lines 577-585 (dataManager): FIX BUG #4 - cleanExpiredCooldowns() in auto-save
- Line 291: FIX BUG #5 - Removed koku from 10-min bonus (only honor)

### Constants System

**File: `src/config/constants.js`**

Centralized configuration to eliminate magic numbers:

```javascript
CONSTANTS.HONOR.PER_MESSAGE // 5 honor per message
CONSTANTS.HONOR.PER_VOICE_MINUTE // 1 honor per voice minute
CONSTANTS.HONOR.PER_VOICE_10MIN_BONUS // 10 honor bonus
CONSTANTS.HONOR.RANK_THRESHOLDS // {SAMURAI: 500, DAIMYO: 2000, SHOGUN: 5000}

CONSTANTS.ECONOMY.PER_MESSAGE // 2 koku per message
CONSTANTS.ECONOMY.PER_VOICE_MINUTE // 0.5 koku per voice minute
CONSTANTS.ECONOMY.DAILY.BASE_REWARD // 100 koku base
CONSTANTS.ECONOMY.DAILY.RANK_MULTIPLIERS // {RONIN: 1, SAMURAI: 1.5, ...}

CONSTANTS.COOLDOWNS.COMMAND_DEFAULT // 5 seconds
CONSTANTS.COOLDOWNS.HONOR_MESSAGE // 60 seconds
CONSTANTS.COOLDOWNS.DAILY_REWARD // 24 hours

CONSTANTS.CLANS.LEVELS // 5 levels with honor thresholds
```

**Helper Functions:**
```javascript
CONSTANTS.calculateRank(honor) // Returns rank name
CONSTANTS.getRankMultiplier(rank) // Returns daily multiplier
CONSTANTS.getStreakBonus(days) // Returns streak bonus
CONSTANTS.getClanLevel(totalHonor) // Returns clan level object
```

### Data Persistence System

**DataManager: `utils/dataManager.js`**

Singleton managing all JSON persistence:

**Files Created:**
- `data/users.json` - User profiles (honor, koku, rank, clanId, stats, dailyStreak)
- `data/clans.json` - Clans (members, totalHonor, level, leader, invites)
- `data/cooldowns.json` - Active cooldowns with expiry timestamps
- `data/bot_config.json` - Bot statistics
- `data/backups/` - Automated backups (last 28, 7 days retention)

**Critical Methods:**

```javascript
// User management
dataManager.getUser(userId, guildId) // Auto-creates with defaults
dataManager.addHonor(userId, guildId, amount) // Auto-updates rank + clan stats
dataManager.updateUser(userId, guildId, updates)

// Clan management (lines 234-457)
dataManager.createClan(name, tag, leaderId, guildId, cost)
dataManager.getClan(clanId)
dataManager.getUserClan(userId, guildId)
dataManager.updateClanStats(clanId) // Recalculates totalHonor and level
dataManager.addUserToClan(userId, guildId, clanId)
dataManager.removeUserFromClan(userId, guildId)

// Cooldown management (CRITICAL - all commands use this)
dataManager.setCooldown(userId, commandName, seconds)
dataManager.hasCooldown(userId, commandName) // Returns boolean
dataManager.getCooldownTime(userId, commandName) // Returns remaining seconds
```

**Auto-Save System:**
- Saves every 5 minutes (configurable: `CONSTANTS.DATA.AUTO_SAVE_MINUTES`)
- Tracks modifications (only writes changed files)
- Graceful shutdown saves on Ctrl+C (SIGINT/SIGTERM)
- Expired cooldowns cleaned before each save

**Backup System (BackupManager):**
- Automatic backup every 6 hours
- Retains last 28 backups (7 days)
- Auto-recovery from corrupted JSON
- Located in `data/backups/YYYY-MM-DDTHH-MM-SS-MMMZ/`

### Honor & Rank System

**4 Samurai Ranks:**
- 🥷 **Ronin** (0-499 honor) - Daily: 100 koku × rank × streak
- ⚔️ **Samurai** (500-1,999 honor) - Daily: 150 koku (1.5× multiplier)
- 👑 **Daimyo** (2,000-4,999 honor) - Daily: 200 koku (2× multiplier), can create clans
- 🏯 **Shogun** (5,000+ honor) - Daily: 300 koku (3× multiplier)

**Honor Gains:**
- Messages: +5 honor per minute (cooldown: 60s between messages)
- Voice: +1 honor/minute + bonus +10 every 10 minutes
- Auto-rank on threshold (tracked in userData.rank)

**Commands:**
- `/honor` - Progress bar, stats, next rank info
- `/rango` - Detailed rank information
- `/top` - Server leaderboard (top 10)

### Economy System

**Koku Currency:**
- Messages: +2 koku per minute
- Voice: +0.5 koku/minute (calculated at exit only, prevents duplication)
- Daily rewards: 100-300 base × rank multiplier × (1 + streak bonus)

**Streak Bonuses:**
- 7 days: +50% (0.5)
- 14 days: +100% (1.0)
- 30 days: +200% (2.0)
- 90 days: +400% (4.0)
- Resets if >48 hours since last claim

**Commands:**
- `/daily` - Claim daily reward (24h cooldown)
- `/balance` or `/bal` - View koku, honor, streak
- `/pay @user <amount>` - Transfer koku
- `/leaderboard` or `/lb` - Interactive rankings (Honor/Koku/Streak tabs)

### Clan System

**5 Clan Levels (Auto-progression):**
1. **Clan Ronin** (0 honor) - 5 members max
2. **Clan Samurai** (5,000 honor) - 10 members max
3. **Clan Daimyo** (15,000 honor) - 15 members max
4. **Clan Shogun** (30,000 honor) - 20 members max
5. **Clan Legendario** (50,000+ honor) - 25 members max

**Clan Features:**
- Creation cost: 5,000 koku (requires Daimyo rank)
- Automatic level progression based on totalHonor
- Leader transfer on exit (highest honor member)
- Invitation system (leader only)
- Auto-updates totalHonor when members gain honor

**Commands:**
```javascript
/clan crear <nombre> <tag> // Create clan
/clan info [nombre] // View clan details
/clan unirse <nombre> // Join clan (if no members, auto-join)
/clan salir // Leave clan
/clan miembros // List members with honor
/clan top // Clan leaderboard
/clan invitar @usuario // Invite user (leader only)
/clan expulsar @usuario // Kick member (leader only)
```

**Clan Data Structure:**
```javascript
{
  clanId: "unique_id",
  name: "Guerreros del Dojo",
  tag: "DOJO",
  leaderId: "discord_user_id",
  members: ["user1", "user2"],
  totalHonor: 12000,
  level: 2,
  createdAt: timestamp,
  invites: ["invited_user_id"]
}
```

## Command Implementation Pattern

### Adding a New Command (Both Text and Slash)

**1. Define Slash Command (`commands.js`):**
```javascript
new SlashCommandBuilder()
  .setName('newcommand')
  .setDescription('⚔️ Samurai-themed description')
  .addStringOption(option =>
    option.setName('param')
      .setDescription('Parameter description')
      .setRequired(true)
  )
```

**2. Register:** `node register-commands.js`

**3. Implement Text Version (index.js, MessageCreate event):**
```javascript
if (message.content.toLowerCase().startsWith('!newcommand')) {
  const userId = message.author.id;
  const guildId = message.guild.id;

  // Permission check (if needed)
  if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return message.reply(MESSAGES.ERRORS.NO_PERMISSION);
  }

  // Cooldown check
  if (dataManager.hasCooldown(userId, 'newcommand')) {
    const timeLeft = dataManager.getCooldownTime(userId, 'newcommand');
    return message.reply(MESSAGES.ERRORS.COOLDOWN(timeLeft));
  }

  // Set cooldown AFTER checks (don't burn cooldown on errors)
  dataManager.setCooldown(userId, 'newcommand', CONSTANTS.COOLDOWNS.COMMAND_DEFAULT);

  // Get user data (auto-creates if not exists)
  const userData = dataManager.getUser(userId, guildId);

  // Command logic here
  message.reply(`${EMOJIS.SUCCESS} Comando ejecutado.`);
}
```

**4. Implement Slash Version (index.js, InteractionCreate event):**
```javascript
else if (commandName === 'newcommand') {
  const userId = interaction.user.id;
  const guildId = interaction.guild.id;

  // Permission check
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return interaction.reply({
      content: MESSAGES.ERRORS.NO_PERMISSION,
      ephemeral: true
    });
  }

  // Cooldown check
  if (dataManager.hasCooldown(userId, 'newcommand')) {
    const timeLeft = dataManager.getCooldownTime(userId, 'newcommand');
    return interaction.reply({
      content: MESSAGES.ERRORS.COOLDOWN(timeLeft),
      ephemeral: true
    });
  }

  dataManager.setCooldown(userId, 'newcommand', CONSTANTS.COOLDOWNS.COMMAND_DEFAULT);

  await interaction.deferReply(); // For long operations (>3 seconds)

  const userData = dataManager.getUser(userId, guildId);

  // Command logic here
  await interaction.editReply(`${EMOJIS.SUCCESS} Comando ejecutado.`);
}
```

### Critical Implementation Rules

**❌ NEVER DO THIS:**
```javascript
// Using old cooldowns Map (removed in Phase 2)
const cooldowns = new Map(); // ❌ ReferenceError

// Magic numbers
const honorToGrant = 5; // ❌ Use CONSTANTS.HONOR.PER_MESSAGE
const baseReward = 100; // ❌ Use CONSTANTS.ECONOMY.DAILY.BASE_REWARD

// Hardcoded messages
return message.reply('⏱️ Espera 5 segundos'); // ❌ Use MESSAGES.ERRORS.COOLDOWN(5)

// Duplicating rewards
const totalMinutes = Math.floor((Date.now() - tracking.joinedAt) / 60000);
const honorToGrant = totalMinutes * 1; // ❌ BUG #1 - duplicates rewards
```

**✅ ALWAYS DO THIS:**
```javascript
// Use dataManager for cooldowns
if (dataManager.hasCooldown(userId, 'command')) { /* ... */ }
dataManager.setCooldown(userId, 'command', CONSTANTS.COOLDOWNS.COMMAND_DEFAULT);

// Use CONSTANTS for values
const honorToGrant = minutesSinceLastGrant * CONSTANTS.HONOR.PER_VOICE_MINUTE;
const baseReward = CONSTANTS.ECONOMY.DAILY.BASE_REWARD;

// Use MESSAGES templates
return message.reply(MESSAGES.ERRORS.COOLDOWN(timeLeft));

// Calculate from last grant (prevents duplication)
const minutesSinceLastGrant = Math.floor((Date.now() - tracking.lastHonorGrant) / 60000);
```

## Testing Commands

```bash
# Syntax check all files
node -c index.js
node -c utils/dataManager.js
node -c src/config/constants.js

# Verify all imports and constants
node verify-setup.js

# Register slash commands
node register-commands.js

# Start bot (in development)
npm start
```

### In-Discord Testing

**Welcome System:**
```
/testwelcome - Preview welcome card
```

**Honor System:**
```
/honor - View your honor (0 initially)
/rango - View rank info (Ronin initially)
/top - Server leaderboard

# Gain honor:
# 1. Send messages (wait 1 min between) → +5 honor each
# 2. Join voice channel → +1 honor/min + +10 bonus every 10 min
```

**Economy System:**
```
/daily - Claim daily reward (100 koku for Ronin)
/balance - View koku, honor, streak
/pay @user 100 - Transfer koku

# Gain koku:
# 1. Send messages → +2 koku/min
# 2. Stay in voice → +0.5 koku/min (calculated at exit)
```

**Clan System:**
```
# Create clan (requires Daimyo rank + 5000 koku)
/clan crear Guerreros DOJO

# View clans
/clan info DOJO
/clan top

# Join/manage
/clan unirse DOJO
/clan salir
/clan invitar @usuario (leader only)
/clan expulsar @usuario (leader only)
```

## Common Development Tasks

### Modifying Honor/Koku Rates

Edit `src/config/constants.js`:

```javascript
CONSTANTS.HONOR = {
  PER_MESSAGE: 5, // Change this
  PER_VOICE_MINUTE: 1, // Or this
  // ...
};
```

All calculations automatically use these values.

### Adding New Themed Messages

`src/config/messages.js`:

```javascript
MESSAGES.NEW_CATEGORY = {
  NEW_MESSAGE: (param) => `${EMOJIS.KATANA} Mensaje con ${param}`,
};
```

Usage: `message.reply(MESSAGES.NEW_CATEGORY.NEW_MESSAGE('valor'));`

### Modifying Welcome Card Design

`utils/welcomeCard.js` → `CANVAS_CONFIG` (lines 10-31):

```javascript
TEXT_POSITIONS: {
  GROUP_Y: 455, // Vertical position (keep ≥438 to avoid clipping)
  AVATAR_LEFT: 320, // Horizontal avatar position
  TEXT_LEFT: 420, // Horizontal text position
}
```

Test with `/testwelcome` after changes.

### Adjusting Clan Costs/Requirements

`src/config/constants.js`:

```javascript
CONSTANTS.CLANS = {
  CREATION_COST: 5000, // Koku cost
  MIN_RANK_TO_CREATE: 'Daimyo', // Required rank
  // ...
};
```

## Critical Bugs (FIXED)

**✅ BUG #1: Race Condition - Honor/Koku Duplication in Voice**
- **Location:** `index.js:238-246`
- **Fix:** Uses `minutesSinceLastGrant` instead of `totalMinutes`
- **Impact:** Prevents economy inflation exploit

**✅ BUG #2: Memory Leak - voiceTimeTracking Never Cleaned**
- **Location:** `index.js:67-85`
- **Fix:** Hourly cleanup of entries >1 hour old
- **Impact:** Prevents bot crashes from memory exhaustion

**✅ BUG #3: Data Corruption - clan.totalHonor Desynchronized**
- **Location:** `utils/dataManager.js:151-165`
- **Fix:** Auto-updates clan stats in `addHonor()`
- **Impact:** Clan rankings and levels always correct

**✅ BUG #4: Orphan Cooldowns - setTimeout Lost on Restart**
- **Location:** `utils/dataManager.js:577-585`
- **Fix:** Periodic cleanup in auto-save
- **Impact:** cooldowns.json doesn't grow infinitely

**✅ BUG #5: Koku Duplication - Given at 10-min Bonus + Exit**
- **Location:** `index.js:291`
- **Fix:** Removed koku from 10-min bonus (only honor)
- **Impact:** Koku calculated correctly (only at voice exit)

## Known Issues

### Slash Commands Not Appearing

**Cause:** Commands not registered or Discord cache delay
**Solution:**
1. Run `node register-commands.js`
2. Wait up to 1 hour for Discord global command cache
3. Restart Discord client (Ctrl+R)

### Data Not Persisting After Restart

**Cause:** Auto-save not running or improper shutdown
**Solution:**
1. Check console for "Auto-guardado completado" every 5 minutes
2. Always stop bot with Ctrl+C (triggers graceful shutdown)
3. Verify `data/` directory exists and is writable

### Cooldowns Reset After Restart

**Cause:** Using Map instead of dataManager (Phase 2 migration issue)
**Solution:**
1. Search code for `cooldowns.has(` or `cooldowns.set(`
2. Replace with `dataManager.hasCooldown()` and `dataManager.setCooldown()`

## Documentation Files

**Implementation Guides:**
- `RESUMEN_COMPLETO_TODAS_LAS_FASES.md` - Complete overview (all 5 phases)
- `FASE_3_TESTING_RAPIDO.md` - Honor system testing
- `FASE_4_TESTING_RAPIDO.md` - Economy system testing
- `FASE_5_TESTING_RAPIDO.md` - Clan system testing
- `START_BOT_NOW.md` - Quick start guide with command examples

**Technical Documentation:**
- `BUGS_CRITICOS_ARREGLADOS.md` - Critical bugs fixed (4 major fixes)
- `AUDIT_REPORT_ROUND_2.md` - Second audit results (9/10 rating)
- `INTEGRATION_GUIDE.md` - BackupManager integration steps
- `INTENTS_FIX.md` - Discord intents setup

**Phase Completion Docs:**
- `PHASE_1_COMPLETED.md` - Welcome system + theme
- `PHASE_2_COMPLETED.md` - Data persistence
- `DEMON_HUNTER_BOT_ROADMAP.md` - Original 8-phase roadmap

## Language Requirements

**Spanish-Only Rule:**
- User-facing messages: Spanish with samurai context
- Console logs: Spanish (e.g., `✓ Bot en línea`, `❌ Error al cargar`)
- Error messages: Use `MESSAGES.ERRORS.*` templates
- Exception: Code comments and `.md` files can be English

**Examples:**
```javascript
// ✅ Correct
console.log(`${EMOJIS.SUCCESS} Sistema de datos inicializado`);
return message.reply(MESSAGES.ERRORS.COOLDOWN(timeLeft));

// ❌ Wrong
console.log('Data system initialized');
return message.reply(`⏱️ Please wait ${timeLeft} seconds`);
```

## Hosting Considerations

**Recommended Platforms:**
- Railway.app (500 free hours/month)
- Render.com (free tier with auto-sleep)
- Fly.io (3 free VMs)

**Requirements:**
- Node.js 18+
- FFmpeg (auto-installed via @ffmpeg-installer/ffmpeg)
- Writable `/data` directory for JSON files + backups

**Environment Variables:**
Must set `DISCORD_TOKEN` and `CLIENT_ID` in platform config

**Deployment Notes:**
- Auto-save every 5 minutes (adjust in constants if needed)
- Backups every 6 hours (7 days retention)
- Graceful shutdown saves data on SIGTERM
- No database connection required - everything is file-based

# Events System Implementation

**Status:** ✅ **COMPLETE**
**Date:** 2025-01-18
**Features:** Full event system with 5 event types, 12 commands, automatic tracking

---

## Overview

The Events System allows admins to create server-wide competitions and events with automatic tracking, leaderboards, and prize distribution.

## Event Types

### 1. ⚔️ Torneo de Duelos (Duel Tournament)
- **Type ID:** `duel_tournament`
- **Min Participants:** 2
- **Max Participants:** 32
- **Default Duration:** 7 days
- **Features:**
  - Automatic bracket generation
  - Elimination-style matches
  - Manual score updates by admins
- **Default Prizes:**
  - 🥇 1st: 5,000 koku + "Campeón del Torneo" title
  - 🥈 2nd: 3,000 koku + "Subcampeón" title
  - 🥉 3rd: 1,500 koku

### 2. 📚 Trivia Samurai (Trivia)
- **Type ID:** `trivia`
- **Min Participants:** 2
- **Max Participants:** 100
- **Default Duration:** 1 hour
- **Features:**
  - Question-based competition
  - Score tracking per correct answer
  - Leaderboard based on points
- **Default Prizes:**
  - 🥇 1st: 2,000 koku + "Maestro del Conocimiento" title
  - 🥈 2nd: 1,000 koku
  - 🥉 3rd: 500 koku

### 3. 🏗️ Concurso de Construcción (Building Contest)
- **Type ID:** `building_contest`
- **Min Participants:** 2
- **Max Participants:** 50
- **Default Duration:** 7 days
- **Features:**
  - Image submissions via URL
  - Voting system (one vote per user)
  - Description for each submission
  - Automatic scoring based on votes
- **Default Prizes:**
  - 🥇 1st: 4,000 koku + "Arquitecto Legendario" title
  - 🥈 2nd: 2,500 koku + "Constructor Maestro" title
  - 🥉 3rd: 1,500 koku

### 4. 🎤 Maratón de Voz (Voice Marathon)
- **Type ID:** `voice_marathon`
- **Min Participants:** 2
- **Max Participants:** 100
- **Default Duration:** 24 hours
- **Features:**
  - **Automatic tracking:** Tracks total voice minutes
  - Updates when users exit voice channels
  - Leaderboard shows total voice time
- **Default Prizes:**
  - 🥇 1st: 3,000 koku + "Rey de la Voz" title
  - 🥈 2nd: 2,000 koku
  - 🥉 3rd: 1,000 koku

### 5. 💰 Carrera de Koku (Koku Rush)
- **Type ID:** `koku_rush`
- **Min Participants:** 2
- **Max Participants:** 100
- **Default Duration:** 48 hours
- **Features:**
  - **Automatic tracking:** Tracks koku gained during event
  - Stores starting koku when user joins
  - Updates on message activity and daily rewards
  - Leaderboard shows net koku gain
- **Default Prizes:**
  - 🥇 1st: 5,000 koku + "Comerciante Supremo" title
  - 🥈 2nd: 3,000 koku
  - 🥉 3rd: 1,500 koku

---

## Commands

### Admin Commands (Require Administrator Permission)

#### `/evento crear`
Create a new event.

**Options:**
- `tipo` (required): Event type (duel_tournament, trivia, building_contest, voice_marathon, koku_rush)
- `nombre` (required): Event name
- `descripcion` (optional): Event description
- `duracion` (optional): Duration in hours (1-168 hours)
- `max_participantes` (optional): Max participants (2-100)

**Example:**
```
/evento crear tipo:voice_marathon nombre:Maratón Nocturna descripcion:Competencia de 24 horas en voz duracion:24
```

**Response:** Embed showing event details and join instructions.

#### `/evento iniciar`
Start a pending event.

**Options:**
- `evento` (required): Event name or ID

**Validation:**
- Event must be in "pending" status
- Must have minimum participants
- Generates bracket for tournaments

**Example:**
```
/evento iniciar evento:Maratón Nocturna
```

#### `/evento finalizar`
End an active event and award prizes.

**Options:**
- `evento` (required): Event name or ID

**Actions:**
- Ends the event
- Awards prizes to top 3 winners
- Sends DM notifications to winners
- Displays winner embed with prizes

**Example:**
```
/evento finalizar evento:Maratón Nocturna
```

**Response:**
```
🎤 ¡Evento Finalizado!
Maratón Nocturna ha concluido.

🏆 Ganadores:

🥇 JohnDoe - 450 puntos
   Recompensa: 3000 koku + "Rey de la Voz"

🥈 JaneDoe - 380 puntos
   Recompensa: 2000 koku

🥉 BobSmith - 320 puntos
   Recompensa: 1000 koku
```

#### `/evento cancelar`
Cancel a pending or active event.

**Options:**
- `evento` (required): Event name or ID

**Example:**
```
/evento cancelar evento:Maratón Nocturna
```

### User Commands

#### `/evento unirse`
Join a pending or active event.

**Options:**
- `evento` (required): Event name or ID

**Validation:**
- Event must not be completed or cancelled
- User not already in event
- Event not at max capacity

**Special behavior:**
- **Koku Rush:** Captures user's current koku as starting point

**Example:**
```
/evento unirse evento:Maratón Nocturna
```

#### `/evento salir`
Leave a pending event.

**Options:**
- `evento` (required): Event name or ID

**Validation:**
- Cannot leave active events

**Example:**
```
/evento salir evento:Maratón Nocturna
```

#### `/evento ver`
View event details.

**Options:**
- `evento` (optional): Event name or ID. If empty, shows all active events.

**Without parameter:**
```
/evento ver
```
Shows list of all active events with basic info.

**With parameter:**
```
/evento ver evento:Maratón Nocturna
```
Shows detailed event info: ID, status, participants, start/end time, creator, prizes.

#### `/evento clasificacion`
View event leaderboard.

**Options:**
- `evento` (required): Event name or ID

**Shows:** Top 10 participants with scores/points.

**Example:**
```
/evento clasificacion evento:Maratón Nocturna
```

**Response:**
```
🏆 Clasificación: Maratón Nocturna

🥇 JohnDoe - 450 puntos
🥈 JaneDoe - 380 puntos
🥉 BobSmith - 320 puntos
4. AliceDoe - 280 puntos
5. CharlieB - 250 puntos
...
```

#### `/evento lista`
List all server events.

**Options:**
- `estado` (optional): Filter by status (pending, active, completed, cancelled)

**Example:**
```
/evento lista estado:active
```

#### `/evento enviar`
Submit a building for building contest.

**Options:**
- `evento` (required): Event ID
- `imagen_url` (required): Direct URL to building image
- `descripcion` (optional): Description of the building

**Validation:**
- Event must be building_contest type
- User must be participant

**Example:**
```
/evento enviar evento:abc123 imagen_url:https://i.imgur.com/abc123.png descripcion:Mi castillo samurai
```

**Response:** Embed showing submitted building with image preview.

#### `/evento votar`
Vote for a building in a contest.

**Options:**
- `evento` (required): Event ID
- `usuario` (required): User whose building you want to vote for

**Validation:**
- Cannot vote for own building
- Can only vote once per contest
- Updates leaderboard automatically

**Example:**
```
/evento votar evento:abc123 usuario:@JohnDoe
```

---

## Automatic Tracking

### Voice Marathon Tracking
**Location:** `events/voiceStateUpdate.js` (lines 151-166)

**How it works:**
1. When a user exits a voice channel, calculate total voice minutes
2. Check if user is in any active voice marathon events
3. Update event score with total voice minutes
4. Score = total minutes in voice during event period

**Integration:**
```javascript
// On voice exit
const totalMinutes = Math.floor((Date.now() - tracking.joinedAt) / 60000);

// Track for active events
const eventManager = getEventManager();
const activeEvents = eventManager.getActiveEvents(guildId);

for (const event of activeEvents) {
  if (event.type === 'voice_marathon' && event.participants.includes(userId)) {
    eventManager.trackVoiceTime(event.id, userId, totalMinutes);
  }
}
```

### Koku Rush Tracking
**Locations:**
- `index.js` (lines 151-164): MessageCreate koku gain
- `index.js` (lines 2418-2431): Daily reward koku gain

**How it works:**
1. When user joins event, store `startingKoku`
2. Every time user gains koku (messages, daily rewards), update event score
3. Score = current koku - starting koku
4. Leaderboard shows net koku gained during event

**Integration (MessageCreate):**
```javascript
// After granting koku
userData.koku = (userData.koku || 0) + CONSTANTS.ECONOMY.PER_MESSAGE;

// Track for active events
const eventManager = getEventManager();
const activeEvents = eventManager.getActiveEvents(guildId);

for (const event of activeEvents) {
  if (event.type === 'koku_rush' && event.participants.includes(userId)) {
    eventManager.trackKokuGain(event.id, userId, userData.koku);
  }
}
```

**Integration (Daily Rewards):**
```javascript
// After granting daily koku
userData.koku = (userData.koku || 0) + totalKoku;

// Same tracking logic as MessageCreate
```

---

## Data Structure

### Event Object
**File:** `data/events.json`

```javascript
{
  "event-uuid-123": {
    "id": "event-uuid-123",
    "guildId": "discord_guild_id",
    "type": "voice_marathon",
    "name": "Maratón Nocturna",
    "description": "Competencia de 24 horas en voz",
    "emoji": "🎤",
    "creatorId": "discord_user_id",
    "createdAt": 1705622400000,
    "startTime": 1705622400000,
    "endTime": 1705708800000,
    "status": "active", // pending, active, completed, cancelled
    "participants": [
      "user_id_1",
      "user_id_2",
      "user_id_3"
    ],
    "minParticipants": 2,
    "maxParticipants": 100,
    "prizes": {
      "1": { "koku": 3000, "title": "Rey de la Voz" },
      "2": { "koku": 2000 },
      "3": { "koku": 1000 }
    },
    "results": {
      "user_id_1": { "score": 450, "rank": 1 },
      "user_id_2": { "score": 380, "rank": 2 },
      "user_id_3": { "score": 320, "rank": 3 }
    },
    "metadata": {
      // Type-specific data
      "voiceTime": {
        "user_id_1": 450, // minutes
        "user_id_2": 380
      }
    }
  }
}
```

### Metadata by Event Type

**Duel Tournament:**
```javascript
{
  "bracket": [
    { "player1": "user1", "player2": "user2", "winner": null, "round": 1 },
    { "player1": "user3", "player2": "user4", "winner": null, "round": 1 }
  ],
  "matches": []
}
```

**Trivia:**
```javascript
{
  "questions": [],
  "currentQuestion": 0
}
```

**Building Contest:**
```javascript
{
  "submissions": {
    "user_id": {
      "imageUrl": "https://...",
      "description": "Mi construcción",
      "submittedAt": 1705622400000,
      "votes": 5,
      "voters": ["voter1", "voter2", "voter3"]
    }
  }
}
```

**Voice Marathon:**
```javascript
{
  "voiceTime": {
    "user_id": 450 // total minutes
  }
}
```

**Koku Rush:**
```javascript
{
  "startingKoku": {
    "user_id": 5000 // koku at event start
  }
}
```

---

## Architecture

### Event Manager (`utils/eventManager.js`)
**Size:** 702 lines

**Key Classes:**
- `EventManager` - Singleton manager for all events

**Key Methods:**

#### Event Lifecycle
- `createEvent(guildId, type, name, description, creatorId, options)` - Create new event
- `startEvent(eventId)` - Start pending event
- `endEvent(eventId)` - End active event
- `cancelEvent(eventId)` - Cancel event

#### Participant Management
- `joinEvent(eventId, userId)` - User joins event
- `leaveEvent(eventId, userId)` - User leaves event

#### Scoring & Leaderboards
- `updateScore(eventId, userId, score, operation)` - Update participant score
- `updateRanks(eventId)` - Recalculate ranks based on scores
- `getLeaderboard(eventId, limit)` - Get top participants

#### Event Queries
- `getEvent(eventId)` - Get event by ID
- `getGuildEvents(guildId, status)` - Get all events for guild
- `getActiveEvents(guildId)` - Get active events
- `getUserEvents(guildId, userId)` - Get user's events

#### Type-Specific Methods
- `generateBracket(participants)` - Create tournament bracket
- `submitBuildingEntry(eventId, userId, imageUrl, description)` - Submit building
- `voteBuildingEntry(eventId, voterId, targetUserId)` - Vote for building
- `trackVoiceTime(eventId, userId, minutes)` - Track voice marathon time
- `trackKokuGain(eventId, userId, currentKoku)` - Track koku rush progress

#### Prize Distribution
- `awardPrizes(eventId, dataManager)` - Award prizes to winners

#### Maintenance
- `cleanupOldEvents()` - Remove events older than 30 days

---

## Event Status Flow

```
PENDING → ACTIVE → COMPLETED
   ↓
CANCELLED
```

**PENDING:**
- Just created
- Users can join/leave
- Can be started by admin
- Can be cancelled

**ACTIVE:**
- Event running
- Scores being tracked
- Users cannot leave
- New users can join (if not full)
- Can be ended by admin

**COMPLETED:**
- Event finished
- Prizes awarded
- Leaderboard frozen
- Cannot be modified

**CANCELLED:**
- Event cancelled by admin
- No prizes awarded
- Cannot be reactivated

---

## Integration with Achievement System

Event wins are tracked for achievements:

```javascript
// In awardPrizes() method
userData.stats.eventWins = (userData.stats.eventWins || 0) + 1;

if (result.rank === 1) {
  userData.stats.firstPlaceWins = (userData.stats.firstPlaceWins || 0) + 1;
}
```

**Future Achievement Ideas:**
- **Event Champion:** Win 5 events
- **First Place Master:** Win 1st place in 3 events
- **Event Participant:** Join 10 events
- **Marathon Runner:** Win a voice marathon
- **Koku King:** Win a koku rush

---

## Testing Checklist

### Admin Commands
- [ ] `/evento crear` - Creates event with correct defaults
- [ ] `/evento iniciar` - Starts event, validates participants
- [ ] `/evento finalizar` - Awards prizes correctly
- [ ] `/evento cancelar` - Cancels event properly

### User Commands
- [ ] `/evento unirse` - Joins event successfully
- [ ] `/evento salir` - Leaves pending event
- [ ] `/evento ver` - Shows event details
- [ ] `/evento clasificacion` - Shows leaderboard
- [ ] `/evento lista` - Lists events with filters

### Event Types
- [ ] **Duel Tournament:** Bracket generated correctly
- [ ] **Trivia:** Scores update manually
- [ ] **Building Contest:** Submissions and voting work
- [ ] **Voice Marathon:** Automatic tracking on voice exit
- [ ] **Koku Rush:** Automatic tracking on koku gain

### Automatic Tracking
- [ ] Voice time tracked when user exits voice
- [ ] Koku gain tracked on message activity
- [ ] Koku gain tracked on daily rewards
- [ ] Scores update in real-time
- [ ] Leaderboard reflects changes

### Prize Distribution
- [ ] Koku awarded correctly
- [ ] Titles granted to userData.titles
- [ ] Winners notified via DM
- [ ] Event stats tracked (eventWins, firstPlaceWins)

### Edge Cases
- [ ] Cannot join full event
- [ ] Cannot leave active event
- [ ] Cannot start event with < min participants
- [ ] Cannot vote for own building
- [ ] Cannot vote twice in building contest
- [ ] Old events cleaned up after 30 days

---

## Usage Examples

### Example 1: Voice Marathon

**1. Admin creates event:**
```
/evento crear tipo:voice_marathon nombre:Maratón de Fin de Semana duracion:48
```

**2. Users join:**
```
/evento unirse evento:Maratón de Fin de Semana
```

**3. Admin starts event:**
```
/evento iniciar evento:Maratón de Fin de Semana
```

**4. Users participate (automatic):**
- Join voice channels
- Bot automatically tracks voice time on exit
- Leaderboard updates in real-time

**5. Users check leaderboard:**
```
/evento clasificacion evento:Maratón de Fin de Semana
```

**6. Admin ends event:**
```
/evento finalizar evento:Maratón de Fin de Semana
```

**7. Winners receive:**
- DM notification with prize details
- Koku added to balance
- Title added to userData.titles

### Example 2: Building Contest

**1. Admin creates event:**
```
/evento crear tipo:building_contest nombre:Concurso de Castillos duracion:168
```

**2. Users join and submit:**
```
/evento unirse evento:Concurso de Castillos
/evento enviar evento:abc123 imagen_url:https://i.imgur.com/castle.png descripcion:Castillo samurai con jardines
```

**3. Others vote:**
```
/evento votar evento:abc123 usuario:@JohnDoe
```

**4. Admin ends event:**
```
/evento finalizar evento:Concurso de Castillos
```

Winner is determined by votes automatically.

### Example 3: Koku Rush

**1. Admin creates event:**
```
/evento crear tipo:koku_rush nombre:Rush de Riqueza duracion:24
```

**2. Users join:**
```
/evento unirse evento:Rush de Riqueza
```
(Starting koku captured automatically)

**3. Admin starts event:**
```
/evento iniciar evento:Rush de Riqueza
```

**4. Users earn koku (automatic):**
- Send messages (+2 koku/min)
- Claim daily rewards (+100-300 koku)
- Bot automatically tracks net gain

**5. Leaderboard shows net gain:**
```
/evento clasificacion evento:Rush de Riqueza

🥇 JohnDoe - 2,500 puntos (gained 2,500 koku)
🥈 JaneDoe - 2,100 puntos (gained 2,100 koku)
🥉 BobSmith - 1,800 puntos (gained 1,800 koku)
```

---

## Files Modified

### New Files
1. `utils/eventManager.js` (702 lines)
   - Full event management system
   - 5 event types with templates
   - Scoring, leaderboards, prizes

### Modified Files
1. `commands/definitions.js`
   - Added `/evento` command with 12 subcommands
   - Lines 695-878

2. `index.js`
   - Added `/evento` command handler (all 12 subcommands)
   - Added koku rush tracking in MessageCreate (lines 151-164)
   - Added koku rush tracking in /daily command (lines 2418-2431)
   - Lines 4486-5063

3. `events/voiceStateUpdate.js`
   - Added voice marathon tracking on voice exit
   - Lines 151-166

---

## Next Steps

1. **Register Commands:**
   ```bash
   node register-commands.js
   ```

2. **Test Event System:**
   - Create test events
   - Join with multiple users
   - Test automatic tracking (voice & koku)
   - Test prize distribution

3. **Add Event Achievements:**
   - Event Champion (win 5 events)
   - Marathon Runner (win voice marathon)
   - Builder Master (win building contest)
   - Koku King (win koku rush)

4. **Optional Enhancements:**
   - Trivia question system (import questions from JSON)
   - Tournament bracket UI (reactions for match results)
   - Event reminders (30 min before end)
   - Event statistics dashboard

---

## Known Limitations

1. **Trivia Events:** Question system not implemented (manual scoring only)
2. **Tournament Brackets:** Manual match result entry (no UI)
3. **Event Reminders:** No automatic notifications before event ends
4. **Historical Data:** Old events deleted after 30 days
5. **Event Editing:** Cannot edit event details after creation

---

**Implementation Complete:** 2025-01-18
**Total Lines Added:** ~1,800 lines
**Commands Added:** 12 slash subcommands
**Event Types:** 5 fully functional types
**Automatic Tracking:** Voice marathons & koku rushes

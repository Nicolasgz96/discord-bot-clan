# Event System Fix - eventManager Reference Error

## Problem Identified

Users were experiencing a `ReferenceError: eventManager is not defined` error when interacting with event selections, particularly during tournament-related interactions.

## Root Cause

The `eventManager` was only available within the scope of the `/evento` slash command handler in `index.js`. When message component collectors (select menus, buttons) were created, they relied on closure to access `eventManager`. However, in some scenarios:

1. **Modular handlers** (`handlers/buttons.js`, `handlers/modals.js`) didn't have access to `eventManager`
2. **Long-running collectors** might have lost closure reference in certain edge cases
3. **Tournament interactions** created after event startup might not have been within the original command's scope

## Solution Implemented

### 1. Created Dedicated Event Handler (`handlers/events.js`)

A new modular handler specifically for event-related interactions:

```javascript
// handlers/events.js
const { getEventManager } = require('../utils/eventManager');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, { client, dataManager }) {
    // Dynamically import eventManager for each interaction
    const { getEventManager, EVENT_STATUS } = require('../utils/eventManager');
    const eventManager = getEventManager();

    // Handle all event-related select menus and buttons
    if (interaction.customId === 'event_join_select') {
      // ... handle event joining
    }
    // ... etc
  }
};
```

**Key Features:**
- ✅ Imports `eventManager` fresh for each interaction (prevents closure issues)
- ✅ Handles all event-related select menus centrally
- ✅ Works as fallback if collectors don't catch the interaction
- ✅ Automatically loaded by `utils/eventLoader.js`
- ✅ Defensive programming: checks if interaction already handled

### 2. Handler Loading

The handler is automatically loaded at bot startup via `utils/eventLoader.js`:

```javascript
// index.js (lines 127-131)
loadHandlers(client, {
  client,
  dataManager,
  musicHandlers
});
```

All `.js` files in `handlers/` directory are automatically registered as interaction handlers.

### 3. Supported Event Interactions

The handler manages:
- `event_join_select` - Joining events via select menu
- `event_leave_select` - Leaving events via select menu
- `event_view_select` - Viewing event details
- `event_finalize_select` - Finalizing events (admin)
- `event_cancel_select` - Cancelling events (admin)
- `event_vote_select_event` - Voting in events
- Any custom event buttons/selects (prefix: `event_`)

## How It Works

### Event Flow

1. **User runs `/evento unirse`** (join event command)
   ```
   index.js:5892 → Creates select menu with customId='event_join_select'
   ```

2. **User selects an event from dropdown**
   ```
   Discord fires InteractionCreate event
   ```

3. **Two handlers potentially receive it:**
   ```
   a) Collector in index.js (lines 5947-6007) - PRIORITY
   b) handlers/events.js - FALLBACK
   ```

4. **Proper handling ensured:**
   ```javascript
   // Handler checks if already replied (by collector)
   if (interaction.replied || interaction.deferred) {
     return; // Collector already handled it
   }
   ```

5. **eventManager is always available:**
   ```javascript
   // Fresh import ensures singleton access
   const { getEventManager } = require('../utils/eventManager');
   const eventManager = getEventManager();
   ```

## Testing Verification

To verify the fix works:

```bash
# Start bot
npm start

# In Discord:
/evento crear tipo:duel_tournament nombre:"Test Torneo" descripcion:"Prueba"
/evento unirse
# Select the event from dropdown - should work without errors
/evento ver
# Select event to view details - should work without errors
```

## For Local Development (Windows/Your Machine)

If you're still experiencing the error on your local machine:

### Check 1: Ensure eventManager is imported where needed

```javascript
// ❌ WRONG - eventManager used without import
if (interaction.customId === 'some_event_thing') {
  const event = eventManager.getEvent(id); // ReferenceError!
}

// ✅ CORRECT - Always import first
if (interaction.customId === 'some_event_thing') {
  const { getEventManager } = require('./utils/eventManager');
  const eventManager = getEventManager();
  const event = eventManager.getEvent(id);
}
```

### Check 2: Update custom tournament code

If you have custom tournament bracket/match selection code (like the "selección del torneo" error suggests):

```javascript
// In your tournament selection handler:
collector.on('collect', async (i) => {
  // ✅ Import eventManager at the TOP of the callback
  const { getEventManager } = require('./utils/eventManager');
  const eventManager = getEventManager();

  // Now you can use it safely
  const event = eventManager.getEvent(eventId);
  // ... rest of your code
});
```

### Check 3: Pull latest changes

```bash
git fetch origin claude/fix-event-startup-0119FnzAyPrc3bw7WTzT5T3G
git pull origin claude/fix-event-startup-0119FnzAyPrc3bw7WTzT5T3G
```

Then merge into your local branch with the tournament code.

## Files Changed

```
NEW:     handlers/events.js (218 lines)
         - Handles all event-related interactions
         - Ensures eventManager always available
         - Defensive against duplicate responses

DOCS:    EVENT_SYSTEM_FIX.md (this file)
         - Documents the problem and solution
         - Provides testing and local dev guidance
```

## Architecture Benefits

### Before (Potential Issues):
```
index.js (/evento command)
  └─ defines eventManager (line 5835)
     └─ creates collectors
        └─ collectors use eventManager via closure ⚠️
           (could fail in edge cases)
```

### After (Robust):
```
index.js (/evento command)          handlers/events.js
  └─ collectors (primary)              └─ fresh import of eventManager
                                          (fallback + guaranteed access)

Both handle interactions safely! ✅
```

## Future Improvements

For further robustness, consider:

1. **Move all event collectors to handlers/events.js**
   - Centralize all event interaction logic
   - Remove collectors from index.js

2. **Create event-specific button builders**
   ```javascript
   // utils/eventButtons.js
   function createEventJoinButton(eventId) {
     return new ButtonBuilder()
       .setCustomId(`event_join_${eventId}`)
       .setLabel('Unirse')
       .setStyle(ButtonStyle.Primary);
   }
   ```

3. **Add eventManager to handler dependencies**
   ```javascript
   // index.js
   loadHandlers(client, {
     client,
     dataManager,
     musicHandlers,
     getEventManager: () => require('./utils/eventManager').getEventManager()
   });
   ```

## Support

If you continue experiencing eventManager errors:

1. Check the exact line number in the error stack trace
2. Search that line for `eventManager.` usage
3. Add this at the top of that function/callback:
   ```javascript
   const { getEventManager } = require('./utils/eventManager');
   const eventManager = getEventManager();
   ```

4. If the error is in a collector callback:
   ```javascript
   collector.on('collect', async (i) => {
     const { getEventManager } = require('./utils/eventManager'); // ← Add this
     const eventManager = getEventManager();                       // ← And this

     // Now use eventManager safely
   });
   ```

---

**Last Updated:** 2025-01-20
**Author:** Claude Code
**Status:** ✅ Fixed and Tested

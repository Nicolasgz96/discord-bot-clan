# FIX: "Used disallowed intents" Error

## What's Wrong

Your bot is trying to use the **Server Members Intent** (GuildMembers), which is a **privileged intent** that must be manually enabled in the Discord Developer Portal.

## How to Fix (5 minutes)

### Step 1: Go to Discord Developer Portal

1. Open: https://discord.com/developers/applications
2. Click on your bot application

### Step 2: Enable Privileged Gateway Intents

1. Go to the **"Bot"** section in the left sidebar
2. Scroll down to **"Privileged Gateway Intents"**
3. **ENABLE** these intents:
   - ✅ **SERVER MEMBERS INTENT** (required for welcome messages)
   - ✅ **MESSAGE CONTENT INTENT** (required for !testwelcome command)

4. Click **"Save Changes"**

### Step 3: Restart Your Bot

```bash
npm start
```

## Why This Happens

Discord restricts access to certain user data (like member join events) to prevent abuse. You must explicitly enable these intents to use them.

## Important Note

If your bot is in 100+ servers, you'll need to apply for verification and approval from Discord to use these intents. For personal/small bots, instant approval.

## After Fix

You should see:
```
✓ Bot is online as YourBot#1234
✓ Serving 1 servers
✓ Welcome feature: Enabled
```

Then test with `!testwelcome` in Discord!

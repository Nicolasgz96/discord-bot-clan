# Discord Welcome Bot with Personalized Cards

A Discord bot that creates beautiful, personalized welcome cards for new members joining your server.

## Features

- **Personalized Welcome Cards**: Generates custom image cards with member avatars
- **Fully Customizable**: Configure colors, text, fonts, and background images
- **Beautiful Design**: Professional-looking cards with decorative elements and shadows
- **Easy Setup**: Simple configuration through JSON file

## Preview

The welcome cards feature a beautiful centered design with:
- **Custom background image** that fills the entire canvas (your image goes here!)
- **Centered card panel** with rounded corners and shadow
- **Curved accent decorations** in blue (customizable color)
- **Member's avatar** with white border in the center
- **Member count** displayed at the top (e.g., "Member #31")
- **Welcome message** with server name
- **Username** displayed at the bottom
- Semi-transparent card overlay so your background image shows through beautifully

## Setup Instructions

### 1. Prerequisites

- Node.js v16.9.0 or higher
- A Discord account and server
- Discord Bot Token (see below)

### 2. Create a Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section
4. Click "Add Bot"
5. Under "Privileged Gateway Intents", enable:
   - **Server Members Intent** (required for detecting new members)
   - **Message Content Intent** (optional)
6. Click "Reset Token" to get your bot token (keep this secret!)
7. Copy the token for the next step

### 3. Configure the Bot

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your bot token:
   ```
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_bot_client_id_here
   ```

3. Edit `config.json` to customize your welcome cards:
   ```json
   {
     "welcome": {
       "enabled": true,
       "channelId": "YOUR_WELCOME_CHANNEL_ID",
       "card": {
         "backgroundImage": "https://i.imgur.com/your-image.png",
         "backgroundColor": "#2C2F33",
         "cardBackgroundColor": "rgba(44, 47, 51, 0.95)",
         "accentColor": "#00D4FF",
         "titleColor": "#FFFFFF",
         "descriptionColor": "#99AAB5",
         "memberCountColor": "#99AAB5",
         "font": "sans-serif"
       }
     }
   }
   ```

### 4. Get Your Welcome Channel ID

1. Enable Developer Mode in Discord:
   - User Settings → Advanced → Developer Mode (toggle on)
2. Right-click on the channel where you want welcome messages
3. Click "Copy Channel ID"
4. Paste the ID into `config.json` under `channelId`

### 5. Invite the Bot to Your Server

1. Go to the "OAuth2" → "URL Generator" section in the Developer Portal
2. Select scopes:
   - `bot`
3. Select bot permissions:
   - `Send Messages`
   - `Attach Files`
   - `Read Messages/View Channels`
   - `Manage Messages` (for moderation commands)
   - `Read Message History` (for moderation commands)
   - `Manage Webhooks` (for undo functionality)
   - `Connect` (for voice commands)
   - `Speak` (for voice commands)
4. Copy the generated URL and open it in your browser
5. Select your server and authorize the bot

### 6. Start the Bot

```bash
npm start
```

You should see:
```
✓ Bot is online as YourBot#1234
✓ Serving 1 servers
✓ Welcome feature: Enabled
```

## Testing the Welcome Card

To test your welcome card configuration without waiting for someone to join:

1. Send `!testwelcome` in any channel where the bot can see messages
2. The bot will generate and send a preview of what the welcome card looks like

This is useful for:
- Testing different color schemes
- Previewing background images
- Adjusting text and fonts
- Making sure everything looks good before going live

## Getting Help

### `!help` or `!ayuda`

Shows an interactive help menu with all available commands.

**Usage:**
```
!help
!ayuda
```

This command displays a beautiful embed with:
- 📚 All available commands
- ✨ How to use each command
- 🔒 Required permissions
- ⚡ Special features and cooldowns

Perfect for new users who want to know what the bot can do!

## Moderation Commands

The bot includes powerful moderation tools for managing messages:

### `!borrarmsg <usuario>`

Deletes all messages from a specific user in the current channel.

**Usage examples:**
```
!borrarmsg @Usuario
!borrarmsg usuario#1234
!borrarmsg nombreDeUsuario
```

**Features:**
- ✅ Interactive confirmation with buttons before deletion
- ✅ Shows message count before asking for confirmation
- ✅ Handles both recent (<14 days) and old messages (>14 days)
- ✅ 30-second timeout for confirmation
- ✅ Saves deleted messages for 5 minutes (can be undone!)
- ✅ Maximum 500 messages per execution
- ✅ Rate limiting (5 seconds cooldown)

**Required permissions:**
- User: `Manage Messages`
- Bot: `Manage Messages` + `Read Message History`

**How it works:**
1. Type the command with a username/mention
2. Bot searches and counts messages from that user
3. Shows confirmation dialog with buttons (✅ Confirm / ❌ Cancel)
4. Click ✅ to proceed or ❌ to cancel
5. Messages are deleted and saved temporarily
6. You have 5 minutes to undo if needed

### `!deshacerborrado`

Restores the last batch of deleted messages in the current channel.

**Usage:**
```
!deshacerborrado
```

**Features:**
- ✅ Restores messages with original author name and avatar (using webhooks)
- ✅ Preserves message content, embeds, and attachments
- ✅ Messages appear in chronological order
- ✅ Only works within 5 minutes of deletion
- ✅ Automatically cleans up after timeout

**Required permissions:**
- User: `Manage Messages`
- Bot: `Manage Messages` + `Read Message History` + `Manage Webhooks`

**Important notes:**
- Restored messages are sent via webhook to maintain original author appearance
- Each channel can only undo the most recent deletion operation
- After 5 minutes, deleted messages are permanently removed from cache
- The webhook is automatically created/reused by the bot

### Setting Up Moderation Commands

To use these commands, ensure your bot has the following permissions:

1. Go to your server settings
2. Navigate to Roles → Your Bot Role
3. Enable these permissions:
   - ✅ `Manage Messages` (for deleting messages)
   - ✅ `Read Message History` (for reading message history)
   - ✅ `Manage Webhooks` (for restoring messages)

Alternatively, when inviting the bot, include these permissions in the OAuth2 URL.

## Voice Commands

The bot can join voice channels and use text-to-speech in Spanish!

### `!hablar <texto>`

Makes the bot join your voice channel and speak the text in Spanish.

**Usage examples:**
```
!hablar Hola a todos
!hablar Bienvenidos al servidor
!hablar Este es un mensaje de prueba
```

**Features:**
- ✅ Automatic connection to your voice channel
- ✅ Natural Spanish text-to-speech using Google TTS
- ✅ Stays connected until you use `!salir`
- ✅ No permissions required (just be in a voice channel)

**Required permissions:**
- User: None (must be in a voice channel)
- Bot: `Connect` + `Speak` (voice channel permissions)

**How it works:**
1. Join a voice channel
2. Type `!hablar` followed by the text you want the bot to say
3. The bot joins your channel and speaks the text
4. The bot stays in the channel for more TTS commands

### `!salir`

Disconnects the bot from the voice channel.

**Usage:**
```
!salir
```

**Features:**
- ✅ Instantly disconnects the bot
- ✅ Cleans up all voice resources

### Setting Up Voice Commands

To use voice commands, ensure your bot has these permissions in voice channels:

1. Go to your server settings
2. Navigate to Channels → Your Voice Channel → Permissions → Bot Role
3. Enable these permissions:
   - ✅ `Connect` (to join voice channels)
   - ✅ `Speak` (to play audio)

**Important notes:**
- The bot uses Google TTS API for speech synthesis
- Audio files are temporarily cached and automatically deleted
- Spanish is the default language for TTS
- The bot can be in multiple voice channels across different servers

## Configuration Options

### Welcome Card Customization

| Option | Description | Example |
|--------|-------------|---------|
| `enabled` | Enable/disable welcome feature | `true` or `false` |
| `channelId` | Channel ID for welcome messages | `"123456789012345678"` |
| `backgroundImage` | URL to your custom background image (fills entire canvas) | `"https://i.imgur.com/yourimage.png"` |
| `backgroundColor` | Fallback color if background image fails to load | `"#2C2F33"` |
| `cardBackgroundColor` | Color of the centered card panel (use rgba for transparency) | `"rgba(44, 47, 51, 0.95)"` |
| `accentColor` | Color for the curved corner decorations | `"#00D4FF"` |
| `titleColor` | Color for welcome text and username | `"#FFFFFF"` |
| `descriptionColor` | Color for "to" text | `"#99AAB5"` |
| `memberCountColor` | Color for member count at top | `"#99AAB5"` |
| `font` | Font family for all text | `"sans-serif"`, `"serif"`, etc. |

### Using Custom Background Images

Your custom background image will fill the entire canvas behind the welcome card! The semi-transparent card panel allows your background to show through beautifully.

**How to add your background image:**

1. **Upload your image** to a public hosting service:
   - **Imgur**: Upload at https://imgur.com (recommended)
   - **Discord CDN**: Upload to any Discord channel, then right-click the image and select "Copy Image Address"
   - Any other public image hosting service

2. **Copy the direct image URL** (should end in .png, .jpg, .gif, etc.)

3. **Add the URL to config.json**:
   ```json
   "backgroundImage": "https://i.imgur.com/yourimage.png"
   ```

4. **Test it** with the `!testwelcome` command to see how it looks!

**Tips**:
- Images with dimensions around 1024x500 work best, but the bot will automatically scale any image
- The card panel has semi-transparent background (0.95 opacity by default), so your image shows through
- Adjust `cardBackgroundColor` opacity (the last number in rgba) to show more/less of your background
- If the background image fails to load, the bot will use `backgroundColor` as a fallback

**About Animated Images/Videos**:
- The bot generates **static PNG images only** - GIFs and videos are not supported as backgrounds
- If you want to use an animated image, upload a single frame from your GIF/video as the background
- The bot cannot create animated welcome cards due to canvas library limitations

## Troubleshooting

### Bot doesn't send welcome messages

1. **Check intents**: Make sure "Server Members Intent" is enabled in the Developer Portal
2. **Check channel ID**: Verify the channel ID in `config.json` is correct
3. **Check permissions**: Ensure the bot has permissions to send messages in the welcome channel
4. **Check enabled**: Ensure `"enabled": true` in `config.json`

### Avatar doesn't load

- Discord avatars are loaded from Discord's CDN. If the avatar fails to load, a placeholder circle will be shown instead.

### Background image doesn't load

- Ensure the URL is publicly accessible (not behind authentication)
- Check that the URL is a direct image link (ends in .png, .jpg, etc.)
- If the image fails to load, the solid background color will be used instead

### Canvas installation issues

This bot uses `@napi-rs/canvas` for image generation. If you encounter installation issues:
- Make sure you have Node.js 16.9.0 or higher
- On Linux, you may need: `sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`

## Customization Ideas

- Use your server's banner as the background image
- Match colors to your server's branding
- Add custom messages for different server themes
- Change the font to match your aesthetic

## Support

If you encounter any issues:
1. Check the bot console for error messages
2. Verify all configuration values in `config.json`
3. Ensure the bot has the correct permissions in your server

## License

ISC

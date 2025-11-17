# Quick Start Guide

## Adding Your Custom Background Image

Your welcome card now has a centered panel design (like the example you showed) with your custom background image showing behind it!

### Step 1: Upload Your Background Image

1. Go to https://imgur.com
2. Click "New post"
3. Upload your image (the one you want as the background)
4. After upload, right-click the image and select "Copy image address"
5. You'll get a URL like: `https://i.imgur.com/abc123.png`

### Step 2: Add the URL to config.json

Open `config.json` and paste your image URL:

```json
{
  "welcome": {
    "enabled": true,
    "channelId": "YOUR_WELCOME_CHANNEL_ID",
    "card": {
      "backgroundImage": "https://i.imgur.com/abc123.png",  👈 PASTE YOUR URL HERE
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

### Step 3: Set Up Your Bot Token

1. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Discord bot token:
   ```
   DISCORD_TOKEN=your_actual_bot_token_here
   CLIENT_ID=your_bot_client_id
   ```

### Step 4: Get Your Welcome Channel ID

1. In Discord, enable Developer Mode:
   - User Settings → Advanced → Developer Mode (toggle on)
2. Right-click the channel where you want welcome messages
3. Click "Copy Channel ID"
4. Paste it in `config.json` under `channelId`

### Step 5: Run the Bot

```bash
npm start
```

### Step 6: Test It!

In Discord, type in any channel where the bot can see messages:
```
!testwelcome
```

The bot will generate a preview of your welcome card with your background image!

## Customization Tips

### Adjust Background Visibility

Want to see MORE of your background image? Make the card more transparent:
```json
"cardBackgroundColor": "rgba(44, 47, 51, 0.7)"  // More transparent (0.7 instead of 0.95)
```

Want to see LESS of your background? Make it more opaque:
```json
"cardBackgroundColor": "rgba(44, 47, 51, 1.0)"  // Fully opaque
```

### Change Accent Color

The curved decorations in the corners can be any color:
```json
"accentColor": "#00D4FF"  // Cyan (default)
"accentColor": "#FF00FF"  // Magenta
"accentColor": "#00FF00"  // Green
"accentColor": "#FFA500"  // Orange
```

### Change Text Colors

All text colors can be customized:
```json
"titleColor": "#FFFFFF",        // Welcome message & username
"descriptionColor": "#99AAB5",  // "to" text
"memberCountColor": "#99AAB5"   // "Member #31"
```

## About Animated Backgrounds

**Question**: Can I use animated GIFs or videos as the background?

**Answer**: No, the canvas library creates static PNG images only. However, you can:
- Use a single frame from your animation as a static background
- The design will still look great with a static image!

## Need Help?

- Check the full README.md for detailed documentation
- Test your card design with `!testwelcome` before going live
- Make sure "Server Members Intent" is enabled in Discord Developer Portal

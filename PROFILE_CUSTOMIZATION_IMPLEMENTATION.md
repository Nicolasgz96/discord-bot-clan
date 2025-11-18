# Profile Customization Implementation

**Status:** ✅ **COMPLETE**
**Date:** 2025-01-18
**Features:** Custom backgrounds, colors, titles, and bios with smart URL validation and color presets

---

## Overview

The Profile Customization System allows users to personalize their Discord presence with custom backgrounds, embed colors, display titles, and personal bios.

## Features

### 1. 🖼️ Custom Backgrounds
- Set custom background images for welcome cards and profiles
- **Smart validation:** Supports Imgur, Discord CDN, and common image formats
- **Auto-scaling:** Images stretched to fit canvas (1024x500px)
- **Priority system:** Custom background > config background > solid color

**Supported:**
- Direct image URLs (.jpg, .jpeg, .png, .gif, .webp)
- Imgur links (i.imgur.com)
- Discord CDN (cdn.discordapp.com, media.discordapp.net)

### 2. 🎨 Custom Embed Colors
- Set custom hex colors for profile embeds
- **10 color presets** with samurai-themed names
- Hex validation (#RRGGBB format)
- Applies to all profile-related embeds

**Color Presets:**
- `fuego` (#FF5733) - Fuego Samurai
- `oceano` (#0077BE) - Océano Pacífico
- `bosque` (#228B22) - Bosque de Bambú
- `sakura` (#FFB7C5) - Flor de Cerezo
- `noche` (#191970) - Noche Estrellada
- `oro` (#FFD700) - Oro Imperial
- `sangre` (#8B0000) - Sangre del Dragón
- `jade` (#00A86B) - Jade Místico
- `purpura` (#9932CC) - Púrpura Real
- `plata` (#C0C0C0) - Plata Lunar

### 3. 👑 Display Titles
- Set visible titles from unlocked achievements
- **Auto-includes rank titles:**
  - Ronin → "Guerrero Errante"
  - Samurai → "Guerrero del Dojo"
  - Daimyo → "Señor Feudal"
  - Shogun → "Comandante Supremo"
- Shows in profile embeds and commands
- Must have unlocked title to use it

### 4. 📝 Personal Bio
- Set a personal biography (max 100 characters)
- **Content filtering:** No links or inappropriate content
- Displays in profile views
- Character counter

---

## Commands

### `/perfil fondo <url>`
Set custom profile background.

**Parameters:**
- `url` (required): Direct URL to image

**Validation:**
- Must be HTTP/HTTPS
- Must end in .jpg/.jpeg/.png/.gif/.webp OR be from trusted domain
- Trusted domains: Imgur, Discord CDN

**Example:**
```
/perfil fondo url:https://i.imgur.com/abc123.png
```

**Response:** Embed with image preview showing new background.

---

### `/perfil color <codigo>`
Set custom embed color.

**Parameters:**
- `codigo` (required): Hex code (#FF5733) or preset name (fuego, oceano, etc.)

**Validation:**
- Hex format: #RRGGBB
- Preset names: case-insensitive

**Examples:**
```
/perfil color codigo:#FF5733
/perfil color codigo:fuego
```

**Response:** Embed displayed in new color.

---

### `/perfil titulo <titulo>`
Set display title.

**Parameters:**
- `titulo` (required): Title name (must be unlocked)

**Validation:**
- Must be in userData.titles array
- Rank-based titles auto-available

**Example:**
```
/perfil titulo titulo:Campeón del Torneo
```

**Response:** Shows new display name format: "Username • Title"

---

### `/perfil bio <texto>`
Set personal biography.

**Parameters:**
- `texto` (required): Bio text (1-100 characters)

**Validation:**
- Min 1 character, max 100
- No links (http://, https://, discord.gg/)

**Example:**
```
/perfil bio texto:Guerrero del Dojo desde 2025 🗡️
```

**Response:** Embed showing new bio with character count.

---

### `/perfil ver`
View current customization.

**No Parameters**

**Shows:**
- Current background (or "Por defecto")
- Current embed color
- Current display title (or "Ninguno")
- Current bio (or "Sin biografía")
- List of available titles
- Background image preview (if custom)

**Example:**
```
/perfil ver
```

---

### `/perfil colores`
View available color presets.

**No Parameters**

**Shows:** All 10 color presets with:
- Preset name (Spanish)
- Preset key (command usage)
- Hex color code

**Example:**
```
/perfil colores
```

---

### `/perfil reiniciar <tipo>`
Reset customization.

**Parameters:**
- `tipo` (required): What to reset

**Options:**
- `background` - Reset to default background
- `color` - Reset to default color (#00D4FF)
- `title` - Remove display title
- `bio` - Remove biography
- `all` - Reset everything

**Example:**
```
/perfil reiniciar tipo:all
```

---

## Data Structure

### User Customization Object
**Location:** `data/users.json` → `userData.customization`

```javascript
{
  "userId": "discord_user_id",
  "guildId": "discord_guild_id",
  // ... other user data ...
  "customization": {
    "backgroundUrl": "https://i.imgur.com/abc123.png",
    "embedColor": "#FF5733",
    "displayTitle": "Campeón del Torneo",
    "bio": "Guerrero del Dojo desde 2025"
  },
  "titles": [
    "Guerrero del Dojo",
    "Campeón del Torneo",
    "Shogun Supremo"
  ]
}
```

---

## Architecture

### Profile Customization Manager (`utils/profileCustomization.js`)
**Size:** 319 lines

**Validation Functions:**
- `isValidImageUrl(url)` - Validates image URLs
- `isValidHexColor(color)` - Validates hex colors
- `isValidBio(bio)` - Validates biography text

**Title Management:**
- `getAvailableTitles(userData)` - Returns unlocked titles + rank title

**Setters:**
- `setCustomBackground(userData, imageUrl)` - Set background
- `setCustomColor(userData, hexColor)` - Set embed color
- `setDisplayTitle(userData, title)` - Set display title
- `setBio(userData, bio)` - Set biography
- `resetCustomization(userData, type)` - Reset customization

**Getters:**
- `getCustomizationSummary(userData)` - Get complete customization info
- `applyCustomizationToEmbed(embed, userData)` - Apply custom color to embed
- `getDisplayNameWithTitle(username, userData)` - Format name with title

**Color Presets:**
- `COLOR_PRESETS` - Object with 10 presets
- `getColorPreset(presetName)` - Get preset by name
- `getAllColorPresets()` - Get all presets

---

## Integration with Existing Systems

### Welcome Card System
**File:** `utils/welcomeCard.js`

**Changes:**
1. `createWelcomeCard(member, userData)` - Added userData parameter
2. `drawBackground(ctx, cardConfig, customBackground)` - Added custom background support

**Priority:**
```
Custom Background > Config Background > Solid Color
```

**When user joins:**
1. Get userData from dataManager
2. Check for customization.backgroundUrl
3. If exists, use custom background
4. If fails to load, fall back to config background
5. If that fails, use solid color

### Guild Member Add Event
**File:** `events/guildMemberAdd.js`

**Changes:**
1. Accept dataManager in dependencies
2. Get userData before creating welcome card
3. Pass userData to createWelcomeCard

**Flow:**
```javascript
async execute(member, { config, dataManager }) {
  const userData = dataManager.getUser(member.id, member.guild.id);
  const attachment = await createWelcomeCard(member, userData);
  // ... send welcome message
}
```

### Profile Commands
All profile-related commands (if created in future) can use:
- `profileCustomization.applyCustomizationToEmbed()` - Apply custom color
- `profileCustomization.getDisplayNameWithTitle()` - Show title in embeds

---

## Validation Rules

### Background URL Validation
```javascript
✅ VALID:
- https://i.imgur.com/abc123.png
- https://cdn.discordapp.com/attachments/.../image.jpg
- https://example.com/photo.jpeg

❌ INVALID:
- http://insecure-site.com/image.png (HTTP not allowed)
- ftp://ftp.example.com/image.png (only HTTP/HTTPS)
- https://example.com/file.pdf (not an image extension)
- https://untrusted.com/image (no extension + not trusted domain)
```

### Hex Color Validation
```javascript
✅ VALID:
- #FF5733
- #000000
- #FFFFFF
- #00D4FF

❌ INVALID:
- FF5733 (missing #)
- #FF57 (too short)
- #GG5733 (invalid hex characters)
- rgb(255, 87, 51) (not hex format)
```

### Bio Validation
```javascript
✅ VALID:
- "Guerrero del Dojo desde 2025"
- "Fan de Minecraft y Discord 🎮"
- 100 characters or less

❌ INVALID:
- "" (empty)
- "Check out my server discord.gg/abc123" (contains link)
- "Visit http://example.com" (contains link)
- "This bio is way too long..." (>100 characters)
```

---

## Example Usage

### Set Custom Background
```
User: /perfil fondo url:https://i.imgur.com/castle.png

Bot Response:
✅ Fondo Actualizado

Tu fondo de perfil ha sido cambiado.

Vista previa:
[Shows image]

El fondo se mostrará en tu tarjeta de bienvenida y perfil
```

### Set Color with Preset
```
User: /perfil color codigo:fuego

Bot Response:
✅ Color Actualizado

Tu color de embeds ha sido cambiado.

Nuevo color: #FF5733
Este embed muestra tu nuevo color.

[Embed is displayed in red/orange color]
```

### Set Display Title
```
User: /perfil titulo titulo:Campeón del Torneo

Bot Response:
[Author shows: JohnDoe • Campeón del Torneo]

✅ Título Actualizado

Tu título visible ha sido actualizado.

Nuevo título: Campeón del Torneo

Ahora se mostrará en tus perfiles y comandos.
```

### View Customization
```
User: /perfil ver

Bot Response:
[Author: JohnDoe • Campeón del Torneo]

🎨 Tu Personalización

🖼️ Fondo de Perfil: [Ver imagen]
🎨 Color de Embeds: #FF5733
👑 Título Visible: Campeón del Torneo

📝 Biografía
Guerrero del Dojo desde 2025

🏆 Títulos Disponibles
• Guerrero del Dojo
• Campeón del Torneo
• Shogun Supremo
• El Insomne
• Arquitecto Legendario

[Shows background image]
```

---

## Testing Checklist

### Commands
- [ ] `/perfil fondo` - Sets background successfully
- [ ] `/perfil color` - Sets color with hex code
- [ ] `/perfil color` - Sets color with preset name
- [ ] `/perfil titulo` - Sets title from available titles
- [ ] `/perfil bio` - Sets bio with valid text
- [ ] `/perfil ver` - Shows current customization
- [ ] `/perfil colores` - Lists all color presets
- [ ] `/perfil reiniciar` - Resets specific customization
- [ ] `/perfil reiniciar tipo:all` - Resets everything

### Validation
- [ ] Invalid image URL rejected
- [ ] Non-image URL rejected (PDFs, etc.)
- [ ] Invalid hex color rejected
- [ ] Bio with links rejected
- [ ] Bio >100 characters rejected
- [ ] Non-unlocked title rejected

### Integration
- [ ] Custom background shows in welcome card
- [ ] Welcome card falls back if custom background fails
- [ ] Custom color applies to profile embeds
- [ ] Display title shows in embeds
- [ ] Rank-based titles auto-available

### Edge Cases
- [ ] New user has no customization (uses defaults)
- [ ] Invalid image URL falls back gracefully
- [ ] Resetting non-existent customization doesn't error
- [ ] Setting title to null removes it
- [ ] Color presets are case-insensitive

---

## Files Modified

### New Files
1. `utils/profileCustomization.js` (319 lines)
   - Complete customization manager
   - Validation functions
   - Color presets

2. `PROFILE_CUSTOMIZATION_IMPLEMENTATION.md` (this file)
   - Complete documentation

### Modified Files
1. `commands/definitions.js`
   - Added `/perfil` command with 7 subcommands
   - Lines 695-770

2. `index.js`
   - Added `/perfil` command handlers (all 7 subcommands)
   - Lines 4516-4766

3. `utils/welcomeCard.js`
   - Added userData parameter to createWelcomeCard
   - Added customBackground parameter to drawBackground
   - Custom background support with fallback chain
   - Lines 40, 76-78

4. `events/guildMemberAdd.js`
   - Accept dataManager in dependencies
   - Get userData before creating welcome card
   - Pass userData to createWelcomeCard
   - Lines 14, 81-84

---

## Known Limitations

1. **No Image Validation:** URLs not checked for actual image content (relies on extension/domain)
2. **No Image Size Limit:** Large images may cause slow loading
3. **No Image Moderation:** No automatic NSFW/inappropriate content detection
4. **Single Background:** Cannot set different backgrounds for different contexts
5. **No Color Picker UI:** Users must know hex codes or preset names

---

## Future Enhancements

1. **Image Hosting Integration:**
   - Upload images directly to bot
   - Store in Discord CDN or Imgur
   - Automatic resizing/optimization

2. **Profile Gallery:**
   - View other users' customizations
   - Profile showcase command
   - Top customized profiles leaderboard

3. **Premium Backgrounds:**
   - Unlock special backgrounds with koku
   - Exclusive backgrounds for achievements
   - Animated backgrounds (GIFs)

4. **Color Themes:**
   - Full theme presets (not just single color)
   - Gradient support
   - Seasonal themes

5. **Advanced Customization:**
   - Font selection
   - Text shadow/glow effects
   - Border styles
   - Badge placement

---

**Implementation Complete:** 2025-01-18
**Total Lines Added:** ~1,100 lines
**Commands Added:** 7 slash subcommands
**Color Presets:** 10 samurai-themed colors
**Validation:** Smart URL, hex, and bio validation

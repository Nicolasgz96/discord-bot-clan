# 🎌 Tutorial Completo: Demon Hunter Bot

## 📖 ¿Qué es este bot?

**Demon Hunter** es un bot de Discord con temática samurái que convierte tu servidor en un **dojo virtual** donde los usuarios pueden:

- 🏆 **Ganar honor** y subir de rango (como en un videojuego)
- 💰 **Ganar koku** (moneda virtual) y comprar items
- 🏯 **Crear o unirse a clanes** y competir con otros grupos
- ⚔️ **Desafiar a duelos** con otros usuarios
- 📊 **Ver rankings** y competir por ser el mejor
- 🎁 **Reclamar recompensas diarias** con bonos por racha

**En resumen:** Es como un mini-juego dentro de Discord donde ganas puntos (honor) y dinero (koku) por participar en el servidor.

---

## 🚀 Cómo Empezar

### Paso 1: Ver los Comandos Disponibles

Escribe en cualquier canal:
```
/help
```

Esto te mostrará todos los comandos disponibles organizados por categorías.

### Paso 2: Ver tu Perfil

Para ver tu honor, koku y estadísticas:
```
/perfil
```

O también puedes usar:
```
/honor
```

### Paso 3: Reclamar tu Primera Recompensa Diaria

Cada día puedes reclamar koku gratis:
```
/daily
```

**💡 Tip:** Entre más días seguidos reclames, más koku recibes (sistema de racha).

---

## 🎮 Sistemas Principales del Bot

### 1️⃣ Sistema de Honor y Rangos ⭐

**¿Qué es el honor?**
El honor son puntos que ganas por participar en el servidor. Entre más honor tengas, más alto será tu rango.

**¿Cómo gano honor?**
- 📝 **Escribiendo mensajes:** +5 honor por cada mensaje (hasta 50 por día)
- 🎤 **Estar en voz:** +1 honor por minuto en canal de voz
- 📅 **Recompensa diaria:** Bonus de honor según tu rango
- ⚔️ **Ganar duelos:** +50 honor por victoria

**Rangos Disponibles:**
1. 🥷 **Ronin** (0-499 honor) - Rango inicial
2. ⚔️ **Samurai** (500-1,999 honor) - Puedes unirte a clanes
3. 👑 **Daimyo** (2,000-4,999 honor) - Puedes crear clanes
4. 🏯 **Shogun** (5,000+ honor) - Rango máximo

**Comandos de Honor:**
```
/honor              → Ver tu honor y progreso hacia el siguiente rango
/honor @usuario     → Ver el honor de otro usuario
/rango              → Ver información detallada de todos los rangos
/top                → Ver el ranking de los 10 mejores del servidor
```

**Ejemplo:**
```
Usuario: /honor
Bot: ⭐ Tienes 1,250 honor. Rango: Samurai
     Progreso hacia Daimyo: 750/1,500 honor restantes
     [Barra visual de progreso]
```

---

### 2️⃣ Sistema de Economía (Koku) 💰

**¿Qué es el koku?**
El koku (古) es la moneda virtual del bot. La usas para comprar items en la tienda.

**¿Cómo gano koku?**
- 📝 **Escribiendo mensajes:** +2 koku por minuto
- 🎤 **Estar en voz:** +5 koku cada 10 minutos
- 📅 **Recompensa diaria:** 100-300 koku base (más con racha)
- 💸 **Transferencias:** Otros usuarios pueden enviarte koku

**Comandos de Economía:**
```
/daily              → Reclamar recompensa diaria (cada 24 horas)
/balance            → Ver tu koku, honor y racha actual
/pay @usuario 100   → Enviar 100 koku a otro usuario
/leaderboard        → Ver rankings de honor, koku y rachas
```

**Sistema de Rachas (Streaks):**
Si reclamas tu recompensa diaria todos los días seguidos:
- 7 días: +50% bonus
- 14 días: +100% bonus
- 30 días: +200% bonus
- 90 días: +400% bonus

**⚠️ Importante:** Si pasas más de 48 horas sin reclamar, tu racha se reinicia.

**Ejemplo de uso:**
```
Usuario: /daily
Bot: ✅ ¡Recompensa diaria reclamada!
     💰 +150 koku (base: 100 + racha 7 días: +50%)
     🔥 Racha: 7 días consecutivos
```

---

### 3️⃣ Sistema de Clanes 🏯

**¿Qué es un clan?**
Un clan es un grupo de usuarios que trabajan juntos. Los clanes tienen niveles y pueden competir entre sí.

**¿Cómo funciona?**
- Los clanes ganan honor sumando el honor de todos sus miembros
- Entre más honor tenga el clan, más alto será su nivel
- Los clanes de nivel alto pueden tener más miembros

**Niveles de Clanes:**
1. **Clan Ronin** (0 honor) - 5 miembros máximo
2. **Clan Samurai** (5,000 honor) - 10 miembros máximo
3. **Clan Daimyo** (15,000 honor) - 15 miembros máximo
4. **Clan Shogun** (30,000 honor) - 20 miembros máximo
5. **Clan Legendario** (50,000+ honor) - 25 miembros máximo

**Comandos de Clanes:**
```
/clan crear Nombre TAG    → Crear un nuevo clan (cuesta 5,000 koku, requiere rango Daimyo)
/clan info [nombre]        → Ver información de un clan
/clan unirse Nombre       → Unirse a un clan existente
/clan salir               → Salir de tu clan actual
/clan miembros            → Ver lista de miembros de tu clan
/clan top                 → Ver ranking de clanes del servidor
/clan invitar @usuario    → Invitar a alguien a tu clan (solo líder)
/clan expulsar @usuario   → Expulsar a alguien de tu clan (solo líder)
```

**Ejemplo de creación:**
```
Usuario: /clan crear GuerrerosDelDojo DOJO
Bot: ✅ ¡Clan "GuerrerosDelDojo" [DOJO] creado exitosamente!
     💰 Costo: 5,000 koku
     👑 Eres el líder del clan
```

**💡 Tip:** Si eres el líder y te sales del clan, el liderazgo se transfiere automáticamente al miembro con más honor.

---

### 4️⃣ Sistema de Duelos ⚔️

**¿Qué es un duelo?**
Un duelo es un combate entre dos usuarios donde apuestan honor. El ganador gana honor y el perdedor lo pierde.

**¿Cómo funciona?**
1. Un usuario desafía a otro con una apuesta de honor (10-500 honor)
2. El oponente recibe una invitación en su mensaje privado
3. Si acepta, ambos eligen un arma (Katana, Wakizashi o Tanto)
4. El sistema determina el ganador según las reglas del juego de piedra-papel-tijera
5. El ganador recibe el honor apostado, el perdedor lo pierde

**Reglas de las Armas:**
- ⚔️ **Katana** vence a 🔪 **Tanto**
- 🔪 **Tanto** vence a 🗡️ **Wakizashi**
- 🗡️ **Wakizashi** vence a ⚔️ **Katana**
- Si ambos eligen la misma arma: **Empate** (nadie gana ni pierde)

**Comandos de Duelos:**
```
/duelo @usuario 50    → Desafiar a alguien apostando 50 honor
```

**Ejemplo de flujo completo:**
```
Usuario A: /duelo @UsuarioB 100
Bot (público): ⚔️ UsuarioA ha desafiado a UsuarioB a un duelo
              Apuesta: 100 honor

Bot (DM a UsuarioB): ⚔️ UsuarioA te ha desafiado a un duelo
                     Apuesta: 100 honor
                     [Botones: ✅ Aceptar | ❌ Rechazar]

UsuarioB: [Clic en Aceptar]
Bot: ¡El duelo ha comenzado! Elige tu arma:
     [Botones: ⚔️ Katana | 🗡️ Wakizashi | 🔪 Tanto]

UsuarioA elige: ⚔️ Katana
UsuarioB elige: 🔪 Tanto

Bot: 🏆 UsuarioA ha vencido a UsuarioB!
     ⚔️ Katana vence a 🔪 Tanto
     ✅ UsuarioA gana +100 honor
     ❌ UsuarioB pierde -100 honor
```

**⚠️ Importante:**
- Necesitas tener suficiente honor para apostar
- El oponente también debe tener suficiente honor
- Tienes 30 segundos para aceptar/rechazar
- Tienes 30 segundos para elegir tu arma
- Si no respondes a tiempo, el duelo se cancela

---

### 5️⃣ Sistema de Tienda 🏪

**¿Qué es la tienda?**
La tienda es donde puedes gastar tu koku comprando items útiles.

**Tipos de Items:**
1. **⚡ Boosts Temporales** - Mejoran tus ganancias por tiempo limitado
2. **🎨 Items Cosméticos** - Para personalizar tu perfil
3. **⭐ Items Permanentes** - Mejoras que duran para siempre

**Comandos de Tienda:**
```
/tienda ver              → Ver todos los items disponibles
/tienda comprar item_id  → Comprar un item específico
/tienda inventario       → Ver tus items comprados
```

**💡 Tip:** La tienda es interactiva. Puedes hacer clic en los botones para cambiar de categoría y seleccionar items del menú desplegable.

**Ejemplo:**
```
Usuario: /tienda ver
Bot: [Muestra la tienda con botones y menú desplegable]
     💰 Tu balance: 1,500 koku
     
Usuario: [Selecciona "Boost de Honor x2 (24h)" del menú]
Bot: ✅ ¡Compra exitosa! Has activado Boost de Honor x2 por 24 horas.
     💰 Koku restante: 750 koku
```

---

### 6️⃣ Otros Comandos Útiles 🛠️

**Comandos de Utilidad:**
```
/traducir español "Hello"    → Traduce texto entre español, japonés e inglés
/sabiduria                   → Muestra una cita aleatoria de sabiduría samurái
/fortuna                     → Consulta tu fortuna del día (omikuji)
```

**Comandos de Voz (TTS):**
```
/join                        → El bot se une a tu canal de voz y lee mensajes automáticamente
/hablar Hola mundo           → El bot habla el texto en español
/salir                       → El bot sale del canal de voz
```

**💡 Tip:** Cuando el bot está en voz con `/join`, lee automáticamente todos los mensajes del chat de texto asociado al canal de voz.

---

## 📍 Canales Específicos

El servidor puede tener canales dedicados para diferentes tipos de comandos:

### ⛩️ Canal de Comandos Generales
Aquí se usan comandos de:
- Honor (`/honor`, `/rango`, `/top`)
- Economía (`/daily`, `/balance`, `/pay`, `/leaderboard`)
- Clanes (`/clan`)

### 🏪 Canal de Tienda
Aquí se usan comandos de:
- Tienda (`/tienda ver`, `/tienda comprar`, `/tienda inventario`)

### ⚔️ Canal de Combate
Aquí se usan comandos de:
- Duelos (`/duelo`)
- Juegos (`/sabiduria`, `/fortuna`)
- Perfil (`/perfil`)

**💡 Tip:** Si intentas usar un comando en el canal equivocado, el bot te dirá en qué canal debes usarlo.

---

## 🎯 Consejos para Principiantes

### 1. **Reclama tu recompensa diaria todos los días**
```
/daily
```
Esto te da koku gratis y mantiene tu racha activa para bonos mayores.

### 2. **Participa activamente en el servidor**
- Escribe mensajes para ganar honor y koku
- Únete a canales de voz para ganar más honor
- Interactúa con otros usuarios

### 3. **Únete a un clan**
Los clanes te permiten:
- Competir con otros grupos
- Ver estadísticas de tu equipo
- Participar en rankings de clanes

### 4. **Ahorra koku para items útiles**
Los boosts temporales pueden ayudarte a ganar más honor más rápido.

### 5. **Desafía a duelos estratégicamente**
- Solo apuesta honor que puedas permitirte perder
- Estudia las reglas de las armas antes de elegir
- Acepta duelos cuando tengas tiempo para responder

### 6. **Revisa tu perfil regularmente**
```
/perfil
```
Esto te muestra:
- Tu honor y progreso
- Tu koku disponible
- Tu racha diaria
- Tus estadísticas de duelos
- Tu clan (si estás en uno)

---

## ❓ Preguntas Frecuentes (FAQ)

### ¿Puedo perder honor?
Sí, puedes perder honor si:
- Pierdes un duelo (pierdes el honor apostado)
- Tienes mala fortuna del día (penalización temporal)

### ¿Qué pasa si me salgo del servidor?
Tu honor, koku y estadísticas se guardan. Si vuelves, todo estará igual.

### ¿Puedo tener más de un clan?
No, solo puedes estar en un clan a la vez. Debes salir de uno antes de unirte a otro.

### ¿Cómo gano más honor rápido?
1. Reclama tu recompensa diaria todos los días
2. Escribe mensajes activamente
3. Únete a canales de voz
4. Gana duelos
5. Compra boosts en la tienda

### ¿Qué pasa si no reclamo mi recompensa diaria?
Si pasas más de 48 horas sin reclamar, tu racha se reinicia a 0. Pero puedes seguir reclamando normalmente.

### ¿Puedo transferir honor a otros usuarios?
No, el honor no se puede transferir. Solo el koku se puede transferir con `/pay`.

### ¿Cómo veo quién tiene más honor en el servidor?
Usa `/top` para ver el ranking de los 10 mejores, o `/leaderboard` para ver rankings más detallados.

### ¿Qué pasa si el líder del clan se va?
El liderazgo se transfiere automáticamente al miembro con más honor del clan.

---

## 🎮 Ejemplo de Sesión Completa

Aquí tienes un ejemplo de cómo usar el bot en una sesión típica:

```
1. Al entrar al servidor:
   /perfil
   → Ver tu estado actual

2. Reclamar recompensa diaria:
   /daily
   → Obtener koku y mantener racha

3. Ver tu progreso:
   /honor
   → Ver cuánto honor necesitas para subir de rango

4. Ver rankings:
   /leaderboard
   → Ver cómo estás comparado con otros

5. Si tienes suficiente koku:
   /tienda ver
   → Ver items disponibles y comprar algo útil

6. Desafiar a un amigo:
   /duelo @amigo 50
   → Divertirse con un duelo

7. Si estás en un clan:
   /clan miembros
   → Ver quién está en tu clan

8. Al final del día:
   /balance
   → Ver cuánto koku y honor ganaste hoy
```

---

## 🆘 ¿Necesitas Ayuda?

Si tienes problemas o preguntas:

1. **Usa el comando de ayuda:**
   ```
   /help
   ```

2. **Revisa tu perfil:**
   ```
   /perfil
   ```
   Esto te muestra tu estado actual y puede ayudarte a entender qué está pasando.

3. **Lee los mensajes de error:**
   El bot ahora tiene mensajes de error muy específicos que te explican exactamente qué salió mal y cómo solucionarlo.

4. **Pregunta:**
   Si algo no funciona, pregunta alguien de seguro te ayudara :D

---

## 🎉 ¡Disfruta del Bot!

El bot está diseñado para ser divertido y fácil de usar. No necesitas ser experto en Discord. Solo participa en el servidor, usa los comandos y diviértete ganando honor y koku.

**¡Que el honor te guíe, guerrero!** ⚔️




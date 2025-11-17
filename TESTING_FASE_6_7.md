# TESTING RÁPIDO - FASE 6 y 7

## COMANDOS A PROBAR

### 1. /duelo - Sistema de Combate PvP

**Casos de Prueba:**

```bash
# Test básico
/duelo oponente:@amigo apuesta:50

# Test con apuesta mínima
/duelo oponente:@amigo apuesta:10

# Test con apuesta máxima
/duelo oponente:@amigo apuesta:500

# Test: No puedes desafiarte a ti mismo
/duelo oponente:@ti_mismo apuesta:50
# Esperado: "No puedes desafiarte a ti mismo, guerrero."

# Test: No puedes desafiar al bot
/duelo oponente:@Demon_Hunter apuesta:50
# Esperado: "No puedes desafiar al maestro del dojo."

# Test: Apuesta inválida (menor a 10)
/duelo oponente:@amigo apuesta:5
# Esperado: Discord no permitirá valores menores a 10

# Test: Apuesta inválida (mayor a 500)
/duelo oponente:@amigo apuesta:1000
# Esperado: Discord no permitirá valores mayores a 500

# Test: Honor insuficiente
# 1. Verifica tu honor con /perfil
# 2. Si tienes menos de 50, intenta /duelo oponente:@amigo apuesta:50
# Esperado: "No tienes suficiente honor para apostar."

# Test: Cooldown
/duelo oponente:@amigo apuesta:50
# Espera respuesta, luego inmediatamente:
/duelo oponente:@otro_amigo apuesta:50
# Esperado: "Tu katana debe descansar. Vuelve en X segundos, samurái."
```

**Flujo Completo:**
1. Usuario A ejecuta `/duelo oponente:@B apuesta:100`
2. Usuario B recibe invitación con botones [⚔️ Aceptar] [❌ Rechazar]
3. Usuario B clickea "Aceptar"
4. Aparecen 3 botones de armas para AMBOS usuarios
5. Usuario A elige ⚔️ Katana (mensaje ephemeral)
6. Usuario B elige 🔪 Tanto (mensaje ephemeral)
7. Sistema calcula ganador: Katana vence a Tanto
8. Usuario A gana 100 honor, Usuario B pierde 100 honor
9. Estadísticas actualizadas automáticamente

**Verificación:**
```bash
# Antes del duelo
/perfil
# Anota: honor, duelsWon, duelsLost, duelsTotal

# Después del duelo
/perfil
# Verifica:
# - Honor cambió (+100 o -100)
# - duelsWon incrementó (ganador)
# - duelsLost incrementó (perdedor)
# - duelsTotal incrementó (ambos)
```

---

### 2. /sabiduria - Citas de Maestros

**Casos de Prueba:**

```bash
# Test básico (ejecutar varias veces)
/sabiduria
/sabiduria
/sabiduria
/sabiduria
/sabiduria

# Verifica que muestra citas diferentes cada vez (aleatorias)
```

**Verificación:**
- ✅ Embed con título "📜 Sabiduría Samurai"
- ✅ Cita entre comillas y con formato itálica
- ✅ Autor mostrado con "— **Nombre**"
- ✅ Footer con "Palabras de los grandes maestros"
- ✅ Timestamp actual
- ✅ No hay cooldown (puedes usar varias veces seguidas)

**Autores Esperados:**
- Miyamoto Musashi
- Hagakure
- Sun Tzu
- Bushido
- Proverbio Japonés

---

### 3. /fortuna - Omikuji Diario

**Casos de Prueba:**

```bash
# Test primera vez del día
/fortuna
# Esperado: Te asigna una fortuna aleatoria

# Test segunda vez (inmediatamente después)
/fortuna
# Esperado: "Ya has consultado tu fortuna hoy. Vuelve en Xh Xm."

# Test después de 24 horas
# Espera 24 horas (o modifica el cooldown en constants.js temporalmente)
/fortuna
# Esperado: Nueva fortuna asignada
```

**Tipos de Fortuna (probabilidades):**
- 🌸 **Dai-kichi** (10%) - +20% honor por 24h
- ⭐ **Kichi** (30%) - +10% honor por 24h
- 🌑 **Chukichi** (40%) - Sin bonus
- ⚠️ **Kyo** (20%) - -10% honor por 24h

**Verificación del Bonus (NOTA: NO IMPLEMENTADO AÚN):**
```bash
# 1. Consulta fortuna
/fortuna

# 2. Si obtienes Dai-kichi (+20%), verifica:
/perfil
# Anota tu honor actual

# 3. Gana honor de alguna forma (enviar mensajes, estar en voz, etc.)
# Esperado: Deberías ganar 20% más de honor
# Ejemplo: Si ganas 5 honor por mensaje, deberías ganar 6 (5 * 1.2)

# IMPORTANTE: Este bonus NO está implementado aún
# Será parte de FASE 8 cuando se optimice el sistema
```

**Verificación en Perfil:**
```bash
# Después de consultar fortuna
/perfil
# Verifica:
# - Campo "🎴 Fortuna Actual" muestra tu fortuna
# - Ejemplo: "🌸 Dai-kichi (+20% honor)"
```

---

### 4. /perfil - Perfil Completo

**Casos de Prueba:**

```bash
# Test tu propio perfil
/perfil

# Test perfil de otro usuario
/perfil usuario:@amigo

# Test perfil de usuario sin datos (usuario nuevo)
/perfil usuario:@usuario_nuevo
# Esperado: Muestra datos por defecto (0 honor, Ronin, etc.)
```

**Información Mostrada:**
```
📜 Perfil de [Usuario]

⭐ Honor
**X** puntos
🥷 Rango: **Ronin/Samurai/Daimyo/Shogun**

💰 Koku
**X** monedas

🔥 Racha Daily
**X** días

📊 Estadísticas
💬 Mensajes: **X**
🎤 Tiempo en voz: **X** min
⚔️ Duelos: **X**W / **X**L (X total)

🏯 Clan
🏯 **[Nombre]** [TAG]  (o "Sin clan")

🎴 Fortuna Actual
🌸 Dai-kichi (+20% honor)  (o "No consultada hoy")
```

**Verificación:**
- ✅ Avatar del usuario como thumbnail
- ✅ Todos los campos presentes
- ✅ Estadísticas correctas
- ✅ Clan mostrado si tiene uno
- ✅ Fortuna mostrada si fue consultada hoy (y no expiró)

---

### 5. /traducir - Sistema de Traducción

**Casos de Prueba:**

```bash
# Español a Japonés
/traducir idioma:japonés texto:Hola, guerrero samurai
# Esperado: こんにちは、侍戦士

# Inglés a Español
/traducir idioma:español texto:Hello warrior
# Esperado: Hola guerrero

# Español a Inglés
/traducir idioma:inglés texto:Bienvenido al dojo
# Esperado: Welcome to the dojo

# Japonés a Español
/traducir idioma:español texto:こんにちは
# Esperado: Hola

# Test cooldown
/traducir idioma:español texto:Test 1
# Inmediatamente después:
/traducir idioma:español texto:Test 2
# Esperado: "Tu katana debe descansar. Vuelve en 5 segundos, samurái."

# Test texto muy largo (más de 500 caracteres)
/traducir idioma:español texto:[pega un texto de 501+ caracteres]
# Esperado: "El texto es demasiado largo. Máximo 500 caracteres."
```

**Formato de Salida:**
```
🌐 Traducción: Auto-detectado → [Idioma Destino]

📜 Original
```
[Texto original]
```

🇪🇸/🇯🇵/🇬🇧 Traducido
```
[Texto traducido]
```

🎌 Código Bushido • Demon Hunter
```

**Verificación:**
- ✅ Bandera correcta según idioma
- ✅ Traducción correcta
- ✅ Formato con bloques de código
- ✅ Cooldown de 5 segundos funciona

---

## TESTING COMBINADO

### Escenario 1: Nueva Cuenta
```bash
1. Usuario nuevo se une al servidor
2. Recibe tarjeta de bienvenida automática
3. /perfil  # Verifica datos iniciales (0 honor, Ronin)
4. /sabiduria  # Lee cita inspiradora
5. /fortuna  # Consulta fortuna del día
6. Envía 5 mensajes en chat (gana 25 honor, 10 koku)
7. /perfil  # Verifica honor = 25, koku = 10, mensajes = 5
8. /duelo oponente:@amigo apuesta:10  # Primer duelo
```

### Escenario 2: Jugador Experimentado
```bash
1. /perfil  # Verifica estadísticas actuales
2. /fortuna  # Consulta fortuna si no lo hizo hoy
3. /top  # Verifica ranking de honor
4. /duelo oponente:@rival apuesta:100  # Duelo por honor alto
5. (Si gana) /perfil  # Verifica nuevo honor y stats
6. /clan info  # Verifica su clan
7. /traducir idioma:japonés texto:Mi clan es el mejor
```

### Escenario 3: Multilingüe
```bash
1. /traducir idioma:japonés texto:El camino del samurái
2. (Copia la traducción japonesa)
3. /traducir idioma:español texto:[pega texto japonés]
4. Verifica que la traducción de vuelta sea correcta
```

---

## CHECKLIST DE FUNCIONALIDAD

### Sistema de Duelos
- [ ] Invitación enviada correctamente
- [ ] Botones de aceptar/rechazar funcionan
- [ ] Timeout de 30 segundos funciona
- [ ] Botones de selección de arma aparecen
- [ ] Ambos usuarios pueden elegir arma
- [ ] Mecánica de combate correcta (Katana > Tanto, etc.)
- [ ] Empates detectados correctamente
- [ ] Honor actualizado (ganador +X, perdedor -X)
- [ ] Estadísticas actualizadas (duelsWon, duelsLost, duelsTotal)
- [ ] Clanes actualizados si pertenecen a uno
- [ ] Cooldown de 60 segundos funciona
- [ ] Validaciones funcionan (no duelo a sí mismo, no al bot, honor suficiente)

### Sistema de Sabiduría
- [ ] Citas aleatorias
- [ ] Formato correcto del embed
- [ ] Autores correctos
- [ ] Sin cooldown (puede usarse varias veces)

### Sistema de Fortuna
- [ ] Fortuna asignada aleatoriamente
- [ ] Probabilidades correctas (10%, 30%, 40%, 20%)
- [ ] Cooldown de 24 horas funciona
- [ ] Fortuna guardada en userData
- [ ] Fortuna visible en /perfil
- [ ] Bonus NO aplicado aún (pendiente FASE 8)

### Sistema de Perfiles
- [ ] Muestra datos propios correctamente
- [ ] Muestra datos de otros usuarios
- [ ] Todos los campos presentes
- [ ] Avatar mostrado
- [ ] Clan mostrado si tiene
- [ ] Fortuna mostrada si fue consultada hoy
- [ ] Estadísticas de duelos correctas

### Sistema de Traducción
- [ ] Traduce español → japonés
- [ ] Traduce japonés → español
- [ ] Traduce español → inglés
- [ ] Traduce inglés → español
- [ ] Auto-detección de idioma origen
- [ ] Cooldown de 5 segundos funciona
- [ ] Límite de 500 caracteres funciona
- [ ] Formato del embed correcto
- [ ] Banderas correctas

---

## PROBLEMAS CONOCIDOS

### 1. Bonus de Fortuna NO Implementado
**Problema:** El bonus de fortuna se guarda pero NO se aplica al ganar honor.

**Solución Temporal:** Ignorar por ahora. Se implementará en FASE 8.

**Test Manual:**
1. Consulta fortuna con /fortuna
2. Gana honor (mensajes, voz, duelos)
3. El honor ganado NO tiene bonus aplicado (comportamiento actual)

### 2. Traducción Puede Fallar con Google API
**Problema:** La API gratuita puede tener rate limiting o fallar ocasionalmente.

**Solución:** El bot maneja el error con mensaje: "Error al traducir el texto. Por favor intenta de nuevo."

**Test:**
- Si falla, espera 10 segundos y vuelve a intentar
- Si sigue fallando, puede ser problema de la API (fuera de nuestro control)

---

## COMANDOS ÚTILES PARA TESTING

### Resetear Cooldowns (si es necesario)
```javascript
// En Node.js REPL o modificar temporalmente constants.js:
CONSTANTS.DUELS.COOLDOWN = 0;  // Sin cooldown para duelos
CONSTANTS.FORTUNE.COOLDOWN = 0;  // Sin cooldown para fortuna
CONSTANTS.TRANSLATION.COOLDOWN = 0;  // Sin cooldown para traducción
```

### Modificar Probabilidades de Fortuna
```javascript
// En constants.js, línea 180-203:
DAI_KICHI: { chance: 1.0, ... }  // 100% Dai-kichi (para testing)
KICHI: { chance: 0, ... }
CHUKICHI: { chance: 0, ... }
KYO: { chance: 0, ... }
```

### Forzar Honor para Duelos
```bash
# En Discord:
1. /pay usuario:@ti_mismo cantidad:10000  # ERROR: No puedes pagarte a ti mismo
2. Pídele a un admin que modifique data/users.json manualmente
3. O gana honor enviando mensajes y estando en voz
```

---

## REPORTE DE BUGS

Si encuentras un bug durante el testing:

1. **Describe el problema:**
   - ¿Qué comando ejecutaste?
   - ¿Qué esperabas que pasara?
   - ¿Qué pasó en realidad?

2. **Reproduce el error:**
   - ¿Puedes hacer que el error ocurra de nuevo?
   - ¿Cuáles son los pasos exactos?

3. **Revisa los logs:**
   - Ejecuta el bot con `npm start`
   - Mira la consola para mensajes de error
   - Copia el error completo

4. **Revisa los datos:**
   - Abre `data/users.json`
   - Verifica que los datos estén correctos
   - Busca valores inesperados o nulos

---

## CONCLUSIÓN

Prueba TODOS los comandos al menos una vez.
Verifica TODOS los casos de prueba.
Reporta cualquier bug encontrado.

**El testing completo debería tomar ~30 minutos.**

🎌 **Código Bushido • Testing Samurai**

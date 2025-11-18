# 🎯 GUÍA COMPLETA DEL SISTEMA DE EVENTOS

**Demon Hunter Bot - Sistema de Eventos y Competencias**

---

## 📋 ¿QUÉ SON LOS EVENTOS?

Los eventos son **competencias organizadas** en el servidor donde los miembros compiten por:
- 💰 **Koku** (moneda del bot)
- 👑 **Títulos especiales** (aparecen en tu perfil)
- 🏆 **Honor y prestigio** en el servidor

**Canal requerido:** 🏆👹**salón-de-honor**👹🏆

---

## 🎮 5 TIPOS DE EVENTOS

### 1. ⚔️ TORNEO DE HONOR (duel_tournament)

**¿De qué va?**
- Competencia de duelos estilo eliminación (bracket)
- Los participantes se enfrentan 1 vs 1 usando `/duelo`
- El ganador de cada duelo avanza a la siguiente ronda
- Sistema de eliminación directa hasta encontrar al campeón

**Duración:** 7 días (por defecto)

**Participantes:** 2-32 jugadores

**Premios:**
- 🥇 **1er lugar:** 5,000 koku + título "Campeón del Torneo"
- 🥈 **2do lugar:** 3,000 koku + título "Subcampeón"
- 🥉 **3er lugar:** 1,500 koku

**Cómo funciona:**
1. Admin crea el torneo con `/evento crear`
2. Jugadores se inscriben con `/evento participar`
3. El sistema genera el bracket automáticamente
4. Los participantes pelean sus duelos
5. Admin registra ganadores y avanza el torneo
6. Al finalizar, se otorgan premios

---

### 2. 📚 TRIVIA SAMURAI (trivia)

**¿De qué va?**
- Competencia de preguntas y respuestas sobre cultura samurai
- Los jugadores responden preguntas en tiempo real
- Puntuación por respuestas correctas
- El más rápido y preciso gana

**Duración:** 1 hora (por defecto)

**Participantes:** 2-100 jugadores

**Premios:**
- 🥇 **1er lugar:** 2,000 koku + título "Maestro del Conocimiento"
- 🥈 **2do lugar:** 1,000 koku
- 🥉 **3er lugar:** 500 koku

**Cómo funciona:**
1. Admin crea la trivia
2. Jugadores se inscriben
3. El evento comienza y se lanzan preguntas
4. Los jugadores responden en el canal
5. El sistema calcula puntos automáticamente
6. Al final, se corona al ganador

---

### 3. 🏗️ CONCURSO DE CONSTRUCCIÓN (building_contest)

**¿De qué va?**
- Competencia de construcciones en Minecraft
- Los participantes construyen algo según el tema
- Toman screenshots y las suben al bot
- La comunidad vota por su favorita

**Duración:** 7 días (por defecto)

**Participantes:** 2-50 jugadores

**Premios:**
- 🥇 **1er lugar:** 4,000 koku + título "Arquitecto Legendario"
- 🥈 **2do lugar:** 2,500 koku + título "Constructor Maestro"
- 🥉 **3er lugar:** 1,500 koku

**Cómo funciona:**
1. Admin crea el concurso con un tema específico
2. Jugadores se inscriben
3. Durante la semana, construyen en Minecraft
4. Suben imágenes de sus construcciones
5. Al finalizar, todos votan
6. El que recibe más votos gana

---

### 4. 🎤 MARATÓN DE VOZ (voice_marathon)

**¿De qué va?**
- Competencia de tiempo en canales de voz
- El objetivo es pasar más tiempo conectado a voz
- Se rastrea automáticamente el tiempo de cada participante
- El que más tiempo acumule gana

**Duración:** 24 horas (por defecto)

**Participantes:** 2-100 jugadores

**Premios:**
- 🥇 **1er lugar:** 3,000 koku + título "Rey de la Voz"
- 🥈 **2do lugar:** 2,000 koku
- 🥉 **3er lugar:** 1,000 koku

**Cómo funciona:**
1. Admin crea el maratón
2. Jugadores se inscriben
3. Durante 24 horas, pasan tiempo en canales de voz
4. El bot rastrea automáticamente los minutos
5. Al finalizar, se cuentan los minutos totales
6. El que más tiempo acumuló gana

**Nota:** El tiempo se cuenta solo cuando estás activo (no mutado/solo)

---

### 5. 💰 CARRERA DE KOKU (koku_rush)

**¿De qué va?**
- Competencia por ganar más koku en tiempo limitado
- Los participantes ganan koku de todas las formas posibles:
  - Enviando mensajes
  - Estando en voz
  - Reclamando `/daily`
  - Ganando duelos
  - Vendiendo items
- Se mide cuánto koku ganaste desde que empezó el evento

**Duración:** 48 horas (por defecto)

**Participantes:** 2-100 jugadores

**Premios:**
- 🥇 **1er lugar:** 5,000 koku + título "Comerciante Supremo"
- 🥈 **2do lugar:** 3,000 koku
- 🥉 **3er lugar:** 1,500 koku

**Cómo funciona:**
1. Admin crea la carrera
2. Jugadores se inscriben
3. El bot registra el koku inicial de cada participante
4. Durante 48 horas, todos intentan ganar la mayor cantidad de koku
5. Al finalizar, se compara koku final vs inicial
6. El que más ganó, gana el evento

**Estrategias:**
- Ser muy activo en chat (+2 koku/min)
- Pasar mucho tiempo en voz (+0.5 koku/min)
- Ganar duelos (+50-200 koku)
- No perder tu racha de daily

---

## 🎮 CÓMO JUGAR - COMANDOS

### 📍 Todos los comandos se usan en: 🏆👹**salón-de-honor**👹🏆

---

### 👤 PARA JUGADORES

#### `/evento lista`
Ver todos los eventos activos y pendientes del servidor.

```
Respuesta:
📋 Eventos Activos
⚔️ Torneo de Primavera
ID: abc123
Participantes: 8/32
Finaliza: en 5 días

💰 Carrera de Koku Semanal
ID: def456
Participantes: 24/100
Finaliza: en 2 días
```

---

#### `/evento participar <evento>`
Unirte a un evento existente.

```
Ejemplo:
/evento participar evento:Torneo de Primavera

Respuesta:
✅ ¡Te has unido al evento!
Torneo de Primavera
Competencia de duelos estilo eliminación
Participantes: 9/32
Estado: ⏳ Pendiente
```

**Requisitos:**
- El evento debe estar en estado "Pendiente" o "Activo"
- No puedes estar ya inscrito
- El evento no debe estar lleno

---

#### `/evento salir <evento>`
Salir de un evento antes de que comience.

```
Ejemplo:
/evento salir evento:Torneo de Primavera

Respuesta:
✅ Has salido del evento Torneo de Primavera.
```

**Restricciones:**
- Solo puedes salir si el evento está "Pendiente"
- Si el evento ya está "Activo", no puedes salir

---

#### `/evento info <evento>`
Ver información detallada de un evento.

```
Ejemplo:
/evento info evento:Torneo de Primavera

Respuesta:
⚔️ Torneo de Primavera
Competencia de duelos estilo eliminación

ID: abc123
Tipo: ⚔️ Torneo de Honor
Estado: ▶️ Activo
Duración: 7 días
Participantes: 16/32

🏆 PREMIOS:
🥇 1er lugar: 5,000 koku + "Campeón del Torneo"
🥈 2do lugar: 3,000 koku + "Subcampeón"
🥉 3er lugar: 1,500 koku

📋 PARTICIPANTES:
@Usuario1, @Usuario2, @Usuario3...
```

---

#### `/evento participantes <evento>`
Ver lista completa de participantes de un evento.

```
Ejemplo:
/evento participantes evento:Torneo de Primavera

Respuesta:
👥 Participantes del Torneo de Primavera
Total: 16/32

1. @Usuario1
2. @Usuario2
3. @Usuario3
...
16. @Usuario16
```

---

#### `/evento clasificacion <evento>`
Ver el ranking/clasificación actual del evento (si está activo/completado).

```
Ejemplo:
/evento clasificacion evento:Carrera de Koku

Respuesta:
🏆 CLASIFICACIÓN - Carrera de Koku

🥇 @Usuario1 - 12,450 koku ganados
🥈 @Usuario2 - 10,200 koku ganados
🥉 @Usuario3 - 8,750 koku ganados
4. @Usuario4 - 7,300 koku ganados
5. @Usuario5 - 6,100 koku ganados
```

---

#### `/evento votar <evento> <participante>`
Votar por una entrada en eventos de construcción.

```
Ejemplo:
/evento votar evento:Concurso de Castillos participante:@Usuario1

Respuesta:
✅ Has votado por la construcción de @Usuario1
```

**Restricciones:**
- Solo disponible en eventos tipo "Concurso de Construcción"
- Solo puedes votar una vez por evento
- No puedes votar por tu propia construcción

---

### 👑 PARA ADMINISTRADORES

#### `/evento crear <tipo> <nombre> [descripcion] [duracion] [max_participantes]`
Crear un nuevo evento.

```
Ejemplo:
/evento crear
  tipo: duel_tournament
  nombre: Torneo de Primavera 2025
  descripcion: Torneo épico de honor y gloria
  duracion: 168 (horas = 7 días)
  max_participantes: 32

Respuesta:
⚔️ Evento Creado
Torneo de Primavera 2025
Torneo épico de honor y gloria

ID: abc123
Tipo: ⚔️ duel_tournament
Estado: ⏳ Pendiente
Duración: 168 horas
Participantes: 0/32

Usa /evento participar evento:Torneo de Primavera 2025 para inscribirte.
```

**Parámetros:**
- `tipo` (requerido):
  - `duel_tournament` - Torneo de duelos
  - `trivia` - Trivia de preguntas
  - `building_contest` - Concurso de construcción
  - `voice_marathon` - Maratón de voz
  - `koku_rush` - Carrera de koku
- `nombre` (requerido): Nombre del evento
- `descripcion` (opcional): Descripción personalizada
- `duracion` (opcional): Duración en horas
- `max_participantes` (opcional): Número máximo de jugadores

**Permisos:** Requiere permisos de Administrador

---

#### `/evento finalizar <evento>`
Finalizar un evento activo y otorgar premios.

```
Ejemplo:
/evento finalizar evento:Torneo de Primavera

Respuesta:
🏆 EVENTO FINALIZADO
Torneo de Primavera 2025

🎉 GANADORES:
🥇 @Usuario1 - 5,000 koku + "Campeón del Torneo"
🥈 @Usuario2 - 3,000 koku + "Subcampeón"
🥉 @Usuario3 - 1,500 koku

¡Felicidades a todos los participantes!
```

**Qué hace:**
1. Cambia el estado del evento a "Completado"
2. Calcula los ganadores según el ranking
3. Otorga premios automáticamente (koku + títulos)
4. Registra las victorias en las estadísticas de los usuarios
5. Anuncia los ganadores públicamente

**Permisos:** Requiere permisos de Administrador

---

## 📊 ESTADOS DE EVENTOS

### ⏳ PENDIENTE (pending)
- Evento creado pero no iniciado
- Los jugadores pueden unirse y salir libremente
- Esperando a que se llene o el admin lo inicie

### ▶️ ACTIVO (active)
- Evento en progreso
- Los jugadores ya no pueden salir
- El sistema rastrea puntos/tiempo automáticamente
- Esperando a que termine el tiempo o el admin lo finalice

### ✅ COMPLETADO (completed)
- Evento finalizado
- Premios otorgados
- Ganadores anunciados
- Se mantiene en el historial 30 días

### ❌ CANCELADO (cancelled)
- Evento cancelado por admin
- No se otorgan premios
- Los participantes son liberados

---

## 🏆 SISTEMA DE PREMIOS

### Tipos de Premios

#### 💰 Koku
- Se añade automáticamente a tu balance
- Visible con `/balance`
- Puedes usarlo en la tienda o transferirlo

#### 👑 Títulos
- Se añaden a tu perfil
- Visibles con `/perfil`
- Aparecen en rankings y leaderboards
- Son permanentes y coleccionables

#### 📊 Estadísticas
- `eventWins` - Total de eventos ganados (cualquier posición)
- `firstPlaceWins` - Veces que ganaste 1er lugar
- Usado para desbloquear logros

---

## 💡 EJEMPLOS DE EVENTOS COMPLETOS

### Ejemplo 1: Torneo de Honor (Paso a Paso)

**DÍA 1 - Admin crea el torneo:**
```
Admin: /evento crear tipo:duel_tournament nombre:Torneo del Shogun duracion:168
Bot: ⚔️ Evento Creado - Torneo del Shogun
     Estado: ⏳ Pendiente
     Participantes: 0/32
```

**DÍA 1-3 - Jugadores se inscriben:**
```
Usuario1: /evento participar evento:Torneo del Shogun
Bot: ✅ Te has unido al evento!

Usuario2: /evento participar evento:Torneo del Shogun
Bot: ✅ Te has unido al evento!

... (hasta llegar a 16 participantes)
```

**DÍA 3 - Verificar participantes:**
```
Admin: /evento participantes evento:Torneo del Shogun
Bot: 👥 Participantes: 16/32
     @Usuario1, @Usuario2, ... @Usuario16
```

**DÍA 3 - El torneo se inicia automáticamente:**
```
Bot: ▶️ EVENTO INICIADO - Torneo del Shogun
     El bracket ha sido generado
     ¡Que comiencen los duelos!
```

**DÍA 3-7 - Los duelos se pelean:**
```
Usuario1: /duelo @Usuario2 apuesta:100
Bot: [Sistema de duelo se ejecuta]
     Ganador: @Usuario1

Admin registra los resultados internamente
```

**DÍA 7 - Admin finaliza el torneo:**
```
Admin: /evento finalizar evento:Torneo del Shogun
Bot: 🏆 EVENTO FINALIZADO

     🥇 @Usuario1 - 5,000 koku + "Campeón del Torneo"
     🥈 @Usuario5 - 3,000 koku + "Subcampeón"
     🥉 @Usuario3 - 1,500 koku

     ¡Felicidades a todos los participantes!
```

---

### Ejemplo 2: Carrera de Koku (48 horas)

**INICIO - Admin crea la carrera:**
```
Admin: /evento crear tipo:koku_rush nombre:Carrera de Fin de Semana duracion:48
Bot: 💰 Evento Creado - Carrera de Fin de Semana
```

**INSCRIPCIÓN (primeras 2 horas):**
```
Usuarios se inscriben:
Usuario1: /evento participar evento:Carrera de Fin de Semana
Bot registra: Usuario1 tiene 2,500 koku al inicio
```

**DURANTE EL EVENTO (48 horas):**
```
Usuario1 hace muchas actividades:
- Envía 100 mensajes = +200 koku
- 5 horas en voz = +150 koku
- Reclama /daily = +100 koku
- Gana 3 duelos = +300 koku
Total ganado: +750 koku

Usuario2 gana aún más:
- Super activo en chat = +500 koku
- 10 horas en voz = +300 koku
- /daily con racha = +150 koku
- Gana 5 duelos = +500 koku
Total ganado: +1,450 koku
```

**FIN - Admin revisa clasificación:**
```
Admin: /evento clasificacion evento:Carrera de Fin de Semana
Bot: 🏆 CLASIFICACIÓN
     🥇 @Usuario2 - 1,450 koku ganados
     🥈 @Usuario5 - 1,200 koku ganados
     🥉 @Usuario1 - 750 koku ganados
```

**FINALIZACIÓN:**
```
Admin: /evento finalizar evento:Carrera de Fin de Semana
Bot: 🏆 GANADORES
     🥇 @Usuario2 - 5,000 koku + "Comerciante Supremo"
     🥈 @Usuario5 - 3,000 koku
     🥉 @Usuario1 - 1,500 koku
```

---

## 🎯 ESTRATEGIAS PARA GANAR

### Torneo de Honor ⚔️
- **Practica duelos** antes del torneo
- **Observa a tus rivales** en duelos casuales
- **Mantén tu racha** de victorias
- **Timing:** Usa tu arma favorita

### Trivia Samurai 📚
- **Estudia cultura samurai** antes del evento
- **Sé rápido:** La velocidad cuenta
- **Lee bien las preguntas:** Evita errores tontos

### Concurso de Construcción 🏗️
- **Planifica tu construcción** antes de empezar
- **Elige un tema llamativo**
- **Toma screenshots profesionales** (día, buen ángulo)
- **Describe tu construcción** de forma épica
- **Promociona tu entrada** en chat (sin spam)

### Maratón de Voz 🎤
- **Planifica sesiones largas** (películas, gaming)
- **No te mutes:** El tiempo no cuenta si estás muted
- **Turnos:** Si hay varios días, distribuye bien tu tiempo
- **Duerme:** No sacrifiques tu salud

### Carrera de Koku 💰
- **Actividad constante:** Mensajes + voz simultáneamente
- **No pierdas duelos:** Cada pérdida te quita koku
- **Mantén tu racha de daily** (multiplicador alto)
- **Evita gastar:** No compres en la tienda durante el evento

---

## ❓ PREGUNTAS FRECUENTES (FAQ)

**Q: ¿Puedo participar en varios eventos a la vez?**
A: Sí, puedes estar inscrito en múltiples eventos simultáneamente.

**Q: ¿Qué pasa si me uno tarde a un evento activo?**
A: Puedes unirte, pero estarás en desventaja ya que otros llevan ventaja.

**Q: ¿Los premios son acumulables?**
A: Sí, todo el koku y títulos que ganes se acumulan en tu perfil.

**Q: ¿Puedo perder un título ganado?**
A: No, los títulos son permanentes.

**Q: ¿Cómo se trackea el tiempo de voz en el maratón?**
A: El bot rastrea automáticamente cuando entras y sales de canales de voz.

**Q: ¿Qué pasa si nadie vota en un concurso de construcción?**
A: El admin puede finalizar el evento y decidir ganadores manualmente.

**Q: ¿Puedo crear mi propio evento como jugador normal?**
A: No, solo los administradores pueden crear eventos.

**Q: ¿Los eventos tienen cooldown?**
A: No, pueden crearse tantos eventos como los admins quieran.

**Q: ¿Se me notifica cuando un evento en el que estoy termina?**
A: Sí, recibirás un mensaje cuando el evento se finalice.

**Q: ¿Puedo ver el historial de eventos pasados?**
A: Los eventos completados se mantienen 30 días y luego se limpian automáticamente.

---

## 🔧 PARA ADMINISTRADORES

### Buenas Prácticas

1. **Anuncia los eventos con anticipación** en el servidor
2. **Da tiempo suficiente para inscripciones** (al menos 24 horas)
3. **Monitorea los eventos activos** regularmente
4. **Finaliza los eventos a tiempo** para otorgar premios
5. **Varía los tipos de eventos** para mantener el interés

### Calendario Sugerido

- **Semanal:** Carrera de Koku (48h, fin de semana)
- **Mensual:** Torneo de Honor (7 días, mid-mes)
- **Trimestral:** Concurso de Construcción (14 días, épico)
- **Ocasional:** Trivia Samurai (1h, eventos especiales)
- **Especial:** Maratón de Voz (24h, días festivos)

---

## 📝 RESUMEN DE COMANDOS

| Comando | Quién | Descripción |
|---------|-------|-------------|
| `/evento lista` | Todos | Ver eventos activos |
| `/evento participar <evento>` | Todos | Unirse a un evento |
| `/evento salir <evento>` | Todos | Salir de un evento |
| `/evento info <evento>` | Todos | Ver info de un evento |
| `/evento participantes <evento>` | Todos | Ver participantes |
| `/evento clasificacion <evento>` | Todos | Ver ranking actual |
| `/evento votar <evento> <usuario>` | Todos | Votar en concursos |
| `/evento crear <tipo> <nombre>` | Admin | Crear nuevo evento |
| `/evento finalizar <evento>` | Admin | Finalizar y dar premios |

---

**¡Que el honor te acompañe, guerrero! 🏯⚔️**

---

**Generado para:** Demon Hunter Bot v2.0
**Sistema:** Event Manager
**Última actualización:** 2025-11-18

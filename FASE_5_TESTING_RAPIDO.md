# FASE 5: Testing Rapido - Sistema de Clanes

## Fecha: 2025-01-14

Este documento proporciona una guia rapida para probar todas las funcionalidades del sistema de clanes implementado en la Fase 5.

---

## Pre-requisitos

1. **Bot iniciado:** `npm start` en la terminal
2. **Comandos registrados:** Los comandos slash deben estar registrados en Discord
3. **Usuarios de prueba:** Minimo 2 usuarios para probar invitaciones/expulsiones
4. **Un usuario con rango Daimyo:** Necesita 2000+ honor y 5000+ koku

---

## Preparacion Inicial

### Paso 1: Obtener Honor y Koku

Si no tienes suficiente honor/koku, ejecuta estos comandos:

```bash
# Verificar tu honor actual
/honor

# Reclamar daily para obtener koku
/daily

# Verificar tu balance
/balance
```

**Necesitas:**
- **2,000+ honor** para rango Daimyo (crear clanes)
- **5,000+ koku** para pagar el costo de creacion

**Si no tienes suficiente:**
- Gana honor escribiendo mensajes (5 honor cada 1 minuto)
- Gana koku escribiendo mensajes (2 koku cada 1 minuto)
- Permanece en canal de voz 50 minutos para ganar ~25 koku y 50 honor

---

## Test 1: Crear un Clan

### Comando:
```
/clan crear Guerreros del Dojo DOJO
```

### Verificaciones:
- [ ] El embed muestra "Clan Fundado" con detalles correctos
- [ ] Se dedujeron 5,000 koku de tu balance
- [ ] El clan aparece como Nivel 1 (Clan Ronin)
- [ ] Eres listado como lider
- [ ] `Miembros: 1/5` (limite de nivel 1)
- [ ] Honor total del clan = tu honor actual

### Errores Comunes:
- **"Necesitas el rango de Daimyo"**: Tu honor es < 2000
- **"Necesitas 5,000 koku"**: No tienes suficiente koku
- **"Ya perteneces a un clan"**: Ya estas en otro clan (usa `/clan salir`)
- **"Ya existe un clan con ese nombre o tag"**: Cambia el nombre/tag

---

## Test 2: Ver Informacion del Clan

### Comando (ver tu clan):
```
/clan info
```

### Comando (ver otro clan):
```
/clan info Guerreros del Dojo
```

### Verificaciones:
- [ ] Muestra nombre, tag, nivel correctos
- [ ] Muestra lider con emoji de rango
- [ ] Muestra numero de miembros/maximo
- [ ] Muestra honor total
- [ ] Muestra progreso hacia nivel 2 (X/5,000)
- [ ] Muestra fecha de fundacion
- [ ] Lista miembros con honor (top 10)

---

## Test 3: Unirse a un Clan (Usuario 2)

**Importante:** Necesitas un **segundo usuario** para este test.

### Comando (Usuario 2):
```
/clan unirse DOJO
```

### Verificaciones:
- [ ] Usuario 2 se une exitosamente
- [ ] Mensaje: "Te has unido al clan..."
- [ ] Lider (Usuario 1) recibe DM notificando la union
- [ ] `/clan info` ahora muestra 2 miembros
- [ ] Honor total del clan = honor Usuario 1 + honor Usuario 2

### Errores Comunes:
- **"Ya perteneces a un clan"**: Usuario 2 ya esta en otro clan
- **"No se encontro ese clan"**: Verifica el tag/nombre
- **"El clan esta lleno"**: El clan alcanzo el limite de miembros

---

## Test 4: Ver Miembros del Clan

### Comando (Usuario 1 o 2):
```
/clan miembros
```

### Verificaciones:
- [ ] Lista todos los miembros ordenados por honor
- [ ] Muestra badge de lider (corona) al lider
- [ ] Muestra emoji de rango de cada miembro
- [ ] Muestra honor y koku de cada miembro
- [ ] Muestra "Total: X/Y miembros"

---

## Test 5: Sistema de Invitaciones

### Comando (Usuario 1 - Lider):
```
/clan invitar @Usuario3
```

### Verificaciones:
- [ ] Bot responde: "Invitacion enviada a Usuario3"
- [ ] Usuario 3 recibe DM con embed de invitacion
- [ ] Embed muestra: tag, nivel, miembros, honor total
- [ ] Botones disponibles: [Aceptar] [Rechazar]
- [ ] Timeout: 2 minutos

### Test 5a: Aceptar Invitacion

**Usuario 3 hace click en [Aceptar]**

#### Verificaciones:
- [ ] Usuario 3 recibe mensaje: "Te has unido al clan..."
- [ ] Lider recibe DM: "Usuario3 ha aceptado la invitacion"
- [ ] `/clan info` muestra 3 miembros
- [ ] Honor total actualizado

### Test 5b: Rechazar Invitacion

**Usuario 3 hace click en [Rechazar]**

#### Verificaciones:
- [ ] Usuario 3 recibe mensaje: "Usuario3 ha rechazado la invitacion"
- [ ] Lider recibe DM: "Usuario3 ha rechazado la invitacion"
- [ ] Usuario 3 NO se une al clan

### Errores Comunes:
- **"Solo el lider del clan puede hacer esto"**: No eres el lider
- **"Usuario ya pertenece a otro clan"**: Usuario invitado ya tiene clan
- **"El clan esta lleno"**: Limite de miembros alcanzado
- **"No pude enviar la invitacion"**: Usuario tiene DMs cerrados

---

## Test 6: Ranking de Clanes

### Comando:
```
/clan top
```

### Verificaciones:
- [ ] Muestra top 10 clanes del servidor
- [ ] Ordenado por Honor Total (default)
- [ ] Medallas para top 3: Oro, Plata, Bronce
- [ ] Muestra: tag, nombre, nivel, honor, lider, miembros
- [ ] Botones disponibles: [Honor] [Miembros] [Nivel]

### Test 6a: Cambiar Criterio de Ordenamiento

**Haz click en [Miembros]**

#### Verificaciones:
- [ ] Ranking se reordena por numero de miembros
- [ ] Header cambia a "Ordenado por: Numero de Miembros"

**Haz click en [Nivel]**

#### Verificaciones:
- [ ] Ranking se reordena por nivel de clan
- [ ] Header cambia a "Ordenado por: Nivel"

**Timeout:**
- [ ] Despues de 2 minutos, los botones se deshabilitan

---

## Test 7: Expulsar Miembro (Solo Lider)

### Comando (Usuario 1 - Lider):
```
/clan expulsar @Usuario2
```

### Verificaciones:
- [ ] Bot pregunta: "Estas seguro de expulsar a Usuario2?"
- [ ] Botones: [Confirmar Expulsion] [Cancelar]
- [ ] Timeout: 30 segundos

### Test 7a: Confirmar Expulsion

**Haz click en [Confirmar Expulsion]**

#### Verificaciones:
- [ ] Mensaje: "Usuario2 ha sido expulsado del clan"
- [ ] Usuario 2 recibe DM: "Has sido expulsado del clan..."
- [ ] `/clan info` ya no muestra a Usuario 2
- [ ] Honor total del clan se actualiza (disminuye)

### Test 7b: Cancelar Expulsion

**Haz click en [Cancelar]**

#### Verificaciones:
- [ ] Mensaje: "Operacion cancelada"
- [ ] Usuario 2 permanece en el clan

### Errores Comunes:
- **"Solo el lider del clan puede hacer esto"**: No eres el lider
- **"No puedes expulsarte a ti mismo"**: Usa `/clan salir` en su lugar
- **"Usuario no pertenece a tu clan"**: Usuario no es miembro

---

## Test 8: Salir del Clan

### Caso 8a: Miembro Normal Sale

**Comando (Usuario 2 - Miembro):**
```
/clan salir
```

#### Verificaciones:
- [ ] Mensaje: "Has abandonado el clan..."
- [ ] Lider recibe DM: "Usuario2 ha abandonado el clan"
- [ ] `/clan info` ya no muestra a Usuario 2
- [ ] Honor total del clan se actualiza

### Caso 8b: Lider Sale (Con Otros Miembros)

**Comando (Usuario 1 - Lider) - clan tiene 2+ miembros:**
```
/clan salir
```

#### Verificaciones:
- [ ] Mensaje: "Eres el lider del clan. Si sales, el liderazgo se transferira..."
- [ ] Botones: [Confirmar Salida] [Cancelar]
- [ ] Confirmar: liderazgo se transfiere al miembro con mas honor
- [ ] Nuevo lider recibe DM: "El liderazgo ha sido transferido..."
- [ ] Usuario 1 sale del clan

### Caso 8c: Unico Miembro Sale (Disuelve Clan)

**Comando (Usuario 1 - Lider) - clan tiene 1 miembro:**
```
/clan salir
```

#### Verificaciones:
- [ ] Mensaje: "El clan... ha sido disuelto"
- [ ] Clan desaparece del servidor
- [ ] `/clan info` ya no encuentra el clan
- [ ] `/clan top` ya no muestra el clan

---

## Test 9: Integracion con Sistema de Honor

### Test 9a: Comando `/honor` Muestra Clan

**Comando:**
```
/honor
```

#### Verificaciones:
- [ ] Embed incluye seccion "Clan"
- [ ] Muestra tag y nombre del clan
- [ ] Muestra nivel del clan
- [ ] Muestra numero de miembros
- [ ] Muestra badge de lider si eres lider

### Test 9b: Ganar Honor Actualiza Clan

**Pasos:**
1. Usuario en clan escribe mensajes en Discord
2. Espera 1 minuto entre mensajes (cooldown)
3. Ejecuta `/clan info` para ver honor total

#### Verificaciones:
- [ ] Honor total del clan aumenta cuando ganas honor
- [ ] Honor total = suma de honor de todos los miembros

---

## Test 10: Sistema de Niveles de Clan

### Niveles a Probar:

**Nivel 1 (Clan Ronin):**
- Honor: 0-4,999
- Miembros: Max 5
- Color: Gris

**Nivel 2 (Clan Samurai):**
- Honor: 5,000-14,999
- Miembros: Max 10
- Color: Azul

**Nivel 3 (Clan Daimyo):**
- Honor: 15,000-29,999
- Miembros: Max 15
- Color: Dorado

**Nivel 4 (Clan Shogun):**
- Honor: 30,000-49,999
- Miembros: Max 20
- Color: Rojo

**Nivel 5 (Clan Legendario):**
- Honor: 50,000+
- Miembros: Max 25
- Color: Purpura

### Verificaciones:
- [ ] Clan comienza en nivel 1
- [ ] Cuando honor total alcanza 5,000, sube a nivel 2
- [ ] Limite de miembros aumenta con el nivel
- [ ] Color del embed cambia segun nivel
- [ ] `/clan info` muestra progreso hacia siguiente nivel

---

## Test 11: Validaciones de Seguridad

### Test 11a: No Puedes Crear 2 Clanes

**Pasos:**
1. Estas en un clan
2. Ejecuta `/clan crear Otro Clan OTRO`

#### Verificaciones:
- [ ] Error: "Ya perteneces a un clan. Debes salir primero."

### Test 11b: Tags Invalidos

**Prueba estos tags (deben fallar):**
```
/clan crear Test A        # Muy corto (1 caracter)
/clan crear Test TOOLONG  # Muy largo (7 caracteres)
/clan crear Test WA R     # Espacios
/clan crear Test WAR!     # Simbolos
```

#### Verificaciones:
- [ ] Error: "El tag del clan debe tener entre 2 y 5 caracteres (solo letras y numeros)"

### Test 11c: Nombres Invalidos

**Prueba estos nombres (deben fallar):**
```
/clan crear AB TAG         # Muy corto (2 caracteres)
/clan crear UnNombreMuyLargoQueExcedeLosLimites TAG  # Muy largo (30+ caracteres)
```

#### Verificaciones:
- [ ] Error: "El nombre del clan debe tener entre 3 y 30 caracteres"

### Test 11d: No Puedes Invitar a Bots

**Comando:**
```
/clan invitar @DemonHunterBot
```

#### Verificaciones:
- [ ] Error: "No he podido encontrar a ese guerrero en el dojo"

---

## Test 12: Persistencia de Datos

### Pasos:
1. Crea un clan
2. Unete a un clan con varios usuarios
3. Detiene el bot (`Ctrl+C`)
4. Reinicia el bot (`npm start`)
5. Ejecuta `/clan info`

### Verificaciones:
- [ ] Clan todavia existe despues del reinicio
- [ ] Todos los miembros siguen en el clan
- [ ] Honor total se mantiene
- [ ] Nivel del clan se mantiene
- [ ] Lider del clan se mantiene

---

## Comandos Rapidos para Testing

```bash
# Crear clan (requiere Daimyo + 5000 koku)
/clan crear Mi Clan CLAN

# Ver tu clan
/clan info

# Ver otro clan
/clan info Mi Clan

# Unirse a clan
/clan unirse CLAN

# Ver miembros
/clan miembros

# Ranking de clanes
/clan top

# Invitar usuario (solo lider)
/clan invitar @usuario

# Expulsar usuario (solo lider)
/clan expulsar @usuario

# Salir del clan
/clan salir

# Ver honor (ahora muestra clan)
/honor

# Ver balance
/balance

# Ganar honor/koku
# (escribir mensajes con 1 min de cooldown)
```

---

## Problemas Comunes y Soluciones

### Problema: "Ya perteneces a un clan"
**Solucion:** Sal de tu clan actual con `/clan salir`

### Problema: "Necesitas el rango de Daimyo"
**Solucion:** Gana 2,000+ honor escribiendo mensajes o permaneciendo en voz

### Problema: "Necesitas 5,000 koku"
**Solucion:** Reclama `/daily` y gana koku escribiendo mensajes

### Problema: "No pude enviar la invitacion"
**Solucion:** Usuario debe abrir sus DMs en configuracion de Discord

### Problema: "El clan esta lleno"
**Solucion:** Espera a que el clan suba de nivel o crea tu propio clan

### Problema: "Solo el lider del clan puede hacer esto"
**Solucion:** Solo el lider puede invitar/expulsar

---

## Metricas de Exito

Al finalizar el testing, deberias haber:
- [ ] Creado al menos 1 clan
- [ ] Unido al menos 2 usuarios al clan
- [ ] Invitado y aceptado una invitacion
- [ ] Expulsado un miembro
- [ ] Visto el ranking de clanes
- [ ] Verificado que `/honor` muestra info del clan
- [ ] Verificado actualizacion automatica de honor total
- [ ] Verificado persistencia despues de reiniciar bot
- [ ] Probado todas las validaciones de seguridad

---

## Siguientes Pasos

Una vez completado el testing:
1. Reporta cualquier bug encontrado
2. Verifica que todos los datos persisten en `data/clans.json`
3. Confirma que el auto-guardado funciona cada 5 minutos
4. Registra comandos en produccion si todo funciona

---

**Autor:** SamuraiBot Architect
**Fecha:** 2025-01-14
**Version del Bot:** 1.5.0 (Fase 5 - Clanes)

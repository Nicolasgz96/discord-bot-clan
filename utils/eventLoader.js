/**
 * DEMON HUNTER BOT - Event Loader
 * Carga automáticamente todos los event handlers desde el directorio events/
 */

const fs = require('fs');
const path = require('path');

/**
 * Cargar y registrar todos los event handlers
 * @param {Client} client - Cliente de Discord
 * @param {Object} dependencies - Dependencias a pasar a los event handlers
 */
function loadEvents(client, dependencies = {}) {
  const eventsPath = path.join(__dirname, '../events');

  // Verificar si el directorio existe
  if (!fs.existsSync(eventsPath)) {
    console.log('⚠️ Directorio events/ no encontrado, saltando carga de eventos modulares');
    return;
  }

  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, dependencies));
    } else {
      client.on(event.name, (...args) => event.execute(...args, dependencies));
    }

    console.log(`✓ Evento cargado: ${event.name} (${file})`);
  }
}

/**
 * Cargar y registrar todos los interaction handlers (buttons, modals)
 * @param {Client} client - Cliente de Discord
 * @param {Object} dependencies - Dependencias a pasar a los handlers
 */
function loadHandlers(client, dependencies = {}) {
  const handlersPath = path.join(__dirname, '../handlers');

  // Verificar si el directorio existe
  if (!fs.existsSync(handlersPath)) {
    console.log('⚠️ Directorio handlers/ no encontrado, saltando carga de handlers modulares');
    return;
  }

  const handlerFiles = fs.readdirSync(handlersPath).filter(file => file.endsWith('.js'));

  for (const file of handlerFiles) {
    const filePath = path.join(handlersPath, file);
    const handler = require(filePath);

    client.on(handler.name, (...args) => handler.execute(...args, dependencies));

    console.log(`✓ Handler cargado: ${handler.name} (${file})`);
  }
}

module.exports = { loadEvents, loadHandlers };

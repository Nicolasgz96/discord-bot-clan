/**
 * Script de Verificación Pre-Inicio
 * Verifica que todo está configurado correctamente ANTES de intentar iniciar el bot
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración del Demon Hunter Bot...\n');

let errors = 0;
let warnings = 0;

// 1. Verificar variables de entorno
console.log('📋 Verificando variables de entorno (.env)...');
if (!process.env.DISCORD_TOKEN) {
  console.error('  ❌ DISCORD_TOKEN no está configurado en .env');
  errors++;
} else {
  console.log('  ✅ DISCORD_TOKEN configurado');
}

if (!process.env.CLIENT_ID) {
  console.error('  ❌ CLIENT_ID no está configurado en .env');
  errors++;
} else {
  console.log('  ✅ CLIENT_ID configurado');
}

// 2. Verificar config.json
console.log('\n📋 Verificando config.json...');
try {
  const config = require('./config.json');

  if (!config.welcome || !config.welcome.channelId) {
    console.error('  ❌ welcome.channelId no está configurado');
    errors++;
  } else {
    console.log(`  ✅ Canal de bienvenida: ${config.welcome.channelId}`);
  }

  if (!config.welcome.card.backgroundImage) {
    console.warn('  ⚠️ No hay imagen de fondo configurada');
    warnings++;
  } else {
    console.log('  ✅ Imagen de fondo configurada');
  }
} catch (error) {
  console.error('  ❌ Error leyendo config.json:', error.message);
  errors++;
}

// 3. Verificar archivos críticos
console.log('\n📋 Verificando archivos del proyecto...');
const criticalFiles = [
  'index.js',
  'commands.js',
  'register-commands.js',
  'utils/dataManager.js',
  'utils/welcomeCard.js',
  'src/config/emojis.js',
  'src/config/messages.js',
  'src/config/colors.js'
];

for (const file of criticalFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.error(`  ❌ ${file} no encontrado`);
    errors++;
  }
}

// 4. Verificar directorio /data
console.log('\n📋 Verificando directorio de datos...');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  console.warn('  ⚠️ Directorio /data no existe (se creará al iniciar el bot)');
  warnings++;
} else {
  console.log('  ✅ Directorio /data existe');

  // Listar archivos en /data
  const dataFiles = fs.readdirSync(dataDir);
  if (dataFiles.length === 0) {
    console.log('  ℹ️ Directorio /data vacío (archivos se crearán al iniciar)');
  } else {
    console.log(`  ℹ️ Archivos encontrados: ${dataFiles.join(', ')}`);
  }
}

// 5. Verificar dependencias de npm
console.log('\n📋 Verificando dependencias de npm...');
try {
  const packageJson = require('./package.json');
  const requiredDeps = ['discord.js', 'dotenv', '@napi-rs/canvas', '@discordjs/voice'];

  for (const dep of requiredDeps) {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`  ✅ ${dep} en package.json`);
    } else {
      console.error(`  ❌ ${dep} no está en dependencies`);
      errors++;
    }
  }
} catch (error) {
  console.error('  ❌ Error leyendo package.json:', error.message);
  errors++;
}

// 6. Verificar sintaxis de archivos críticos
console.log('\n📋 Verificando sintaxis de código...');
const syntaxFiles = ['index.js', 'commands.js', 'utils/dataManager.js'];
for (const file of syntaxFiles) {
  try {
    require(path.join(__dirname, file));
    console.log(`  ✅ ${file} - Sin errores de sintaxis`);
  } catch (error) {
    console.error(`  ❌ ${file} - Error: ${error.message}`);
    errors++;
  }
}

// Resumen final
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DE VERIFICACIÓN\n');

if (errors === 0 && warnings === 0) {
  console.log('🎉 ¡TODO ESTÁ PERFECTO!\n');
  console.log('✅ Configuración completa');
  console.log('✅ Todos los archivos presentes');
  console.log('✅ Sin errores de sintaxis\n');
  console.log('📝 PRÓXIMOS PASOS:\n');
  console.log('1. Ve a CONFIGURACION_DISCORD_PORTAL.md');
  console.log('2. Habilita los intents en Discord Developer Portal');
  console.log('3. Invita el bot a tu servidor con el link generado');
  console.log('4. Ejecuta: npm start\n');
  console.log('🎌 Que el código Bushido te proteja, guerrero.');
} else {
  if (errors > 0) {
    console.log(`❌ ${errors} error(es) encontrado(s)`);
    console.log('⚠️ DEBES CORREGIR LOS ERRORES ANTES DE INICIAR EL BOT\n');
  }

  if (warnings > 0) {
    console.log(`⚠️ ${warnings} advertencia(s) encontrada(s)`);
    console.log('ℹ️ Las advertencias no son críticas pero deberías revisarlas\n');
  }

  if (errors > 0) {
    process.exit(1);
  }
}

console.log('='.repeat(60));

/**
 * Test script to validate modular architecture without connecting to Discord
 */

console.log('🧪 Testing Modular Architecture...\n');

// Test 1: Verify all imports work
console.log('Test 1: Verifying imports...');
try {
  const helpers = require('./utils/helpers');
  const eventLoader = require('./utils/eventLoader');
  const ready = require('./events/ready');
  const guildMemberAdd = require('./events/guildMemberAdd');
  const voiceStateUpdate = require('./events/voiceStateUpdate');
  const buttons = require('./handlers/buttons');
  const modals = require('./handlers/modals');
  console.log('✅ All imports successful\n');
} catch (error) {
  console.error('❌ Import failed:', error.message);
  process.exit(1);
}

// Test 2: Verify helper functions are exported
console.log('Test 2: Verifying helper exports...');
try {
  const { sendWithRetry, getRankEmoji, fetchUsername, fetchUsernamesBatch, fetchDisplayName, fetchDisplayNamesBatch } = require('./utils/helpers');
  if (!sendWithRetry || !getRankEmoji || !fetchUsername) {
    throw new Error('Missing helper functions');
  }
  console.log('✅ All helper functions exported\n');
} catch (error) {
  console.error('❌ Helper export failed:', error.message);
  process.exit(1);
}

// Test 3: Verify event loader functions
console.log('Test 3: Verifying event loader...');
try {
  const { loadEvents, loadHandlers } = require('./utils/eventLoader');
  if (typeof loadEvents !== 'function' || typeof loadHandlers !== 'function') {
    throw new Error('Event loader functions not exported correctly');
  }
  console.log('✅ Event loader functions available\n');
} catch (error) {
  console.error('❌ Event loader failed:', error.message);
  process.exit(1);
}

// Test 4: Verify event modules structure
console.log('Test 4: Verifying event module structure...');
try {
  const ready = require('./events/ready');
  const guildMemberAdd = require('./events/guildMemberAdd');
  const voiceStateUpdate = require('./events/voiceStateUpdate');

  if (!ready.name || !ready.execute) {
    throw new Error('ready.js missing name or execute');
  }
  if (!guildMemberAdd.name || !guildMemberAdd.execute) {
    throw new Error('guildMemberAdd.js missing name or execute');
  }
  if (!voiceStateUpdate.name || !voiceStateUpdate.execute) {
    throw new Error('voiceStateUpdate.js missing name or execute');
  }

  console.log('  ✓ ready.js structure valid');
  console.log('  ✓ guildMemberAdd.js structure valid');
  console.log('  ✓ voiceStateUpdate.js structure valid');
  console.log('✅ All event modules structured correctly\n');
} catch (error) {
  console.error('❌ Event module structure failed:', error.message);
  process.exit(1);
}

// Test 5: Verify handler modules structure
console.log('Test 5: Verifying handler module structure...');
try {
  const buttons = require('./handlers/buttons');
  const modals = require('./handlers/modals');

  if (!buttons.name || !buttons.execute) {
    throw new Error('buttons.js missing name or execute');
  }
  if (!modals.name || !modals.execute) {
    throw new Error('modals.js missing name or execute');
  }

  console.log('  ✓ buttons.js structure valid');
  console.log('  ✓ modals.js structure valid');
  console.log('✅ All handler modules structured correctly\n');
} catch (error) {
  console.error('❌ Handler module structure failed:', error.message);
  process.exit(1);
}

// Test 6: Test getRankEmoji helper
console.log('Test 6: Testing getRankEmoji helper...');
try {
  const { getRankEmoji } = require('./utils/helpers');
  const EMOJIS = require('./src/config/emojis');

  const roninEmoji = getRankEmoji('Ronin');
  const samuraiEmoji = getRankEmoji('Samurai');
  const daimyoEmoji = getRankEmoji('Daimyo');
  const shogunEmoji = getRankEmoji('Shogun');

  if (roninEmoji !== EMOJIS.RONIN) throw new Error('Ronin emoji mismatch');
  if (samuraiEmoji !== EMOJIS.SAMURAI) throw new Error('Samurai emoji mismatch');
  if (daimyoEmoji !== EMOJIS.DAIMYO) throw new Error('Daimyo emoji mismatch');
  if (shogunEmoji !== EMOJIS.SHOGUN) throw new Error('Shogun emoji mismatch');

  console.log(`  ✓ Ronin: ${roninEmoji}`);
  console.log(`  ✓ Samurai: ${samuraiEmoji}`);
  console.log(`  ✓ Daimyo: ${daimyoEmoji}`);
  console.log(`  ✓ Shogun: ${shogunEmoji}`);
  console.log('✅ getRankEmoji working correctly\n');
} catch (error) {
  console.error('❌ getRankEmoji test failed:', error.message);
  process.exit(1);
}

// Test 7: Verify index.js syntax (already done but good to confirm)
console.log('Test 7: Verifying index.js syntax...');
try {
  require('child_process').execSync('node -c index.js', { cwd: __dirname, stdio: 'pipe' });
  console.log('✅ index.js syntax valid\n');
} catch (error) {
  console.error('❌ index.js syntax error:', error.message);
  process.exit(1);
}

console.log('═══════════════════════════════════════');
console.log('✅ ALL TESTS PASSED');
console.log('═══════════════════════════════════════');
console.log('\n🎉 Modular architecture is working correctly!');
console.log('\nYou can now start the bot with: npm start');

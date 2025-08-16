#!/usr/bin/env node

/**
 * Script de lancement des tests Better Auth
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Lancement des tests Better Auth...\n');

// Lancer les tests
const testPath = path.join(__dirname, 'auth-tests.js');
const nodeProcess = spawn('node', [testPath], {
    stdio: 'inherit',
    cwd: __dirname
});

nodeProcess.on('close', (code) => {
    if (code === 0) {
        console.log('\n✅ Tests terminés avec succès!');
    } else {
        console.log(`\n❌ Tests terminés avec erreurs (code: ${code})`);
    }
    process.exit(code);
});

nodeProcess.on('error', (error) => {
    console.error('❌ Erreur lors du lancement des tests:', error);
    process.exit(1);
});

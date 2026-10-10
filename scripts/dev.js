const { spawn } = require('child_process');
const path = require('path');

const nodeExe = process.execPath;
const serverScript = path.join(__dirname, '..', 'server', 'src', 'server.js');
const viteScript = path.join(__dirname, '..', 'client', 'node_modules', 'vite', 'bin', 'vite.js');
const clientDir = path.join(__dirname, '..', 'client');
const serverDir = path.join(__dirname, '..', 'server');

console.log('======================================================');
console.log('🩺 CareAtlas — Patient Health Copilot');
console.log('🚀 Starting Express API and Vite React Client...');
console.log('======================================================\n');

// 1. Start Express Backend API Server (with --watch for hot reloads)
const server = spawn(nodeExe, ['--watch', serverScript], {
  cwd: serverDir,
  stdio: 'inherit',
});

server.on('error', (err) => {
  console.error('❌ Failed to start CareAtlas server:', err.message);
});

// 2. Start Vite Client
const client = spawn(nodeExe, [viteScript], {
  cwd: clientDir,
  stdio: 'inherit',
});

client.on('error', (err) => {
  console.error('❌ Failed to start Vite client:', err.message);
});

const cleanup = () => {
  console.log('\n🛑 Stopping CareAtlas processes...');
  try { server.kill(); } catch (e) {}
  try { client.kill(); } catch (e) {}
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

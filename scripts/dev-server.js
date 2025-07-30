#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Venezia development server...\n');

// Start webpack dev server
const webpack = spawn('webpack', ['serve', '--mode', 'development'], {
  stdio: 'inherit',
  shell: true,
  cwd: path.resolve(__dirname, '..')
});

webpack.on('error', (error) => {
  console.error('Failed to start webpack dev server:', error);
  process.exit(1);
});

webpack.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Webpack dev server exited with code ${code}`);
    process.exit(code);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down development server...');
  webpack.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  webpack.kill('SIGTERM');
  process.exit(0);
});
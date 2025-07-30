#!/usr/bin/env node
// Unified build script for Venezia Ice Cream
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🍦 Venezia Ice Cream - Build Script\n');

// Detect build system preference
const useVite = process.argv.includes('--vite') || process.env.BUILD_SYSTEM === 'vite';
const useWebpack = process.argv.includes('--webpack') || !useVite;

// Clean previous builds
console.log('🧹 Cleaning previous builds...');
const distDirs = ['dist', 'app/static/dist', 'build'];
distDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// Ensure environment is set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// Build frontend
try {
  if (useVite) {
    console.log('⚡ Building with Vite...');
    execSync('npm run build:vite', { stdio: 'inherit' });
    
    // For Vercel, ensure output is in the right place
    if (process.env.VERCEL) {
      console.log('📦 Preparing for Vercel deployment...');
      if (!fs.existsSync('dist') && fs.existsSync('build')) {
        fs.renameSync('build', 'dist');
      }
    }
  } else {
    console.log('📦 Building with Webpack...');
    execSync('npm run build:webpack', { stdio: 'inherit' });
    
    // For Vercel with webpack, copy to dist
    if (process.env.VERCEL && fs.existsSync('app/static/dist')) {
      console.log('📦 Copying webpack output for Vercel...');
      if (!fs.existsSync('dist')) {
        fs.mkdirSync('dist');
      }
      // Copy files
      const copyRecursive = (src, dest) => {
        fs.cpSync(src, dest, { recursive: true });
      };
      copyRecursive('app/static/dist', 'dist');
      
      // Copy index.html if exists
      if (fs.existsSync('app/templates/spa.html')) {
        const html = fs.readFileSync('app/templates/spa.html', 'utf8');
        // Update paths for root deployment
        const updatedHtml = html.replace(/\/static\/dist\//g, '/');
        fs.writeFileSync('dist/index.html', updatedHtml);
      }
    }
  }
  
  // Copy public assets if needed
  if (fs.existsSync('public') && fs.existsSync('dist')) {
    console.log('📄 Copying public assets...');
    const files = fs.readdirSync('public');
    files.forEach(file => {
      if (file !== 'index.html') {
        fs.cpSync(path.join('public', file), path.join('dist', file), { recursive: true });
      }
    });
  }
  
  // Generate deployment info
  const buildInfo = {
    buildTime: new Date().toISOString(),
    buildSystem: useVite ? 'vite' : 'webpack',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV
  };
  
  const outputDir = fs.existsSync('dist') ? 'dist' : 'app/static/dist';
  fs.writeFileSync(
    path.join(outputDir, 'build-info.json'),
    JSON.stringify(buildInfo, null, 2)
  );
  
  console.log('\n✅ Build completed successfully!');
  console.log(`📁 Output directory: ${outputDir}`);
  console.log(`🔧 Build system: ${buildInfo.buildSystem}`);
  console.log(`📅 Build time: ${buildInfo.buildTime}`);
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
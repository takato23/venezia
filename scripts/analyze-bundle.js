#!/usr/bin/env node
// Bundle analyzer script
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📊 Venezia Bundle Analyzer\n');

// Function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Analyze file sizes
function analyzeDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`❌ Directory ${dir} not found`);
    return null;
  }

  const files = [];
  let totalSize = 0;

  function walkDir(currentPath) {
    const entries = fs.readdirSync(currentPath);
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else {
        const relativePath = path.relative(dir, fullPath);
        files.push({
          path: relativePath,
          size: stat.size,
          ext: path.extname(fullPath)
        });
        totalSize += stat.size;
      }
    }
  }

  walkDir(dir);
  
  // Sort by size
  files.sort((a, b) => b.size - a.size);
  
  return { files, totalSize };
}

// Analyze package.json dependencies
function analyzeDependencies() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = Object.keys(packageJson.dependencies || {});
  
  console.log('📦 Dependencies Analysis:');
  console.log(`Total dependencies: ${deps.length}`);
  
  // Check for large dependencies
  const largeDeps = [
    'moment', 'lodash', 'jquery', 'bootstrap', 'antd', 'material-ui'
  ];
  
  const foundLarge = deps.filter(dep => 
    largeDeps.some(large => dep.includes(large))
  );
  
  if (foundLarge.length > 0) {
    console.log('⚠️  Large dependencies found:', foundLarge.join(', '));
  }
  
  // Analyze React ecosystem
  const reactDeps = deps.filter(dep => dep.includes('react'));
  console.log(`React-related packages: ${reactDeps.length}`);
  
  return deps;
}

// Main analysis
console.log('1️⃣ Checking build output...\n');

const buildDirs = [
  { name: 'Vite', path: 'dist' },
  { name: 'Webpack', path: 'app/static/dist' }
];

let activeDir = null;

for (const dir of buildDirs) {
  const analysis = analyzeDirectory(dir.path);
  if (analysis) {
    console.log(`✅ ${dir.name} build found at ${dir.path}`);
    console.log(`Total size: ${formatBytes(analysis.totalSize)}`);
    
    // Show top 10 files
    console.log('\nTop 10 largest files:');
    analysis.files.slice(0, 10).forEach((file, i) => {
      console.log(`  ${i + 1}. ${file.path} - ${formatBytes(file.size)}`);
    });
    
    // Analyze by type
    const byType = {};
    analysis.files.forEach(file => {
      const ext = file.ext || 'other';
      if (!byType[ext]) byType[ext] = { count: 0, size: 0 };
      byType[ext].count++;
      byType[ext].size += file.size;
    });
    
    console.log('\nBreakdown by file type:');
    Object.entries(byType)
      .sort((a, b) => b[1].size - a[1].size)
      .forEach(([ext, data]) => {
        console.log(`  ${ext}: ${data.count} files, ${formatBytes(data.size)}`);
      });
    
    activeDir = dir;
    break;
  }
}

if (!activeDir) {
  console.log('❌ No build output found. Run npm run build first.');
  process.exit(1);
}

console.log('\n2️⃣ Analyzing dependencies...\n');
analyzeDependencies();

console.log('\n3️⃣ Performance Recommendations:\n');

// Generate recommendations
const recommendations = [
  {
    check: () => fs.existsSync('dist') && !fs.existsSync('dist/js'),
    message: '✅ Good: Build output is properly bundled'
  },
  {
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return !pkg.dependencies['moment'];
    },
    message: '✅ Good: Using date-fns instead of moment.js'
  },
  {
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.dependencies['react'].startsWith('^18');
    },
    message: '✅ Good: Using React 18 with automatic batching'
  }
];

recommendations.forEach(rec => {
  try {
    if (rec.check()) {
      console.log(rec.message);
    }
  } catch (e) {
    // Skip failed checks
  }
});

// Additional recommendations
console.log('\n📋 Optimization Checklist:');
console.log('[ ] Enable Gzip compression on server');
console.log('[ ] Implement code splitting for routes');
console.log('[ ] Lazy load heavy components');
console.log('[ ] Optimize images (WebP format)');
console.log('[ ] Enable HTTP/2 on server');
console.log('[ ] Configure browser caching headers');
console.log('[ ] Minify CSS and JavaScript');
console.log('[ ] Remove unused dependencies');

console.log('\n✨ Analysis complete!');
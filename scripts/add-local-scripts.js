
const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add local development scripts
const newScripts = {
  "dev:local": "cross-env VITE_USE_LOCAL_BACKEND=true concurrently \"npm run dev:backend\" \"npm run dev\"",
  "dev:backend": "cd local-backend && npm run dev",
  "setup:local": "node scripts/setup-local.js",
  "start:local": "npm run setup:local && npm run dev:local"
};

packageJson.scripts = { ...packageJson.scripts, ...newScripts };

// Add required dev dependencies
const newDevDeps = {
  "concurrently": "^8.2.0",
  "cross-env": "^7.0.3"
};

packageJson.devDependencies = { ...packageJson.devDependencies, ...newDevDeps };

console.log('📝 The following scripts need to be added to package.json:');
console.log(JSON.stringify(newScripts, null, 2));
console.log('\n📦 The following dev dependencies need to be added:');
console.log(JSON.stringify(newDevDeps, null, 2));
console.log('\n💡 You can add these manually or install the dependencies:');
console.log('npm install --save-dev concurrently cross-env');

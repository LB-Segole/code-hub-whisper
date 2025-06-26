
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Voice Agent for Local Development...');

// Create local-backend directory if it doesn't exist
const backendDir = path.join(process.cwd(), 'local-backend');
if (!fs.existsSync(backendDir)) {
  fs.mkdirSync(backendDir);
  console.log('✅ Created local-backend directory');
}

// Copy .env.local.example to .env.local if it doesn't exist
const envLocalPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env.local.example');

if (!fs.existsSync(envLocalPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envLocalPath);
  console.log('✅ Created .env.local file');
}

// Install backend dependencies
console.log('📦 Installing backend dependencies...');
try {
  execSync('npm install', { cwd: backendDir, stdio: 'inherit' });
  console.log('✅ Backend dependencies installed');
} catch (error) {
  console.log('⚠️ Backend dependencies will be installed on first run');
}

console.log('\n✅ Local setup complete!');
console.log('\n📝 Next steps:');
console.log('1. npm run dev:local   (to start both frontend and backend)');
console.log('2. Open http://localhost:5173 in your browser');
console.log('3. Configure your OpenAI API key in the app settings');
console.log('\n💡 The app will now run completely locally without Supabase!');

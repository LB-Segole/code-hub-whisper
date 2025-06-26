
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Voice Agent Local Backend...');

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('✅ Created uploads directory');
}

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  const envContent = `# Voice Agent Local Backend Configuration
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development

# Optional: Set your OpenAI API key here for testing
# OPENAI_API_KEY=your-openai-api-key

# Database
DB_PATH=./voice-agent.db
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file');
  console.log('💡 Remember to set your OpenAI API key in the app settings or .env file');
}

console.log('✅ Setup complete!');
console.log('\n📝 Next steps:');
console.log('1. cd local-backend');
console.log('2. npm install');
console.log('3. npm run dev');
console.log('\n🌐 Your local backend will be available at http://localhost:3001');

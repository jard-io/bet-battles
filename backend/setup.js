const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎯 PrizePicks Backend Setup');
console.log('===========================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  const examplePath = path.join(__dirname, 'env.example');
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log('✅ .env file created! Please update it with your database credentials.\n');
  } else {
    console.log('❌ env.example file not found.\n');
  }
} else {
  console.log('✅ .env file already exists.\n');
}

// Check if PostgreSQL is running
console.log('🔍 Checking PostgreSQL...');
exec('pg_isready', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ PostgreSQL is not running or not installed.');
    console.log('📋 Please install and start PostgreSQL:');
    console.log('   - macOS: brew install postgresql && brew services start postgresql');
    console.log('   - Ubuntu: sudo apt install postgresql && sudo systemctl start postgresql');
    console.log('   - Windows: Download from https://www.postgresql.org/download/\n');
  } else {
    console.log('✅ PostgreSQL is running.\n');
  }
});

console.log('📋 Next steps:');
console.log('1. Update the .env file with your database credentials');
console.log('2. Create a database: createdb prizepicks_db');
console.log('3. Install dependencies: npm install');
console.log('4. Start the server: npm run dev');
console.log('5. The server will create all necessary tables automatically\n');

console.log('🚀 Happy coding!');

const axios = require('axios');

async function testBackup() {
  console.log('🧪 Testing backup system...\n');

  try {
    // 1. Get backup info
    console.log('1. Getting backup info...');
    const infoResponse = await axios.get('http://localhost:5002/api/backups/info');
    console.log('Backup Info:', infoResponse.data.data);
    console.log();

    // 2. Create a manual backup
    console.log('2. Creating manual backup...');
    const createResponse = await axios.post('http://localhost:5002/api/backups');
    
    if (createResponse.data.success) {
      console.log('✅ Backup created successfully:', createResponse.data.data);
    } else {
      console.log('⚠️ Backup already in progress');
    }
    console.log();

    // 3. List all backups
    console.log('3. Listing all backups...');
    const listResponse = await axios.get('http://localhost:5002/api/backups');
    console.log(`Found ${listResponse.data.total} backups:`);
    
    listResponse.data.data.forEach((backup, index) => {
      console.log(`  ${index + 1}. ${backup.fileName} - ${new Date(backup.created).toLocaleString()}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testBackup();
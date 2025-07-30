const axios = require('axios');

async function triggerAlertCheck() {
  console.log('🔔 Triggering alert check...\n');

  try {
    // Check all alert types
    const alertTypes = ['stock', 'expiry', 'cash', 'sales'];
    
    for (const type of alertTypes) {
      console.log(`Checking ${type} alerts...`);
      const response = await axios.post(`http://localhost:5002/api/alerts/check/${type}`);
      console.log(`✅ ${type}: ${response.data.message}`);
    }

    // Get current alerts
    console.log('\n📊 Fetching current alerts...');
    const alertsResponse = await axios.get('http://localhost:5002/api/alerts');
    const alerts = alertsResponse.data.data;

    if (alerts.length === 0) {
      console.log('No active alerts');
    } else {
      console.log(`\nFound ${alerts.length} active alerts:`);
      alerts.forEach(alert => {
        console.log(`- [${alert.severity.toUpperCase()}] ${alert.title}: ${alert.message}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

triggerAlertCheck();
// Simple script to check if the app routes to home correctly
// Run with: node check-routing.js

const http = require('http');

function checkRoute(port = 3000) {
  const options = {
    hostname: 'localhost',
    port: port,
    path: '/',
    method: 'GET',
    timeout: 5000
  };

  console.log(`Checking if app routes to home page on http://localhost:${port}/`);

  const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    if (res.statusCode === 200) {
      console.log('✅ App successfully routes to home page');
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      console.log(`⚠️  App redirects to: ${res.headers.location}`);
    } else {
      console.log(`❌ Unexpected status code: ${res.statusCode}`);
    }
  });

  req.on('error', (err) => {
    console.log('❌ Error connecting to app:', err.message);
    console.log('Make sure the app is running with: npm run dev');
  });

  req.on('timeout', () => {
    console.log('❌ Request timed out. Make sure the app is running.');
    req.destroy();
  });

  req.end();
}

// Check the route
checkRoute();
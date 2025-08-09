// Backend entry point aligning with package.json "main": "server.js"
// Using the new server implementation

const app = require('./server-new.js');

// Exporting app here maintains compatibility with tests or imports.
module.exports = app;
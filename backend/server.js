require('dotenv').config();
const https = require('https');
const fs = require('fs');
const path = require('path');
const app = require('./app');

const PORT = process.env.PORT || 3000;

const options = {
  key: fs.readFileSync(path.join(__dirname, 'certs', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem')),
};

https.createServer(options, app).listen(PORT, () => {
  console.log(`HustleHub+ API running on https://localhost:${PORT}`);
});

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import app from './app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const certKeyPath = path.resolve(__dirname, '../cert/localhost-key.pem');
const certPemPath = path.resolve(__dirname, '../cert/localhost.pem');

// Helper to list local IP addresses
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips;
}

const hasCerts = fs.existsSync(certKeyPath) && fs.existsSync(certPemPath);

let server;
let protocol = 'http';

if (hasCerts) {
  try {
    const options = {
      key: fs.readFileSync(certKeyPath),
      cert: fs.readFileSync(certPemPath),
    };
    server = https.createServer(options, app);
    protocol = 'https';
  } catch (err) {
    console.warn('⚠️ Failed to load SSL certificates, falling back to HTTP:', err.message);
    server = http.createServer(app);
  }
} else {
  console.log('ℹ️ SSL certificates not found in cert/. Starting in HTTP mode.');
  console.log('👉 To enable HTTPS, run: npm run generate-cert');
  server = http.createServer(app);
}

server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs();
  console.log('\n=============================================================');
  console.log(`🌸 QR CHECK-IN SERVER RUNNING (${protocol.toUpperCase()}) 🌸`);
  console.log(`📍 Mempelai: Shahnazia & Damarjati`);
  console.log('=============================================================');
  console.log(`Local Access:    ${protocol}://localhost:${PORT}`);
  ips.forEach((ip) => {
    console.log(`LAN Wi-Fi Access: ${protocol}://${ip}:${PORT}`);
  });
  console.log('=============================================================\n');
});

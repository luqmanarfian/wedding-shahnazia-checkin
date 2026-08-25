import selfsigned from 'selfsigned';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get local IPv4 addresses
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const ips = ['127.0.0.1', 'localhost'];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips;
}

const certDir = path.resolve(__dirname, '../cert');

if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

const ips = getLocalIpAddresses();
console.log('Generating SSL certificate for IPs/hostnames:', ips);

const attrs = [{ name: 'commonName', value: 'localhost' }];
const altNames = ips.map((ip) => {
  return ip.match(/^\d+\.\d+\.\d+\.\d+$/)
    ? { type: 7, ip: ip }
    : { type: 2, value: ip };
});

try {
  const pwaCerts = selfsigned.generate(attrs, {
    keySize: 2048,
    days: 365,
    algorithm: 'sha256',
    extensions: [
      {
        name: 'basicConstraints',
        cA: true,
      },
      {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true,
      },
      {
        name: 'subjectAltName',
        altNames: altNames,
      },
    ],
  });

  const keyPath = path.join(certDir, 'localhost-key.pem');
  const certPath = path.join(certDir, 'localhost.pem');

  fs.writeFileSync(keyPath, pwaCerts.private);
  fs.writeFileSync(certPath, pwaCerts.cert);

  console.log('✅ SSL Certificate generated successfully!');
  console.log('  Key: ', keyPath);
  console.log('  Cert:', certPath);
  console.log('\n📱 Local LAN access IPs:');
  ips.forEach((ip) => {
    if (ip !== '127.0.0.1' && ip !== 'localhost') {
      console.log(`  - https://${ip}:3000`);
    }
  });
} catch (error) {
  console.error('❌ Failed to generate SSL certificates:', error);
  process.exit(1);
}

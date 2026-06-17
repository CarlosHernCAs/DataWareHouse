const crypto = require('crypto');
const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url').replace(/=/g, '');
const header = encode({ alg: 'HS256', typ: 'JWT' });
const payload = encode({ sub: 'admin', role: 'admin', name: 'Test User', exp: Math.floor(Date.now() / 1000) + 8 * 3600 });
const secret = '3g9_vK8H2mR1zP5xW7yS4qB0tN6mL4jK9vU2rI1oX8w';
const signature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url').replace(/=/g, '');
console.log(`${header}.${payload}.${signature}`);

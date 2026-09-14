const http = require('http');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 1, name: 'admin', role: 'admin' }, 'lawfirm_secret');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/record-types',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Status', res.statusCode, 'Body:', data.substring(0, 100)));
});

req.on('error', console.error);
req.end();

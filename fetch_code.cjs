const http = require('http');
http.get('http://localhost:3000/src/components/ERP.tsx', (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => console.log(data.split('\n').filter((_, i) => i >= 4900 && i <= 4970).join('\n')));
}).on("error", console.error);

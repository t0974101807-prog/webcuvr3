const http = require('http');

http.get('http://localhost:3000/api/record-types', (res) => {
  let data = '';
  console.log('Status Code:', res.statusCode);
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Body:', data.substring(0, 200));
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});

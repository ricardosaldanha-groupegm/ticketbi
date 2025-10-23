const http = require('http');

const data = JSON.stringify({
  email: "teste3@exemplo.com",
  name: "Utilizador Teste 3",
  message: "Esta é uma mensagem de teste com acentos: ção, ão, é, í, ó, ú, á, à, â, ê, ô, õ"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/access-requests',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data, 'utf8')
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let responseData = '';
  res.setEncoding('utf8');
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data, 'utf8');
req.end();

const http = require('http');
http.get('http://localhost:3000/api/doctors/cmqp4un160000npepbzlb8qym/slots?date=2026-06-23', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => { console.log(data); });
}).on("error", (err) => { console.log("Error: " + err.message); });

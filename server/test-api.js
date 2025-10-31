const https = require('https');

const url = 'https://prompt-gallery-c0z.pages.dev/api/prompts?page=1&limit=30';

https.get(url, (res) => {
  let data = '';
  
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('\nResponse:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('\nRaw Response:', data);
    }
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});

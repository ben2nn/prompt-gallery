const https = require('https');

async function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

(async () => {
  for (let page = 1; page <= 4; page++) {
    const url = `https://nana.hrids.com/api/v1/gallery/prompts?limit=100&page=${page}`;
    console.log(`\n第 ${page} 页:`);
    const response = await fetchData(url);
    console.log('- 数据量:', response.data?.length || 0);
    console.log('- pagination:', JSON.stringify(response.pagination, null, 2));
    await new Promise(resolve => setTimeout(resolve, 500));
  }
})();

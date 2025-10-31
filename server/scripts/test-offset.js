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
  for (let offset = 0; offset < 400; offset += 100) {
    const url = `https://nana.hrids.com/api/v1/gallery/prompts?limit=100&offset=${offset}`;
    console.log(`\noffset=${offset}:`);
    const response = await fetchData(url);
    console.log('- 数据量:', response.data?.length || 0);
    console.log('- 第一条ID:', response.data?.[0]?.id);
    console.log('- 最后一条ID:', response.data?.[response.data.length - 1]?.id);
    console.log('- pagination:', JSON.stringify(response.pagination, null, 2));
    await new Promise(resolve => setTimeout(resolve, 500));
  }
})();

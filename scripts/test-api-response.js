const https = require('https');

// 测试多个可能的 API 地址
const urls = [
  'https://gallery.52nn.us/api/v1/prompts?limit=10&page=1',
  'https://nana.hrids.com/api/v1/gallery/prompts?limit=10&page=1'
];

async function testUrl(url) {
  return new Promise((resolve) => {
    console.log(`\n测试: ${url}`);
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('✓ 成功! 数据量:', json.data?.length || 0);
          console.log('总数:', json.pagination?.total || 0);
          if (json.data && json.data[0]) {
            console.log('示例数据结构:', Object.keys(json.data[0]));
          }
          resolve(json);
        } catch (e) {
          console.error('✗ 解析错误:', e.message);
          resolve(null);
        }
      });
    }).on('error', (e) => {
      console.error('✗ 请求错误:', e.message);
      resolve(null);
    });
  });
}

(async () => {
  for (const url of urls) {
    await testUrl(url);
  }
})();

const https = require('https');

// 测试 nana.hrids.com API 接口
const endpoints = [
  'https://nana.hrids.com/api/v1/gallery/tags',
  'https://nana.hrids.com/api/v1/gallery/prompts?limit=30&offset=0'
];

async function testEndpoint(url) {
  return new Promise((resolve, reject) => {
    console.log(`\n📡 测试接口: ${url}`);
    console.log('─'.repeat(80));
    
    https.get(url, (res) => {
      let data = '';
      
      console.log(`状态码: ${res.statusCode}`);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('✅ 响应成功\n');
          console.log(JSON.stringify(json, null, 2));
          
          // 显示数据统计
          if (Array.isArray(json)) {
            console.log(`\n📊 返回数组，共 ${json.length} 项`);
          } else if (json.data && Array.isArray(json.data)) {
            console.log(`\n📊 返回 ${json.data.length} 项数据`);
            if (json.total) console.log(`   总数: ${json.total}`);
          } else if (json.tags) {
            console.log(`\n📊 标签数量: ${json.tags.length}`);
          } else if (json.prompts) {
            console.log(`\n📊 提示词数量: ${json.prompts.length}`);
          }
          
          resolve(json);
        } catch (e) {
          console.log('❌ JSON 解析失败');
          console.log('原始响应:', data.substring(0, 500));
          reject(e);
        }
      });
    }).on('error', (err) => {
      console.error(`❌ 请求失败: ${err.message}`);
      reject(err);
    });
  });
}

async function main() {
  console.log('🧪 开始测试 nana.hrids.com API 接口\n');
  
  for (const endpoint of endpoints) {
    try {
      await testEndpoint(endpoint);
    } catch (error) {
      console.error(`接口测试失败: ${endpoint}`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ 测试完成');
}

main();

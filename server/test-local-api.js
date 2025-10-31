const http = require('http');

// 测试本地开发服务器
const url = 'http://localhost:8788/api/prompts?page=1&limit=10';

console.log('🧪 测试本地 API: ' + url + '\n');

http.get(url, (res) => {
  let data = '';
  
  console.log('状态码:', res.statusCode);
  console.log('响应头:', JSON.stringify(res.headers, null, 2));
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('\n✅ API 响应成功:');
      console.log(JSON.stringify(json, null, 2));
      
      if (json.data) {
        console.log(`\n📊 获取到 ${json.data.length} 个提示词`);
        console.log(`   总数: ${json.pagination?.total || 0}`);
        console.log(`   当前页: ${json.pagination?.page || 1}`);
      }
    } catch (e) {
      console.log('\n❌ 解析 JSON 失败:');
      console.log('原始响应:', data);
    }
  });
}).on('error', (err) => {
  console.error('❌ 请求失败:', err.message);
  console.log('\n💡 提示: 请先启动本地开发服务器:');
  console.log('   npm run dev');
});

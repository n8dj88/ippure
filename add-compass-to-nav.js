const fs = require('fs');
const path = 'E:/Desktop/扬弋戈/编程/GitHub/ippure/src/index.ts';

let content = fs.readFileSync(path, 'utf8');

// 替换所有 "IP检测" 为 "🧭 IP检测"
content = content.split('<li><a href="/">IP检测</a></li>').join('<li><a href="/">🧭 IP检测</a></li>');

fs.writeFileSync(path, content, 'utf8');
console.log('Compass icon added to IP检测 navigation item!');

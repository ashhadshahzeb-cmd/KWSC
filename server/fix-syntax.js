const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.js');
let content = fs.readFileSync(filePath, 'utf8');

// Fix END $; to END $$;
content = content.replace(/END \$;/g, 'END $$;');

// Remove duplicate phone columns in users CREATE TABLE
content = content.replace(/phone TEXT,\s*phone TEXT,/g, 'phone TEXT,');

fs.writeFileSync(filePath, content);
console.log('index.js syntax fixed!');

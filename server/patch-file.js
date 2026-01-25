const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add phone to users table definition
if (!content.includes('emp_no TEXT,\n                phone TEXT,')) {
    content = content.replace('emp_no TEXT,', 'emp_no TEXT,\n                phone TEXT,');
}

// 2. Add users migration
if (!content.includes("ALTER TABLE users ADD COLUMN phone TEXT")) {
    const migrationBlockEnd = "            END $$;";
    const insertion = `
                -- users additions
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='phone') THEN
                    ALTER TABLE users ADD COLUMN phone TEXT;
                END IF;`;
    content = content.replace(migrationBlockEnd, insertion + "\n" + migrationBlockEnd);
}

fs.writeFileSync(filePath, content);
console.log('File patched successfully!');

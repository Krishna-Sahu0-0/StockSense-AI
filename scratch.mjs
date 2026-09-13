import fs from 'fs';
import path from 'path';

const files = [
  'lib/inngest/functions.ts',
  'lib/inngest/prompts.ts',
  'lib/nodemailer/templates.ts',
  'README.md'
];

for (const file of files) {
  const filePath = path.resolve(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/Signalist/g, 'Arth');
    content = content.replace(/signalist/g, 'arth');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
}

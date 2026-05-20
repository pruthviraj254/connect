const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', 'resources', 'hugo-template');

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (name.endsWith('.html')) {
      let c = fs.readFileSync(p, 'utf8');
      let n = c.replace(/<motion\b/g, '<div');
      n = n.replace(/<\/motion>/g, '</' + 'div>');
      n = n.replace(/<div  +/g, '<div ');
      if (n !== c) {
        fs.writeFileSync(p, n);
        console.log('fixed', p);
      }
    }
  }
}

walk(root);

const fs = require('fs');
let c = fs.readFileSync('app/api/order/route.ts', 'utf8');
c = c.replace(/`\$\{customer\.email \|\| 'N\/A'\)/g, '${customer.email || \'N/A\'}');
fs.writeFileSync('app/api/order/route.ts', c);

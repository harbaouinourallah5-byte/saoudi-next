const fs = require('fs');

let c = fs.readFileSync('app/api/order/route.ts', 'utf8');

// 1. Update HTML email
c = c.replace(
  '<p><strong>Email:</strong> ${customer.email || \'N/A\'}</p>',
  '<p><strong>Email:</strong> ${customer.email || \'N/A\'}</p>\n                        <p><strong>WhatsApp:</strong> ${customer.whatsapp || \'N/A\'}</p>'
);

// 2. Update Telegram message
c = c.replace(
  '?? <b>Email:</b> ${customer.email || \'N/A\'}\\n',
  '?? <b>Email:</b> ${customer.email || \'N/A\'}\\n💬 <b>WhatsApp:</b> ${customer.whatsapp || \'N/A\'}\\n'
);

fs.writeFileSync('app/api/order/route.ts', c);
console.log("API order updated");

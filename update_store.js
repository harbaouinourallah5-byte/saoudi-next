const fs = require('fs');

let c = fs.readFileSync('app/StoreFront.tsx', 'utf8');

// 1. Add formWhatsapp state
c = c.replace(
  'const [formEmail, setFormEmail] = useState("");',
  'const [formEmail, setFormEmail] = useState("");\n  const [formWhatsapp, setFormWhatsapp] = useState("");'
);

// 2. Load whatsapp from localStorage
c = c.replace(
  'if (sEmail) setFormEmail(sEmail);',
  'if (sEmail) setFormEmail(sEmail);\n    const sWhatsapp = localStorage.getItem("saoudi_whatsapp");\n    if (sWhatsapp) setFormWhatsapp(sWhatsapp);'
);

// 3. Update validation (remove formEmail from obligatory fields)
c = c.replace(
  'if (!formName || !formPhone || !formEmail || !formWilaya || !formDelegation)',
  'if (!formName || !formPhone || !formWilaya || !formDelegation)'
);

// 4. Add whatsapp to API payload
c = c.replace(
  'email: formEmail,',
  'email: formEmail,\n              whatsapp: formWhatsapp,'
);

// 5. Save to localStorage
c = c.replace(
  'localStorage.setItem("saoudi_email", formEmail);',
  'localStorage.setItem("saoudi_email", formEmail);\n        localStorage.setItem("saoudi_whatsapp", formWhatsapp);'
);

// 6. Update HTML inputs
const oldEmailInput = '<input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="Email (Obligatoire)" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-md text-sm outline-none focus:border-gold" required />';
const newInputs = `<input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="Email (Optionnel)" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-md text-sm outline-none focus:border-gold" />
                      <input type="tel" value={formWhatsapp} onChange={e => setFormWhatsapp(e.target.value)} placeholder="Numéro WhatsApp (Optionnel)" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-md text-sm outline-none focus:border-gold" />`;
c = c.replace(oldEmailInput, newInputs);

fs.writeFileSync('app/StoreFront.tsx', c);
console.log("StoreFront updated");

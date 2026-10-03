const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

function saveBase64Image(base64Str) {
    if (!base64Str || !base64Str.startsWith('data:image')) return base64Str;
    const matches = base64Str.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches) return base64Str;
    let ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    if (ext.includes('+')) ext = ext.split('+')[0];
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');
    const filename = crypto.randomBytes(16).toString('hex') + '.' + ext;
    const uploadsDir = path.join(process.cwd(), 'public', 'assets', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    fs.writeFileSync(path.join(uploadsDir, filename), buffer);
    return '/assets/uploads/' + filename;
}

async function run() {
    console.log('Connecting to DB...');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('saoudi_store');
    const products = await db.collection('products').find({}).toArray();
    
    let updated = 0;
    for (const p of products) {
        let changed = false;
        if (p.img && p.img.startsWith('data:image')) {
            p.img = saveBase64Image(p.img);
            changed = true;
        }
        if (p.boxes) {
            for (let b of p.boxes) {
                if (b.img && b.img.startsWith('data:image')) {
                    b.img = saveBase64Image(b.img);
                    changed = true;
                }
            }
        }
        if (changed) {
            await db.collection('products').updateOne({ _id: p._id }, { $set: { img: p.img, boxes: p.boxes } });
            updated++;
        }
    }
    console.log('Fixed ' + updated + ' products!');
    process.exit(0);
}
run().catch(console.error);

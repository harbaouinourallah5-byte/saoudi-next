const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function check() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('saoudi_store');
    const orders = await db.collection('orders').find({}).sort({ date: -1 }).limit(3).toArray();
    console.log("Recent orders:");
    orders.forEach(o => console.log(o._id, o.status, o.customer.name));
    process.exit(0);
}
check();

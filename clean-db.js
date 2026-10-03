require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function cleanDB() {
    console.log("Connecting to MongoDB...");
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db('saoudi_store');
        
        console.log("Deleting all products...");
        const result = await db.collection('products').deleteMany({});
        
        console.log(`Successfully deleted ${result.deletedCount} products.`);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.close();
        console.log("Done.");
    }
}

cleanDB();

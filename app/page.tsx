import StoreFront from './StoreFront';
import clientPromise from '@/lib/mongodb';

export const revalidate = 10;

export default async function Page() {
    let safeProducts = [];
    let safeBoxes = [];

    try {
        const client = await clientPromise;
        const db = client.db('saoudi_store');
        
        const products = await db.collection('products').find({}).toArray();
        const boxes = await db.collection('boxes').find({}).toArray();
        
        safeProducts = products.map(p => ({...p, _id: p._id.toString()}));
        safeBoxes = boxes.map(b => ({...b, _id: b._id.toString()}));
    } catch (e) {
        console.error("Failed to fetch initial data", e);
    }

    return <StoreFront initialProducts={safeProducts} initialBoxes={safeBoxes} />;
}

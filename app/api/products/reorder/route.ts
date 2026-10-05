import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { SECRET_TOKEN } from '../../login/route';
import { ObjectId } from 'mongodb';

export async function PATCH(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${SECRET_TOKEN}`) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const client = await clientPromise;
        const db = client.db('saoudi_store');
        
        const { products } = await request.json(); // Array of { _id, position }
        
        // Update all products in a bulk operation
        const bulkOps = products.map((p: any) => ({
            updateOne: {
                filter: { _id: new ObjectId(p._id) },
                update: { $set: { position: p.position } }
            }
        }));

        if (bulkOps.length > 0) {
            await db.collection('products').bulkWrite(bulkOps);
        }
        
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

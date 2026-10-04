import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { SECRET_TOKEN } from '../login/route';

export const revalidate = 0; // Toujours frais

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${SECRET_TOKEN}`) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }
        const client = await clientPromise;
        const db = client.db('saoudi_store');
        
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        const query = {
            $and: [
                { status: { $ne: 'rejetée' } },
                {
                    $or: [
                        { status: { $ne: 'confirmée' } },
                        { status: 'confirmée', statusUpdatedAt: { $gt: oneHourAgo } }
                    ]
                }
            ]
        };

        const orders = await db.collection('orders').find(query).sort({ date: -1 }).toArray();
        return NextResponse.json({ orders });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { SECRET_TOKEN } from '../../login/route';
import { ObjectId } from 'mongodb';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${SECRET_TOKEN}`) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const body = await request.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json({ error: 'Statut manquant' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('saoudi_store');
        
        await db.collection('orders').updateOne(
            { _id: new ObjectId(params.id) },
            { $set: { status: status, statusUpdatedAt: new Date() } }
        );

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

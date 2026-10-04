import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { SECRET_TOKEN } from '../../login/route';
import { ObjectId } from 'mongodb';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
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
        
        // Stock decrement logic
        if (status === 'confirmée') {
            const order = await db.collection('orders').findOne({ _id: new ObjectId(id) });
            if (order && order.status !== 'confirmée') {
                for (let item of order.cart) {
                    if (item.color) {
                        await db.collection('products').updateOne(
                            { title: item.title, "colors.name": item.color },
                            { $inc: { "colors.$.quantity": -item.qty } }
                        );
                    } else {
                        // We could decrease a global quantity if we had one.
                    }
                }
            }
        }

        await db.collection('orders').updateOne(
            { _id: new ObjectId(id) },
            { $set: { status: status, statusUpdatedAt: new Date() } }
        );

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${SECRET_TOKEN}`) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const client = await clientPromise;
        const db = client.db('saoudi_store');
        
        await db.collection('orders').deleteOne({ _id: new ObjectId(id) });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

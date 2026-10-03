import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { SECRET_TOKEN } from '../../../login/route';

export async function PATCH(request: Request, props: { params: Promise<{ title: string }> }) {
    const params = await props.params;
    try {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${SECRET_TOKEN}`) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const body = await request.json();
        const client = await clientPromise;
        const db = client.db('saoudi_store');
        
        await db.collection('products').updateOne(
            { title: params.title }, 
            { $set: { inStock: body.inStock } }
        );
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

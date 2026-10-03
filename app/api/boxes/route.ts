import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const revalidate = 10;

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db('saoudi_store');
        const boxes = await db.collection('boxes').find({}).toArray();
        return NextResponse.json(boxes);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

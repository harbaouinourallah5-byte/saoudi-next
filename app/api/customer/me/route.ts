import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('saoudi_customer_token')?.value;

        if (!token) {
            return NextResponse.json({ user: null });
        }

        const payload = verifyToken(token);
        if (!payload || !payload.id) {
            return NextResponse.json({ user: null });
        }

        const client = await clientPromise;
        const db = client.db('saoudi_store');
        
        const customer = await db.collection('customers').findOne({ _id: new ObjectId(payload.id as string) });
        if (!customer) {
            return NextResponse.json({ user: null });
        }

        return NextResponse.json({ 
            user: { 
                id: customer._id, 
                name: customer.name, 
                email: customer.email, 
                phone: customer.phone, 
                address: customer.address 
            } 
        });
    } catch (e: any) {
        return NextResponse.json({ user: null });
    }
}

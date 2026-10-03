import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { hashPassword, generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { name, email, phone, address, password } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Nom, email et mot de passe requis' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('saoudi_store');
        
        // Check if user already exists
        const existing = await db.collection('customers').findOne({ email: email.toLowerCase() });
        if (existing) {
            return NextResponse.json({ error: 'Un compte avec cet email existe déjà.' }, { status: 400 });
        }

        const { salt, hash } = hashPassword(password);
        
        const customer = {
            name,
            email: email.toLowerCase(),
            phone: phone || '',
            address: address || '',
            salt,
            hash,
            createdAt: new Date()
        };

        const result = await db.collection('customers').insertOne(customer);
        
        // Generate token and set cookie
        const token = generateToken({ id: result.insertedId, email: customer.email, name: customer.name });
        
        const cookieStore = await cookies();
        cookieStore.set('saoudi_customer_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return NextResponse.json({ success: true, user: { id: result.insertedId, name, email, phone, address } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyPassword, generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('saoudi_store');
        
        const customer = await db.collection('customers').findOne({ email: email.toLowerCase() });
        if (!customer) {
            return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 400 });
        }

        const isValid = verifyPassword(password, customer.salt, customer.hash);
        if (!isValid) {
            return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 400 });
        }
        
        // Generate token and set cookie
        const token = generateToken({ id: customer._id, email: customer.email, name: customer.name });
        
        const cookieStore = await cookies();
        cookieStore.set('saoudi_customer_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return NextResponse.json({ 
            success: true, 
            user: { 
                id: customer._id, 
                name: customer.name, 
                email: customer.email, 
                phone: customer.phone, 
                address: customer.address 
            } 
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

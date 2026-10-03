import { NextResponse } from 'next/server';

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'saoudi2026';
export const SECRET_TOKEN = 'saoudi_secure_token_9988'; // Shared token for simplicity

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;
        
        if (username === ADMIN_USER && password === ADMIN_PASS) {
            return NextResponse.json({ success: true, token: SECRET_TOKEN });
        } else {
            return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 });
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

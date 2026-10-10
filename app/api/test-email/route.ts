import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;
        
        if (!user || !pass) {
            const emailKeys = Object.keys(process.env).filter(k => k.toLowerCase().includes('email') || k.toLowerCase().includes('pass') || k.toLowerCase().includes('user'));
            return NextResponse.json({ 
                error: "Variables d'environnement manquantes.",
                foundKeys: emailKeys,
                userExists: !!user,
                passExists: !!pass
            });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass }
        });

        await transporter.verify();
        
        await transporter.sendMail({
            from: user,
            to: user,
            subject: 'TEST SAOUDI STORE',
            text: 'Si tu reçois ça, le système email fonctionne parfaitement !'
        });

        return NextResponse.json({ success: true, message: "Email envoyé avec succès !" });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message || e.toString() });
    }
}

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customer, cart, total, shipping } = body;

        // 1. Sauvegarde dans la base de données (Sécurité absolue pour ne perdre aucune commande)
        try {
            const client = await clientPromise;
            const db = client.db('saoudi_store');
            await db.collection('orders').insertOne({
                customer,
                cart,
                total,
                shipping,
                status: 'nouvelle',
                date: new Date()
            });
        } catch (dbError) {
            console.error("Erreur DB:", dbError);
        }

        // 2. Configuration du transporteur d'email (SMTP)
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Utilise Gmail par défaut.
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Formatage des articles du panier pour l'email
        const cartItemsHtml = cart.map((item: any) => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                    <strong>${item.title}</strong><br/>
                    ${item.color ? `Couleur: ${item.color}<br/>` : ''}
                    Emballage: ${item.box}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.qty}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${item.price} DT</td>
            </tr>
        `).join('');

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'saoudiaccessoire@gmail.com', // Reçoit toutes les commandes ici
            subject: `🚀 Nouvelle Commande - ${customer.name}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #D4AF37; padding: 20px; text-align: center; color: white;">
                        <h2 style="margin: 0; letter-spacing: 2px;">NOUVELLE COMMANDE</h2>
                    </div>
                    
                    <div style="padding: 20px;">
                        <h3 style="border-bottom: 2px solid #D4AF37; padding-bottom: 5px; color: #D4AF37;">Informations Client</h3>
                        <p><strong>Nom:</strong> ${customer.name}</p>
                        <p><strong>Téléphone:</strong> <a href="tel:${customer.phone}" style="color: #333; text-decoration: none;">${customer.phone}</a></p>
                        <p><strong>Email:</strong> ${customer.email || 'N/A'}</p>
                        <p><strong>Wilaya:</strong> ${customer.wilaya || 'N/A'}</p>
                        <p><strong>Délégation:</strong> ${customer.delegation || 'N/A'}</p>
                        <p><strong>Rue / Détails:</strong> ${customer.rue || customer.address}</p>
                        ${customer.notes ? `<p style="background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107;"><strong>Notes du client:</strong><br/>${customer.notes}</p>` : ''}

                        <h3 style="border-bottom: 2px solid #D4AF37; padding-bottom: 5px; color: #D4AF37; margin-top: 30px;">Détails de la Commande</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background-color: #f9f9f9;">
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Article</th>
                                    <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qté</th>
                                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Prix</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${cartItemsHtml}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Frais de livraison:</td>
                                    <td style="padding: 10px; text-align: right; font-weight: bold;">8.5 DT</td>
                                </tr>
                                <tr style="background-color: #f9f9f9;">
                                    <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; font-size: 16px;">TOTAL:</td>
                                    <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 16px; color: #D4AF37;">${total} DT</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    
                    <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                        <p>Connectez-vous à votre interface d'administration pour gérer cette commande si nécessaire.</p>
                        <p>&copy; Saoudi Accessoires</p>
                    </div>
                </div>
            `,
        };

        // Envoi de l'email
        try {
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error("Erreur email (non critique car DB ok):", emailError);
            // On continue car la commande est bien dans la base de données !
        }

        // 3. Envoi de la notification Telegram
        try {
            const TELEGRAM_TOKEN = "8962323796:AAEcdOg4bp0sj1t0aqUUz39NT9ciiitVhG8";
            const TELEGRAM_CHAT_ID = "8900403575";

            const cartText = cart.map((item: any) => 
                `- ${item.qty}x ${item.title} (${item.price} DT)\n  Couleur: ${item.color || 'N/A'} | Box: ${item.box}`
            ).join('\n');

            const telegramMessage = `🛍️ <b>NOUVELLE COMMANDE !</b>\n\n👤 <b>Client:</b> ${customer.name}\n📞 <b>Tél:</b> ${customer.phone}\n?? <b>Email:</b> ${customer.email || 'N/A'}\n📍 <b>Adresse:</b> ${customer.wilaya}, ${customer.delegation}\n🏠 <b>Rue:</b> ${customer.rue || customer.address || 'N/A'}${customer.notes ? `\n📝 <b>Notes:</b> ${customer.notes}` : ''}\n\n🛒 <b>Panier:</b>\n${cartText}\n\n🚚 <b>Livraison:</b> 8.5 DT\n💰 <b>TOTAL: ${total} DT</b>`;

            await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: telegramMessage,
                    parse_mode: 'HTML',
                }),
            });
        } catch (telegramError) {
            console.error("Erreur Telegram:", telegramError);
        }

        return NextResponse.json({ success: true, message: 'Commande envoyée avec succès' });
    } catch (error: any) {
        console.error("Erreur serveur:", error);
        return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
    }
}




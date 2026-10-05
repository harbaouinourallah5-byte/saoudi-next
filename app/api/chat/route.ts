import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
    try {
        const { messages } = await request.json();

        // 1. Fetch current products to give the AI context
        const client = await clientPromise;
        const db = client.db('saoudi_store');
        const products = await db.collection('products').find({}).toArray();

        // 2. Build the product context string
        const catalogContext = products.map(p => {
            let info = `- ${p.title} (${p.price} DT)`;
            if (p.inStock === false) info += ' [RUPTURE DE STOCK]';
            if (p.colors && p.colors.length > 0) {
                info += ` | Couleurs: ${p.colors.map((c:any) => c.name).join(', ')}`;
            }
            if (p.allowBoxes !== false && p.boxes && p.boxes.length > 0) {
                info += ` | Emballages: ${p.boxes.map((b:any) => b.name).join(', ')}`;
            }
            return info;
        }).join('\n');

        // 3. Define the AI's personality and rules
        const systemPrompt = `Tu es l'assistant virtuel officiel de "Saoudi Accessoires", une boutique tunisienne de bijoux et montres.
Ton rôle est d'aider les clients poliment, de répondre à leurs questions sur les produits, et de les encourager à acheter.
La livraison coûte 8.5 DT et se fait partout en Tunisie (paiement à la livraison).

Voici notre catalogue actuel (NE PAS INVENTER D'AUTRES PRODUITS) :
${catalogContext}

Instructions importantes :
- Réponds toujours dans la langue du client (Arabe tunisien, Français, ou Anglais).
- Sois très court et direct (max 2-3 phrases).
- Ne propose pas de produits qui sont "en rupture de stock".
- Si le client veut commander, explique-lui qu'il suffit d'ajouter le produit au panier et de cliquer sur "Confirmer la commande".
- Le site ne gère que les commandes locales (Tunisie).`;

        // 4. Format messages for Gemini API
        const formattedMessages = messages.map((m: any) => ({
            role: m.role === 'ai' ? 'model' : 'user',
            parts: [{ text: m.text }]
        }));

        // 5. Call Gemini API
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: { text: systemPrompt }
                },
                contents: formattedMessages,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 250,
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini API Error:", data);
            return NextResponse.json({ error: "Erreur de l'API AI" }, { status: 500 });
        }

        const reply = data.candidates[0].content.parts[0].text;

        return NextResponse.json({ reply });

    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

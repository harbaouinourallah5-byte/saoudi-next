import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
    try {
        const { messages } = await request.json();

        // 1. Fetch current products to give AI real-time context
        let catalogContext = "";
        try {
            const client = await clientPromise;
            const db = client.db('saoudi_store');
            const products = await db.collection('products').find({}).toArray();

            catalogContext = products.map(p => {
                let info = `- ${p.title} (${p.price} DT)`;
                if (p.inStock === false) info += ' [RUPTURE DE STOCK / Oufa]';
                if (p.colors && p.colors.length > 0) {
                    info += ` | Couleurs: ${p.colors.map((c: any) => c.name).join(', ')}`;
                }
                if (p.allowBoxes !== false && p.boxes && p.boxes.length > 0) {
                    info += ` | Emballages: ${p.boxes.map((b: any) => b.name).join(', ')}`;
                }
                return info;
            }).join('\n');
        } catch (dbErr) {
            console.error("DB context error in chat:", dbErr);
        }

        // 2. Define the AI system prompt
        const systemPrompt = `Tu es l'assistant virtuel officiel et chaleureux de la boutique de luxe "Saoudi Accessoires" (تونس - Tunisie).
Boutique spécialisée dans les montres, bijoux, colliers, bracelets et coffrets cadeaux de haute qualité.

INFOS BOUTIQUE :
- Livraison : 8.5 DT partout en Tunisie (ou Gratuite selon offre/roulette).
- Paiement : Paiement à la livraison (كاش عند الاستلام).
- Délai : 24h à 48h ouvrables.
- Code Promo Spécial Influenceur : "saoudi_raslen" (permet de faire tourner la roulette pour gagner 10%, 15% ou la livraison gratuite).

CATALOGUE ACTUEL (NE PAS INVENTER D'AUTRES PRODUITS) :
${catalogContext || "Catalogue disponible sur le site."}

RÈGLES DE LANGUES & COMMUNICATION (TRÈS IMPORTANT) :
Tu dois parfaitement comprendre et répondre dans les 3 langues suivantes, selon la langue que le client utilise :

1. ARABE TUNISIEN (DERJA & FRANCO-ARABE / LANGAGE FACEBOOK AVEC CHIFFRES) :
   - Si le client écrit en lettres arabes (ex: "عسلامة، عندكم منقالة رجالي؟") ou en Franco-Arabe avec chiffres (ex: "asslema, 3andkom montres lil rjel?", "b9adeh hethi?", "fama livraison l sousse?", "nhb nchri cadeau"), réponds-lui NATURELLEMENT en tunisien chaleureux (en lettres arabes ou en caractères latins tunisiens comme il a écrit).
   - Exemples de réponses : "Mar7ba bik! Ay 3anna...", "Tfadhal 5ouya/o5ti...", "Livraison l kol blassa fi tounes b 8.5 DT w paiement 3and el tsallom".

2. FRANÇAIS :
   - Si le client parle en français, réponds en français poli, élégant et chaleureux.

3. ANGLAIS :
   - Si le client parle en anglais, réponds en anglais courtois et professionnel.

CONSIGNES :
- Sois court, direct et efficace (2 à 3 phrases maximum par message).
- Utilise des emojis adaptés (💎, ⌚, ✨, 🚚, 😊).
- Si un produit est en rupture de stock ("RUPTURE DE STOCK"), dis-lui gentiment qu'il n'est plus disponible pour l'instant et propose-lui une alternative.
- Pour commander, dis au client d'ajouter le produit au panier et de cliquer sur "Confirmer la commande".
- Ne fais JAMAIS de brouillon ni de réflexions à haute voix. Réponds directement au client.`;

        // 3. Format messages for Gemini API
        const formattedMessages = (messages || []).map((m: any) => ({
            role: m.role === 'ai' ? 'model' : 'user',
            parts: [{ text: m.text }]
        }));

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        // Models to try in priority order
        const modelsToTry = ['gemini-3.8-flash', 'gemini-3.5-flash-lite'];
        let reply = '';
        let lastError = null;

        for (const model of modelsToTry) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        system_instruction: {
                            parts: { text: systemPrompt }
                        },
                        contents: formattedMessages,
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 600,
                        }
                    })
                });

                const data = await response.json();

                if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    reply = data.candidates[0].content.parts[0].text;
                    break; // Success!
                } else {
                    lastError = data;
                    console.warn(`Model ${model} failed, trying next...`, data);
                }
            } catch (err) {
                lastError = err;
            }
        }

        if (!reply) {
            console.error("All Gemini models failed:", lastError);
            return NextResponse.json({ 
                error: "Désolé, l'assistant est momentanément indisponible.", 
                details: lastError 
            }, { status: 500 });
        }

        return NextResponse.json({ reply });

    } catch (error: any) {
        console.error("Chat API fatal error:", error);
        return NextResponse.json({ error: "Erreur serveur", details: error.message }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { messages, clientProducts } = body;

        // 1. Fetch current products to give AI real-time context
        let products: any[] = [];
        try {
            const client = await clientPromise;
            const db = client.db('saoudi_store');
            products = await db.collection('products').find({}).toArray();
        } catch (dbErr) {
            console.error("DB context error in chat:", dbErr);
        }

        // Dual fallback: If DB didn't return products, use products sent by client
        if ((!products || products.length === 0) && Array.isArray(clientProducts) && clientProducts.length > 0) {
            products = clientProducts;
        }

        // Build catalog context for AI prompt
        const catalogContext = (products || []).map(p => {
            let info = `- ${p.title} (${p.price} DT)`;
            if (p.inStock === false) info += ' [RUPTURE DE STOCK / Oufa]';
            if (p.category) info += ` [Catégorie: ${p.category}]`;
            if (p.gender) info += ` [Genre: ${p.gender}]`;
            if (p.colors && p.colors.length > 0) {
                info += ` | Couleurs: ${p.colors.map((c: any) => c.name).join(', ')}`;
            }
            return info;
        }).join('\n');

        // 2. Define the AI system prompt
        const systemPrompt = `Tu es "Assistant Saoudi", le conseiller virtuel officiel et chaleureux de la boutique de luxe "Saoudi Accessoires" (تونس - Tunisie).
Boutique de référence spécialisée dans les montres, bijoux, colliers, bracelets, bagues et coffrets cadeaux de haute qualité.

INFOS BOUTIQUE :
- Livraison : 8.5 DT partout en Tunisie (ou Gratuite selon offre/roulette).
- Paiement : Paiement sécurisé à la livraison en espèces (خلاص عند الاستلام).
- Délai : 24h à 48h ouvrables.
- Code Promo Spécial Influenceur : "saoudi_raslen" (permet de faire tourner la roulette pour gagner 10%, 15% ou la livraison gratuite).
- WhatsApp : +216 55 211 908

CATALOGUE DISPONIBLE (NE JAMAIS INVENTER DE PRODUITS EN DEHORS DE CE CATALOGUE) :
${catalogContext || "Catalogue disponible sur le site."}

RÈGLES DE LANGUES STRICTES (TRÈS IMPORTANT) :
Tu dois impérativement t'adapter à la langue utilisée par le client :
1. ARABE TUNISIEN (DERJA ou FRANCO-ARABE / LANGAGE FACEBOOK AVEC CHIFFRES 3, 5, 7, 9) :
   - Exemples de questions client : "asslema 3andkom montres lil rjel?", "b9adeh hethi?", "fama livraison l sousse?", "nhb nchri cadeau l sa7ebti", "عسلامة فما توصيل؟".
   - Si le client t'écrit en tunisien ou franco-arabe, RÉPONDS-LUI OBLIGATOIREMENT EN TUNISIEN (Derja naturelle, polie et accueillante). Ne lui réponds SURTOUT PAS en français s'il te parle en tunisien !
   - Exemples de tournures : "Mar7ba bik! Ay 3anna...", "Tfadhal 5ouya/o5ti...", "Livraison l kol blassa fi tounes b 8.5 DT w khlas 3and el tsallom", "Hedha a7san choix...", etc.
2. FRANÇAIS :
   - Si le client parle français, réponds en français élégant, courtois et dynamique.
3. ANGLAIS :
   - Si le client parle anglais, réponds en anglais professionnel et chaleureux.

RÈGLE D'AFFICHAGE DES PRODUITS & PHOTOS (CRUCIAL) :
Chaque fois que tu recommandes, suggères ou mentionnes un ou des produits du catalogue (jusqu'à 3 produits maximum les plus pertinents) :
1. Présente-les clairement dans ton texte (nom et prix).
2. À la TOUTE FIN de ton message, ajoute TOUJOURS la balise au format exact suivant :
[SUGGEST_PRODUCTS: Titre Exact 1, Titre Exact 2]
(avec les titres exacts tels qu'écrits dans le CATALOGUE ci-dessus).
Exemple :
"Mar7ba bik! 3anna Montre rolex b 62 DT w zeda Montre + braclet rolex b 89 DT ✨
[SUGGEST_PRODUCTS: Montre rolex, Montre + braclet rolex]"

CONSIGNES GÉNÉRALES :
- Sois court, direct et vendeur (2 à 4 phrases maximum par message).
- Utilise des emojis adaptés (💎, ⌚, ✨, 🚚, 🎁, 😊).
- Si un produit est en rupture de stock ("RUPTURE DE STOCK"), dis-lui gentiment qu'il n'est plus disponible pour l'instant et propose-lui une alternative disponible.
- Encourage le client à cliquer sur le produit ou l'ajouter au panier pour finaliser sa commande.
- Ne fais JAMAIS de brouillon ni de réflexions à haute voix. Réponds directement au client.`;

        // 3. Format messages for Gemini API with strict turn alternation
        // Remove initial AI welcome message if it's the very first message
        const rawHistory = Array.isArray(messages) ? messages : [];
        let startIndex = 0;
        while (startIndex < rawHistory.length && rawHistory[startIndex]?.role === 'ai') {
            startIndex++;
        }

        const filteredHistory = rawHistory.slice(startIndex);
        const formattedMessages: { role: string; parts: { text: string }[] }[] = [];

        for (const m of filteredHistory) {
            const role = m.role === 'ai' ? 'model' : 'user';
            const text = (m.text || '').trim();
            if (!text) continue;

            if (formattedMessages.length > 0 && formattedMessages[formattedMessages.length - 1].role === role) {
                // Combine consecutive messages of same role
                formattedMessages[formattedMessages.length - 1].parts[0].text += `\n${text}`;
            } else {
                formattedMessages.push({
                    role,
                    parts: [{ text }]
                });
            }
        }

        // If no user messages remain, use a fallback greeting
        if (formattedMessages.length === 0) {
            formattedMessages.push({
                role: 'user',
                parts: [{ text: 'Bonjour' }]
            });
        }

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        // Models to try in priority order (fastest & most stable first)
        const modelsToTry = [
            'gemini-3.5-flash-lite',
            'gemini-3.5-flash',
            'gemini-flash-lite-latest',
            'gemini-3.1-flash-lite',
            'gemini-3.8-flash'
        ];

        let rawReply = '';
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

                if (response.ok && data.candidates?.[0]?.content?.parts) {
                    const parts = data.candidates[0].content.parts;
                    const combinedText = parts
                        .filter((p: any) => typeof p.text === 'string')
                        .map((p: any) => p.text)
                        .join('\n')
                        .trim();

                    if (combinedText) {
                        rawReply = combinedText;
                        break; // Success!
                    }
                } else {
                    lastError = data;
                    console.warn(`Model ${model} failed, trying next fallback...`, data?.error?.message || data);
                }
            } catch (err: any) {
                lastError = err?.message || err;
            }
        }

        // 4. Smart Fallback Responder if AI models are down / quota exhausted
        if (!rawReply) {
            console.warn("All Gemini models failed, activating smart local fallback. Last error:", lastError);
            const lastUserMsg = formattedMessages[formattedMessages.length - 1]?.parts?.[0]?.text?.toLowerCase() || '';

            if (lastUserMsg.includes('montre') || lastUserMsg.includes('sa3a') || lastUserMsg.includes('ساعة') || lastUserMsg.includes('منقالة')) {
                rawReply = `Mar7ba bik! 👋 3anna collection mezyana barcha mte3 montres de luxe lel rjel w nsa. Chouf hedhom par exemple:\n[SUGGEST_PRODUCTS: Montre rolex, Montre + braclet rolex]`;
            } else if (lastUserMsg.includes('cadeau') || lastUserMsg.includes('kado') || lastUserMsg.includes('هدية')) {
                rawReply = `Mar7ba bik! 🎁 Ken t7eb cadeau ycharref w mezyen barcha, hedhom a7san des packs w bijoux 3anna:\n[SUGGEST_PRODUCTS: 🦢 Collier Femme Cygne avec Pendentif Rose, Pack swam, Montres Couple – Duo Homme & Femme]`;
            } else if (lastUserMsg.includes('livraison') || lastUserMsg.includes('frais') || lastUserMsg.includes('توصيل') || lastUserMsg.includes('transport')) {
                rawReply = `Livraison l kol blassa fi tounes b 8.5 DT barka 🚚 (wela gratuite ken terba7 fil roulette b code 'saoudi_raslen')! Délai bin 24h w 48h w el khlas 3and el tsallom 😊`;
            } else {
                rawReply = `Mar7ba bik fi Saoudi Accessoires ! ✨💎 Kifech najmou n3awnouk lyoum ? Chouf hedhom men a7san el montoujet 3anna, wela contactina 3al WhatsApp +216 55 211 908 !\n[SUGGEST_PRODUCTS: Montre + braclet rolex, Pack swam]`;
            }
        }

        // 5. Parse and Extract Product Suggestions & Photos
        const tagMatches = Array.from(rawReply.matchAll(/\[SUGGEST_PRODUCTS?:\s*([^\]]+)\]/gi));
        const suggestedTitlesFromTag: string[] = [];
        
        for (const match of tagMatches) {
            if (match[1]) {
                const titles = match[1].split(',').map(t => t.trim().replace(/^["']|["']$/g, ''));
                suggestedTitlesFromTag.push(...titles);
            }
        }

        // Strip the [SUGGEST_PRODUCTS: ...] tags so the user gets clean text
        const cleanReply = rawReply.replace(/\[SUGGEST_PRODUCTS?:\s*[^\]]+\]/gi, '').trim();

        // Match against database products (both from tags and directly mentioned in text)
        const matchedProductsMap = new Map<string, any>();

        // 5a. Match from tags
        for (const titleQuery of suggestedTitlesFromTag) {
            const cleanQuery = titleQuery.toLowerCase().trim();
            if (!cleanQuery) continue;

            const found = (products || []).find(p => {
                const pTitle = (p.title || '').toLowerCase().trim();
                return pTitle === cleanQuery || pTitle.includes(cleanQuery) || cleanQuery.includes(pTitle);
            });

            if (found && !matchedProductsMap.has(String(found._id))) {
                matchedProductsMap.set(String(found._id), found);
            }
        }

        // 5b. Match from text mentions if fewer than 3 products found
        if (matchedProductsMap.size < 3) {
            for (const p of products || []) {
                if (matchedProductsMap.size >= 3) break;
                const pTitle = (p.title || '').toLowerCase().trim();
                // Check if title is mentioned in text (only for meaningful titles > 4 chars)
                if (pTitle.length >= 4 && cleanReply.toLowerCase().includes(pTitle)) {
                    if (!matchedProductsMap.has(String(p._id))) {
                        matchedProductsMap.set(String(p._id), p);
                    }
                }
            }
        }

        // Format final matched products array with image resolution
        const finalProducts = Array.from(matchedProductsMap.values()).slice(0, 3).map(p => {
            const resolvedImg = p.img || (p.colors && p.colors[0] && (p.colors[0].image || p.colors[0].img)) || (p.gallery && p.gallery[0]) || '';
            return {
                _id: String(p._id),
                title: p.title,
                price: p.price,
                img: resolvedImg,
                inStock: p.inStock !== false,
                category: p.category || '',
                gender: p.gender || 'mixte'
            };
        });

        return NextResponse.json({
            reply: cleanReply,
            products: finalProducts
        });

    } catch (error: any) {
        console.error("Chat API fatal error:", error);
        return NextResponse.json({ 
            reply: "عسلامة! مرحبا بك في Saoudi Accessoires ✨ تنجم تتواصل معنا مباشرة على الواتساب 55211908 216+ ولا تختار منتوجاتك من الموقع !",
            products: []
        });
    }
}

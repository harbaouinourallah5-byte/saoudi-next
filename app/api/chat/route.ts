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
        const systemPrompt = `Tu es "Assistant Saoudi", le conseiller virtuel officiel et chaleureux de la boutique de luxe "Saoudi Accessoires" (Tunisie 🇹🇳).
Spécialiste des montres de haute qualité, parures, colliers, bracelets, bagues et coffrets cadeaux en Tunisie.

INFOS BOUTIQUE (À RETENIR PARFAITEMENT) :
- Livraison : 8.5 DT pour toute la Tunisie (لباب الدار) en 24h à 48h ouvrables.
- Paiement : Paiement sécurisé à la livraison en espèces (خلاص كاش يد بيد وقت الاستلام).
- Code Promo Roulette : "saoudi_raslen" (permet de faire tourner la roulette pour gagner 10%, 15% ou la livraison gratuite).
- WhatsApp : +216 55 211 908

CATALOGUE RÉEL DU SITE (NE JAMAIS INVENTER D'AUTRES PRODUITS) :
${catalogContext || "Catalogue disponible sur le site."}

RÈGLES LINGUISTIQUES STRICTES - MAÎTRISE ABSOLUE DU TUNISIEN :
Tu dois parler exactement comme un commerçant tunisien accueillant, poli et commerçant ("baye3 tounsi weld bled") :

1. SI LE CLIENT PARLE EN FRANCO-ARABE / ARABIZI (lettres latines avec chiffres 3, 5, 7, 9) :
   - Écris UNIQUEMENT en alphabet latin avec les chiffres standards tunisiens (N'UTILISE JAMAIS de lettres arabes mélangées avec des lettres latines !).
   - Vocabulaire tunisien authentique :
     * Accueil : "3aslema w mar7ba bik ya ghali(a) fi Saoudi Accessoires! 💎✨", "Ey n3am 3anna...", "Tfadhal 3la 3iniya..."
     * Produits & Qualité : "sal3a lux w khedma ndhifa barcha", "soum tayara", "chba3a w elegance", "to7fa yasser mezyena", "kado ycharref".
     * Livraison : "Livraison l kol blassa fi tounes b 8.5 DT barka (lbab eddar) w touslek fi 24h l 48h. El 5las ki touslek el commande cash mel yed lil yed 🚚"
     * Code promo : "Matnsach zeda tsta3mel el code 'saoudi_raslen' fil panier bch tdawwer el roulette w terba7 remise 10% wela 15% wela livraison blech! ✨"
     * Appel à l'action : "Anzel 3al produit bch tchouf el tsawer w el les couleurs w t3adi commande mte3ek 😊"

2. SI LE CLIENT PARLE EN ARABE (caractères arabes, ex: "عسلامة عندكم سوايع رجالي؟" ou "بقداش التوصيل؟") :
   - Réponds en PUR ARABE TUNISIEN (Derja tunisienne en lettres arabes) :
     * "عسلامة وبك مرحبا في Saoudi Accessoires! 💎✨"
     * "أي نعم عندنا تشكيلة مزيانة برشا وسلعة لوكس ونظيفة..."
     * "التوصيل لباب الدار لكل بلاصة في تونس بـ 8.5 د برك في 24 إلى 48 ساعة، والخلاص يد بيد كاش وقت الاستلام 🚚"
     * "تنجم تستعمل كود 'saoudi_raslen' في السلة باش تدور الروليت وتربح تخفيض 10% ولا 15% ولا توصيل بلاش ✨"
     * "انزل على 'عرض التفاصيل' باش تشوف التصاور والألوان وتعدي كوموندك بسهولة 😊"

3. SI LE CLIENT PARLE EN FRANÇAIS : Réponds en français élégant et accueillant.
4. SI LE CLIENT PARLE EN ANGLAIS : Réponds en anglais professionnel et courtois.

RÈGLE D'AFFICHAGE DES PRODUITS & PHOTOS (CRUCIAL) :
Chaque fois que tu recommandes, suggères ou mentionnes un ou des produits du catalogue (jusqu'à 3 produits maximum les plus pertinents) :
1. Présente-les clairement dans ton texte (nom et prix).
2. À la TOUTE FIN de ton message, ajoute TOUJOURS la balise au format exact suivant :
[SUGGEST_PRODUCTS: Titre Exact 1, Titre Exact 2]
(avec les titres exacts tels qu'écrits dans le CATALOGUE ci-dessus).

CONSIGNES GÉNÉRALES :
- Reste dynamique et vendeur : 2 à 4 phrases courtes suffisent par réponse.
- Utilise des emojis adaptés (💎, ⌚, ✨, 🚚, 🎁, 😊).
- Ne fais aucun brouillon. Réponds directement au client.`;

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
            const lastUserMsg = formattedMessages[formattedMessages.length - 1]?.parts?.[0]?.text || '';
            const lowerMsg = lastUserMsg.toLowerCase();
            const isArabicScript = /[\u0600-\u06FF]/.test(lastUserMsg);

            if (isArabicScript) {
                if (lowerMsg.includes('ساعة') || lowerMsg.includes('سوايع') || lowerMsg.includes('منقالة')) {
                    rawReply = `عسلامة وبك مرحبا! ⌚ عندنا تشكيلة مزيانة برشا وسلعة لوكس للرجال والنساء. شوف هاذم مثلاً:\n[SUGGEST_PRODUCTS: Montre rolex, Montre + braclet rolex]`;
                } else if (lowerMsg.includes('كادو') || lowerMsg.includes('هدية')) {
                    rawReply = `عسلامة وبك مرحبا! 🎁 كادو يشرّف ومزيان برشا تلقاه عندنا، شوف هاذم من أحسن الاختيارات:\n[SUGGEST_PRODUCTS: 🦢 Collier Femme Cygne avec Pendentif Rose, Pack swam, Montres Couple – Duo Homme & Femme]`;
                } else if (lowerMsg.includes('توصيل') || lowerMsg.includes('بقداش') || lowerMsg.includes('شحن')) {
                    rawReply = `التوصيل لباب الدار لكل بلاصة في تونس بـ 8.5 د برك 🚚 (وتقدر تربح توصيل مجاني بكود 'saoudi_raslen' في السلة)! Délai من 24 لـ 48 ساعة والخلاص يد بيد وقت الاستلام 😊`;
                } else {
                    rawReply = `عسلامة وبك مرحبا في Saoudi Accessoires! ✨💎 كيفاش نجم نعاونك اليوم؟ شوف أحسن المنتوجات المقترحة لوطا ولا كلمنا على الواتساب 55211908 216+ !\n[SUGGEST_PRODUCTS: Montre + braclet rolex, Pack swam]`;
                }
            } else {
                if (lowerMsg.includes('montre') || lowerMsg.includes('sa3a') || lowerMsg.includes('mongala')) {
                    rawReply = `3aslema w mar7ba bik! ⌚ 3anna sal3a lux w mezyena barcha lel rjel w nsa. Chouf hedhom par exemple:\n[SUGGEST_PRODUCTS: Montre rolex, Montre + braclet rolex]`;
                } else if (lowerMsg.includes('cadeau') || lowerMsg.includes('kado')) {
                    rawReply = `3aslema w mar7ba bik! 🎁 Ken t7eb kado ycharref w to7fa, hedhom a7san des packs w bijoux 3anna:\n[SUGGEST_PRODUCTS: 🦢 Collier Femme Cygne avec Pendentif Rose, Pack swam, Montres Couple – Duo Homme & Femme]`;
                } else if (lowerMsg.includes('livraison') || lowerMsg.includes('frais') || lowerMsg.includes('transport') || lowerMsg.includes('b9adeh')) {
                    rawReply = `Livraison l kol blassa fi tounes b 8.5 DT barka (lbab eddar) 🚚 w touslek fi 24h l 48h. El 5las cash ki touslek el commande! W matnsach code 'saoudi_raslen' fil panier bch terba7 remise wela livraison blech ✨`;
                } else {
                    rawReply = `3aslema w mar7ba bik fi Saoudi Accessoires! ✨💎 Kifech najmou n3awnouk lyoum ? Chouf hedhom men a7san el montoujet 3anna, wela contactina 3al WhatsApp +216 55 211 908 !\n[SUGGEST_PRODUCTS: Montre + braclet rolex, Pack swam]`;
                }
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

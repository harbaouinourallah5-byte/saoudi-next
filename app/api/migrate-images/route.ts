import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { uploadToCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (key !== 'saoudi_super_secret_2026') {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    try {
        const client = await clientPromise;
        const db = client.db('saoudi_store');
        const products = await db.collection('products').find({}).toArray();

        let updatedProducts = 0;
        let imagesUploaded = 0;

        for (const p of products) {
            let changed = false;

            // 1. Main image
            if (p.img && p.img.startsWith('data:image')) {
                const url = await uploadToCloudinary(p.img);
                if (url && url.startsWith('http')) {
                    p.img = url;
                    changed = true;
                    imagesUploaded++;
                }
            }

            // 2. Boxes
            if (p.boxes && Array.isArray(p.boxes)) {
                for (let b of p.boxes) {
                    if (b.img && b.img.startsWith('data:image')) {
                        const url = await uploadToCloudinary(b.img);
                        if (url && url.startsWith('http')) {
                            b.img = url;
                            changed = true;
                            imagesUploaded++;
                        }
                    }
                }
            }

            // 3. Colors
            if (p.colors && Array.isArray(p.colors)) {
                for (let c of p.colors) {
                    const imgField = c.image || c.img;
                    if (imgField && imgField.startsWith('data:image')) {
                        const url = await uploadToCloudinary(imgField);
                        if (url && url.startsWith('http')) {
                            if (c.image) c.image = url;
                            if (c.img) c.img = url;
                            changed = true;
                            imagesUploaded++;
                        }
                    }
                }
            }

            // 4. Gallery
            if (p.gallery && Array.isArray(p.gallery)) {
                for (let i = 0; i < p.gallery.length; i++) {
                    if (p.gallery[i] && p.gallery[i].startsWith('data:image')) {
                        const url = await uploadToCloudinary(p.gallery[i]);
                        if (url && url.startsWith('http')) {
                            p.gallery[i] = url;
                            changed = true;
                            imagesUploaded++;
                        }
                    }
                }
            }

            if (changed) {
                await db.collection('products').updateOne(
                    { _id: p._id },
                    { 
                        $set: { 
                            img: p.img, 
                            boxes: p.boxes, 
                            colors: p.colors, 
                            gallery: p.gallery 
                        } 
                    }
                );
                updatedProducts++;
            }
        }

        return NextResponse.json({
            success: true,
            totalProducts: products.length,
            updatedProducts,
            imagesUploaded
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

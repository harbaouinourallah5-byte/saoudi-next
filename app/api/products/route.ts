import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { SECRET_TOKEN } from '../login/route';
import { uploadToCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db('saoudi_store');
        
        const products = await db.collection('products').find({}).sort({ position: 1, _id: -1 }).toArray();
        return NextResponse.json(products, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${SECRET_TOKEN}`) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const client = await clientPromise;
        const db = client.db('saoudi_store');
        
        const product = await request.json();
        
        product.inStock = product.inStock !== false;
        product.freeShipping = product.freeShipping === true;
        product.allowBoxes = product.allowBoxes !== false;
        
        // Upload images to Cloudinary (removes base64 overhead)
        if (product.img && product.img.startsWith('data:image')) {
            product.img = await uploadToCloudinary(product.img);
        }
        
        if (product.boxes && Array.isArray(product.boxes)) {
            for (let box of product.boxes) {
                if (box.img && box.img.startsWith('data:image')) {
                    box.img = await uploadToCloudinary(box.img);
                }
            }
        }
        
        if (product.gallery && Array.isArray(product.gallery)) {
            for (let i = 0; i < product.gallery.length; i++) {
                if (product.gallery[i] && product.gallery[i].startsWith('data:image')) {
                    product.gallery[i] = await uploadToCloudinary(product.gallery[i]);
                }
            }
        }
        
        if (product.colors && Array.isArray(product.colors)) {
            for (let c of product.colors) {
                if (c.image && c.image.startsWith('data:image')) {
                    c.image = await uploadToCloudinary(c.image);
                }
                c.quantity = Number(c.quantity) || 0;
            }
        }

        if (product.combinations && typeof product.combinations === 'object') {
            for (const key in product.combinations) {
                if (product.combinations[key] && product.combinations[key].startsWith('data:image')) {
                    product.combinations[key] = await uploadToCloudinary(product.combinations[key]);
                }
            }
        }

        await db.collection('products').insertOne(product);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

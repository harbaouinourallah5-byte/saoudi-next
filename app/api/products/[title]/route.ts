import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { SECRET_TOKEN } from '../../login/route';

export async function DELETE(request: Request, props: { params: Promise<{ title: string }> }) {
    const params = await props.params;
    try {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${SECRET_TOKEN}`) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const client = await clientPromise;
        const db = client.db('saoudi_store');
        
        await db.collection('products').deleteOne({ title: params.title });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function saveBase64Image(base64Str: string): string {
    if (!base64Str || !base64Str.startsWith('data:image')) {
        return base64Str;
    }
    try {
        const matches = base64Str.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) return base64Str;
        let ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        if (ext.includes('+')) ext = ext.split('+')[0];
        const data = matches[2];
        const buffer = Buffer.from(data, 'base64');
        const filename = `${crypto.randomBytes(16).toString('hex')}.${ext}`;
        const uploadsDir = path.join(process.cwd(), 'public', 'assets', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, buffer);
        return `/assets/uploads/${filename}`;
    } catch (err) {
        console.error('Erreur save image', err);
        return base64Str;
    }
}

export async function PUT(request: Request, props: { params: Promise<{ title: string }> }) {
    const params = await props.params;
    try {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${SECRET_TOKEN}`) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const client = await clientPromise;
        const db = client.db('saoudi_store');
        
        const product = await request.json();
        
        // Ensure booleans
        product.inStock = product.inStock !== false;
        product.freeShipping = product.freeShipping === true;
        product.allowBoxes = product.allowBoxes !== false;

        // Note: Process base64 images if they were modified
        if (product.img && product.img.startsWith('data:image')) {
            product.img = saveBase64Image(product.img);
        }
        
        if (product.boxes && Array.isArray(product.boxes)) {
            for (let box of product.boxes) {
                if (box.img && box.img.startsWith('data:image')) {
                    box.img = saveBase64Image(box.img);
                }
            }
        }
        
        if (product.gallery && Array.isArray(product.gallery)) {
            for (let i = 0; i < product.gallery.length; i++) {
                if (product.gallery[i] && product.gallery[i].startsWith('data:image')) {
                    product.gallery[i] = saveBase64Image(product.gallery[i]);
                }
            }
        }
        
        if (product.colors && Array.isArray(product.colors)) {
            for (let c of product.colors) {
                if (c.image && c.image.startsWith('data:image')) {
                    c.image = saveBase64Image(c.image);
                }
                c.quantity = Number(c.quantity) || 0;
            }
        }

        if (product.combinations && typeof product.combinations === 'object') {
            for (const key in product.combinations) {
                if (product.combinations[key] && product.combinations[key].startsWith('data:image')) {
                    product.combinations[key] = saveBase64Image(product.combinations[key]);
                }
            }
        }

        // Remove _id from payload if it exists so we don't try to override immutable _id
        const { _id, ...updateData } = product;

        await db.collection('products').updateOne(
            { title: params.title },
            { $set: updateData }
        );
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
